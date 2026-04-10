// ─── 핀/와이어 색상 상수 ─────────────────────────────────────────────────────
// 핀 이름 패턴별 색상 매핑을 한 곳에서 관리합니다.
// pin-renderer.ts / wire-renderer.ts 에서 import해서 사용.

/**
 * 핀 원형(dot) 색상 규칙
 * 각 항목: [정규식 패턴, 색상 값]
 * pinFillColor()에서 순서대로 매칭합니다.
 */
export const PIN_DOT_COLORS: Array<[RegExp, string]> = [
  [/^VCC$|^ANODE$|^RED$|^V\+/i,          '#ff5555'], // 전원 (양극/빨강)
  [/^GND$/i,                               '#44dd88'], // 접지
  [/^SIGNAL$|^SIG$|^TRIG$|^PWM/i,        '#ffaa33'], // 신호/트리거/PWM
  [/^DATA$|^DIN$|^ECHO$|^SDA$|^SCL$/i,   '#5599ff'], // 데이터/I2C
  [/^WIPER$/i,                             '#cc77ff'], // 가변저항 와이퍼
  [/^COMMON$/i,                            '#dddddd'], // 공통(COM)
  [/^GREEN$/i,                             '#44ee77'], // RGB LED 초록
  [/^BLUE$/i,                              '#5599ff'], // RGB LED 파랑
  [/^PIN1/i,                               '#6688ff'], // 스텝 모터 코일1
  [/^PIN2/i,                               '#ffaa44'], // 스텝 모터 코일2
];

/** 핀 원형 기본 색상 (위 패턴에 매칭되지 않는 경우) */
export const PIN_DOT_DEFAULT = '#44aaff';

/**
 * 와이어 자동 색상 규칙 (fromPin 이름 기준)
 * 각 항목: [정규식 패턴, 색상 값]
 * wireColor()에서 순서대로 매칭합니다.
 */
export const WIRE_AUTO_COLORS: Array<[RegExp, string]> = [
  [/^GND/i,                '#666'], // 접지 — 회색
  [/^VCC$|^5V$|^VIN$/i,   '#e44'], // 5V/VCC — 빨강
  [/^3V3$|^3\.3/i,         '#f84'], // 3.3V — 주황
  [/^SDA$/i,               '#4f4'], // I2C SDA — 초록
  [/^SCL$/i,               '#4ff'], // I2C SCL — 청록
  [/^SIGNAL$|^PWM/i,       '#ff0'], // PWM/신호 — 노랑
  [/^WIPER$|^A\d/i,        '#a4f'], // 아날로그 — 보라
  [/MOSI/i,                '#f4f'], // SPI MOSI — 마젠타
  [/MISO/i,                '#f4a'], // SPI MISO — 분홍
  [/^SCK$|^SCLK/i,         '#ff8'], // SPI 클럭 — 연노랑
  [/^TX$/i,                '#fa8'], // UART TX — 살구
  [/^RX$/i,                '#f84'], // UART RX — 주황
  [/^DATA$|^DIN$/i,        '#8af'], // 데이터 — 하늘
];

/** 와이어 기본 색상 (위 패턴에 매칭되지 않는 경우) */
export const WIRE_AUTO_DEFAULT = '#4af';
