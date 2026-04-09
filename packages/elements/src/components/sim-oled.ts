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

  // host: 150×116px
  // Wokwi OLED: 핀이 PCB 상단에 위치 (GND, VCC, SCL, SDA 왼쪽→오른쪽)
  // 4핀 2.54mm 피치 헤더, 핀 리드 위로 돌출 12px
  override getPinPositions() {
    return new Map([
      ['GND', { x: 57, y: 0 }],
      ['VCC', { x: 69, y: 0 }],
      ['SCL', { x: 81, y: 0 }],
      ['SDA', { x: 93, y: 0 }],
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
    // host 150×116px
    // PCB는 y=12부터 시작 (핀 리드 12px 공간)
    // PCB 사이즈: 150×104
    // OLED 패널: x=3, y=15 → w=144, h=65
    // 핀 헤더: 상단 y=12 위치에 4핀 블록
    return html`
      <svg width="150" height="116" viewBox="0 0 150 116" xmlns="http://www.w3.org/2000/svg">

        <!-- ── 파란 PCB 본체 (#025CAF) ── -->
        <rect x="0" y="12" width="150" height="104" rx="3"
          fill="#025CAF" stroke="#014080" stroke-width="0.8"/>
        <!-- 상단 하이라이트 -->
        <rect x="0" y="12" width="150" height="6" rx="3"
          fill="white" opacity="0.06"/>

        <!-- ── 마운팅 홀 (4구석) ── -->
        <circle cx="5"   cy="17"  r="2.5" fill="#013a7a" stroke="#014080" stroke-width="0.5"/>
        <circle cx="145" cy="17"  r="2.5" fill="#013a7a" stroke="#014080" stroke-width="0.5"/>
        <circle cx="5"   cy="111" r="2.5" fill="#013a7a" stroke="#014080" stroke-width="0.5"/>
        <circle cx="145" cy="111" r="2.5" fill="#013a7a" stroke="#014080" stroke-width="0.5"/>

        <!-- ── OLED 패널 외곽 베젤 ── -->
        <rect x="3" y="18" width="144" height="68" rx="2"
          fill="#050508" stroke="#111122" stroke-width="0.8"/>

        <!-- 디스플레이 노란 영역 배경 (상단 16/64 비율) -->
        <rect x="4" y="19" width="142" height="16" rx="1"
          fill="#1a1200"/>
        <!-- 디스플레이 파란 영역 배경 (하단 48/64 비율) -->
        <rect x="4" y="35" width="142" height="50" rx="1"
          fill="#00050f"/>

        <!-- Canvas — 실제 OLED 콘텐츠 렌더링 (128×64 → 142×65 스케일) -->
        <foreignObject x="4" y="19" width="142" height="65">
          <canvas xmlns="http://www.w3.org/1999/xhtml"
            width="256" height="128"
            style="width:142px;height:65px;image-rendering:pixelated;display:block">
          </canvas>
        </foreignObject>

        <!-- 디스플레이 유리 반사 -->
        <rect x="4" y="19" width="142" height="5" rx="1"
          fill="white" opacity="0.04"/>

        <!-- ── SMD 부품 영역 (장식) ── -->
        <!-- FPC 리본 소켓 -->
        <rect x="10" y="87" width="130" height="4" rx="1"
          fill="#013065" stroke="#014080" stroke-width="0.4"/>

        <!-- SMD 커패시터 -->
        <rect x="16"  y="93" width="7" height="4" rx="0.5" fill="#8a6a30"/>
        <rect x="26"  y="93" width="7" height="4" rx="0.5" fill="#8a6a30"/>
        <!-- SMD 저항 -->
        <rect x="40"  y="93" width="9" height="4" rx="0.5" fill="#555"/>
        <rect x="52"  y="93" width="9" height="4" rx="0.5" fill="#555"/>
        <!-- I2C 점퍼/주소 선택 패드 -->
        <rect x="68"  y="93" width="5" height="4" rx="0.5" fill="#444"/>
        <!-- I2C 주소 실크스크린 -->
        <text x="110" y="97" font-size="5" fill="#7aaae0" font-family="monospace"
          text-anchor="middle">0x3C</text>

        <!-- ── 핀 헤더 블록 (상단, y=12 위) ── -->
        <!-- 플라스틱 블록 -->
        <rect x="51" y="13" width="48" height="7" rx="1"
          fill="#0d0d0d" stroke="#222" stroke-width="0.5"/>
        <!-- 핀 라벨 (PCB 위, 블록 아래쪽) -->
        <text x="57"  y="23.5" font-size="4" fill="#9bb5e0" font-family="monospace"
          text-anchor="middle">GND</text>
        <text x="69"  y="23.5" font-size="4" fill="#ff8877" font-family="monospace"
          text-anchor="middle">VCC</text>
        <text x="81"  y="23.5" font-size="4" fill="#aaccff" font-family="monospace"
          text-anchor="middle">SCL</text>
        <text x="93"  y="23.5" font-size="4" fill="#ffcc55" font-family="monospace"
          text-anchor="middle">SDA</text>

        <!-- 핀 금속 (위로 돌출, y=0~13) -->
        <rect x="55.5"  y="0" width="2.5" height="14" rx="0.5" fill="#aaa"/>
        <rect x="56"    y="0" width="1"   height="14" fill="white" opacity="0.3"/>
        <rect x="67.5"  y="0" width="2.5" height="14" rx="0.5" fill="#aaa"/>
        <rect x="68"    y="0" width="1"   height="14" fill="white" opacity="0.3"/>
        <rect x="79.5"  y="0" width="2.5" height="14" rx="0.5" fill="#aaa"/>
        <rect x="80"    y="0" width="1"   height="14" fill="white" opacity="0.3"/>
        <rect x="91.5"  y="0" width="2.5" height="14" rx="0.5" fill="#aaa"/>
        <rect x="92"    y="0" width="1"   height="14" fill="white" opacity="0.3"/>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-oled': SimOled;
  }
}
