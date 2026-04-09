/**
 * 신규 컴포넌트 데이터 (components.ts에 통합 예정)
 *
 * 15개 신규 컴포넌트:
 *   센서: MPU-6050, BMP280, MQ-2, 토양 수분, 빗물 감지
 *   패시브: 로터리 인코더, 4×4 키패드
 *   통신: HC-05 블루투스, RFID RC522
 *   MCU: Arduino Nano, ESP32 DevKit V1
 *   디스플레이: TM1637, MAX7219
 *   스토리지: SD 카드
 *   전원: AMS1117
 */
export const newComponents = [
  // ──────────────────────────────────────────
  // 1. MPU-6050 (IMU)
  // ──────────────────────────────────────────
  {
    id: 'mpu6050',
    name: 'MPU-6050',
    category: 'sensor',
    tags: ['mpu6050', 'imu', 'gyro', 'accelerometer', 'i2c'],
    description: 'MPU-6050 6축 IMU (3축 가속도 + 3축 자이로스코프). I2C.',
    icon: '🔄',
    element: 'sim-generic',
    width: 76, height: 60,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'VCC', label: 'VCC', x: 10, y: 0,  type: 'power',   required: true,  description: '3.3V 또는 5V', compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 22, y: 0,  type: 'ground',  required: true,  description: 'GND',          compatibleWith: ['ground'] },
      { name: 'SCL', label: 'SCL', x: 34, y: 0,  type: 'i2c_scl', required: true,  description: 'I2C SCL',      compatibleWith: ['i2c_scl', 'digital'] },
      { name: 'SDA', label: 'SDA', x: 46, y: 0,  type: 'i2c_sda', required: true,  description: 'I2C SDA',      compatibleWith: ['i2c_sda', 'digital'] },
      { name: 'INT', label: 'INT', x: 58, y: 0,  type: 'digital', required: false, description: '인터럽트 출력', compatibleWith: ['digital', 'signal'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 5.0, currentMa: 3.9 },
    notes: [
      'I2C 주소: 0x68 (AD0=LOW), 0x69 (AD0=HIGH)',
      '라이브러리: MPU6050 by Electronic Cats',
    ],
    datasheet: 'https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Datasheet1.pdf',
  },

  // ──────────────────────────────────────────
  // 2. BMP280 (기압/온도)
  // ──────────────────────────────────────────
  {
    id: 'bmp280',
    name: 'BMP280',
    category: 'sensor',
    tags: ['bmp280', 'pressure', 'temperature', 'i2c', 'spi', '기압'],
    description: 'BMP280 기압/온도 센서. I2C/SPI 지원.',
    icon: '🌡️',
    element: 'sim-generic',
    width: 60, height: 50,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'VCC', label: 'VCC', x:  8, y: 50, type: 'power',   required: true,  description: '3.3V', compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 20, y: 50, type: 'ground',  required: true,  description: 'GND',  compatibleWith: ['ground'] },
      { name: 'SCL', label: 'SCL', x: 32, y: 50, type: 'i2c_scl', required: true,  description: 'I2C SCL', compatibleWith: ['i2c_scl'] },
      { name: 'SDA', label: 'SDA', x: 44, y: 50, type: 'i2c_sda', required: true,  description: 'I2C SDA', compatibleWith: ['i2c_sda'] },
    ],
    electrical: { vccMin: 1.71, vccMax: 3.6, currentMa: 2.7 },
    notes: [
      'I2C 주소: 0x76 (SDO=GND), 0x77 (SDO=VCC)',
      '라이브러리: Adafruit_BMP280',
    ],
  },

  // ──────────────────────────────────────────
  // 3. MQ-2 가스 센서
  // ──────────────────────────────────────────
  {
    id: 'mq2',
    name: 'MQ-2 가스 센서',
    category: 'sensor',
    tags: ['mq2', 'gas', 'smoke', 'lpg', '연기', '가스'],
    description: 'MQ-2 연기/가스 센서 모듈.',
    icon: '💨',
    element: 'sim-generic',
    width: 76, height: 76,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'VCC',  label: 'VCC',  x: 10, y: 76, type: 'power',   required: true,  description: '5V',              compatibleWith: ['power'] },
      { name: 'GND',  label: 'GND',  x: 28, y: 76, type: 'ground',  required: true,  description: 'GND',             compatibleWith: ['ground'] },
      { name: 'DOUT', label: 'DOUT', x: 46, y: 76, type: 'digital', required: false, description: '디지털 출력',      compatibleWith: ['digital', 'signal'] },
      { name: 'AOUT', label: 'AOUT', x: 64, y: 76, type: 'analog',  required: false, description: '아날로그 출력 (0~1023)', compatibleWith: ['analog'] },
    ],
    electrical: { vccMin: 5.0, vccMax: 5.0, currentMa: 150 },
    notes: [
      '예열 시간 20초 이상 필요',
      '감지 가스: LPG, 메탄, 수소, 연기, 이소부탄, 프로판',
    ],
  },

  // ──────────────────────────────────────────
  // 4. 토양 수분 센서
  // ──────────────────────────────────────────
  {
    id: 'soil-moisture',
    name: '토양 수분 센서',
    category: 'sensor',
    tags: ['soil', 'moisture', 'water', '습도', '토양'],
    description: '저항식 토양 수분 감지 센서 모듈.',
    icon: '🌱',
    element: 'sim-generic',
    width: 60, height: 50,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'VCC',  label: 'VCC',  x:  8, y: 50, type: 'power',   required: true,  description: '3.3V~5V',               compatibleWith: ['power'] },
      { name: 'GND',  label: 'GND',  x: 20, y: 50, type: 'ground',  required: true,  description: 'GND',                   compatibleWith: ['ground'] },
      { name: 'AOUT', label: 'AOUT', x: 32, y: 50, type: 'analog',  required: true,  description: '아날로그 출력 (건조=HIGH)', compatibleWith: ['analog'] },
      { name: 'DOUT', label: 'DOUT', x: 44, y: 50, type: 'digital', required: false, description: '디지털 출력',            compatibleWith: ['digital', 'signal'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 5.0, currentMa: 35 },
    notes: [
      '건조: ADC 값 높음 / 습윤: ADC 값 낮음',
      '장기 사용 시 전극 부식 주의 — 측정 시에만 전원 인가 권장',
    ],
  },

  // ──────────────────────────────────────────
  // 5. 빗물 감지 센서
  // ──────────────────────────────────────────
  {
    id: 'rain-sensor',
    name: '빗물 감지 센서',
    category: 'sensor',
    tags: ['rain', 'water', '빗물', '감지'],
    description: '빗물/물방울 감지 저항식 센서.',
    icon: '🌧️',
    element: 'sim-generic',
    width: 60, height: 50,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'VCC',  label: 'VCC',  x:  8, y: 50, type: 'power',   required: true,  description: '3.3V~5V', compatibleWith: ['power'] },
      { name: 'GND',  label: 'GND',  x: 20, y: 50, type: 'ground',  required: true,  description: 'GND',     compatibleWith: ['ground'] },
      { name: 'AOUT', label: 'AOUT', x: 32, y: 50, type: 'analog',  required: true,  description: '아날로그 출력', compatibleWith: ['analog'] },
      { name: 'DOUT', label: 'DOUT', x: 44, y: 50, type: 'digital', required: false, description: '디지털 출력 (물 감지 시 LOW)', compatibleWith: ['digital', 'signal'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 5.0, currentMa: 20 },
    notes: [
      '물 감지 시 DOUT LOW 출력',
      '가변저항으로 임계값 조정 가능',
    ],
  },

  // ──────────────────────────────────────────
  // 6. 로터리 인코더 (KY-040)
  // ──────────────────────────────────────────
  {
    id: 'rotary-encoder',
    name: '로터리 인코더',
    category: 'passive',
    tags: ['encoder', 'rotary', 'KY-040', '로터리'],
    description: 'KY-040 증분형 로터리 인코더 + 푸시 버튼.',
    icon: '🔁',
    element: 'sim-generic',
    width: 60, height: 76,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'GND', label: 'GND', x: 10, y: 76, type: 'ground',  required: true,  description: 'GND',                   compatibleWith: ['ground'] },
      { name: 'VCC', label: 'VCC', x: 22, y: 76, type: 'power',   required: true,  description: '3.3V~5V',               compatibleWith: ['power'] },
      { name: 'SW',  label: 'SW',  x: 34, y: 76, type: 'digital', required: false, description: '푸시 버튼 (LOW=눌림)',   compatibleWith: ['digital', 'signal'] },
      { name: 'DT',  label: 'DT',  x: 46, y: 76, type: 'digital', required: true,  description: '데이터 출력 (B상)',      compatibleWith: ['digital', 'signal'] },
      { name: 'CLK', label: 'CLK', x: 58, y: 76, type: 'digital', required: true,  description: '클록 출력 (A상)',        compatibleWith: ['digital', 'signal'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 5.0, currentMa: 10 },
    notes: [
      'CLK+DT 조합으로 회전 방향 판단',
      '풀업 저항 내장 (보드 의존)',
      'CLK 상승엣지에서 DT 읽어 방향 결정',
    ],
  },

  // ──────────────────────────────────────────
  // 7. 4×4 매트릭스 키패드
  // ──────────────────────────────────────────
  {
    id: 'keypad-4x4',
    name: '4×4 키패드',
    category: 'passive',
    tags: ['keypad', 'matrix', '4x4', '키패드'],
    description: '4×4 멤브레인 매트릭스 키패드 (16키).',
    icon: '⌨️',
    element: 'sim-generic',
    width: 100, height: 114,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'R1', label: 'R1', x:  12, y:   0, type: 'digital', required: true, description: '행 1', compatibleWith: ['digital'] },
      { name: 'R2', label: 'R2', x:  36, y:   0, type: 'digital', required: true, description: '행 2', compatibleWith: ['digital'] },
      { name: 'R3', label: 'R3', x:  60, y:   0, type: 'digital', required: true, description: '행 3', compatibleWith: ['digital'] },
      { name: 'R4', label: 'R4', x:  84, y:   0, type: 'digital', required: true, description: '행 4', compatibleWith: ['digital'] },
      { name: 'C1', label: 'C1', x:  12, y: 114, type: 'digital', required: true, description: '열 1', compatibleWith: ['digital'] },
      { name: 'C2', label: 'C2', x:  36, y: 114, type: 'digital', required: true, description: '열 2', compatibleWith: ['digital'] },
      { name: 'C3', label: 'C3', x:  60, y: 114, type: 'digital', required: true, description: '열 3', compatibleWith: ['digital'] },
      { name: 'C4', label: 'C4', x:  84, y: 114, type: 'digital', required: true, description: '열 4', compatibleWith: ['digital'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 5.0, currentMa: 1 },
    notes: [
      '라이브러리: Keypad by Mark Stanley',
      '행 핀에 풀업, 열 핀 출력 방식 스캔',
      '키 배열: 1234 / 5678 / 9*0# / ABCD',
    ],
  },

  // ──────────────────────────────────────────
  // 8. HC-05 블루투스
  // ──────────────────────────────────────────
  {
    id: 'hc05',
    name: 'HC-05 블루투스',
    category: 'communication',
    tags: ['bluetooth', 'hc05', 'hc-05', 'serial', 'bt'],
    description: 'HC-05 블루투스 시리얼 모듈.',
    icon: '📡',
    element: 'sim-generic',
    width: 76, height: 60,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'STATE', label: 'STATE', x:  8, y:  0, type: 'digital', required: false, description: '연결 상태 (연결 시 HIGH)', compatibleWith: ['digital'] },
      { name: 'RXD',   label: 'RXD',   x: 20, y:  0, type: 'uart_rx', required: true,  description: 'UART RX — 3.3V 레벨 주의', compatibleWith: ['uart_tx'] },
      { name: 'TXD',   label: 'TXD',   x: 32, y:  0, type: 'uart_tx', required: true,  description: 'UART TX',                compatibleWith: ['uart_rx'] },
      { name: 'GND',   label: 'GND',   x: 44, y:  0, type: 'ground',  required: true,  description: 'GND',                    compatibleWith: ['ground'] },
      { name: 'VCC',   label: 'VCC',   x: 56, y:  0, type: 'power',   required: true,  description: '3.6~6V',                 compatibleWith: ['power'] },
      { name: 'KEY',   label: 'KEY',   x: 68, y:  0, type: 'digital', required: false, description: 'AT 모드 전환 (HIGH=AT)',  compatibleWith: ['digital'] },
    ],
    electrical: { vccMin: 3.6, vccMax: 6.0, currentMa: 35, maxCurrentMa: 50 },
    notes: [
      '⚠️ RXD는 3.3V 레벨 — 5V 보드 사용 시 전압분배(1kΩ+2kΩ) 필수',
      '기본 보레이트: 9600 (Slave) / 38400 (AT 모드)',
      'AT 명령어로 이름/암호/보레이트 설정 가능',
    ],
  },

  // ──────────────────────────────────────────
  // 9. RFID RC522
  // ──────────────────────────────────────────
  {
    id: 'rfid-rc522',
    name: 'RFID RC522',
    category: 'communication',
    tags: ['rfid', 'rc522', 'nfc', 'spi', '카드'],
    description: 'MFRC522 13.56MHz RFID 카드 리더 모듈.',
    icon: '🔏',
    element: 'sim-generic',
    width: 95, height: 76,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'SDA',  label: 'SDA/SS', x: 10, y: 76, type: 'spi_ss',   required: true,  description: 'SPI SS (슬레이브 선택)', compatibleWith: ['spi_ss', 'digital'] },
      { name: 'SCK',  label: 'SCK',    x: 24, y: 76, type: 'spi_sck',  required: true,  description: 'SPI 클록',             compatibleWith: ['spi_sck'] },
      { name: 'MOSI', label: 'MOSI',   x: 38, y: 76, type: 'spi_mosi', required: true,  description: 'SPI MOSI',             compatibleWith: ['spi_mosi'] },
      { name: 'MISO', label: 'MISO',   x: 52, y: 76, type: 'spi_miso', required: true,  description: 'SPI MISO',             compatibleWith: ['spi_miso'] },
      { name: 'IRQ',  label: 'IRQ',    x: 66, y: 76, type: 'digital',  required: false, description: '인터럽트 출력',        compatibleWith: ['digital'] },
      { name: 'GND',  label: 'GND',    x: 76, y: 76, type: 'ground',   required: true,  description: 'GND',                  compatibleWith: ['ground'] },
      { name: 'RST',  label: 'RST',    x: 86, y: 76, type: 'digital',  required: true,  description: '리셋 (LOW=리셋)',       compatibleWith: ['digital'] },
      { name: 'VCC',  label: '3.3V',   x: 96, y: 76, type: 'power',    required: true,  description: '3.3V 전용!',           compatibleWith: ['power'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 3.3, currentMa: 13, logic: '3.3V' },
    notes: [
      '⚠️ 3.3V 전용 — 5V 직접 연결 절대 금지',
      '라이브러리: MFRC522 by miguelbalboa',
      '지원 카드: MIFARE 1K, 4K, Ultralight, NTAG',
    ],
  },

  // ──────────────────────────────────────────
  // 10. Arduino Nano
  // ──────────────────────────────────────────
  {
    id: 'board-nano',
    name: 'Arduino Nano',
    category: 'mcu',
    tags: ['arduino', 'nano', 'atmega328p'],
    description: 'ATmega328P Arduino Nano. 컴팩트한 크기.',
    icon: '🔵',
    element: 'sim-generic',
    width: 76, height: 190,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'D0',   label: 'D0/RX',  x:  0, y:  28,  type: 'uart_rx',  required: false, compatibleWith: ['digital', 'uart_rx'] },
      { name: 'D1',   label: 'D1/TX',  x:  0, y:  46,  type: 'uart_tx',  required: false, compatibleWith: ['digital', 'uart_tx'] },
      { name: 'D2',   label: 'D2',     x:  0, y:  64,  type: 'digital',  required: false, compatibleWith: ['digital'] },
      { name: 'D3~',  label: 'D3~',    x:  0, y:  82,  type: 'pwm',      required: false, compatibleWith: ['digital', 'pwm'] },
      { name: 'D4',   label: 'D4',     x:  0, y: 100,  type: 'digital',  required: false, compatibleWith: ['digital'] },
      { name: 'D5~',  label: 'D5~',    x:  0, y: 118,  type: 'pwm',      required: false, compatibleWith: ['digital', 'pwm'] },
      { name: 'D6~',  label: 'D6~',    x:  0, y: 136,  type: 'pwm',      required: false, compatibleWith: ['digital', 'pwm'] },
      { name: 'D7',   label: 'D7',     x:  0, y: 154,  type: 'digital',  required: false, compatibleWith: ['digital'] },
      { name: 'D8',   label: 'D8',     x: 76, y:  28,  type: 'digital',  required: false, compatibleWith: ['digital'] },
      { name: 'D9~',  label: 'D9~',    x: 76, y:  46,  type: 'pwm',      required: false, compatibleWith: ['digital', 'pwm'] },
      { name: 'D10~', label: 'D10~',   x: 76, y:  64,  type: 'spi_ss',   required: false, compatibleWith: ['digital', 'pwm', 'spi_ss'] },
      { name: 'D11~', label: 'D11~',   x: 76, y:  82,  type: 'spi_mosi', required: false, compatibleWith: ['digital', 'spi_mosi'] },
      { name: 'D12',  label: 'D12',    x: 76, y: 100,  type: 'spi_miso', required: false, compatibleWith: ['digital', 'spi_miso'] },
      { name: 'D13',  label: 'D13',    x: 76, y: 118,  type: 'spi_sck',  required: false, compatibleWith: ['digital', 'spi_sck'] },
      { name: '3V3',  label: '3.3V',   x: 76, y: 136,  type: 'power',    required: false, compatibleWith: ['power'] },
      { name: 'AREF', label: 'AREF',   x: 76, y: 154,  type: 'analog',   required: false, compatibleWith: ['analog'] },
      { name: 'A0',   label: 'A0',     x:  0, y: 172,  type: 'analog',   required: false, compatibleWith: ['analog', 'digital'] },
      { name: 'A1',   label: 'A1',     x: 10, y: 190,  type: 'analog',   required: false, compatibleWith: ['analog', 'digital'] },
      { name: 'A2',   label: 'A2',     x: 22, y: 190,  type: 'analog',   required: false, compatibleWith: ['analog', 'digital'] },
      { name: 'A3',   label: 'A3',     x: 34, y: 190,  type: 'analog',   required: false, compatibleWith: ['analog', 'digital'] },
      { name: 'A4',   label: 'A4/SDA', x: 46, y: 190,  type: 'i2c_sda',  required: false, compatibleWith: ['analog', 'i2c_sda'] },
      { name: 'A5',   label: 'A5/SCL', x: 58, y: 190,  type: 'i2c_scl',  required: false, compatibleWith: ['analog', 'i2c_scl'] },
      { name: '5V',   label: '5V',     x: 68, y: 190,  type: 'power',    required: false, compatibleWith: ['power'] },
      { name: 'GND',  label: 'GND',    x: 76, y: 172,  type: 'ground',   required: false, compatibleWith: ['ground'] },
    ],
    electrical: { vccMin: 5.0, vccMax: 5.0, currentMa: 50, logic: '5V' },
    notes: [
      'ATmega328P @ 16MHz, USB Mini-B',
      'ADC 10비트 (0~1023)',
      'PWM 핀: D3, D5, D6, D9, D10, D11',
    ],
  },

  // ──────────────────────────────────────────
  // 11. ESP32 DevKit V1
  // ──────────────────────────────────────────
  {
    id: 'board-esp32',
    name: 'ESP32 DevKit V1',
    category: 'mcu',
    tags: ['esp32', 'devkit', 'wifi', 'ble', 'dual-core'],
    description: 'ESP32 듀얼코어 Wi-Fi/BLE 개발 보드.',
    icon: '🔴',
    element: 'sim-generic',
    width: 114, height: 228,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'EN',   label: 'EN',    x:   0, y:  18,  type: 'digital',  required: false, description: '칩 인에이블',         compatibleWith: ['digital'] },
      { name: 'VP',   label: 'VP/36', x:   0, y:  36,  type: 'analog',   required: false, description: '입력 전용 ADC',       compatibleWith: ['analog'] },
      { name: 'VN',   label: 'VN/39', x:   0, y:  54,  type: 'analog',   required: false, description: '입력 전용 ADC',       compatibleWith: ['analog'] },
      { name: 'D34',  label: 'D34',   x:   0, y:  72,  type: 'analog',   required: false, description: '입력 전용 GPIO',      compatibleWith: ['analog', 'digital'] },
      { name: 'D35',  label: 'D35',   x:   0, y:  90,  type: 'analog',   required: false, description: '입력 전용 GPIO',      compatibleWith: ['analog', 'digital'] },
      { name: 'D32',  label: 'D32',   x:   0, y: 108,  type: 'analog',   required: false, compatibleWith: ['analog', 'digital', 'pwm'] },
      { name: 'D33',  label: 'D33',   x:   0, y: 126,  type: 'analog',   required: false, compatibleWith: ['analog', 'digital', 'pwm'] },
      { name: 'D25',  label: 'D25',   x:   0, y: 144,  type: 'pwm',      required: false, description: 'DAC1',               compatibleWith: ['digital', 'pwm', 'analog'] },
      { name: 'D26',  label: 'D26',   x:   0, y: 162,  type: 'pwm',      required: false, description: 'DAC2',               compatibleWith: ['digital', 'pwm'] },
      { name: 'D27',  label: 'D27',   x:   0, y: 180,  type: 'pwm',      required: false, compatibleWith: ['digital', 'pwm'] },
      { name: 'D14',  label: 'D14',   x:   0, y: 198,  type: 'pwm',      required: false, compatibleWith: ['digital', 'pwm'] },
      { name: 'D12',  label: 'D12',   x:   0, y: 216,  type: 'pwm',      required: false, description: '부팅 시 LOW 유지',    compatibleWith: ['digital', 'pwm'] },
      { name: 'GND1', label: 'GND',   x:   0, y: 228,  type: 'ground',   required: false, compatibleWith: ['ground'] },
      { name: 'D13',  label: 'D13',   x: 114, y:  18,  type: 'pwm',      required: false, compatibleWith: ['digital', 'pwm'] },
      { name: 'D9',   label: 'D9',    x: 114, y:  36,  type: 'digital',  required: false, description: 'SPI Flash — 사용 주의', compatibleWith: ['digital'] },
      { name: 'D10',  label: 'D10',   x: 114, y:  54,  type: 'digital',  required: false, description: 'SPI Flash — 사용 주의', compatibleWith: ['digital'] },
      { name: 'D11',  label: 'D11',   x: 114, y:  72,  type: 'digital',  required: false, description: 'SPI Flash — 사용 주의', compatibleWith: ['digital'] },
      { name: 'VIN',  label: 'VIN',   x: 114, y:  90,  type: 'power',    required: false, description: '5V 입력 (USB 전원)',  compatibleWith: ['power'] },
      { name: 'GND2', label: 'GND',   x: 114, y: 108,  type: 'ground',   required: false, compatibleWith: ['ground'] },
      { name: '3V3',  label: '3.3V',  x: 114, y: 126,  type: 'power',    required: false, description: '3.3V 출력',          compatibleWith: ['power'] },
      { name: 'D15',  label: 'D15',   x: 114, y: 144,  type: 'pwm',      required: false, compatibleWith: ['digital', 'pwm'] },
      { name: 'D2',   label: 'D2',    x: 114, y: 162,  type: 'pwm',      required: false, description: '내장 LED',           compatibleWith: ['digital', 'pwm'] },
      { name: 'D4',   label: 'D4',    x: 114, y: 180,  type: 'pwm',      required: false, compatibleWith: ['digital', 'pwm'] },
      { name: 'RX0',  label: 'RX0',   x: 114, y: 198,  type: 'uart_rx',  required: false, compatibleWith: ['uart_rx', 'digital'] },
      { name: 'TX0',  label: 'TX0',   x: 114, y: 216,  type: 'uart_tx',  required: false, compatibleWith: ['uart_tx', 'digital'] },
      { name: 'D5',   label: 'D5',    x: 114, y: 228,  type: 'pwm',      required: false, compatibleWith: ['digital', 'pwm'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 3.3, currentMa: 80, maxCurrentMa: 250, logic: '3.3V' },
    notes: [
      '⚠️ GPIO 3.3V 레벨 — 5V 직접 연결 절대 금지',
      'PWM: 모든 GPIO 가능 (ledcSetup + ledcWrite)',
      'ADC: 12bit, Wi-Fi 동작 시 ADC2 사용 불가',
      'GPIO34~39: 입력 전용 (출력 불가)',
    ],
  },

  // ──────────────────────────────────────────
  // 12. TM1637 4자리 디스플레이
  // ──────────────────────────────────────────
  {
    id: 'tm1637',
    name: 'TM1637 디스플레이',
    category: 'display',
    tags: ['tm1637', '7segment', '4digit', 'display', '시계'],
    description: 'TM1637 4자리 7-세그먼트 디스플레이 (콜론 포함).',
    icon: '🔢',
    element: 'sim-generic',
    width: 114, height: 60,
    defaultProps: {},
    props: [
      { key: 'value',      label: '표시값', type: 'string', default: '0000' },
      { key: 'brightness', label: '밝기',   type: 'number', default: 7, min: 0, max: 7 },
    ],
    pins: [
      { name: 'CLK', label: 'CLK', x: 20, y: 60, type: 'digital', required: true,  description: '클록',  compatibleWith: ['digital', 'signal'] },
      { name: 'DIO', label: 'DIO', x: 40, y: 60, type: 'digital', required: true,  description: '데이터', compatibleWith: ['digital', 'signal'] },
      { name: 'VCC', label: 'VCC', x: 70, y: 60, type: 'power',   required: true,  description: '3.3V~5V', compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 90, y: 60, type: 'ground',  required: true,  description: 'GND',   compatibleWith: ['ground'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 5.0, currentMa: 80 },
    notes: [
      '라이브러리: TM1637Display by Avishay Orpaz',
      '밝기 제어: 0(최어둠) ~ 7(최밝음)',
      '콜론 표시: showNumberDecEx() 두 번째 인자',
    ],
  },

  // ──────────────────────────────────────────
  // 13. MAX7219 LED 매트릭스
  // ──────────────────────────────────────────
  {
    id: 'max7219',
    name: 'MAX7219 LED 매트릭스',
    category: 'display',
    tags: ['max7219', 'led matrix', '8x8', 'dot', 'spi'],
    description: 'MAX7219 드라이브 8×8 LED 도트 매트릭스.',
    icon: '⬛',
    element: 'sim-generic',
    width: 95, height: 95,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'VCC', label: 'VCC', x: 10, y: 95, type: 'power',    required: true, description: '5V',      compatibleWith: ['power'] },
      { name: 'GND', label: 'GND', x: 28, y: 95, type: 'ground',   required: true, description: 'GND',     compatibleWith: ['ground'] },
      { name: 'DIN', label: 'DIN', x: 46, y: 95, type: 'spi_mosi', required: true, description: 'SPI MOSI', compatibleWith: ['spi_mosi', 'digital'] },
      { name: 'CS',  label: 'CS',  x: 64, y: 95, type: 'spi_ss',   required: true, description: 'SPI SS',   compatibleWith: ['spi_ss', 'digital'] },
      { name: 'CLK', label: 'CLK', x: 82, y: 95, type: 'spi_sck',  required: true, description: 'SPI SCK',  compatibleWith: ['spi_sck', 'digital'] },
    ],
    electrical: { vccMin: 4.0, vccMax: 5.5, currentMa: 320, logic: '5V' },
    notes: [
      '라이브러리: LedControl by wayoda 또는 MD_MAX72xx',
      '5V/3.3V 겸용 가능 (VCC 3.3V 시 밝기 저하)',
      '데이지체인으로 여러 모듈 직렬 연결 가능',
    ],
  },

  // ──────────────────────────────────────────
  // 14. SD 카드 모듈
  // ──────────────────────────────────────────
  {
    id: 'sd-card',
    name: 'SD 카드 모듈',
    category: 'storage',
    tags: ['sd', 'card', 'spi', 'storage', '파일'],
    description: 'SPI 인터페이스 마이크로 SD 카드 모듈.',
    icon: '💾',
    element: 'sim-generic',
    width: 60, height: 76,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'GND',  label: 'GND',  x:  8, y: 76, type: 'ground',   required: true, description: 'GND',            compatibleWith: ['ground'] },
      { name: 'VCC',  label: 'VCC',  x: 20, y: 76, type: 'power',    required: true, description: '3.3V 또는 5V',   compatibleWith: ['power'] },
      { name: 'MISO', label: 'MISO', x: 32, y: 76, type: 'spi_miso', required: true, description: 'SPI MISO',       compatibleWith: ['spi_miso'] },
      { name: 'MOSI', label: 'MOSI', x: 44, y: 76, type: 'spi_mosi', required: true, description: 'SPI MOSI',       compatibleWith: ['spi_mosi'] },
      { name: 'SCK',  label: 'SCK',  x: 56, y: 76, type: 'spi_sck',  required: true, description: 'SPI 클록',       compatibleWith: ['spi_sck'] },
      { name: 'CS',   label: 'CS',   x: 68, y: 76, type: 'spi_ss',   required: true, description: 'SPI CS (임의 GPIO 가능)', compatibleWith: ['spi_ss', 'digital'] },
    ],
    electrical: { vccMin: 3.3, vccMax: 5.0, currentMa: 100, maxCurrentMa: 200 },
    notes: [
      '라이브러리: SD.h (Arduino 내장)',
      'FAT16/FAT32 포맷만 지원 (exFAT 불가)',
      '최대 카드 용량: 32GB (SDHC)',
      'CS 핀은 임의 GPIO 사용 가능',
    ],
  },

  // ──────────────────────────────────────────
  // 15. 전압 레귤레이터 AMS1117
  // ──────────────────────────────────────────
  {
    id: 'ams1117',
    name: 'AMS1117 3.3V',
    category: 'power',
    tags: ['ams1117', 'ldo', 'regulator', '3.3v', '전원'],
    description: 'AMS1117 3.3V LDO 전압 레귤레이터 모듈.',
    icon: '🔋',
    element: 'sim-generic',
    width: 40, height: 60,
    defaultProps: {},
    props: [],
    pins: [
      { name: 'VIN',  label: 'VIN',  x: 10, y: 60, type: 'power',  required: true, description: '입력 4.5~12V',         compatibleWith: ['power'] },
      { name: 'GND',  label: 'GND',  x: 20, y: 60, type: 'ground', required: true, description: 'GND',                  compatibleWith: ['ground'] },
      { name: 'VOUT', label: 'VOUT', x: 30, y: 60, type: 'power',  required: true, description: '출력 3.3V (최대 800mA)', compatibleWith: ['power'] },
    ],
    electrical: { vccMin: 4.5, vccMax: 12, currentMa: 800 },
    notes: [
      '출력: 3.3V 고정',
      '최대 출력 전류: 800mA',
      '입력-출력 전압차 최소 1.3V 필요 (드롭아웃)',
      '전력 소비가 크면 방열판 부착 권장',
    ],
  },
] as const;
