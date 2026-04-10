/**
 * Servo 라이브러리 목 (JS 코드 문자열 반환)
 * 시뮬레이션 런타임 내부의 AsyncFunction에서 eval됨
 */
export function servoMock(): string {
  return `
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
`;
}
