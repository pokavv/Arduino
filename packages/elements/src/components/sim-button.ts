import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-button> — 6mm 택트 스위치 (90×70px)
 *
 * Wokwi wokwi-pushbutton 기준 정밀 재현:
 *   실물 6mm SMD 택트 스위치:
 *   - PCB 면: 크림/베이지색 (#eaeaea)
 *   - 스위치 케이스: 어두운 회색 (#464646)
 *   - 돔형 액추에이터: 컬러 원형 캡
 *   - 4핀: 좌측 2개(PIN1A/1B), 우측 2개(PIN2A/2B)
 *   - 핀 간격: 2.54mm (브레드보드 1칸)
 *
 * Pins: PIN1A(좌상), PIN1B(좌하), PIN2A(우상), PIN2B(우하)
 * host: 90×70px
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

  // host 90×70px (viewBox 90×70)
  // 핀: 좌측(x=0) y=17/44, 우측(x=90) y=17/44
  override getPinPositions() {
    return new Map([
      ['PIN1A', { x:  0, y: 17 }],
      ['PIN1B', { x:  0, y: 44 }],
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
    // 누름 상태에 따른 캡 색상 (눌리면 약간 어두워짐)
    const capBase = this.btnColor;
    const capPressed = capBase.replace(
      /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,
      (_, r, g, b) => `#${Math.max(0, parseInt(r, 16) - 30).toString(16).padStart(2, '0')}${Math.max(0, parseInt(g, 16) - 30).toString(16).padStart(2, '0')}${Math.max(0, parseInt(b, 16) - 30).toString(16).padStart(2, '0')}`
    );
    const capFill = this.pressed ? capPressed : capBase;
    const pressY = this.pressed ? 1.5 : 0;

    // PCB 브레드보드 레이아웃: 핀 두 쌍이 왼/오른쪽으로 나뉘어짐
    // viewBox 90×70 내 배치
    // 센터 바디: x=18~72, y=5~55 (54×50px)

    return html`
      <svg width="90" height="70" viewBox="0 0 90 70" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 캡 광택 그라디언트 -->
          <radialGradient id="cap-grad-${this.compId}" cx="38%" cy="35%" r="60%">
            <stop offset="0%"   stop-color="white"    stop-opacity="${this.pressed ? 0.08 : 0.35}"/>
            <stop offset="50%"  stop-color="${capFill}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${capFill}" stop-opacity="1"/>
          </radialGradient>
          <!-- PCB 그라디언트 -->
          <linearGradient id="pcb-grad-${this.compId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#f0f0e8"/>
            <stop offset="100%" stop-color="#d8d8cc"/>
          </linearGradient>
        </defs>

        <!-- ── 좌측 리드 (PIN1A 상, PIN1B 하) ── -->
        <!-- PIN1A 상단 -->
        <rect x="0"  y="14.5" width="18" height="5" rx="1.5"
          fill="#c0c0c0" stroke="#999" stroke-width="0.4"/>
        <rect x="0"  y="15.5" width="18" height="2" fill="white" opacity="0.35"/>
        <!-- PIN1B 하단 -->
        <rect x="0"  y="41.5" width="18" height="5" rx="1.5"
          fill="#c0c0c0" stroke="#999" stroke-width="0.4"/>
        <rect x="0"  y="42.5" width="18" height="2" fill="white" opacity="0.35"/>

        <!-- ── 우측 리드 (PIN2A 상, PIN2B 하) ── -->
        <!-- PIN2A 상단 -->
        <rect x="72" y="14.5" width="18" height="5" rx="1.5"
          fill="#c0c0c0" stroke="#999" stroke-width="0.4"/>
        <rect x="72" y="15.5" width="18" height="2" fill="white" opacity="0.35"/>
        <!-- PIN2B 하단 -->
        <rect x="72" y="41.5" width="18" height="5" rx="1.5"
          fill="#c0c0c0" stroke="#999" stroke-width="0.4"/>
        <rect x="72" y="42.5" width="18" height="2" fill="white" opacity="0.35"/>

        <!-- ── PCB 기판 (Wokwi: fill=#eaeaea 크림색) ── -->
        <!-- 그림자 -->
        <rect x="19.5" y="6.5" width="51" height="47" rx="2"
          fill="black" opacity="0.2"/>
        <!-- PCB 바디 -->
        <rect x="18" y="5" width="54" height="46" rx="2"
          fill="url(#pcb-grad-${this.compId})" stroke="#c0c0b0" stroke-width="0.6"/>

        <!-- 패드 마크 4개 (납땜 패드 원형) -->
        <circle cx="25" cy="17" r="3.5" fill="#b8a060" stroke="#9a8040" stroke-width="0.4"/>
        <circle cx="25" cy="44" r="3.5" fill="#b8a060" stroke="#9a8040" stroke-width="0.4"/>
        <circle cx="65" cy="17" r="3.5" fill="#b8a060" stroke="#9a8040" stroke-width="0.4"/>
        <circle cx="65" cy="44" r="3.5" fill="#b8a060" stroke="#9a8040" stroke-width="0.4"/>
        <!-- 패드 중앙 홀 -->
        <circle cx="25" cy="17" r="1.4" fill="#111"/>
        <circle cx="25" cy="44" r="1.4" fill="#111"/>
        <circle cx="65" cy="17" r="1.4" fill="#111"/>
        <circle cx="65" cy="44" r="1.4" fill="#111"/>

        <!-- ── 스위치 케이스 (Wokwi: fill=#464646 어두운 회색) ── -->
        <!-- 케이스 그림자 -->
        <rect x="30.5" y="16.5" width="29" height="28" rx="1.5"
          fill="black" opacity="0.4"/>
        <!-- 케이스 바디 -->
        <rect x="29" y="15" width="32" height="27" rx="1.5"
          fill="#464646" stroke="#303030" stroke-width="0.5"/>
        <!-- 케이스 상단 하이라이트 (얇은 면) -->
        <rect x="29" y="15" width="32" height="3" rx="1.5"
          fill="white" opacity="0.06"/>
        <!-- 케이스 내부 몰드 라인 -->
        <rect x="32" y="18" width="26" height="21" rx="0.8"
          fill="none" stroke="#555" stroke-width="0.5"/>

        <!-- ── 돔형 캡 액추에이터 ── -->
        <g class="btn-cap"
           @pointerdown="${this._onPress}"
           @pointerup="${this._onRelease}"
           @pointercancel="${this._onRelease}">
          <!-- 캡 외부 베이스 링 (고무 가이드) -->
          <circle cx="45" cy="${28.5 + pressY}" r="11.5"
            fill="${this.pressed ? '#2a2a2a' : '#333'}"
            stroke="#222" stroke-width="0.4"/>
          <!-- 캡 본체 -->
          <circle cx="45" cy="${28.5 + pressY}" r="10.5"
            fill="url(#cap-grad-${this.compId})"
            stroke="${this.pressed ? '#0004' : '#0002'}" stroke-width="0.6"/>
          <!-- 캡 하이라이트 -->
          <ellipse cx="40.5" cy="${23.5 + pressY}" rx="4.5" ry="2.5"
            fill="white" opacity="${this.pressed ? 0.04 : 0.22}"
            transform="rotate(-25,40.5,${23.5 + pressY})"/>
          <!-- 캡 중앙 미세 반사점 -->
          <circle cx="45" cy="${26.5 + pressY}" r="1.5"
            fill="white" opacity="${this.pressed ? 0.02 : 0.07}"/>
          <!-- 캡 가장자리 하이라이트 링 -->
          <circle cx="45" cy="${28.5 + pressY}" r="10.5"
            fill="none" stroke="white" stroke-width="0.8" opacity="${this.pressed ? 0.04 : 0.10}"/>
        </g>

        <!-- ── 핀 라벨 (실크스크린 스타일) ── -->
        <text x="25" y="62" font-size="5.5" fill="#8899cc" font-family="monospace"
          text-anchor="middle" font-weight="bold">1</text>
        <text x="65" y="62" font-size="5.5" fill="#ccaa55" font-family="monospace"
          text-anchor="middle" font-weight="bold">2</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-button': SimButton; }
}
