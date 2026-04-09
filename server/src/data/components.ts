/**
 * 기본 제공 부품 시드 데이터
 * ComponentStore가 components.json이 없을 때 이 데이터로 초기화합니다.
 * 이후 수정은 API(/api/components)를 통해 이루어집니다.
 */
import type { ComponentDef } from '../store/component-store.js';

export const SEED_COMPONENTS: Omit<ComponentDef, '_createdAt' | '_updatedAt' | '_builtIn'>[] = [

  // ── LED ──────────────────────────────────────────────────────────────────
  {
    id: 'led',
    name: 'LED',
    category: 'active',
    tags: ['led', 'light', '발광'],
    description: '발광 다이오드. 반드시 직렬 저항 필요.',
    icon: '💡',
    element: 'sim-led',
    width: 40, height: 60,
    defaultProps: { color: 'red' },
    props: [
      { key: 'color', label: '색상', type: 'select', default: 'red',
        options: ['red','green','blue','yellow','white','orange','purple'] },
    ],
    pins: [
      { name: 'ANODE',   label: '+', x: 14, y: 60, type: 'input',  required: true,
        description: '양극 (+)', compatibleWith: ['digital','pwm','signal','power'] },
      { name: 'CATHODE', label: '−', x: 26, y: 60, type: 'ground', required: true,
        description: '음극 (−)', compatibleWith: ['ground'] },
    ],
    electrical: {
      vccMin: 1.8, vccMax: 3.5, currentMa: 10, maxCurrentMa: 20,
      forwardVoltage: { red:2.0, orange:2.1, yellow:2.1, green:2.2, blue:3.2, white:3.2, purple:3.2 },
    },
    validation: [
      { rule: 'requires_series_resistor', pin: 'ANODE',   message: 'ANODE와 GPIO 사이에 직렬 저항 필요', severity: 'error' },
      { rule: 'requires_gnd',             pin: 'CATHODE', message: 'CATHODE를 GND에 연결하세요',           severity: 'error' },
    ],
    notes: [
      '5V 기준: R = (5 - Vf) / 0.010 Ω',
      '3.3V 기준: R = (3.3 - Vf) / 0.010 Ω',
      '권장 전류 10mA, 최대 20mA',
    ],
    datasheet: 'https://www.vishay.com/docs/83171/tlhg540p.pdf',
  },

  // ── RGB LED ───────────────────────────────────────────────────────────────
  {
    id: 'rgb-led',
    name: 'RGB LED',
    category: 'active',
    tags: ['rgb','led','color'],
    description: 'RGB 3색 LED (공통 캐소드).',
    icon: '🌈',
    element: 'sim-rgb-led',
    width: 44, height: 60,
    defaultProps: { commonAnode: false },
    props: [
      { key: 'commonAnode', label: '공통 애노드', type: 'boolean', default: false },
    ],
    pins: [
      { name: 'RED',    label: 'R', x: 12, y: 60, type: 'pwm',   required: true, description: '빨강 채널', compatibleWith: ['digital','pwm','signal'] },
      { name: 'GREEN',  label: 'G', x: 20, y: 60, type: 'pwm',   required: true, description: '초록 채널', compatibleWith: ['digital','pwm','signal'] },
      { name: 'COMMON', label: 'C', x: 28, y: 60, type: 'ground',required: true, description: '공통 단자', compatibleWith: ['ground','power'] },
      { name: 'BLUE',   label: 'B', x: 36, y: 60, type: 'pwm',   required: true, description: '파랑 채널', compatibleWith: ['digital','pwm','signal'] },
    ],
    electrical: { currentMa: 20, maxCurrentMa: 60, forwardVoltage: { red:2.0, green:2.2, blue:3.2 } },
    validation: [{ rule: 'requires_series_resistor', message: '각 채널에 직렬 저항 필요', severity: 'error' }],
    notes: ['각 채널마다 별도 저항', 'PWM으로 색상 혼합'],
  },

  // ── 저항 ──────────────────────────────────────────────────────────────────
  {
    id: 'resistor',
    name: '저항',
    category: 'passive',
    tags: ['resistor','저항','R'],
    description: '탄소 피막 저항. 극성 없음.',
    icon: '〰️',
    element: 'sim-resistor',
    width: 60, height: 24,
    defaultProps: { ohms: 220 },
    props: [
      { key: 'ohms',      label: '저항값',   type: 'number', default: 220, min: 1, max: 10000000, unit: 'Ω' },
      { key: 'tolerance', label: '허용 오차', type: 'select', default: '5%', options: ['1%','5%','10%'] },
      { key: 'wattage',   label: '정격 전력', type: 'select', default: '0.25W', options: ['0.125W','0.25W','0.5W','1W'] },
    ],
    pins: [
      { name: 'PIN1', label: '1', x: 0,  y: 12, type: 'signal', required: true, description: '리드선 1', compatibleWith: ['digital','analog','pwm','signal','power','ground','output','input'] },
      { name: 'PIN2', label: '2', x: 60, y: 12, type: 'signal', required: true, description: '리드선 2', compatibleWith: ['digital','analog','pwm','signal','power','ground','output','input'] },
    ],
    electrical: { resistance: 220 },
    validation: [],
    notes: ['극성 없음', '1/4W 정격 (250mW)', 'V=I×R'],
  },

  // ── 버튼 ──────────────────────────────────────────────────────────────────
  {
    id: 'button',
    name: '푸시 버튼',
    category: 'passive',
    tags: ['button','switch','버튼'],
    description: '순간 접촉식 택트 스위치 (SPST-NO).',
    icon: '🔘',
    element: 'sim-button',
    width: 50, height: 50,
    defaultProps: { btnColor: '#2244aa' },
    props: [
      { key: 'btnColor', label: '버튼 색상', type: 'color', default: '#2244aa' },
    ],
    pins: [
      { name: 'PIN1A', label: '1A', x: 14, y: 50, type: 'signal', required: false, description: '1번쪽 단자 A', compatibleWith: ['digital','signal','input'] },
      { name: 'PIN1B', label: '1B', x: 20, y: 50, type: 'signal', required: false, description: '1번쪽 단자 B (1A와 내부 연결)', compatibleWith: ['digital','signal'] },
      { name: 'PIN2A', label: '2A', x: 30, y: 50, type: 'ground', required: false, description: '반대쪽 단자 A', compatibleWith: ['ground','digital','signal'] },
      { name: 'PIN2B', label: '2B', x: 36, y: 50, type: 'ground', required: false, description: '반대쪽 단자 B (2A와 내부 연결)', compatibleWith: ['ground','digital','signal'] },
    ],
    electrical: { maxCurrentMa: 100, logic: 'both' },
    validation: [],
    notes: ['INPUT_PULLUP 사용: 안 눌림=HIGH, 눌림=LOW', 'PIN1A→GPIO, PIN2A→GND'],
  },

  // ── 부저 ──────────────────────────────────────────────────────────────────
  {
    id: 'buzzer',
    name: '부저',
    category: 'actuator',
    tags: ['buzzer','부저','piezo','sound'],
    description: '패시브 부저. PWM 주파수로 음 출력.',
    icon: '🔊',
    element: 'sim-buzzer',
    width: 44, height: 44,
    defaultProps: {},
    props: [
      { key: 'type', label: '유형', type: 'select', default: 'passive', options: ['passive','active'] },
    ],
    pins: [
      { name: 'VCC', label: '+', x: 14, y: 44, type: 'power',  required: true, description: '양극 (+)', compatibleWith: ['digital','pwm','power'] },
      { name: 'GND', label: '−', x: 30, y: 44, type: 'ground', required: true, description: '음극 (−)', compatibleWith: ['ground'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 5.0, currentMa: 30, maxCurrentMa: 50 },
    validation: [
      { rule: 'requires_pwm_pin', message: '패시브 부저는 PWM 핀 권장', severity: 'warning' },
    ],
    notes: ['tone(pin, freq) 함수', '최대 50mA 초과 시 NPN 트랜지스터 사용'],
  },

  // ── 포텐셔미터 ─────────────────────────────────────────────────────────────
  {
    id: 'potentiometer',
    name: '포텐셔미터',
    category: 'passive',
    tags: ['potentiometer','pot','가변저항','analog'],
    description: '가변저항 10kΩ. 아날로그 값 입력.',
    icon: '🎚️',
    element: 'sim-potentiometer',
    width: 60, height: 60,
    defaultProps: { value: 512, min: 0, max: 1023 },
    props: [
      { key: 'value', label: '초기값', type: 'number', default: 512, min: 0, max: 4095 },
      { key: 'max',   label: '최댓값', type: 'select', default: 1023, options: ['1023','4095'] },
    ],
    pins: [
      { name: 'VCC',   label: 'VCC', x: 16, y: 58, type: 'power',  required: true, description: 'VCC',                      compatibleWith: ['power'] },
      { name: 'WIPER', label: 'W',   x: 30, y: 58, type: 'analog', required: true, description: '와이퍼 출력 — ADC 핀 연결', compatibleWith: ['analog'] },
      { name: 'GND',   label: 'GND', x: 44, y: 58, type: 'ground', required: true, description: 'GND',                      compatibleWith: ['ground'] },
    ],
    electrical: { vccMin: 0, vccMax: 5.0, resistance: 10000 },
    validation: [{ rule: 'requires_adc_pin', pin: 'WIPER', message: 'WIPER는 ADC 핀에 연결', severity: 'warning' }],
    notes: ['analogRead(): 0~1023 (10bit) / 0~4095 (12bit)'],
  },

  // ── 서보 ──────────────────────────────────────────────────────────────────
  {
    id: 'servo',
    name: 'SG90 서보',
    category: 'actuator',
    tags: ['servo','모터','SG90','PWM'],
    description: '마이크로 서보 SG90. 0°~180° 각도 제어.',
    icon: '⚙️',
    element: 'sim-servo',
    width: 60, height: 72,
    defaultProps: { angle: 90 },
    props: [
      { key: 'angle', label: '초기 각도', type: 'number', default: 90, min: 0, max: 180, unit: '°' },
    ],
    pins: [
      { name: 'VCC',    label: '빨강', x: 14, y: 72, type: 'power',  required: true, description: '전원 5V',    compatibleWith: ['power'] },
      { name: 'GND',    label: '갈색', x: 26, y: 72, type: 'ground', required: true, description: 'GND',        compatibleWith: ['ground'] },
      { name: 'SIGNAL', label: '주황', x: 38, y: 72, type: 'pwm',    required: true, description: 'PWM 제어신호', compatibleWith: ['pwm','digital'] },
    ],
    electrical: { vccMin: 4.8, vccMax: 6.0, currentMa: 150, maxCurrentMa: 650, logic: '5V' },
    validation: [
      { rule: 'requires_pwm_pin', pin: 'SIGNAL', message: 'PWM 핀에 연결 필요', severity: 'warning' },
      { rule: 'high_current', message: '시동 전류 최대 650mA — 외부 전원 권장', severity: 'warning' },
    ],
    notes: ['servo.write(angle)', '외부 5V 전원 사용 시 GND 공통 연결 필수'],
    datasheet: 'http://www.ee.ic.ac.uk/pcheung/teaching/DE1_EE/stores/sg90_datasheet.pdf',
  },

  // ── DHT22 ─────────────────────────────────────────────────────────────────
  {
    id: 'dht',
    name: 'DHT22',
    category: 'sensor',
    tags: ['dht','온도','humidity','temperature'],
    description: 'DHT11/DHT22 디지털 온습도 센서.',
    icon: '🌡️',
    element: 'sim-dht',
    width: 40, height: 56,
    defaultProps: { model: 'DHT22', temperature: 25, humidity: 60 },
    props: [
      { key: 'model',       label: '모델',    type: 'select', default: 'DHT22', options: ['DHT11','DHT22'] },
      { key: 'temperature', label: '온도',    type: 'number', default: 25, min: -40, max: 80, step: 0.1, unit: '°C' },
      { key: 'humidity',    label: '습도',    type: 'number', default: 60, min: 0,   max: 100, unit: '%' },
    ],
    pins: [
      { name: 'VCC',  label: 'VCC',  x: 10, y: 56, type: 'power',   required: true, description: 'VCC (3.3~5V)', compatibleWith: ['power'] },
      { name: 'DATA', label: 'DATA', x: 20, y: 56, type: 'digital', required: true, description: '데이터 + 4.7kΩ 풀업 필수', compatibleWith: ['digital','signal'] },
      { name: 'GND',  label: 'GND',  x: 30, y: 56, type: 'ground',  required: true, description: 'GND', compatibleWith: ['ground'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 5.5, currentMa: 2.5, maxCurrentMa: 10 },
    validation: [],
    notes: ['DATA 핀에 4.7kΩ 풀업 저항 필수', '샘플링 간격 최소 2초'],
    datasheet: 'https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf',
  },

  // ── HC-SR04 ───────────────────────────────────────────────────────────────
  {
    id: 'ultrasonic',
    name: 'HC-SR04',
    category: 'sensor',
    tags: ['ultrasonic','distance','거리','초음파'],
    description: 'HC-SR04 초음파 거리 센서. 2~400cm.',
    icon: '📡',
    element: 'sim-ultrasonic',
    width: 60, height: 50,
    defaultProps: { distanceCm: 20 },
    props: [
      { key: 'distanceCm', label: '거리', type: 'number', default: 20, min: 2, max: 400, unit: 'cm' },
    ],
    pins: [
      { name: 'VCC',  label: 'VCC',  x:  8, y: 50, type: 'power',   required: true, description: '5V 전용',        compatibleWith: ['power'] },
      { name: 'TRIG', label: 'TRIG', x: 23, y: 50, type: 'digital', required: true, description: '트리거 — 10μs HIGH 펄스', compatibleWith: ['digital','signal'] },
      { name: 'ECHO', label: 'ECHO', x: 38, y: 50, type: 'output',  required: true, description: 'ECHO 출력 (5V!)', compatibleWith: ['digital','signal'] },
      { name: 'GND',  label: 'GND',  x: 53, y: 50, type: 'ground',  required: true, description: 'GND',             compatibleWith: ['ground'] },
    ],
    electrical: { vccMin: 5.0, vccMax: 5.0, currentMa: 15, maxCurrentMa: 20, logic: '5V' },
    validation: [{ rule: 'voltage_sensitive_5v', message: 'ECHO 5V 출력 — 3.3V MCU는 분압 회로 필요', severity: 'warning' }],
    notes: ['거리(cm) = 펄스폭(μs) / 58', '3.3V MCU: 1kΩ+2kΩ 분압 회로'],
    datasheet: 'https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf',
  },

  // ── LCD ───────────────────────────────────────────────────────────────────
  {
    id: 'lcd',
    name: 'I2C LCD 1602',
    category: 'display',
    tags: ['lcd','1602','i2c','display'],
    description: 'I2C 인터페이스 LCD 16×2.',
    icon: '🖥️',
    element: 'sim-lcd',
    width: 120, height: 60,
    defaultProps: { rows: 2, cols: 16, i2cAddress: 0x27 },
    props: [
      { key: 'rows',       label: '행',       type: 'select', default: 2,    options: ['2','4'] },
      { key: 'cols',       label: '열',       type: 'select', default: 16,   options: ['16','20'] },
      { key: 'i2cAddress', label: 'I2C 주소', type: 'select', default: 0x27, options: ['0x27','0x3F'] },
    ],
    pins: [
      { name: 'VCC', label: 'VCC', x:  8, y: 60, type: 'power',    required: true, description: '5V', compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 22, y: 60, type: 'ground',   required: true, description: 'GND', compatibleWith: ['ground'] },
      { name: 'SDA', label: 'SDA', x: 36, y: 60, type: 'i2c_sda',  required: true, description: 'I2C SDA', compatibleWith: ['i2c_sda','digital'] },
      { name: 'SCL', label: 'SCL', x: 50, y: 60, type: 'i2c_scl',  required: true, description: 'I2C SCL', compatibleWith: ['i2c_scl','digital'] },
    ],
    electrical: { vccMin: 5.0, vccMax: 5.0, currentMa: 40, logic: '5V' },
    validation: [],
    notes: ['라이브러리: LiquidCrystal_I2C', 'I2C 주소: 0x27 또는 0x3F'],
  },

  // ── OLED ──────────────────────────────────────────────────────────────────
  {
    id: 'oled',
    name: 'SSD1306 OLED',
    category: 'display',
    tags: ['oled','ssd1306','i2c','display'],
    description: 'SSD1306 I2C OLED 128×64.',
    icon: '📺',
    element: 'sim-oled',
    width: 90, height: 80,
    defaultProps: { i2cAddress: 0x3C },
    props: [
      { key: 'i2cAddress', label: 'I2C 주소', type: 'select', default: 0x3C, options: ['0x3C','0x3D'] },
    ],
    pins: [
      { name: 'VCC', label: 'VCC', x:  8, y: 90, type: 'power',   required: true, description: '3.3V 또는 5V', compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 22, y: 90, type: 'ground',  required: true, description: 'GND', compatibleWith: ['ground'] },
      { name: 'SDA', label: 'SDA', x: 36, y: 90, type: 'i2c_sda', required: true, description: 'I2C SDA', compatibleWith: ['i2c_sda','digital'] },
      { name: 'SCL', label: 'SCL', x: 50, y: 90, type: 'i2c_scl', required: true, description: 'I2C SCL', compatibleWith: ['i2c_scl','digital'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 5.0, currentMa: 20, logic: 'both' },
    validation: [],
    notes: ['라이브러리: Adafruit_SSD1306'],
    datasheet: 'https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf',
  },

  // ── 7-세그먼트 ─────────────────────────────────────────────────────────────
  {
    id: 'seven-segment',
    icon: '7️⃣',
    name: '7-세그먼트',
    category: 'display',
    tags: ['7segment','세그먼트','display','숫자'],
    description: '공통 캐소드 7-세그먼트.',
    element: 'sim-seven-segment',
    width: 44, height: 64,
    defaultProps: { color: '#ff2020' },
    props: [
      { key: 'color', label: '세그먼트 색상', type: 'color', default: '#ff2020' },
      { key: 'type',  label: '공통 단자',     type: 'select', default: 'cathode', options: ['cathode','anode'] },
    ],
    pins: [
      { name: 'A',   label: 'A',   x:  4, y: 64, type: 'input', required: false, description: '세그먼트 A', compatibleWith: ['digital','signal'] },
      { name: 'B',   label: 'B',   x:  8, y: 64, type: 'input', required: false, description: '세그먼트 B', compatibleWith: ['digital','signal'] },
      { name: 'C',   label: 'C',   x: 12, y: 64, type: 'input', required: false, description: '세그먼트 C', compatibleWith: ['digital','signal'] },
      { name: 'D',   label: 'D',   x: 16, y: 64, type: 'input', required: false, description: '세그먼트 D', compatibleWith: ['digital','signal'] },
      { name: 'E',   label: 'E',   x: 20, y: 64, type: 'input', required: false, description: '세그먼트 E', compatibleWith: ['digital','signal'] },
      { name: 'F',   label: 'F',   x: 24, y: 64, type: 'input', required: false, description: '세그먼트 F', compatibleWith: ['digital','signal'] },
      { name: 'G',   label: 'G',   x: 28, y: 64, type: 'input', required: false, description: '세그먼트 G', compatibleWith: ['digital','signal'] },
      { name: 'DP',  label: 'DP',  x: 32, y: 64, type: 'input', required: false, description: '소수점',     compatibleWith: ['digital','signal'] },
      { name: 'COM', label: 'COM', x: 36, y: 64, type: 'ground',required: true,  description: '공통 단자 → GND', compatibleWith: ['ground','power'] },
    ],
    electrical: { vccMin: 1.8, vccMax: 3.3, currentMa: 10, maxCurrentMa: 15 },
    validation: [{ rule: 'requires_series_resistor', message: '각 세그먼트에 330Ω 저항 필요', severity: 'error' }],
    notes: ['각 세그먼트에 330Ω', '74HC595로 핀 절약'],
  },

  // ── NeoPixel ──────────────────────────────────────────────────────────────
  {
    id: 'neopixel',
    name: 'NeoPixel WS2812B',
    category: 'active',
    tags: ['neopixel','ws2812','rgb strip','addressable'],
    description: 'WS2812B 주소 지정 RGB LED.',
    icon: '✨',
    element: 'sim-neopixel',
    width: 200, height: 44,
    defaultProps: { count: 8 },
    props: [
      { key: 'count', label: 'LED 개수', type: 'number', default: 8, min: 1, max: 64 },
    ],
    pins: [
      { name: 'VCC', label: '5V',  x:  8, y: 44, type: 'power',   required: true, description: '5V 전원',     compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 22, y: 44, type: 'ground',  required: true, description: 'GND',         compatibleWith: ['ground'] },
      { name: 'DIN', label: 'DIN', x: 36, y: 44, type: 'digital', required: true, description: '데이터 입력', compatibleWith: ['digital','signal'] },
    ],
    electrical: { vccMin: 4.5, vccMax: 5.5, currentMa: 60, maxCurrentMa: 60, logic: '5V' },
    validation: [{ rule: 'high_current', message: '1개당 60mA. 10개 이상은 외부 전원 필수', severity: 'warning' }],
    notes: ['10개 이상: 외부 5V 전원', 'DIN 앞에 300~500Ω 직렬 저항', '라이브러리: Adafruit_NeoPixel'],
    datasheet: 'https://cdn-shop.adafruit.com/datasheets/WS2812B.pdf',
  },

  // ── Arduino Uno R3 ────────────────────────────────────────────────────────
  {
    id: 'board-uno',
    name: 'Arduino Uno R3',
    category: 'mcu',
    tags: ['arduino','uno','atmega328p','board'],
    description: 'ATmega328P 기반 Arduino Uno Rev3.',
    icon: '🟢',
    element: 'sim-board-uno',
    width: 300, height: 200,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'D0',     label: 'D0/RX',  x: 284, y: 18, type: 'uart_rx', required: false, description: 'GPIO 0 / UART RX', compatibleWith: ['digital','signal','uart_rx'] },
      { name: 'D1',     label: 'D1/TX',  x: 270, y: 18, type: 'uart_tx', required: false, description: 'GPIO 1 / UART TX', compatibleWith: ['digital','signal','uart_tx'] },
      { name: 'D2',     label: 'D2',     x: 256, y: 18, type: 'digital', required: false, description: 'GPIO 2 / 인터럽트 0', compatibleWith: ['digital','signal'] },
      { name: 'D3~',    label: 'D3~',    x: 242, y: 18, type: 'pwm',     required: false, description: 'GPIO 3 / PWM', compatibleWith: ['digital','pwm','signal'] },
      { name: 'D4',     label: 'D4',     x: 228, y: 18, type: 'digital', required: false, description: 'GPIO 4', compatibleWith: ['digital','signal'] },
      { name: 'D5~',    label: 'D5~',    x: 214, y: 18, type: 'pwm',     required: false, description: 'GPIO 5 / PWM', compatibleWith: ['digital','pwm','signal'] },
      { name: 'D6~',    label: 'D6~',    x: 200, y: 18, type: 'pwm',     required: false, description: 'GPIO 6 / PWM', compatibleWith: ['digital','pwm','signal'] },
      { name: 'D7',     label: 'D7',     x: 186, y: 18, type: 'digital', required: false, description: 'GPIO 7', compatibleWith: ['digital','signal'] },
      { name: 'D8',     label: 'D8',     x: 162, y: 18, type: 'digital', required: false, description: 'GPIO 8', compatibleWith: ['digital','signal'] },
      { name: 'D9~',    label: 'D9~',    x: 148, y: 18, type: 'pwm',     required: false, description: 'GPIO 9 / PWM', compatibleWith: ['digital','pwm','signal'] },
      { name: 'D10~',   label: 'D10~',   x: 134, y: 18, type: 'spi_ss',  required: false, description: 'GPIO 10 / PWM / SPI SS', compatibleWith: ['digital','pwm','spi_ss'] },
      { name: 'D11~',   label: 'D11~',   x: 120, y: 18, type: 'spi_mosi',required: false, description: 'GPIO 11 / PWM / MOSI', compatibleWith: ['digital','pwm','spi_mosi'] },
      { name: 'D12',    label: 'D12',    x: 106, y: 18, type: 'spi_miso',required: false, description: 'GPIO 12 / MISO', compatibleWith: ['digital','spi_miso'] },
      { name: 'D13',    label: 'D13',    x:  92, y: 18, type: 'spi_sck', required: false, description: 'GPIO 13 / SCK / 내장 LED', compatibleWith: ['digital','spi_sck'] },
      { name: 'GND',    label: 'GND',    x:  60, y: 18, type: 'ground',  required: false, description: 'GND', compatibleWith: ['ground'] },
      { name: 'A0',     label: 'A0',     x:  37, y: 182, type: 'analog', required: false, description: 'ADC 0', compatibleWith: ['analog','digital'] },
      { name: 'A1',     label: 'A1',     x:  51, y: 182, type: 'analog', required: false, description: 'ADC 1', compatibleWith: ['analog','digital'] },
      { name: 'A2',     label: 'A2',     x:  65, y: 182, type: 'analog', required: false, description: 'ADC 2', compatibleWith: ['analog','digital'] },
      { name: 'A3',     label: 'A3',     x:  79, y: 182, type: 'analog', required: false, description: 'ADC 3', compatibleWith: ['analog','digital'] },
      { name: 'A4/SDA', label: 'A4/SDA', x:  93, y: 182, type: 'i2c_sda',required: false, description: 'ADC 4 / I2C SDA', compatibleWith: ['analog','i2c_sda'] },
      { name: 'A5/SCL', label: 'A5/SCL', x: 107, y: 182, type: 'i2c_scl',required: false, description: 'ADC 5 / I2C SCL', compatibleWith: ['analog','i2c_scl'] },
      { name: '5V',     label: '5V',     x: 172, y: 182, type: 'power',  required: false, description: '5V 출력 (최대 500mA)', compatibleWith: ['power'] },
      { name: '3V3',    label: '3.3V',   x: 186, y: 182, type: 'power',  required: false, description: '3.3V 출력 (최대 50mA)', compatibleWith: ['power'] },
    ],
    electrical: { vccMin: 5.0, vccMax: 5.0, currentMa: 50, maxCurrentMa: 200, pinMaxCurrentMa: 40, logic: '5V' },
    validation: [],
    notes: ['PWM: D3,D5,D6,D9,D10,D11', 'ADC 10bit', 'GPIO 핀당 최대 40mA'],
  },

  // ── ESP32-C3 Super Mini ───────────────────────────────────────────────────
  {
    id: 'board-esp32c3',
    name: 'ESP32-C3 Super Mini',
    category: 'mcu',
    tags: ['esp32','c3','wifi','ble','risc-v','3.3v'],
    description: 'ESP32-C3 RISC-V Wi-Fi/BLE 보드. 3.3V 동작.',
    icon: '🔵',
    element: 'sim-board-esp32c3',
    width: 120, height: 160,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'G0',  label: 'G0',  x:   8, y:  32, type: 'analog',   required: false, description: 'GPIO 0 / ADC / ⚠️ 부팅 핀', compatibleWith: ['digital','analog','signal'] },
      { name: 'G1',  label: 'G1',  x:   8, y:  46, type: 'analog',   required: false, description: 'GPIO 1 / ADC', compatibleWith: ['digital','analog','signal'] },
      { name: 'G2',  label: 'G2',  x:   8, y:  60, type: 'analog',   required: false, description: 'GPIO 2 / ADC', compatibleWith: ['digital','analog','signal'] },
      { name: 'G3',  label: 'G3',  x:   8, y:  74, type: 'analog',   required: false, description: 'GPIO 3 / ADC', compatibleWith: ['digital','analog','signal'] },
      { name: 'G4',  label: 'G4',  x:   8, y:  88, type: 'uart_tx',  required: false, description: 'GPIO 4 / UART TX', compatibleWith: ['digital','uart_tx','signal'] },
      { name: 'G5',  label: 'G5',  x:   8, y: 102, type: 'uart_rx',  required: false, description: 'GPIO 5 / UART RX', compatibleWith: ['digital','uart_rx','signal'] },
      { name: 'G6',  label: 'G6',  x:   8, y: 116, type: 'spi_sck',  required: false, description: 'GPIO 6 / SPI SCK', compatibleWith: ['digital','spi_sck','signal'] },
      { name: 'G7',  label: 'G7',  x:   8, y: 130, type: 'spi_mosi', required: false, description: 'GPIO 7 / SPI MOSI', compatibleWith: ['digital','spi_mosi','signal'] },
      { name: '5V',  label: '5V',  x: 112, y:  32, type: 'power',    required: false, description: 'USB 5V 출력', compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 112, y:  46, type: 'ground',   required: false, description: 'GND', compatibleWith: ['ground'] },
      { name: '3V3', label: '3.3V',x: 112, y:  60, type: 'power',    required: false, description: '3.3V 출력', compatibleWith: ['power'] },
      { name: 'G8',  label: 'G8',  x: 112, y:  74, type: 'digital',  required: false, description: 'GPIO 8 / 내장 LED (Active LOW)', compatibleWith: ['digital','signal'] },
      { name: 'G9',  label: 'G9',  x: 112, y:  88, type: 'digital',  required: false, description: 'GPIO 9 / ⚠️ 부팅 핀', compatibleWith: ['digital','signal'] },
      { name: 'G10', label: 'G10', x: 112, y: 102, type: 'spi_ss',   required: false, description: 'GPIO 10 / SPI SS', compatibleWith: ['digital','spi_ss','signal'] },
      { name: 'G20', label: 'G20', x: 112, y: 116, type: 'i2c_sda',  required: false, description: 'GPIO 20 / I2C SDA / SPI MISO', compatibleWith: ['digital','i2c_sda','spi_miso'] },
      { name: 'G21', label: 'G21', x: 112, y: 130, type: 'i2c_scl',  required: false, description: 'GPIO 21 / I2C SCL', compatibleWith: ['digital','i2c_scl'] },
    ],
    electrical: { vccMin: 3.0, vccMax: 3.6, currentMa: 80, maxCurrentMa: 600, pinMaxCurrentMa: 40, logic: '3.3V' },
    validation: [{ rule: 'voltage_sensitive_3v3', message: '3.3V 보드 — 5V GPIO 연결 절대 금지', severity: 'error' }],
    notes: ['⚠️ GPIO 5V 연결 금지', 'PWM: ledcWrite()', 'ADC 12bit (G0~G5)', '내장 LED G8: LOW=켜짐'],
    datasheet: 'https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf',
  },

  // ── 커패시터 ──────────────────────────────────────────────────────────────
  {
    id: 'capacitor',
    name: '커패시터',
    category: 'passive',
    tags: ['capacitor','커패시터','전해','100uF','bypass'],
    description: '전해 커패시터 100µF. 극성 있음.',
    icon: '⚡',
    element: 'sim-generic',
    width: 40, height: 60,
    defaultProps: { capacitance: 100 },
    props: [
      { key: 'capacitance', label: '용량', type: 'number', default: 100, min: 1, max: 100000, unit: 'µF' },
      { key: 'voltage',     label: '내압', type: 'select', default: '25V', options: ['6.3V','10V','16V','25V','50V'] },
    ],
    pins: [
      { name: 'PLUS',  label: '+', x: 12, y: 60, type: 'power',  required: true, description: '양극 (+)', compatibleWith: ['power','digital','signal'] },
      { name: 'MINUS', label: '−', x: 28, y: 60, type: 'ground', required: true, description: '음극 (−)', compatibleWith: ['ground'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="0 0 40 60">
  <!-- 몸체 shadow -->
  <rect x="6" y="11" width="30" height="41" rx="5" fill="#0d1926"/>
  <!-- 몸체 (알루미늄 원통형) -->
  <rect x="5" y="10" width="30" height="42" rx="5" fill="#1e3248" stroke="#2a4050" stroke-width="1.2"/>
  <!-- 몸체 우측 어두운 면 -->
  <rect x="28" y="10" width="7" height="42" rx="4" fill="#0d1926" opacity="0.5"/>
  <!-- 왼쪽 흰색 스트라이프 (음극 마커) -->
  <rect x="5" y="10" width="8" height="42" rx="4" fill="#c8d8e0" opacity="0.9"/>
  <!-- 마이너스 기호들 -->
  <text x="9" y="26" font-family="sans-serif" font-size="6" fill="#2a3848" text-anchor="middle" font-weight="bold">−</text>
  <text x="9" y="36" font-family="sans-serif" font-size="6" fill="#2a3848" text-anchor="middle" font-weight="bold">−</text>
  <text x="9" y="46" font-family="sans-serif" font-size="6" fill="#2a3848" text-anchor="middle" font-weight="bold">−</text>
  <!-- 용량 텍스트 -->
  <text x="23" y="31" font-family="monospace" font-size="5" fill="#8ab4cc" text-anchor="middle">100µF</text>
  <text x="23" y="40" font-family="monospace" font-size="4.5" fill="#6a8a9a" text-anchor="middle">25V</text>
  <!-- 상단 캡 (알루미늄) -->
  <rect x="5" y="6" width="30" height="7" rx="3" fill="#8898a8" stroke="#8899a8" stroke-width="0.8"/>
  <!-- 캡 하이라이트 -->
  <rect x="8" y="7" width="20" height="3" rx="2" fill="#c8d4d8" opacity="0.5"/>
  <!-- X자 벤트 라인 -->
  <line x1="14" y1="7.5" x2="26" y2="12" stroke="#6a7a88" stroke-width="0.8"/>
  <line x1="26" y1="7.5" x2="14" y2="12" stroke="#6a7a88" stroke-width="0.8"/>
  <!-- 리드선 + (긴 쪽) -->
  <line x1="12" y1="52" x2="12" y2="60" stroke="#c0c8d0" stroke-width="1.8"/>
  <!-- 리드선 - (짧은 쪽) -->
  <line x1="28" y1="54" x2="28" y2="60" stroke="#c0c8d0" stroke-width="1.8"/>
  <!-- 핀 표시 -->
  <text x="12" y="59" font-family="monospace" font-size="5" fill="#e8a040" text-anchor="middle">+</text>
  <text x="28" y="59" font-family="monospace" font-size="5" fill="#80b0d0" text-anchor="middle">−</text>
</svg>`,
    electrical: { vccMin: 0, vccMax: 25 },
    validation: [{ rule: 'polarity_sensitive', message: '극성 주의 — 반대 연결 시 파손', severity: 'error' }],
    notes: ['양극(+)을 전원 쪽에 연결', '디커플링용: VCC와 GND 사이에 배치', '내압 이상의 전압 연결 금지'],
  },

  // ── 정류 다이오드 ─────────────────────────────────────────────────────────
  {
    id: 'diode',
    name: '정류 다이오드',
    category: 'active',
    tags: ['diode','다이오드','1N4007','정류'],
    description: '1N4007 실리콘 정류 다이오드. 역방향 전압 보호.',
    icon: '➡️',
    element: 'sim-generic',
    width: 40, height: 60,
    defaultProps: {},
    props: [
      { key: 'model', label: '모델', type: 'select', default: '1N4007', options: ['1N4001','1N4004','1N4007','1N5819'] },
    ],
    pins: [
      { name: 'ANODE',   label: 'A', x: 12, y: 60, type: 'input',  required: true, description: '애노드 (+)', compatibleWith: ['power','digital','signal'] },
      { name: 'CATHODE', label: 'K', x: 28, y: 60, type: 'output', required: true, description: '캐소드 (−) — 띠 표시', compatibleWith: ['power','ground','signal'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="0 0 40 60">
  <!-- 리드선 왼쪽 (애노드) -->
  <line x1="0" y1="30" x2="8" y2="30" stroke="#b0b8c0" stroke-width="1.5"/>
  <!-- 몸체 (검은 원통형) -->
  <rect x="8" y="20" width="24" height="20" rx="3" fill="#1a1a1a" stroke="#444444" stroke-width="1"/>
  <!-- 왼쪽 끝 타원 (몸체 입체감) -->
  <ellipse cx="8" cy="30" rx="2" ry="10" fill="#333333" stroke="#555" stroke-width="0.5"/>
  <!-- 오른쪽 캐소드 흰색 링 -->
  <rect x="27" y="20" width="5" height="20" rx="1" fill="#e0e8ec" stroke="#aab8c0" stroke-width="0.5"/>
  <!-- 오른쪽 끝 타원 -->
  <ellipse cx="32" cy="30" rx="2" ry="10" fill="#d0dce4" stroke="#aab8c0" stroke-width="0.5"/>
  <!-- 모델명 텍스트 -->
  <text x="19" y="28" font-family="monospace" font-size="4.5" fill="#8ab0c0" text-anchor="middle">1N4007</text>
  <!-- 리드선 오른쪽 (캐소드) -->
  <line x1="32" y1="30" x2="40" y2="30" stroke="#b0b8c0" stroke-width="1.5"/>
  <!-- 아래로 내려오는 리드선 -->
  <line x1="12" y1="30" x2="12" y2="60" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="28" y1="30" x2="28" y2="60" stroke="#b0b8c0" stroke-width="1.5"/>
  <!-- 핀 레이블 -->
  <text x="12" y="57" font-family="monospace" font-size="4" fill="#aaaaaa" text-anchor="middle">A</text>
  <text x="28" y="57" font-family="monospace" font-size="4" fill="#cccccc" text-anchor="middle">K</text>
</svg>`,
    electrical: { vccMin: 0, vccMax: 1000, currentMa: 1000, maxCurrentMa: 1000 },
    validation: [],
    notes: ['캐소드(띠 쪽)가 출력', '순방향 전압강하 약 0.7V', '역방향 전압 최대 1000V (1N4007)'],
    datasheet: 'https://www.vishay.com/docs/88503/1n4001.pdf',
  },

  // ── NPN BJT 트랜지스터 ────────────────────────────────────────────────────
  {
    id: 'transistor-npn',
    name: 'NPN BJT',
    category: 'active',
    tags: ['transistor','npn','bjt','2N2222','스위칭'],
    description: 'NPN BJT 2N2222. 스위칭 및 증폭.',
    icon: '🔺',
    element: 'sim-generic',
    width: 50, height: 70,
    defaultProps: {},
    props: [
      { key: 'model', label: '모델', type: 'select', default: '2N2222', options: ['2N2222','BC547','S8050','2N3904'] },
    ],
    pins: [
      { name: 'BASE',     label: 'B', x: 10, y: 70, type: 'input',  required: true, description: '베이스 — GPIO 제어',    compatibleWith: ['digital','pwm','signal'] },
      { name: 'COLLECTOR',label: 'C', x: 25, y: 70, type: 'input',  required: true, description: '컬렉터 — 부하 연결',    compatibleWith: ['power','signal','output'] },
      { name: 'EMITTER',  label: 'E', x: 40, y: 70, type: 'ground', required: true, description: '이미터 — GND 연결',     compatibleWith: ['ground'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="70" viewBox="0 0 50 70">
  <!-- TO-92 D자형 몸체: 반원(위) + 평면(아래) -->
  <!-- 상단 반원 -->
  <path d="M10,42 A15,22 0 0,1 40,42 Z" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
  <!-- 하단 평면 직사각형 -->
  <rect x="10" y="28" width="30" height="14" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
  <!-- 상단 반원 하이라이트 -->
  <path d="M15,36 A10,14 0 0,1 35,36 Z" fill="#404040" opacity="0.5"/>
  <!-- 평면 아래쪽 선 -->
  <line x1="10" y1="42" x2="40" y2="42" stroke="#555" stroke-width="0.8"/>
  <!-- 모델명 -->
  <text x="25" y="23" font-family="monospace" font-size="5" fill="#8ab0c8" text-anchor="middle">2N2222</text>
  <text x="25" y="37" font-family="monospace" font-size="4.5" fill="#7090a0" text-anchor="middle">NPN</text>
  <!-- 1번 핀 dot (왼쪽 아래 모서리) -->
  <circle cx="12" cy="40" r="1.5" fill="#aabbcc"/>
  <!-- 3개 리드선 -->
  <line x1="10" y1="56" x2="10" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="25" y1="56" x2="25" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="40" y1="56" x2="40" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <!-- 리드선 연결부 (하단) -->
  <rect x="8" y="42" width="4" height="14" fill="#3a3a3a"/>
  <rect x="23" y="42" width="4" height="14" fill="#3a3a3a"/>
  <rect x="38" y="42" width="4" height="14" fill="#3a3a3a"/>
  <!-- 핀 레이블 -->
  <text x="10" y="68" font-family="monospace" font-size="4" fill="#aaaaaa" text-anchor="middle">B</text>
  <text x="25" y="68" font-family="monospace" font-size="4" fill="#aaaaaa" text-anchor="middle">C</text>
  <text x="40" y="68" font-family="monospace" font-size="4" fill="#aaaaaa" text-anchor="middle">E</text>
</svg>`,
    electrical: { vccMin: 0, vccMax: 40, currentMa: 600, maxCurrentMa: 600 },
    validation: [
      { rule: 'requires_series_resistor', pin: 'BASE', message: 'BASE와 GPIO 사이에 직렬 저항 필요 (1kΩ)', severity: 'error' },
    ],
    notes: ['BASE 저항: R = (Vcc - 0.7) / Ib', '베이스 전류 = 컬렉터 전류 / hFE (약 100)'],
    datasheet: 'https://www.onsemi.com/pdf/datasheet/p2n2222a-d.pdf',
  },

  // ── 릴레이 모듈 ──────────────────────────────────────────────────────────
  {
    id: 'relay',
    name: '5V 릴레이 모듈',
    category: 'actuator',
    tags: ['relay','릴레이','5V','스위치'],
    description: '5V 단채널 릴레이 모듈. AC/DC 고전압 제어.',
    icon: '🔌',
    element: 'sim-generic',
    width: 60, height: 80,
    defaultProps: {},
    props: [
      { key: 'triggerLevel', label: '트리거', type: 'select', default: 'LOW', options: ['LOW','HIGH'] },
    ],
    pins: [
      { name: 'IN',  label: 'IN',  x:  8, y: 80, type: 'input',  required: true,  description: '제어 신호 입력',    compatibleWith: ['digital','signal'] },
      { name: 'VCC', label: 'VCC', x: 20, y: 80, type: 'power',  required: true,  description: '모듈 전원 5V',      compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 32, y: 80, type: 'ground', required: true,  description: 'GND',               compatibleWith: ['ground'] },
      { name: 'NO',  label: 'NO',  x: 44, y: 80, type: 'output', required: false, description: '상시 열림 (Normal Open)',  compatibleWith: ['signal','power'] },
      { name: 'COM', label: 'COM', x: 56, y: 80, type: 'output', required: false, description: '공통 단자',          compatibleWith: ['signal','power'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80">
  <defs>
    <linearGradient id="relayPcb" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1a4a2a"/>
      <stop offset="100%" stop-color="#0e3018"/>
    </linearGradient>
  </defs>
  <!-- PCB 기판 (진한 파란색) -->
  <rect x="1" y="4" width="58" height="70" rx="3" fill="#1a3a6a" stroke="#0a2050" stroke-width="1.2"/>
  <!-- 검은 릴레이 블록 (상단 절반) -->
  <rect x="6" y="8" width="48" height="36" rx="3" fill="#1a1a1a" stroke="#333333" stroke-width="1.2"/>
  <!-- 릴레이 블록 내부 코일 심볼 -->
  <rect x="10" y="13" width="20" height="12" rx="1" fill="#0a0a0a" stroke="#3a3a3a" stroke-width="0.8"/>
  <path d="M11,19 Q13,15 15,19 Q17,23 19,19 Q21,15 23,19 Q25,23 27,19 Q29,15 30,19" fill="none" stroke="#5a7a5a" stroke-width="1"/>
  <!-- 접점 표시 -->
  <rect x="34" y="13" width="16" height="12" rx="1" fill="#0a0a0a" stroke="#3a3a3a" stroke-width="0.8"/>
  <line x1="36" y1="16" x2="48" y2="16" stroke="#888" stroke-width="0.8"/>
  <line x1="36" y1="22" x2="44" y2="22" stroke="#888" stroke-width="0.8"/>
  <line x1="44" y1="16" x2="44" y2="22" stroke="#888" stroke-width="0.8"/>
  <!-- RELAY 텍스트 -->
  <text x="30" y="34" font-family="monospace" font-size="5.5" fill="#8aaad0" text-anchor="middle">RELAY</text>
  <text x="30" y="42" font-family="monospace" font-size="4.5" fill="#5a7a9a" text-anchor="middle">5V 10A</text>
  <!-- LED 표시 (좌측 하단) -->
  <circle cx="9" cy="52" r="4" fill="#0000ff" opacity="0.7" stroke="#4488ff" stroke-width="0.8"/>
  <circle cx="9" cy="52" r="2" fill="#4488ff" opacity="0.9"/>
  <!-- 스크루 터미널 블록 (오른쪽) -->
  <rect x="38" y="48" width="18" height="14" rx="2" fill="#888888" stroke="#666" stroke-width="0.8"/>
  <rect x="39" y="50" width="5" height="10" rx="1" fill="#555"/>
  <rect x="45" y="50" width="5" height="10" rx="1" fill="#555"/>
  <rect x="50" y="50" width="5" height="10" rx="1" fill="#555"/>
  <!-- 핀 레이블 행 -->
  <text x="8"  y="72" font-family="monospace" font-size="4" fill="#90b0d0" text-anchor="middle">IN</text>
  <text x="20" y="72" font-family="monospace" font-size="4" fill="#90b0d0" text-anchor="middle">VCC</text>
  <text x="32" y="72" font-family="monospace" font-size="4" fill="#90b0d0" text-anchor="middle">GND</text>
  <text x="44" y="72" font-family="monospace" font-size="4" fill="#90b0d0" text-anchor="middle">NO</text>
  <text x="56" y="72" font-family="monospace" font-size="4" fill="#90b0d0" text-anchor="middle">COM</text>
  <!-- 핀 리드선 -->
  <line x1="8"  y1="74" x2="8"  y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="20" y1="74" x2="20" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="32" y1="74" x2="32" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="44" y1="74" x2="44" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="56" y1="74" x2="56" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
</svg>`,
    electrical: { vccMin: 5.0, vccMax: 5.0, currentMa: 70, maxCurrentMa: 100 },
    validation: [{ rule: 'high_voltage_warning', message: 'COM/NO/NC 단자에 고전압 주의', severity: 'warning' }],
    notes: ['코일 5V / 접점 250VAC 10A', '릴레이 코일 역기전력 → 프리휠링 다이오드 권장', 'LOW 트리거 모듈 일반적'],
  },

  // ── DC 모터 ───────────────────────────────────────────────────────────────
  {
    id: 'dc-motor',
    name: 'DC 모터',
    category: 'actuator',
    tags: ['motor','dc','모터','드라이버'],
    description: 'DC 모터. 모터 드라이버 IC 필수.',
    icon: '🌀',
    element: 'sim-generic',
    width: 40, height: 60,
    defaultProps: {},
    props: [
      { key: 'voltage', label: '정격 전압', type: 'select', default: '5V', options: ['3V','5V','6V','9V','12V'] },
    ],
    pins: [
      { name: 'PLUS',  label: '+', x: 12, y: 60, type: 'power',  required: true, description: '양극 (+)', compatibleWith: ['power','output'] },
      { name: 'MINUS', label: '−', x: 28, y: 60, type: 'ground', required: true, description: '음극 (−)', compatibleWith: ['ground','output'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="0 0 40 60">
  <!-- 모터 원통형 몸체 shadow -->
  <rect x="4" y="11" width="30" height="34" rx="4" fill="#303030"/>
  <!-- 모터 원통형 몸체 (측면) -->
  <rect x="3" y="10" width="30" height="34" rx="4" fill="#686868" stroke="#444" stroke-width="1"/>
  <!-- 몸체 중앙 하이라이트 -->
  <rect x="5" y="12" width="28" height="10" rx="3" fill="#909090" opacity="0.4"/>
  <!-- 모터 좌측 엔드캡 -->
  <ellipse cx="3" cy="27" rx="3" ry="17" fill="#888888" stroke="#555" stroke-width="0.8"/>
  <!-- 좌측 캡 하이라이트 -->
  <ellipse cx="2" cy="23" rx="1.5" ry="6" fill="#aaaaaa" opacity="0.5"/>
  <!-- 모터 우측 엔드캡 -->
  <ellipse cx="33" cy="27" rx="3" ry="17" fill="#888888" stroke="#555" stroke-width="0.8"/>
  <!-- 샤프트 (오른쪽 돌출) -->
  <rect x="33" y="24" width="7" height="6" rx="1" fill="#c0c0c0" stroke="#999" stroke-width="0.8"/>
  <!-- 모터 내부 코어 -->
  <ellipse cx="18" cy="27" rx="9" ry="9" fill="#383838" stroke="#505050" stroke-width="0.8"/>
  <ellipse cx="18" cy="27" rx="5" ry="5" fill="#282828" stroke="#484848" stroke-width="0.6"/>
  <!-- DC MOTOR 텍스트 -->
  <text x="18" y="25" font-family="monospace" font-size="4" fill="#dddddd" text-anchor="middle">DC</text>
  <text x="18" y="31" font-family="monospace" font-size="3.5" fill="#bbbbbb" text-anchor="middle">MOTOR</text>
  <!-- 터미널 리드선 -->
  <line x1="12" y1="44" x2="12" y2="60" stroke="#e03030" stroke-width="1.8"/>
  <line x1="28" y1="44" x2="28" y2="60" stroke="#303080" stroke-width="1.8"/>
  <!-- 터미널 표시 -->
  <text x="12" y="57" font-family="monospace" font-size="4.5" fill="#ff6060" text-anchor="middle">+</text>
  <text x="28" y="57" font-family="monospace" font-size="4.5" fill="#6060ff" text-anchor="middle">−</text>
</svg>`,
    electrical: { vccMin: 3.0, vccMax: 12.0, currentMa: 200, maxCurrentMa: 1000 },
    validation: [{ rule: 'requires_driver', message: 'GPIO 직결 금지 — L298N/L9110S 드라이버 사용', severity: 'error' }],
    notes: ['GPIO 직결 절대 금지', 'L298N 또는 L9110S 드라이버 사용', '역기전력 보호 다이오드 권장'],
  },

  // ── IR LED ────────────────────────────────────────────────────────────────
  {
    id: 'ir-led',
    name: '적외선 LED',
    category: 'active',
    tags: ['ir','led','적외선','infrared','remote'],
    description: '940nm 적외선 LED. 리모컨 송신.',
    icon: '💫',
    element: 'sim-generic',
    width: 40, height: 60,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'ANODE',   label: '+', x: 14, y: 60, type: 'input',  required: true, description: '양극 (+)', compatibleWith: ['digital','pwm','signal','power'] },
      { name: 'CATHODE', label: '−', x: 26, y: 60, type: 'ground', required: true, description: '음극 (−)', compatibleWith: ['ground'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="0 0 40 60">
  <!-- 실린더 몸체 -->
  <rect x="12" y="26" width="16" height="16" fill="#606878" stroke="#404858" stroke-width="0.8"/>
  <!-- 플랫 사이드 (극성 구분) - 오른쪽이 평평한 면 (캐소드) -->
  <rect x="25" y="26" width="3" height="16" fill="#404858"/>
  <!-- 돔형 상단 shadow -->
  <ellipse cx="21" cy="27" rx="8" ry="8" fill="#303848"/>
  <!-- 돔형 상단 -->
  <ellipse cx="20" cy="26" rx="8" ry="8" fill="#606878" stroke="#505868" stroke-width="0.8"/>
  <!-- 돔 내부 어두운 중심 (IR 렌즈 느낌) -->
  <ellipse cx="20" cy="26" rx="5" ry="5" fill="#404858"/>
  <!-- 돔 반사광 -->
  <ellipse cx="17" cy="23" rx="3" ry="2" fill="#c8d8e8" opacity="0.35"/>
  <!-- 렌즈 하이라이트 -->
  <ellipse cx="17" cy="23" rx="3" ry="2.5" fill="white" opacity="0.3"/>
  <!-- IR 방출 파선 (위쪽) -->
  <path d="M14,16 Q16,13 18,16" fill="none" stroke="#9090c0" stroke-width="1" stroke-dasharray="2,1.5" opacity="0.8"/>
  <path d="M19,13 Q21,10 23,13" fill="none" stroke="#9090c0" stroke-width="1" stroke-dasharray="2,1.5" opacity="0.8"/>
  <path d="M11,12 Q13,9 15,12" fill="none" stroke="#9090c0" stroke-width="0.8" stroke-dasharray="1.5,1.5" opacity="0.6"/>
  <!-- 리드선 (+ 길게, - 짧게) -->
  <line x1="14" y1="42" x2="14" y2="60" stroke="#c0c8d0" stroke-width="1.5"/>
  <line x1="26" y1="42" x2="26" y2="60" stroke="#c0c8d0" stroke-width="1.5"/>
  <!-- 플러스 기호 표시 (긴 리드) -->
  <text x="14" y="57" font-family="monospace" font-size="4" fill="#88aacc" text-anchor="middle">+</text>
  <text x="26" y="57" font-family="monospace" font-size="4" fill="#aaaaaa" text-anchor="middle">−</text>
  <!-- IR 레이블 -->
  <text x="20" y="35" font-family="monospace" font-size="3.5" fill="#c0c8d8" text-anchor="middle">IR</text>
</svg>`,
    electrical: { vccMin: 1.2, vccMax: 1.6, currentMa: 20, maxCurrentMa: 100 },
    validation: [{ rule: 'requires_series_resistor', pin: 'ANODE', message: 'ANODE와 GPIO 사이에 직렬 저항 필요', severity: 'error' }],
    notes: ['38kHz 캐리어 필요 (IRremote 라이브러리)', '저항: (Vcc - 1.4) / 0.02 Ω', '라이브러리: IRremote'],
  },

  // ── IR 수신기 ─────────────────────────────────────────────────────────────
  {
    id: 'ir-receiver',
    name: 'IR 수신기',
    category: 'sensor',
    tags: ['ir','receiver','수신기','TSOP38238','remote'],
    description: 'TSOP38238 38kHz IR 수신기. 리모컨 수신.',
    icon: '👁️',
    element: 'sim-generic',
    width: 50, height: 70,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'OUT', label: 'OUT', x: 10, y: 70, type: 'output',  required: true, description: '디지털 출력 (Active LOW)', compatibleWith: ['digital','signal'] },
      { name: 'VCC', label: 'VCC', x: 25, y: 70, type: 'power',   required: true, description: '전원 2.5~5.5V',           compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 40, y: 70, type: 'ground',  required: true, description: 'GND',                     compatibleWith: ['ground'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="70" viewBox="0 0 50 70">
  <!-- 몸체 직사각형 (검은) -->
  <rect x="7" y="16" width="36" height="40" rx="2" fill="#111111" stroke="#333333" stroke-width="1"/>
  <!-- 앞면 둥근 감지 렌즈 (볼록한 전면) -->
  <rect x="7" y="16" width="36" height="18" rx="2" fill="#0a0808" stroke="#2a2020" stroke-width="0.8"/>
  <!-- IR 수신 렌즈 (어두운 돔) shadow -->
  <ellipse cx="26" cy="26" rx="13" ry="8" fill="#000000"/>
  <!-- IR 수신 렌즈 -->
  <ellipse cx="25" cy="25" rx="13" ry="8" fill="#120808" stroke="#1a1010" stroke-width="0.6"/>
  <!-- 렌즈 미세 반사광 -->
  <ellipse cx="21" cy="23" rx="4" ry="2.5" fill="#2a1818" opacity="0.6"/>
  <!-- 렌즈 반사광 -->
  <ellipse cx="21" cy="22" rx="4" ry="3" fill="#1a0808" opacity="0.7"/>
  <ellipse cx="19" cy="21" rx="1.5" ry="1" fill="#333322" opacity="0.5"/>
  <!-- VS1838 텍스트 -->
  <text x="25" y="42" font-family="monospace" font-size="5" fill="#7090a8" text-anchor="middle">VS1838</text>
  <text x="25" y="52" font-family="monospace" font-size="4" fill="#506878" text-anchor="middle">IR RX</text>
  <!-- 3개 리드선 -->
  <line x1="10" y1="56" x2="10" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="25" y1="56" x2="25" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="40" y1="56" x2="40" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <!-- 핀 레이블 -->
  <text x="10" y="67" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">OUT</text>
  <text x="25" y="67" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">VCC</text>
  <text x="40" y="67" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">GND</text>
</svg>`,
    electrical: { vccMin: 2.5, vccMax: 5.5, currentMa: 5, maxCurrentMa: 10 },
    validation: [],
    notes: ['라이브러리: IRremote', 'OUT 핀 → GPIO 디지털 입력', '수신 거리 최대 15m'],
    datasheet: 'https://www.vishay.com/docs/82491/tsop382.pdf',
  },

  // ── 홀 효과 센서 ──────────────────────────────────────────────────────────
  {
    id: 'hall-sensor',
    name: '홀 효과 센서',
    category: 'sensor',
    tags: ['hall','자석','sensor','A3144','magnetic'],
    description: 'A3144 홀 효과 센서. 자석 근접 감지.',
    icon: '🧲',
    element: 'sim-generic',
    width: 50, height: 70,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'VCC', label: 'VCC', x: 10, y: 70, type: 'power',   required: true, description: '전원 4.5~24V',           compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 25, y: 70, type: 'ground',  required: true, description: 'GND',                    compatibleWith: ['ground'] },
      { name: 'OUT', label: 'OUT', x: 40, y: 70, type: 'output',  required: true, description: '오픈 컬렉터 출력 (풀업 필요)', compatibleWith: ['digital','signal'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="70" viewBox="0 0 50 70">
  <!-- TO-92 D자형 몸체 -->
  <path d="M10,48 A20,22 0 0,1 40,48 Z" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
  <rect x="10" y="34" width="30" height="14" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
  <!-- 상단 하이라이트 -->
  <path d="M15,42 A13,14 0 0,1 35,42 Z" fill="#404040" opacity="0.5"/>
  <line x1="10" y1="48" x2="40" y2="48" stroke="#555" stroke-width="0.8"/>
  <!-- 1번 핀 dot -->
  <circle cx="12" cy="46" r="1.5" fill="#aabbcc"/>
  <!-- A3144 텍스트 -->
  <text x="25" y="27" font-family="monospace" font-size="5" fill="#8ab0c8" text-anchor="middle">A3144</text>
  <!-- 자석 N/S 아이콘 -->
  <rect x="10" y="12" width="12" height="9" rx="2" fill="#cc2222" stroke="#aa1111" stroke-width="0.8"/>
  <text x="16" y="19.5" font-family="monospace" font-size="6" fill="white" text-anchor="middle" font-weight="bold">N</text>
  <rect x="28" y="12" width="12" height="9" rx="2" fill="#2255cc" stroke="#1133aa" stroke-width="0.8"/>
  <text x="34" y="19.5" font-family="monospace" font-size="6" fill="white" text-anchor="middle" font-weight="bold">S</text>
  <!-- 자력선 표시 -->
  <path d="M22,16.5 Q25,13 28,16.5" fill="none" stroke="#888" stroke-width="0.8" stroke-dasharray="1.5,1"/>
  <!-- 3개 리드선 -->
  <line x1="10" y1="56" x2="10" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="25" y1="56" x2="25" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="40" y1="56" x2="40" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <rect x="8" y="48" width="4" height="8" fill="#3a3a3a"/>
  <rect x="23" y="48" width="4" height="8" fill="#3a3a3a"/>
  <rect x="38" y="48" width="4" height="8" fill="#3a3a3a"/>
  <!-- 핀 레이블 -->
  <text x="10" y="68" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">VCC</text>
  <text x="25" y="68" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">GND</text>
  <text x="40" y="68" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">OUT</text>
</svg>`,
    electrical: { vccMin: 4.5, vccMax: 24.0, currentMa: 10, maxCurrentMa: 25 },
    validation: [{ rule: 'requires_pullup', pin: 'OUT', message: 'OUT 핀에 10kΩ 풀업 저항 필요', severity: 'warning' }],
    notes: ['OUT 핀에 10kΩ 풀업 저항 필요', '오픈 컬렉터 출력 (Active LOW)', '자석 S극 감지'],
    datasheet: 'https://www.allegromicro.com/en/products/sense/switches-and-latches/unipolar-switches/a3141-2-3-4',
  },

  // ── LM35 온도 센서 ────────────────────────────────────────────────────────
  {
    id: 'lm35',
    name: 'LM35 온도센서',
    category: 'sensor',
    tags: ['lm35','온도','temperature','analog','sensor'],
    description: 'LM35 아날로그 온도 센서. 10mV/°C.',
    icon: '🌡️',
    element: 'sim-generic',
    width: 50, height: 70,
    defaultProps: { temperature: 25 },
    props: [
      { key: 'temperature', label: '온도', type: 'number', default: 25, min: -55, max: 150, step: 0.1, unit: '°C' },
    ],
    pins: [
      { name: 'VCC', label: 'VCC', x: 10, y: 70, type: 'power',  required: true, description: '전원 4~30V',             compatibleWith: ['power'] },
      { name: 'OUT', label: 'OUT', x: 25, y: 70, type: 'analog', required: true, description: '아날로그 출력 10mV/°C',  compatibleWith: ['analog'] },
      { name: 'GND', label: 'GND', x: 40, y: 70, type: 'ground', required: true, description: 'GND',                    compatibleWith: ['ground'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="70" viewBox="0 0 50 70">
  <!-- TO-92 D자형 몸체 -->
  <path d="M10,48 A20,22 0 0,1 40,48 Z" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
  <rect x="10" y="34" width="30" height="14" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
  <!-- 상단 하이라이트 -->
  <path d="M15,42 A13,14 0 0,1 35,42 Z" fill="#404040" opacity="0.5"/>
  <line x1="10" y1="48" x2="40" y2="48" stroke="#555" stroke-width="0.8"/>
  <!-- 1번 핀 dot -->
  <circle cx="12" cy="46" r="1.5" fill="#aabbcc"/>
  <!-- LM35 텍스트 -->
  <text x="25" y="44" font-family="monospace" font-size="5.5" fill="#8ab0c8" text-anchor="middle">LM35</text>
  <!-- 온도계 아이콘 (상단) -->
  <!-- 온도계 기둥 -->
  <rect x="22" y="10" width="6" height="18" rx="3" fill="#dddddd" stroke="#999" stroke-width="0.8"/>
  <!-- 온도계 구체 (하단 빨간) -->
  <circle cx="25" cy="28" r="5" fill="#cc2222" stroke="#aa0000" stroke-width="0.8"/>
  <!-- 온도계 수은 표시 -->
  <rect x="23.5" y="18" width="3" height="10" fill="#cc2222"/>
  <!-- 눈금 선들 -->
  <line x1="28" y1="14" x2="30" y2="14" stroke="#888" stroke-width="0.8"/>
  <line x1="28" y1="18" x2="30" y2="18" stroke="#888" stroke-width="0.8"/>
  <line x1="28" y1="22" x2="30" y2="22" stroke="#888" stroke-width="0.8"/>
  <!-- 3개 리드선 -->
  <line x1="10" y1="56" x2="10" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="25" y1="56" x2="25" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="40" y1="56" x2="40" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <rect x="8" y="48" width="4" height="8" fill="#3a3a3a"/>
  <rect x="23" y="48" width="4" height="8" fill="#3a3a3a"/>
  <rect x="38" y="48" width="4" height="8" fill="#3a3a3a"/>
  <!-- 핀 레이블 -->
  <text x="10" y="68" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">VCC</text>
  <text x="25" y="68" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">OUT</text>
  <text x="40" y="68" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">GND</text>
</svg>`,
    electrical: { vccMin: 4.0, vccMax: 30.0, currentMa: 0.06, maxCurrentMa: 10 },
    validation: [{ rule: 'requires_adc_pin', pin: 'OUT', message: 'OUT는 ADC 핀에 연결', severity: 'warning' }],
    notes: ['출력: 온도(°C) × 10mV', '25°C → 250mV', 'analogRead 변환: Vout × (Vref/ADCmax) / 0.01'],
    datasheet: 'https://www.ti.com/lit/ds/symlink/lm35.pdf',
  },

  // ── 아날로그 조이스틱 ──────────────────────────────────────────────────────
  {
    id: 'joystick',
    name: '아날로그 조이스틱',
    category: 'sensor',
    tags: ['joystick','조이스틱','analog','게임','ps2'],
    description: '듀얼 축 아날로그 조이스틱 모듈 (PS2 스타일).',
    icon: '🕹️',
    element: 'sim-generic',
    width: 60, height: 80,
    defaultProps: { vrx: 512, vry: 512, sw: 1 },
    props: [
      { key: 'vrx', label: 'X축',  type: 'number', default: 512, min: 0, max: 4095 },
      { key: 'vry', label: 'Y축',  type: 'number', default: 512, min: 0, max: 4095 },
      { key: 'sw',  label: '버튼', type: 'select', default: 1, options: ['0','1'] },
    ],
    pins: [
      { name: 'VCC', label: 'VCC', x:  8, y: 80, type: 'power',   required: true,  description: '3.3V~5V 전원',      compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 20, y: 80, type: 'ground',  required: true,  description: 'GND',               compatibleWith: ['ground'] },
      { name: 'VRX', label: 'VRX', x: 32, y: 80, type: 'analog',  required: false, description: 'X축 아날로그 출력', compatibleWith: ['analog'] },
      { name: 'VRY', label: 'VRY', x: 44, y: 80, type: 'analog',  required: false, description: 'Y축 아날로그 출력', compatibleWith: ['analog'] },
      { name: 'SW',  label: 'SW',  x: 56, y: 80, type: 'digital', required: false, description: '버튼 (Active LOW)', compatibleWith: ['digital','signal'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80">
  <!-- PCB 기판 (짙은 검은) -->
  <rect x="2" y="6" width="56" height="62" rx="4" fill="#1a1a2a" stroke="#2a2a3a" stroke-width="1.2"/>
  <!-- PCB 구멍들 (모서리) -->
  <circle cx="8" cy="12" r="2" fill="#0a0a18" stroke="#333" stroke-width="0.5"/>
  <circle cx="52" cy="12" r="2" fill="#0a0a18" stroke="#333" stroke-width="0.5"/>
  <circle cx="8" cy="62" r="2" fill="#0a0a18" stroke="#333" stroke-width="0.5"/>
  <circle cx="52" cy="62" r="2" fill="#0a0a18" stroke="#333" stroke-width="0.5"/>
  <!-- 조이스틱 베이스 원형 -->
  <circle cx="30" cy="34" r="20" fill="#2a2a3a" stroke="#3a3a4a" stroke-width="1"/>
  <!-- 조이스틱 기둥 shadow -->
  <rect x="27" y="25" width="8" height="14" rx="3" fill="#111122"/>
  <!-- 조이스틱 기둥 -->
  <rect x="26" y="24" width="8" height="14" rx="3" fill="#333344" stroke="#404050" stroke-width="0.8"/>
  <!-- 탑 shadow -->
  <circle cx="31" cy="23" r="9" fill="#111122"/>
  <!-- 조이스틱 탑 (원형 손잡이) -->
  <circle cx="30" cy="22" r="9" fill="#444455" stroke="#505060" stroke-width="1"/>
  <!-- 탑 하이라이트 -->
  <circle cx="27" cy="19" r="4" fill="#6a6a7a" opacity="0.4"/>
  <!-- 탑 하이라이트 -->
  <ellipse cx="27" cy="19" rx="4" ry="3" fill="#6a6a7a" opacity="0.5"/>
  <!-- 방향 표시 (십자형 점선) -->
  <line x1="30" y1="16" x2="30" y2="12" stroke="#8888aa" stroke-width="0.8" stroke-dasharray="1.5,1"/>
  <line x1="30" y1="28" x2="30" y2="32" stroke="#8888aa" stroke-width="0.8" stroke-dasharray="1.5,1"/>
  <line x1="24" y1="22" x2="20" y2="22" stroke="#8888aa" stroke-width="0.8" stroke-dasharray="1.5,1"/>
  <line x1="36" y1="22" x2="40" y2="22" stroke="#8888aa" stroke-width="0.8" stroke-dasharray="1.5,1"/>
  <!-- 핀 레이블 -->
  <text x="8"  y="72" font-family="monospace" font-size="3.5" fill="#8090a8" text-anchor="middle">VCC</text>
  <text x="20" y="72" font-family="monospace" font-size="3.5" fill="#8090a8" text-anchor="middle">GND</text>
  <text x="32" y="72" font-family="monospace" font-size="3.5" fill="#8090a8" text-anchor="middle">VRX</text>
  <text x="44" y="72" font-family="monospace" font-size="3.5" fill="#8090a8" text-anchor="middle">VRY</text>
  <text x="56" y="72" font-family="monospace" font-size="3.5" fill="#8090a8" text-anchor="middle">SW</text>
  <!-- 핀 리드선 -->
  <line x1="8"  y1="68" x2="8"  y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="20" y1="68" x2="20" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="32" y1="68" x2="32" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="44" y1="68" x2="44" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="56" y1="68" x2="56" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
</svg>`,
    electrical: { vccMin: 3.3, vccMax: 5.0 },
    validation: [],
    notes: ['VRX/VRY: ADC 핀 연결', 'SW: INPUT_PULLUP 사용', '중립 위치: 약 ADCmax/2'],
  },

  // ── 74HC595 시프트 레지스터 ───────────────────────────────────────────────
  {
    id: '74hc595',
    name: '74HC595',
    category: 'active',
    tags: ['shift register','595','시프트레지스터','확장','spi'],
    description: '8비트 직렬→병렬 시프트 레지스터. 핀 확장.',
    icon: '🔢',
    element: 'sim-generic',
    width: 60, height: 80,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'DS',    label: 'DS',    x:  8, y: 80, type: 'input',  required: true,  description: '직렬 데이터 입력 (SER)', compatibleWith: ['digital','signal','spi_mosi'] },
      { name: 'SH_CP', label: 'SHCP',  x: 18, y: 80, type: 'input',  required: true,  description: '시프트 클럭 (SRCLK)',    compatibleWith: ['digital','signal','spi_sck'] },
      { name: 'ST_CP', label: 'STCP',  x: 28, y: 80, type: 'input',  required: true,  description: '래치 클럭 (RCLK)',      compatibleWith: ['digital','signal'] },
      { name: 'MR',    label: 'MR',    x: 38, y: 80, type: 'input',  required: false, description: '마스터 리셋 (Active LOW)', compatibleWith: ['digital','power'] },
      { name: 'OE',    label: 'OE',    x: 48, y: 80, type: 'input',  required: false, description: '출력 인에이블 (Active LOW)', compatibleWith: ['digital','ground'] },
      { name: 'VCC',   label: 'VCC',   x: 58, y: 80, type: 'power',  required: true,  description: '전원 2~6V',             compatibleWith: ['power'] },
      { name: 'GND',   label: 'GND',   x: 68, y: 80, type: 'ground', required: true,  description: 'GND',                   compatibleWith: ['ground'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80">
  <!-- DIP-16 검은 IC 패키지 몸체 -->
  <rect x="10" y="8" width="40" height="62" rx="2" fill="#111111" stroke="#333333" stroke-width="1.2"/>
  <!-- 상단 중앙 반원 노치 -->
  <path d="M25,8 A5,5 0 0,1 35,8" fill="#222222" stroke="#444" stroke-width="0.8"/>
  <!-- 1번 핀 dot (왼쪽 아래 모서리) -->
  <circle cx="13" cy="65" r="2" fill="#556677"/>
  <!-- IC 텍스트 -->
  <text x="30" y="36" font-family="monospace" font-size="7" fill="#aaccdd" text-anchor="middle" font-weight="bold">74HC</text>
  <text x="30" y="48" font-family="monospace" font-size="7" fill="#aaccdd" text-anchor="middle" font-weight="bold">595</text>
  <text x="30" y="62" font-family="monospace" font-size="4" fill="#6688aa" text-anchor="middle">SHIFT REG</text>
  <!-- 왼쪽 핀선 (8개) -->
  <line x1="10" y1="16" x2="0" y2="16" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="10" y1="24" x2="0" y2="24" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="10" y1="32" x2="0" y2="32" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="10" y1="40" x2="0" y2="40" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="10" y1="48" x2="0" y2="48" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="10" y1="56" x2="0" y2="56" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="10" y1="64" x2="0" y2="64" stroke="#8899aa" stroke-width="1.2"/>
  <!-- 오른쪽 핀선 (8개) -->
  <line x1="50" y1="16" x2="60" y2="16" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="50" y1="24" x2="60" y2="24" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="50" y1="32" x2="60" y2="32" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="50" y1="40" x2="60" y2="40" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="50" y1="48" x2="60" y2="48" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="50" y1="56" x2="60" y2="56" stroke="#8899aa" stroke-width="1.2"/>
  <line x1="50" y1="64" x2="60" y2="64" stroke="#8899aa" stroke-width="1.2"/>
  <!-- 핀 레이블 (하단 연결핀: DS, SHCP, STCP, MR, OE, VCC, GND) -->
  <line x1="8"  y1="70" x2="8"  y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="18" y1="70" x2="18" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="28" y1="70" x2="28" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="38" y1="70" x2="38" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="48" y1="70" x2="48" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="58" y1="70" x2="58" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
</svg>`,
    electrical: { vccMin: 2.0, vccMax: 6.0, currentMa: 70, maxCurrentMa: 70 },
    validation: [],
    notes: ['DS→SH_CP 클럭→ST_CP 래치 순서', 'MR은 VCC에, OE는 GND에 연결', '라이브러리 없이 shiftOut() 사용'],
    datasheet: 'https://www.ti.com/lit/ds/symlink/sn74hc595.pdf',
  },

  // ── L298N 모터 드라이버 ──────────────────────────────────────────────────
  {
    id: 'l298n',
    name: 'L298N 모터 드라이버',
    category: 'actuator',
    tags: ['l298n','motor driver','모터드라이버','H브릿지','DC모터'],
    description: 'L298N 듀얼 H-브릿지 모터 드라이버. DC 모터 2개 제어.',
    icon: '⚙️',
    element: 'sim-generic',
    width: 80, height: 100,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'IN1', label: 'IN1', x:  8, y: 100, type: 'input',  required: true,  description: '모터A 방향 제어 1',  compatibleWith: ['digital','signal'] },
      { name: 'IN2', label: 'IN2', x: 20, y: 100, type: 'input',  required: true,  description: '모터A 방향 제어 2',  compatibleWith: ['digital','signal'] },
      { name: 'IN3', label: 'IN3', x: 32, y: 100, type: 'input',  required: true,  description: '모터B 방향 제어 1',  compatibleWith: ['digital','signal'] },
      { name: 'IN4', label: 'IN4', x: 44, y: 100, type: 'input',  required: true,  description: '모터B 방향 제어 2',  compatibleWith: ['digital','signal'] },
      { name: 'ENA', label: 'ENA', x: 56, y: 100, type: 'pwm',    required: false, description: '모터A PWM 속도 제어', compatibleWith: ['pwm','digital'] },
      { name: 'ENB', label: 'ENB', x: 68, y: 100, type: 'pwm',    required: false, description: '모터B PWM 속도 제어', compatibleWith: ['pwm','digital'] },
      { name: 'VCC', label: 'VCC', x: 56, y: 8,   type: 'power',  required: true,  description: '모터 전원 5~35V',    compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 68, y: 8,   type: 'ground', required: true,  description: 'GND',               compatibleWith: ['ground'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" viewBox="0 0 80 100">
  <!-- 빨간 PCB 기판 shadow -->
  <rect x="2" y="5" width="78" height="86" rx="3" fill="#550808"/>
  <!-- 빨간 PCB 기판 -->
  <rect x="1" y="4" width="78" height="86" rx="3" fill="#991111" stroke="#661111" stroke-width="1.2"/>
  <!-- 히트싱크 핀들 (상단) -->
  <rect x="18" y="4" width="4" height="8" rx="1" fill="#888888" stroke="#666" stroke-width="0.5"/>
  <rect x="24" y="4" width="4" height="8" rx="1" fill="#888888" stroke="#666" stroke-width="0.5"/>
  <rect x="30" y="4" width="4" height="8" rx="1" fill="#888888" stroke="#666" stroke-width="0.5"/>
  <rect x="36" y="4" width="4" height="8" rx="1" fill="#888888" stroke="#666" stroke-width="0.5"/>
  <rect x="42" y="4" width="4" height="8" rx="1" fill="#888888" stroke="#666" stroke-width="0.5"/>
  <rect x="48" y="4" width="4" height="8" rx="1" fill="#888888" stroke="#666" stroke-width="0.5"/>
  <rect x="54" y="4" width="4" height="8" rx="1" fill="#888888" stroke="#666" stroke-width="0.5"/>
  <!-- 히트싱크 베이스 -->
  <rect x="15" y="10" width="46" height="6" fill="#999999" stroke="#777" stroke-width="0.8"/>
  <!-- 중앙 L298N IC 칩 shadow -->
  <rect x="21" y="23" width="40" height="46" rx="2" fill="#111111"/>
  <!-- 중앙 L298N IC 칩 -->
  <rect x="20" y="22" width="40" height="46" rx="2" fill="#2a2a2a" stroke="#444" stroke-width="1.2"/>
  <!-- IC 칩 하이라이트 -->
  <rect x="22" y="24" width="36" height="8" rx="1" fill="#3a3a3a" opacity="0.6"/>
  <!-- IC 상단 노치 -->
  <path d="M35,22 A5,5 0 0,1 45,22" fill="#333" stroke="#555" stroke-width="0.8"/>
  <!-- L298N 텍스트 -->
  <text x="40" y="42" font-family="monospace" font-size="8" fill="#dddddd" text-anchor="middle" font-weight="bold">L298N</text>
  <text x="40" y="54" font-family="monospace" font-size="4.5" fill="#8899aa" text-anchor="middle">DUAL H-BRIDGE</text>
  <text x="40" y="62" font-family="monospace" font-size="4" fill="#667788" text-anchor="middle">MOTOR DRIVER</text>
  <!-- 왼쪽 스크루 터미널 (파란색) -->
  <rect x="2" y="26" width="16" height="34" rx="2" fill="#2244aa" stroke="#1133aa" stroke-width="0.8"/>
  <rect x="4" y="28" width="12" height="8" rx="1" fill="#1a33aa"/>
  <rect x="4" y="38" width="12" height="8" rx="1" fill="#1a33aa"/>
  <rect x="4" y="48" width="12" height="8" rx="1" fill="#1a33aa"/>
  <!-- 오른쪽 스크루 터미널 (파란색) -->
  <rect x="62" y="26" width="16" height="26" rx="2" fill="#2244aa" stroke="#1133aa" stroke-width="0.8"/>
  <rect x="64" y="28" width="12" height="8" rx="1" fill="#1a33aa"/>
  <rect x="64" y="38" width="12" height="8" rx="1" fill="#1a33aa"/>
  <!-- 전원 핀 표시 (상단 우측) -->
  <text x="56" y="20" font-family="monospace" font-size="4" fill="#ffccaa" text-anchor="middle">VCC</text>
  <text x="68" y="20" font-family="monospace" font-size="4" fill="#aaccff" text-anchor="middle">GND</text>
  <!-- 하단 제어핀 레이블 -->
  <text x="8"  y="94" font-family="monospace" font-size="3.5" fill="#cc9988" text-anchor="middle">IN1</text>
  <text x="20" y="94" font-family="monospace" font-size="3.5" fill="#cc9988" text-anchor="middle">IN2</text>
  <text x="32" y="94" font-family="monospace" font-size="3.5" fill="#cc9988" text-anchor="middle">IN3</text>
  <text x="44" y="94" font-family="monospace" font-size="3.5" fill="#cc9988" text-anchor="middle">IN4</text>
  <text x="56" y="94" font-family="monospace" font-size="3.5" fill="#88aacc" text-anchor="middle">ENA</text>
  <text x="68" y="94" font-family="monospace" font-size="3.5" fill="#88aacc" text-anchor="middle">ENB</text>
  <!-- 하단 핀 리드선 -->
  <line x1="8"  y1="90" x2="8"  y2="100" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="20" y1="90" x2="20" y2="100" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="32" y1="90" x2="32" y2="100" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="44" y1="90" x2="44" y2="100" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="56" y1="90" x2="56" y2="100" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="68" y1="90" x2="68" y2="100" stroke="#b0b8c0" stroke-width="1.5"/>
  <!-- 상단 전원 핀 리드선 -->
  <line x1="56" y1="4" x2="56" y2="8" stroke="#ffaa88" stroke-width="1.5"/>
  <line x1="68" y1="4" x2="68" y2="8" stroke="#88aaff" stroke-width="1.5"/>
</svg>`,
    electrical: { vccMin: 5.0, vccMax: 35.0, currentMa: 2000, maxCurrentMa: 4000 },
    validation: [],
    notes: ['모터 전원 5~35V', '채널당 최대 2A', 'ENA/ENB 점퍼 제거 후 PWM 연결', 'IN1=H, IN2=L → 정방향'],
    datasheet: 'https://www.st.com/resource/en/datasheet/l298.pdf',
  },

  // ── PIR 인체 감지 센서 ────────────────────────────────────────────────────
  {
    id: 'pir-sensor',
    name: 'PIR 센서',
    category: 'sensor',
    tags: ['pir','motion','인체감지','HC-SR501','passive infrared'],
    description: 'HC-SR501 수동 적외선 인체 감지 센서.',
    icon: '👤',
    element: 'sim-generic',
    width: 50, height: 70,
    defaultProps: { delay: 5, sensitivity: 'medium' },
    props: [
      { key: 'delay',       label: '지연 시간', type: 'number', default: 5, min: 1, max: 300, unit: 's' },
      { key: 'sensitivity', label: '감도',      type: 'select', default: 'medium', options: ['low','medium','high'] },
    ],
    pins: [
      { name: 'VCC', label: 'VCC', x: 10, y: 70, type: 'power',   required: true, description: '전원 5~20V',          compatibleWith: ['power'] },
      { name: 'OUT', label: 'OUT', x: 25, y: 70, type: 'output',  required: true, description: '디지털 출력 (HIGH=감지)', compatibleWith: ['digital','signal'] },
      { name: 'GND', label: 'GND', x: 40, y: 70, type: 'ground',  required: true, description: 'GND',                 compatibleWith: ['ground'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="70" viewBox="0 0 50 70">
  <!-- 초록 PCB 기판 shadow -->
  <rect x="4" y="31" width="44" height="30" rx="3" fill="#0a2a0a"/>
  <!-- 초록 PCB 기판 -->
  <rect x="3" y="30" width="44" height="30" rx="3" fill="#1e4a1e" stroke="#1a4a1a" stroke-width="1"/>
  <!-- 돔 shadow -->
  <ellipse cx="26" cy="31" rx="22" ry="22" fill="#a09050"/>
  <!-- 흰색/크림색 돔형 프레넬 렌즈 반구 -->
  <ellipse cx="25" cy="30" rx="22" ry="22" fill="#d4c890" stroke="#c8b888" stroke-width="1"/>
  <!-- 돔 중앙 밝은 부분 -->
  <ellipse cx="25" cy="30" rx="12" ry="12" fill="#e8dca8" opacity="0.6"/>
  <!-- 돔 하이라이트 -->
  <ellipse cx="20" cy="24" rx="6" ry="4" fill="#f8f0d0" opacity="0.4"/>
  <!-- 프레넬 렌즈 격자 패턴 -->
  <line x1="25" y1="8" x2="25" y2="52" stroke="#c0aa70" stroke-width="0.6" opacity="0.6"/>
  <line x1="3" y1="30" x2="47" y2="30" stroke="#c0aa70" stroke-width="0.6" opacity="0.6"/>
  <ellipse cx="25" cy="30" rx="14" ry="14" fill="none" stroke="#c0aa70" stroke-width="0.6" opacity="0.5"/>
  <ellipse cx="25" cy="30" rx="8" ry="8" fill="none" stroke="#c0aa70" stroke-width="0.6" opacity="0.5"/>
  <!-- 중앙 감지 소자 (약간 어둡게) -->
  <ellipse cx="25" cy="30" rx="4" ry="4" fill="#b8a868" opacity="0.8"/>
  <!-- HC-SR501 텍스트 -->
  <text x="25" y="48" font-family="monospace" font-size="4.5" fill="#90c090" text-anchor="middle">HC-SR501</text>
  <!-- 핀 리드선 -->
  <line x1="10" y1="60" x2="10" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="25" y1="60" x2="25" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="40" y1="60" x2="40" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <!-- 핀 레이블 -->
  <text x="10" y="67" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">VCC</text>
  <text x="25" y="67" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">OUT</text>
  <text x="40" y="67" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">GND</text>
</svg>`,
    electrical: { vccMin: 5.0, vccMax: 20.0, currentMa: 65, maxCurrentMa: 65 },
    validation: [],
    notes: ['감지 범위 120도 / 최대 7m', '전원 인가 후 약 60초 안정화 시간 필요', 'OUT HIGH = 인체 감지'],
  },

  // ── 사운드 센서 ───────────────────────────────────────────────────────────
  {
    id: 'sound-sensor',
    name: '사운드 센서',
    category: 'sensor',
    tags: ['sound','소리','마이크','microphone','sensor'],
    description: '디지털 사운드 감지 센서 모듈.',
    icon: '🎤',
    element: 'sim-generic',
    width: 50, height: 70,
    defaultProps: { threshold: 512 },
    props: [
      { key: 'threshold', label: '임계값', type: 'number', default: 512, min: 0, max: 4095 },
    ],
    pins: [
      { name: 'VCC',  label: 'VCC',  x: 10, y: 70, type: 'power',   required: true,  description: '전원 3.3~5V',          compatibleWith: ['power'] },
      { name: 'GND',  label: 'GND',  x: 25, y: 70, type: 'ground',  required: true,  description: 'GND',                  compatibleWith: ['ground'] },
      { name: 'DOUT', label: 'DOUT', x: 40, y: 70, type: 'output',  required: false, description: '디지털 출력 (임계 초과 시 HIGH)', compatibleWith: ['digital','signal'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="70" viewBox="0 0 50 70">
  <!-- 초록 PCB 기판 shadow -->
  <rect x="4" y="9" width="44" height="52" rx="3" fill="#0a2a0a"/>
  <!-- 초록 PCB 기판 -->
  <rect x="3" y="8" width="44" height="52" rx="3" fill="#1e4a1e" stroke="#1a4a1a" stroke-width="1"/>
  <!-- 마이크 원형 shadow -->
  <circle cx="19" cy="33" r="14" fill="#0a0a0a"/>
  <!-- 마이크 원형 (왼쪽 배치) -->
  <circle cx="18" cy="32" r="14" fill="#222222" stroke="#333333" stroke-width="1.2"/>
  <!-- 마이크 내부 밝은 부분 -->
  <circle cx="18" cy="32" r="10" fill="#2e2e2e"/>
  <!-- 마이크 중심 -->
  <circle cx="18" cy="32" r="5" fill="#181818"/>
  <!-- 마이크 금속 외관 링 -->
  <circle cx="18" cy="32" r="14" fill="none" stroke="#555555" stroke-width="1.5"/>
  <circle cx="18" cy="32" r="11" fill="none" stroke="#3a3a3a" stroke-width="0.8"/>
  <!-- 마이크 구멍 패턴 (dot pattern) -->
  <circle cx="14" cy="28" r="1.2" fill="#2a2a2a"/>
  <circle cx="18" cy="28" r="1.2" fill="#2a2a2a"/>
  <circle cx="22" cy="28" r="1.2" fill="#2a2a2a"/>
  <circle cx="14" cy="32" r="1.2" fill="#2a2a2a"/>
  <circle cx="18" cy="32" r="1.2" fill="#2a2a2a"/>
  <circle cx="22" cy="32" r="1.2" fill="#2a2a2a"/>
  <circle cx="14" cy="36" r="1.2" fill="#2a2a2a"/>
  <circle cx="18" cy="36" r="1.2" fill="#2a2a2a"/>
  <circle cx="22" cy="36" r="1.2" fill="#2a2a2a"/>
  <!-- 오른쪽 가변저항 (감도 조정) -->
  <circle cx="37" cy="28" r="6" fill="#224422" stroke="#336633" stroke-width="0.8"/>
  <circle cx="37" cy="28" r="3" fill="#1a331a"/>
  <line x1="37" y1="22" x2="40" y2="25" stroke="#88aa88" stroke-width="0.8"/>
  <!-- KY-037 텍스트 -->
  <text x="37" y="46" font-family="monospace" font-size="4.5" fill="#90c090" text-anchor="middle">KY-037</text>
  <!-- 핀 리드선 -->
  <line x1="10" y1="60" x2="10" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="25" y1="60" x2="25" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="40" y1="60" x2="40" y2="70" stroke="#b0b8c0" stroke-width="1.5"/>
  <!-- 핀 레이블 -->
  <text x="10" y="67" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">VCC</text>
  <text x="25" y="67" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">GND</text>
  <text x="40" y="67" font-family="monospace" font-size="3.5" fill="#aaaaaa" text-anchor="middle">DOUT</text>
</svg>`,
    electrical: { vccMin: 3.3, vccMax: 5.0, currentMa: 15, maxCurrentMa: 20 },
    validation: [],
    notes: ['가변저항으로 임계값 조정', 'DOUT: 소리 감지 시 HIGH (모듈에 따라 반전)', '민감도: 모듈 위 트리머 조정'],
  },

  // ── 스텝 모터 ─────────────────────────────────────────────────────────────
  {
    id: 'stepper-motor',
    name: '28BYJ-48 스텝 모터',
    category: 'actuator',
    tags: ['stepper','스텝모터','28BYJ-48','ULN2003','단극'],
    description: '28BYJ-48 5V 스텝 모터 (ULN2003 드라이버 사용).',
    icon: '🔧',
    element: 'sim-generic',
    width: 60, height: 80,
    defaultProps: {},
    props: [
      { key: 'speed', label: 'RPM', type: 'number', default: 15, min: 1, max: 15, unit: 'RPM' },
    ],
    pins: [
      { name: 'IN1', label: 'IN1', x:  8, y: 80, type: 'input', required: true, description: '코일 1 제어',  compatibleWith: ['digital','signal'] },
      { name: 'IN2', label: 'IN2', x: 20, y: 80, type: 'input', required: true, description: '코일 2 제어',  compatibleWith: ['digital','signal'] },
      { name: 'IN3', label: 'IN3', x: 32, y: 80, type: 'input', required: true, description: '코일 3 제어',  compatibleWith: ['digital','signal'] },
      { name: 'IN4', label: 'IN4', x: 44, y: 80, type: 'input', required: true, description: '코일 4 제어',  compatibleWith: ['digital','signal'] },
      { name: 'VCC', label: 'VCC', x: 56, y: 80, type: 'power', required: true, description: '전원 5V',       compatibleWith: ['power'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80">
  <!-- 파란 원형 모터 본체 shadow -->
  <circle cx="31" cy="35" r="28" fill="#060e28"/>
  <!-- 파란 원형 모터 본체 (정면) -->
  <circle cx="30" cy="34" r="28" fill="#1a3a7a" stroke="#1a3060" stroke-width="1.5"/>
  <!-- 본체 상단 하이라이트 -->
  <ellipse cx="22" cy="22" rx="14" ry="9" fill="#4466aa" opacity="0.4"/>
  <!-- 외부 테두리 링 (알루미늄) -->
  <circle cx="30" cy="34" r="28" fill="none" stroke="#3a5a9a" stroke-width="2"/>
  <!-- 내부 기어박스 원 -->
  <circle cx="30" cy="34" r="18" fill="#142a5a" stroke="#2a4a7a" stroke-width="1"/>
  <!-- 기어 이빨 패턴 -->
  <circle cx="30" cy="34" r="18" fill="none" stroke="#3a5a8a" stroke-width="0.5" stroke-dasharray="3,2"/>
  <!-- 중앙 샤프트 shadow -->
  <circle cx="31" cy="35" r="8" fill="#444444"/>
  <!-- 중앙 샤프트/기어 -->
  <circle cx="30" cy="34" r="8" fill="#888888" stroke="#888888" stroke-width="1"/>
  <!-- 샤프트 하이라이트 -->
  <circle cx="27" cy="31" r="3" fill="#bbbbbb" opacity="0.5"/>
  <!-- 샤프트 십자 슬롯 -->
  <line x1="30" y1="27" x2="30" y2="41" stroke="#555" stroke-width="1.5"/>
  <line x1="23" y1="34" x2="37" y2="34" stroke="#555" stroke-width="1.5"/>
  <!-- 고정 나사 구멍 (4개) -->
  <circle cx="12" cy="16" r="2.5" fill="#0a1a3a" stroke="#2a3a6a" stroke-width="0.8"/>
  <circle cx="48" cy="16" r="2.5" fill="#0a1a3a" stroke="#2a3a6a" stroke-width="0.8"/>
  <circle cx="12" cy="52" r="2.5" fill="#0a1a3a" stroke="#2a3a6a" stroke-width="0.8"/>
  <circle cx="48" cy="52" r="2.5" fill="#0a1a3a" stroke="#2a3a6a" stroke-width="0.8"/>
  <!-- 28BYJ-48 텍스트 -->
  <text x="30" y="32" font-family="monospace" font-size="4" fill="#aaccee" text-anchor="middle">28BYJ</text>
  <text x="30" y="39" font-family="monospace" font-size="4" fill="#aaccee" text-anchor="middle">-48</text>
  <!-- 5핀 커넥터 표시 (오른쪽 하단) -->
  <rect x="38" y="58" width="20" height="10" rx="2" fill="#ffffff" stroke="#cccccc" stroke-width="0.8"/>
  <rect x="39" y="59" width="3" height="8" rx="0.5" fill="#e0e0e0"/>
  <rect x="43" y="59" width="3" height="8" rx="0.5" fill="#e0e0e0"/>
  <rect x="47" y="59" width="3" height="8" rx="0.5" fill="#e0e0e0"/>
  <rect x="51" y="59" width="3" height="8" rx="0.5" fill="#e0e0e0"/>
  <rect x="55" y="59" width="2" height="8" rx="0.5" fill="#e0e0e0"/>
  <!-- 핀 레이블 -->
  <text x="8"  y="74" font-family="monospace" font-size="3.5" fill="#8899bb" text-anchor="middle">IN1</text>
  <text x="20" y="74" font-family="monospace" font-size="3.5" fill="#8899bb" text-anchor="middle">IN2</text>
  <text x="32" y="74" font-family="monospace" font-size="3.5" fill="#8899bb" text-anchor="middle">IN3</text>
  <text x="44" y="74" font-family="monospace" font-size="3.5" fill="#8899bb" text-anchor="middle">IN4</text>
  <text x="56" y="74" font-family="monospace" font-size="3.5" fill="#ffaa88" text-anchor="middle">VCC</text>
  <!-- 핀 리드선 -->
  <line x1="8"  y1="62" x2="8"  y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="20" y1="62" x2="20" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="32" y1="62" x2="32" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="44" y1="62" x2="44" y2="80" stroke="#b0b8c0" stroke-width="1.5"/>
  <line x1="56" y1="62" x2="56" y2="80" stroke="#ffaa88" stroke-width="1.5"/>
</svg>`,
    electrical: { vccMin: 5.0, vccMax: 5.0, currentMa: 240, maxCurrentMa: 500 },
    validation: [{ rule: 'requires_driver', message: 'ULN2003 드라이버 IC 또는 별도 드라이버 필수', severity: 'error' }],
    notes: ['ULN2003 드라이버 모듈 사용 권장', '스텝 각도: 5.625° / 64 스텝 = 1회전', '라이브러리: Stepper 또는 AccelStepper'],
  },
];
