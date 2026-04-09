import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-button> — 12mm 택트 스위치 (75×80px)
 *
 * 실물 기준:
 *   - 정사각형 검은 플라스틱 바디 (~12×12mm)
 *   - 4개 리드선 모두 아래로 (2쌍: 왼쪽 1A/1B, 오른쪽 2A/2B, 각 쌍 내부 연결)
 *   - 위에서 누르는 컬러 돔 캡
 *
 * Pins: PIN1A, PIN1B, PIN2A, PIN2B
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
  @property({ type: String }) btnColor = '#cc3333';

  override get componentType() { return 'button'; }
  override get pins() { return ['PIN1A', 'PIN1B', 'PIN2A', 'PIN2B']; }
  override setPinState(_pin: string, _value: number | string) {}

  // getPinPositions: viewBox(50×53) × 1.5 = host(75×80)
  // 4핀 모두 하단, viewBox x = 11,18,32,39 → ×1.5 = 16.5,27,48,58.5
  override getPinPositions() {
    return new Map([
      ['PIN1A', { x: 17, y: 80 }],
      ['PIN1B', { x: 27, y: 80 }],
      ['PIN2A', { x: 48, y: 80 }],
      ['PIN2B', { x: 59, y: 80 }],
    ]);
  }

  getPinValue(pin: string): number {
    return (pin === 'PIN1A' || pin === 'PIN1B') ? (this.pressed ? 1 : 0) : 0;
  }

  private _onPress(e: PointerEvent) {
    e.stopPropagation();
    this.pressed = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('sim-press', { bubbles: true, composed: true }));
  }

  private _onRelease(e: PointerEvent) {
    e.stopPropagation();
    this.pressed = false;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-release', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
  }

  override render() {
    const pressY = this.pressed ? 1 : 0;
    const capFill = this.pressed
      ? (this.btnColor === '#cc3333' ? '#aa2222' : '#1a44cc')
      : this.btnColor;

    return html`
      <svg width="75" height="80" viewBox="0 0 50 53" xmlns="http://www.w3.org/2000/svg">

        <!-- ── 리드선 4개 — 실물 12mm 택트 스위치, 모두 아래로 ── -->
        <!-- 좌측 쌍 (1A, 1B) — 내부 연결 -->
        <rect x="9.5"  y="26" width="2.5" height="14" rx="0.5" fill="#cccccc"/>
        <rect x="10"   y="26" width="1"   height="14" fill="white" opacity="0.3"/>
        <rect x="16.5" y="26" width="2.5" height="14" rx="0.5" fill="#cccccc"/>
        <rect x="17"   y="26" width="1"   height="14" fill="white" opacity="0.3"/>
        <!-- 우측 쌍 (2A, 2B) — 내부 연결 -->
        <rect x="30.5" y="26" width="2.5" height="14" rx="0.5" fill="#cccccc"/>
        <rect x="31"   y="26" width="1"   height="14" fill="white" opacity="0.3"/>
        <rect x="37.5" y="26" width="2.5" height="14" rx="0.5" fill="#cccccc"/>
        <rect x="38"   y="26" width="1"   height="14" fill="white" opacity="0.3"/>

        <!-- ── 정사각형 검은 바디 ── -->
        <!-- 바디 그림자 -->
        <rect x="6" y="5.5" width="38" height="22" rx="1.5" fill="black" opacity="0.3"/>
        <!-- 바디 본체 -->
        <rect x="5" y="4" width="40" height="22" rx="1.5"
          fill="#141414" stroke="#303030" stroke-width="0.8"/>
        <!-- 상단 하이라이트 -->
        <rect x="5" y="4" width="40" height="4" rx="1.5"
          fill="white" opacity="0.05"/>
        <!-- 내부 플라스틱 구조 (바디 안쪽의 약간 밝은 테두리) -->
        <rect x="8" y="7" width="34" height="16" rx="0.8"
          fill="none" stroke="#252525" stroke-width="0.6"/>
        <!-- 측면 가이드 홈 (실물의 리드선 위치 표시) -->
        <rect x="5"  y="11" width="4" height="8" rx="0.5" fill="#1a1a1a"/>
        <rect x="41" y="11" width="4" height="8" rx="0.5" fill="#1a1a1a"/>

        <!-- ── 버튼 캡 — 클릭 영역 ── -->
        <g class="btn-cap"
           @pointerdown="${this._onPress}"
           @pointerup="${this._onRelease}"
           @pointercancel="${this._onRelease}">
          <!-- 캡 그림자 (눌렸을 때 줄어듦) -->
          <circle cx="25" cy="${16 + pressY + 1.5}" r="9"
            fill="black" opacity="${this.pressed ? 0.15 : 0.35}"/>
          <!-- 캡 본체 -->
          <circle cx="25" cy="${16 + pressY}" r="8.5"
            fill="${capFill}"
            stroke="${this.pressed ? '#0008' : '#0006'}" stroke-width="0.8"/>
          <!-- 캡 측면 링 (실물의 캡 테두리) -->
          <circle cx="25" cy="${16 + pressY}" r="8.5"
            fill="none" stroke="${this.pressed ? '#0004' : '#fff2'}" stroke-width="1.2"/>
          <!-- 캡 하이라이트 (정반사) -->
          <ellipse cx="21.5" cy="${11.5 + pressY}" rx="3.5" ry="2"
            fill="white" opacity="${this.pressed ? 0.06 : 0.3}"
            transform="rotate(-20,21.5,${11.5 + pressY})"/>
        </g>

        <!-- ── 핀 라벨 존 ── -->
        <rect x="0" y="40" width="50" height="13" fill="#0d0d14"/>
        <line x1="0" y1="40" x2="50" y2="40" stroke="#252535" stroke-width="0.5"/>

        <text x="11" y="49" font-size="6.5" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">1A</text>
        <text x="18" y="49" font-size="6.5" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">1B</text>
        <text x="32" y="49" font-size="6.5" fill="#ffcc55" font-family="monospace"
          text-anchor="middle" font-weight="bold">2A</text>
        <text x="39" y="49" font-size="6.5" fill="#ffcc55" font-family="monospace"
          text-anchor="middle" font-weight="bold">2B</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-button': SimButton; }
}
