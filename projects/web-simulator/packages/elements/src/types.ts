/** 핀 연결 정보 */
export interface PinConnection {
  /** 이 컴포넌트의 핀 이름 (예: "ANODE", "VCC", "DATA") */
  pin: string;
  /** 연결된 Arduino 핀 번호 또는 GND/VCC 등 */
  target: number | 'GND' | 'VCC' | '5V' | '3V3';
}

/** 컴포넌트 공통 속성 */
export interface ComponentProps {
  id: string;
  x: number;
  y: number;
  rotation?: number;
  connections?: PinConnection[];
}

/** LED 색상 */
export type LedColor = 'red' | 'green' | 'blue' | 'yellow' | 'white' | 'orange' | 'purple';

/** 시뮬레이션 이벤트 */
export interface SimEvent extends CustomEvent {
  detail: Record<string, unknown>;
}

// ─── 핀 기능 ──────────────────────────────────────────────────────

export enum PinFunction {
  DIGITAL_IO = 'DIGITAL_IO',
  PWM        = 'PWM',
  ADC        = 'ADC',
  UART_TX    = 'UART_TX',
  UART_RX    = 'UART_RX',
  SPI_MOSI   = 'SPI_MOSI',
  SPI_MISO   = 'SPI_MISO',
  SPI_SCK    = 'SPI_SCK',
  SPI_SS     = 'SPI_SS',
  I2C_SDA    = 'I2C_SDA',
  I2C_SCL    = 'I2C_SCL',
  POWER_5V   = 'POWER_5V',
  POWER_3V3  = 'POWER_3V3',
  GND        = 'GND',
  RESET      = 'RESET',
}

export interface PinSpec {
  name: string;
  gpioNum?: number;
  functions: PinFunction[];
  maxCurrentMa?: number;
  voltage?: number;
}

// ─── 컴포넌트 전기적 사양 ─────────────────────────────────────────

export interface ComponentElectricalSpec {
  type: string;
  name: string;
  description: string;
  operatingVoltageMin?: number;
  operatingVoltageMax?: number;
  /** 일반 동작 전류 (mA) */
  currentMa?: number;
  /** 최대 허용 전류 (mA) */
  maxCurrentMa?: number;
  /** LED 순방향 전압 (색상별, V) */
  forwardVoltage?: Record<string, number>;
  /** 권장 직렬 저항 (Ω) */
  recommendedResistorOhms?: { min: number; max: number };
  /** 핀별 설명 */
  pins?: Record<string, {
    description: string;
    type: 'power' | 'signal' | 'ground' | 'output' | 'input' | 'bidirectional';
  }>;
  notes?: string[];
}
