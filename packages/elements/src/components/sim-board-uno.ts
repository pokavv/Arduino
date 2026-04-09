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
 * Wokwi 오픈소스(arduino-uno-element.ts) 기반 정밀 재구현
 *
 * viewBox 기준: Wokwi "-4 0 72.58 53.34" → 우리 308×210px
 * 스케일: kx=4.43 (304/68.58), ky=3.86 (206/53.34)
 * dx=2, dy=2 (SVG 마진)
 *
 * 핀 연결 좌표 (host px):
 *   상단 디지털: y=18, D0 x=280 ~ GND x=58 (우→좌)
 *   하단 아날로그/전원: y=190
 */
const UNO_PINS: BoardPin[] = [
  // 디지털 헤더 (우측부터 — Wokwi pinInfo 기준)
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
  // 아날로그/전원 헤더 (Wokwi pinInfo 기준)
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

        <!-- ══════════════════════════════════════════════════
             PCB 기판 (실물/Wokwi: #2b6b99 파란색)
             Arduino Uno 특유의 우측 챔퍼(각진) 모서리 형상
             Wokwi 좌표 기준 정밀 재현
             ══════════════════════════════════════════════════ -->
        <!--
          우상단 챔퍼 경로 (Wokwi path 기반, kx=4.43, ky=3.86 스케일):
          - 하단 챔퍼: y≈196 → 대각 → 범프 오른쪽x=305, y≈186
          - 범프 수직: y=186→y=60
          - 상단 챔퍼: 대각 → x=294, y=50
          - 상단 수직: y=50→y=11
          - 작은 챔퍼: → x=287, y=6
        -->
        <path d="
          M 8,2
          A 6,6 0 0,0 2,8
          L 2,202
          A 6,6 0 0,0 8,208
          L 294,208
          A 6,6 0 0,0 300,202
          L 300,196
          L 305,191
          L 305,65
          L 294,55
          L 294,11
          L 287,5
          L 8,2 Z"
          fill="#2b6b99" stroke="#1a4a70" stroke-width="1"/>

        <!-- 실크스크린 내부 테두리 -->
        <path d="
          M 14,7
          A 4,4 0 0,0 10,11
          L 10,198
          A 4,4 0 0,0 14,202
          L 290,202
          A 4,4 0 0,0 294,198
          L 294,197
          L 299,192
          L 299,64
          L 290,55
          L 290,13
          L 284,7 Z"
          fill="none" stroke="#1a4a70" stroke-width="0.35" opacity="0.6"/>

        <!-- ── 마운팅 홀 (Wokwi 4개) ── -->
        <!-- Wokwi: (15.077, 0.835), (65.876, 16.074), (65.876, 43.934), (13.807, 48.079) -->
        <circle cx="69"  cy="5"   r="3.5" fill="#1a4a70"/>
        <circle cx="289" cy="64"  r="3.5" fill="#1a4a70"/>  <!-- 우상단 (챔퍼 안쪽) -->
        <circle cx="289" cy="172" r="3.5" fill="#1a4a70"/>
        <circle cx="63"  cy="188" r="3.5" fill="#1a4a70"/>

        <!-- ══════════════════════════════════════════════════
             USB-B 커넥터 (좌측 상단, Wokwi: y=9.37~21.22mm)
             우리 SVG: y=38~84, x=0~50
             ══════════════════════════════════════════════════ -->
        <!-- 외관 은색 금속 케이스 -->
        <rect x="0"  y="38" width="50" height="47" rx="2"
          fill="#b3b2b2" stroke="#808080" stroke-width="0.8"/>
        <!-- 내부 어두운 -->
        <rect x="0"  y="40" width="46" height="43" rx="1.5" fill="#706f6f"/>
        <!-- 정면 밝은 금속 -->
        <rect x="0"  y="41" width="45" height="42" rx="1" fill="#9d9d9c"/>
        <!-- 내부 어두운 구멍 -->
        <rect x="2"  y="43" width="40" height="37" rx="1" fill="#1a1a1a"/>
        <!-- USB Type-B 특유 사다리꼴 개구부 -->
        <polygon points="4,45 38,45 42,76 2,76" fill="#111"/>
        <!-- 중앙 가이드 -->
        <rect x="12" y="50" width="16" height="18" rx="1.5" fill="#2a2a2a"/>
        <!-- 마운팅 귀 (타원) -->
        <ellipse cx="5"  cy="39.5" rx="4.2" ry="3.8" fill="#b3b2b2"/>
        <ellipse cx="5"  cy="84.5" rx="4.2" ry="3.8" fill="#b3b2b2"/>
        <text x="22" y="88" font-size="4" fill="#555" font-family="monospace"
          text-anchor="middle">USB-B</text>

        <!-- ══════════════════════════════════════════════════
             DC 배럴잭 (좌측 하단, Wokwi: y=40.914~50.803mm)
             우리 SVG: y=160~198, x=0~54
             ══════════════════════════════════════════════════ -->
        <rect x="0"  y="160" width="54" height="38" rx="3"
          fill="#252728" stroke="#1a1a1a" stroke-width="0.8"/>
        <!-- 원통형 구멍 -->
        <ellipse cx="11" cy="179" rx="10" ry="10" fill="#111" stroke="#333" stroke-width="0.8"/>
        <circle cx="11" cy="179" r="5"   fill="#333"/>
        <circle cx="11" cy="179" r="2.5" fill="#555"/>
        <circle cx="11" cy="179" r="1"   fill="#777"/>
        <!-- 내부 금속 라인 -->
        <rect x="50" y="162" width="1" height="34" fill="white" opacity="0.15"/>

        <!-- ══════════════════════════════════════════════════
             RST 버튼 (Wokwi: cx=6.9619, cy=4.5279mm)
             우리 SVG: cx=33, cy=20 (보드 좌측 상단, USB 위)
             ══════════════════════════════════════════════════ -->
        <!-- Wokwi RST 배경 rect -->
        <rect x="19" y="14" width="27" height="23" rx="1" fill="#9b9b9b"/>
        <!-- Wokwi RST 리드 (5개, #e6e6e6) -->
        <rect x="10" y="16" width="9" height="3.5" rx="0.5" fill="#e6e6e6"/>
        <rect x="10" y="22" width="9" height="3.5" rx="0.5" fill="#e6e6e6"/>
        <rect x="10" y="29" width="9" height="3.5" rx="0.5" fill="#e6e6e6"/>
        <rect x="46" y="29" width="9" height="3.5" rx="0.5" fill="#e6e6e6"/>
        <rect x="46" y="16" width="9" height="3.5" rx="0.5" fill="#e6e6e6"/>
        <!-- RST 버튼 원 (Wokwi: fill=#960000) -->
        <g class="btn-rst"
          @pointerdown="${this._onRstDown}"
          @pointerup="${(e: PointerEvent) => { e.stopPropagation(); }}">
          <circle cx="33" cy="26" r="9"
            fill="${this.rstPressed ? '#c00000' : '#960000'}"
            stroke="${this.rstPressed ? '#ff4422' : '#777'}"
            stroke-width="0.6"/>
          <!-- 하이라이트 -->
          <ellipse cx="30" cy="23" rx="2.5" ry="1.5"
            fill="white" opacity="${this.rstPressed ? 0.1 : 0.2}"/>
          <text x="33" y="41" font-size="4" fill="#663333"
            font-family="monospace" text-anchor="middle">RST</text>
        </g>

        <!-- ══════════════════════════════════════════════════
             ATmega16U2 SMD 칩 (USB 커넥터 위/우측)
             Wokwi에는 별도 SVG 없음, 위치 추정
             ══════════════════════════════════════════════════ -->
        <rect x="55" y="36" width="28" height="24" rx="1.5"
          fill="#292c2d" stroke="#1a1a1a" stroke-width="0.8"/>
        <!-- SMD 핀 상단/하단 -->
        ${[0,1,2,3].map(i => svg`
          <rect x="${58 + i*5.5}" y="32"  width="3.5" height="4" rx="0.3" fill="#ddd" opacity="0.8"/>
          <rect x="${58 + i*5.5}" y="60"  width="3.5" height="4" rx="0.3" fill="#ddd" opacity="0.8"/>
        `)}
        <text x="69" y="50" font-size="3.5" fill="#555" font-family="monospace"
          text-anchor="middle">16U2</text>

        <!-- ══════════════════════════════════════════════════
             ICSP 헤더 — ATmega328P 용 (Wokwi: translate(14.1, 4.4))
             우리: x=65, y=19
             ══════════════════════════════════════════════════ -->
        <rect x="65" y="19" width="28" height="20" rx="1.5"
          fill="#1a1a1a" stroke="#2a2a2a" stroke-width="0.8"/>
        ${[0,1,2].map(r => [0,1].map(c => svg`
          <ellipse cx="${71 + c*14}" cy="${24 + r*6}" rx="2" ry="2"
            fill="#9d9d9a" stroke="#565656" stroke-width="0.5"/>
        `))}
        <text x="79" y="44" font-size="3.5" fill="#3a5a3a"
          font-family="monospace" text-anchor="middle">ICSP</text>

        <!-- ══════════════════════════════════════════════════
             16MHz 수정 발진자
             ══════════════════════════════════════════════════ -->
        <rect x="88" y="100" width="38" height="12" rx="5"
          fill="#e0e0d8" stroke="#aaaa99" stroke-width="0.8"/>
        <text x="107" y="109" font-size="3.5" fill="#777"
          font-family="monospace" text-anchor="middle">16MHz</text>

        <!-- ══════════════════════════════════════════════════
             ATmega328P DIP-28 칩 (Wokwi: x=28.21~65.31mm, y=32.7~41.63mm)
             우리: x=127, y=128, w=163, h=33
             ══════════════════════════════════════════════════ -->
        <!-- 칩 케이스 -->
        <rect x="127" y="128" width="163" height="33" rx="1.5"
          fill="#292c2d" stroke="#1a1a1a" stroke-width="0.8"/>
        <!-- 칩 상면 (약간 밝음) -->
        <rect x="129" y="130" width="159" height="29" rx="1"
          fill="#3c4042"/>
        <!-- DIP 핀 상단 (Wokwi: 위/아래 패턴, 2.54mm간격) -->
        ${Array.from({length:14}, (_,i) => svg`
          <rect x="${134 + i*11}" y="124" width="4" height="4"
            rx="0.3" fill="#ddd" opacity="0.9"/>
        `)}
        <!-- DIP 핀 하단 -->
        ${Array.from({length:14}, (_,i) => svg`
          <rect x="${134 + i*11}" y="161" width="4" height="4"
            rx="0.3" fill="#ddd" opacity="0.9"/>
        `)}
        <!-- 핀1 마커 원 (좌측) -->
        <circle cx="133" cy="139" r="2.5" fill="#252728"/>
        <!-- 우측 마커 반원 (Wokwi: M65 38.05 arc) -->
        <path d="M286,140 a5,5 0 0 1 0,10 Z" fill="#252728"/>
        <!-- 칩 마킹 -->
        <text x="209" y="140" font-size="5" fill="#666666" font-family="monospace"
          text-anchor="middle" letter-spacing="0.2">ATMEGA328P-PU</text>
        <text x="209" y="150" font-size="4" fill="#555" font-family="monospace"
          text-anchor="middle">ARDUINO</text>
        <!-- 칩 상단 하이라이트 -->
        <rect x="129" y="130" width="159" height="5" rx="1"
          fill="white" opacity="0.025"/>

        <!-- ══════════════════════════════════════════════════
             전해 커패시터 100uF
             ══════════════════════════════════════════════════ -->
        <ellipse cx="249" cy="158" rx="9" ry="11"
          fill="#3a3a3a" stroke="#282828" stroke-width="0.8"/>
        <rect x="244" y="147" width="10" height="4" fill="#555" opacity="0.4"/>
        <text x="249" y="162" font-size="3.5" fill="#777"
          font-family="monospace" text-anchor="middle">100µ</text>

        <!-- ══════════════════════════════════════════════════
             전압 레귤레이터 LDO (우측 중상단)
             ══════════════════════════════════════════════════ -->
        <rect x="275" y="90" width="14" height="24" rx="1"
          fill="#2a2a2a" stroke="#1a1a1a" stroke-width="0.8"/>
        <rect x="272" y="86" width="20" height="6" rx="1"
          fill="#444" stroke="#2a2a2a" stroke-width="0.5"/>
        <text x="282" y="108" font-size="3.5" fill="#555" font-family="monospace"
          text-anchor="middle" transform="rotate(90,282,108)">LDO</text>

        <!-- ══════════════════════════════════════════════════
             ICSP 2 — ATmega16U2 용 (Wokwi: translate(63, 27.2) rotate(270))
             우리: x=265, y=107, 수직 방향
             ══════════════════════════════════════════════════ -->
        <rect x="265" y="107" width="20" height="28" rx="1.5"
          fill="#1a1a1a" stroke="#2a2a2a" stroke-width="0.8"/>
        ${[0,1,2].map(r => [0,1].map(c => svg`
          <ellipse cx="${270 + c*10}" cy="${112 + r*8}" rx="2" ry="2"
            fill="#9d9d9a" stroke="#565656" stroke-width="0.5"/>
        `))}

        <!-- ══════════════════════════════════════════════════
             LED 4개 — Wokwi 정확한 위치
             LED ON: translate(57.3, 16.21) → (258, 65)
             LED L:  translate(26.87, 11.69) → (122, 47)
             LED TX: translate(26.9, 16.2) → (122, 65)
             LED RX: translate(26.9, 18.5) → (122, 73)
             ══════════════════════════════════════════════════ -->
        <!-- LED ON (전원, 항상 초록) -->
        <circle cx="258" cy="65" r="3.5" fill="#80ff80" opacity="0.9"/>
        <circle cx="258" cy="65" r="5.5" fill="#80ff80" opacity="0.2"/>
        <text x="258" y="76" font-size="3.5" fill="#22aa22"
          font-family="monospace" text-anchor="middle">ON</text>

        <!-- LED L (D13, 노랑/주황) -->
        <circle cx="122" cy="47" r="3"
          fill="${d13on ? '#ff8080' : '#661a1a'}"
          opacity="${d13on ? 0.9 : 0.7}"/>
        ${d13on ? svg`<circle cx="122" cy="47" r="5" fill="#ff4444" opacity="0.3"/>` : ''}
        <text x="122" y="58" font-size="3.5" fill="#885544"
          font-family="monospace" text-anchor="middle">L</text>

        <!-- LED TX (노랑) -->
        <circle cx="122" cy="64" r="3"
          fill="${txOn ? '#ffff00' : '#555500'}"
          opacity="${txOn ? 0.9 : 0.7}"/>
        ${txOn ? svg`<circle cx="122" cy="64" r="5" fill="#ffff00" opacity="0.3"/>` : ''}
        <text x="122" y="75" font-size="3.5" fill="#665500"
          font-family="monospace" text-anchor="middle">TX</text>

        <!-- LED RX (노랑) -->
        <circle cx="122" cy="73" r="3"
          fill="${rxOn ? '#ffff00' : '#555500'}"
          opacity="${rxOn ? 0.9 : 0.7}"/>
        ${rxOn ? svg`<circle cx="122" cy="73" r="5" fill="#ffff00" opacity="0.3"/>` : ''}
        <text x="122" y="84" font-size="3.5" fill="#665500"
          font-family="monospace" text-anchor="middle">RX</text>

        <!-- ══════════════════════════════════════════════════
             Arduino 로고 + 텍스트 (Wokwi: fill=#fff)
             Wokwi: "ARDUINO" x=31, y=20.2 / "UNO" 박스
             우리: 비례 스케일
             ══════════════════════════════════════════════════ -->
        <!-- Arduino 인피니티 로고 -->
        <g transform="translate(143,76)" fill="none" stroke="white" opacity="0.6">
          <path d="M-7,0 C-7,-5 -2,-7 3,-4 C7,-1 9,4 14,4 C18,4 21,1 21,-3"
            stroke-width="2.5"/>
          <path d="M21,-3 C21,-7 18,-10 14,-10 C9,-10 7,-5 3,-8 C-2,-11 -7,-7 -7,0"
            stroke-width="2.5"/>
          <line x1="4" y1="-3" x2="4" y2="3" stroke-width="1.5"/>
          <line x1="1" y1="0"  x2="7" y2="0" stroke-width="1.5"/>
          <line x1="17" y1="-3" x2="17" y2="3" stroke-width="1.5"/>
        </g>
        <text x="140" y="95" font-size="5.5" fill="white" font-family="Arial,sans-serif"
          text-anchor="middle" font-weight="bold" opacity="0.7">ARDUINO</text>
        <!-- UNO 박스 -->
        <rect x="185" y="73" width="27" height="14" rx="1.5"
          fill="none" stroke="white" stroke-width="0.4"
          stroke-dasharray="0.4,0.4" opacity="0.6"/>
        <text x="199" y="83" font-size="7" fill="white" font-family="Arial,sans-serif"
          text-anchor="middle" font-weight="bold" opacity="0.8">UNO</text>

        <!-- ══════════════════════════════════════════════════
             핀 헤더 소켓 (검은 플라스틱)
             ══════════════════════════════════════════════════ -->
        <!-- 상단 디지털 헤더 (Wokwi: translate(17.497, 1.27) + translate(44.421, 1.27)) -->
        <rect x="55"  y="8" width="114" height="14" rx="1.5"
          fill="#333" stroke="#161616" stroke-width="0.5"/>
        <rect x="178" y="8" width="108" height="14" rx="1.5"
          fill="#333" stroke="#161616" stroke-width="0.5"/>
        <!-- 하단 아날로그/전원 헤더 -->
        <rect x="28"  y="178" width="106" height="14" rx="1.5"
          fill="#333" stroke="#161616" stroke-width="0.5"/>
        <rect x="142" y="178" width="82"  height="14" rx="1.5"
          fill="#333" stroke="#161616" stroke-width="0.5"/>

        <!-- ══════════════════════════════════════════════════
             핀 구멍 & 라벨
             ══════════════════════════════════════════════════ -->
        ${UNO_PINS.map(pin => {
          const val = pin.gpioNum !== undefined ? (this.pinStates[pin.gpioNum] ?? 0) : 0;
          const isHigh = val > 0;
          const isBottom = pin.y > 100;

          const ringColor = pin.type === 'power'
            ? (pin.name.startsWith('GND') ? '#55aa77' : '#cc7755')
            : pin.type === 'analog' ? '#cc6655'
            : pin.isPwm ? '#8899cc' : '#c8a060';
          const holeColor = isHigh ? '#ffee44' : '#191919';

          return svg`
            <g class="pin-hole" data-pin="${pin.name}">
              <circle cx="${pin.x}" cy="${pin.y}" r="4.5"
                fill="${ringColor}" opacity="0.9"/>
              <circle cx="${pin.x}" cy="${pin.y}" r="2.2"
                fill="${holeColor}"/>
              <text
                x="${pin.x}"
                y="${isBottom ? pin.y + 13 : pin.y - 9}"
                font-size="3.8" font-family="monospace"
                fill="white"
                text-anchor="middle"
                opacity="0.75"
              >${pin.name}</text>
            </g>
          `;
        })}

        <!-- ══════════════════════════════════════════════════
             DIGITAL/ANALOG 구분선 및 헤더 레이블
             ══════════════════════════════════════════════════ -->
        <rect x="55" y="8.5" width="114" height="0.6" fill="white" opacity="0.25"/>
        <text x="113" y="8" font-size="3" fill="white" opacity="0.5"
          text-anchor="middle">DIGITAL (PWM ~)</text>
        <text x="88"  y="202" font-size="3" fill="white" opacity="0.5"
          text-anchor="middle">POWER</text>
        <text x="183" y="202" font-size="3" fill="white" opacity="0.5"
          text-anchor="middle">ANALOG IN</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-board-uno': SimBoardUno; }
}
