import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';
import type { LedColor } from '../types.js';

const COLOR_MAP: Record<LedColor, { off: string; on: string; glow: string }> = {
  red:    { off: '#5a0000', on: '#ff2020', glow: '#ff0000' },
  green:  { off: '#004400', on: '#20ff50', glow: '#00ff44' },
  blue:   { off: '#000055', on: '#4080ff', glow: '#2060ff' },
  yellow: { off: '#555500', on: '#ffee00', glow: '#ffdd00' },
  white:  { off: '#444444', on: '#ffffff', glow: '#ffffff' },
  orange: { off: '#552200', on: '#ff8800', glow: '#ff7700' },
  purple: { off: '#330044', on: '#cc44ff', glow: '#aa00ff' },
};

/**
 * <sim-led> — LED 컴포넌트 (60×90px)
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

  // getPinPositions: SVG viewBox 좌표 × 1.5 (host 60×90 / viewBox 40×60 = 1.5)
  override getPinPositions() {
    return new Map([
      ['ANODE',   { x: 21, y: 90 }],
      ['CATHODE', { x: 39, y: 90 }],
    ]);
  }

  private get _colors() { return COLOR_MAP[this.color] ?? COLOR_MAP.red; }

  override render() {
    const c = this._colors;
    const fill = this.lit ? c.on : c.off;
    const glowOpacity = this.lit ? (this.brightness / 255) : 0;

    return html`
      <svg width="60" height="90" viewBox="0 0 40 60">
        <defs>
          <radialGradient id="led-glow-${this.compId}" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stop-color="${c.glow}" stop-opacity="${glowOpacity * 0.9}"/>
            <stop offset="100%" stop-color="${c.glow}" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- glow -->
        ${this.lit ? svg`
          <ellipse cx="20" cy="17" rx="22" ry="22"
            fill="url(#led-glow-${this.compId})"/>
        ` : ''}

        <!-- LED 반돔 몸체 -->
        <ellipse cx="20" cy="17" rx="14" ry="14" fill="${fill}"
          stroke="${this.lit ? '#aaa' : '#666'}" stroke-width="1"/>
        <!-- 원통 하단부 -->
        <path d="M6,17 L6,28 Q6,35 13,36 L27,36 Q34,35 34,28 L34,17"
          fill="${fill}" stroke="${this.lit ? '#aaa' : '#666'}" stroke-width="1"/>
        <line x1="6" y1="17" x2="34" y2="17" stroke="#66666644" stroke-width="0.8"/>

        <!-- 상단 하이라이트 -->
        <ellipse cx="13" cy="10" rx="5" ry="3" fill="white"
          opacity="${this.lit ? 0.45 : 0.15}" transform="rotate(-30,13,10)"/>

        <!-- 플랜지 구분선 -->
        <line x1="8" y1="30" x2="32" y2="30"
          stroke="${this.lit ? '#ffffff33' : '#33333366'}" stroke-width="0.6"/>

        <!-- 캐소드 구분 표시 (평평한 면) -->
        <line x1="6" y1="24" x2="6" y2="35"
          stroke="${this.lit ? '#aaa' : '#555'}" stroke-width="1.5"/>

        <!-- 핀 다리 — ANODE(+) 왼쪽, CATHODE(-) 오른쪽 -->
        <line x1="14" y1="36" x2="14" y2="60" stroke="#bbbbbb" stroke-width="2"/>
        <line x1="26" y1="36" x2="26" y2="60" stroke="#bbbbbb" stroke-width="2"/>

        <!-- 핀 라벨 (몸체 안쪽) -->
        <text x="11" y="32" font-size="6.5" fill="${this.lit ? '#ffffff99' : '#88888899'}"
          font-family="monospace" font-weight="bold">+</text>
        <text x="24.5" y="32" font-size="6" fill="${this.lit ? '#ffffff80' : '#77777780'}"
          font-family="monospace">−</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-led': SimLed; }
}
