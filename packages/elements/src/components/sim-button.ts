import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-button> — 푸시 버튼 (75×80px)
 * Pins: PIN1A, PIN1B, PIN2A, PIN2B
 * Events: sim-press, sim-release
 */
@customElement('sim-button')
export class SimButton extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 75px; height: 80px; }
      .btn-cap { cursor: pointer; }
    `,
  ];

  @property({ type: Boolean, reflect: true }) pressed = false;
  @property({ type: String }) btnColor = '#2244aa';

  override get componentType() { return 'button'; }
  override get pins() { return ['PIN1A', 'PIN1B', 'PIN2A', 'PIN2B']; }

  override setPinState(_pin: string, _value: number | string) {}

  // getPinPositions: viewBox(50×53) × 1.5 = host(75×80)
  // PIN1A x=14×1.5=21, PIN1B x=20×1.5=30, PIN2A x=30×1.5=45, PIN2B x=36×1.5=54
  override getPinPositions() {
    return new Map([
      ['PIN1A', { x: 21, y: 80 }],
      ['PIN1B', { x: 30, y: 80 }],
      ['PIN2A', { x: 45, y: 80 }],
      ['PIN2B', { x: 54, y: 80 }],
    ]);
  }

  getPinValue(pin: string): number {
    return (pin === 'PIN1A' || pin === 'PIN1B') ? (this.pressed ? 1 : 0) : 0;
  }

  private _onPress(e: PointerEvent) {
    e.stopPropagation();
    this.pressed = true;
    this.dispatchEvent(new CustomEvent('sim-press', { bubbles: true, composed: true }));
  }

  private _onRelease(e: PointerEvent) {
    e.stopPropagation();
    this.pressed = false;
    this.dispatchEvent(new CustomEvent('sim-release', { bubbles: true, composed: true }));
  }

  override render() {
    const capColor     = this.pressed ? '#1a44cc' : this.btnColor;
    const capHighlight = this.pressed ? '#3366dd' : '#5599ee';
    const capShadow    = this.pressed ? '#0d2a66' : '#1133aa';
    const pressOff     = this.pressed ? 2 : 0;

    return html`
      <svg width="75" height="80" viewBox="0 0 50 53" xmlns="http://www.w3.org/2000/svg">

        <!-- 핀 금속 — 1A/1B=파란색(side1), 2A/2B=주황색(side2) -->
        <rect x="12.5" y="33" width="3" height="20" rx="0.5" fill="#4477cc"/>
        <rect x="13.2" y="33" width="1.2" height="20" fill="white" opacity="0.25"/>
        <rect x="18.5" y="33" width="3" height="20" rx="0.5" fill="#4477cc"/>
        <rect x="19.2" y="33" width="1.2" height="20" fill="white" opacity="0.25"/>
        <rect x="28.5" y="33" width="3" height="20" rx="0.5" fill="#cc8800"/>
        <rect x="29.2" y="33" width="1.2" height="20" fill="white" opacity="0.25"/>
        <rect x="34.5" y="33" width="3" height="20" rx="0.5" fill="#cc8800"/>
        <rect x="35.2" y="33" width="1.2" height="20" fill="white" opacity="0.25"/>

        <!-- PCB 몸체 -->
        <rect x="7" y="${16 + pressOff}" width="36" height="19" rx="2"
          fill="#1e1e1e" stroke="#444" stroke-width="0.8"/>
        <rect x="7" y="${16 + pressOff}" width="36" height="5" rx="2"
          fill="white" opacity="0.06"/>
        <rect x="7" y="${30 + pressOff}" width="36" height="5"
          fill="#0a0a0a" opacity="0.5"/>

        <!-- 측면 가이드 슬롯 -->
        <rect x="5"  y="${22 + pressOff}" width="3" height="7" rx="1"
          fill="#2a2a2a" stroke="#444" stroke-width="0.5"/>
        <rect x="42" y="${22 + pressOff}" width="3" height="7" rx="1"
          fill="#2a2a2a" stroke="#444" stroke-width="0.5"/>

        <!-- 버튼 캡 — 클릭 가능 영역 -->
        <g class="btn-cap"
           @pointerdown="${this._onPress}"
           @pointerup="${this._onRelease}"
           @pointerleave="${this._onRelease}">
          <circle cx="25" cy="${18 + pressOff}" r="9" fill="black" opacity="0.25"/>
          <circle cx="25" cy="${17 + pressOff}" r="8.5"
            fill="${capColor}" stroke="${capShadow}" stroke-width="0.8"/>
          <circle cx="25" cy="${17 + pressOff}" r="8.5"
            fill="${capHighlight}" opacity="0.2"/>
          <ellipse cx="22" cy="${13.5 + pressOff}" rx="3.5" ry="2"
            fill="white" opacity="${this.pressed ? 0.07 : 0.25}"
            transform="rotate(-15,22,${13.5 + pressOff})"/>
        </g>

        <!-- 핀 라벨 존 (어두운 배경 + 대형 고대비 텍스트) -->
        <rect x="5" y="43" width="40" height="10" fill="#0d0d14"/>
        <line x1="5" y1="43" x2="45" y2="43" stroke="#252535" stroke-width="0.5"/>

        <!-- PIN1 라벨 (파란색) -->
        <text x="14" y="51" font-size="6.5" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">1A</text>
        <text x="20" y="51" font-size="6.5" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">1B</text>
        <!-- PIN2 라벨 (주황색) -->
        <text x="30" y="51" font-size="6.5" fill="#ffcc55" font-family="monospace"
          text-anchor="middle" font-weight="bold">2A</text>
        <text x="36" y="51" font-size="6.5" fill="#ffcc55" font-family="monospace"
          text-anchor="middle" font-weight="bold">2B</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-button': SimButton; }
}
