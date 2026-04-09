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

/**
 * ESP32-C3 Super Mini 핀 레이아웃
 * 공식 핀아웃 기준 2.54mm 간격
 * 보드 크기: 22.5mm × 18mm
 */
const C3_PINS: BoardPin[] = [
  // 좌측 (위→아래): G0, G1, G2, G3, G4, G5, G6, G7
  { name:'G0',  x:16, y:36,  side:'left', gpioNum:0,  type:'digital' },
  { name:'G1',  x:16, y:50,  side:'left', gpioNum:1,  type:'digital' },
  { name:'G2',  x:16, y:64,  side:'left', gpioNum:2,  type:'digital' },
  { name:'G3',  x:16, y:78,  side:'left', gpioNum:3,  type:'digital' },
  { name:'G4',  x:16, y:92,  side:'left', gpioNum:4,  type:'digital' },
  { name:'G5',  x:16, y:106, side:'left', gpioNum:5,  type:'digital' },
  { name:'G6',  x:16, y:120, side:'left', gpioNum:6,  type:'digital' },
  { name:'G7',  x:16, y:134, side:'left', gpioNum:7,  type:'digital' },
  // 우측 (위→아래): 5V, GND, 3V3, G8, G9, G10, G20, G21
  { name:'5V',  x:108, y:36,  side:'right', type:'power'   },
  { name:'GND', x:108, y:50,  side:'right', type:'power'   },
  { name:'3V3', x:108, y:64,  side:'right', type:'power'   },
  { name:'G8',  x:108, y:78,  side:'right', gpioNum:8,  type:'digital' },
  { name:'G9',  x:108, y:92,  side:'right', gpioNum:9,  type:'digital' },
  { name:'G10', x:108, y:106, side:'right', gpioNum:10, type:'digital' },
  { name:'G20', x:108, y:120, side:'right', gpioNum:20, type:'digital' },
  { name:'G21', x:108, y:134, side:'right', gpioNum:21, type:'digital' },
];

/**
 * <sim-board-esp32c3> — ESP32-C3 Super Mini 보드
 * 실물 기준 고정밀 SVG (파란 PCB, USB-C, ESP32-C3 칩)
 */
@customElement('sim-board-esp32c3')
export class SimBoardEsp32c3 extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 124px; height: 166px; }
      .pin-hole { cursor: crosshair; }
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
    const ledOn = (this.pinStates[8] ?? 1) === 0; // G8 active LOW

    return html`
      <svg width="124" height="166" viewBox="0 0 124 166" xmlns="http://www.w3.org/2000/svg">

        <!-- ── PCB 기판 (濃 파란색 — ESP32-C3 Super Mini 실물 색상) ── -->
        <rect x="22" y="10" width="80" height="146" rx="6"
          fill="#1a2e6a" stroke="#0d1a4a" stroke-width="1.2"/>
        <!-- PCB 상단 광택 -->
        <rect x="22" y="10" width="80" height="20" rx="6"
          fill="white" opacity="0.04"/>
        <!-- 실크스크린 구리 트레이스 패턴 -->
        <line x1="30" y1="30" x2="94" y2="30" stroke="#0d2050" stroke-width="0.5" opacity="0.8"/>
        <line x1="30" y1="148" x2="94" y2="148" stroke="#0d2050" stroke-width="0.5" opacity="0.8"/>

        <!-- ── 마운팅 홀 ── -->
        <circle cx="28" cy="16"  r="2" fill="#0a1438" stroke="#0d1a4a" stroke-width="0.5"/>
        <circle cx="96" cy="16"  r="2" fill="#0a1438" stroke="#0d1a4a" stroke-width="0.5"/>
        <circle cx="28" cy="150" r="2" fill="#0a1438" stroke="#0d1a4a" stroke-width="0.5"/>
        <circle cx="96" cy="150" r="2" fill="#0a1438" stroke="#0d1a4a" stroke-width="0.5"/>

        <!-- ── USB-C 커넥터 (상단 중앙) ── -->
        <!-- 금속 쉘 -->
        <rect x="47" y="2" width="30" height="14" rx="5"
          fill="#999" stroke="#777" stroke-width="0.8"/>
        <!-- 내부 포트 -->
        <rect x="51" y="4" width="22" height="10" rx="3.5" fill="#222"/>
        <!-- 핀 구분 -->
        <line x1="62" y1="4" x2="62" y2="14" stroke="#444" stroke-width="0.5"/>
        <!-- USB-C 마킹 -->
        <text x="62" y="12" font-size="4.5" fill="#555" font-family="monospace"
          text-anchor="middle">C</text>

        <!-- ── 안테나 패턴 (실크스크린) ── -->
        <!-- 안테나 영역 — PCB 오른쪽 상단 잘린 모서리처럼 표현 -->
        <path d="M80,16 Q94,16 94,30" fill="none" stroke="#1d3080" stroke-width="3"/>
        <!-- 안테나 심볼 -->
        <line x1="88" y1="16" x2="88" y2="26" stroke="#3050a0" stroke-width="1" stroke-dasharray="1,1"/>
        <line x1="84" y1="19" x2="92" y2="19" stroke="#3050a0" stroke-width="0.8"/>
        <line x1="85" y1="22" x2="91" y2="22" stroke="#3050a0" stroke-width="0.6"/>
        <line x1="86" y1="25" x2="90" y2="25" stroke="#3050a0" stroke-width="0.4"/>

        <!-- ── ESP32-C3 SoC 칩 (QFN 패키지) ── -->
        <rect x="36" y="56" width="52" height="52" rx="2.5"
          fill="#181818" stroke="#282828" stroke-width="1"/>
        <!-- QFN 핀 (상단) -->
        ${[0,1,2,3,4,5].map(i => svg`
          <rect x="${41 + i * 7}" y="53" width="4.5" height="3" rx="0.3"
            fill="#b0b0a0" opacity="0.9"/>
        `)}
        <!-- QFN 핀 (하단) -->
        ${[0,1,2,3,4,5].map(i => svg`
          <rect x="${41 + i * 7}" y="108" width="4.5" height="3" rx="0.3"
            fill="#b0b0a0" opacity="0.9"/>
        `)}
        <!-- QFN 핀 (좌측) -->
        ${[0,1,2,3].map(i => svg`
          <rect x="33" y="${65 + i * 9}" width="3" height="5" rx="0.3"
            fill="#b0b0a0" opacity="0.9"/>
        `)}
        <!-- QFN 핀 (우측) -->
        ${[0,1,2,3].map(i => svg`
          <rect x="88" y="${65 + i * 9}" width="3" height="5" rx="0.3"
            fill="#b0b0a0" opacity="0.9"/>
        `)}
        <!-- 칩 마킹 -->
        <!-- 핀 1 표시 -->
        <circle cx="39" cy="59" r="1.2" fill="#555"/>
        <!-- 텍스트 마킹 -->
        <text x="62" y="79" font-size="5.5" fill="#505050" font-family="monospace"
          text-anchor="middle" letter-spacing="0.3">ESP32-C3</text>
        <text x="62" y="88" font-size="4.5" fill="#404040" font-family="monospace"
          text-anchor="middle">FH4</text>
        <text x="62" y="97" font-size="4" fill="#383838" font-family="monospace"
          text-anchor="middle">espressif</text>
        <!-- 광택 -->
        <rect x="36" y="56" width="52" height="7" rx="2.5"
          fill="white" opacity="0.03"/>

        <!-- ── 디커플링 커패시터 SMD (0402/0603) ── -->
        <rect x="30" y="45" width="6" height="3" rx="0.5" fill="#333" stroke="#444" stroke-width="0.3"/>
        <rect x="88" y="45" width="6" height="3" rx="0.5" fill="#333" stroke="#444" stroke-width="0.3"/>
        <rect x="30" y="115" width="6" height="3" rx="0.5" fill="#333" stroke="#444" stroke-width="0.3"/>

        <!-- ── 전원 LED (Built-in — G8, Active LOW) ── -->
        <circle cx="75" cy="138" r="3.5"
          fill="${ledOn ? '#ffffff' : '#223355'}"
          stroke="${ledOn ? '#aaccff' : '#334466'}"
          stroke-width="0.8"/>
        ${ledOn ? svg`
          <circle cx="75" cy="138" r="5" fill="#88aaff" opacity="0.3"/>
        ` : ''}
        <text x="75" y="149" font-size="4" fill="#4466aa" font-family="monospace"
          text-anchor="middle">G8</text>

        <!-- ── Reset 버튼 ── -->
        <rect x="32" y="133" width="13" height="10" rx="1.5"
          fill="#1a1a1a" stroke="#333" stroke-width="0.8"/>
        <circle cx="38.5" cy="138" r="3.5" fill="#cc2222" stroke="#991111" stroke-width="0.8"/>
        <circle cx="38.5" cy="138" r="1.5" fill="#ee4444"/>
        <text x="38.5" y="150" font-size="3.5" fill="#884444" font-family="monospace"
          text-anchor="middle">RST</text>

        <!-- ── Boot 버튼 ── -->
        <rect x="48" y="133" width="13" height="10" rx="1.5"
          fill="#1a1a1a" stroke="#333" stroke-width="0.8"/>
        <circle cx="54.5" cy="138" r="3.5" fill="#333355" stroke="#222244" stroke-width="0.8"/>
        <circle cx="54.5" cy="138" r="1.5" fill="#445566"/>
        <text x="54.5" y="150" font-size="3.5" fill="#445588" font-family="monospace"
          text-anchor="middle">BOOT</text>

        <!-- ── 핀 헤더 배경 ── -->
        <rect x="10" y="28" width="12" height="114" rx="1.5"
          fill="#111" stroke="#222" stroke-width="0.5"/>
        <rect x="102" y="28" width="12" height="114" rx="1.5"
          fill="#111" stroke="#222" stroke-width="0.5"/>

        <!-- ── 핀 구멍들 ── -->
        ${C3_PINS.map(pin => {
          const val = pin.gpioNum !== undefined ? (this.pinStates[pin.gpioNum] ?? 0) : 0;
          const isHigh = val > 0;
          const isLeft = pin.side === 'left';
          const ringColor = pin.type === 'power'
            ? (pin.name === 'GND' ? '#88cc88' : '#cc8888')
            : '#a0a060';
          const holeColor = isHigh ? '#ffdd44' : '#08102a';

          return svg`
            <g class="pin-hole" data-pin="${pin.name}">
              <!-- 구리 패드 -->
              <circle cx="${pin.x}" cy="${pin.y}" r="4"
                fill="${ringColor}" opacity="0.8"/>
              <!-- 핀 구멍 -->
              <circle cx="${pin.x}" cy="${pin.y}" r="2"
                fill="${holeColor}"/>
              <!-- 핀 라벨 -->
              <text
                x="${isLeft ? 12 : 112}"
                y="${pin.y + 1.5}"
                font-size="4.5"
                fill="${pin.type === 'power' ? '#88aacc' : '#7a90cc'}"
                font-family="monospace"
                text-anchor="${isLeft ? 'start' : 'end'}"
              >${pin.name}</text>
            </g>
          `;
        })}

        <!-- ── 실크스크린 보드명 ── -->
        <text x="62" y="158" font-size="5" fill="#1e3888" font-family="Arial,sans-serif"
          text-anchor="middle" font-weight="bold" letter-spacing="0.5">ESP32-C3 Super Mini</text>

        <!-- ── 외곽 테두리 ── -->
        <rect x="22" y="10" width="80" height="146" rx="6"
          fill="none" stroke="#0d1a4a" stroke-width="0.8"/>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-board-esp32c3': SimBoardEsp32c3;
  }
}
