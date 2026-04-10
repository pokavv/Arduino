import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';
import type { LedColor } from '../types.js';

// Wokwi lightColor 기준 (켜졌을 때 글로우 색상)
// red→#ff8080, green→#80ff80, blue→#8080ff, yellow→#ffff80, orange→#ffcf80, purple→#ff80ff
const COLOR_MAP: Record<LedColor, { off: string; on: string; glow: string; lens: string }> = {
  red:    { off: '#330000', on: '#ff4040', glow: '#ff8080', lens: '#ff2020' },
  green:  { off: '#002200', on: '#40ff60', glow: '#80ff80', lens: '#20cc40' },
  blue:   { off: '#000033', on: '#6080ff', glow: '#8080ff', lens: '#4060dd' },
  yellow: { off: '#333300', on: '#ffff40', glow: '#ffff80', lens: '#ddcc00' },
  white:  { off: '#333333', on: '#ffffff', glow: '#ffffff', lens: '#dddddd' },
  orange: { off: '#331100', on: '#ffaa40', glow: '#ffcf80', lens: '#ee7700' },
  purple: { off: '#220033', on: '#ee60ff', glow: '#ff80ff', lens: '#cc00ee' },
};

/**
 * <sim-led> — 5mm through-hole LED (60×90px)
 * 실물 기준: 투명(또는 착색) 에폭시 렌즈, 캐소드 쪽 평면 구분, 긴 리드=애노드
 * Pins: ANODE(+), CATHODE(-)
 */
@customElement('sim-led')
export class SimLed extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 60px; height: 90px; }`,
  ];

  @property({ type: String }) color: LedColor = 'red';
  @property({ type: Boolean, reflect: true }) lit = false;
  @property({ type: Number }) brightness = 255;

  override get componentType() { return 'led'; }
  override get pins() { return ['ANODE', 'CATHODE']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'ANODE') {
      this.lit = v > 0;
      this.brightness = v;
    }
  }

  override getPinPositions() {
    return new Map([
      ['CATHODE', { x: 21, y: 90 }],
      ['ANODE',   { x: 39, y: 90 }],
    ]);
  }

  private get _colors() { return COLOR_MAP[this.color] ?? COLOR_MAP.red; }

  override render() {
    const c = this._colors;
    // 8-bit analogWrite(0-255) 또는 10-bit ledcWrite(0-1023) 모두 지원
    const normalizedBrightness = this.brightness > 255 ? this.brightness / 1023 : this.brightness / 255;
    const glowOpacity = this.lit ? Math.min(1, normalizedBrightness) : 0;
    // 켜졌을 때: 렌즈 색(밝음), 꺼졌을 때: 암색
    const lensBody  = this.lit ? c.on   : c.off;
    const lensStroke = this.lit ? '#fff8' : '#5555';

    return html`
      <svg width="60" height="90" viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 켜졌을 때 외부 글로우 -->
          <radialGradient id="led-glow-${this.compId}" cx="50%" cy="40%" r="60%">
            <stop offset="0%"   stop-color="${c.glow}" stop-opacity="${glowOpacity * 0.85}"/>
            <stop offset="100%" stop-color="${c.glow}" stop-opacity="0"/>
          </radialGradient>
          <!-- 렌즈 내부 그라디언트 -->
          <radialGradient id="led-lens-${this.compId}" cx="38%" cy="32%" r="60%">
            <stop offset="0%"   stop-color="${this.lit ? '#ffffff' : '#888888'}" stop-opacity="${this.lit ? 0.6 : 0.15}"/>
            <stop offset="60%"  stop-color="${lensBody}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${this.lit ? c.lens : '#111111'}" stop-opacity="1"/>
          </radialGradient>
        </defs>

        <!-- 외부 글로우 (켜졌을 때) -->
        ${this.lit ? svg`
          <ellipse cx="20" cy="16" rx="20" ry="20"
            fill="url(#led-glow-${this.compId})"/>
        ` : ''}

        <!-- ── 실물 5mm LED 구조 ── -->

        <!-- 리드선 금속 (캐소드=짧은 리드 왼쪽, 아노드=긴 리드 오른쪽) — 몸체 아래에서 나옴 -->
        <!-- 캐소드 (-) 리드 — 왼쪽(평면 쪽), 약간 짧다 -->
        <line x1="14" y1="34" x2="14" y2="56" stroke="#bbbbbb" stroke-width="1.8"/>
        <line x1="14" y1="34" x2="14" y2="56" stroke="white" stroke-width="0.5" opacity="0.3"/>
        <!-- 아노드 (+) 리드 — 오른쪽, 더 길다 -->
        <line x1="26" y1="34" x2="26" y2="58" stroke="#bbbbbb" stroke-width="1.8"/>
        <line x1="26" y1="34" x2="26" y2="58" stroke="white" stroke-width="0.5" opacity="0.3"/>

        <!-- 몸체 원통형 하단부 (플랜지) -->
        <rect x="8" y="22" width="24" height="12" rx="1"
          fill="${this.lit ? c.lens : '#222222'}"
          stroke="${this.lit ? c.glow + '88' : '#444444'}" stroke-width="0.8"/>
        <!-- 플랜지 하이라이트 -->
        <rect x="8" y="22" width="24" height="3" rx="1"
          fill="white" opacity="${this.lit ? 0.15 : 0.06}"/>

        <!-- 캐소드 표시 — 평평한 쪽 (실물: 몸체 한쪽이 평평함) -->
        <rect x="8" y="22" width="4" height="12"
          fill="${this.lit ? c.lens : '#1a1a1a'}" opacity="0.6"/>
        <line x1="8" y1="22" x2="8" y2="34"
          stroke="${this.lit ? '#fff6' : '#5556'}" stroke-width="0.8"/>

        <!-- 에폭시 렌즈 반구 (실물: 반구형 돔) -->
        <ellipse cx="20" cy="22" rx="12" ry="12"
          fill="url(#led-lens-${this.compId})"
          stroke="${lensStroke}" stroke-width="0.8"/>
        <!-- 렌즈 정반사 하이라이트 -->
        <ellipse cx="14" cy="15" rx="3.5" ry="2"
          fill="white" opacity="${this.lit ? 0.5 : 0.18}"
          transform="rotate(-30,14,15)"/>
        <!-- 내부 다이 (발광부) — 실물: 렌즈 안에 작은 칩이 보임 -->
        <ellipse cx="20" cy="22" rx="4" ry="3"
          fill="${this.lit ? '#ffffff' : c.off}"
          opacity="${this.lit ? 0.6 : 0.3}"/>

        <!-- 핀 라벨 존 -->
        <rect x="0" y="47" width="40" height="13" fill="#0d0d14"/>
        <line x1="0" y1="47" x2="40" y2="47" stroke="#252535" stroke-width="0.5"/>
        <text x="14" y="57" font-size="8" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">K−</text>
        <text x="26" y="57" font-size="8" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">A+</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-led': SimLed; }
}
