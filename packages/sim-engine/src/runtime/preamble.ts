import type { GpioController } from './gpio.js';
import type { SimScheduler } from './scheduler.js';
import type { WorkerToMain } from '../types.js';

type PostFn = (msg: WorkerToMain) => void;

/**
 * Arduino API 바인딩 — JavaScript 전역으로 주입되는 런타임 함수들
 */
export function buildPreamble(
  gpio: GpioController,
  scheduler: SimScheduler,
  postFn: PostFn,
  boardType: string
): string {
  return `
// ─── Arduino Runtime Preamble ────────────────────────────
const __ledcPinMap = {};
const __LED_BUILTIN = ${boardType.includes('esp32c3') ? 8 : 13};

function __pinMode(pin, mode) { gpio.pinMode(+pin, mode); }
function __digitalWrite(pin, value) { gpio.digitalWrite(+pin, value); }
function __digitalRead(pin) { return gpio.digitalRead(+pin); }
function __analogRead(pin) { return gpio.analogRead(+pin); }
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
function __serial_available() { return 0; }
function __serial_read() { return -1; }
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
  postFn({ type: 'COMPONENT_UPDATE', id: '__buzzer_' + pin, pin: 'FREQ', value: freq });
  gpio.analogWrite(+pin, 1);
}
function __noTone(pin) { gpio.analogWrite(+pin, 0); }

async function __pulseIn(pin, value, timeout = 1000000) {
  const start = __micros();
  while (__digitalRead(pin) === value && __micros() - start < timeout) {
    await __delayUs(1);
  }
  const t1 = __micros();
  while (__digitalRead(pin) !== value && __micros() - t1 < timeout) {
    await __delayUs(1);
  }
  const t2 = __micros();
  while (__digitalRead(pin) === value && __micros() - t2 < timeout) {
    await __delayUs(1);
  }
  return __micros() - t2;
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

function __parseFloat(s) { return parseFloat(s); }
// ─────────────────────────────────────────────────────────
`;
}
