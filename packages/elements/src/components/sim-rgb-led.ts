import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-rgb-led> — RGB LED (66×90px)
 * Pins: RED, GREEN, BLUE, COMMON
 */
@customElement('sim-rgb-led')
export class SimRgbLed extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 66px; height: 90px; }`,
  ];

  @property({ type: Number }) r = 0;
  @property({ type: Number }) g = 0;
  @property({ type: Number }) b = 0;
  @property({ type: Boolean }) commonAnode = false;

  override get componentType() { return 'rgb-led'; }
  override get pins() { return ['RED', 'GREEN', 'BLUE', 'COMMON']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'RED')   this.r = this.commonAnode ? 255 - v : v;
    else if (pin === 'GREEN') this.g = this.commonAnode ? 255 - v : v;
    else if (pin === 'BLUE')  this.b = this.commonAnode ? 255 - v : v;
  }

  // getPinPositions: viewBox 좌표 × 1.5 (host 66×90 / viewBox 44×60 = 1.5)
  override getPinPositions() {
    return new Map([
      ['RED',    { x: 18, y: 90 }],
      ['GREEN',  { x: 30, y: 90 }],
      ['COMMON', { x: 42, y: 90 }],
      ['BLUE',   { x: 54, y: 90 }],
    ]);
  }

  private _toHex(v: number) {
    return Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  }

  override render() {
    const fill = `#${this._toHex(this.r)}${this._toHex(this.g)}${this._toHex(this.b)}`;
    const brightness = (this.r + this.g + this.b) / (3 * 255);
    const glowOpacity = brightness;
    const isOff = brightness < 0.02;

    return html`
      <svg width="66" height="90" viewBox="0 0 44 60">
        <defs>
          <radialGradient id="rgb-glow-${this.compId}" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stop-color="${fill}" stop-opacity="${glowOpacity * 0.8}"/>
            <stop offset="100%" stop-color="${fill}" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- glow -->
        ${!isOff ? html`
          <ellipse cx="22" cy="17" rx="22" ry="22"
            fill="url(#rgb-glow-${this.compId})"/>
        ` : ''}

        <!-- LED 몸체 -->
        <ellipse cx="22" cy="17" rx="14" ry="14"
          fill="${isOff ? '#333' : fill}"
          stroke="${isOff ? '#666' : '#aaa'}" stroke-width="1"/>
        <path d="M8,17 L8,27 Q8,34 15,36 L29,36 Q36,35 36,27 L36,17"
          fill="${isOff ? '#333' : fill}"
          stroke="${isOff ? '#666' : '#aaa'}" stroke-width="1"/>

        <!-- 하이라이트 -->
        <ellipse cx="16" cy="11" rx="5" ry="3"
          fill="white" opacity="${!isOff ? 0.4 : 0.12}"
          transform="rotate(-30,16,11)"/>

        <!-- 핀 다리 (색상 표시) -->
        <line x1="12" y1="36" x2="12" y2="60" stroke="#f88" stroke-width="2"/>
        <line x1="20" y1="36" x2="20" y2="60" stroke="#8f8" stroke-width="2"/>
        <line x1="28" y1="36" x2="28" y2="60" stroke="#bbb" stroke-width="2"/>
        <line x1="36" y1="36" x2="36" y2="60" stroke="#88f" stroke-width="2"/>

        <!-- 핀 라벨 (몸체 하단) -->
        <text x="12" y="34" font-size="5.5" fill="#f88" font-family="monospace"
          text-anchor="middle" font-weight="bold">R</text>
        <text x="20" y="34" font-size="5.5" fill="#8f8" font-family="monospace"
          text-anchor="middle" font-weight="bold">G</text>
        <text x="28" y="34" font-size="5.5" fill="#bbb" font-family="monospace"
          text-anchor="middle" font-weight="bold">C</text>
        <text x="36" y="34" font-size="5.5" fill="#88f" font-family="monospace"
          text-anchor="middle" font-weight="bold">B</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-rgb-led': SimRgbLed; }
}
