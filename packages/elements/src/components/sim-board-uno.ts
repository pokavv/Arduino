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

/** Arduino Uno R3 핀 레이아웃 — 공식 데이터시트 기준 2.54mm 간격 */
const UNO_PINS: BoardPin[] = [
  // 디지털 핀 (우측 상단, D0~D13) — 실물 기준 오른쪽부터
  { name:'D0',   x:280, y:18, type:'digital', gpioNum:0  },
  { name:'D1',   x:266, y:18, type:'digital', gpioNum:1  },
  { name:'D2',   x:252, y:18, type:'digital', gpioNum:2  },
  { name:'D3~',  x:238, y:18, type:'digital', gpioNum:3  },
  { name:'D4',   x:224, y:18, type:'digital', gpioNum:4  },
  { name:'D5~',  x:210, y:18, type:'digital', gpioNum:5  },
  { name:'D6~',  x:196, y:18, type:'digital', gpioNum:6  },
  { name:'D7',   x:182, y:18, type:'digital', gpioNum:7  },
  { name:'D8',   x:162, y:18, type:'digital', gpioNum:8  },
  { name:'D9~',  x:148, y:18, type:'digital', gpioNum:9  },
  { name:'D10~', x:134, y:18, type:'digital', gpioNum:10 },
  { name:'D11~', x:120, y:18, type:'digital', gpioNum:11 },
  { name:'D12',  x:106, y:18, type:'digital', gpioNum:12 },
  { name:'D13',  x:92,  y:18, type:'digital', gpioNum:13 },
  // 특수 핀
  { name:'AREF', x:72, y:18, type:'other'   },
  { name:'GND',  x:58, y:18, type:'power'   },
  // 아날로그 (하단)
  { name:'A0',       x:36,  y:184, type:'analog', gpioNum:14 },
  { name:'A1',       x:50,  y:184, type:'analog', gpioNum:15 },
  { name:'A2',       x:64,  y:184, type:'analog', gpioNum:16 },
  { name:'A3',       x:78,  y:184, type:'analog', gpioNum:17 },
  { name:'A4/SDA',   x:92,  y:184, type:'analog', gpioNum:18 },
  { name:'A5/SCL',   x:106, y:184, type:'analog', gpioNum:19 },
  // 전원 핀 (하단 우측)
  { name:'VIN',  x:130, y:184, type:'power' },
  { name:'GND',  x:144, y:184, type:'power' },
  { name:'GND',  x:158, y:184, type:'power' },
  { name:'5V',   x:172, y:184, type:'power' },
  { name:'3V3',  x:186, y:184, type:'power' },
  { name:'IOREF',x:200, y:184, type:'other' },
  { name:'RST',  x:214, y:184, type:'other' },
];

/**
 * <sim-board-uno> — Arduino Uno R3 보드
 * 공식 PCB 치수 기준 고정밀 SVG
 */
@customElement('sim-board-uno')
export class SimBoardUno extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 308px; height: 208px; }
      .pin-hole { cursor: crosshair; }
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
      <svg width="308" height="208" viewBox="0 0 308 208" xmlns="http://www.w3.org/2000/svg">

        <!-- ── PCB 기판 (Arduino 공식 teal green) ── -->
        <rect x="2" y="2" width="304" height="204" rx="8"
          fill="#006060" stroke="#004040" stroke-width="1.5"/>
        <!-- PCB 표면 미묘한 질감 (위에서 빛) -->
        <rect x="2" y="2" width="304" height="40" rx="8"
          fill="white" opacity="0.04"/>
        <!-- 구리 트레이스 패턴 (장식) -->
        <line x1="30" y1="30" x2="290" y2="30" stroke="#004848" stroke-width="0.5" opacity="0.6"/>
        <line x1="30" y1="175" x2="230" y2="175" stroke="#004848" stroke-width="0.5" opacity="0.6"/>

        <!-- ── 마운팅 홀 4개 ── -->
        <circle cx="14"  cy="14"  r="3" fill="#003030" stroke="#002020" stroke-width="0.8"/>
        <circle cx="294" cy="14"  r="3" fill="#003030" stroke="#002020" stroke-width="0.8"/>
        <circle cx="14"  cy="194" r="3" fill="#003030" stroke="#002020" stroke-width="0.8"/>
        <circle cx="240" cy="194" r="3" fill="#003030" stroke="#002020" stroke-width="0.8"/>

        <!-- ── USB Type-B 커넥터 (좌측) ── -->
        <!-- 금속 쉘 -->
        <rect x="-2" y="74" width="26" height="34" rx="3"
          fill="#888" stroke="#666" stroke-width="1"/>
        <!-- USB 포트 오프닝 (사다리꼴 모양) -->
        <rect x="2" y="78" width="18" height="26" rx="1" fill="#222"/>
        <!-- USB 핀 가이드 -->
        <rect x="6" y="82" width="10" height="18" rx="1" fill="#333"/>
        <!-- USB 로고 힌트 -->
        <text x="10" y="93" font-size="5" fill="#555" font-family="monospace" text-anchor="middle">USB</text>

        <!-- ── 전원 DC 배럴 잭 (하단 좌측) ── -->
        <rect x="-2" y="136" width="20" height="22" rx="3"
          fill="#333" stroke="#222" stroke-width="1"/>
        <circle cx="9" cy="147" r="5" fill="#111" stroke="#444" stroke-width="0.8"/>
        <circle cx="9" cy="147" r="2" fill="#555"/>

        <!-- ── ICSP 헤더 (6핀 2x3) — 우측 상단 ── -->
        <rect x="276" y="38" width="26" height="18" rx="1"
          fill="#1a1a1a" stroke="#333" stroke-width="0.8"/>
        ${[0,1,2].map(r => [0,1].map(c => svg`
          <circle cx="${282 + c * 14}" cy="${43 + r * 6}" r="1.5"
            fill="#c8a060" stroke="#888" stroke-width="0.5"/>
        `))}
        <text x="289" y="60" font-size="4.5" fill="#448" font-family="monospace"
          text-anchor="middle">ICSP</text>

        <!-- ── ATmega328P DIP-28 칩 ── -->
        <!-- DIP 패키지 몸체 -->
        <rect x="112" y="66" width="72" height="76" rx="2"
          fill="#1a1a1a" stroke="#2a2a2a" stroke-width="1"/>
        <!-- 핀 인덱스 노치 (왼쪽 상단) -->
        <path d="M112,80 Q118,80 118,73 L112,73Z" fill="#2a2a2a"/>
        <circle cx="115" cy="76" r="2" fill="#333"/>
        <!-- DIP 핀 (왼쪽) -->
        ${[0,1,2,3,4,5,6].map(i => svg`
          <rect x="104" y="${74 + i * 9}" width="8" height="2.5"
            rx="0.5" fill="#c8c8c8" opacity="0.9"/>
        `)}
        <!-- DIP 핀 (오른쪽) -->
        ${[0,1,2,3,4,5,6].map(i => svg`
          <rect x="184" y="${74 + i * 9}" width="8" height="2.5"
            rx="0.5" fill="#c8c8c8" opacity="0.9"/>
        `)}
        <!-- 칩 마킹 텍스트 -->
        <text x="148" y="96" font-size="5.5" fill="#666" font-family="monospace"
          text-anchor="middle" letter-spacing="0.2">ATMEGA328P</text>
        <text x="148" y="105" font-size="4.5" fill="#555" font-family="monospace"
          text-anchor="middle">-PU</text>
        <text x="148" y="114" font-size="4" fill="#444" font-family="monospace"
          text-anchor="middle">ARDUINO</text>
        <!-- 광택 하이라이트 -->
        <rect x="112" y="66" width="72" height="8" rx="2"
          fill="white" opacity="0.04"/>

        <!-- ── ATmega16U2 SMD 칩 (USB 옆) ── -->
        <rect x="48" y="66" width="26" height="24" rx="1.5"
          fill="#111" stroke="#222" stroke-width="0.8"/>
        <!-- SMD 핀 (상하) -->
        ${[0,1,2,3].map(i => svg`
          <rect x="${52 + i * 6}" y="62" width="3.5" height="4" rx="0.3" fill="#bbb" opacity="0.8"/>
          <rect x="${52 + i * 6}" y="90" width="3.5" height="4" rx="0.3" fill="#bbb" opacity="0.8"/>
        `)}
        <text x="61" y="80" font-size="4" fill="#555" font-family="monospace"
          text-anchor="middle">16U2</text>

        <!-- ── 수정 발진자 (Crystal) ── -->
        <rect x="58" y="110" width="18" height="8" rx="3"
          fill="#ccc" stroke="#aaa" stroke-width="0.8"/>
        <rect x="60" y="110" width="14" height="8" rx="2"
          fill="#e8e8e0" stroke="#aaa" stroke-width="0.5"/>
        <!-- 크리스탈 각인 -->
        <text x="67" y="116" font-size="3.5" fill="#888" font-family="monospace"
          text-anchor="middle">16MHz</text>

        <!-- ── 전원 LED (ON 표시 - 녹색) ── -->
        <circle cx="64" cy="148" r="3" fill="#33dd33" opacity="0.9"/>
        <circle cx="64" cy="148" r="1.5" fill="#88ff88"/>
        <text x="64" y="157" font-size="4" fill="#448844" font-family="monospace"
          text-anchor="middle">ON</text>

        <!-- ── TX/RX LED ── -->
        <circle cx="74" cy="148" r="2.5" fill="#ff8800" opacity="0.7"/>
        <text x="74" y="157" font-size="4" fill="#664400" font-family="monospace"
          text-anchor="middle">TX</text>
        <circle cx="83" cy="148" r="2.5" fill="#ff8800" opacity="0.7"/>
        <text x="83" y="157" font-size="4" fill="#664400" font-family="monospace"
          text-anchor="middle">RX</text>

        <!-- ── L LED (핀 13) ── -->
        <circle cx="92" cy="148" r="2.5"
          fill="${(this.pinStates[13] ?? 0) > 0 ? '#ffcc00' : '#886600'}" opacity="0.9"/>
        <text x="92" y="157" font-size="4" fill="#665500" font-family="monospace"
          text-anchor="middle">L</text>

        <!-- ── 리셋 버튼 ── -->
        <rect x="250" y="152" width="16" height="12" rx="2"
          fill="#222" stroke="#333" stroke-width="0.8"/>
        <circle cx="258" cy="158" r="4.5" fill="#cc2222" stroke="#991111" stroke-width="0.8"/>
        <circle cx="258" cy="158" r="2" fill="#ee4444"/>
        <text x="258" y="169" font-size="4" fill="#884444" font-family="monospace"
          text-anchor="middle">RST</text>

        <!-- ── 핀 헤더 배경 플라스틱 ── -->
        <!-- 디지털 상단 헤더 (2열) -->
        <rect x="55" y="10" width="238" height="16" rx="1.5"
          fill="#111" stroke="#222" stroke-width="0.5"/>
        <!-- 아날로그/전원 하단 헤더 -->
        <rect x="28" y="176" width="200" height="16" rx="1.5"
          fill="#111" stroke="#222" stroke-width="0.5"/>

        <!-- ── 핀 구멍들 ── -->
        ${UNO_PINS.map(pin => {
          const val = pin.gpioNum !== undefined ? (this.pinStates[pin.gpioNum] ?? 0) : 0;
          const isHigh = val > 0;
          const holeColor = isHigh ? '#ffdd44' : '#0a3030';
          const ringColor = pin.type === 'digital' ? '#c8a060'
            : pin.type === 'analog'  ? '#c86060'
            : pin.type === 'power'   ? '#c06060'
            : '#888888';

          return svg`
            <g class="pin-hole" data-pin="${pin.name}">
              <!-- 구리 패드 -->
              <circle cx="${pin.x}" cy="${pin.y}" r="4.5"
                fill="${ringColor}" opacity="0.85"/>
              <!-- 핀 구멍 -->
              <circle cx="${pin.x}" cy="${pin.y}" r="2.2"
                fill="${holeColor}"/>
              <!-- 핀 라벨 -->
              <text
                x="${pin.x}"
                y="${pin.y > 100 ? pin.y + 12 : pin.y - 8}"
                font-size="4" fill="#88ccaa" font-family="monospace"
                text-anchor="middle"
                transform="rotate(-90,${pin.x},${pin.y > 100 ? pin.y + 12 : pin.y - 8})"
              >${pin.name.replace('~','')}</text>
            </g>
          `;
        })}

        <!-- ── 콘덴서 (전해 커패시터 100uF) ── -->
        <ellipse cx="230" cy="150" rx="8" ry="10"
          fill="#444" stroke="#333" stroke-width="0.8"/>
        <rect x="226" y="140" width="8" height="4" rx="0" fill="#ccc" opacity="0.3"/>
        <text x="230" y="153" font-size="4" fill="#888" font-family="monospace"
          text-anchor="middle">100</text>
        <!-- 소형 커패시터들 -->
        <ellipse cx="215" cy="150" rx="5" ry="7" fill="#333" stroke="#444" stroke-width="0.8"/>
        <ellipse cx="245" cy="150" rx="4" ry="6" fill="#445544" stroke="#334433" stroke-width="0.8"/>

        <!-- ── 전압 레귤레이터 (7805 TO-220) ── -->
        <rect x="286" y="100" width="14" height="22" rx="1"
          fill="#333" stroke="#222" stroke-width="0.8"/>
        <rect x="286" y="100" width="14" height="8" fill="#444"/>
        <!-- 금속 탭 -->
        <rect x="284" y="96" width="18" height="6" rx="1" fill="#555" stroke="#333" stroke-width="0.5"/>
        <text x="293" y="118" font-size="4" fill="#666" font-family="monospace"
          text-anchor="middle" transform="rotate(90,293,118)">LDO</text>

        <!-- ── ARDUINO 로고 ── -->
        <text x="160" y="158" font-size="11" fill="#007777" font-family="Arial,sans-serif"
          text-anchor="middle" font-weight="bold" letter-spacing="1">ARDUINO</text>
        <text x="160" y="170" font-size="7" fill="#006666" font-family="Arial,sans-serif"
          text-anchor="middle" letter-spacing="2">UNO  R3</text>

        <!-- ── 외곽 테두리 ── -->
        <rect x="2" y="2" width="304" height="204" rx="8"
          fill="none" stroke="#004848" stroke-width="1"/>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-board-uno': SimBoardUno;
  }
}
