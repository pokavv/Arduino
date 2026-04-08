import type { ComponentElectricalSpec } from '../types.js';

/**
 * 컴포넌트 전기적 사양 데이터베이스
 * 데이터시트 기반 수치 사용
 */
export const COMPONENT_SPECS: Record<string, ComponentElectricalSpec> = {

  led: {
    type: 'led',
    name: 'LED',
    description: '발광 다이오드 (Light Emitting Diode)',
    operatingVoltageMin: 1.8,
    operatingVoltageMax: 3.5,
    currentMa: 10,
    maxCurrentMa: 20,
    forwardVoltage: {
      red:    2.0,
      orange: 2.1,
      yellow: 2.1,
      green:  2.2,
      blue:   3.2,
      white:  3.2,
      purple: 3.2,
    },
    recommendedResistorOhms: { min: 100, max: 470 },
    pins: {
      ANODE:   { description: '양극 (+) — GPIO 핀 또는 VCC에 연결', type: 'input' },
      CATHODE: { description: '음극 (-) — GND에 연결', type: 'ground' },
    },
    notes: [
      '반드시 직렬 저항 사용 필요 (전류 제한)',
      '5V 시스템: R = (5 - Vf) / 0.01 Ω',
      '3.3V 시스템: R = (3.3 - Vf) / 0.01 Ω',
      '일반적으로 220~330Ω 저항 사용',
    ],
  },

  'rgb-led': {
    type: 'rgb-led',
    name: 'RGB LED',
    description: 'RGB 3색 LED (공통 캐소드)',
    currentMa: 20,
    maxCurrentMa: 20,
    forwardVoltage: { red: 2.0, green: 2.2, blue: 3.2 },
    recommendedResistorOhms: { min: 100, max: 330 },
    pins: {
      RED:    { description: '빨강 채널', type: 'input' },
      GREEN:  { description: '초록 채널', type: 'input' },
      BLUE:   { description: '파랑 채널', type: 'input' },
      COMMON: { description: '공통 단자 (공통 캐소드→GND, 공통 애노드→VCC)', type: 'ground' },
    },
    notes: [
      '각 채널에 별도 저항 필요',
      'PWM으로 색상 혼합 가능',
    ],
  },

  button: {
    type: 'button',
    name: '푸시 버튼',
    description: '순간 접촉식 택트 스위치 (SPST-NO)',
    pins: {
      PIN1A: { description: '핀 1A (1번 다리)', type: 'signal' },
      PIN1B: { description: '핀 1B (2번 다리, PIN1A와 내부 연결)', type: 'signal' },
      PIN2A: { description: '핀 2A (3번 다리)', type: 'signal' },
      PIN2B: { description: '핀 2B (4번 다리, PIN2A와 내부 연결)', type: 'signal' },
    },
    notes: [
      'PIN1A~1B / PIN2A~2B는 내부 연결',
      '풀업 저항 권장 (INPUT_PULLUP 사용)',
      '일반 연결: PIN1A→GPIO, PIN2A→GND',
      '누를 때 PIN1과 PIN2가 도통',
    ],
  },

  resistor: {
    type: 'resistor',
    name: '저항',
    description: '탄소 피막 저항 (Carbon Film Resistor)',
    pins: {
      PIN1: { description: '리드선 1', type: 'bidirectional' },
      PIN2: { description: '리드선 2', type: 'bidirectional' },
    },
    notes: [
      '방향 무관 (극성 없음)',
      '1/4W 정격 (최대 250mW)',
      '±5% 허용 오차 (금색 밴드)',
      'V = I × R (옴의 법칙)',
    ],
  },

  buzzer: {
    type: 'buzzer',
    name: '부저',
    description: '패시브 부저 (Passive Buzzer)',
    operatingVoltageMin: 3.3,
    operatingVoltageMax: 5.0,
    currentMa: 30,
    maxCurrentMa: 50,
    pins: {
      VCC: { description: '양극 (+) — GPIO 또는 5V에 연결', type: 'power' },
      GND: { description: '음극 (−) — GND에 연결', type: 'ground' },
    },
    notes: [
      'PWM 신호로 다양한 주파수 출력 가능',
      '최대 전류 초과 시 트랜지스터(NPN) 구동 회로 사용 권장',
      'tone() 함수로 제어 (Arduino)',
    ],
  },

  potentiometer: {
    type: 'potentiometer',
    name: '포텐셔미터',
    description: '가변저항 10kΩ',
    operatingVoltageMin: 0,
    operatingVoltageMax: 5.0,
    pins: {
      VCC:   { description: 'VCC (3.3V 또는 5V)', type: 'power' },
      WIPER: { description: '출력 (중간 단자) — ADC 핀에 연결', type: 'output' },
      GND:   { description: 'GND', type: 'ground' },
    },
    notes: [
      'WIPER 출력: 0V ~ VCC',
      'analogRead() 로 0~1023 (10bit) 또는 0~4095 (12bit) 읽기',
      'Uno ADC 10bit, ESP32 ADC 12bit',
    ],
  },

  servo: {
    type: 'servo',
    name: 'SG90 서보',
    description: '마이크로 서보 모터 SG90',
    operatingVoltageMin: 4.8,
    operatingVoltageMax: 6.0,
    currentMa: 150,
    maxCurrentMa: 650,
    pins: {
      VCC:    { description: '빨간 선 — 5V에 연결', type: 'power' },
      GND:    { description: '갈색/검정 선 — GND에 연결', type: 'ground' },
      SIGNAL: { description: '주황/노랑 선 — PWM 핀에 연결', type: 'input' },
    },
    notes: [
      '제어: 50Hz PWM, 0.5~2.5ms 펄스 (0°~180°)',
      'Arduino: Servo 라이브러리 사용',
      '시동 전류가 크므로 전원 분리 권장',
      'GPIO에서 직접 전원 공급 금지 (5V 핀 사용)',
    ],
  },

  dht: {
    type: 'dht',
    name: 'DHT22',
    description: '디지털 온습도 센서',
    operatingVoltageMin: 3.3,
    operatingVoltageMax: 5.5,
    currentMa: 2.5,
    maxCurrentMa: 10,
    pins: {
      VCC:  { description: 'VCC (3.3V ~ 5V)', type: 'power' },
      DATA: { description: '단선 데이터 핀 — GPIO에 연결, 4.7~10kΩ 풀업 필요', type: 'output' },
      GND:  { description: 'GND', type: 'ground' },
    },
    notes: [
      '측정 범위: 온도 -40~80°C ±0.5°C, 습도 0~100% ±2%',
      '샘플링 간격 최소 2초',
      'DHT11: 정밀도 낮음, 저가형',
      'DATA 핀에 4.7kΩ 풀업 저항 필수',
      '라이브러리: DHT.h (Adafruit)',
    ],
  },

  ultrasonic: {
    type: 'ultrasonic',
    name: 'HC-SR04',
    description: '초음파 거리 센서',
    operatingVoltageMin: 5.0,
    operatingVoltageMax: 5.0,
    currentMa: 15,
    maxCurrentMa: 20,
    pins: {
      VCC:  { description: 'VCC — 반드시 5V', type: 'power' },
      TRIG: { description: '트리거 (입력) — GPIO에 연결, 10μs HIGH 펄스', type: 'input' },
      ECHO: { description: '에코 (출력) — GPIO에 연결, 펄스 폭 = 거리', type: 'output' },
      GND:  { description: 'GND', type: 'ground' },
    },
    notes: [
      '측정 범위: 2~400cm, 정밀도 ±3mm',
      '측정각: 15도',
      'ECHO 핀은 5V 출력 → 3.3V MCU에는 분압 회로 필요',
      '거리(cm) = 펄스폭(μs) / 58',
    ],
  },

  lcd: {
    type: 'lcd',
    name: 'I2C LCD 1602',
    description: 'I2C 인터페이스 LCD 16×2',
    operatingVoltageMin: 5.0,
    operatingVoltageMax: 5.0,
    currentMa: 40,
    pins: {
      VCC: { description: 'VCC — 5V', type: 'power' },
      GND: { description: 'GND', type: 'ground' },
      SDA: { description: 'I2C 데이터 — A4(Uno) / G21(ESP32)', type: 'bidirectional' },
      SCL: { description: 'I2C 클럭 — A5(Uno) / G22(ESP32)', type: 'input' },
    },
    notes: [
      'I2C 주소: 0x27 (기본값) 또는 0x3F',
      '라이브러리: LiquidCrystal_I2C',
      'SDA/SCL에 4.7kΩ 풀업 저항 필요 (모듈 내장 경우 많음)',
      '백라이트 조도: Wire로 제어 가능',
    ],
  },

  oled: {
    type: 'oled',
    name: 'SSD1306 OLED',
    description: 'I2C 단색 OLED 128×64',
    operatingVoltageMin: 3.3,
    operatingVoltageMax: 5.0,
    currentMa: 20,
    pins: {
      VCC: { description: 'VCC (3.3V 또는 5V)', type: 'power' },
      GND: { description: 'GND', type: 'ground' },
      SDA: { description: 'I2C 데이터', type: 'bidirectional' },
      SCL: { description: 'I2C 클럭', type: 'input' },
    },
    notes: [
      'I2C 주소: 0x3C (기본값) 또는 0x3D',
      '라이브러리: Adafruit_SSD1306, Adafruit_GFX',
      '그래픽 버퍼 필요 (1KB RAM)',
    ],
  },

  'seven-segment': {
    type: 'seven-segment',
    name: '7-세그먼트',
    description: '공통 캐소드 7-세그먼트 디스플레이',
    operatingVoltageMin: 1.8,
    operatingVoltageMax: 3.3,
    currentMa: 10,
    maxCurrentMa: 15,
    pins: {
      A:   { description: '세그먼트 A (상단 가로)', type: 'input' },
      B:   { description: '세그먼트 B (우상 세로)', type: 'input' },
      C:   { description: '세그먼트 C (우하 세로)', type: 'input' },
      D:   { description: '세그먼트 D (하단 가로)', type: 'input' },
      E:   { description: '세그먼트 E (좌하 세로)', type: 'input' },
      F:   { description: '세그먼트 F (좌상 세로)', type: 'input' },
      G:   { description: '세그먼트 G (중간 가로)', type: 'input' },
      DP:  { description: '소수점 (Decimal Point)', type: 'input' },
      COM: { description: '공통 캐소드 — GND에 연결', type: 'ground' },
    },
    notes: [
      '각 세그먼트에 330Ω 저항 필요',
      '74HC595 시프트 레지스터로 핀 절약 가능',
      '멀티플렉싱으로 여러 자리 구동',
    ],
  },

  neopixel: {
    type: 'neopixel',
    name: 'NeoPixel (WS2812B)',
    description: 'WS2812B RGB LED 스트립',
    operatingVoltageMin: 4.5,
    operatingVoltageMax: 5.5,
    currentMa: 60, // LED 1개당 최대 (R+G+B 각 20mA)
    maxCurrentMa: 60,
    pins: {
      VCC: { description: 'VCC — 5V (외부 전원 권장)', type: 'power' },
      GND: { description: 'GND', type: 'ground' },
      DIN: { description: '데이터 입력 (1-Wire) — GPIO에 연결', type: 'input' },
    },
    notes: [
      'LED 1개당 최대 60mA (R:20 G:20 B:20)',
      '전체 밝기 시 10개 = 600mA → 외부 전원 필수',
      '5V 신호선 권장, 3.3V도 동작하나 불안정할 수 있음',
      '라이브러리: Adafruit_NeoPixel, FastLED',
      'DIN 앞에 300~500Ω 직렬 저항 권장',
      '데이터 케이블 길면 커패시터(100~1000μF/5V) 추가',
    ],
  },

  'board-uno': {
    type: 'board-uno',
    name: 'Arduino Uno R3',
    description: 'ATmega328P 기반 Arduino Uno Rev3',
    operatingVoltageMin: 5.0,
    operatingVoltageMax: 5.0,
    currentMa: 50,
    maxCurrentMa: 200,
    pins: {
      'D0':  { description: 'GPIO 0 / RX  (시리얼 수신)', type: 'bidirectional' },
      'D1':  { description: 'GPIO 1 / TX  (시리얼 송신)', type: 'bidirectional' },
      'D2':  { description: 'GPIO 2 / 외부 인터럽트 0', type: 'bidirectional' },
      'D3~': { description: 'GPIO 3 / PWM / 외부 인터럽트 1', type: 'bidirectional' },
      'D4':  { description: 'GPIO 4', type: 'bidirectional' },
      'D5~': { description: 'GPIO 5 / PWM', type: 'bidirectional' },
      'D6~': { description: 'GPIO 6 / PWM', type: 'bidirectional' },
      'D7':  { description: 'GPIO 7', type: 'bidirectional' },
      'D8':  { description: 'GPIO 8', type: 'bidirectional' },
      'D9~': { description: 'GPIO 9 / PWM', type: 'bidirectional' },
      'D10~':{ description: 'GPIO 10 / PWM / SS(SPI)', type: 'bidirectional' },
      'D11~':{ description: 'GPIO 11 / PWM / MOSI(SPI)', type: 'bidirectional' },
      'D12': { description: 'GPIO 12 / MISO(SPI)', type: 'bidirectional' },
      'D13': { description: 'GPIO 13 / SCK(SPI) / 내장 LED', type: 'bidirectional' },
      'A0':  { description: 'A0 / ADC 0  (0~5V → 0~1023)', type: 'bidirectional' },
      'A1':  { description: 'A1 / ADC 1', type: 'bidirectional' },
      'A2':  { description: 'A2 / ADC 2', type: 'bidirectional' },
      'A3':  { description: 'A3 / ADC 3', type: 'bidirectional' },
      'A4/SDA': { description: 'A4 / ADC 4 / SDA(I2C)', type: 'bidirectional' },
      'A5/SCL': { description: 'A5 / ADC 5 / SCL(I2C)', type: 'bidirectional' },
      '5V':  { description: '5V 출력 (최대 500mA)', type: 'power' },
      '3V3': { description: '3.3V 출력 (최대 50mA)', type: 'power' },
      'GND': { description: 'GND', type: 'ground' },
    },
    notes: [
      'MCU: ATmega328P, 16MHz',
      'GPIO 핀당 최대 40mA, 전체 합계 200mA',
      'PWM: 3, 5, 6, 9, 10, 11번 핀 (490~980Hz)',
      'ADC: 10bit (0~1023)',
      'USB 전원 시 Vin→USB, 외부 전원 7~12V',
    ],
  },

  'board-esp32c3': {
    type: 'board-esp32c3',
    name: 'ESP32-C3 Super Mini',
    description: 'ESP32-C3 RISC-V 기반 Wi-Fi/BLE 모듈',
    operatingVoltageMin: 3.0,
    operatingVoltageMax: 3.6,
    currentMa: 80,
    maxCurrentMa: 600,
    pins: {
      'G0':  { description: 'GPIO 0 / ADC / Boot 핀 (주의)', type: 'bidirectional' },
      'G1':  { description: 'GPIO 1 / ADC', type: 'bidirectional' },
      'G2':  { description: 'GPIO 2 / ADC', type: 'bidirectional' },
      'G3':  { description: 'GPIO 3 / ADC', type: 'bidirectional' },
      'G4':  { description: 'GPIO 4 / ADC / UART0 TX (기본)', type: 'bidirectional' },
      'G5':  { description: 'GPIO 5 / ADC / UART0 RX (기본)', type: 'bidirectional' },
      'G6':  { description: 'GPIO 6 / SPI SCK', type: 'bidirectional' },
      'G7':  { description: 'GPIO 7 / SPI MOSI', type: 'bidirectional' },
      'G8':  { description: 'GPIO 8 / 내장 LED (Active LOW)', type: 'bidirectional' },
      'G9':  { description: 'GPIO 9 / Boot 핀 (주의)', type: 'bidirectional' },
      'G10': { description: 'GPIO 10 / SPI SS', type: 'bidirectional' },
      'G20': { description: 'GPIO 20 / SPI MISO / I2C SDA', type: 'bidirectional' },
      'G21': { description: 'GPIO 21 / I2C SCL', type: 'bidirectional' },
      '5V':  { description: '5V 출력 (USB 전원)', type: 'power' },
      '3V3': { description: '3.3V 출력 (최대 600mA)', type: 'power' },
      'GND': { description: 'GND', type: 'ground' },
    },
    notes: [
      'MCU: ESP32-C3 RISC-V 160MHz',
      '동작 전압: 3.3V (5V 직접 연결 금지!)',
      'GPIO 핀당 최대 40mA',
      'PWM: 모든 GPIO 사용 가능 (ledcWrite)',
      'ADC: 12bit (G0~G5), Wi-Fi 켜면 불안정',
      'Wi-Fi: 802.11b/g/n 2.4GHz, BLE 5.0',
      'G0, G9는 부팅 핀 — 풀다운 주의',
      '내장 LED G8: LOW=켜짐 (Active LOW)',
    ],
  },
};

/** 컴포넌트 타입으로 사양 조회 */
export function getSpec(type: string): ComponentElectricalSpec | null {
  return COMPONENT_SPECS[type] ?? null;
}
