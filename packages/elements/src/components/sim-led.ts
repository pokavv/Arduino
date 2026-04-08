import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';
import type { LedColor } from '../types.js';

const COLOR_MAP: Record<LedColor, { off: string; on: string; glow: string }> = {
  red:    { off: '#5a0000', on: '#ff2020', glow: '#ff000088' },
  green:  { off: '#004400', on: '#20ff50', glow: '#00ff4488' },
  blue:   { off: '#000055', on: '#4080ff', glow: '#2060ff88' },
  yellow: { off: '#555500', on: '#ffee00', glow: '#ffdd0088' },
  white:  { off: '#444444', on: '#ffffff', glow: '#ffffff88' },
  orange: { off: '#552200', on: '#ff8800', glow: '#ff770088' },
  purple: { off: '#330044', on: '#cc44ff', glow: '#aa00ff88' },
};

/**
 * <sim-led> — LED 컴포넌트
 *
 * Attributes:
 *   color: 'red' | 'green' | 'blue' | 'yellow' | 'white' | 'orange' | 'purple'
 *   lit: boolean (켜짐 여부)
 *   brightness: 0~255
 *
 * Pins: ANODE(+), CATHODE(-)
 * Connections: ANODE→GPIO, CATHODE→GND
 *
 * @example
 * <sim-led color="red" comp-id="led1"></sim-led>
 */
@customElement('sim-led')
export class SimLed extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host {
        width: 40px;
        height: 60px;
      }
    `,
  ];

  @property({ type: String }) color: LedColor = 'red';
  @property({ type: Boolean, reflect: true }) lit = false;
  @property({ type: Number }) brightness = 255;

  override get componentType() { return 'led'; }
  override get pins() { return ['ANODE', 'CATHODE']; }

  override setPinState(pin: string, value: number) {
    if (pin === 'ANODE') {
      this.lit = value > 0;
      this.brightness = value;
    }
  }

  private get _colors() {
    return COLOR_MAP[this.color] ?? COLOR_MAP.red;
  }

  private get _fillColor() {
    if (!this.lit) return this._colors.off;
    if (this.brightness >= 255) return this._colors.on;
    const alpha = Math.round((this.brightness / 255) * 100);
    return this._colors.on + alpha.toString(16).padStart(2, '0');
  }

  override render() {
    const c = this._colors;
    const fill = this._fillColor;
    const glowOpacity = this.lit ? (this.brightness / 255) : 0;

    return html`
      <svg width="40" height="60" viewBox="0 0 40 60">
        <defs>
          <radialGradient id="led-glow-${this.compId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${c.glow}" stop-opacity="${glowOpacity}"/>
            <stop offset="100%" stop-color="${c.glow}" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- 글로우 효과 -->
        ${this.lit ? svg`
          <ellipse cx="20" cy="18" rx="20" ry="20"
            fill="url(#led-glow-${this.compId})" opacity="${glowOpacity}"/>
        ` : ''}

        <!-- LED 몸체 (반돔 모양) -->
        <ellipse cx="20" cy="18" rx="14" ry="14" fill="${fill}" stroke="#888" stroke-width="1"/>
        <path d="M6,18 L6,28 Q6,34 12,36 L28,36 Q34,34 34,28 L34,18" fill="${fill}" stroke="#888" stroke-width="1"/>
        <line x1="6" y1="18" x2="34" y2="18" stroke="#88888855" stroke-width="1"/>

        <!-- 하이라이트 -->
        <ellipse cx="14" cy="12" rx="5" ry="3" fill="white" opacity="${this.lit ? 0.4 : 0.15}" transform="rotate(-30,14,12)"/>

        <!-- Anode (+) 다리 - 왼쪽, 더 긺 -->
        <line x1="14" y1="36" x2="14" y2="60" stroke="#aaa" stroke-width="2"/>
        <!-- Cathode (-) 다리 - 오른쪽 -->
        <line x1="26" y1="36" x2="26" y2="60" stroke="#aaa" stroke-width="2"/>

        <!-- 핀 라벨 -->
        <text x="9" y="58" font-size="7" fill="#888" font-family="monospace">+</text>
        <text x="22" y="58" font-size="7" fill="#888" font-family="monospace">−</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-led': SimLed;
  }
}
