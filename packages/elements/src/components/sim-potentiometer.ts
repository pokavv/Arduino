import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-potentiometer> — 가변저항 (90×90px)
 * Pins: VCC, GND, WIPER
 * 노브 드래그 시 sim-interaction-start/end 이벤트를 디스패치 →
 * 캔버스가 이 이벤트를 받으면 컴포넌트 드래그를 차단해 충돌 방지
 */
@customElement('sim-potentiometer')
export class SimPotentiometer extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 90px; height: 90px; }
      .knob { cursor: ew-resize; }
    `,
  ];

  @property({ type: Number }) value = 512;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 1023;

  private _dragging = false;
  private _startX = 0;
  private _startValue = 0;

  override get componentType() { return 'potentiometer'; }
  override get pins() { return ['VCC', 'GND', 'WIPER']; }
  override setPinState(_pin: string, _value: number | string) {}

  // getPinPositions: viewBox 좌표 × 1.5 (host 90×90 / viewBox 60×60 = 1.5)
  override getPinPositions() {
    return new Map([
      ['VCC',   { x: 24, y: 87 }],
      ['WIPER', { x: 45, y: 87 }],
      ['GND',   { x: 66, y: 87 }],
    ]);
  }

  getAnalogValue(): number { return this.value; }

  private _onPointerDown(e: PointerEvent) {
    e.stopPropagation();
    this._dragging = true;
    this._startX = e.clientX;
    this._startValue = this.value;
    (e.target as Element).setPointerCapture(e.pointerId);
    // 캔버스에 "인터랙티브 조작 시작" 신호 — 컴포넌트 드래그 차단
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
  }

  private _onPointerMove(e: PointerEvent) {
    if (!this._dragging) return;
    const dx = e.clientX - this._startX;
    const range = this.max - this.min;
    const newVal = Math.round(this._startValue + (dx / 100) * range);
    this.value = Math.max(this.min, Math.min(this.max, newVal));
    this.dispatchEvent(new CustomEvent('sim-change', {
      bubbles: true, composed: true, detail: { value: this.value },
    }));
  }

  private _onPointerUp(e: PointerEvent) {
    this._dragging = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
  }

  override render() {
    const ratio = (this.value - this.min) / (this.max - this.min);
    const angleDeg = -135 + ratio * 270;
    const angleRad = (angleDeg * Math.PI) / 180;
    const kx = 30, ky = 28, indR = 9.5;
    const indX = kx + indR * Math.sin(angleRad);
    const indY = ky - indR * Math.cos(angleRad);
    const trackR = 16;
    const toXY = (deg: number) => {
      const r = (deg * Math.PI) / 180;
      return { x: (kx + trackR * Math.sin(r)).toFixed(2), y: (ky - trackR * Math.cos(r)).toFixed(2) };
    };
    const ts = toXY(-135), te = toXY(135), ae = toXY(angleDeg);
    const largeArc = ratio > 0.5 ? 1 : 0;
    const pct = Math.round(ratio * 100);

    return html`
      <svg width="90" height="90" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">

        <!-- 세라믹 몸체 -->
        <rect x="5" y="6" width="50" height="34" rx="3" fill="#3a5a7a" stroke="#2a4a6a" stroke-width="1"/>
        <rect x="5" y="6" width="50" height="7" rx="3" fill="white" opacity="0.14"/>
        <rect x="5" y="34" width="50" height="6" fill="#0d2030" opacity="0.4"/>
        <text x="30" y="39" font-size="5" fill="#8ab" font-family="monospace"
          text-anchor="middle" opacity="0.8">BOURNS</text>

        <!-- 트랙 호 -->
        <path d="M ${ts.x} ${ts.y} A ${trackR} ${trackR} 0 1 1 ${te.x} ${te.y}"
          fill="none" stroke="#1a2a3a" stroke-width="4" stroke-linecap="round"/>
        <path d="M ${ts.x} ${ts.y} A ${trackR} ${trackR} 0 ${largeArc} 1 ${ae.x} ${ae.y}"
          fill="none" stroke="#4a9eff" stroke-width="3.5" stroke-linecap="round"/>

        <!-- 노브 클릭 영역 (투명 큰 원) -->
        <circle cx="${kx}" cy="${ky}" r="14"
          fill="transparent"
          class="knob"
          @pointerdown="${this._onPointerDown}"
          @pointermove="${this._onPointerMove}"
          @pointerup="${this._onPointerUp}"/>

        <!-- 노브 본체 -->
        <circle cx="${kx}" cy="${ky}" r="12" fill="#4a4a4a" class="knob"
          @pointerdown="${this._onPointerDown}"
          @pointermove="${this._onPointerMove}"
          @pointerup="${this._onPointerUp}"/>
        <circle cx="${kx}" cy="${ky}" r="12" fill="white" opacity="0.05" class="knob"
          @pointerdown="${this._onPointerDown}"
          @pointermove="${this._onPointerMove}"
          @pointerup="${this._onPointerUp}"/>
        <circle cx="${kx}" cy="${ky}" r="12" fill="none" stroke="#333" stroke-width="1"
          class="knob"
          @pointerdown="${this._onPointerDown}"
          @pointermove="${this._onPointerMove}"
          @pointerup="${this._onPointerUp}"/>

        <!-- 노브 하이라이트 -->
        <ellipse cx="${kx - 3.5}" cy="${ky - 5}" rx="4" ry="2.2"
          fill="white" opacity="0.18" transform="rotate(-20,${kx - 3.5},${ky - 5})"/>

        <!-- 드라이버 슬롯 -->
        <line x1="${kx - 5}" y1="${ky}" x2="${kx + 5}" y2="${ky}"
          stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round"
          transform="rotate(${angleDeg}, ${kx}, ${ky})"/>

        <!-- 인디케이터 점 -->
        <circle cx="${indX.toFixed(2)}" cy="${indY.toFixed(2)}" r="2" fill="#4a9eff"/>

        <!-- 퍼센트 값 -->
        <text x="${kx}" y="${ky + 4.5}" font-size="5.5" fill="#cde"
          font-family="monospace" text-anchor="middle">${pct}%</text>

        <!-- 핀 3개 -->
        <rect x="14.5" y="42" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="15"   y="42" width="1.5" height="16" fill="white" opacity="0.35"/>
        <rect x="28.5" y="42" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="29"   y="42" width="1.5" height="16" fill="white" opacity="0.35"/>
        <rect x="42.5" y="42" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="43"   y="42" width="1.5" height="16" fill="white" opacity="0.35"/>

        <!-- 핀 라벨 -->
        <text x="10"  y="57" font-size="5" fill="#ff8888" font-family="monospace" font-weight="bold">V</text>
        <text x="26"  y="57" font-size="5" fill="#88aaff" font-family="monospace" font-weight="bold">W</text>
        <text x="40"  y="57" font-size="5" fill="#88ee88" font-family="monospace" font-weight="bold">G</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-potentiometer': SimPotentiometer; }
}
