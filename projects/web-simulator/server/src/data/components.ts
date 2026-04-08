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
];
