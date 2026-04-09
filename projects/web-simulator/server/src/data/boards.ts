export interface PinDef {
  name: string;
  gpio?: number;
  type: 'digital' | 'analog' | 'power' | 'other';
  pwm?: boolean;
  adc?: boolean;
  spi?: string;
  i2c?: string;
}

export interface BoardDef {
  id: string;
  name: string;
  vendor: string;
  mcu: string;
  freq: number;
  flashKb: number;
  ramKb: number;
  adcBits: number;
  pins: PinDef[];
  ledBuiltin: number;
  voltage: 3.3 | 5.0;
  element: string; // custom element tag name
}

export const BOARDS: BoardDef[] = [
  {
    id: 'arduino-uno',
    name: 'Arduino Uno R3',
    vendor: 'Arduino',
    mcu: 'ATmega328P',
    freq: 16,
    flashKb: 32,
    ramKb: 2,
    adcBits: 10,
    voltage: 5.0,
    ledBuiltin: 13,
    element: 'sim-board-uno',
    pins: [
      { name:'D0',  gpio:0,  type:'digital' },
      { name:'D1',  gpio:1,  type:'digital' },
      { name:'D2',  gpio:2,  type:'digital' },
      { name:'D3',  gpio:3,  type:'digital', pwm:true },
      { name:'D4',  gpio:4,  type:'digital' },
      { name:'D5',  gpio:5,  type:'digital', pwm:true },
      { name:'D6',  gpio:6,  type:'digital', pwm:true },
      { name:'D7',  gpio:7,  type:'digital' },
      { name:'D8',  gpio:8,  type:'digital' },
      { name:'D9',  gpio:9,  type:'digital', pwm:true },
      { name:'D10', gpio:10, type:'digital', pwm:true, spi:'SS' },
      { name:'D11', gpio:11, type:'digital', pwm:true, spi:'MOSI' },
      { name:'D12', gpio:12, type:'digital', spi:'MISO' },
      { name:'D13', gpio:13, type:'digital', spi:'SCK' },
      { name:'A0',  gpio:14, type:'analog', adc:true },
      { name:'A1',  gpio:15, type:'analog', adc:true },
      { name:'A2',  gpio:16, type:'analog', adc:true },
      { name:'A3',  gpio:17, type:'analog', adc:true },
      { name:'A4',  gpio:18, type:'analog', adc:true, i2c:'SDA' },
      { name:'A5',  gpio:19, type:'analog', adc:true, i2c:'SCL' },
      { name:'5V',  type:'power' },
      { name:'3V3', type:'power' },
      { name:'GND', type:'power' },
    ],
  },
  {
    id: 'arduino-nano',
    name: 'Arduino Nano',
    vendor: 'Arduino',
    mcu: 'ATmega328P',
    freq: 16,
    flashKb: 32,
    ramKb: 2,
    adcBits: 10,
    voltage: 5.0,
    ledBuiltin: 13,
    element: 'sim-board-uno',
    pins: [
      { name:'D2',  gpio:2,  type:'digital' },
      { name:'D3',  gpio:3,  type:'digital', pwm:true },
      { name:'D4',  gpio:4,  type:'digital' },
      { name:'D5',  gpio:5,  type:'digital', pwm:true },
      { name:'D6',  gpio:6,  type:'digital', pwm:true },
      { name:'D7',  gpio:7,  type:'digital' },
      { name:'D8',  gpio:8,  type:'digital' },
      { name:'D9',  gpio:9,  type:'digital', pwm:true },
      { name:'D10', gpio:10, type:'digital', pwm:true, spi:'SS' },
      { name:'D11', gpio:11, type:'digital', pwm:true, spi:'MOSI' },
      { name:'D12', gpio:12, type:'digital', spi:'MISO' },
      { name:'D13', gpio:13, type:'digital', spi:'SCK' },
      { name:'A0',  gpio:14, type:'analog', adc:true },
      { name:'A1',  gpio:15, type:'analog', adc:true },
      { name:'A2',  gpio:16, type:'analog', adc:true },
      { name:'A3',  gpio:17, type:'analog', adc:true },
      { name:'A4',  gpio:18, type:'analog', adc:true, i2c:'SDA' },
      { name:'A5',  gpio:19, type:'analog', adc:true, i2c:'SCL' },
      { name:'A6',  gpio:20, type:'analog', adc:true },
      { name:'A7',  gpio:21, type:'analog', adc:true },
      { name:'5V',  type:'power' },
      { name:'3V3', type:'power' },
      { name:'GND', type:'power' },
    ],
  },
  {
    id: 'esp32-c3-supermini',
    name: 'ESP32-C3 Super Mini',
    vendor: 'Espressif',
    mcu: 'ESP32-C3 (RISC-V)',
    freq: 160,
    flashKb: 4096,
    ramKb: 400,
    adcBits: 12,
    voltage: 3.3,
    ledBuiltin: 8,
    element: 'sim-board-esp32c3',
    pins: [
      { name:'G0',  gpio:0,  type:'digital', adc:true },
      { name:'G1',  gpio:1,  type:'digital', adc:true },
      { name:'G2',  gpio:2,  type:'digital', adc:true },
      { name:'G3',  gpio:3,  type:'digital', adc:true },
      { name:'G4',  gpio:4,  type:'digital', adc:true },
      { name:'G5',  gpio:5,  type:'digital' },
      { name:'G6',  gpio:6,  type:'digital' },
      { name:'G7',  gpio:7,  type:'digital' },
      { name:'G8',  gpio:8,  type:'digital' },
      { name:'G9',  gpio:9,  type:'digital' },
      { name:'G10', gpio:10, type:'digital' },
      { name:'G20', gpio:20, type:'digital', i2c:'SDA' },
      { name:'G21', gpio:21, type:'digital', i2c:'SCL' },
      { name:'5V',  type:'power' },
      { name:'3V3', type:'power' },
      { name:'GND', type:'power' },
    ],
  },
  {
    id: 'esp32-devkit',
    name: 'ESP32 DevKit V1',
    vendor: 'Espressif',
    mcu: 'ESP32 (Xtensa LX6)',
    freq: 240,
    flashKb: 4096,
    ramKb: 520,
    adcBits: 12,
    voltage: 3.3,
    ledBuiltin: 2,
    element: 'sim-board-uno',
    pins: [
      { name:'D0',  gpio:0,  type:'digital' },
      { name:'D2',  gpio:2,  type:'digital', pwm:true },
      { name:'D4',  gpio:4,  type:'digital', pwm:true },
      { name:'D5',  gpio:5,  type:'digital', pwm:true },
      { name:'D12', gpio:12, type:'digital', pwm:true, adc:true },
      { name:'D13', gpio:13, type:'digital', pwm:true, adc:true },
      { name:'D14', gpio:14, type:'digital', pwm:true, adc:true },
      { name:'D15', gpio:15, type:'digital', pwm:true, adc:true },
      { name:'D16', gpio:16, type:'digital' },
      { name:'D17', gpio:17, type:'digital' },
      { name:'D18', gpio:18, type:'digital', pwm:true, spi:'SCK' },
      { name:'D19', gpio:19, type:'digital', pwm:true, spi:'MISO' },
      { name:'D21', gpio:21, type:'digital', i2c:'SDA' },
      { name:'D22', gpio:22, type:'digital', i2c:'SCL' },
      { name:'D23', gpio:23, type:'digital', spi:'MOSI' },
      { name:'D25', gpio:25, type:'digital', pwm:true, adc:true },
      { name:'D26', gpio:26, type:'digital', pwm:true, adc:true },
      { name:'D27', gpio:27, type:'digital', pwm:true, adc:true },
      { name:'D32', gpio:32, type:'analog',  adc:true },
      { name:'D33', gpio:33, type:'analog',  adc:true },
      { name:'D34', gpio:34, type:'analog',  adc:true },
      { name:'D35', gpio:35, type:'analog',  adc:true },
      { name:'D36', gpio:36, type:'analog',  adc:true },
      { name:'D39', gpio:39, type:'analog',  adc:true },
      { name:'5V',  type:'power' },
      { name:'3V3', type:'power' },
      { name:'GND', type:'power' },
    ],
  },
];
