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

  // ── 커패시터 ──────────────────────────────────────────────────────────────
  {
    id: 'capacitor',
    name: '커패시터',
    category: 'passive',
    tags: ['capacitor','커패시터','전해','100uF','bypass'],
    description: '전해 커패시터 100µF. 극성 있음.',
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
  <rect x="4" y="10" width="32" height="42" rx="16" ry="16" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <rect x="4" y="10" width="32" height="14" rx="4" fill="#2a3a50"/>
  <text x="20" y="30" font-family="monospace" font-size="6" fill="#6a9ac0" text-anchor="middle">100µF</text>
  <text x="20" y="40" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">CAP</text>
  <circle cx="12" cy="58" r="3" fill="#5a8090"/>
  <circle cx="28" cy="58" r="3" fill="#5a8090"/>
  <text x="12" y="58" font-family="monospace" font-size="5" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">+</text>
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
  <rect x="6" y="12" width="28" height="38" rx="4" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <rect x="26" y="12" width="8" height="38" rx="0" fill="#2a1a30"/>
  <text x="20" y="30" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">1N4007</text>
  <text x="20" y="40" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">DIODE</text>
  <circle cx="12" cy="58" r="3" fill="#5a8090"/>
  <circle cx="28" cy="58" r="3" fill="#5a8090"/>
  <text x="12" y="58" font-family="monospace" font-size="5" fill="#aaaaaa" text-anchor="middle" dominant-baseline="middle">A</text>
  <text x="28" y="58" font-family="monospace" font-size="5" fill="#aaaaaa" text-anchor="middle" dominant-baseline="middle">K</text>
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
  <rect x="8" y="10" width="34" height="50" rx="5" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <text x="25" y="30" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">2N2222</text>
  <text x="25" y="42" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">NPN</text>
  <circle cx="10" cy="68" r="3" fill="#5a8090"/>
  <circle cx="25" cy="68" r="3" fill="#5a8090"/>
  <circle cx="40" cy="68" r="3" fill="#5a8090"/>
  <text x="10" y="68" font-family="monospace" font-size="4" fill="#aaaaaa" text-anchor="middle" dominant-baseline="middle">B</text>
  <text x="25" y="68" font-family="monospace" font-size="4" fill="#aaaaaa" text-anchor="middle" dominant-baseline="middle">C</text>
  <text x="40" y="68" font-family="monospace" font-size="4" fill="#aaaaaa" text-anchor="middle" dominant-baseline="middle">E</text>
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
  <rect x="2" y="6" width="56" height="64" rx="4" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <rect x="8" y="14" width="20" height="24" rx="3" fill="#0a1520" stroke="#2a4060" stroke-width="1"/>
  <rect x="32" y="14" width="22" height="24" rx="3" fill="#1a3020" stroke="#2a6040" stroke-width="1"/>
  <text x="30" y="52" font-family="monospace" font-size="6" fill="#6a9ac0" text-anchor="middle">RELAY</text>
  <text x="30" y="62" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">5V</text>
  <circle cx="8"  cy="78" r="3" fill="#5a8090"/>
  <circle cx="20" cy="78" r="3" fill="#5a8090"/>
  <circle cx="32" cy="78" r="3" fill="#5a8090"/>
  <circle cx="44" cy="78" r="3" fill="#5a8090"/>
  <circle cx="56" cy="78" r="3" fill="#5a8090"/>
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
  <ellipse cx="20" cy="32" rx="16" ry="20" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <ellipse cx="20" cy="32" rx="10" ry="14" fill="#0e1828" stroke="#2a4060" stroke-width="1"/>
  <text x="20" y="30" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">DC</text>
  <text x="20" y="40" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">MOTOR</text>
  <circle cx="12" cy="58" r="3" fill="#5a8090"/>
  <circle cx="28" cy="58" r="3" fill="#5a8090"/>
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
    element: 'sim-generic',
    width: 40, height: 60,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'ANODE',   label: '+', x: 14, y: 60, type: 'input',  required: true, description: '양극 (+)', compatibleWith: ['digital','pwm','signal','power'] },
      { name: 'CATHODE', label: '−', x: 26, y: 60, type: 'ground', required: true, description: '음극 (−)', compatibleWith: ['ground'] },
    ],
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="0 0 40 60">
  <circle cx="20" cy="28" r="14" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <circle cx="20" cy="28" r="8" fill="#0a1020" stroke="#2a4060" stroke-width="1"/>
  <text x="20" y="26" font-family="monospace" font-size="5" fill="#6a7a60" text-anchor="middle">IR</text>
  <text x="20" y="36" font-family="monospace" font-size="5" fill="#6a7a60" text-anchor="middle">LED</text>
  <circle cx="14" cy="58" r="3" fill="#5a8090"/>
  <circle cx="26" cy="58" r="3" fill="#5a8090"/>
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
  <rect x="6" y="10" width="38" height="50" rx="4" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <rect x="10" y="14" width="30" height="28" rx="3" fill="#0a0e18" stroke="#2a4060" stroke-width="1"/>
  <text x="25" y="52" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">TSOP</text>
  <text x="25" y="60" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">38238</text>
  <circle cx="10" cy="68" r="3" fill="#5a8090"/>
  <circle cx="25" cy="68" r="3" fill="#5a8090"/>
  <circle cx="40" cy="68" r="3" fill="#5a8090"/>
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
  <rect x="6" y="10" width="38" height="50" rx="4" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <text x="25" y="30" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">A3144</text>
  <text x="25" y="42" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">HALL</text>
  <text x="25" y="52" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">SENSOR</text>
  <circle cx="10" cy="68" r="3" fill="#5a8090"/>
  <circle cx="25" cy="68" r="3" fill="#5a8090"/>
  <circle cx="40" cy="68" r="3" fill="#5a8090"/>
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
  <rect x="6" y="10" width="38" height="50" rx="4" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <text x="25" y="30" font-family="monospace" font-size="6" fill="#6a9ac0" text-anchor="middle">LM35</text>
  <text x="25" y="42" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">TEMP</text>
  <text x="25" y="52" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">10mV/°C</text>
  <circle cx="10" cy="68" r="3" fill="#5a8090"/>
  <circle cx="25" cy="68" r="3" fill="#5a8090"/>
  <circle cx="40" cy="68" r="3" fill="#5a8090"/>
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
  <rect x="2" y="6" width="56" height="64" rx="4" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <circle cx="30" cy="34" r="18" fill="#0e1828" stroke="#2a4060" stroke-width="1.5"/>
  <circle cx="30" cy="34" r="8" fill="#1a2a40" stroke="#3a5070" stroke-width="1"/>
  <text x="30" y="62" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">JOYSTICK</text>
  <circle cx="8"  cy="78" r="3" fill="#5a8090"/>
  <circle cx="20" cy="78" r="3" fill="#5a8090"/>
  <circle cx="32" cy="78" r="3" fill="#5a8090"/>
  <circle cx="44" cy="78" r="3" fill="#5a8090"/>
  <circle cx="56" cy="78" r="3" fill="#5a8090"/>
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
  <rect x="2" y="6" width="56" height="64" rx="3" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <rect x="24" y="2" width="12" height="8" rx="2" fill="#0e1828" stroke="#3a5070" stroke-width="1"/>
  <text x="30" y="32" font-family="monospace" font-size="6" fill="#6a9ac0" text-anchor="middle">74HC</text>
  <text x="30" y="44" font-family="monospace" font-size="6" fill="#6a9ac0" text-anchor="middle">595</text>
  <text x="30" y="58" font-family="monospace" font-size="5" fill="#5a7a90" text-anchor="middle">SHIFT REG</text>
  <line x1="2" y1="22" x2="0" y2="22" stroke="#5a8090" stroke-width="1"/>
  <line x1="2" y1="30" x2="0" y2="30" stroke="#5a8090" stroke-width="1"/>
  <line x1="2" y1="38" x2="0" y2="38" stroke="#5a8090" stroke-width="1"/>
  <line x1="2" y1="46" x2="0" y2="46" stroke="#5a8090" stroke-width="1"/>
  <line x1="58" y1="22" x2="60" y2="22" stroke="#5a8090" stroke-width="1"/>
  <line x1="58" y1="30" x2="60" y2="30" stroke="#5a8090" stroke-width="1"/>
  <line x1="58" y1="38" x2="60" y2="38" stroke="#5a8090" stroke-width="1"/>
  <line x1="58" y1="46" x2="60" y2="46" stroke="#5a8090" stroke-width="1"/>
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
  <rect x="2" y="6" width="76" height="84" rx="4" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <rect x="22" y="18" width="36" height="50" rx="3" fill="#2a1020" stroke="#6a3050" stroke-width="1.5"/>
  <text x="40" y="40" font-family="monospace" font-size="7" fill="#9a5070" text-anchor="middle">L298N</text>
  <text x="40" y="54" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">DUAL H-BRIDGE</text>
  <text x="40" y="64" font-family="monospace" font-size="5" fill="#5a7a90" text-anchor="middle">MOTOR DRIVER</text>
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
  <rect x="4" y="14" width="42" height="46" rx="3" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <circle cx="25" cy="32" r="14" fill="#e8e0c8" stroke="#c0b090" stroke-width="1.5"/>
  <circle cx="25" cy="32" r="10" fill="#d8d0b8" stroke="#b0a080" stroke-width="0.5"/>
  <text x="25" y="52" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">HC-SR501</text>
  <circle cx="10" cy="68" r="3" fill="#5a8090"/>
  <circle cx="25" cy="68" r="3" fill="#5a8090"/>
  <circle cx="40" cy="68" r="3" fill="#5a8090"/>
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
  <rect x="4" y="10" width="42" height="50" rx="4" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <circle cx="25" cy="30" r="10" fill="#0a0e18" stroke="#2a4060" stroke-width="1.5"/>
  <circle cx="25" cy="30" r="5"  fill="#1a1e28"/>
  <text x="25" y="52" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">SOUND</text>
  <text x="25" y="60" font-family="monospace" font-size="4" fill="#5a7a90" text-anchor="middle">SENSOR</text>
  <circle cx="10" cy="68" r="3" fill="#5a8090"/>
  <circle cx="25" cy="68" r="3" fill="#5a8090"/>
  <circle cx="40" cy="68" r="3" fill="#5a8090"/>
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
  <ellipse cx="30" cy="38" rx="26" ry="30" fill="#1a2030" stroke="#3a5070" stroke-width="1.5"/>
  <ellipse cx="30" cy="38" rx="18" ry="22" fill="#0e1828" stroke="#2a4060" stroke-width="1"/>
  <ellipse cx="30" cy="38" rx="8"  ry="10" fill="#1a2838" stroke="#3a5070" stroke-width="1"/>
  <text x="30" y="36" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">28BYJ</text>
  <text x="30" y="46" font-family="monospace" font-size="5" fill="#6a9ac0" text-anchor="middle">-48</text>
  <circle cx="8"  cy="78" r="3" fill="#5a8090"/>
  <circle cx="20" cy="78" r="3" fill="#5a8090"/>
  <circle cx="32" cy="78" r="3" fill="#5a8090"/>
  <circle cx="44" cy="78" r="3" fill="#5a8090"/>
  <circle cx="56" cy="78" r="3" fill="#5a8090"/>
</svg>`,
    electrical: { vccMin: 5.0, vccMax: 5.0, currentMa: 240, maxCurrentMa: 500 },
    validation: [{ rule: 'requires_driver', message: 'ULN2003 드라이버 IC 또는 별도 드라이버 필수', severity: 'error' }],
    notes: ['ULN2003 드라이버 모듈 사용 권장', '스텝 각도: 5.625° / 64 스텝 = 1회전', '라이브러리: Stepper 또는 AccelStepper'],
  },
];
