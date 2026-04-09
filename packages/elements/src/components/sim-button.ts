import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-button> — 푸시 버튼 (Tactile Switch)
 *
 * Pins: PIN1A, PIN1B (한쪽), PIN2A, PIN2B (다른쪽)
 * 일반적으로: PIN1A→GPIO, PIN2A→GND
 *
 * Events: sim-press, sim-release
 */
@customElement('sim-button')
export class SimButton extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 50px; height: 50px; }
      .btn-cap {
        cursor: pointer;
        transition: transform 0.05s;
      }
      .btn-cap:active, .btn-cap.pressed {
        transform: translateY(2px);
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) pressed = false;
  @property({ type: String }) btnColor = '#2244aa';

  override get componentType() { return 'button'; }
  override get pins() { return ['PIN1A', 'PIN1B', 'PIN2A', 'PIN2B']; }

  override setPinState(_pin: string, _value: number | string) {}

  override getPinPositions() {
    return new Map([
      ['PIN1A', { x: 14, y: 50 }],
      ['PIN1B', { x: 20, y: 50 }],
      ['PIN2A', { x: 30, y: 50 }],
      ['PIN2B', { x: 36, y: 50 }],
    ]);
  }

  /** 시뮬레이션 엔진이 읽는 핀 상태 */
  getPinValue(pin: string): number {
    if (pin === 'PIN1A' || pin === 'PIN1B') {
      return this.pressed ? 1 : 0;
    }
    return 0;
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
    const capY = this.pressed ? 22 : 20;
    return html`
      <svg width="50" height="50" viewBox="0 0 50 50">
        <!-- 몸체 베이스 -->
        <rect x="8" y="26" width="34" height="16" rx="2" fill="#333"/>
        <!-- 다리 4개 -->
        <line x1="14" y1="42" x2="14" y2="50" stroke="#aaa" stroke-width="2"/>
        <line x1="20" y1="42" x2="20" y2="50" stroke="#aaa" stroke-width="2"/>
        <line x1="30" y1="42" x2="30" y2="50" stroke="#aaa" stroke-width="2"/>
        <line x1="36" y1="42" x2="36" y2="50" stroke="#aaa" stroke-width="2"/>

        <!-- 버튼 캡 -->
        <g class="btn-cap ${this.pressed ? 'pressed' : ''}"
           @pointerdown="${this._onPress}"
           @pointerup="${this._onRelease}"
           @pointerleave="${this._onRelease}">
          <ellipse cx="25" cy="${capY}" rx="12" ry="10" fill="${this.btnColor}"/>
          <ellipse cx="25" cy="${capY - 2}" rx="12" ry="8"
            fill="${this.btnColor}" opacity="0.8"/>
          <ellipse cx="21" cy="${capY - 4}" rx="4" ry="2"
            fill="white" opacity="0.25" transform="rotate(-20,21,${capY-4})"/>
        </g>

        <!-- 핀 라벨 -->
        <text x="11" y="9" font-size="6" fill="#888" font-family="monospace">1A 1B</text>
        <text x="24" y="9" font-size="6" fill="#888" font-family="monospace">2A 2B</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-button': SimButton;
  }
}
