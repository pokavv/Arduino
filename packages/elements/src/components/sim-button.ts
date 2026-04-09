import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-button> — 12mm 택트 스위치 (90×70px)
 *
 * 실물 기준 (12mm tactile switch):
 *   - 정사각형 검은 플라스틱 바디 (~12×12mm)
 *   - 4개 리드선이 바디 좌/우 측면으로 돌출
 *   - 왼쪽: PIN1A(상단), PIN1B(하단) — 내부 연결
 *   - 오른쪽: PIN2A(상단), PIN2B(하단) — 내부 연결
 *   - 위에서 누르는 컬러 돔 캡 (바디의 ~70% 너비)
 *
 * Pins: PIN1A, PIN1B, PIN2A, PIN2B
 */
@customElement('sim-button')
export class SimButton extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 90px; height: 70px; }
      .btn-cap { cursor: pointer; }
    `,
  ];

  @property({ type: Boolean, reflect: true }) pressed = false;
  @property({ type: String }) btnColor = '#cc3333';

  override get componentType() { return 'button'; }
  override get pins() { return ['PIN1A', 'PIN1B', 'PIN2A', 'PIN2B']; }
  override setPinState(_pin: string, _value: number | string) {}

  // host 90×70px (1:1 SVG)
  // 핀: 좌측(x=0) y=17/44, 우측(x=90) y=17/44
  override getPinPositions() {
    return new Map([
      ['PIN1A', { x: 0,  y: 17 }],
      ['PIN1B', { x: 0,  y: 44 }],
      ['PIN2A', { x: 90, y: 17 }],
      ['PIN2B', { x: 90, y: 44 }],
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
    const pressY = this.pressed ? 1.5 : 0;
    const capFill = this.pressed
      ? (this.btnColor === '#cc3333' ? '#aa1e1e' : '#1a3eaa')
      : this.btnColor;
    const capShadowOpacity = this.pressed ? 0.12 : 0.32;

    return html`
      <svg width="90" height="70" viewBox="0 0 90 70" xmlns="http://www.w3.org/2000/svg">

        <!-- ── 좌측 리드선 (PIN1A 상단, PIN1B 하단) ── -->
        <!-- PIN1A -->
        <rect x="0"  y="14.5" width="20" height="3"   rx="0.8" fill="#bbbbbb"/>
        <rect x="0"  y="15"   width="20" height="1.2" fill="white" opacity="0.3"/>
        <!-- 핀 단자 (납땜 포인트) -->
        <rect x="0"  y="13.5" width="2"  height="5"   rx="0.5" fill="#999"/>
        <!-- PIN1B -->
        <rect x="0"  y="41.5" width="20" height="3"   rx="0.8" fill="#bbbbbb"/>
        <rect x="0"  y="42"   width="20" height="1.2" fill="white" opacity="0.3"/>
        <rect x="0"  y="40.5" width="2"  height="5"   rx="0.5" fill="#999"/>

        <!-- ── 우측 리드선 (PIN2A 상단, PIN2B 하단) ── -->
        <!-- PIN2A -->
        <rect x="70" y="14.5" width="20" height="3"   rx="0.8" fill="#bbbbbb"/>
        <rect x="70" y="15"   width="20" height="1.2" fill="white" opacity="0.3"/>
        <rect x="88" y="13.5" width="2"  height="5"   rx="0.5" fill="#999"/>
        <!-- PIN2B -->
        <rect x="70" y="41.5" width="20" height="3"   rx="0.8" fill="#bbbbbb"/>
        <rect x="70" y="42"   width="20" height="1.2" fill="white" opacity="0.3"/>
        <rect x="88" y="40.5" width="2"  height="5"   rx="0.5" fill="#999"/>

        <!-- ── 바디 그림자 ── -->
        <rect x="21.5" y="6.5" width="47" height="47" rx="2"
          fill="black" opacity="0.25"/>

        <!-- ── 정사각형 검은 바디 (12mm × 12mm) ── -->
        <rect x="20" y="5" width="50" height="50" rx="2"
          fill="#181818" stroke="#2e2e2e" stroke-width="0.8"/>
        <!-- 바디 상단 미묘한 하이라이트 -->
        <rect x="20" y="5" width="50" height="5" rx="2"
          fill="white" opacity="0.04"/>
        <!-- 바디 내부 테두리 (플라스틱 몰드 라인) -->
        <rect x="23" y="8" width="44" height="44" rx="1.2"
          fill="none" stroke="#252525" stroke-width="0.8"/>

        <!-- 측면 가이드 (핀 위치 표시 노치) -->
        <rect x="20" y="12" width="4" height="4" rx="0.5" fill="#222"/>
        <rect x="20" y="40" width="4" height="4" rx="0.5" fill="#222"/>
        <rect x="66" y="12" width="4" height="4" rx="0.5" fill="#222"/>
        <rect x="66" y="40" width="4" height="4" rx="0.5" fill="#222"/>

        <!-- ── 돔 캡 — 클릭 영역 ── -->
        <g class="btn-cap"
           @pointerdown="${this._onPress}"
           @pointerup="${this._onRelease}"
           @pointercancel="${this._onRelease}">
          <!-- 캡 외부 링 (고무 베이스) -->
          <circle cx="45" cy="${30 + pressY}" r="16"
            fill="${this.pressed ? '#1a1a1a' : '#111'}"
            stroke="#333" stroke-width="0.6"/>
          <!-- 캡 그림자 -->
          <circle cx="45" cy="${30 + pressY + 2}" r="13"
            fill="black" opacity="${capShadowOpacity}"/>
          <!-- 캡 본체 (돔) -->
          <circle cx="45" cy="${30 + pressY}" r="13.5"
            fill="${capFill}"
            stroke="${this.pressed ? '#0009' : '#0006'}" stroke-width="0.8"/>
          <!-- 캡 측면 테두리 링 -->
          <circle cx="45" cy="${30 + pressY}" r="13.5"
            fill="none" stroke="${this.pressed ? '#0003' : '#fff2'}" stroke-width="1.5"/>
          <!-- 캡 상단 하이라이트 (정반사) -->
          <ellipse cx="40" cy="${24 + pressY}" rx="5" ry="3"
            fill="white" opacity="${this.pressed ? 0.05 : 0.28}"
            transform="rotate(-20,40,${24 + pressY})"/>
          <!-- 캡 중앙 미세 반사 -->
          <circle cx="45" cy="${27 + pressY}" r="2"
            fill="white" opacity="${this.pressed ? 0.02 : 0.08}"/>
        </g>

        <!-- ── 핀 라벨 ── -->
        <text x="10" y="65" font-size="6" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">1A</text>
        <text x="10" y="44" font-size="4.5" fill="#6688cc" font-family="monospace"
          text-anchor="middle">1B</text>
        <text x="80" y="22" font-size="6" fill="#ffcc55" font-family="monospace"
          text-anchor="middle" font-weight="bold">2A</text>
        <text x="80" y="44" font-size="4.5" fill="#ccaa44" font-family="monospace"
          text-anchor="middle">2B</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-button': SimButton; }
}
