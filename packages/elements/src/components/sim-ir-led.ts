import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-ir-led> — 5mm IR 적외선 LED (40×60px)
 * 실물: 투명 검은 에폭시 렌즈, 켜질 때 희미한 보라/자주색 글로우
 * Pins: CATHODE(-), ANODE(+)
 */
@customElement('sim-ir-led')
export class SimIrLed extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 40px; height: 60px; }`,
  ];

  @property({ type: Boolean, reflect: true }) lit = false;
  @property({ type: Number }) brightness = 255;

  override get componentType() { return 'ir-led'; }
  override get pins() { return ['CATHODE', 'ANODE']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'ANODE') {
      this.lit = v > 0;
      this.brightness = v;
    }
  }

  override getPinPositions() {
    return new Map([
      ['CATHODE', { x: 21, y: 60 }],
      ['ANODE',   { x: 39, y: 60 }],
    ]);
  }

  override render() {
    const normalizedBrightness = this.brightness > 255 ? this.brightness / 1023 : this.brightness / 255;
    const glowOpacity = this.lit ? Math.min(1, normalizedBrightness) : 0;
    // IR LED: 어두운 투명 검은 렌즈, 켜지면 보라/자주색 글로우
    const lensBody    = this.lit ? '#3a1a4a' : '#1a1a2a';
    const lensStroke  = this.lit ? '#9955cc88' : '#33334488';
    const glowColor   = '#9955ff';

    return html`
      <svg width="40" height="60" viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 켜졌을 때 외부 글로우 -->
          <radialGradient id="ir-glow-${this.compId}" cx="50%" cy="40%" r="60%">
            <stop offset="0%"   stop-color="${glowColor}" stop-opacity="${glowOpacity * 0.7}"/>
            <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
          </radialGradient>
          <!-- 렌즈 내부 그라디언트 -->
          <radialGradient id="ir-lens-${this.compId}" cx="38%" cy="32%" r="60%">
            <stop offset="0%"   stop-color="${this.lit ? '#cc99ff' : '#555566'}" stop-opacity="${this.lit ? 0.5 : 0.1}"/>
            <stop offset="60%"  stop-color="${lensBody}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${this.lit ? '#2a0a3a' : '#0d0d1a'}" stop-opacity="1"/>
          </radialGradient>
        </defs>

        <!-- 외부 글로우 (켜졌을 때) -->
        ${this.lit ? svg`
          <ellipse cx="20" cy="16" rx="20" ry="20"
            fill="url(#ir-glow-${this.compId})"/>
        ` : ''}

        <!-- IR 방사 파장선 (켜졌을 때 오른쪽 위로 물결선) -->
        ${this.lit ? svg`
          <g opacity="${glowOpacity * 0.8}" stroke="${glowColor}" stroke-width="0.9" fill="none" stroke-linecap="round">
            <!-- 첫 번째 파장선 -->
            <path d="M 28 8 Q 31 5 34 8 Q 37 11 40 8"/>
            <!-- 두 번째 파장선 (더 위) -->
            <path d="M 28 4 Q 31 1 34 4 Q 37 7 40 4"/>
            <!-- 화살표 -->
            <line x1="33" y1="8" x2="37" y2="4"/>
            <polyline points="36,7 37,4 34,4" fill="${glowColor}"/>
          </g>
        ` : ''}

        <!-- 리드선 (캐소드 왼쪽, 아노드 오른쪽 더 길게) -->
        <line x1="14" y1="34" x2="14" y2="56" stroke="#bbbbbb" stroke-width="1.8"/>
        <line x1="14" y1="34" x2="14" y2="56" stroke="white" stroke-width="0.5" opacity="0.3"/>
        <line x1="26" y1="34" x2="26" y2="58" stroke="#bbbbbb" stroke-width="1.8"/>
        <line x1="26" y1="34" x2="26" y2="58" stroke="white" stroke-width="0.5" opacity="0.3"/>

        <!-- 몸체 원통형 하단부 (플랜지) -->
        <rect x="8" y="22" width="24" height="12" rx="1"
          fill="${this.lit ? '#2a1a3a' : '#1e1e2e'}"
          stroke="${this.lit ? '#9955cc88' : '#33334488'}" stroke-width="0.8"/>
        <rect x="8" y="22" width="24" height="3" rx="1"
          fill="white" opacity="${this.lit ? 0.1 : 0.04}"/>

        <!-- 캐소드 표시 (평평한 쪽) -->
        <rect x="8" y="22" width="4" height="12"
          fill="${this.lit ? '#220a33' : '#111120'}" opacity="0.7"/>
        <line x1="8" y1="22" x2="8" y2="34"
          stroke="${this.lit ? '#9955cc44' : '#33334444'}" stroke-width="0.8"/>

        <!-- 에폭시 렌즈 반구 (검은 불투명) -->
        <ellipse cx="20" cy="22" rx="12" ry="12"
          fill="url(#ir-lens-${this.compId})"
          stroke="${lensStroke}" stroke-width="0.8"/>
        <!-- 렌즈 정반사 하이라이트 -->
        <ellipse cx="14" cy="15" rx="3.5" ry="2"
          fill="white" opacity="${this.lit ? 0.35 : 0.12}"
          transform="rotate(-30,14,15)"/>
        <!-- 내부 다이 -->
        <ellipse cx="20" cy="22" rx="4" ry="3"
          fill="${this.lit ? '#7733aa' : '#1a1a2a'}"
          opacity="${this.lit ? 0.5 : 0.25}"/>

        <!-- IR 라벨 -->
        <rect x="0" y="47" width="40" height="13" fill="#0d0d14"/>
        <line x1="0" y1="47" x2="40" y2="47" stroke="#252535" stroke-width="0.5"/>
        <text x="10" y="57" font-size="7" fill="#9966cc" font-family="monospace"
          text-anchor="middle" font-weight="bold">IR</text>
        <text x="14" y="57" font-size="8" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold"> K−</text>
        <text x="26" y="57" font-size="8" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">A+</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-ir-led': SimIrLed; }
}
