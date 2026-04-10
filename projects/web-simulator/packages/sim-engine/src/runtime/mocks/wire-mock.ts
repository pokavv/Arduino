/**
 * Wire (I2C) 객체 목 (JS 코드 문자열 반환)
 * 시뮬레이션 런타임 내부의 AsyncFunction에서 eval됨
 */
export function wireMock(): string {
  return `
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
`;
}
