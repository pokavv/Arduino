/**
 * 지원 보드 설정 레지스트리
 * 새 보드 추가 시 이 파일만 수정하면 됩니다.
 */

export interface BoardConfig {
  id: string;
  adcBits: number;       // ADC 해상도 (arduino=10, esp32=12)
  ledBuiltin: number;    // LED_BUILTIN 핀 번호
  voltage: 3.3 | 5.0;   // 동작 전압
}

export const BOARD_CONFIGS: Record<string, BoardConfig> = {
  'arduino-uno':        { id: 'arduino-uno',        adcBits: 10, ledBuiltin: 13, voltage: 5.0 },
  'arduino-nano':       { id: 'arduino-nano',        adcBits: 10, ledBuiltin: 13, voltage: 5.0 },
  'esp32-c3-supermini': { id: 'esp32-c3-supermini',  adcBits: 12, ledBuiltin: 8,  voltage: 3.3 },
  'esp32-devkit':       { id: 'esp32-devkit',         adcBits: 12, ledBuiltin: 2,  voltage: 3.3 },
};

/** boardType 문자열로 설정 조회. 미등록 보드는 arduino-uno 기본값 반환 */
export function getBoardConfig(boardType: string): BoardConfig {
  return BOARD_CONFIGS[boardType] ?? BOARD_CONFIGS['arduino-uno'];
}
