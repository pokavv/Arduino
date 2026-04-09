import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-oled> — SSD1306 OLED 128×64 (0.96인치 I2C 모듈)
 *
 * Wokwi ssd1306-element.ts 기준 정밀 재현:
 *   host: 150×116px  viewBox: 0 0 150 116
 *   PCB:  fill=#025CAF stroke=#BE9B72 rx=13
 *   OLED 패널: x=11.4 y=26 w=128 h=64 fill=#1A1A1A
 *   Canvas: left=11.5px top=27px (1:1 픽셀)
 *   마운팅홀: r=5.5 fill=#59340A stroke=#BE9B72 — 4구석 (절대: 12,12 / 136,12 / 12,102 / 136,102)
 *   핀헤더: 상단 y≈12.5, I2C 4핀 (GND VCC SCL SDA)
 *
 * Pins: GND, VCC, SCL, SDA  (상단, 9px 간격, 중앙 정렬)
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
  override get pins() { return ['GND', 'VCC', 'SCL', 'SDA']; }

  // Wokwi SSD1306 핀 위치 (host 150px 기준)
  // 4핀 I2C: GND, VCC, SCL, SDA — 9px 간격으로 중앙 정렬
  // x: 61.5, 70.5, 79.5, 88.5 → y=0 (상단 돌출)
  override getPinPositions() {
    return new Map([
      ['GND', { x: 62, y: 0 }],
      ['VCC', { x: 71, y: 0 }],
      ['SCL', { x: 80, y: 0 }],
      ['SDA', { x: 89, y: 0 }],
    ]);
  }

  private _textX = 0;
  private _textY = 0;
  private _textSize = 1;

  override setPinState(pin: string, value: number | string) {
    switch (pin) {
      case 'CLEAR':
        this.oledClear();
        break;
      case 'FILL_WHITE':
        this._frameBuffer.fill(0xFF);
        this.oledDisplay();
        break;
      case 'CURSOR': {
        const parts = String(value).split(',').map(Number);
        if (parts.length >= 2) { this._textX = parts[0]; this._textY = parts[1]; }
        break;
      }
      case 'TEXTSIZE': {
        this._textSize = Math.max(1, Number(value));
        break;
      }
      case 'PRINT': {
        const text = String(value);
        const lines = text.split('\\n');
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) { this._textX = 0; this._textY += 8 * this._textSize; }
          if (lines[i]) {
            this.oledPrint(lines[i], this._textX, this._textY, this._textSize);
            this._textX += lines[i].length * 6 * this._textSize;
          }
        }
        this.oledDisplay();
        break;
      }
      case 'PIXEL': {
        const p = String(value).split(',').map(Number);
        if (p.length >= 3) this.oledDrawPixel(p[0], p[1], p[2]);
        this.oledDisplay();
        break;
      }
      case 'FILLRECT': {
        const p = String(value).split(',').map(Number);
        if (p.length >= 5) this.oledFillRect(p[0], p[1], p[2], p[3], p[4]);
        this.oledDisplay();
        break;
      }
      case 'LINE': {
        const p = String(value).split(',').map(Number);
        if (p.length >= 5) {
          this._drawLine(p[0], p[1], p[2], p[3], p[4]);
          this.oledDisplay();
        }
        break;
      }
    }
  }

  private _drawLine(x0: number, y0: number, x1: number, y1: number, color: number) {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      this.oledDrawPixel(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 <  dx) { err += dx; y0 += sy; }
    }
  }

  override firstUpdated() {
    this._canvas = this.shadowRoot!.querySelector('canvas')!;
    this._ctx = this._canvas.getContext('2d')!;
    this._redraw();
  }

  // ─── SSD1306 API ───────────────────────────────────────────────

  oledClear() {
    this._frameBuffer.fill(0);
    this._redraw();
  }

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

  oledPrint(text: string, x: number, y: number, size = 1) {
    const ctx = this._ctx;
    ctx.fillStyle = y < 16 ? '#FFD700' : '#44aaff';
    ctx.font = `${6 * size}px monospace`;
    ctx.fillText(text, x, y + 6 * size);
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
    this._drawLine(x0, y0, x1, y1, color);
  }

  private _redraw() {
    if (!this._ctx) return;
    const ctx = this._ctx;
    const W = SimOled.WIDTH;
    const H = SimOled.HEIGHT;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x++) {
      for (let page = 0; page < 8; page++) {
        const byte = this._frameBuffer[x + page * W];
        for (let bit = 0; bit < 8; bit++) {
          if (byte & (1 << bit)) {
            const py = page * 8 + bit;
            ctx.fillStyle = py < 16 ? '#FFD700' : '#44aaff';
            ctx.fillRect(x, py, 1, 1);
          }
        }
      }
    }
  }

  override render() {
    return html`
      <svg width="150" height="116" viewBox="0 0 150 116"
           xmlns="http://www.w3.org/2000/svg">

        <!-- ── PCB 외곽 (Wokwi: fill=#025CAF stroke=#BE9B72 rx=13) ── -->
        <rect x="0.5" y="0.5" width="148" height="114" rx="13"
          fill="#025CAF" stroke="#BE9B72" stroke-width="1"/>

        <!-- ── 마운팅 홀 4구석 (Wokwi: translate(6,6) r=5.5 fill=#59340A stroke=#BE9B72) ── -->
        <g transform="translate(6,6)" fill="#59340A" stroke="#BE9B72" stroke-width="0.6">
          <circle cx="6"   cy="6"   r="5.5"/>
          <circle cx="130" cy="6"   r="5.5"/>
          <circle cx="6"   cy="96"  r="5.5"/>
          <circle cx="130" cy="96"  r="5.5"/>
        </g>

        <!-- ── OLED 패널 외곽 (Wokwi: x=11.4 y=26 w=128 h=64 fill=#1A1A1A) ── -->
        <rect x="11.4" y="26" width="128" height="64" fill="#1A1A1A"/>

        <!-- 실물 노란 영역 배경: 상단 16행 (25%) -->
        <rect x="11.4" y="26" width="128" height="16" fill="#1a1200"/>
        <!-- 실물 파란 영역 배경: 하단 48행 (75%) -->
        <rect x="11.4" y="42" width="128" height="48" fill="#00050f"/>

        <!-- Canvas — 실제 OLED 픽셀 렌더링 (128×64 1:1) -->
        <foreignObject x="11.5" y="27" width="128" height="64">
          <canvas xmlns="http://www.w3.org/1999/xhtml"
            width="128" height="64"
            style="width:128px;height:64px;image-rendering:pixelated;display:block">
          </canvas>
        </foreignObject>

        <!-- 유리 반사 미묘한 하이라이트 -->
        <rect x="11.4" y="26" width="128" height="4" fill="white" opacity="0.03"/>

        <!-- ── SMD 부품 (Wokwi 스타일: 원형 패드) ── -->
        <!-- 핀 패드 (원형 smd circles) — 상단 y≈12.5 -->
        <g transform="translate(33,9)" fill="#9D9D9A" stroke-width="0.4">
          <circle cx="3.5"  cy="3.5" r="3.5" stroke="#E7DBDB"/>
          <circle cx="12.5" cy="3.5" r="3.5" stroke="#B4AEAB"/>
          <circle cx="21.5" cy="3.5" r="3.5" stroke="#C08540"/>
          <circle cx="31.5" cy="3.5" r="3.5" stroke="#E8D977"/>
          <circle cx="41.5" cy="3.5" r="3.5" stroke="#009E9B"/>
          <circle cx="50.5" cy="3.5" r="3.5" stroke="#9D5B96"/>
          <circle cx="60.5" cy="3.5" r="3.5" stroke="#007ADB"/>
          <circle cx="70.5" cy="3.5" r="3.5" stroke="#262626"/>
        </g>

        <!-- FPC 리본 소켓 -->
        <rect x="10" y="90" width="130" height="4" rx="1"
          fill="#013065" stroke="#025090" stroke-width="0.4"/>

        <!-- SMD 커패시터/저항 (장식) -->
        <rect x="16"  y="96" width="7" height="4" rx="0.5" fill="#8a6a30"/>
        <rect x="26"  y="96" width="7" height="4" rx="0.5" fill="#8a6a30"/>
        <rect x="40"  y="96" width="9" height="4" rx="0.5" fill="#444"/>
        <rect x="52"  y="96" width="9" height="4" rx="0.5" fill="#444"/>
        <!-- I2C 주소 -->
        <text x="110" y="101" font-size="5" fill="#7aaae0" font-family="monospace"
          text-anchor="middle">0x3C</text>

        <!-- ── 핀 헤더 블록 (상단, I2C 4핀) ── -->
        <rect x="55" y="14" width="42" height="8" rx="1"
          fill="#0d0d0d" stroke="#1a1a1a" stroke-width="0.5"/>

        <!-- 핀 라벨 (실크스크린) -->
        <text x="62" y="24.5" font-size="3.8" fill="#9bb5e0" font-family="monospace"
          text-anchor="middle">GND</text>
        <text x="71" y="24.5" font-size="3.8" fill="#ff8877" font-family="monospace"
          text-anchor="middle">VCC</text>
        <text x="80" y="24.5" font-size="3.8" fill="#aaccff" font-family="monospace"
          text-anchor="middle">SCL</text>
        <text x="89" y="24.5" font-size="3.8" fill="#ffcc55" font-family="monospace"
          text-anchor="middle">SDA</text>

        <!-- 핀 금속 (위로 돌출, y=0~15) -->
        <rect x="60.5" y="0" width="2.5" height="15" rx="0.5" fill="#aaa"/>
        <rect x="61"   y="0" width="1"   height="15" fill="white" opacity="0.3"/>
        <rect x="69.5" y="0" width="2.5" height="15" rx="0.5" fill="#aaa"/>
        <rect x="70"   y="0" width="1"   height="15" fill="white" opacity="0.3"/>
        <rect x="78.5" y="0" width="2.5" height="15" rx="0.5" fill="#aaa"/>
        <rect x="79"   y="0" width="1"   height="15" fill="white" opacity="0.3"/>
        <rect x="87.5" y="0" width="2.5" height="15" rx="0.5" fill="#aaa"/>
        <rect x="88"   y="0" width="1"   height="15" fill="white" opacity="0.3"/>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-oled': SimOled;
  }
}
