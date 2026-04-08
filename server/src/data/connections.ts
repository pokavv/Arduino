// ─────────────────────────────────────────────────────────────────────────────
// 핀 연결 유효성 규칙
// 어떤 핀 타입끼리 연결할 수 있는지 정의합니다.
// ─────────────────────────────────────────────────────────────────────────────

export interface ConnectionRule {
  from: string;
  to: string;
  valid: boolean;
  severity?: 'error' | 'warning' | 'info';
  message?: string;
}

export interface ConnectionCheckResult {
  valid: boolean;
  severity: 'ok' | 'error' | 'warning' | 'info';
  message: string;
}

/**
 * 핀 타입 연결 규칙 테이블
 * from/to 순서 무관하게 양방향 체크
 */
const RULES: ConnectionRule[] = [
  // ── 정상 연결 ──────────────────────────────────────────────
  { from: 'ground',   to: 'ground',   valid: true },
  { from: 'power',    to: 'power',    valid: true,  severity: 'warning', message: '전원선끼리 연결 — 전압이 같은지 확인하세요' },
  { from: 'digital',  to: 'digital',  valid: true },
  { from: 'digital',  to: 'signal',   valid: true },
  { from: 'digital',  to: 'input',    valid: true },
  { from: 'digital',  to: 'output',   valid: true },
  { from: 'digital',  to: 'pwm',      valid: true },
  { from: 'digital',  to: 'analog',   valid: true,  severity: 'warning', message: 'ADC 핀이 아닌 디지털 핀에 아날로그 연결 — analogRead() 불가' },
  { from: 'pwm',      to: 'pwm',      valid: true },
  { from: 'pwm',      to: 'signal',   valid: true },
  { from: 'pwm',      to: 'input',    valid: true },
  { from: 'analog',   to: 'analog',   valid: true },
  { from: 'analog',   to: 'signal',   valid: true },
  { from: 'i2c_sda',  to: 'i2c_sda',  valid: true },
  { from: 'i2c_scl',  to: 'i2c_scl',  valid: true },
  { from: 'spi_mosi', to: 'spi_mosi', valid: true },
  { from: 'spi_miso', to: 'spi_miso', valid: true },
  { from: 'spi_sck',  to: 'spi_sck',  valid: true },
  { from: 'spi_ss',   to: 'spi_ss',   valid: true },
  { from: 'uart_tx',  to: 'uart_rx',  valid: true },
  { from: 'uart_rx',  to: 'uart_tx',  valid: true },
  { from: 'signal',   to: 'signal',   valid: true },
  { from: 'input',    to: 'output',   valid: true },
  { from: 'output',   to: 'input',    valid: true },

  // ── 경고 연결 ──────────────────────────────────────────────
  { from: 'power',    to: 'digital',  valid: false, severity: 'error', message: '전원 핀을 GPIO에 직접 연결하면 핀 손상 위험' },
  { from: 'power',    to: 'analog',   valid: false, severity: 'error', message: '전원 핀을 ADC에 직접 연결하면 손상 위험' },
  { from: 'i2c_sda',  to: 'digital',  valid: true,  severity: 'warning', message: 'I2C SDA를 일반 GPIO에 연결 — I2C 통신 불가' },
  { from: 'i2c_scl',  to: 'digital',  valid: true,  severity: 'warning', message: 'I2C SCL을 일반 GPIO에 연결 — I2C 통신 불가' },
  { from: 'uart_tx',  to: 'digital',  valid: true,  severity: 'warning', message: 'UART TX를 일반 GPIO에 연결 — UART 통신 불가' },
  { from: 'uart_rx',  to: 'digital',  valid: true,  severity: 'warning', message: 'UART RX를 일반 GPIO에 연결 — UART 통신 불가' },

  // ── 위험/불가 연결 ─────────────────────────────────────────
  { from: 'power',    to: 'ground',   valid: false, severity: 'error', message: '⚡ 단락(Short Circuit)! 전원과 GND 직접 연결 금지' },
  { from: 'output',   to: 'output',   valid: false, severity: 'error', message: '출력 핀끼리 직접 연결 금지 — 충돌 전류 발생' },
];

/**
 * 두 핀 타입 간의 연결 유효성 검사
 */
export function checkConnection(fromType: string, toType: string): ConnectionCheckResult {
  // 정확히 일치하는 규칙 탐색 (양방향)
  const rule = RULES.find(
    r => (r.from === fromType && r.to === toType) ||
         (r.from === toType   && r.to === fromType)
  );

  if (!rule) {
    // 규칙에 없으면 기본 허용 (알 수 없는 타입 조합)
    return { valid: true, severity: 'info', message: `연결 규칙 없음 — 직접 확인 필요` };
  }

  if (!rule.valid) {
    return {
      valid: false,
      severity: rule.severity === 'error' ? 'error' : 'warning',
      message: rule.message ?? '연결 불가',
    };
  }

  if (rule.severity === 'warning') {
    return {
      valid: true,
      severity: 'warning',
      message: rule.message ?? '연결 가능 (경고)',
    };
  }

  return { valid: true, severity: 'ok', message: '유효한 연결' };
}
