import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-button> — 푸시 버튼 (75×75px)
 * Pins: PIN1A, PIN1B, PIN2A, PIN2B
 * Events: sim-press, sim-release
 */
@customElement('sim-button')
export class SimButton extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 75px; height: 75px; }
      .btn-cap { cursor: pointer; }
    `,
  ];

  @property({ type: Boolean, reflect: true }) pressed = false;
  @property({ type: String }) btnColor = '#2244aa';

  override get componentType() { return 'button'; }
  override get pins() { return ['PIN1A', 'PIN1B', 'PIN2A', 'PIN2B']; }

  override setPinState(_pin: string, _value: number | string) {}

  // getPinPositions: viewBox 좌표 × 1.5 (host 75×75 / viewBox 50×50 = 1.5)
  override getPinPositions() {
    return new Map([
      ['PIN1A', { x: 21, y: 75 }],
      ['PIN1B', { x: 30, y: 75 }],
      ['PIN2A', { x: 45, y: 75 }],
      ['PIN2B', { x: 54, y: 75 }],
    ]);
  }

  getPinValue(pin: string): number {
    return (pin === 'PIN1A' || pin === 'PIN1B') ? (this.pressed ? 1 : 0) : 0;
  }

  private _onPress(e: PointerEvent) {
    // stopPropagation은 shadow DOM 내부 전파만 멈춤 — 캔버스 드래그 임계값으로 충돌 방지
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
      <svg width="75" height="75" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">

        <!-- 리드핀 4개 -->
        <rect x="12.5" y="33" width="3" height="17" rx="0.5" fill="#aaaaaa"/>
        <rect x="13"   y="33" width="1.5" height="17" fill="white" opacity="0.3"/>
        <rect x="18.5" y="33" width="3" height="17" rx="0.5" fill="#aaaaaa"/>
        <rect x="19"   y="33" width="1.5" height="17" fill="white" opacity="0.3"/>
        <rect x="28.5" y="33" width="3" height="17" rx="0.5" fill="#aaaaaa"/>
        <rect x="29"   y="33" width="1.5" height="17" fill="white" opacity="0.3"/>
        <rect x="34.5" y="33" width="3" height="17" rx="0.5" fill="#aaaaaa"/>
        <rect x="35"   y="33" width="1.5" height="17" fill="white" opacity="0.3"/>

        <!-- 핀 라벨 -->
        <text x="10" y="49" font-size="4.5" fill="#888" font-family="monospace">1A</text>
        <text x="17" y="49" font-size="4.5" fill="#888" font-family="monospace">1B</text>
        <text x="27" y="49" font-size="4.5" fill="#888" font-family="monospace">2A</text>
        <text x="33" y="49" font-size="4.5" fill="#888" font-family="monospace">2B</text>

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
          <!-- 그림자 -->
          <circle cx="25" cy="${18 + pressOff}" r="9" fill="black" opacity="0.25"/>
          <!-- 캡 본체 -->
          <circle cx="25" cy="${17 + pressOff}" r="8.5"
            fill="${capColor}" stroke="${capShadow}" stroke-width="0.8"/>
          <!-- 밝은 레이어 -->
          <circle cx="25" cy="${17 + pressOff}" r="8.5"
            fill="${capHighlight}" opacity="0.2"/>
          <!-- 상단 하이라이트 -->
          <ellipse cx="22" cy="${13.5 + pressOff}" rx="3.5" ry="2"
            fill="white" opacity="${this.pressed ? 0.07 : 0.25}"
            transform="rotate(-15,22,${13.5 + pressOff})"/>
        </g>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-button': SimButton; }
}
