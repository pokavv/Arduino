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
    const capColor   = this.pressed ? '#1a55cc' : this.btnColor;
    const capHighlight = this.pressed ? '#3366dd' : '#4488ee';
    const capShadow  = this.pressed ? '#0d2a66' : '#1133aa';
    const bodyOffsetY = this.pressed ? 2 : 0;

    return html`
      <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">

        <!-- ── 리드핀 4개 (직접 색상) ── -->
        <rect x="12.5" y="33" width="3" height="17" rx="0.5" fill="#aaaaaa"/>
        <rect x="13"   y="33" width="1.5" height="17" rx="0.3" fill="white" opacity="0.35"/>
        <rect x="18.5" y="33" width="3" height="17" rx="0.5" fill="#aaaaaa"/>
        <rect x="19"   y="33" width="1.5" height="17" rx="0.3" fill="white" opacity="0.35"/>
        <rect x="28.5" y="33" width="3" height="17" rx="0.5" fill="#aaaaaa"/>
        <rect x="29"   y="33" width="1.5" height="17" rx="0.3" fill="white" opacity="0.35"/>
        <rect x="34.5" y="33" width="3" height="17" rx="0.5" fill="#aaaaaa"/>
        <rect x="35"   y="33" width="1.5" height="17" rx="0.3" fill="white" opacity="0.35"/>

        <!-- ── PCB 몸체 (검은 패키지) ── -->
        <rect x="7" y="${16 + bodyOffsetY}" width="36" height="19" rx="2"
          fill="#2a2a2a" stroke="#555" stroke-width="0.8"/>
        <!-- 상단 광택 레이어 -->
        <rect x="7" y="${16 + bodyOffsetY}" width="36" height="5" rx="2"
          fill="white" opacity="0.07"/>
        <!-- 하단 그림자 -->
        <rect x="7" y="${30 + bodyOffsetY}" width="36" height="5"
          fill="#111" opacity="0.5"/>

        <!-- 측면 가이드 슬롯 -->
        <rect x="5"  y="${22 + bodyOffsetY}" width="3" height="7" rx="1"
          fill="#3a3a3a" stroke="#555" stroke-width="0.5"/>
        <rect x="42" y="${22 + bodyOffsetY}" width="3" height="7" rx="1"
          fill="#3a3a3a" stroke="#555" stroke-width="0.5"/>

        <!-- ── 버튼 캡 ── -->
        <g class="btn-cap ${this.pressed ? 'pressed' : ''}"
           @pointerdown="${this._onPress}"
           @pointerup="${this._onRelease}"
           @pointerleave="${this._onRelease}">
          <!-- 캡 그림자 -->
          <circle cx="25" cy="${18 + bodyOffsetY}" r="9"
            fill="#000000" opacity="0.3"/>
          <!-- 캡 본체 (직접 색상) -->
          <circle cx="25" cy="${17 + bodyOffsetY}" r="8.5"
            fill="${capColor}" stroke="${capShadow}" stroke-width="0.8"/>
          <!-- 캡 밝은 레이어 (좌상) -->
          <circle cx="25" cy="${17 + bodyOffsetY}" r="8.5"
            fill="${capHighlight}" opacity="0.25"/>
          <!-- 캡 상단 하이라이트 -->
          <ellipse cx="22" cy="${14 + bodyOffsetY}" rx="3.5" ry="2"
            fill="white" opacity="${this.pressed ? 0.08 : 0.22}"
            transform="rotate(-15,22,${14 + bodyOffsetY})"/>
        </g>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-button': SimButton;
  }
}
