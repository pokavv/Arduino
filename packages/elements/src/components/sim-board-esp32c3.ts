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
 * ESP32-C3 Super Mini 핀 레이아웃 (실물 정확 기준)
 * 출처: randomnerdtutorials, lastminuteengineers, mischianti
 *
 * 보드 방향: USB-C 커넥터 = 상단
 * 치수: 22.5mm × 18mm
 *
 * 좌측 (위→아래, USB-C 기준): G0, G1, G2, G3, G4, G5, GND, GND
 * 우측 (위→아래, USB-C 기준): 5V, 3V3, G6, G7, G8, G9, G10, GND
 *
 * BOOT 버튼: 상단 USB-C 근처 좌측 (G9를 GND로 당김)
 * RST  버튼: 상단 USB-C 근처 우측
 * 파란 LED : GPIO8 (Active LOW) — 상단 영역
 * 빨간 LED : 전원 표시 — 상단 영역
 */
const C3_PINS: BoardPin[] = [
  // 좌측 (위→아래): G0~G5, GND, GND
  { name:'G0',  x:16, y:54,  side:'left',  gpioNum:0,  type:'analog', isAdc:true },
  { name:'G1',  x:16, y:68,  side:'left',  gpioNum:1,  type:'analog', isAdc:true },
  { name:'G2',  x:16, y:82,  side:'left',  gpioNum:2,  type:'analog', isAdc:true },
  { name:'G3',  x:16, y:96,  side:'left',  gpioNum:3,  type:'analog', isAdc:true },
  { name:'G4',  x:16, y:110, side:'left',  gpioNum:4,  type:'digital' },
  { name:'G5',  x:16, y:124, side:'left',  gpioNum:5,  type:'digital' },
  { name:'GND', x:16, y:138, side:'left',  type:'power' },
  { name:'GND', x:16, y:152, side:'left',  type:'power' },
  // 우측 (위→아래): 5V, 3V3, G6~G10, GND
  { name:'5V',  x:108, y:54,  side:'right', type:'power' },
  { name:'3V3', x:108, y:68,  side:'right', type:'power' },
  { name:'G6',  x:108, y:82,  side:'right', gpioNum:6,  type:'digital' },
  { name:'G7',  x:108, y:96,  side:'right', gpioNum:7,  type:'digital' },
  { name:'G8',  x:108, y:110, side:'right', gpioNum:8,  type:'digital' },
  { name:'G9',  x:108, y:124, side:'right', gpioNum:9,  type:'digital' },
  { name:'G10', x:108, y:138, side:'right', gpioNum:10, type:'digital', isPwm:true },
  { name:'GND', x:108, y:152, side:'right', type:'power' },
];

@customElement('sim-board-esp32c3')
export class SimBoardEsp32c3 extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 124px; height: 180px; }
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

  // ── BOOT 버튼 (G9 → GND) ─────────────────────────────────
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
    const g8val = this.pinStates[8] ?? 1;
    const ledOn = g8val === 0; // GPIO8 Active LOW

    return html`
      <svg width="124" height="180" viewBox="0 0 124 180" xmlns="http://www.w3.org/2000/svg">

        <!-- ── PCB 기판 (파란색) ── -->
        <rect x="22" y="12" width="80" height="162" rx="2"
          fill="#1a2e6a" stroke="#0d1a4a" stroke-width="1"/>
        <!-- 실크스크린 테두리 -->
        <rect x="26" y="16" width="72" height="154" rx="1"
          fill="none" stroke="#0d2050" stroke-width="0.4" opacity="0.7"/>

        <!-- ── 마운팅 홀 (4모서리) ── -->
        <circle cx="28" cy="18"  r="2" fill="#0a1438"/>
        <circle cx="96" cy="18"  r="2" fill="#0a1438"/>
        <circle cx="28" cy="168" r="2" fill="#0a1438"/>
        <circle cx="96" cy="168" r="2" fill="#0a1438"/>

        <!-- ── USB-C 커넥터 (상단 중앙, 보드 밖으로 돌출) ── -->
        <rect x="47" y="0" width="30" height="16" rx="5"
          fill="#9a9a9a" stroke="#787878" stroke-width="0.8"/>
        <!-- USB-C 내부 구멍 -->
        <rect x="51" y="2" width="22" height="12" rx="4" fill="#1a1a1a"/>
        <!-- USB-C 중간 핀 구조 -->
        <rect x="55" y="6" width="14" height="4" rx="1" fill="#2a2a2a"/>
        <line x1="62" y1="2" x2="62" y2="14" stroke="#333" stroke-width="0.5"/>

        <!-- ── 세라믹 칩 안테나 (USB-C 쪽 상단, 실물: 흰색 직사각형 SMD) ── -->
        <rect x="27" y="15" width="18" height="8" rx="1"
          fill="#e8e8e0" stroke="#cccccc" stroke-width="0.5"/>
        <rect x="29" y="17" width="14" height="4" rx="0.5"
          fill="#d0d0c8" stroke="#aaaaaa" stroke-width="0.3"/>
        <!-- 안테나 패드 연결선 -->
        <line x1="27" y1="19" x2="23" y2="19" stroke="#c8a820" stroke-width="0.8"/>
        <line x1="45" y1="19" x2="50" y2="19" stroke="#c8a820" stroke-width="0.8"/>

        <!-- ── BOOT 버튼 (상단 좌측 — USB-C 바로 아래) ── -->
        <g class="btn-boot"
          @pointerdown="${this._onBootDown}"
          @pointerup="${this._onBootUp}"
          @pointercancel="${this._onBootUp}">
          <rect x="27" y="26" width="13" height="10" rx="1"
            fill="#111" stroke="${this.bootPressed ? '#4488ff' : '#2a2a2a'}" stroke-width="0.7"/>
          <rect x="29" y="28" width="9" height="6" rx="0.8"
            fill="${this.bootPressed ? '#2a4a8a' : '#1a1a2a'}"
            stroke="${this.bootPressed ? '#6699cc' : '#333355'}" stroke-width="0.5"/>
          <circle cx="33.5" cy="31" r="1.2"
            fill="${this.bootPressed ? '#88aaff' : '#2a2a44'}"/>
          <text x="33.5" y="40" font-size="3.2" fill="#445588" font-family="monospace"
            text-anchor="middle">BOOT</text>
        </g>

        <!-- ── RST 버튼 (상단 우측 — USB-C 바로 아래) ── -->
        <g class="btn-rst"
          @pointerdown="${this._onRstDown}"
          @pointerup="${(e: PointerEvent) => { e.stopPropagation(); }}">
          <rect x="84" y="26" width="13" height="10" rx="1"
            fill="#111" stroke="${this.rstPressed ? '#ff6644' : '#2a2a2a'}" stroke-width="0.7"/>
          <rect x="86" y="28" width="9" height="6" rx="0.8"
            fill="${this.rstPressed ? '#8a2a1a' : '#2a1a1a'}"
            stroke="${this.rstPressed ? '#cc6644' : '#553333'}" stroke-width="0.5"/>
          <circle cx="90.5" cy="31" r="1.2"
            fill="${this.rstPressed ? '#ff8866' : '#442222'}"/>
          <text x="90.5" y="40" font-size="3.2" fill="#885544" font-family="monospace"
            text-anchor="middle">RST</text>
        </g>

        <!-- ── 전원 LED (빨간, 항상 켜짐) — USB-C 아래 중앙부 ── -->
        <circle cx="57" cy="31" r="2.2" fill="#ff2020" opacity="0.85"/>
        <circle cx="57" cy="31" r="3.5" fill="#ff0000" opacity="0.2"/>
        <text x="57" y="40" font-size="3.2" fill="#884444" font-family="monospace"
          text-anchor="middle">PWR</text>

        <!-- ── 파란 LED (GPIO8, Active LOW) ── -->
        <circle cx="67" cy="31" r="2.2"
          fill="${ledOn ? '#66ccff' : '#112233'}"
          stroke="${ledOn ? '#88ddff' : '#1a3344'}"
          stroke-width="0.7"/>
        ${ledOn ? svg`<circle cx="67" cy="31" r="4" fill="#4499ff" opacity="0.3"/>` : ''}
        <text x="67" y="40" font-size="3.2" fill="${ledOn ? '#88bbff' : '#334455'}"
          font-family="monospace" text-anchor="middle">G8</text>

        <!-- ── LDO 레귤레이터 (ME6211) — 상단 우측부 ── -->
        <rect x="72" y="24" width="9" height="5" rx="0.5"
          fill="#0e0e0e" stroke="#1a1a1a" stroke-width="0.4"/>
        ${[0,1,2].map(i => svg`
          <rect x="${73 + i*2.5}" y="21" width="1.5" height="3" rx="0.3" fill="#999" opacity="0.8"/>
          <rect x="${73 + i*2.5}" y="29" width="1.5" height="3" rx="0.3" fill="#999" opacity="0.8"/>
        `)}

        <!-- ── ESP32-C3 메인 칩 (QFN32) — PCB 중앙 ── -->
        <rect x="38" y="68" width="48" height="48" rx="2"
          fill="#141414" stroke="#282828" stroke-width="0.8"/>
        <!-- QFN 핀 상단 -->
        ${[0,1,2,3,4,5].map(i => svg`
          <rect x="${43 + i*7}" y="65" width="4" height="3" rx="0.3" fill="#b8b0a0" opacity="0.9"/>
        `)}
        <!-- QFN 핀 하단 -->
        ${[0,1,2,3,4,5].map(i => svg`
          <rect x="${43 + i*7}" y="116" width="4" height="3" rx="0.3" fill="#b8b0a0" opacity="0.9"/>
        `)}
        <!-- QFN 핀 좌측 -->
        ${[0,1,2,3].map(i => svg`
          <rect x="35" y="${76 + i*10}" width="3" height="4" rx="0.3" fill="#b8b0a0" opacity="0.9"/>
        `)}
        <!-- QFN 핀 우측 -->
        ${[0,1,2,3].map(i => svg`
          <rect x="86" y="${76 + i*10}" width="3" height="4" rx="0.3" fill="#b8b0a0" opacity="0.9"/>
        `)}
        <!-- 핀1 마커 -->
        <circle cx="41" cy="71" r="0.8" fill="#444"/>
        <!-- 칩 마킹 -->
        <text x="62" y="87" font-size="4.5" fill="#484848" font-family="monospace"
          text-anchor="middle" letter-spacing="0.3">ESP32-C3</text>
        <text x="62" y="95" font-size="3.8" fill="#383838" font-family="monospace"
          text-anchor="middle">FN4 R0</text>
        <text x="62" y="102" font-size="3.2" fill="#303030" font-family="monospace"
          text-anchor="middle">ESPRESSIF</text>
        <!-- 칩 광택 -->
        <rect x="38" y="68" width="48" height="5" rx="2"
          fill="white" opacity="0.025"/>

        <!-- ── SMD 커패시터/저항 (0402) ── -->
        <rect x="28" y="60" width="5" height="2.5" rx="0.5" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.3"/>
        <rect x="91" y="60" width="5" height="2.5" rx="0.5" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.3"/>
        <rect x="28" y="120" width="5" height="2.5" rx="0.5" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.3"/>
        <rect x="91" y="120" width="5" height="2.5" rx="0.5" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.3"/>

        <!-- ── 핀 헤더 소켓 (검은 플라스틱 — 양쪽) ── -->
        <rect x="9"  y="44" width="13" height="118" rx="1"
          fill="#0d0d0d" stroke="#1a1a1a" stroke-width="0.5"/>
        <rect x="102" y="44" width="13" height="118" rx="1"
          fill="#0d0d0d" stroke="#1a1a1a" stroke-width="0.5"/>

        <!-- ── 핀 구멍 & 라벨 ── -->
        ${C3_PINS.map(pin => {
          const val = pin.gpioNum !== undefined ? (this.pinStates[pin.gpioNum] ?? 0) : 0;
          const isHigh = val > 0;
          const isLeft = pin.side === 'left';

          const ringColor = pin.type === 'power'
            ? (pin.name === 'GND' ? '#55aa77' : pin.name === '5V' ? '#cc7766' : '#cc8877')
            : pin.isAdc ? '#bbaa44' : '#a0905a';
          const holeColor = isHigh ? '#ffee55' : '#06101f';
          const labelColor = pin.type === 'power'
            ? (pin.name === 'GND' ? '#55aa77' : '#cc8877')
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
        <text x="62" y="176" font-size="3.8" fill="#1e3070" font-family="Arial,sans-serif"
          text-anchor="middle" font-weight="bold" letter-spacing="0.2">ESP32-C3 Super Mini</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-board-esp32c3': SimBoardEsp32c3; }
}
