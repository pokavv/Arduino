import type { GpioController } from './gpio.js';
import type { SimScheduler } from './scheduler.js';
import type { WorkerToMain } from '../types.js';
import { getBoardConfig } from '../boards.js';
import { dhtMock } from './mocks/dht-mock.js';
import { lcdMock } from './mocks/lcd-mock.js';
import { oledMock } from './mocks/oled-mock.js';
import { servoMock } from './mocks/servo-mock.js';
import { neopixelMock } from './mocks/neopixel-mock.js';
import { wireMock } from './mocks/wire-mock.js';

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

  const coreSection = `
// ─── Arduino Runtime Preamble ────────────────────────────
// ─── _ctx 별칭 ────────────────────────────────────────────────
const _gpioToComp = _ctx._gpioToComp ?? new Map();
const _i2cDevices = _ctx._i2cDevices ?? new Map();
const _serialInputBuffer = _ctx._serialInputBuffer ?? [];

const __ledcPinMap = {};
const __LED_BUILTIN = ${board.ledBuiltin};
const __ADC_MAX = ${adcMax};

// ─── 아날로그 핀 별칭 (보드별) ──────────────────────────────────
${board.id.startsWith('esp32') ? `
// ESP32: GPIO 번호 그대로 사용
const A0 = 0; const A1 = 1; const A2 = 2; const A3 = 3;
const A4 = 4; const A5 = 5; const A6 = 6; const A7 = 7;
` : `
// Arduino Uno/Nano: A0=14, A1=15, ..., A7=21
const A0 = 14; const A1 = 15; const A2 = 16; const A3 = 17;
const A4 = 18; const A5 = 19; const A6 = 20; const A7 = 21;
`}

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

// ─── Serial 확장 ────────────────────────────────────────────
function __serial_readString() {
  const buf = _serialInputBuffer.splice(0);
  return buf.map(c => String.fromCharCode(c)).join('');
}
function __serial_readStringUntil(term) {
  const code = typeof term === 'string' ? term.charCodeAt(0) : term;
  const idx = _serialInputBuffer.indexOf(code);
  if (idx === -1) return '';
  return _serialInputBuffer.splice(0, idx + 1).slice(0, -1).map(c => String.fromCharCode(c)).join('');
}
function __serial_parseInt() { return parseInt(__serial_readString(), 10) || 0; }
function __serial_parseFloat() { return parseFloat(__serial_readString()) || 0; }
function __serial_peek() { return _serialInputBuffer[0] ?? -1; }
function __serial_flush() {}

// ─── Interrupt 스텁 ─────────────────────────────────────────
const _interruptHandlers = {};
function attachInterrupt(pin, fn, mode) {
  _interruptHandlers[pin] = { fn, mode };
}
function detachInterrupt(pin) { delete _interruptHandlers[pin]; }
function digitalPinToInterrupt(pin) { return pin; }

// ─── PROGMEM / F() 매크로 (no-op) ───────────────────────────
function F(s) { return s; }
function PSTR(s) { return s; }
function pgm_read_byte(p) { return typeof p === 'number' ? p : 0; }
function pgm_read_word(p) { return typeof p === 'number' ? p : 0; }
const PROGMEM = '';

// ─── 비트 연산 추가 상수 ──────────────────────────────────────
const LSBFIRST = 0;
const MSBFIRST = 1;
const CHANGE = 1;
const FALLING = 2;
const RISING = 3;
`;

  return `${coreSection}
${dhtMock()}
${lcdMock()}
${oledMock()}
${servoMock()}
${neopixelMock()}
${wireMock()}
// ─────────────────────────────────────────────────────────
`;
}
