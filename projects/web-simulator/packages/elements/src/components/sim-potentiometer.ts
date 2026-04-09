import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-potentiometer> — 가변저항 (포텐셔미터)
 *
 * Pins: VCC, GND, WIPER(출력 핀)
 * 출력: 0~1023 (10-bit ADC) 또는 0~4095 (12-bit)
 */
@customElement('sim-potentiometer')
export class SimPotentiometer extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 60px; height: 60px; }
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

  override getPinPositions() {
    return new Map([
      ['VCC',   { x: 16, y: 58 }],
      ['WIPER', { x: 30, y: 58 }],
      ['GND',   { x: 44, y: 58 }],
    ]);
  }

  getAnalogValue(): number {
    return this.value;
  }

  private _onPointerDown(e: PointerEvent) {
    e.stopPropagation();
    this._dragging = true;
    this._startX = e.clientX;
    this._startValue = this.value;
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  private _onPointerMove(e: PointerEvent) {
    if (!this._dragging) return;
    const dx = e.clientX - this._startX;
    const range = this.max - this.min;
    const newVal = Math.round(this._startValue + (dx / 100) * range);
    this.value = Math.max(this.min, Math.min(this.max, newVal));
    this.dispatchEvent(new CustomEvent('sim-change', {
      bubbles: true, composed: true,
      detail: { value: this.value },
    }));
  }

  private _onPointerUp(e: PointerEvent) {
    this._dragging = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
  }

  override render() {
    const ratio = (this.value - this.min) / (this.max - this.min);
    // 노브 회전: -135도(최소) ~ +135도(최대), 0도 기준 = 위
    const angleDeg = -135 + ratio * 270;
    const angleRad = (angleDeg * Math.PI) / 180;
    const knobCx = 30, knobCy = 28;
    const indicatorR = 9.5;
    const indX = knobCx + indicatorR * Math.sin(angleRad);
    const indY = knobCy - indicatorR * Math.cos(angleRad);

    // 트랙 호 계산: SVG arc (cx=30, cy=28, r=16)
    // -135deg(시작) ~ +135deg(끝), 시계방향
    const trackR = 16;
    const toXY = (deg: number) => {
      const r = (deg * Math.PI) / 180;
      return {
        x: (knobCx + trackR * Math.sin(r)).toFixed(2),
        y: (knobCy - trackR * Math.cos(r)).toFixed(2),
      };
    };
    const trackStart = toXY(-135);
    const trackEnd   = toXY(135);
    const activeEnd  = toXY(angleDeg);
    const largeArc   = ratio > 0.5 ? 1 : 0;

    const pct = Math.round(ratio * 100);

    return html`
      <svg width="60" height="60" viewBox="0 0 60 60">
        <defs>
          <!-- Bourns 스타일 세라믹 몸체: 파란/회색 계열 -->
          <linearGradient id="potBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#5a7a9a"/>
            <stop offset="40%"  stop-color="#3a5a7a"/>
            <stop offset="100%" stop-color="#1e3a52"/>
          </linearGradient>
          <!-- 노브 radialGradient -->
          <radialGradient id="potKnobGrad" cx="38%" cy="30%" r="65%">
            <stop offset="0%"   stop-color="#9a9a9a"/>
            <stop offset="50%"  stop-color="#5a5a5a"/>
            <stop offset="100%" stop-color="#2a2a2a"/>
          </radialGradient>
          <!-- 핀 광택 -->
          <linearGradient id="potPinGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stop-color="#999"/>
            <stop offset="50%"  stop-color="#eee"/>
            <stop offset="100%" stop-color="#999"/>
          </linearGradient>
          <!-- 노브 상단 금속 슬롯 그림자 -->
          <filter id="potShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.4"/>
          </filter>
        </defs>

        <!-- 세라믹 몸체 (정사각형 패키지) -->
        <rect x="5" y="8" width="50" height="34" rx="3"
          fill="url(#potBodyGrad)" stroke="#2a4a6a" stroke-width="1"/>
        <!-- 상단 광택 -->
        <rect x="5" y="8" width="50" height="6" rx="3"
          fill="white" opacity="0.12"/>
        <!-- 몸체 각인 텍스트 -->
        <text x="30" y="40" font-size="5" fill="#8ab" font-family="monospace"
          text-anchor="middle" opacity="0.8">BOURNS</text>

        <!-- 트랙 배경 호 (회색) -->
        <path d="M ${trackStart.x} ${trackStart.y} A ${trackR} ${trackR} 0 1 1 ${trackEnd.x} ${trackEnd.y}"
          fill="none" stroke="#1a2a3a" stroke-width="4" stroke-linecap="round"/>

        <!-- 트랙 활성 호 (파란색) -->
        <path d="M ${trackStart.x} ${trackStart.y} A ${trackR} ${trackR} 0 ${largeArc} 1 ${activeEnd.x} ${activeEnd.y}"
          fill="none" stroke="#4a9eff" stroke-width="3.5" stroke-linecap="round"/>

        <!-- 노브 원형 -->
        <circle cx="${knobCx}" cy="${knobCy}" r="12"
          fill="url(#potKnobGrad)" stroke="#4a4a4a" stroke-width="1"
          filter="url(#potShadow)"
          class="knob"
          @pointerdown="${this._onPointerDown}"
          @pointermove="${this._onPointerMove}"
          @pointerup="${this._onPointerUp}"/>
        <!-- 노브 상단 하이라이트 -->
        <ellipse cx="${knobCx - 3}" cy="${knobCy - 4}" rx="3.5" ry="2"
          fill="white" opacity="0.18" transform="rotate(-20,${knobCx-3},${knobCy-4})"/>
        <!-- 드라이버 슬롯 (일자 슬롯 느낌) -->
        <line x1="${knobCx - 5}" y1="${knobCy}" x2="${knobCx + 5}" y2="${knobCy}"
          stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round"
          transform="rotate(${angleDeg}, ${knobCx}, ${knobCy})"/>
        <!-- 인디케이터 점 -->
        <circle cx="${indX.toFixed(2)}" cy="${indY.toFixed(2)}" r="2"
          fill="#4a9eff"/>

        <!-- 퍼센트 값 표시 -->
        <text x="${knobCx}" y="${knobCy + 4}" font-size="5.5" fill="#cde"
          font-family="monospace" text-anchor="middle">${pct}%</text>

        <!-- 핀 3개 -->
        <rect x="14.5" y="42" width="3" height="16" rx="0.5" fill="url(#potPinGrad)"/>
        <rect x="28.5" y="42" width="3" height="16" rx="0.5" fill="url(#potPinGrad)"/>
        <rect x="42.5" y="42" width="3" height="16" rx="0.5" fill="url(#potPinGrad)"/>

        <!-- 핀 라벨 -->
        <text x="10"  y="57" font-size="4.5" fill="#f88" font-family="monospace">VCC</text>
        <text x="26"  y="57" font-size="4.5" fill="#4a9eff" font-family="monospace">W</text>
        <text x="38"  y="57" font-size="4.5" fill="#8f8" font-family="monospace">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-potentiometer': SimPotentiometer;
  }
}
