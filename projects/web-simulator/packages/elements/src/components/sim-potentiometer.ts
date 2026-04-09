import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-potentiometer> — 로터리 가변저항 (150×165px)
 *
 * Wokwi potentiometer-element.ts 기준 정밀 재현:
 *   viewBox: 0 0 20 20 (mm, 1unit=1mm)
 *   scale: 7.5 px/mm → host 150×150px + 핀 영역
 *   바디: #045881 (진한 파란색)
 *   외곽 노브: cx=9.91 cy=8.18 rx=7.27 ry=7.43
 *   내부 노브: cx=9.95 cy=8.06 rx=6.60 ry=6.58
 *   회전 인디케이터: rect x=10 y=2 w=0.42 h=3.1 (transform-origin: 10 8)
 *   각도 범위: -135° ~ +135° (총 270°)
 *   핀 (y=18mm): GND(7.68), SIG(10.22), VCC(12.76)
 *
 * Pins: GND, WIPER(SIG), VCC
 */
@customElement('sim-potentiometer')
export class SimPotentiometer extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 150px; height: 165px; }
      .knob-drag { cursor: ew-resize; }
    `,
  ];

  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 1023;

  private _dragging = false;
  private _startX = 0;
  private _startValue = 0;

  override get componentType() { return 'potentiometer'; }
  override get pins() { return ['VCC', 'GND', 'WIPER']; }
  override setPinState(_pin: string, _value: number | string) {}

  // viewBox 0 0 20 22 (mm, 핀 영역 포함), host 150×165
  // scale 7.5px/mm
  // 핀 y=18mm (viewBox) → 18/22×165 = 135px, 핀 끝은 y=165
  // GND x=7.68mm → 7.68/20×150=57.6, SIG x=10.22→76.65, VCC x=12.76→95.7
  override getPinPositions() {
    return new Map([
      ['GND',   { x: 58,  y: 165 }],
      ['WIPER', { x: 77,  y: 165 }],
      ['VCC',   { x: 96,  y: 165 }],
    ]);
  }

  getAnalogValue(): number { return this.value; }

  private _onPointerDown(e: PointerEvent) {
    e.stopPropagation();
    this._dragging = true;
    this._startX = e.clientX;
    this._startValue = this.value;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
  }

  private _onPointerMove(e: PointerEvent) {
    if (!this._dragging) return;
    e.stopPropagation();
    const dx = e.clientX - this._startX;
    const range = this.max - this.min;
    const newVal = Math.round(this._startValue + (dx / 120) * range);
    this.value = Math.max(this.min, Math.min(this.max, newVal));
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('sim-change', {
      bubbles: true, composed: true, detail: { value: this.value },
    }));
  }

  private _onPointerUp(e: PointerEvent) {
    if (!this._dragging) return;
    e.stopPropagation();
    this._dragging = false;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
  }

  override render() {
    const ratio = (this.value - this.min) / (this.max - this.min);
    // Wokwi: 각도 = 270 * ratio - 135
    const knobDeg = 270 * ratio - 135;
    const pct = Math.round(ratio * 100);

    // 트랙 호 (startDeg=-135, endDeg=+135)
    const trackR = 6.0; // mm
    const kx = 9.91, ky = 8.18;
    const toXY = (deg: number) => {
      const r = (deg * Math.PI) / 180;
      return { x: (kx + trackR * Math.sin(r)).toFixed(3), y: (ky - trackR * Math.cos(r)).toFixed(3) };
    };
    const ts = toXY(-135), te = toXY(135), ae = toXY(knobDeg);
    const largeArc = ratio > 0.5 ? 1 : 0;

    return html`
      <svg width="150" height="165"
           viewBox="0 0 20 22"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 노브 방사형 그라디언트 -->
          <radialGradient id="knob-outer" cx="0.4" cy="0.3" r="0.7">
            <stop offset="0%"   stop-color="#f8f8f8"/>
            <stop offset="100%" stop-color="#c0c0c0"/>
          </radialGradient>
          <radialGradient id="knob-inner" cx="0.4" cy="0.3" r="0.7">
            <stop offset="0%"   stop-color="#d8d8d8"/>
            <stop offset="100%" stop-color="#a8a8a8"/>
          </radialGradient>
          <!-- 포커스 글로우 -->
          <filter id="pot-focus">
            <feGaussianBlur stdDeviation="0.4"/>
          </filter>
        </defs>

        <!-- ── 바디 (Wokwi: #045881, 둥근 사각형) ── -->
        <rect x="0.15" y="0.15" width="19.5" height="19.5" ry="1.23"
          fill="#045881" stroke="#03406a" stroke-width="0.15"/>
        <!-- 상단 하이라이트 -->
        <rect x="0.15" y="0.15" width="19.5" height="2.5" ry="1.23"
          fill="white" opacity="0.08"/>

        <!-- ── 상단 마운팅 슬롯 (Wokwi: x=5.4 y=0.70 w=9.1 h=1.9) ── -->
        <rect x="5.4" y="0.70" width="9.1" height="1.9"
          fill="#ccdae3" stroke="none"/>

        <!-- ── 코너 마운팅 홀 (흰색 원) ── -->
        <ellipse cx="1.68"  cy="1.81"  rx="0.99" ry="0.96" fill="#ffffff"/>
        <ellipse cx="1.48"  cy="18.37" rx="0.99" ry="0.96" fill="#ffffff"/>
        <ellipse cx="17.97" cy="18.47" rx="0.99" ry="0.96" fill="#ffffff"/>
        <ellipse cx="18.07" cy="1.91"  rx="0.99" ry="0.96" fill="#ffffff"/>
        <!-- 홀 내부 (어두운 중심) -->
        <ellipse cx="1.68"  cy="1.81"  rx="0.55" ry="0.52" fill="#033d5e"/>
        <ellipse cx="1.48"  cy="18.37" rx="0.55" ry="0.52" fill="#033d5e"/>
        <ellipse cx="17.97" cy="18.47" rx="0.55" ry="0.52" fill="#033d5e"/>
        <ellipse cx="18.07" cy="1.91"  rx="0.55" ry="0.52" fill="#033d5e"/>

        <!-- ── 트랙 호 (전체: 회색 배경) ── -->
        <path d="M ${ts.x} ${ts.y} A ${trackR} ${trackR} 0 1 1 ${te.x} ${te.y}"
          fill="none" stroke="#023050" stroke-width="1.1" stroke-linecap="round"/>
        <!-- 트랙 호 (활성: 파랑) -->
        ${ratio > 0.001 ? html`
          <path d="M ${ts.x} ${ts.y} A ${trackR} ${trackR} 0 ${largeArc} 1 ${ae.x} ${ae.y}"
            fill="none" stroke="#4ad4ff" stroke-width="0.9" stroke-linecap="round"/>
        ` : ''}

        <!-- ── 외곽 노브 (Wokwi: cx=9.91 cy=8.18 rx=7.27 ry=7.43) ── -->
        <ellipse id="knob" cx="${kx}" cy="${ky}" rx="7.27" ry="7.43"
          fill="url(#knob-outer)" stroke="#aaaaaa" stroke-width="0.12"/>
        <!-- 내부 노브 (Wokwi: cx=9.95 cy=8.06 rx=6.60 ry=6.58) -->
        <ellipse cx="9.95" cy="8.06" rx="6.60" ry="6.58"
          fill="url(#knob-inner)" stroke="#999999" stroke-width="0.10"/>
        <!-- 노브 상단 하이라이트 -->
        <ellipse cx="8.8" cy="5.8" rx="2.5" ry="1.8"
          fill="white" opacity="0.25" transform="rotate(-20, 8.8, 5.8)"/>

        <!-- ── 회전 인디케이터 (Wokwi: rect x=10 y=2 w=0.42 h=3.1) ── -->
        <!-- transform-origin: 10px 8px (SVG 좌표에서 10mm, 8mm) -->
        <rect x="9.79" y="2.0" width="0.42" height="3.1"
          fill="#cccccc" rx="0.1"
          transform="rotate(${knobDeg}, ${kx}, ${ky})"/>

        <!-- ── 드래그 핸들 (투명 원) ── -->
        <ellipse class="knob-drag" cx="${kx}" cy="${ky}" rx="7.27" ry="7.43"
          fill="transparent"
          @pointerdown="${this._onPointerDown}"
          @pointermove="${this._onPointerMove}"
          @pointerup="${this._onPointerUp}"
          @pointercancel="${this._onPointerUp}"/>

        <!-- ── 값 표시 ── -->
        <text x="${kx}" y="${ky + 1.0}" font-size="1.6" fill="#0a2540"
          font-family="monospace" text-anchor="middle" font-weight="bold"
          opacity="0.7">${pct}%</text>

        <!-- ── 핀 패드 (Wokwi: y=18, 3개) ── -->
        <!-- GND: cx=7.68 -->
        <ellipse cx="7.68" cy="18" rx="0.61" ry="0.63" fill="#b3b1b0"/>
        <ellipse cx="7.68" cy="18" rx="0.32" ry="0.32" fill="#0a0a0a"/>
        <!-- SIG: cx=10.22 -->
        <ellipse cx="10.22" cy="18" rx="0.61" ry="0.63" fill="#b3b1b0"/>
        <ellipse cx="10.22" cy="18" rx="0.32" ry="0.32" fill="#0a0a0a"/>
        <!-- VCC: cx=12.76 -->
        <ellipse cx="12.76" cy="18" rx="0.61" ry="0.63" fill="#b3b1b0"/>
        <ellipse cx="12.76" cy="18" rx="0.32" ry="0.32" fill="#0a0a0a"/>

        <!-- ── 핀 라벨 (Wokwi 실크스크린) ── -->
        <text x="6.21"  y="16.6" font-size="1" fill="#ffffff" font-family="monospace">GND</text>
        <text x="9.2"   y="16.63" font-size="1" fill="#ffffff" font-family="monospace">SIG</text>
        <text x="11.5"  y="16.59" font-size="1" fill="#ffffff" font-family="monospace">VCC</text>

        <!-- ── 핀 금속 리드 (보드 하단 → y=20~22mm) ── -->
        <!-- GND -->
        <rect x="7.53" y="19.8" width="0.3" height="2.1" rx="0.1" fill="#888"/>
        <!-- SIG -->
        <rect x="10.07" y="19.8" width="0.3" height="2.1" rx="0.1" fill="#888"/>
        <!-- VCC -->
        <rect x="12.61" y="19.8" width="0.3" height="2.1" rx="0.1" fill="#888"/>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-potentiometer': SimPotentiometer; }
}
