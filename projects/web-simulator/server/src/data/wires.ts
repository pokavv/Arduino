// ─────────────────────────────────────────────────────────────────────────────
// 전선 타입 정의 데이터베이스
// 핀 타입에 따라 전선 색상과 굵기를 자동 결정합니다.
// ─────────────────────────────────────────────────────────────────────────────

export interface WireDef {
  id: string;
  name: string;
  color: string;
  thickness: number;
  dashArray?: string;       // SVG stroke-dasharray (없으면 실선)
  description: string;
  /** 이 전선이 사용되는 핀 타입 목록 */
  pinTypes: string[];
  /** 이 전선이 사용되는 핀 이름 패턴 (정규식 문자열) */
  pinNamePatterns?: string[];
}

export const WIRE_TYPES: WireDef[] = [
  {
    id: 'wire-power-5v',
    name: '5V 전원선',
    color: '#e44',
    thickness: 2,
    description: '5V 전원 연결선. VCC, 5V 핀에 사용.',
    pinTypes: ['power'],
    pinNamePatterns: ['^VCC$', '^5V$', '^VIN$'],
  },
  {
    id: 'wire-power-3v3',
    name: '3.3V 전원선',
    color: '#f84',
    thickness: 2,
    description: '3.3V 전원 연결선.',
    pinTypes: [],
    pinNamePatterns: ['^3V3$', '^3\\.3V$'],
  },
  {
    id: 'wire-gnd',
    name: '접지선 (GND)',
    color: '#444',
    thickness: 2,
    description: '접지 연결선. GND 핀에 사용.',
    pinTypes: ['ground'],
    pinNamePatterns: ['^GND$', '^GND\\d*$'],
  },
  {
    id: 'wire-digital',
    name: '디지털 신호선',
    color: '#4af',
    thickness: 1.8,
    description: '일반 디지털 GPIO 신호선.',
    pinTypes: ['digital', 'signal', 'input', 'output'],
    pinNamePatterns: [],
  },
  {
    id: 'wire-pwm',
    name: 'PWM 신호선',
    color: '#ff0',
    thickness: 1.8,
    description: 'PWM 제어 신호선.',
    pinTypes: ['pwm'],
    pinNamePatterns: ['^SIGNAL$', 'PWM'],
  },
  {
    id: 'wire-analog',
    name: '아날로그 신호선',
    color: '#a44fff',
    thickness: 1.8,
    description: '아날로그/ADC 신호선.',
    pinTypes: ['analog'],
    pinNamePatterns: ['^WIPER$', '^A\\d+$'],
  },
  {
    id: 'wire-i2c-sda',
    name: 'I2C SDA',
    color: '#4f4',
    thickness: 1.8,
    description: 'I2C 데이터 선 (SDA).',
    pinTypes: ['i2c_sda'],
    pinNamePatterns: ['^SDA$', 'SDA'],
  },
  {
    id: 'wire-i2c-scl',
    name: 'I2C SCL',
    color: '#4ff',
    thickness: 1.8,
    description: 'I2C 클럭 선 (SCL).',
    pinTypes: ['i2c_scl'],
    pinNamePatterns: ['^SCL$', 'SCL'],
  },
  {
    id: 'wire-spi-mosi',
    name: 'SPI MOSI',
    color: '#f4f',
    thickness: 1.8,
    description: 'SPI 마스터→슬레이브 데이터선.',
    pinTypes: ['spi_mosi'],
    pinNamePatterns: ['MOSI'],
  },
  {
    id: 'wire-spi-miso',
    name: 'SPI MISO',
    color: '#f4a',
    thickness: 1.8,
    description: 'SPI 슬레이브→마스터 데이터선.',
    pinTypes: ['spi_miso'],
    pinNamePatterns: ['MISO'],
  },
  {
    id: 'wire-spi-sck',
    name: 'SPI SCK',
    color: '#ff8',
    thickness: 1.8,
    description: 'SPI 클럭선.',
    pinTypes: ['spi_sck'],
    pinNamePatterns: ['^SCK$', 'SCLK'],
  },
  {
    id: 'wire-uart',
    name: 'UART',
    color: '#fa8',
    thickness: 1.8,
    description: 'UART 통신선 (TX/RX).',
    pinTypes: ['uart_tx', 'uart_rx'],
    pinNamePatterns: ['^TX$', '^RX$'],
  },
  {
    id: 'wire-data',
    name: '데이터선',
    color: '#8af',
    thickness: 1.8,
    description: '일반 데이터 신호선.',
    pinTypes: [],
    pinNamePatterns: ['^DATA$', '^DIN$', '^DOUT$'],
  },
];

/**
 * 핀 이름과 핀 타입으로 적절한 전선 타입 자동 결정
 */
export function resolveWireType(pinName: string, pinType?: string): WireDef {
  // 핀 이름 패턴 우선 매칭
  for (const wire of WIRE_TYPES) {
    if (wire.pinNamePatterns?.some(p => new RegExp(p, 'i').test(pinName))) {
      return wire;
    }
  }
  // 핀 타입 매칭
  if (pinType) {
    const found = WIRE_TYPES.find(w => w.pinTypes.includes(pinType));
    if (found) return found;
  }
  // 기본값: 디지털 신호선
  return WIRE_TYPES.find(w => w.id === 'wire-digital')!;
}
