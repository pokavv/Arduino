/**
 * Adafruit_NeoPixel 라이브러리 목 (JS 코드 문자열 반환)
 * 시뮬레이션 런타임 내부의 AsyncFunction에서 eval됨
 */
export function neopixelMock(): string {
  return `
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
`;
}
