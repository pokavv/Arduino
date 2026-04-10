/**
 * LiquidCrystal_I2C 라이브러리 목 (JS 코드 문자열 반환)
 * 시뮬레이션 런타임 내부의 AsyncFunction에서 eval됨
 */
export function lcdMock(): string {
  return `
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
`;
}
