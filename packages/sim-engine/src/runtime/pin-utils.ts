/**
 * 핀 관련 유틸리티 함수 모음
 * gpio.ts에서 분리 — 엔진 내 여러 모듈이 공유할 수 있도록 독립 파일로 유지
 */

/**
 * 핀 이름/번호를 숫자로 정규화
 * 'G9' → 9, 'D9' → 9, 'A0' → 0, 9 → 9
 * 파싱 실패 시 -1 반환
 */
export function normalizePin(pin: string | number): number {
  if (typeof pin === 'number') return pin;
  const n = parseInt(pin.replace(/^[A-Za-z]+/, ''), 10);
  return isNaN(n) ? -1 : n;
}

/**
 * Arduino Uno 아날로그 핀 이름 → GPIO 번호 매핑
 * A0~A5는 디지털 핀 14~19에 해당
 */
const UNO_ANALOG_PIN_MAP: Record<string, number> = {
  A0: 14, A1: 15, A2: 16, A3: 17, A4: 18, A5: 19,
};

/**
 * 보드별 핀 이름을 GPIO 번호로 변환
 * - ESP32-C3 'G' 접두사: 'G4' → 4
 * - Arduino Uno/Nano 아날로그 핀: 'A0' → 14
 * - 'D' 접두사 디지털: 'D9' → 9
 * - 숫자 문자열: '9' → 9
 * 매핑 불가 시 null 반환
 *
 * @param pinName 핀 이름 (예: 'G4', 'A0', 'D9', '9')
 * @param boardId 보드 식별자 (예: 'arduino-uno', 'esp32-c3-supermini')
 */
export function resolveBoardPin(pinName: string, boardId?: string): number | null {
  // Arduino 계열 보드의 아날로그 핀 이름 처리 (A0~A5)
  if (/^A\d+$/.test(pinName)) {
    if (!boardId || boardId.startsWith('arduino')) {
      const mapped = UNO_ANALOG_PIN_MAP[pinName];
      return mapped !== undefined ? mapped : null;
    }
  }

  // 접두사(G, D, 등) 제거 후 숫자 파싱
  const n = parseInt(pinName.replace(/^[A-Za-z]+/, ''), 10);
  return isNaN(n) ? null : n;
}
