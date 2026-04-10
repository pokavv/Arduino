/**
 * Adafruit_SSD1306 (OLED) 라이브러리 목 (JS 코드 문자열 반환)
 * 시뮬레이션 런타임 내부의 AsyncFunction에서 eval됨
 */
export function oledMock(): string {
  return `
// ─── Adafruit_SSD1306 목 ────────────────────────────────────
const BLACK = 0, WHITE = 1, INVERSE = 2;
const SSD1306_SWITCHCAPVCC = 0x02;
const SSD1306_EXTERNALVCC  = 0x01;
class Adafruit_SSD1306 {
  constructor(w, h, wire, rst = -1) {
    this._w = w || 128; this._h = h || 64;
    this._id = null; this._textSize = 1;
    this._cx = 0; this._cy = 0;
  }
  begin(vccstateOrAddr = 0x3C, i2caddrOrReset = 0x3C, reset = true) {
    // Adafruit SSD1306 API: begin(vccstate, i2caddr, reset)
    // 첫 번째 인자가 I2C 주소 범위(0x3C/0x3D)이면 구버전 호출 방식
    const addr = (vccstateOrAddr === 0x3C || vccstateOrAddr === 0x3D)
      ? vccstateOrAddr
      : (i2caddrOrReset === 0x3C || i2caddrOrReset === 0x3D)
        ? i2caddrOrReset
        : 0x3C;
    const c = _i2cDevices?.get(addr);
    this._id = c?.id ?? null;
    return true;
  }
  clearDisplay() {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'CLEAR', value:0 });
  }
  display() {
    if (this._id) postFn({ type:'COMPONENT_UPDATE', id:this._id, pin:'DISPLAY', value:0 });
  }
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
`;
}
