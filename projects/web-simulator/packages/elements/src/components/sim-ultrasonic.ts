import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-ultrasonic> — HC-SR04 초음파 센서 (102×120px)
 * Pins: VCC, TRIG, ECHO, GND
 * 인터랙션: DIST [−][+] 버튼으로 거리 조정 (2~400cm)
 */
@customElement('sim-ultrasonic')
export class SimUltrasonic extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 102px; height: 120px; }
      .ctrl-btn { cursor: pointer; }
    `,
  ];

  @property({ type: Number }) distanceCm = 20;
  @property({ type: Boolean }) trigActive = false;

  override get componentType() { return 'ultrasonic'; }
  override get pins() { return ['VCC', 'TRIG', 'ECHO', 'GND']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'DIST' || pin === 'distanceCm') {
      this.distanceCm = Math.max(2, Math.min(400, v));
    } else if (pin === 'TRIG') {
      this.trigActive = v > 0;
    }
  }

  // getPinPositions: viewBox(68×80) × 1.5 = host(102×120)
  // VCC x=9×1.5=13.5≈14, TRIG x=25×1.5=37.5≈38
  // ECHO x=43×1.5=64.5≈65, GND x=59×1.5=88.5≈89
  override getPinPositions() {
    return new Map([
      ['VCC',  { x: 14, y: 120 }],
      ['TRIG', { x: 38, y: 120 }],
      ['ECHO', { x: 65, y: 120 }],
      ['GND',  { x: 89, y: 120 }],
    ]);
  }

  private _stepDist(e: PointerEvent, delta: number) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    this.distanceCm = Math.max(2, Math.min(400, Math.round(this.distanceCm + delta)));
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('sim-change', {
      bubbles: true, composed: true,
      detail: { distanceCm: this.distanceCm },
    }));
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
    }, 60);
  }

  private _transducer(cx: number, cy: number, active: boolean, id: string) {
    // Wokwi 기준 레이어 구조:
    // 외곽 #dcdcdc → 검정 #222 → 회색 #777 → 방사형 그라디언트 → 체커보드 오버레이
    return html`
      <!-- 외곽 실버링 -->
      <circle cx="${cx}" cy="${cy}" r="12" fill="#dcdcdc" stroke="#bbb" stroke-width="0.5"/>
      <!-- 검정 내부 -->
      <circle cx="${cx}" cy="${cy}" r="10.5" fill="#222"/>
      <!-- 회색 원 -->
      <circle cx="${cx}" cy="${cy}" r="8.0" fill="#777"/>
      <!-- 방사형 그라디언트 (중심 밝음→외곽 어두움) -->
      <radialGradient id="sg-grad-${id}" cx="${cx}" cy="${cy}" r="5.5"
        gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stop-color="#b9b9b9"/>
        <stop offset="100%" stop-color="#777777"/>
      </radialGradient>
      <circle cx="${cx}" cy="${cy}" r="5.5" fill="url(#sg-grad-${id})"/>
      <!-- 체커보드 메쉬 클리핑 오버레이 (Wokwi checkerboard pattern) -->
      <clipPath id="clip-${id}">
        <circle cx="${cx}" cy="${cy}" r="8.0"/>
      </clipPath>
      <pattern id="checker-${id}" patternUnits="userSpaceOnUse" width="3" height="3">
        <rect x="0" y="0" width="1.5" height="1.5" fill="black"/>
        <rect x="1.5" y="1.5" width="1.5" height="1.5" fill="black"/>
      </pattern>
      <circle cx="${cx}" cy="${cy}" r="8.0"
        fill="url(#checker-${id})" opacity="0.4" clip-path="url(#clip-${id})"/>
      <!-- 중앙 포인트 -->
      <circle cx="${cx}" cy="${cy}" r="0.5" fill="#777"/>
      <!-- 하이라이트 -->
      <ellipse cx="${cx - 3}" cy="${cy - 4}" rx="2.5" ry="1.5"
        fill="white" opacity="0.12" transform="rotate(-20,${cx - 3},${cy - 4})"/>
      ${active ? html`
        <circle cx="${cx}" cy="${cy}" r="13.5" fill="none"
          stroke="#44ff44" stroke-width="0.8" opacity="0.5"/>
        <circle cx="${cx}" cy="${cy}" r="16" fill="none"
          stroke="#44ff44" stroke-width="0.5" opacity="0.3"/>
      ` : ''}
    `;
  }

  override render() {
    return html`
      <svg width="102" height="120" viewBox="0 0 68 80" xmlns="http://www.w3.org/2000/svg">

        <!-- 파란색 PCB (실물 HC-SR04 기준) -->
        <rect x="0" y="0" width="68" height="40" rx="4"
          fill="#456f93" stroke="#2a5070" stroke-width="1"/>
        <rect x="0" y="0" width="68" height="5" rx="3" fill="white" opacity="0.08"/>
        <rect x="0" y="32" width="68" height="8" fill="#0d2840" opacity="0.35"/>

        <!-- 구리 패드 -->
        ${[9, 25, 43, 59].map(x => html`
          <rect x="${x - 3}" y="33" width="6" height="5" rx="1" fill="#c08030" opacity="0.75"/>
        `)}

        <!-- 라벨 (실물: 흰색 실크스크린 텍스트) -->
        <text x="34" y="11" font-size="6.5" fill="#ccd8ff" font-family="monospace"
          text-anchor="middle" font-weight="bold">HC-SR04</text>

        <!-- 트랜스듀서 (T / R) — Wokwi: cx=8.98/36.10 mm → 스케일×(68/45)≈1.51 -->
        ${this._transducer(14, 20, this.trigActive, 't')}
        <text x="14" y="35" font-size="5.5" fill="#e6e6e6" font-family="monospace"
          text-anchor="middle">T</text>
        ${this._transducer(55, 20, false, 'r')}
        <text x="55" y="35" font-size="5.5" fill="#e6e6e6" font-family="monospace"
          text-anchor="middle">R</text>

        <!-- ── 인터랙티브 컨트롤 존 ── -->
        <rect x="0" y="40" width="68" height="22" fill="#0c1420"/>
        <line x1="0" y1="40" x2="68" y2="40" stroke="#2a4a70" stroke-width="0.5"/>

        <!-- 거리 라벨 -->
        <text x="3" y="54" font-size="5" fill="#6688aa" font-family="monospace"
          font-weight="bold">D</text>

        <!-- 거리 − 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._stepDist(e, -1)}">
          <rect x="9" y="44" width="12" height="8" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.8"/>
          <text x="15" y="51" font-size="8" fill="#66aadd" font-family="monospace"
            text-anchor="middle">−</text>
        </g>

        <!-- 거리 값 -->
        <text x="39" y="52" font-size="5.5" fill="#d8eeff" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.distanceCm}cm</text>

        <!-- 거리 + 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._stepDist(e, +1)}">
          <rect x="55" y="44" width="12" height="8" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.8"/>
          <text x="61" y="51" font-size="8" fill="#66aadd" font-family="monospace"
            text-anchor="middle">+</text>
        </g>

        <!-- 핀 금속 — VCC=빨강, TRIG=주황, ECHO=파랑, GND=회색 -->
        <rect x="7.5"  y="62" width="3" height="18" rx="0.5" fill="#cc4433"/>
        <rect x="8.2"  y="62" width="1.2" height="18" fill="white" opacity="0.25"/>
        <rect x="23.5" y="62" width="3" height="18" rx="0.5" fill="#cc8800"/>
        <rect x="24.2" y="62" width="1.2" height="18" fill="white" opacity="0.25"/>
        <rect x="41.5" y="62" width="3" height="18" rx="0.5" fill="#4477cc"/>
        <rect x="42.2" y="62" width="1.2" height="18" fill="white" opacity="0.25"/>
        <rect x="57.5" y="62" width="3" height="18" rx="0.5" fill="#666666"/>
        <rect x="58.2" y="62" width="1.2" height="18" fill="white" opacity="0.2"/>

        <!-- 핀 라벨 존 -->
        <rect x="0" y="69" width="68" height="11" fill="#0d0d14"/>
        <line x1="0" y1="69" x2="68" y2="69" stroke="#252535" stroke-width="0.5"/>

        <text x="9"  y="78" font-size="7" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">VCC</text>
        <text x="25" y="78" font-size="7" fill="#ffcc55" font-family="monospace"
          text-anchor="middle" font-weight="bold">TRG</text>
        <text x="43" y="78" font-size="7" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">ECH</text>
        <text x="59" y="78" font-size="7" fill="#88ee99" font-family="monospace"
          text-anchor="middle" font-weight="bold">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-ultrasonic': SimUltrasonic; }
}
