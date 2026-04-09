import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-joystick> — KY-023 조이스틱 모듈 (76x95px)
 * Pins: GND(x=10,y=95), VCC(x=24,y=95), VRX(x=38,y=95), VRY(x=52,y=95), SW(x=66,y=95)
 */
@customElement('sim-joystick')
export class SimJoystick extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 76px; height: 95px; }
      .stick { cursor: grab; }
      .stick:active { cursor: grabbing; }
    `,
  ];

  @property({ type: Number }) xValue = 512;
  @property({ type: Number }) yValue = 512;
  @property({ type: Boolean, reflect: true }) pressed = false;

  private _dragging = false;
  private _baseX = 0;
  private _baseY = 0;

  override get componentType() { return 'joystick'; }
  override get pins() { return ['GND', 'VCC', 'VRX', 'VRY', 'SW']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'VRX') this.xValue = Math.max(0, Math.min(1023, v));
    else if (pin === 'VRY') this.yValue = Math.max(0, Math.min(1023, v));
    else if (pin === 'SW') this.pressed = v === 0;
  }

  override getPinPositions() {
    return new Map([
      ['GND', { x: 10, y: 95 }],
      ['VCC', { x: 24, y: 95 }],
      ['VRX', { x: 38, y: 95 }],
      ['VRY', { x: 52, y: 95 }],
      ['SW',  { x: 66, y: 95 }],
    ]);
  }

  private _onDown(e: PointerEvent) {
    e.stopPropagation();
    this._dragging = true;
    this._baseX = e.clientX;
    this._baseY = e.clientY;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
  }

  private _onMove(e: PointerEvent) {
    if (!this._dragging) return;
    e.stopPropagation();
    const dx = (e.clientX - this._baseX) * 2.5;
    const dy = (e.clientY - this._baseY) * 2.5;
    this.xValue = Math.max(0, Math.min(1023, Math.round(512 + dx)));
    this.yValue = Math.max(0, Math.min(1023, Math.round(512 + dy)));
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('sim-change', {
      bubbles: true, composed: true,
      detail: { xValue: this.xValue, yValue: this.yValue },
    }));
  }

  private _onUp(e: PointerEvent) {
    if (!this._dragging) return;
    e.stopPropagation();
    this._dragging = false;
    this.xValue = 512;
    this.yValue = 512;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
  }

  override render() {
    // 조이스틱 스틱 위치 (viewBox 20x25 내, 중심 cx=10 cy=9)
    const maxOffset = 2.5;
    const stickDx = ((this.xValue - 512) / 512) * maxOffset;
    const stickDy = ((this.yValue - 512) / 512) * maxOffset;
    const sx = 10 + stickDx;
    const sy = 9 + stickDy;

    return html`
      <svg width="76" height="95" viewBox="0 0 20 25" xmlns="http://www.w3.org/2000/svg">
        <!-- PCB -->
        <rect x="0" y="0" width="20" height="25" rx="0.5"
          fill="#087f45" stroke="#055c33" stroke-width="0.3"/>

        <!-- 조이스틱 베이스 플라스틱 박스 -->
        <rect x="3" y="3" width="14" height="14" rx="1"
          fill="#2a2a2a" stroke="#111" stroke-width="0.4"/>
        <rect x="3" y="3" width="14" height="2" rx="1"
          fill="white" opacity="0.06"/>

        <!-- 가이드 원 (베이스) -->
        <circle cx="10" cy="10" r="5.5"
          fill="#1a1a1a" stroke="#333" stroke-width="0.4"/>
        <circle cx="10" cy="10" r="5.5"
          fill="none" stroke="#444" stroke-width="0.3" stroke-dasharray="0.5,0.5"/>

        <!-- X/Y 크로스헤어 -->
        <line x1="4.5" y1="10" x2="15.5" y2="10" stroke="#333" stroke-width="0.2" opacity="0.5"/>
        <line x1="10" y1="4.5" x2="10" y2="15.5" stroke="#333" stroke-width="0.2" opacity="0.5"/>

        <!-- 조이스틱 스틱 + 캡 (인터랙티브) -->
        <!-- 스틱 그림자 -->
        <circle cx="${sx + 0.2}" cy="${sy + 0.2}" r="2.8" fill="black" opacity="0.4"/>
        <!-- 스틱 베이스 -->
        <circle cx="${sx}" cy="${sy}" r="2.8"
          fill="${this.pressed ? '#1a1a1a' : '#222'}"
          stroke="#111" stroke-width="0.3"/>
        <!-- 스틱 캡 (검은 고무) -->
        <circle class="stick" cx="${sx}" cy="${sy}" r="2.4"
          fill="${this.pressed ? '#333' : '#3a3a3a'}"
          stroke="#555" stroke-width="0.3"
          @pointerdown="${this._onDown}"
          @pointermove="${this._onMove}"
          @pointerup="${this._onUp}"
          @pointercancel="${this._onUp}"/>
        <!-- 캡 하이라이트 -->
        <ellipse cx="${sx - 0.7}" cy="${sy - 0.8}" rx="1" ry="0.6"
          fill="white" opacity="${this.pressed ? 0.05 : 0.2}"
          transform="rotate(-20,${sx - 0.7},${sy - 0.8})"/>

        <!-- 핀 리드 (5개) -->
        <rect x="1.3"  y="17" width="1.3" height="8" rx="0.4" fill="#222"/>
        <rect x="5.1"  y="17" width="1.3" height="8" rx="0.4" fill="#cc2200"/>
        <rect x="9.3"  y="17" width="1.3" height="8" rx="0.4" fill="#ccaa44"/>
        <rect x="13.4" y="17" width="1.3" height="8" rx="0.4" fill="#44aacc"/>
        <rect x="17.4" y="17" width="1.3" height="8" rx="0.4" fill="#aa44cc"/>

        <!-- 핀 라벨 -->
        <rect x="0" y="20.5" width="20" height="4.5" fill="#0d0d14"/>
        <line x1="0" y1="20.5" x2="20" y2="20.5" stroke="#252535" stroke-width="0.2"/>
        <text x="1.9"  y="24" font-size="1.5" fill="#88ee99" font-family="monospace" text-anchor="middle">GND</text>
        <text x="5.7"  y="24" font-size="1.5" fill="#ff8877" font-family="monospace" text-anchor="middle">VCC</text>
        <text x="10"   y="24" font-size="1.5" fill="#ffcc55" font-family="monospace" text-anchor="middle">VRX</text>
        <text x="14.1" y="24" font-size="1.5" fill="#55ccff" font-family="monospace" text-anchor="middle">VRY</text>
        <text x="18.1" y="24" font-size="1.5" fill="#cc88ff" font-family="monospace" text-anchor="middle">SW</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-joystick': SimJoystick; }
}
