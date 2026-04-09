import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-dc-motor> — DC 소형 모터 (원통형 금속 케이스, 76×121px)
 *
 * 실물 기준:
 *   - 몸체: 은색/회색 금속 원통 케이스
 *   - 상단 엔드캡: 파란색 플라스틱 (모터 축 측)
 *   - 하단 엔드캡: 파란색 플라스틱 (단자 측)
 *   - 모터 축: 회색 금속 돌출부 (상단)
 *   - 회전 시각화: speed에 따라 SVG 애니메이션
 *   - 단자: M+(빨강), M-(검정) — 하단
 *
 * Pins: M+(x=25, y=121), M-(x=51, y=121)
 */
@customElement('sim-dc-motor')
export class SimDcMotor extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 76px; height: 121px; }

      /* 회전 속도별 애니메이션 클래스 */
      @keyframes spin-slow   { from { transform: rotate(0deg); }  to { transform: rotate(360deg); } }
      @keyframes spin-med    { from { transform: rotate(0deg); }  to { transform: rotate(360deg); } }
      @keyframes spin-fast   { from { transform: rotate(0deg); }  to { transform: rotate(360deg); } }
      @keyframes spin-rev    { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }

      .shaft-indicator {
        transform-origin: 10px 10px;
        transform-box: fill-box;
      }
      .spin-slow   { animation: spin-slow  2.0s linear infinite; }
      .spin-med    { animation: spin-med   0.8s linear infinite; }
      .spin-fast   { animation: spin-fast  0.3s linear infinite; }
      .spin-rev    { animation: spin-rev   0.5s linear infinite; }
    `,
  ];

  /**
   * 모터 속도: -255 ~ 255
   * 양수: 정방향, 음수: 역방향, 0: 정지
   */
  @property({ type: Number }) speed = 0;

  override get componentType() { return 'dc-motor'; }
  override get pins() { return ['M+', 'M-']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'M+') {
      this.speed = Math.max(-255, Math.min(255, Math.round(v)));
    }
  }

  override getPinPositions() {
    return new Map([
      ['M+', { x: 25, y: 121 }],
      ['M-', { x: 51, y: 121 }],
    ]);
  }

  /** 속도값에서 CSS 애니메이션 클래스 결정 */
  private _spinClass(): string {
    const abs = Math.abs(this.speed);
    if (abs === 0)   return '';
    if (this.speed < 0) return 'spin-rev';
    if (abs < 80)   return 'spin-slow';
    if (abs < 180)  return 'spin-med';
    return 'spin-fast';
  }

  /** 속도에 따른 속도계 막대 너비 비율 (0~1) */
  private _speedRatio(): number {
    return Math.abs(this.speed) / 255;
  }

  override render() {
    // viewBox 0 0 20 32 (mm), host 76×121px (scale 3.8px/mm)
    const spinClass  = this._spinClass();
    const ratio      = this._speedRatio();
    const isRunning  = this.speed !== 0;
    const isReverse  = this.speed < 0;
    const absSpeed   = Math.abs(this.speed);

    // 회전 시각화 색상
    const spinColor = isReverse ? '#4488ff' : '#ff4422';

    return html`
      <svg width="76" height="121" viewBox="0 0 20 32"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 금속 원통 몸체 그라디언트 (측면 광택) -->
          <linearGradient id="motor-body-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#666"/>
            <stop offset="12%"  stop-color="#b0b0b0"/>
            <stop offset="30%"  stop-color="#d8d8d8"/>
            <stop offset="55%"  stop-color="#c8c8c8"/>
            <stop offset="80%"  stop-color="#a8a8a8"/>
            <stop offset="100%" stop-color="#555"/>
          </linearGradient>
          <!-- 파란 엔드캡 그라디언트 -->
          <linearGradient id="motor-cap-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#1a4488"/>
            <stop offset="40%"  stop-color="#2255aa"/>
            <stop offset="100%" stop-color="#1a3366"/>
          </linearGradient>
          <!-- 모터 축 그라디언트 -->
          <linearGradient id="motor-shaft-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#777"/>
            <stop offset="50%"  stop-color="#cccccc"/>
            <stop offset="100%" stop-color="#777"/>
          </linearGradient>
          <!-- 단자 그라디언트 -->
          <linearGradient id="motor-term-${this.compId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#444"/>
            <stop offset="100%" stop-color="#222"/>
          </linearGradient>
        </defs>

        <!-- ─── 모터 축 (상단 돌출, 회전 인디케이터 포함) ─── -->
        <!-- 축 베이스 (금속 플랜지) -->
        <ellipse cx="10" cy="4.5" rx="2.5" ry="0.6"
          fill="#888" stroke="#555" stroke-width="0.2"/>
        <!-- 축 원통 -->
        <rect x="8.8" y="1.5" width="2.4" height="3.2"
          fill="url(#motor-shaft-${this.compId})"
          stroke="#555" stroke-width="0.2"/>
        <!-- 축 상단 캡 -->
        <ellipse cx="10" cy="1.5" rx="1.2" ry="0.35"
          fill="#bbbbbb"/>

        <!-- 축 평면 표시 (D-shaft flat) -->
        <rect x="9.55" y="1.5" width="0.9" height="3.0"
          fill="#aaaaaa" opacity="0.4"/>

        <!-- 회전 시각화 (속도계 원형 인디케이터) — 축 주변 -->
        ${isRunning ? html`
          <g class="shaft-indicator ${spinClass}"
             style="transform-origin: 10px 3px; transform-box: fill-box;">
            <!-- 회전 아크 (1/4 원호 인디케이터) -->
            <path d="M 10 1.0 A 2.5 2.5 0 0 1 12.5 3.5"
              stroke="${spinColor}" stroke-width="0.45" fill="none"
              stroke-linecap="round" opacity="0.85"/>
            <path d="M 7.5 3.5 A 2.5 2.5 0 0 1 10 1.0"
              stroke="${spinColor}" stroke-width="0.45" fill="none"
              stroke-linecap="round" opacity="0.5"/>
            <!-- 회전 화살표 마커 -->
            <circle cx="12.4" cy="3.3" r="0.4" fill="${spinColor}" opacity="0.85"/>
          </g>
        ` : ''}

        <!-- ─── 상단 엔드캡 (파란 플라스틱) ─── -->
        <rect x="2.5" y="4.5" width="15" height="2.5" rx="0.4"
          fill="url(#motor-cap-${this.compId})"
          stroke="#112244" stroke-width="0.25"/>
        <rect x="2.7" y="4.6" width="14.6" height="0.7" rx="0.3"
          fill="white" opacity="0.08"/>
        <!-- 캡 나사 구멍 2개 -->
        <circle cx="4.5" cy="5.75" r="0.55"
          fill="#0d1a33" stroke="#1a3366" stroke-width="0.15"/>
        <circle cx="15.5" cy="5.75" r="0.55"
          fill="#0d1a33" stroke="#1a3366" stroke-width="0.15"/>

        <!-- ─── 금속 원통 몸체 ─── -->
        <rect x="2.5" y="7.0" width="15" height="16" rx="0.3"
          fill="url(#motor-body-${this.compId})"
          stroke="#444" stroke-width="0.25"/>
        <!-- 몸체 상단 에지 하이라이트 -->
        <rect x="2.5" y="7.0" width="15" height="0.7"
          fill="white" opacity="0.12"/>
        <!-- 금속 이음새 라인 (원통 접합부) -->
        <line x1="2.5" y1="15.0" x2="17.5" y2="15.0"
          stroke="#888" stroke-width="0.15" opacity="0.4"/>
        <!-- 실크스크린 라벨 -->
        <text x="10.0" y="12.5" font-size="1.6" fill="#333333"
          font-family="monospace" text-anchor="middle"
          font-weight="bold" opacity="0.6"
          transform="rotate(-90, 10.0, 12.5)">DC MOTOR</text>

        <!-- ─── 하단 엔드캡 (파란 플라스틱, 단자 측) ─── -->
        <rect x="2.5" y="23.0" width="15" height="2.5" rx="0.4"
          fill="url(#motor-cap-${this.compId})"
          stroke="#112244" stroke-width="0.25"/>
        <!-- 캡 나사 구멍 2개 -->
        <circle cx="4.5" cy="24.25" r="0.55"
          fill="#0d1a33" stroke="#1a3366" stroke-width="0.15"/>
        <circle cx="15.5" cy="24.25" r="0.55"
          fill="#0d1a33" stroke="#1a3366" stroke-width="0.15"/>
        <!-- 캡 하단 에지 -->
        <rect x="2.7" y="25.0" width="14.6" height="0.4"
          fill="#112244" opacity="0.5"/>

        <!-- ─── 단자 블록 (하단) ─── -->
        <rect x="4.5" y="25.5" width="11" height="2.5" rx="0.4"
          fill="url(#motor-term-${this.compId})"
          stroke="#111" stroke-width="0.25"/>
        <!-- M+ 단자 (빨강 표시) -->
        <rect x="5.0" y="26.0" width="4.0" height="1.5" rx="0.3"
          fill="#1a1a1a" stroke="#333" stroke-width="0.15"/>
        <circle cx="7.0" cy="26.75" r="0.6"
          fill="#cc2200" stroke="#880000" stroke-width="0.2"/>
        <!-- M- 단자 (검정/은색 표시) -->
        <rect x="11.0" y="26.0" width="4.0" height="1.5" rx="0.3"
          fill="#1a1a1a" stroke="#333" stroke-width="0.15"/>
        <circle cx="13.0" cy="26.75" r="0.6"
          fill="#888" stroke="#555" stroke-width="0.2"/>

        <!-- ─── 리드선 (단자에서 하단으로) ─── -->
        <!-- M+ 리드 (빨간색) -->
        <rect x="6.6" y="28.0" width="0.8" height="4.0"
          fill="#cc2200" stroke="#880000" stroke-width="0.15" rx="0.2"/>
        <line x1="7.0" y1="28.0" x2="7.0" y2="32"
          stroke="#ff5533" stroke-width="0.25" opacity="0.4"/>
        <!-- M- 리드 (검정) -->
        <rect x="12.6" y="28.0" width="0.8" height="4.0"
          fill="#1a1a1a" stroke="#333" stroke-width="0.15" rx="0.2"/>
        <line x1="13.0" y1="28.0" x2="13.0" y2="32"
          stroke="#555" stroke-width="0.25" opacity="0.4"/>

        <!-- ─── 속도 HUD (상단 미니 바) ─── -->
        <rect x="2.5" y="0.3" width="15" height="1.0" rx="0.4"
          fill="#0d1a0d"/>
        <!-- 속도 바 배경 -->
        <rect x="2.7" y="0.4" width="14.6" height="0.8" rx="0.3"
          fill="#111"/>
        <!-- 속도 바 (비율로 채우기) -->
        ${ratio > 0 ? html`
          <rect x="2.7" y="0.4"
            width="${14.6 * ratio}" height="0.8" rx="0.3"
            fill="${isReverse ? '#2244bb' : '#bb3311'}" opacity="0.8"/>
        ` : ''}
        <!-- 속도 수치 텍스트 -->
        <text x="10.0" y="1.15" font-size="0.72" fill="#88aaff"
          font-family="monospace" text-anchor="middle">
          ${isReverse ? '←' : '→'} ${absSpeed}
        </text>

        <!-- ─── 핀 라벨 존 (하단) ─── -->
        <rect x="0" y="29.2" width="20" height="2.8" fill="#0d0d14"/>
        <line x1="0" y1="29.2" x2="20" y2="29.2" stroke="#252535" stroke-width="0.35"/>
        <text x="7.0" y="31.4" font-size="1.4" fill="#ff8877"
          font-family="monospace" text-anchor="middle" font-weight="bold">M+</text>
        <text x="13.0" y="31.4" font-size="1.4" fill="#88aaff"
          font-family="monospace" text-anchor="middle" font-weight="bold">M−</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-dc-motor': SimDcMotor; }
}
