/**
 * 핀 연결값과 GPIO 번호를 비교합니다.
 * 'G9', 'D9', 9 모두 gpioNum=9와 매칭됩니다.
 */
export function pinMatch(connValue: string | number, gpioNum: number): boolean {
  if (connValue === gpioNum) return true;
  if (typeof connValue === 'string') {
    const n = parseInt(connValue.replace(/^[A-Za-z]+/, ''), 10);
    if (!isNaN(n) && n === gpioNum) return true;
  }
  return false;
}
