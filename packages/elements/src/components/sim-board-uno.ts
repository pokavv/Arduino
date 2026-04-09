import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

interface BoardPin {
  name: string;
  x: number;
  y: number;
  type: 'digital' | 'analog' | 'power' | 'other';
  gpioNum?: number;
}

/** Arduino Uno R3 핀 레이아웃 */
const UNO_PINS: BoardPin[] = [
  // 디지털 핀 (우측 상단, D0~D13)
  { name:'D0',  x:284, y:18,  type:'digital', gpioNum:0 },
  { name:'D1',  x:270, y:18,  type:'digital', gpioNum:1 },
  { name:'D2',  x:256, y:18,  type:'digital', gpioNum:2 },
  { name:'D3~', x:242, y:18,  type:'digital', gpioNum:3 },
  { name:'D4',  x:228, y:18,  type:'digital', gpioNum:4 },
  { name:'D5~', x:214, y:18,  type:'digital', gpioNum:5 },
  { name:'D6~', x:200, y:18,  type:'digital', gpioNum:6 },
  { name:'D7',  x:186, y:18,  type:'digital', gpioNum:7 },
  { name:'D8',  x:162, y:18,  type:'digital', gpioNum:8 },
  { name:'D9~', x:148, y:18,  type:'digital', gpioNum:9 },
  { name:'D10~',x:134, y:18,  type:'digital', gpioNum:10 },
  { name:'D11~',x:120, y:18,  type:'digital', gpioNum:11 },
  { name:'D12', x:106, y:18,  type:'digital', gpioNum:12 },
  { name:'D13', x:92,  y:18,  type:'digital', gpioNum:13 },
  // 전원 (좌측 상단)
  { name:'AREF',x:74, y:18, type:'other' },
  { name:'GND', x:60, y:18, type:'power' },
  // 아날로그 (하단)
  { name:'A0', x:37, y:182, type:'analog', gpioNum:14 },
  { name:'A1', x:51, y:182, type:'analog', gpioNum:15 },
  { name:'A2', x:65, y:182, type:'analog', gpioNum:16 },
  { name:'A3', x:79, y:182, type:'analog', gpioNum:17 },
  { name:'A4/SDA',x:93, y:182, type:'analog', gpioNum:18 },
  { name:'A5/SCL',x:107,y:182, type:'analog', gpioNum:19 },
  // 전원 핀 (하단 좌측)
  { name:'VIN', x:130, y:182, type:'power' },
  { name:'GND', x:144, y:182, type:'power' },
  { name:'GND', x:158, y:182, type:'power' },
  { name:'5V',  x:172, y:182, type:'power' },
  { name:'3V3', x:186, y:182, type:'power' },
  { name:'IOREF',x:200,y:182, type:'other' },
  { name:'RST', x:214, y:182, type:'other' },
];

/**
 * <sim-board-uno> — Arduino Uno R3 보드
 */
@customElement('sim-board-uno')
export class SimBoardUno extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 300px; height: 200px; }
      .pin-hole { cursor: crosshair; }
      .pin-hole:hover circle { fill: #ffdd44; }
    `,
  ];

  @property({ type: Object }) pinStates: Record<number, number> = {};

  override get componentType() { return 'board-uno'; }
  override get pins() { return UNO_PINS.map(p => p.name); }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    const p = UNO_PINS.find(p => p.name === pin || p.gpioNum?.toString() === pin);
    if (p?.gpioNum !== undefined) {
      this.pinStates = { ...this.pinStates, [p.gpioNum]: v };
    }
  }

  override getPinPositions() {
    return new Map(UNO_PINS.map(p => [p.name, { x: p.x, y: p.y }]));
  }

  override render() {
    return html`
      <svg width="300" height="200" viewBox="0 0 300 200">
        <!-- PCB 기판 -->
        <rect width="300" height="200" rx="8" fill="#1a7a1a" stroke="#0a5a0a" stroke-width="2"/>

        <!-- USB 커넥터 (좌측) -->
        <rect x="0" y="80" width="22" height="30" rx="3" fill="#555" stroke="#333" stroke-width="1"/>
        <rect x="3" y="84" width="16" height="22" rx="1" fill="#333"/>

        <!-- 전원 커넥터 -->
        <rect x="0" y="130" width="20" height="18" rx="2" fill="#333" stroke="#222" stroke-width="1"/>

        <!-- IC 칩 (ATmega328P) -->
        <rect x="100" y="70" width="80" height="60" rx="3" fill="#111" stroke="#333" stroke-width="1"/>
        <text x="140" y="105" font-size="8" fill="#555" font-family="monospace" text-anchor="middle">ATmega328P</text>

        <!-- 핀 구멍들 -->
        ${UNO_PINS.map(pin => {
          const isDigital = pin.type === 'digital';
          const isAnalog = pin.type === 'analog';
          const isPower = pin.type === 'power';
          const val = pin.gpioNum !== undefined ? (this.pinStates[pin.gpioNum] ?? 0) : 0;
          const isHigh = val > 0;

          return svg`
            <g class="pin-hole" data-pin="${pin.name}">
              <circle cx="${pin.x}" cy="${pin.y}" r="4"
                fill="${isHigh ? '#ffdd44' : '#0a4a0a'}"
                stroke="${isDigital ? '#aaa' : isAnalog ? '#f8a' : isPower ? '#f88' : '#888'}"
                stroke-width="1"/>
              <text x="${pin.x}" y="${pin.y > 100 ? pin.y + 10 : pin.y - 6}"
                font-size="4.5" fill="#88bb88" font-family="monospace" text-anchor="middle"
                transform="rotate(-90, ${pin.x}, ${pin.y > 100 ? pin.y + 10 : pin.y - 6})"
              >${pin.name}</text>
            </g>
          `;
        })}

        <!-- ARDUINO 로고 -->
        <text x="150" y="145" font-size="14" fill="#0a5a0a" font-family="Arial" text-anchor="middle"
          font-weight="bold">ARDUINO</text>
        <text x="150" y="158" font-size="9" fill="#0a5a0a" font-family="Arial" text-anchor="middle">UNO R3</text>

        <!-- Reset 버튼 -->
        <circle cx="260" cy="160" r="6" fill="#cc2222" stroke="#aa1111" stroke-width="1"/>
        <text x="260" y="163" font-size="5" fill="white" font-family="monospace" text-anchor="middle">RST</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-board-uno': SimBoardUno;
  }
}
