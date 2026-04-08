import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-oled> — SSD1306 OLED 128x64
 *
 * Pins: VCC, GND, SDA, SCL
 * i2cAddress: 0x3C
 */
@customElement('sim-oled')
export class SimOled extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { display: block; }`,
  ];

  @property({ type: Number }) i2cAddress = 0x3C;

  static readonly WIDTH = 128;
  static readonly HEIGHT = 64;

  private _canvas!: HTMLCanvasElement;
  private _ctx!: CanvasRenderingContext2D;
  private _frameBuffer: Uint8Array = new Uint8Array(
    SimOled.WIDTH * Math.ceil(SimOled.HEIGHT / 8)
  );

  override get componentType() { return 'oled'; }
  override get pins() { return ['VCC', 'GND', 'SDA', 'SCL']; }

  override getPinPositions() {
    // SVG: ['GND','VCC','SCL','SDA'].map((p,i) => x="${18 + i*18}", y1=76, y2=84)
    return new Map([
      ['GND', { x: 18, y: 80 }],
      ['VCC', { x: 36, y: 80 }],
      ['SCL', { x: 54, y: 80 }],
      ['SDA', { x: 72, y: 80 }],
    ]);
  }
  override setPinState(_pin: string, _value: number) {}

  override firstUpdated() {
    this._canvas = this.shadowRoot!.querySelector('canvas')!;
    this._ctx = this._canvas.getContext('2d')!;
    this._redraw();
  }

  // ─── SSD1306 API (시뮬레이션 엔진이 호출) ────────────────────

  oledClear() {
    this._frameBuffer.fill(0);
    this._redraw();
  }

  /** 픽셀 찍기 */
  oledDrawPixel(x: number, y: number, color: number) {
    if (x < 0 || x >= SimOled.WIDTH || y < 0 || y >= SimOled.HEIGHT) return;
    const byteIndex = x + Math.floor(y / 8) * SimOled.WIDTH;
    const bitIndex = y % 8;
    if (color) {
      this._frameBuffer[byteIndex] |= (1 << bitIndex);
    } else {
      this._frameBuffer[byteIndex] &= ~(1 << bitIndex);
    }
  }

  /** 텍스트 출력 (간단 구현) */
  oledPrint(text: string, x: number, y: number, size = 1) {
    const ctx = this._ctx;
    ctx.fillStyle = '#fff';
    ctx.font = `${6 * size}px monospace`;
    ctx.fillText(text, x * 2, y * 2 + 6 * size);
  }

  oledDisplay() {
    this._redraw();
  }

  oledFillRect(x: number, y: number, w: number, h: number, color: number) {
    for (let px = x; px < x + w; px++) {
      for (let py = y; py < y + h; py++) {
        this.oledDrawPixel(px, py, color);
      }
    }
  }

  oledDrawLine(x0: number, y0: number, x1: number, y1: number, color: number) {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      this.oledDrawPixel(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  private _redraw() {
    if (!this._ctx) return;
    const ctx = this._ctx;
    const W = SimOled.WIDTH;
    const H = SimOled.HEIGHT;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W * 2, H * 2);
    ctx.fillStyle = '#fff';
    for (let x = 0; x < W; x++) {
      for (let page = 0; page < 8; page++) {
        const byte = this._frameBuffer[x + page * W];
        for (let bit = 0; bit < 8; bit++) {
          if (byte & (1 << bit)) {
            ctx.fillRect(x * 2, (page * 8 + bit) * 2, 2, 2);
          }
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────

  override render() {
    return html`
      <svg width="156" height="84" viewBox="0 0 156 84">
        <!-- PCB -->
        <rect width="156" height="84" rx="4" fill="#1a1a2a" stroke="#333" stroke-width="1"/>
        <!-- 화면 프레임 -->
        <rect x="12" y="8" width="132" height="68" rx="3" fill="#111" stroke="#444" stroke-width="1"/>
        <!-- Canvas는 foreignObject로 삽입 -->
        <foreignObject x="14" y="10" width="128" height="64">
          <canvas xmlns="http://www.w3.org/1999/xhtml"
            width="256" height="128"
            style="width:128px;height:64px;image-rendering:pixelated">
          </canvas>
        </foreignObject>
        <!-- 핀 -->
        ${['GND','VCC','SCL','SDA'].map((p, i) => html`
          <line x1="${18 + i * 18}" y1="76" x2="${18 + i * 18}" y2="84" stroke="#aaa" stroke-width="2"/>
          <text x="${11 + i * 18}" y="83" font-size="5" fill="#888" font-family="monospace">${p}</text>
        `)}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-oled': SimOled;
  }
}
