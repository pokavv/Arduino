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
// ─── _ctx 별칭 ────────────────────────────────────────────────
const _gpioToComp = _ctx._gpioToComp ?? new Map();
const _i2cDevices = _ctx._i2cDevices ?? new Map();
const _serialInputBuffer = _ctx._serialInputBuffer ?? [];

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

// ─── Servo 목 ────────────────────────────────────────────────
class Servo {
  constructor() { this._pin = -1; this._id = null; this._angle = 90; }
  attach(pin) {
    this._pin = +pin;
    const c = _gpioToComp.get(+pin);
    this._id = c?.id ?? null;
  }
  write(angle) {
    this._angle = Math.max(0, Math.min(180, Math.round(+angle)));
    if (this._id) postFn({ type: 'COMPONENT_UPDATE', id: this._id, pin: 'SIGNAL', value: this._angle });
    gpio.analogWrite(this._pin, Math.round(this._angle * 255 / 180));
  }
  read() { return this._angle; }
  readMicroseconds() { return Math.round(this._angle * 2000 / 180) + 500; }
  writeMicroseconds(us) { this.write(Math.round((+us - 500) * 180 / 2000)); }
  attached() { return this._pin >= 0; }
  detach() { this._pin = -1; this._id = null; }
}

// ─── Adafruit_NeoPixel 목 ────────────────────────────────────
const NEO_GRB = 0x06, NEO_RGB = 0x00, NEO_KHZ800 = 0x0200;
class Adafruit_NeoPixel {
  constructor(count, pin, type) {
    this._count = +count || 8;
    this._pin = +pin;
    this._id = null;
    this._pixels = new Uint32Array(this._count);
    this._brightness = 255;
  }
  begin() {
    const c = _gpioToComp.get(this._pin);
    this._id = c?.id ?? null;
  }
  Color(r, g, b) { return ((+r & 0xFF) << 16) | ((+g & 0xFF) << 8) | (+b & 0xFF); }
  setPixelColor(n, r, g, b) {
    const color = (g === undefined) ? (+r >>> 0) : this.Color(r, g, b);
    if (n >= 0 && n < this._count) {
      this._pixels[n] = color;
      if (this._id) postFn({ type: 'COMPONENT_UPDATE', id: this._id, pin: \`LED\${n}\`, value: color });
    }
  }
  getPixelColor(n) { return this._pixels[n] ?? 0; }
  fill(color, first = 0, count = this._count) {
    const c = +color >>> 0;
    for (let i = +first; i < +first + +count && i < this._count; i++) this.setPixelColor(i, c);
  }
  clear() { this._pixels.fill(0); if (this._id) postFn({ type: 'COMPONENT_UPDATE', id: this._id, pin: 'CLEAR', value: 0 }); }
  show() { if (this._id) postFn({ type: 'COMPONENT_UPDATE', id: this._id, pin: 'SHOW', value: JSON.stringify(Array.from(this._pixels)) }); }
  setBrightness(b) { this._brightness = Math.max(0, Math.min(255, +b)); }
  numPixels() { return this._count; }
  sine8(x) { return Math.round(128 + 127 * Math.sin((+x) * Math.PI / 128)); }
  gamma8(x) { return Math.round(Math.pow(+x / 255, 2.8) * 255); }
  gamma32(c) { return c; }
}
// ─── Wire (I2C) ──────────────────────────────────────────────
const Wire = (() => {
  let _addr = 0;
  let _buf = [];
  return {
    begin(addr) { if (addr !== undefined) _addr = +addr; },
    beginTransmission(addr) { _addr = +addr; _buf = []; },
    write(val) {
      if (typeof val === 'string') { for (const c of val) _buf.push(c.charCodeAt(0)); }
      else { _buf.push(+val & 0xFF); }
      return 1;
    },
    endTransmission(stop) { _buf = []; return 0; },
    requestFrom(addr, qty) { return qty; },
    available() { return 0; },
    read() { return 0; },
    setClock(hz) {},
    onReceive(fn) {},
    onRequest(fn) {},
  };
})();
// ─────────────────────────────────────────────────────────
`;
}
