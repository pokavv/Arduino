import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-oled> — SSD1306 OLED 128x64 (0.96인치 I2C 모듈)
 *
 * 실물 기준:
 *   - 파란색 PCB, 27×27mm 정사각형
 *   - OLED 패널: 상단 16행 노란색, 나머지 48행 파란색
 *   - 핀 헤더: PCB 하단 엣지 (GND-VCC-SCL-SDA 순)
 *   - 4구석 마운팅 홀
 *
 * Pins: GND, VCC, SCL, SDA
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

  // host: 90×100px (1:1 SVG)
  // 핀: PCB 하단 — GND(20,100), VCC(34,100), SCL(48,100), SDA(62,100)
  override getPinPositions() {
    return new Map([
      ['GND', { x: 20, y: 100 }],
      ['VCC', { x: 34, y: 100 }],
      ['SCL', { x: 48, y: 100 }],
      ['SDA', { x: 62, y: 100 }],
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
    // 노란/파란 영역 구분 (16행 기준)
    ctx.fillStyle = y < 16 ? '#FFD700' : '#44aaff';
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

    // 배경: 검정
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W * 2, H * 2);

    // 픽셀 렌더링: 상단 16행=노란색, 하단 48행=파란색
    for (let x = 0; x < W; x++) {
      for (let page = 0; page < 8; page++) {
        const byte = this._frameBuffer[x + page * W];
        for (let bit = 0; bit < 8; bit++) {
          if (byte & (1 << bit)) {
            const py = page * 8 + bit;
            ctx.fillStyle = py < 16 ? '#FFD700' : '#44aaff';
            ctx.fillRect(x * 2, py * 2, 2, 2);
          }
        }
      }
    }
  }

  override render() {
    return html`
      <svg width="90" height="100" viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg">

        <!-- ── 파란 PCB 본체 ── -->
        <rect x="0" y="0" width="90" height="88" rx="3"
          fill="#1a4fa0" stroke="#0d3070" stroke-width="0.8"/>
        <!-- PCB 상단 미묘한 하이라이트 -->
        <rect x="0" y="0" width="90" height="6" rx="3"
          fill="white" opacity="0.04"/>

        <!-- 마운팅 홀 (4구석) -->
        <circle cx="4.5"  cy="4.5"  r="2" fill="#0a2a5a" stroke="#0d3070" stroke-width="0.5"/>
        <circle cx="85.5" cy="4.5"  r="2" fill="#0a2a5a" stroke="#0d3070" stroke-width="0.5"/>
        <circle cx="4.5"  cy="83.5" r="2" fill="#0a2a5a" stroke="#0d3070" stroke-width="0.5"/>
        <circle cx="85.5" cy="83.5" r="2" fill="#0a2a5a" stroke="#0d3070" stroke-width="0.5"/>

        <!-- ── OLED 패널 외곽 베젤 ── -->
        <rect x="3" y="5" width="84" height="62" rx="2"
          fill="#050508" stroke="#1a1a2e" stroke-width="0.8"/>

        <!-- 디스플레이 노란 영역 배경 (상단 16행) -->
        <rect x="4" y="6" width="82" height="15" rx="1"
          fill="#1a1200"/>

        <!-- 디스플레이 파란 영역 배경 (하단 48행) -->
        <rect x="4" y="21" width="82" height="45" rx="1"
          fill="#00050f"/>

        <!-- Canvas — 실제 OLED 콘텐츠 렌더링 (128×64 → 82×60 스케일) -->
        <foreignObject x="4" y="6" width="82" height="60">
          <canvas xmlns="http://www.w3.org/1999/xhtml"
            width="256" height="128"
            style="width:82px;height:60px;image-rendering:pixelated;display:block">
          </canvas>
        </foreignObject>

        <!-- 디스플레이 유리 반사 (미묘한 광택) -->
        <rect x="4" y="6" width="82" height="5" rx="1"
          fill="white" opacity="0.04"/>
        <line x1="6" y1="7" x2="25" y2="7" stroke="white" opacity="0.06" stroke-width="0.5"/>

        <!-- ── PCB 하단 SMD 부품 영역 (장식) ── -->
        <!-- FPC 리본 소켓 (상단, 패널 연결) -->
        <rect x="8" y="67" width="74" height="3" rx="1"
          fill="#0d2a50" stroke="#1a3a70" stroke-width="0.4"/>

        <!-- SMD 디커플링 커패시터 (갈색 사각형) -->
        <rect x="14" y="72" width="4" height="2.5" rx="0.3" fill="#8a6a30"/>
        <rect x="20" y="72" width="4" height="2.5" rx="0.3" fill="#8a6a30"/>
        <!-- SMD 저항 (회색) -->
        <rect x="30" y="72" width="5" height="2.5" rx="0.3" fill="#555"/>
        <rect x="37" y="72" width="5" height="2.5" rx="0.3" fill="#555"/>
        <!-- 점퍼 (작은 회색 사각형) -->
        <rect x="48" y="72" width="3" height="2.5" rx="0.3" fill="#444"/>

        <!-- I2C 주소 실크스크린 -->
        <text x="65" y="75" font-size="3.5" fill="#9bb5e0" font-family="monospace"
          text-anchor="middle">0x3C</text>

        <!-- ── 핀 헤더 (하단) ── -->
        <!-- 플라스틱 블록 -->
        <rect x="11" y="79" width="60" height="7" rx="1"
          fill="#0d0d0d" stroke="#222" stroke-width="0.5"/>
        <!-- 핀 라벨 (실크스크린) — 블록 위 -->
        <text x="20" y="78.5" font-size="3.5" fill="#9bb5e0" font-family="monospace"
          text-anchor="middle">GND</text>
        <text x="34" y="78.5" font-size="3.5" fill="#ff8877" font-family="monospace"
          text-anchor="middle">VCC</text>
        <text x="48" y="78.5" font-size="3.5" fill="#aaccff" font-family="monospace"
          text-anchor="middle">SCL</text>
        <text x="62" y="78.5" font-size="3.5" fill="#ffcc55" font-family="monospace"
          text-anchor="middle">SDA</text>

        <!-- 핀 금속 (하단으로 돌출) -->
        <rect x="18.5" y="84" width="2.5" height="16" rx="0.5" fill="#aaa"/>
        <rect x="19"   y="84" width="1"   height="16" fill="white" opacity="0.3"/>
        <rect x="32.5" y="84" width="2.5" height="16" rx="0.5" fill="#aaa"/>
        <rect x="33"   y="84" width="1"   height="16" fill="white" opacity="0.3"/>
        <rect x="46.5" y="84" width="2.5" height="16" rx="0.5" fill="#aaa"/>
        <rect x="47"   y="84" width="1"   height="16" fill="white" opacity="0.3"/>
        <rect x="60.5" y="84" width="2.5" height="16" rx="0.5" fill="#aaa"/>
        <rect x="61"   y="84" width="1"   height="16" fill="white" opacity="0.3"/>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-oled': SimOled;
  }
}
