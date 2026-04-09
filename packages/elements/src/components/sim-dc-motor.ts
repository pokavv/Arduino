import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-dc-motor> — DC 소형 모터 (130-size, 76x121px)
 * Pins: M_PLUS(x=25, y=121), M_MINUS(x=51, y=121)
 */
@customElement('sim-dc-motor')
export class SimDcMotor extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 76px; height: 121px; }
      @keyframes spin-cw  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
    `,
  ];

  @property({ type: Number }) speed = 0;

  override get componentType() { return 'dc-motor'; }
  override get pins() { return ['M_PLUS', 'M_MINUS']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'M_PLUS') this.speed = Math.max(-255, Math.min(255, v));
  }

  override getPinPositions() {
    return new Map([
      ['M_PLUS',  { x: 25, y: 121 }],
      ['M_MINUS', { x: 51, y: 121 }],
    ]);
  }

  override render() {
    const absSpeed = Math.abs(this.speed);
    const spinning = absSpeed > 0;
    const direction = this.speed >= 0 ? 'cw' : 'ccw';
    const duration = spinning ? Math.max(0.2, 2.0 - (absSpeed / 255) * 1.8) : 0;
    const spinStyle = spinning ? `animation: spin-${direction} ${duration}s linear infinite; transform-box: fill-box; transform-origin: center;` : '';

    return html`
      <svg width="76" height="121" viewBox="0 0 20 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="body-g-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#707070"/>
            <stop offset="30%"  stop-color="#d0d0d0"/>
            <stop offset="50%"  stop-color="#e8e8e8"/>
            <stop offset="70%"  stop-color="#d0d0d0"/>
            <stop offset="100%" stop-color="#707070"/>
          </linearGradient>
          <linearGradient id="cap-g-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#0d47a1"/>
            <stop offset="50%"  stop-color="#1976d2"/>
            <stop offset="100%" stop-color="#0d47a1"/>
          </linearGradient>
        </defs>

        <!-- 왼쪽 파란 엔드캡 -->
        <rect x="0" y="5.5" width="3.5" height="14" rx="1"
          fill="url(#cap-g-${this.compId})" stroke="#0a3070" stroke-width="0.3"/>

        <!-- 금속 원통 케이스 -->
        <rect x="3" y="4.5" width="14" height="16" rx="1"
          fill="url(#body-g-${this.compId})" stroke="#555" stroke-width="0.3"/>
        <rect x="3" y="4.5" width="14" height="3" rx="1"
          fill="white" opacity="0.15"/>
        <!-- 볼트 -->
        <circle cx="5"  cy="6.5" r="0.55" fill="#888" stroke="#666" stroke-width="0.2"/>
        <circle cx="15" cy="6.5" r="0.55" fill="#888" stroke="#666" stroke-width="0.2"/>
        <circle cx="5"  cy="19" r="0.55" fill="#888" stroke="#666" stroke-width="0.2"/>
        <circle cx="15" cy="19" r="0.55" fill="#888" stroke="#666" stroke-width="0.2"/>

        <!-- 오른쪽 파란 엔드캡 -->
        <rect x="16.5" y="5.5" width="3.5" height="14" rx="1"
          fill="url(#cap-g-${this.compId})" stroke="#0a3070" stroke-width="0.3"/>

        <!-- 출력축 -->
        <rect x="19.5" y="10.5" width="5" height="4" rx="0.8"
          fill="#d0d0d0" stroke="#aaa" stroke-width="0.2"/>
        <rect x="19.5" y="11" width="5" height="1.2" fill="white" opacity="0.4"/>

        <!-- 회전 표시 -->
        <g style="${spinStyle}">
          <line x1="10" y1="7"    x2="10"   y2="18"   stroke="#aaaaaa" stroke-width="0.5" opacity="0.6"/>
          <line x1="5"  y1="12.5" x2="15"   y2="12.5" stroke="#aaaaaa" stroke-width="0.5" opacity="0.6"/>
          <line x1="6.8" y1="9.3" x2="13.2" y2="15.7" stroke="#aaaaaa" stroke-width="0.35" opacity="0.4"/>
          <line x1="13.2" y1="9.3" x2="6.8" y2="15.7" stroke="#aaaaaa" stroke-width="0.35" opacity="0.4"/>
        </g>

        <!-- M+ 와이어 (빨강) -->
        <rect x="5.5" y="20.5" width="2" height="11.5" rx="0.6" fill="#cc2200"/>
        <line x1="6.2" y1="20.5" x2="6.2" y2="32" stroke="#ff5533" stroke-width="0.4" opacity="0.4"/>
        <!-- M- 와이어 (검정) -->
        <rect x="12.5" y="20.5" width="2" height="11.5" rx="0.6" fill="#222222"/>
        <line x1="13.2" y1="20.5" x2="13.2" y2="32" stroke="#555" stroke-width="0.4" opacity="0.4"/>

        <!-- 핀 라벨 존 -->
        <rect x="0" y="25" width="20" height="7" fill="#0d0d14"/>
        <line x1="0" y1="25" x2="20" y2="25" stroke="#252535" stroke-width="0.3"/>
        <text x="6.5"  y="30.5" font-size="2.4" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">M+</text>
        <text x="13.5" y="30.5" font-size="2.4" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">M-</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-dc-motor': SimDcMotor; }
}
