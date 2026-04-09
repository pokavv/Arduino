import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

interface BoardPin {
  name: string;
  x: number;
  y: number;
  side: 'left' | 'right';
  gpioNum?: number;
  type: 'digital' | 'analog' | 'power' | 'other';
}

/** ESP32-C3 Super Mini 핀 레이아웃 (실제 핀아웃 기반) */
const C3_PINS: BoardPin[] = [
  // 좌측 (위→아래)
  { name:'G0',    x:8,  y:32, side:'left', gpioNum:0,  type:'digital' },
  { name:'G1',    x:8,  y:46, side:'left', gpioNum:1,  type:'digital' },
  { name:'G2',    x:8,  y:60, side:'left', gpioNum:2,  type:'digital' },
  { name:'G3',    x:8,  y:74, side:'left', gpioNum:3,  type:'digital' },
  { name:'G4',    x:8,  y:88, side:'left', gpioNum:4,  type:'digital' },
  { name:'G5',    x:8, y:102, side:'left', gpioNum:5,  type:'digital' },
  { name:'G6',    x:8, y:116, side:'left', gpioNum:6,  type:'digital' },
  { name:'G7',    x:8, y:130, side:'left', gpioNum:7,  type:'digital' },
  // 우측 (위→아래)
  { name:'5V',    x:112, y:32, side:'right', type:'power' },
  { name:'GND',   x:112, y:46, side:'right', type:'power' },
  { name:'3V3',   x:112, y:60, side:'right', type:'power' },
  { name:'G8',    x:112, y:74, side:'right', gpioNum:8,  type:'digital' },
  { name:'G9',    x:112, y:88, side:'right', gpioNum:9,  type:'digital' },
  { name:'G10',   x:112,y:102, side:'right', gpioNum:10, type:'digital' },
  { name:'G20',   x:112,y:116, side:'right', gpioNum:20, type:'digital' },
  { name:'G21',   x:112,y:130, side:'right', gpioNum:21, type:'digital' },
];

/**
 * <sim-board-esp32c3> — ESP32-C3 Super Mini 보드
 */
@customElement('sim-board-esp32c3')
export class SimBoardEsp32c3 extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 120px; height: 160px; }
      .pin-hole:hover circle { fill: #ffdd44; }
    `,
  ];

  @property({ type: Object }) pinStates: Record<number, number> = {};

  override get componentType() { return 'board-esp32c3'; }
  override get pins() { return C3_PINS.map(p => p.name); }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    const p = C3_PINS.find(p => p.name === pin || `G${p.gpioNum}` === pin);
    if (p?.gpioNum !== undefined) {
      this.pinStates = { ...this.pinStates, [p.gpioNum]: v };
    }
  }

  override getPinPositions() {
    return new Map(C3_PINS.map(p => [p.name, { x: p.x, y: p.y }]));
  }

  override render() {
    return html`
      <svg width="120" height="160" viewBox="0 0 120 160">
        <!-- PCB -->
        <rect x="20" y="8" width="80" height="144" rx="6" fill="#1a3a7a" stroke="#0a2a6a" stroke-width="1.5"/>

        <!-- USB-C 커넥터 (상단) -->
        <rect x="46" y="0" width="28" height="12" rx="4" fill="#444" stroke="#333" stroke-width="1"/>
        <rect x="50" y="2" width="20" height="8" rx="2" fill="#222"/>

        <!-- ESP32-C3 칩 -->
        <rect x="34" y="52" width="52" height="52" rx="3" fill="#111" stroke="#333" stroke-width="1"/>
        <text x="60" y="78" font-size="5.5" fill="#555" font-family="monospace" text-anchor="middle">ESP32-C3</text>
        <text x="60" y="88" font-size="4.5" fill="#444" font-family="monospace" text-anchor="middle">SUPER MINI</text>

        <!-- 안테나 -->
        <path d="M60,14 L60,24 M54,18 L66,18" stroke="#888" stroke-width="1.5" stroke-linecap="round"/>

        <!-- 핀 구멍들 -->
        ${C3_PINS.map(pin => {
          const val = pin.gpioNum !== undefined ? (this.pinStates[pin.gpioNum] ?? 0) : 0;
          const isHigh = val > 0;
          const isLeft = pin.side === 'left';

          return svg`
            <g class="pin-hole" data-pin="${pin.name}">
              <circle cx="${pin.x}" cy="${pin.y}" r="3.5"
                fill="${isHigh ? '#ffdd44' : '#0a1a4a'}"
                stroke="${pin.type === 'power' ? '#f88' : '#6a8aaa'}"
                stroke-width="1"/>
              <text
                x="${isLeft ? 14 : 106}"
                y="${pin.y + 1.5}"
                font-size="5" fill="#8899cc" font-family="monospace"
                text-anchor="${isLeft ? 'start' : 'end'}"
              >${pin.name}</text>
            </g>
          `;
        })}

        <!-- Built-in LED indicator (G8, active LOW) -->
        <circle cx="76" cy="130" r="3"
          fill="${(this.pinStates[8] ?? 1) === 0 ? '#ffffff' : '#334455'}"
          stroke="#556" stroke-width="0.5"/>
        <text x="76" y="142" font-size="4" fill="#556" font-family="monospace" text-anchor="middle">LED</text>

        <!-- Reset 버튼 -->
        <circle cx="36" cy="130" r="4" fill="#cc2222" stroke="#aa1111" stroke-width="1"/>
        <text x="36" y="144" font-size="4" fill="#888" font-family="monospace" text-anchor="middle">RST</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-board-esp32c3': SimBoardEsp32c3;
  }
}
