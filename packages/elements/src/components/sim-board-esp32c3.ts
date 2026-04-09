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
  isPwm?: boolean;
  isAdc?: boolean;
}

/**
 * ESP32-C3 Super Mini 핀 레이아웃 (실물 기준)
 * 실물 기준: 22.5mm × 18mm, 2.54mm 간격
 * SVG: 124×170px (viewBox 동일)
 *
 * 좌측 (위→아래): GND, G0, G1, G2, G3, G4, G5, 3V3
 * 우측 (위→아래): 5V, GND, 3V3, G8, G9, G10, G20, G21
 *
 * 실물 버튼 위치:
 *   BOOT (G9 ← GND): 왼쪽 하단
 *   RST:              오른쪽 하단
 */
const C3_PINS: BoardPin[] = [
  // 좌측 (위→아래): GND, G0~G5, 3V3 — 실물과 동일
  { name:'GND', x:16, y:38,  side:'left',  type:'power'   },
  { name:'G0',  x:16, y:52,  side:'left',  gpioNum:0,  type:'analog', isAdc:true  },
  { name:'G1',  x:16, y:66,  side:'left',  gpioNum:1,  type:'analog', isAdc:true  },
  { name:'G2',  x:16, y:80,  side:'left',  gpioNum:2,  type:'analog', isAdc:true  },
  { name:'G3',  x:16, y:94,  side:'left',  gpioNum:3,  type:'analog', isAdc:true  },
  { name:'G4',  x:16, y:108, side:'left',  gpioNum:4,  type:'digital' },
  { name:'G5',  x:16, y:122, side:'left',  gpioNum:5,  type:'digital' },
  { name:'3V3', x:16, y:136, side:'left',  type:'power'   },
  // 우측 (위→아래): 5V, GND, 3V3, G8~G10, G20, G21
  { name:'5V',  x:108, y:38,  side:'right', type:'power'   },
  { name:'GND', x:108, y:52,  side:'right', type:'power'   },
  { name:'3V3', x:108, y:66,  side:'right', type:'power'   },
  { name:'G8',  x:108, y:80,  side:'right', gpioNum:8,  type:'digital' },
  { name:'G9',  x:108, y:94,  side:'right', gpioNum:9,  type:'digital' },
  { name:'G10', x:108, y:108, side:'right', gpioNum:10, type:'digital', isPwm:true },
  { name:'G20', x:108, y:122, side:'right', gpioNum:20, type:'digital' },
  { name:'G21', x:108, y:136, side:'right', gpioNum:21, type:'digital' },
];

@customElement('sim-board-esp32c3')
export class SimBoardEsp32c3 extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 124px; height: 170px; }
      .pin-hole  { cursor: crosshair; }
      .btn-boot  { cursor: pointer; }
      .btn-rst   { cursor: pointer; }
    `,
  ];

  @property({ type: Object }) pinStates: Record<number, number> = {};
  @property({ type: Boolean }) bootPressed = false;
  @property({ type: Boolean }) rstPressed  = false;

  override get componentType() { return 'board-esp32c3'; }
  override get pins() { return C3_PINS.map(p => p.name); }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    const p = C3_PINS.find(p => p.name === pin || (p.gpioNum !== undefined && `G${p.gpioNum}` === pin));
    if (p?.gpioNum !== undefined) {
      this.pinStates = { ...this.pinStates, [p.gpioNum]: v };
    }
  }

  override getPinPositions() {
    return new Map(C3_PINS.map(p => [p.name, { x: p.x, y: p.y }]));
  }

  // ── BOOT 버튼 (G9 ← GND) ─────────────────────────────────
  private _onBootDown(e: PointerEvent) {
    e.stopPropagation();
    this.bootPressed = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('sim-pin-press', {
      bubbles: true, composed: true, detail: { gpio: 9 },
    }));
  }
  private _onBootUp(e: PointerEvent) {
    e.stopPropagation();
    this.bootPressed = false;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-pin-release', {
      bubbles: true, composed: true, detail: { gpio: 9 },
    }));
    this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
  }

  // ── RST 버튼 ────────────────────────────────────────────
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
    const ledOn = (this.pinStates[8] ?? 1) === 0; // G8 Active LOW

    return html`
      <svg width="124" height="170" viewBox="0 0 124 170" xmlns="http://www.w3.org/2000/svg">

        <!-- ── PCB 기판 ── -->
        <rect x="22" y="8" width="80" height="154" rx="5"
          fill="#1a2e6a" stroke="#0d1a4a" stroke-width="1"/>
        <!-- 상단 광택 -->
        <rect x="22" y="8" width="80" height="18" rx="5"
          fill="white" opacity="0.04"/>
        <!-- 실크스크린 테두리 라인 -->
        <rect x="26" y="12" width="72" height="146" rx="3"
          fill="none" stroke="#0d2050" stroke-width="0.4" opacity="0.7"/>

        <!-- ── 마운팅 홀 ── -->
        <circle cx="28" cy="14"  r="2.2" fill="#0a1438"/>
        <circle cx="96" cy="14"  r="2.2" fill="#0a1438"/>
        <circle cx="28" cy="154" r="2.2" fill="#0a1438"/>
        <circle cx="96" cy="154" r="2.2" fill="#0a1438"/>

        <!-- ── USB-C 커넥터 (상단 중앙) ── -->
        <rect x="46" y="0" width="32" height="14" rx="5"
          fill="#a0a0a0" stroke="#808080" stroke-width="0.8"/>
        <rect x="50" y="2" width="24" height="10" rx="4" fill="#1a1a1a"/>
        <line x1="62" y1="2" x2="62" y2="12" stroke="#333" stroke-width="0.5"/>
        <rect x="56" y="5" width="12" height="4" rx="1" fill="#2a2a2a"/>

        <!-- ── PCB 안테나 패턴 (우측 상단 노출 동박) ── -->
        <path d="M80,12 L96,12 L96,28 L80,28 Z" fill="#1e3470" stroke="#2a4080" stroke-width="0.3"/>
        <!-- 지그재그 안테나 패턴 -->
        <polyline points="84,15 92,15 92,18 84,18 84,21 92,21 92,24 84,24"
          fill="none" stroke="#c8a820" stroke-width="1.2" stroke-linejoin="round"/>

        <!-- ── ESP32-C3 FH4 칩 (QFN32 패키지) ── -->
        <!-- 칩 그림자 -->
        <rect x="38" y="54" width="49" height="49" rx="2" fill="#0a0a0a" opacity="0.6"/>
        <!-- 칩 본체 -->
        <rect x="37" y="53" width="49" height="49" rx="2"
          fill="#141414" stroke="#282828" stroke-width="0.8"/>
        <!-- QFN 핀 상단 -->
        ${[0,1,2,3,4,5].map(i => svg`
          <rect x="${42 + i*7}" y="50" width="4" height="3" rx="0.3" fill="#b8b0a0" opacity="0.9"/>
        `)}
        <!-- QFN 핀 하단 -->
        ${[0,1,2,3,4,5].map(i => svg`
          <rect x="${42 + i*7}" y="102" width="4" height="3" rx="0.3" fill="#b8b0a0" opacity="0.9"/>
        `)}
        <!-- QFN 핀 좌측 -->
        ${[0,1,2,3].map(i => svg`
          <rect x="34" y="${61 + i*10}" width="3" height="5" rx="0.3" fill="#b8b0a0" opacity="0.9"/>
        `)}
        <!-- QFN 핀 우측 -->
        ${[0,1,2,3].map(i => svg`
          <rect x="86" y="${61 + i*10}" width="3" height="5" rx="0.3" fill="#b8b0a0" opacity="0.9"/>
        `)}
        <!-- 핀 1 마커 -->
        <circle cx="40" cy="56" r="1" fill="#444"/>
        <!-- 칩 마킹 -->
        <text x="61.5" y="74" font-size="5.2" fill="#484848" font-family="monospace"
          text-anchor="middle" letter-spacing="0.5">ESP32-C3</text>
        <text x="61.5" y="82" font-size="4.2" fill="#3a3a3a" font-family="monospace"
          text-anchor="middle">FH4</text>
        <text x="61.5" y="90" font-size="3.5" fill="#303030" font-family="monospace"
          text-anchor="middle">ESPRESSIF</text>
        <!-- 칩 광택 -->
        <rect x="37" y="53" width="49" height="6" rx="2"
          fill="white" opacity="0.03"/>

        <!-- ── SMD 커패시터/저항 (0402) ── -->
        <rect x="28" y="44" width="5"   height="2.5" rx="0.5" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.3"/>
        <rect x="90" y="44" width="5"   height="2.5" rx="0.5" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.3"/>
        <rect x="28" y="112" width="5"  height="2.5" rx="0.5" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.3"/>
        <rect x="90" y="112" width="5"  height="2.5" rx="0.5" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.3"/>

        <!-- ── 내장 LED (G8, Active LOW) — 실물: 파란색 ── -->
        <circle cx="80" cy="144" r="3"
          fill="${ledOn ? '#88ccff' : '#1a2a44'}"
          stroke="${ledOn ? '#aaddff' : '#223355'}"
          stroke-width="0.8"/>
        ${ledOn ? svg`
          <circle cx="80" cy="144" r="5.5" fill="#4488ff" opacity="0.25"/>
        ` : ''}
        <text x="80" y="153" font-size="3.5" fill="${ledOn ? '#88bbff' : '#334466'}"
          font-family="monospace" text-anchor="middle">G8</text>

        <!-- ── BOOT 버튼 (실물: SMD 택트 스위치, 왼쪽 하단) ── -->
        <g class="btn-boot"
          @pointerdown="${this._onBootDown}"
          @pointerup="${this._onBootUp}"
          @pointercancel="${this._onBootUp}">
          <!-- 버튼 기판 -->
          <rect x="28" y="136" width="14" height="11" rx="1.5"
            fill="#111" stroke="${this.bootPressed ? '#4488ff' : '#2a2a2a'}" stroke-width="0.8"/>
          <!-- 버튼 돔 -->
          <rect x="30" y="138" width="10" height="7" rx="1"
            fill="${this.bootPressed ? '#2a4a8a' : '#1a1a2a'}"
            stroke="${this.bootPressed ? '#6699cc' : '#333355'}" stroke-width="0.6"/>
          <!-- 가운데 마크 -->
          <circle cx="35" cy="141.5" r="1.5"
            fill="${this.bootPressed ? '#88aaff' : '#2a2a44'}"/>
          <text x="35" y="153" font-size="3.5" fill="#445588" font-family="monospace"
            text-anchor="middle">BOOT</text>
        </g>

        <!-- ── RST 버튼 (실물: SMD 택트 스위치, 오른쪽 하단) ── -->
        <g class="btn-rst"
          @pointerdown="${this._onRstDown}"
          @pointerup="${(e: PointerEvent) => { e.stopPropagation(); }}">
          <!-- 버튼 기판 -->
          <rect x="54" y="136" width="14" height="11" rx="1.5"
            fill="#111" stroke="${this.rstPressed ? '#ff6644' : '#2a2a2a'}" stroke-width="0.8"/>
          <!-- 버튼 돔 -->
          <rect x="56" y="138" width="10" height="7" rx="1"
            fill="${this.rstPressed ? '#8a2a1a' : '#2a1a1a'}"
            stroke="${this.rstPressed ? '#cc6644' : '#553333'}" stroke-width="0.6"/>
          <!-- 가운데 마크 -->
          <circle cx="61" cy="141.5" r="1.5"
            fill="${this.rstPressed ? '#ff8866' : '#442222'}"/>
          <text x="61" y="153" font-size="3.5" fill="#885544" font-family="monospace"
            text-anchor="middle">RST</text>
        </g>

        <!-- ── 핀 헤더 소켓 (검은 플라스틱 — 양쪽) ── -->
        <rect x="9"  y="28" width="13" height="118" rx="1.5"
          fill="#0d0d0d" stroke="#1a1a1a" stroke-width="0.5"/>
        <rect x="102" y="28" width="13" height="118" rx="1.5"
          fill="#0d0d0d" stroke="#1a1a1a" stroke-width="0.5"/>

        <!-- ── 핀 구멍 & 라벨 ── -->
        ${C3_PINS.map(pin => {
          const val = pin.gpioNum !== undefined ? (this.pinStates[pin.gpioNum] ?? 0) : 0;
          const isHigh = val > 0;
          const isLeft = pin.side === 'left';

          const ringColor = pin.type === 'power'
            ? (pin.name === 'GND' ? '#66bb88' : '#cc7766')
            : pin.isAdc ? '#bbaa44' : '#a0905a';
          const holeColor = isHigh ? '#ffee55' : '#06101f';
          const labelColor = pin.type === 'power'
            ? (pin.name === 'GND' ? '#66bb88' : '#cc8877')
            : pin.isAdc ? '#aaa033' : '#6688bb';

          return svg`
            <g class="pin-hole" data-pin="${pin.name}">
              <circle cx="${pin.x}" cy="${pin.y}" r="4" fill="${ringColor}" opacity="0.85"/>
              <circle cx="${pin.x}" cy="${pin.y}" r="2.2" fill="${holeColor}"/>
              <text
                x="${isLeft ? 13 : 111}"
                y="${pin.y + 1.5}"
                font-size="4.5" font-family="monospace"
                fill="${labelColor}"
                text-anchor="${isLeft ? 'start' : 'end'}"
              >${pin.name}</text>
            </g>
          `;
        })}

        <!-- ── 보드 실크스크린 ── -->
        <text x="62" y="163" font-size="4.2" fill="#1e3070" font-family="Arial,sans-serif"
          text-anchor="middle" font-weight="bold" letter-spacing="0.3">ESP32-C3 Super Mini</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-board-esp32c3': SimBoardEsp32c3; }
}
