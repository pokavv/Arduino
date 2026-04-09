import type { WorkerToMain } from '../types.js';

type PostFn = (msg: WorkerToMain) => void;

/**
 * GPIO 상태 관리 및 컴포넌트 핀 매핑
 */
export class GpioController {
  private _pinModes: Map<number, number> = new Map(); // 0=INPUT, 1=OUTPUT, 2=INPUT_PULLUP
  private _pinValues: Map<number, number> = new Map();
  private _analogValues: Map<number, number> = new Map(); // ADC 범위 (0-1023 or 0-4095)
  private _inputCallbacks: Map<number, () => number> = new Map();
  private _postMessage: PostFn;

  constructor(postFn: PostFn) {
    this._postMessage = postFn;
  }

  pinMode(pin: number, mode: number) {
    this._pinModes.set(pin, mode);
  }

  digitalWrite(pin: number, value: number) {
    this._pinValues.set(pin, value ? 1 : 0);
    this._postMessage({
      type: 'PIN_STATE',
      pin,
      value: value ? 1 : 0,
    });
  }

  digitalRead(pin: number): number {
    const cb = this._inputCallbacks.get(pin);
    if (cb) return cb();
    return this._pinValues.get(pin) ?? 0;
  }

  analogWrite(pin: number, value: number) {
    const clamped = Math.max(0, Math.min(255, value));
    this._pinValues.set(pin, clamped);
    this._postMessage({
      type: 'PIN_STATE',
      pin,
      value: clamped,
    });
  }

  analogRead(pin: number): number {
    const cb = this._inputCallbacks.get(pin);
    if (cb) return cb();
    return this._analogValues.get(pin) ?? 0;
  }

  /** 외부에서 ADC 값 설정 (센서 아날로그 입력용, ADC 범위 0-1023/0-4095) */
  setAnalogValue(pin: number, value: number) {
    this._analogValues.set(pin, value);
  }

  /** 외부에서 핀 상태 주입 (버튼, 센서 등) */
  injectPinValue(pin: number, value: number) {
    this._pinValues.set(pin, value);
  }

  /** 동적 입력 콜백 등록 */
  registerInputCallback(pin: number, cb: () => number) {
    this._inputCallbacks.set(pin, cb);
  }

  getPinValue(pin: number): number {
    return this._pinValues.get(pin) ?? 0;
  }

  /** 핀 번호 정규화 (G9 → 9, D9 → 9) */
  static normalizePin(pin: string | number): number {
    if (typeof pin === 'number') return pin;
    const n = parseInt(pin.replace(/^[A-Za-z]+/, ''), 10);
    return isNaN(n) ? -1 : n;
  }
}
