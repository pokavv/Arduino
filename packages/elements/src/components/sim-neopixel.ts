import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-neopixel> — WS2812B NeoPixel Strip
 *
 * Pins: VCC, GND, DIN
 * Attributes:
 *   count: LED 개수 (기본 8)
 */
@customElement('sim-neopixel')
export class SimNeopixel extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { display: block; }`,
  ];

  @property({ type: Number }) count = 8;
  private _pixels: Array<[number, number, number]> = [];

  override get componentType() { return 'neopixel'; }
  override get pins() { return ['VCC', 'GND', 'DIN']; }

  override getPinPositions() {
    return new Map([
      ['VCC', { x:  8, y: 44 }],
      ['GND', { x: 22, y: 44 }],
      ['DIN', { x: 36, y: 44 }],
    ]);
  }

  override connectedCallback() {
    super.connectedCallback();
    this._pixels = Array.from({ length: this.count }, () => [0, 0, 0]);
  }

  override setPinState(_pin: string, _value: number | string) {}

  setPixel(index: number, r: number, g: number, b: number) {
    if (index < 0 || index >= this.count) return;
    this._pixels[index] = [r, g, b];
    this.requestUpdate();
  }

  setAllPixels(pixels: Array<[number, number, number]>) {
    this._pixels = pixels.slice(0, this.count);
    this.requestUpdate();
  }

  private _toHex(v: number) {
    return Math.round(v).toString(16).padStart(2, '0');
  }

  override render() {
    const pixelSize = 22;
    const gap = 4;
    const totalW = this.count * (pixelSize + gap) + gap;

    return html`
      <svg width="${totalW}" height="44" viewBox="0 0 ${totalW} 44">
        <!-- PCB 스트립 -->
        <rect width="${totalW}" height="30" rx="3" fill="#1a2a1a" stroke="#2a4a2a" stroke-width="1"/>
        <!-- LED 픽셀들 -->
        ${this._pixels.map(([r, g, b], i) => {
          const fill = `#${this._toHex(r)}${this._toHex(g)}${this._toHex(b)}`;
          const brightness = (r + g + b) / (3 * 255);
          const x = gap + i * (pixelSize + gap);
          return svg`
            <g>
              ${brightness > 0.05 ? svg`
                <rect x="${x - 3}" y="-3" width="${pixelSize + 6}" height="36" rx="4"
                  fill="${fill}" opacity="${brightness * 0.4}"/>
              ` : ''}
              <rect x="${x}" y="4" width="${pixelSize}" height="${pixelSize}" rx="3"
                fill="${brightness > 0.02 ? fill : '#111'}" stroke="#333" stroke-width="0.5"/>
              <rect x="${x + 3}" y="7" width="6" height="4" rx="1" fill="${brightness > 0.1 ? 'white' : '#222'}" opacity="0.3"/>
            </g>
          `;
        })}
        <!-- 핀 연결선 -->
        <line x1="8" y1="30" x2="8" y2="44" stroke="#f88" stroke-width="2"/>
        <line x1="22" y1="30" x2="22" y2="44" stroke="#aaa" stroke-width="2"/>
        <line x1="36" y1="30" x2="36" y2="44" stroke="#8f8" stroke-width="2"/>
        <text x="3"  y="43" font-size="5" fill="#f88" font-family="monospace">V</text>
        <text x="18" y="43" font-size="5" fill="#aaa" font-family="monospace">G</text>
        <text x="32" y="43" font-size="5" fill="#8f8" font-family="monospace">D</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-neopixel': SimNeopixel;
  }
}
