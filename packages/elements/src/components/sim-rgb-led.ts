import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-rgb-led> — RGB LED (공통 캐소드 또는 공통 애노드)
 *
 * Pins: RED, GREEN, BLUE, COMMON
 */
@customElement('sim-rgb-led')
export class SimRgbLed extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 44px; height: 60px; }`,
  ];

  @property({ type: Number }) r = 0;
  @property({ type: Number }) g = 0;
  @property({ type: Number }) b = 0;
  @property({ type: Boolean }) commonAnode = false;

  override get componentType() { return 'rgb-led'; }
  override get pins() { return ['RED', 'GREEN', 'BLUE', 'COMMON']; }

  override setPinState(pin: string, value: number) {
    if (pin === 'RED') this.r = this.commonAnode ? 255 - value : value;
    else if (pin === 'GREEN') this.g = this.commonAnode ? 255 - value : value;
    else if (pin === 'BLUE') this.b = this.commonAnode ? 255 - value : value;
  }

  private _toHex(v: number) {
    return Math.round(v).toString(16).padStart(2, '0');
  }

  override render() {
    const fill = `#${this._toHex(this.r)}${this._toHex(this.g)}${this._toHex(this.b)}`;
    const brightness = (this.r + this.g + this.b) / (3 * 255);
    const glowOpacity = brightness;

    return html`
      <svg width="44" height="60" viewBox="0 0 44 60">
        <defs>
          <radialGradient id="rgb-glow-${this.compId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${fill}" stop-opacity="${glowOpacity}"/>
            <stop offset="100%" stop-color="${fill}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        ${brightness > 0.05 ? html`
          <ellipse cx="22" cy="18" rx="22" ry="22"
            fill="url(#rgb-glow-${this.compId})" opacity="${glowOpacity}"/>
        ` : ''}
        <ellipse cx="22" cy="18" rx="14" ry="14" fill="${fill}" stroke="#888" stroke-width="1"/>
        <path d="M8,18 L8,28 Q8,34 14,36 L30,36 Q36,34 36,28 L36,18" fill="${fill}" stroke="#888" stroke-width="1"/>
        <ellipse cx="16" cy="12" rx="5" ry="3" fill="white" opacity="0.3" transform="rotate(-30,16,12)"/>
        <!-- 다리: R G COM B -->
        <line x1="12" y1="36" x2="12" y2="60" stroke="#f88" stroke-width="2"/>
        <line x1="20" y1="36" x2="20" y2="60" stroke="#8f8" stroke-width="2"/>
        <line x1="28" y1="36" x2="28" y2="60" stroke="#aaa" stroke-width="2"/>
        <line x1="36" y1="36" x2="36" y2="60" stroke="#88f" stroke-width="2"/>
        <text x="8"  y="58" font-size="5" fill="#f88" font-family="monospace">R</text>
        <text x="17" y="58" font-size="5" fill="#8f8" font-family="monospace">G</text>
        <text x="24" y="58" font-size="5" fill="#aaa" font-family="monospace">C</text>
        <text x="33" y="58" font-size="5" fill="#88f" font-family="monospace">B</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-rgb-led': SimRgbLed;
  }
}
