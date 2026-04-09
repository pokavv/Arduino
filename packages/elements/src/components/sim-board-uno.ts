import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

interface BoardPin {
  name: string;
  x: number;
  y: number;
  type: 'digital' | 'analog' | 'power' | 'other';
  gpioNum?: number;
  isPwm?: boolean;
}

/**
 * Arduino Uno R3 핀 레이아웃
 * 공식 치수: 68.6mm × 53.4mm, 2.54mm 간격
 * SVG: 308×210px
 *
 * 디지털 상단 (우→좌, D0~D13, AREF, GND)
 * 아날로그 하단 (좌→우, A0~A5, VIN, GND×2, 5V, 3V3, IOREF, RST)
 */
const UNO_PINS: BoardPin[] = [
  // 디지털 헤더 (우측부터)
  { name:'D0',    x:280, y:18, type:'digital', gpioNum:0  },
  { name:'D1',    x:266, y:18, type:'digital', gpioNum:1  },
  { name:'D2',    x:252, y:18, type:'digital', gpioNum:2  },
  { name:'D3~',   x:238, y:18, type:'digital', gpioNum:3,  isPwm:true },
  { name:'D4',    x:224, y:18, type:'digital', gpioNum:4  },
  { name:'D5~',   x:210, y:18, type:'digital', gpioNum:5,  isPwm:true },
  { name:'D6~',   x:196, y:18, type:'digital', gpioNum:6,  isPwm:true },
  { name:'D7',    x:182, y:18, type:'digital', gpioNum:7  },
  { name:'D8',    x:162, y:18, type:'digital', gpioNum:8  },
  { name:'D9~',   x:148, y:18, type:'digital', gpioNum:9,  isPwm:true },
  { name:'D10~',  x:134, y:18, type:'digital', gpioNum:10, isPwm:true },
  { name:'D11~',  x:120, y:18, type:'digital', gpioNum:11, isPwm:true },
  { name:'D12',   x:106, y:18, type:'digital', gpioNum:12 },
  { name:'D13',   x:92,  y:18, type:'digital', gpioNum:13 },
  { name:'AREF',  x:72,  y:18, type:'other'   },
  { name:'GND',   x:58,  y:18, type:'power'   },
  // 아날로그/전원 헤더
  { name:'A0',    x:36,  y:190, type:'analog', gpioNum:14 },
  { name:'A1',    x:50,  y:190, type:'analog', gpioNum:15 },
  { name:'A2',    x:64,  y:190, type:'analog', gpioNum:16 },
  { name:'A3',    x:78,  y:190, type:'analog', gpioNum:17 },
  { name:'A4/SDA',x:92,  y:190, type:'analog', gpioNum:18 },
  { name:'A5/SCL',x:106, y:190, type:'analog', gpioNum:19 },
  { name:'VIN',   x:130, y:190, type:'power'  },
  { name:'GND',   x:144, y:190, type:'power'  },
  { name:'GND',   x:158, y:190, type:'power'  },
  { name:'5V',    x:172, y:190, type:'power'  },
  { name:'3V3',   x:186, y:190, type:'power'  },
  { name:'IOREF', x:200, y:190, type:'other'  },
  { name:'RST',   x:214, y:190, type:'other'  },
];

@customElement('sim-board-uno')
export class SimBoardUno extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 308px; height: 210px; }
      .pin-hole { cursor: crosshair; }
      .btn-rst  { cursor: pointer; }
    `,
  ];

  @property({ type: Object }) pinStates: Record<number, number> = {};
  @property({ type: Boolean }) rstPressed = false;

  override get componentType() { return 'board-uno'; }
  override get pins() { return UNO_PINS.map(p => p.name); }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    const p = UNO_PINS.find(
      p => p.name === pin
        || (p.gpioNum !== undefined && (p.gpioNum.toString() === pin || `D${p.gpioNum}` === pin || `A${p.gpioNum - 14}` === pin))
    );
    if (p?.gpioNum !== undefined) {
      this.pinStates = { ...this.pinStates, [p.gpioNum]: v };
    }
  }

  override getPinPositions() {
    return new Map(UNO_PINS.map(p => [p.name, { x: p.x, y: p.y }]));
  }

  // ── RST 버튼 ─────────────────────────────────────────────
  private _onRstDown(e: PointerEvent) {
    e.stopPropagation();
    this.rstPressed = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('sim-reset', { bubbles: true, composed: true }));
    setTimeout(() => {
      this.rstPressed = false;
      this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
    }, 150);
  }

  override render() {
    const d13on = (this.pinStates[13] ?? 0) > 0;
    const txOn  = (this.pinStates[1]  ?? 0) > 0;
    const rxOn  = (this.pinStates[0]  ?? 0) > 0;

    return html`
      <svg width="308" height="210" viewBox="0 0 308 210" xmlns="http://www.w3.org/2000/svg">

        <!-- ── PCB 기판 (Arduino 공식 teal/green) ── -->
        <!-- 메인 사각형 -->
        <rect x="2" y="2" width="304" height="206" rx="6"
          fill="#00695c" stroke="#004d40" stroke-width="1.2"/>
        <!-- 상단 광택 -->
        <rect x="2" y="2" width="304" height="30" rx="6"
          fill="white" opacity="0.03"/>
        <!-- 실크스크린 테두리 -->
        <rect x="8" y="8" width="292" height="194" rx="4"
          fill="none" stroke="#004a42" stroke-width="0.4" opacity="0.7"/>

        <!-- ── 마운팅 홀 ── -->
        <circle cx="14"  cy="14"  r="3.2" fill="#003d35"/>
        <circle cx="294" cy="14"  r="3.2" fill="#003d35"/>
        <circle cx="14"  cy="196" r="3.2" fill="#003d35"/>
        <circle cx="242" cy="196" r="3.2" fill="#003d35"/>

        <!-- ── USB Type-B 커넥터 (좌측) ── -->
        <rect x="0"  y="72" width="26" height="36" rx="3"
          fill="#a0a0a0" stroke="#808080" stroke-width="1"/>
        <rect x="2"  y="76" width="20" height="28" rx="1.5" fill="#1a1a1a"/>
        <!-- Type-B 특유의 사다리꼴 구멍 -->
        <polygon points="4,78 20,78 22,100 2,100" fill="#0d0d0d"/>
        <!-- USB 중앙 가이드 -->
        <rect x="8"  y="82" width="8" height="12" rx="1" fill="#2a2a2a"/>
        <text x="12" y="97" font-size="4" fill="#444" font-family="monospace" text-anchor="middle">USB</text>

        <!-- ── DC 배럴 잭 (하단 좌측) ── -->
        <rect x="0" y="130" width="22" height="24" rx="3"
          fill="#2a2a2a" stroke="#1a1a1a" stroke-width="1"/>
        <ellipse cx="11" cy="142" rx="7" ry="7" fill="#111" stroke="#333" stroke-width="0.8"/>
        <circle cx="11" cy="142" r="3" fill="#333"/>
        <circle cx="11" cy="142" r="1.2" fill="#555"/>

        <!-- ── ICSP 헤더 (6핀 2×3) ── -->
        <rect x="272" y="38" width="28" height="20" rx="1.5"
          fill="#111" stroke="#2a2a2a" stroke-width="0.8"/>
        ${[0,1,2].map(r => [0,1].map(c => svg`
          <circle cx="${278 + c*14}" cy="${43 + r*6}" r="1.8"
            fill="#c8a060" stroke="#888" stroke-width="0.5"/>
        `))}
        <text x="286" y="62" font-size="4" fill="#4a6a4a" font-family="monospace"
          text-anchor="middle">ICSP</text>

        <!-- ── ATmega328P DIP-28 칩 ── -->
        <rect x="112" y="64" width="74" height="80" rx="2"
          fill="#111" stroke="#1e1e1e" stroke-width="0.8"/>
        <!-- DIP 핀 1 노치 -->
        <path d="M112,76 Q118,76 118,70 L112,70Z" fill="#1e1e1e"/>
        <circle cx="115" cy="73" r="2" fill="#2a2a2a"/>
        <!-- DIP 핀 (좌측 14개) -->
        ${Array.from({length:7}, (_,i) => svg`
          <rect x="104" y="${72 + i*10}" width="8" height="3"
            rx="0.5" fill="#c0c0c0" opacity="0.9"/>
        `)}
        <!-- DIP 핀 (우측 14개) -->
        ${Array.from({length:7}, (_,i) => svg`
          <rect x="186" y="${72 + i*10}" width="8" height="3"
            rx="0.5" fill="#c0c0c0" opacity="0.9"/>
        `)}
        <!-- 칩 마킹 -->
        <text x="149" y="93" font-size="5.5" fill="#5a5a5a" font-family="monospace"
          text-anchor="middle" letter-spacing="0.2">ATMEGA328P</text>
        <text x="149" y="102" font-size="4.5" fill="#484848" font-family="monospace"
          text-anchor="middle">-PU</text>
        <text x="149" y="111" font-size="4" fill="#3a3a3a" font-family="monospace"
          text-anchor="middle">ARDUINO</text>
        <!-- 광택 -->
        <rect x="112" y="64" width="74" height="8" rx="2" fill="white" opacity="0.025"/>

        <!-- ── ATmega16U2 USB 칩 (SMD) ── -->
        <rect x="48" y="64" width="26" height="24" rx="1.5"
          fill="#0e0e0e" stroke="#1a1a1a" stroke-width="0.8"/>
        ${[0,1,2,3].map(i => svg`
          <rect x="${52 + i*5.5}" y="60" width="3" height="4" rx="0.3" fill="#aaa" opacity="0.8"/>
          <rect x="${52 + i*5.5}" y="88" width="3" height="4" rx="0.3" fill="#aaa" opacity="0.8"/>
        `)}
        <text x="61" y="78" font-size="3.8" fill="#444" font-family="monospace"
          text-anchor="middle">16U2</text>

        <!-- ── 수정 발진자 (16MHz) ── -->
        <rect x="56" y="108" width="20" height="9" rx="4"
          fill="#e0e0d8" stroke="#aaaa99" stroke-width="0.8"/>
        <text x="66" y="114" font-size="3.5" fill="#777" font-family="monospace"
          text-anchor="middle">16MHz</text>

        <!-- ── 전해 커패시터 100uF ── -->
        <ellipse cx="232" cy="154" rx="9" ry="11"
          fill="#3a3a3a" stroke="#282828" stroke-width="0.8"/>
        <rect x="228" y="143" width="8" height="4" fill="#555" opacity="0.4"/>
        <text x="232" y="157" font-size="3.5" fill="#777" font-family="monospace"
          text-anchor="middle">100µ</text>

        <!-- ── 전압 레귤레이터 LDO ── -->
        <rect x="286" y="102" width="14" height="24" rx="1"
          fill="#2a2a2a" stroke="#1a1a1a" stroke-width="0.8"/>
        <rect x="284" y="98" width="18" height="6" rx="1" fill="#444" stroke="#2a2a2a" stroke-width="0.5"/>
        <text x="293" y="117" font-size="3.5" fill="#555" font-family="monospace"
          text-anchor="middle" transform="rotate(90,293,117)">LDO</text>

        <!-- ── LED: ON (항상 켜짐, 녹색) ── -->
        <circle cx="64" cy="152" r="2.8" fill="#22dd22" opacity="0.85"/>
        <circle cx="64" cy="152" r="4.5" fill="#22dd22" opacity="0.15"/>
        <text x="64" y="161" font-size="3.5" fill="#22aa22" font-family="monospace" text-anchor="middle">ON</text>

        <!-- ── LED: TX ── -->
        <circle cx="74" cy="152" r="2.5"
          fill="${txOn ? '#ffdd00' : '#665500'}" opacity="${txOn ? 0.9 : 0.6}"/>
        <text x="74" y="161" font-size="3.5" fill="#665500" font-family="monospace" text-anchor="middle">TX</text>

        <!-- ── LED: RX ── -->
        <circle cx="83" cy="152" r="2.5"
          fill="${rxOn ? '#ffdd00' : '#665500'}" opacity="${rxOn ? 0.9 : 0.6}"/>
        <text x="83" y="161" font-size="3.5" fill="#665500" font-family="monospace" text-anchor="middle">RX</text>

        <!-- ── LED: L (D13) ── -->
        <circle cx="92" cy="152" r="2.5"
          fill="${d13on ? '#ffcc00' : '#664400'}" opacity="${d13on ? 0.9 : 0.65}"/>
        ${d13on ? svg`<circle cx="92" cy="152" r="4.5" fill="#ffcc00" opacity="0.2"/>` : ''}
        <text x="92" y="161" font-size="3.5" fill="#665500" font-family="monospace" text-anchor="middle">L</text>

        <!-- ── RST 버튼 (실물: 빨간 택트 스위치, 우측 상단 영역) ── -->
        <g class="btn-rst"
          @pointerdown="${this._onRstDown}"
          @pointerup="${(e: PointerEvent) => { e.stopPropagation(); }}">
          <!-- 버튼 기판 -->
          <rect x="252" y="152" width="18" height="14" rx="2"
            fill="#111" stroke="${this.rstPressed ? '#ff6644' : '#222'}" stroke-width="0.8"/>
          <!-- 버튼 돔 (빨간색) -->
          <circle cx="261" cy="159" r="5.5"
            fill="${this.rstPressed ? '#dd2200' : '#cc2222'}"
            stroke="${this.rstPressed ? '#ff4422' : '#991111'}"
            stroke-width="0.8"/>
          <!-- 돔 중앙 하이라이트 -->
          <circle cx="261" cy="159" r="2.5"
            fill="${this.rstPressed ? '#ff5533' : '#ee4444'}"/>
          <ellipse cx="259" cy="157" rx="1.5" ry="1"
            fill="white" opacity="${this.rstPressed ? 0.1 : 0.25}"/>
          <text x="261" y="171" font-size="4" fill="#884444" font-family="monospace"
            text-anchor="middle">RST</text>
        </g>

        <!-- ── 핀 헤더 소켓 (검은 플라스틱) ── -->
        <!-- 디지털 상단 -->
        <rect x="55" y="8" width="240" height="14" rx="1.5"
          fill="#0a0a0a" stroke="#161616" stroke-width="0.5"/>
        <!-- 아날로그/전원 하단 -->
        <rect x="28" y="178" width="200" height="14" rx="1.5"
          fill="#0a0a0a" stroke="#161616" stroke-width="0.5"/>

        <!-- ── 핀 구멍 & 라벨 ── -->
        ${UNO_PINS.map(pin => {
          const val = pin.gpioNum !== undefined ? (this.pinStates[pin.gpioNum] ?? 0) : 0;
          const isHigh = val > 0;
          const isBottom = pin.y > 100;

          const ringColor = pin.type === 'power'
            ? (pin.name.startsWith('GND') ? '#55aa77' : '#cc7755')
            : pin.type === 'analog' ? '#cc6655'
            : pin.isPwm ? '#8899cc' : '#c8a060';
          const holeColor = isHigh ? '#ffee44' : '#08201a';

          return svg`
            <g class="pin-hole" data-pin="${pin.name}">
              <circle cx="${pin.x}" cy="${pin.y}" r="4.5"
                fill="${ringColor}" opacity="0.9"/>
              <circle cx="${pin.x}" cy="${pin.y}" r="2.2"
                fill="${holeColor}"/>
              <text
                x="${pin.x}"
                y="${isBottom ? pin.y + 13 : pin.y - 9}"
                font-size="3.8" fill="#88ccaa" font-family="monospace"
                text-anchor="middle"
                transform="rotate(-90,${pin.x},${isBottom ? pin.y + 13 : pin.y - 9})"
              >${pin.name.replace('~','')}</text>
            </g>
          `;
        })}

        <!-- ── ARDUINO 실크스크린 로고 ── -->
        <text x="162" y="164" font-size="12" fill="#004d42" font-family="Arial,sans-serif"
          text-anchor="middle" font-weight="bold" letter-spacing="1">ARDUINO</text>
        <text x="162" y="175" font-size="7.5" fill="#004040" font-family="Arial,sans-serif"
          text-anchor="middle" letter-spacing="2.5">UNO  R3</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-board-uno': SimBoardUno; }
}
