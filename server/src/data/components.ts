// ─────────────────────────────────────────────────────────────────────────────
// 컴포넌트 정의 데이터베이스 (Wokwi 스타일)
// 모든 부품의 규격을 JSON으로 완전히 표현합니다.
// ─────────────────────────────────────────────────────────────────────────────

export type PropType = 'string' | 'number' | 'boolean' | 'select' | 'color';
export type PinType =
  | 'power' | 'ground' | 'digital' | 'analog' | 'pwm'
  | 'i2c_sda' | 'i2c_scl'
  | 'spi_mosi' | 'spi_miso' | 'spi_sck' | 'spi_ss'
  | 'uart_tx' | 'uart_rx'
  | 'signal' | 'output' | 'input';

export type ValidationRule =
  | 'requires_series_resistor'
  | 'requires_vcc'
  | 'requires_gnd'
  | 'requires_pwm_pin'
  | 'requires_adc_pin'
  | 'voltage_sensitive_3v3'
  | 'voltage_sensitive_5v'
  | 'high_current';

export interface PropDef {
  key: string;
  label: string;
  type: PropType;
  default: unknown;
  options?: string[];        // type === 'select' 일 때
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export interface PinDef {
  name: string;
  label: string;
  description: string;
  type: PinType;
  required: boolean;
  /** 이 핀에 연결 가능한 대상 (핀 타입 또는 특수값) */
  compatibleWith: string[];
}

export interface ElectricalSpec {
  vccMin?: number;
  vccMax?: number;
  currentMa?: number;
  maxCurrentMa?: number;
  /** LED 색상별 순방향 전압 (V) */
  forwardVoltage?: Record<string, number>;
  /** 저항값 (Ω) */
  resistance?: number;
  /** 로직 레벨 */
  logic?: '3.3V' | '5V' | 'both';
  /** 핀당 최대 전류 */
  pinMaxCurrentMa?: number;
}

export interface ValidationEntry {
  rule: ValidationRule;
  message: string;
  severity: 'error' | 'warning';
  /** 어떤 핀에 해당하는지 (없으면 전체) */
  pin?: string;
}

export interface ComponentDef {
  id: string;
  name: string;
  category: 'passive' | 'active' | 'sensor' | 'display' | 'actuator' | 'power' | 'mcu';
  tags: string[];
  description: string;
  /** Lit custom element 태그 */
  element: string;
  /** 캔버스 기본 크기 힌트 */
  width: number;
  height: number;
  defaultProps: Record<string, unknown>;
  props: PropDef[];
  pins: PinDef[];
  electrical: ElectricalSpec;
  validation: ValidationEntry[];
  notes: string[];
  datasheet?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export const COMPONENTS: ComponentDef[] = [

  // ── LED ──────────────────────────────────────────────────────────────────
  {
    id: 'led',
    name: 'LED',
    category: 'active',
    tags: ['led', 'light', '발광', '표시'],
    description: '발광 다이오드 (Light Emitting Diode). 반드시 직렬 저항 필요.',
    element: 'sim-led',
    width: 40,
    height: 60,
    defaultProps: { color: 'red' },
    props: [
      {
        key: 'color',
        label: '색상',
        type: 'select',
        default: 'red',
        options: ['red', 'green', 'blue', 'yellow', 'white', 'orange', 'purple'],
        description: 'LED 발광 색상',
      },
    ],
    pins: [
      {
        name: 'ANODE',
        label: '+',
        description: '양극 (Anode). GPIO 핀 또는 저항을 통해 VCC에 연결.',
        type: 'input',
        required: true,
        compatibleWith: ['digital', 'pwm', 'signal', 'power'],
      },
      {
        name: 'CATHODE',
        label: '−',
        description: '음극 (Cathode). GND에 연결.',
        type: 'ground',
        required: true,
        compatibleWith: ['ground'],
      },
    ],
    electrical: {
      vccMin: 1.8,
      vccMax: 3.5,
      currentMa: 10,
      maxCurrentMa: 20,
      forwardVoltage: {
        red: 2.0, orange: 2.1, yellow: 2.1,
        green: 2.2, blue: 3.2, white: 3.2, purple: 3.2,
      },
    },
    validation: [
      {
        rule: 'requires_series_resistor',
        pin: 'ANODE',
        message: 'LED ANODE와 GPIO 사이에 직렬 저항이 없습니다',
        severity: 'error',
      },
      {
        rule: 'requires_gnd',
        pin: 'CATHODE',
        message: 'LED CATHODE가 GND에 연결되어 있지 않습니다',
        severity: 'error',
      },
    ],
    notes: [
      '반드시 직렬 저항 필요 — 없으면 LED 및 GPIO 손상',
      '5V 시스템: R = (5 - Vf) / 0.010 Ω',
      '3.3V 시스템: R = (3.3 - Vf) / 0.010 Ω',
      '권장 전류: 10mA (밝기/수명 균형)',
      'PWM으로 밝기 조절 가능 (analogWrite/ledcWrite)',
    ],
    datasheet: 'https://www.vishay.com/docs/83171/tlhg540p.pdf',
  },

  // ── RGB LED ───────────────────────────────────────────────────────────────
  {
    id: 'rgb-led',
    name: 'RGB LED',
    category: 'active',
    tags: ['rgb', 'led', 'color', '컬러'],
    description: 'RGB 3색 LED (공통 캐소드). 각 채널 독립 제어.',
    element: 'sim-rgb-led',
    width: 44,
    height: 60,
    defaultProps: { commonAnode: false },
    props: [
      {
        key: 'commonAnode',
        label: '공통 애노드',
        type: 'boolean',
        default: false,
        description: 'true = 공통 애노드(VCC), false = 공통 캐소드(GND)',
      },
    ],
    pins: [
      { name: 'RED',    label: 'R', description: '빨강 채널 — PWM 권장', type: 'pwm', required: true, compatibleWith: ['digital', 'pwm', 'signal'] },
      { name: 'GREEN',  label: 'G', description: '초록 채널 — PWM 권장', type: 'pwm', required: true, compatibleWith: ['digital', 'pwm', 'signal'] },
      { name: 'BLUE',   label: 'B', description: '파랑 채널 — PWM 권장', type: 'pwm', required: true, compatibleWith: ['digital', 'pwm', 'signal'] },
      { name: 'COMMON', label: 'C', description: '공통 단자. 공통 캐소드→GND, 공통 애노드→VCC', type: 'ground', required: true, compatibleWith: ['ground', 'power'] },
    ],
    electrical: {
      currentMa: 20,
      maxCurrentMa: 60,
      forwardVoltage: { red: 2.0, green: 2.2, blue: 3.2 },
    },
    validation: [
      { rule: 'requires_series_resistor', message: '각 채널에 직렬 저항 필요', severity: 'error' },
    ],
    notes: [
      '각 채널(R/G/B)마다 별도 저항 필요',
      'PWM으로 색상 혼합 (analogWrite 또는 ledcWrite)',
      '공통 캐소드: COMMON→GND, 신호→HIGH=켜짐',
      '공통 애노드: COMMON→VCC, 신호→LOW=켜짐',
    ],
  },

  // ── 저항 ──────────────────────────────────────────────────────────────────
  {
    id: 'resistor',
    name: '저항',
    category: 'passive',
    tags: ['resistor', '저항', 'R', '전류 제한'],
    description: '탄소 피막 저항. 전류 제한, 전압 분배 용도.',
    element: 'sim-resistor',
    width: 60,
    height: 24,
    defaultProps: { ohms: 220 },
    props: [
      {
        key: 'ohms',
        label: '저항값',
        type: 'number',
        default: 220,
        min: 1,
        max: 10000000,
        unit: 'Ω',
        description: '저항값 (옴)',
      },
      {
        key: 'tolerance',
        label: '허용 오차',
        type: 'select',
        default: '5%',
        options: ['1%', '5%', '10%'],
      },
      {
        key: 'wattage',
        label: '정격 전력',
        type: 'select',
        default: '0.25W',
        options: ['0.125W', '0.25W', '0.5W', '1W'],
      },
    ],
    pins: [
      { name: 'PIN1', label: '1', description: '리드선 1 (방향 무관)', type: 'signal', required: true, compatibleWith: ['digital', 'analog', 'pwm', 'signal', 'power', 'ground', 'output', 'input'] },
      { name: 'PIN2', label: '2', description: '리드선 2 (방향 무관)', type: 'signal', required: true, compatibleWith: ['digital', 'analog', 'pwm', 'signal', 'power', 'ground', 'output', 'input'] },
    ],
    electrical: {
      resistance: 220,
    },
    validation: [],
    notes: [
      '극성 없음 — 어느 방향으로 연결해도 됩니다',
      '1/4W (250mW) 정격 주의: P = V² / R = I² × R',
      '컬러 밴드: 4밴드 기준 값/값/배수/오차',
      'V = I × R (옴의 법칙)',
    ],
  },

  // ── 버튼 ──────────────────────────────────────────────────────────────────
  {
    id: 'button',
    name: '푸시 버튼',
    category: 'passive',
    tags: ['button', 'switch', '버튼', '스위치', 'tactile'],
    description: '순간 접촉식 택트 스위치 (SPST-NO). 누르는 동안만 통전.',
    element: 'sim-button',
    width: 50,
    height: 50,
    defaultProps: { btnColor: '#2244aa' },
    props: [
      {
        key: 'btnColor',
        label: '버튼 색상',
        type: 'color',
        default: '#2244aa',
      },
    ],
    pins: [
      { name: 'PIN1A', label: '1A', description: '핀 1A — 1번쪽 단자. GPIO에 연결', type: 'signal', required: false, compatibleWith: ['digital', 'signal', 'input'] },
      { name: 'PIN1B', label: '1B', description: '핀 1B — PIN1A와 내부 연결(동일)', type: 'signal', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'PIN2A', label: '2A', description: '핀 2A — 반대쪽 단자. GND에 연결', type: 'ground', required: false, compatibleWith: ['ground', 'digital', 'signal'] },
      { name: 'PIN2B', label: '2B', description: '핀 2B — PIN2A와 내부 연결(동일)', type: 'ground', required: false, compatibleWith: ['ground', 'digital', 'signal'] },
    ],
    electrical: {
      maxCurrentMa: 100,
      logic: 'both',
    },
    validation: [],
    notes: [
      'PIN1A~1B / PIN2A~2B는 내부 연결 (같은 단자)',
      '권장 연결: PIN1A→GPIO(INPUT_PULLUP), PIN2A→GND',
      'INPUT_PULLUP 사용 시: 안 눌림=HIGH, 눌림=LOW',
      '외부 풀업 사용 시 10kΩ 저항 권장',
      '디바운싱 처리 권장 (소프트웨어 또는 하드웨어)',
    ],
  },

  // ── 부저 ──────────────────────────────────────────────────────────────────
  {
    id: 'buzzer',
    name: '부저',
    category: 'actuator',
    tags: ['buzzer', '부저', '음향', 'piezo', 'sound'],
    description: '패시브 부저 (Passive Buzzer). PWM 주파수로 다양한 음 출력.',
    element: 'sim-buzzer',
    width: 44,
    height: 44,
    defaultProps: {},
    props: [
      {
        key: 'type',
        label: '부저 유형',
        type: 'select',
        default: 'passive',
        options: ['passive', 'active'],
        description: 'passive: 주파수 제어, active: 전원만 인가',
      },
    ],
    pins: [
      { name: 'VCC', label: '+', description: '양극. GPIO 또는 5V에 연결', type: 'power', required: true, compatibleWith: ['digital', 'pwm', 'power'] },
      { name: 'GND', label: '−', description: '음극. GND에 연결', type: 'ground', required: true, compatibleWith: ['ground'] },
    ],
    electrical: {
      vccMin: 3.3,
      vccMax: 5.0,
      currentMa: 30,
      maxCurrentMa: 50,
      logic: 'both',
    },
    validation: [
      { rule: 'requires_vcc',  message: '부저 VCC 연결 필요', severity: 'error' },
      { rule: 'requires_gnd',  message: '부저 GND 연결 필요', severity: 'error' },
      { rule: 'requires_pwm_pin', message: '패시브 부저는 PWM 핀 권장', severity: 'warning' },
    ],
    notes: [
      'tone(pin, freq, duration) 함수로 제어',
      '최대 전류(50mA) 초과 시 NPN 트랜지스터(2N2222) 사용',
      'GPIO 핀 최대 출력이 40mA이므로 직접 구동 주의',
      '패시브: PWM 필요 / 액티브: HIGH 신호만으로 울림',
    ],
  },

  // ── 포텐셔미터 ─────────────────────────────────────────────────────────────
  {
    id: 'potentiometer',
    name: '포텐셔미터',
    category: 'passive',
    tags: ['potentiometer', 'pot', '가변저항', 'knob', 'analog'],
    description: '가변저항 (10kΩ). 아날로그 값 입력.',
    element: 'sim-potentiometer',
    width: 60,
    height: 60,
    defaultProps: { value: 512, min: 0, max: 1023 },
    props: [
      { key: 'value', label: '초기값', type: 'number', default: 512, min: 0, max: 4095 },
      { key: 'max',   label: '최댓값', type: 'select', default: 1023, options: ['1023', '4095'],
        description: '10bit(1023) = Arduino Uno, 12bit(4095) = ESP32' },
    ],
    pins: [
      { name: 'VCC',   label: 'VCC', description: 'VCC (3.3V 또는 5V)', type: 'power',  required: true, compatibleWith: ['power'] },
      { name: 'WIPER', label: 'W',   description: '와이퍼 출력 — ADC 핀에 연결', type: 'analog', required: true, compatibleWith: ['analog'] },
      { name: 'GND',   label: 'GND', description: 'GND', type: 'ground', required: true, compatibleWith: ['ground'] },
    ],
    electrical: {
      vccMin: 0,
      vccMax: 5.0,
      resistance: 10000,
      logic: 'both',
    },
    validation: [
      { rule: 'requires_adc_pin', pin: 'WIPER', message: 'WIPER는 ADC(아날로그) 핀에 연결해야 합니다', severity: 'warning' },
    ],
    notes: [
      'WIPER 출력: 0V ~ VCC (선형 분할)',
      'analogRead() 반환: 0~1023 (10bit) 또는 0~4095 (12bit)',
      '전원 전압과 기준 전압을 일치시켜야 정확한 값 획득',
    ],
  },

  // ── 서보 ──────────────────────────────────────────────────────────────────
  {
    id: 'servo',
    name: 'SG90 서보',
    category: 'actuator',
    tags: ['servo', '서보', 'motor', 'SG90', 'PWM'],
    description: '마이크로 서보 모터 SG90. 0°~180° 각도 제어.',
    element: 'sim-servo',
    width: 60,
    height: 72,
    defaultProps: { angle: 90 },
    props: [
      { key: 'angle', label: '초기 각도', type: 'number', default: 90, min: 0, max: 180, unit: '°' },
    ],
    pins: [
      { name: 'VCC',    label: '빨강', description: '전원 (5V 권장). GPIO 5V 핀 또는 외부 전원', type: 'power',  required: true, compatibleWith: ['power'] },
      { name: 'GND',    label: '갈색', description: 'GND', type: 'ground', required: true, compatibleWith: ['ground'] },
      { name: 'SIGNAL', label: '주황', description: '제어 신호 (PWM). 50Hz, 0.5~2.5ms 펄스 폭', type: 'pwm', required: true, compatibleWith: ['pwm', 'digital'] },
    ],
    electrical: {
      vccMin: 4.8,
      vccMax: 6.0,
      currentMa: 150,
      maxCurrentMa: 650,
      logic: '5V',
    },
    validation: [
      { rule: 'requires_pwm_pin', pin: 'SIGNAL', message: 'SIGNAL은 PWM 지원 핀에 연결해야 합니다', severity: 'warning' },
      { rule: 'requires_vcc', message: 'SG90은 4.8~6V 전원 필요. GPIO에서 직접 공급 금지', severity: 'error' },
      { rule: 'high_current', message: '시동 전류 최대 650mA — 외부 전원 권장', severity: 'warning' },
    ],
    notes: [
      'Arduino: Servo 라이브러리 사용 (servo.write(angle))',
      'ESP32: ledcWrite() 또는 ESP32Servo 라이브러리',
      '시동 전류가 크므로 Arduino GPIO 5V 핀으로 직접 공급 금지',
      '외부 5V 전원 사용 시 GND 공통 연결 필수',
      '50Hz PWM: 1ms=0°, 1.5ms=90°, 2ms=180°',
    ],
    datasheet: 'http://www.ee.ic.ac.uk/pcheung/teaching/DE1_EE/stores/sg90_datasheet.pdf',
  },

  // ── DHT22 ─────────────────────────────────────────────────────────────────
  {
    id: 'dht',
    name: 'DHT22',
    category: 'sensor',
    tags: ['dht', 'dht22', 'dht11', 'temperature', 'humidity', '온도', '습도'],
    description: 'DHT11/DHT22 디지털 온습도 센서.',
    element: 'sim-dht',
    width: 40,
    height: 56,
    defaultProps: { model: 'DHT22', temperature: 25, humidity: 60 },
    props: [
      {
        key: 'model',
        label: '모델',
        type: 'select',
        default: 'DHT22',
        options: ['DHT11', 'DHT22'],
        description: 'DHT11: 저가, DHT22: 고정밀',
      },
      { key: 'temperature', label: '온도 (시뮬)', type: 'number', default: 25, min: -40, max: 80,  step: 0.1, unit: '°C' },
      { key: 'humidity',    label: '습도 (시뮬)', type: 'number', default: 60, min: 0,   max: 100, step: 1,   unit: '%' },
    ],
    pins: [
      { name: 'VCC',  label: 'VCC',  description: 'VCC (3.3V ~ 5V)', type: 'power',  required: true, compatibleWith: ['power'] },
      { name: 'DATA', label: 'DATA', description: '단선 데이터. GPIO + 4.7kΩ 풀업 필수', type: 'digital', required: true, compatibleWith: ['digital', 'signal'] },
      { name: 'GND',  label: 'GND',  description: 'GND', type: 'ground', required: true, compatibleWith: ['ground'] },
    ],
    electrical: {
      vccMin: 3.3,
      vccMax: 5.5,
      currentMa: 2.5,
      maxCurrentMa: 10,
      logic: 'both',
    },
    validation: [
      { rule: 'requires_vcc', message: 'DHT VCC 연결 필요', severity: 'error' },
      { rule: 'requires_gnd', message: 'DHT GND 연결 필요', severity: 'error' },
    ],
    notes: [
      'DATA 핀에 4.7kΩ 풀업 저항 필수 (VCC↔DATA 사이)',
      '샘플링 간격 최소 2초',
      'DHT22 측정 범위: 온도 -40~80°C ±0.5, 습도 0~100% ±2%',
      'DHT11 측정 범위: 온도 0~50°C ±2, 습도 20~90% ±5%',
      '라이브러리: DHT.h (Adafruit) 또는 DHT_sensor_library',
    ],
    datasheet: 'https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf',
  },

  // ── HC-SR04 ───────────────────────────────────────────────────────────────
  {
    id: 'ultrasonic',
    name: 'HC-SR04',
    category: 'sensor',
    tags: ['ultrasonic', 'hcsr04', 'distance', '거리', '초음파'],
    description: 'HC-SR04 초음파 거리 센서. 2~400cm 측정.',
    element: 'sim-ultrasonic',
    width: 60,
    height: 50,
    defaultProps: { distanceCm: 20 },
    props: [
      { key: 'distanceCm', label: '거리 (시뮬)', type: 'number', default: 20, min: 2, max: 400, unit: 'cm' },
    ],
    pins: [
      { name: 'VCC',  label: 'VCC',  description: '전원 (반드시 5V)', type: 'power',  required: true, compatibleWith: ['power'] },
      { name: 'TRIG', label: 'TRIG', description: '트리거 입력 (GPIO → 10μs HIGH 펄스)', type: 'digital', required: true, compatibleWith: ['digital', 'signal'] },
      { name: 'ECHO', label: 'ECHO', description: '에코 출력 (5V 로직! 3.3V MCU는 분압 회로 필요)', type: 'output', required: true, compatibleWith: ['digital', 'signal'] },
      { name: 'GND',  label: 'GND',  description: 'GND', type: 'ground', required: true, compatibleWith: ['ground'] },
    ],
    electrical: {
      vccMin: 5.0,
      vccMax: 5.0,
      currentMa: 15,
      maxCurrentMa: 20,
      logic: '5V',
    },
    validation: [
      { rule: 'voltage_sensitive_5v', message: 'HC-SR04는 5V 전용. ECHO 핀이 5V 출력하므로 3.3V MCU에는 분압 회로 필요', severity: 'warning' },
      { rule: 'requires_vcc', message: 'VCC 5V 연결 필요', severity: 'error' },
    ],
    notes: [
      '측정 원리: TRIG에 10μs HIGH → ECHO HIGH 구간이 거리 비례',
      '거리 계산: 거리(cm) = ECHO 펄스폭(μs) / 58.0',
      'ECHO 핀은 5V 출력 → ESP32/3.3V MCU에는 분압 필요 (1kΩ + 2kΩ)',
      '최소 측정 거리: 2cm, 최대: 400cm',
      '측정각: ±15°',
    ],
    datasheet: 'https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf',
  },

  // ── I2C LCD ───────────────────────────────────────────────────────────────
  {
    id: 'lcd',
    name: 'I2C LCD 1602',
    category: 'display',
    tags: ['lcd', '1602', 'i2c', 'display', '디스플레이', '문자'],
    description: 'I2C 인터페이스 HD44780 LCD 16×2 (또는 20×4).',
    element: 'sim-lcd',
    width: 120,
    height: 60,
    defaultProps: { rows: 2, cols: 16, i2cAddress: 0x27 },
    props: [
      { key: 'rows',       label: '행 수',     type: 'select', default: 2, options: ['2', '4'] },
      { key: 'cols',       label: '열 수',     type: 'select', default: 16, options: ['16', '20'] },
      { key: 'i2cAddress', label: 'I2C 주소', type: 'select', default: 0x27, options: ['0x27', '0x3F'],
        description: 'PCF8574 모듈의 A0~A2 점퍼에 따라 결정' },
    ],
    pins: [
      { name: 'VCC', label: 'VCC', description: '전원 (5V)', type: 'power',   required: true, compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', description: 'GND',        type: 'ground',  required: true, compatibleWith: ['ground'] },
      { name: 'SDA', label: 'SDA', description: 'I2C 데이터 (Uno: A4, ESP32: G20)', type: 'i2c_sda', required: true, compatibleWith: ['i2c_sda', 'digital'] },
      { name: 'SCL', label: 'SCL', description: 'I2C 클럭 (Uno: A5, ESP32: G21)',   type: 'i2c_scl', required: true, compatibleWith: ['i2c_scl', 'digital'] },
    ],
    electrical: {
      vccMin: 5.0,
      vccMax: 5.0,
      currentMa: 40,
      logic: '5V',
    },
    validation: [
      { rule: 'voltage_sensitive_5v', message: 'LCD는 5V 전용. 3.3V 시스템에서는 레벨 변환 필요', severity: 'warning' },
    ],
    notes: [
      'I2C 주소: 기본 0x27, 일부 모듈 0x3F',
      '라이브러리: LiquidCrystal_I2C (Frank de Brabander)',
      'SDA/SCL 풀업 저항: 모듈 내장된 경우 많음 (4.7kΩ)',
      '백라이트 전류: 약 15mA',
      'I2C Scanner 코드로 주소 확인 가능',
    ],
  },

  // ── SSD1306 OLED ──────────────────────────────────────────────────────────
  {
    id: 'oled',
    name: 'SSD1306 OLED',
    category: 'display',
    tags: ['oled', 'ssd1306', 'i2c', 'display', '디스플레이', '그래픽'],
    description: 'SSD1306 I2C 단색 OLED 128×64.',
    element: 'sim-oled',
    width: 90,
    height: 80,
    defaultProps: { i2cAddress: 0x3C },
    props: [
      { key: 'i2cAddress', label: 'I2C 주소', type: 'select', default: 0x3C, options: ['0x3C', '0x3D'] },
    ],
    pins: [
      { name: 'VCC', label: 'VCC', description: '전원 (3.3V 또는 5V)', type: 'power',   required: true, compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', description: 'GND', type: 'ground',  required: true, compatibleWith: ['ground'] },
      { name: 'SDA', label: 'SDA', description: 'I2C 데이터', type: 'i2c_sda', required: true, compatibleWith: ['i2c_sda', 'digital'] },
      { name: 'SCL', label: 'SCL', description: 'I2C 클럭', type: 'i2c_scl', required: true, compatibleWith: ['i2c_scl', 'digital'] },
    ],
    electrical: {
      vccMin: 3.3,
      vccMax: 5.0,
      currentMa: 20,
      logic: 'both',
    },
    validation: [],
    notes: [
      'I2C 주소: 0x3C (SA0=GND) 또는 0x3D (SA0=VCC)',
      '라이브러리: Adafruit_SSD1306 + Adafruit_GFX',
      '그래픽 버퍼 1KB RAM 필요 (Uno 기준 부담)',
      '화면 크기: 128×64 픽셀',
    ],
    datasheet: 'https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf',
  },

  // ── 7-세그먼트 ─────────────────────────────────────────────────────────────
  {
    id: 'seven-segment',
    name: '7-세그먼트',
    category: 'display',
    tags: ['7segment', '세그먼트', 'display', '숫자', 'LED'],
    description: '공통 캐소드 7-세그먼트 디스플레이. A~G + DP 핀.',
    element: 'sim-seven-segment',
    width: 44,
    height: 64,
    defaultProps: { color: '#ff2020' },
    props: [
      {
        key: 'color',
        label: '세그먼트 색상',
        type: 'color',
        default: '#ff2020',
      },
      {
        key: 'type',
        label: '공통 단자',
        type: 'select',
        default: 'cathode',
        options: ['cathode', 'anode'],
      },
    ],
    pins: [
      { name: 'A',   label: 'A',   description: '세그먼트 A (상단 가로)', type: 'input', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'B',   label: 'B',   description: '세그먼트 B (우상 세로)', type: 'input', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'C',   label: 'C',   description: '세그먼트 C (우하 세로)', type: 'input', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'D',   label: 'D',   description: '세그먼트 D (하단 가로)', type: 'input', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'E',   label: 'E',   description: '세그먼트 E (좌하 세로)', type: 'input', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'F',   label: 'F',   description: '세그먼트 F (좌상 세로)', type: 'input', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'G',   label: 'G',   description: '세그먼트 G (중간 가로)', type: 'input', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'DP',  label: 'DP',  description: '소수점 (Decimal Point)', type: 'input', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'COM', label: 'COM', description: '공통 캐소드→GND / 공통 애노드→VCC', type: 'ground', required: true, compatibleWith: ['ground', 'power'] },
    ],
    electrical: {
      vccMin: 1.8,
      vccMax: 3.3,
      currentMa: 10,
      maxCurrentMa: 15,
    },
    validation: [
      { rule: 'requires_series_resistor', message: '각 세그먼트(A~G)에 330Ω 직렬 저항 필요', severity: 'error' },
    ],
    notes: [
      '각 세그먼트에 330Ω 저항 필요 (세그먼트당 10mA 기준)',
      '핀이 많으므로 74HC595 시프트 레지스터 사용 권장',
      '4자리 이상은 멀티플렉싱 기법 적용',
      '공통 캐소드: HIGH=켜짐 / 공통 애노드: LOW=켜짐',
    ],
  },

  // ── NeoPixel ──────────────────────────────────────────────────────────────
  {
    id: 'neopixel',
    name: 'NeoPixel (WS2812B)',
    category: 'active',
    tags: ['neopixel', 'ws2812', 'rgb', 'led strip', '스트립', 'addressable'],
    description: 'WS2812B 주소 지정 RGB LED 스트립.',
    element: 'sim-neopixel',
    width: 200,
    height: 44,
    defaultProps: { count: 8 },
    props: [
      { key: 'count', label: 'LED 개수', type: 'number', default: 8, min: 1, max: 64 },
    ],
    pins: [
      { name: 'VCC', label: '5V',  description: '전원 5V (LED 수에 따라 외부 전원 필수)', type: 'power',  required: true, compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', description: 'GND', type: 'ground', required: true, compatibleWith: ['ground'] },
      { name: 'DIN', label: 'DIN', description: '데이터 입력 (1-Wire). GPIO + 300~500Ω 직렬 저항 권장', type: 'digital', required: true, compatibleWith: ['digital', 'signal'] },
    ],
    electrical: {
      vccMin: 4.5,
      vccMax: 5.5,
      currentMa: 60, // LED 1개당 최대 (R+G+B)
      maxCurrentMa: 60,
      logic: '5V',
    },
    validation: [
      { rule: 'high_current', message: 'NeoPixel 1개당 최대 60mA. 10개 이상은 외부 전원 필수', severity: 'warning' },
      { rule: 'requires_vcc', message: 'VCC 5V 연결 필요', severity: 'error' },
    ],
    notes: [
      'LED 1개 최대 60mA (R 20mA + G 20mA + B 20mA)',
      '10개: 600mA, 30개: 1.8A → USB 전원 불가',
      '전원 공급선에 100~1000μF 커패시터 권장',
      'DIN 앞에 300~500Ω 직렬 저항으로 반사 노이즈 방지',
      '라이브러리: Adafruit_NeoPixel, FastLED',
      '3.3V MCU 데이터 출력이 불안정한 경우 레벨 변환 회로 추가',
    ],
    datasheet: 'https://cdn-shop.adafruit.com/datasheets/WS2812B.pdf',
  },

  // ── Arduino Uno R3 ────────────────────────────────────────────────────────
  {
    id: 'board-uno',
    name: 'Arduino Uno R3',
    category: 'mcu',
    tags: ['arduino', 'uno', 'atmega328p', 'board', '보드'],
    description: 'ATmega328P 기반 Arduino Uno Rev3 보드.',
    element: 'sim-board-uno',
    width: 300,
    height: 200,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'D0',  label: 'D0/RX',  description: 'GPIO 0 / UART RX',  type: 'uart_rx', required: false, compatibleWith: ['digital', 'signal', 'uart_rx'] },
      { name: 'D1',  label: 'D1/TX',  description: 'GPIO 1 / UART TX',  type: 'uart_tx', required: false, compatibleWith: ['digital', 'signal', 'uart_tx'] },
      { name: 'D2',  label: 'D2',     description: 'GPIO 2 / 인터럽트 0', type: 'digital', required: false, compatibleWith: ['digital', 'signal', 'input', 'output'] },
      { name: 'D3~', label: 'D3~',    description: 'GPIO 3 / PWM / 인터럽트 1', type: 'pwm', required: false, compatibleWith: ['digital', 'pwm', 'signal'] },
      { name: 'D4',  label: 'D4',     description: 'GPIO 4', type: 'digital', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'D5~', label: 'D5~',    description: 'GPIO 5 / PWM', type: 'pwm', required: false, compatibleWith: ['digital', 'pwm', 'signal'] },
      { name: 'D6~', label: 'D6~',    description: 'GPIO 6 / PWM', type: 'pwm', required: false, compatibleWith: ['digital', 'pwm', 'signal'] },
      { name: 'D7',  label: 'D7',     description: 'GPIO 7', type: 'digital', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'D8',  label: 'D8',     description: 'GPIO 8', type: 'digital', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'D9~', label: 'D9~',    description: 'GPIO 9 / PWM', type: 'pwm', required: false, compatibleWith: ['digital', 'pwm', 'signal'] },
      { name: 'D10~',label: 'D10~/SS', description: 'GPIO 10 / PWM / SPI SS', type: 'spi_ss', required: false, compatibleWith: ['digital', 'pwm', 'spi_ss'] },
      { name: 'D11~',label: 'D11~/MOSI', description: 'GPIO 11 / PWM / SPI MOSI', type: 'spi_mosi', required: false, compatibleWith: ['digital', 'pwm', 'spi_mosi'] },
      { name: 'D12', label: 'D12/MISO', description: 'GPIO 12 / SPI MISO', type: 'spi_miso', required: false, compatibleWith: ['digital', 'spi_miso'] },
      { name: 'D13', label: 'D13/SCK', description: 'GPIO 13 / SPI SCK / 내장 LED', type: 'spi_sck', required: false, compatibleWith: ['digital', 'spi_sck'] },
      { name: 'A0',  label: 'A0',     description: 'GPIO 14 / ADC 0', type: 'analog', required: false, compatibleWith: ['analog', 'digital'] },
      { name: 'A1',  label: 'A1',     description: 'GPIO 15 / ADC 1', type: 'analog', required: false, compatibleWith: ['analog', 'digital'] },
      { name: 'A2',  label: 'A2',     description: 'GPIO 16 / ADC 2', type: 'analog', required: false, compatibleWith: ['analog', 'digital'] },
      { name: 'A3',  label: 'A3',     description: 'GPIO 17 / ADC 3', type: 'analog', required: false, compatibleWith: ['analog', 'digital'] },
      { name: 'A4/SDA', label: 'A4/SDA', description: 'GPIO 18 / ADC 4 / I2C SDA', type: 'i2c_sda', required: false, compatibleWith: ['analog', 'i2c_sda'] },
      { name: 'A5/SCL', label: 'A5/SCL', description: 'GPIO 19 / ADC 5 / I2C SCL', type: 'i2c_scl', required: false, compatibleWith: ['analog', 'i2c_scl'] },
      { name: '5V',  label: '5V',     description: '5V 출력 (최대 500mA)', type: 'power',  required: false, compatibleWith: ['power'] },
      { name: '3V3', label: '3.3V',   description: '3.3V 출력 (최대 50mA)', type: 'power', required: false, compatibleWith: ['power'] },
      { name: 'GND', label: 'GND',    description: 'GND', type: 'ground', required: false, compatibleWith: ['ground'] },
      { name: 'VIN', label: 'VIN',    description: '외부 전원 입력 (7~12V)', type: 'power', required: false, compatibleWith: ['power'] },
    ],
    electrical: {
      vccMin: 5.0,
      vccMax: 5.0,
      currentMa: 50,
      maxCurrentMa: 200,
      pinMaxCurrentMa: 40,
      logic: '5V',
    },
    validation: [],
    notes: [
      'MCU: ATmega328P @ 16MHz',
      'GPIO 핀당 최대 40mA, 전체 합계 200mA',
      'PWM 핀: D3, D5, D6, D9, D10, D11 (490 또는 980Hz)',
      'ADC: 10bit (0~1023), 기준 전압 5V',
      'I2C: A4(SDA), A5(SCL)',
      'SPI: D10(SS), D11(MOSI), D12(MISO), D13(SCK)',
      'USB 전원 최대 500mA',
    ],
  },

  // ── ESP32-C3 Super Mini ───────────────────────────────────────────────────
  {
    id: 'board-esp32c3',
    name: 'ESP32-C3 Super Mini',
    category: 'mcu',
    tags: ['esp32', 'c3', 'wifi', 'ble', '무선', 'risc-v', '보드'],
    description: 'ESP32-C3 RISC-V Wi-Fi/BLE 모듈. 3.3V 동작.',
    element: 'sim-board-esp32c3',
    width: 120,
    height: 160,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'G0',  label: 'G0',  description: 'GPIO 0 / ADC / ⚠️ 부팅 핀 (풀다운 주의)', type: 'analog',  required: false, compatibleWith: ['digital', 'analog', 'signal'] },
      { name: 'G1',  label: 'G1',  description: 'GPIO 1 / ADC', type: 'analog',  required: false, compatibleWith: ['digital', 'analog', 'signal'] },
      { name: 'G2',  label: 'G2',  description: 'GPIO 2 / ADC', type: 'analog',  required: false, compatibleWith: ['digital', 'analog', 'signal'] },
      { name: 'G3',  label: 'G3',  description: 'GPIO 3 / ADC', type: 'analog',  required: false, compatibleWith: ['digital', 'analog', 'signal'] },
      { name: 'G4',  label: 'G4',  description: 'GPIO 4 / ADC / UART TX', type: 'uart_tx', required: false, compatibleWith: ['digital', 'analog', 'uart_tx', 'signal'] },
      { name: 'G5',  label: 'G5',  description: 'GPIO 5 / ADC / UART RX', type: 'uart_rx', required: false, compatibleWith: ['digital', 'analog', 'uart_rx', 'signal'] },
      { name: 'G6',  label: 'G6',  description: 'GPIO 6 / SPI SCK', type: 'spi_sck',  required: false, compatibleWith: ['digital', 'spi_sck', 'signal'] },
      { name: 'G7',  label: 'G7',  description: 'GPIO 7 / SPI MOSI', type: 'spi_mosi', required: false, compatibleWith: ['digital', 'spi_mosi', 'signal'] },
      { name: 'G8',  label: 'G8',  description: 'GPIO 8 / 내장 LED (Active LOW)', type: 'digital', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'G9',  label: 'G9',  description: 'GPIO 9 / ⚠️ 부팅 핀', type: 'digital', required: false, compatibleWith: ['digital', 'signal'] },
      { name: 'G10', label: 'G10', description: 'GPIO 10 / SPI SS', type: 'spi_ss',   required: false, compatibleWith: ['digital', 'spi_ss', 'signal'] },
      { name: 'G20', label: 'G20', description: 'GPIO 20 / SPI MISO / I2C SDA', type: 'i2c_sda', required: false, compatibleWith: ['digital', 'i2c_sda', 'spi_miso'] },
      { name: 'G21', label: 'G21', description: 'GPIO 21 / I2C SCL', type: 'i2c_scl', required: false, compatibleWith: ['digital', 'i2c_scl'] },
      { name: '5V',  label: '5V',  description: 'USB 5V 출력 (최대 ~400mA)', type: 'power',  required: false, compatibleWith: ['power'] },
      { name: '3V3', label: '3.3V', description: '3.3V 레귤레이터 출력 (최대 600mA)', type: 'power', required: false, compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', description: 'GND', type: 'ground', required: false, compatibleWith: ['ground'] },
    ],
    electrical: {
      vccMin: 3.0,
      vccMax: 3.6,
      currentMa: 80,
      maxCurrentMa: 600,
      pinMaxCurrentMa: 40,
      logic: '3.3V',
    },
    validation: [
      { rule: 'voltage_sensitive_3v3', message: '3.3V 동작 보드 — 5V 직접 연결 절대 금지', severity: 'error' },
    ],
    notes: [
      'MCU: ESP32-C3 RISC-V @ 160MHz',
      '⚠️ 동작 전압 3.3V — GPIO에 5V 연결 시 영구 손상',
      'GPIO 핀당 최대 40mA',
      'PWM: ledcWrite()로 모든 GPIO 사용 가능 (analogWrite 불가)',
      'ADC: 12bit (G0~G5), Wi-Fi 활성 시 불안정',
      'Wi-Fi: 802.11b/g/n 2.4GHz / BLE 5.0',
      'G0, G9 부팅 핀 — 외부 풀다운 시 부팅 실패 가능',
      '내장 LED G8: LOW=켜짐 (Active LOW)',
    ],
    datasheet: 'https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf',
  },
];

/** ID로 컴포넌트 정의 조회 */
export function getComponentDef(id: string): ComponentDef | undefined {
  return COMPONENTS.find(c => c.id === id);
}
