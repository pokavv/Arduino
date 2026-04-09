import type { GpioController } from './gpio.js';
import type { SimScheduler } from './scheduler.js';
import type { WorkerToMain } from '../types.js';
import { getBoardConfig } from '../boards.js';

type PostFn = (msg: WorkerToMain) => void;

/**
 * Arduino API 바인딩 — JavaScript 전역으로 주입되는 런타임 함수들
 */
export function buildPreamble(
  gpio: GpioController,
  scheduler: SimScheduler,
  postFn: PostFn,
  boardType: string,
  serialInputBuffer: number[]
): string {
  // 보드 레지스트리에서 ADC 분해능 및 LED_BUILTIN 핀 조회
  const board = getBoardConfig(boardType);
  const adcMax = (1 << board.adcBits) - 1; // 4095 or 1023

  return `
// ─── Arduino Runtime Preamble ────────────────────────────
const __ledcPinMap = {};
const __LED_BUILTIN = ${board.ledBuiltin};
const __ADC_MAX = ${adcMax};

function __pinMode(pin, mode) { gpio.pinMode(+pin, mode); }
function __digitalWrite(pin, value) { gpio.digitalWrite(+pin, value); }
function __digitalRead(pin) { return gpio.digitalRead(+pin); }
function __analogRead(pin) {
  return gpio.analogRead(+pin);
}
function __analogWrite(pin, value) { gpio.analogWrite(+pin, value); }

function __millis() { return scheduler.millis(); }
function __micros() { return scheduler.micros(); }
function __delay(ms) { return scheduler.delay(ms); }
function __delayUs(us) { return scheduler.delayUs(us); }

function __serial_begin() {}
function __serial_println(...args) {
  const text = args.map(a => String(a)).join('');
  postFn({ type: 'SERIAL_OUTPUT', text: text + '\\n' });
}
function __serial_print(...args) {
  const text = args.map(a => String(a)).join('');
  postFn({ type: 'SERIAL_OUTPUT', text });
}
function __serial_available() { return _serialInputBuffer.length; }
function __serial_read() {
  if (_serialInputBuffer.length === 0) return -1;
  return _serialInputBuffer.shift();
}
function __serial_write(v) {
  postFn({ type: 'SERIAL_OUTPUT', text: String.fromCharCode(v) });
}

function __map(x, inMin, inMax, outMin, outMax) {
  return Math.round((x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
}
function __constrain(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function __random(a, b) {
  if (b === undefined) return Math.floor(Math.random() * a);
  return Math.floor(Math.random() * (b - a)) + a;
}

function __tone(pin, freq) {
  const comp = _gpioToComp?.get(+pin);
  if (comp) {
    postFn({ type: 'COMPONENT_UPDATE', id: comp.id, pin: 'FREQ', value: freq });
    postFn({ type: 'COMPONENT_UPDATE', id: comp.id, pin: 'VCC', value: 1 });
  }
  gpio.analogWrite(+pin, 128);
}
function __noTone(pin) {
  const comp = _gpioToComp?.get(+pin);
  if (comp) {
    postFn({ type: 'COMPONENT_UPDATE', id: comp.id, pin: 'FREQ', value: 0 });
    postFn({ type: 'COMPONENT_UPDATE', id: comp.id, pin: 'VCC', value: 0 });
  }
  gpio.analogWrite(+pin, 0);
}

async function __pulseIn(pin, value, timeout = 1000000) {
  // 초음파 센서 ECHO 핀인 경우 직접 거리 기반 계산
  const comp = _gpioToComp?.get(+pin);
  if (comp?.type === 'ultrasonic') {
    const distCm = _ctx[\`__ultrasonic_dist_\${comp.id}\`] ?? 20;
    // 왕복 시간 (μs): t = 2d / 34300 * 1e6
    return Math.round((2 * distCm / 34300) * 1e6);
  }
  // 일반 핀: 실제 폴링
  const start = __micros();
  while (__digitalRead(pin) !== value && __micros() - start < timeout) await __delayUs(50);
  const t1 = __micros();
  while (__digitalRead(pin) === value && __micros() - t1 < timeout) await __delayUs(50);
  return __micros() - t1;
}

function __shiftOut(dataPin, clockPin, bitOrder, value) {
  for (let i = 0; i < 8; i++) {
    const bit = bitOrder === 0 ? (value >> i) & 1 : (value >> (7 - i)) & 1;
    gpio.digitalWrite(+dataPin, bit);
    gpio.digitalWrite(+clockPin, 1);
    gpio.digitalWrite(+clockPin, 0);
  }
}
function __shiftIn(dataPin, clockPin, bitOrder) {
  let val = 0;
  for (let i = 0; i < 8; i++) {
    gpio.digitalWrite(+clockPin, 1);
    const bit = gpio.digitalRead(+dataPin);
    if (bitOrder === 0) val |= bit << i; else val |= bit << (7 - i);
    gpio.digitalWrite(+clockPin, 0);
  }
  return val;
}

// ─── EEPROM 시뮬레이션 ──────────────────────────────────────
const EEPROM = (() => {
  const _store = new Uint8Array(4096);
  return {
    read(addr) { return _store[addr & 0xFFF] ?? 0; },
    write(addr, val) { _store[addr & 0xFFF] = (val >>> 0) & 0xFF; },
    update(addr, val) { _store[addr & 0xFFF] = (val >>> 0) & 0xFF; },
    get(addr, /* ref */) { return _store[addr & 0xFFF] ?? 0; },
    put(addr, val) { _store[addr & 0xFFF] = (val >>> 0) & 0xFF; },
    length: 4096,
  };
})();

// ─── Interrupt 스텁 ─────────────────────────────────────────
const _interruptHandlers = {};
function attachInterrupt(pin, fn, mode) {
  _interruptHandlers[pin] = { fn, mode };
}
function detachInterrupt(pin) { delete _interruptHandlers[pin]; }
function digitalPinToInterrupt(pin) { return pin; }

// ─── DHT 라이브러리 목 ──────────────────────────────────────
const DHT11 = 11, DHT22 = 22, DHT21 = 21;
class DHT {
  constructor(pin, type) {
    this._pin = +pin;
    this._type = type;
    const c = _gpioToComp?.get(this._pin);
    this._id = c?.id ?? null;
  }
  begin() {}
  read(force = false) { return true; }
  readTemperature(isFahrenheit = false, force = false) {
    const t = (_ctx[\`__dht_temp_\${this._id}\`] ?? 25.0);
    return isFahrenheit ? t * 9.0 / 5.0 + 32 : t;
  }
  readHumidity(force = false) {
    return (_ctx[\`__dht_hum_\${this._id}\`] ?? 60.0);
  }
  computeHeatIndex(temp, hum, isFahrenheit = false) {
    const t = isFahrenheit ? temp : temp * 9.0/5.0 + 32;
    const hi = -42.379 + 2.04901523*t + 10.14333127*hum
               -0.22475541*t*hum - 0.00683783*t*t - 0.05481717*hum*hum;
    return isFahrenheit ? hi : (hi - 32) * 5.0/9.0;
  }
  isnan(v) { return isNaN(v); }
}

// ─── LiquidCrystal_I2C 목 ───────────────────────────────────
class LiquidCrystal_I2C {
  constructor(addr, cols, rows) {
    this._addr = addr;
    this._cols = cols || 16;
    this._rows = rows || 2;
    const c = _i2cDevices?.get(addr);
    this._id = c?.id ?? null;
  }
  begin(cols, rows) {
    if (cols) this._cols = cols;
    if (rows) this._rows = rows;
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'INIT', value:\`\${this._cols}x\${this._rows}\` });
  }
  init() { this.begin(); }
  clear() {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'CLEAR', value:0 });
  }
  home() {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'CURSOR', value:'0,0' });
  }
  setCursor(col, row) {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'CURSOR', value:\`\${col},\${row}\` });
  }
  print(text) {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'PRINT', value:String(text) });
  }
  println(text) { this.print(String(text) + '\\n'); }
  backlight() {}
  noBacklight() {}
  display() {}
  noDisplay() {}
  cursor() {}
  noCursor() {}
  blink() {}
  noBlink() {}
  scrollDisplayLeft() {}
  scrollDisplayRight() {}
  autoscroll() {}
  noAutoscroll() {}
  createChar() {}
  leftToRight() {}
  rightToLeft() {}
}

// ─── Adafruit_SSD1306 목 ────────────────────────────────────
const BLACK = 0, WHITE = 1, INVERSE = 2;
class Adafruit_SSD1306 {
  constructor(w, h, wire, rst = -1) {
    this._w = w || 128; this._h = h || 64;
    this._id = null; this._textSize = 1;
    this._cx = 0; this._cy = 0;
  }
  begin(addr = 0x3C, reset = true) {
    const c = _i2cDevices?.get(addr);
    this._id = c?.id ?? null;
    return true;
  }
  clearDisplay() {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'CLEAR', value:0 });
  }
  display() {}
  setTextSize(s) { this._textSize = s || 1; }
  setTextColor(c) {}
  setCursor(x, y) {
    this._cx = x; this._cy = y;
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'CURSOR', value:\`\${x},\${y}\` });
  }
  print(text) {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'PRINT', value:String(text) });
  }
  println(text) { this.print(String(text)+'\\n'); }
  drawPixel(x, y, color) {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'PIXEL', value:\`\${x},\${y},\${color}\` });
  }
  fillRect(x, y, w, h, color) {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'FILLRECT', value:\`\${x},\${y},\${w},\${h},\${color}\` });
  }
  drawRect(x, y, w, h, color) { this.fillRect(x, y, w, h, color); }
  drawLine(x0, y0, x1, y1, color) {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'LINE', value:\`\${x0},\${y0},\${x1},\${y1},\${color}\` });
  }
  fillScreen(color) {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin: color ? 'FILL_WHITE':'CLEAR', value:0 });
  }
  width() { return this._w; }
  height() { return this._h; }
  drawCircle() {} fillCircle() {} drawTriangle() {} fillTriangle() {}
  setRotation() {} invertDisplay() {}
}
// ─────────────────────────────────────────────────────────
`;
}
