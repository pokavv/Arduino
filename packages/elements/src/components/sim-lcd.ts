import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-lcd> — I2C LCD 1602 / 2004
 *
 * Wokwi lcd1602-element.ts 기준 정밀 재현:
 *   viewBox: 0 0 80 H (mm, 1unit=1mm)  — H는 rows에 따라 가변
 *   1602: H=36mm, 2004: H≈47.5mm
 *   scale: 3px/mm → host: 240×108px (1602), 240×142px (2004)
 *
 *   PCB:  fill=#087f45 (진한 녹색)
 *   검정 베젤: x=4.95 y=5.7 w=71.2 h=25.2 (1602)
 *   LCD 유리: x=7.55 y=10.3 w=66.0 h=16.0 rx=1.5
 *   배경색 ON(green): #6cb201, ON(blue): #000eff
 *   문자 그리드 origin: panelX=12.45 panelY=12.55
 *   셀 간격: xSpacing=3.55mm ySpacing=5.95mm
 *   픽셀: 0.55mm × 0.65mm  (5×8 grid)
 *
 *   I2C 핀 (왼쪽, mm 기준): x=1.06mm, y≈[8.47, 10.98, 13.49, 16.0]mm
 *
 * Pins: GND, VCC, SDA, SCL
 */
@customElement('sim-lcd')
export class SimLcd extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { display: block; }
      .lcd-body { font-family: 'Courier New', monospace; }
    `,
  ];

  @property({ type: Number }) rows = 2;
  @property({ type: Number }) cols = 16;
  @property({ type: Number }) i2cAddress = 0x27;

  // Wokwi 치수 상수 (mm)
  private readonly CHAR_X_SPACING = 3.55;
  private readonly CHAR_Y_SPACING = 5.95;
  private readonly PIXEL_W = 0.55;
  private readonly PIXEL_H = 0.65;
  private readonly PIXEL_X_STEP = 0.6;
  private readonly PIXEL_Y_STEP = 0.7;
  private readonly PANEL_X = 12.45;  // 문자 origin x
  private readonly PANEL_Y = 12.55;  // 문자 origin y
  private readonly SCALE = 3;        // px/mm

  /** 현재 화면 내용 [row][col] */
  private _buffer: string[][] = [];
  private _backlight = true;
  private _cursor = { row: 0, col: 0 };
  private _displayOn = true;
  private _cursorVisible = false;

  override get componentType() { return 'lcd'; }
  override get pins() { return ['GND', 'VCC', 'SDA', 'SCL']; }

  // viewBox 가변 계산
  private get _vbH(): number {
    const panelH = this.rows * 5.75;
    return panelH + 24.5;
  }

  private get _hostH(): number {
    return Math.ceil(this._vbH * this.SCALE);
  }

  private get _hostW(): number {
    return 240; // 80mm × 3px/mm
  }

  // I2C 핀: viewBox mm → host px
  // x = 1.06mm × 3 = 3.18 ≈ 3px → x=0 (핀 리드가 PCB 밖으로 나옴)
  // y(mm): 8.47, 10.98, 13.49, 16.0 → ×3: 25.4, 32.9, 40.5, 48.0
  override getPinPositions() {
    const s = this.SCALE;
    return new Map([
      ['GND', { x: 0, y: Math.round(8.47  * s) }],
      ['VCC', { x: 0, y: Math.round(10.98 * s) }],
      ['SDA', { x: 0, y: Math.round(13.49 * s) }],
      ['SCL', { x: 0, y: Math.round(16.0  * s) }],
    ]);
  }

  override setPinState(pin: string, value: number | string) {
    switch (pin) {
      case 'CLEAR':   this.lcdClear();   break;
      case 'HOME':    this.lcdHome();    break;
      case 'CURSOR': {
        const parts = String(value).split(',').map(Number);
        if (parts.length >= 2) this.lcdSetCursor(parts[0], parts[1]);
        break;
      }
      case 'PRINT': {
        const lines = String(value).split('\\n');
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) {
            this._cursor.col = 0;
            this._cursor.row = (this._cursor.row + 1) % this.rows;
          }
          if (lines[i]) this.lcdPrint(lines[i]);
        }
        break;
      }
      case 'INIT': {
        const parts = String(value).split('x').map(Number);
        if (parts.length >= 2) this.lcdBegin(parts[0], parts[1]);
        break;
      }
      case 'BACKLIGHT':
        this._backlight = (typeof value === 'number' ? value : Number(value)) > 0;
        this.requestUpdate();
        break;
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this._initBuffer();
  }

  private _initBuffer() {
    this._buffer = Array.from({ length: this.rows }, () => Array(this.cols).fill(' '));
  }

  // ─── LCD API ────────────────────────────────────────────────────

  lcdBegin(cols: number, rows: number) {
    this.cols = cols; this.rows = rows;
    this._initBuffer();
  }

  lcdClear() {
    this._initBuffer();
    this._cursor = { row: 0, col: 0 };
    this.requestUpdate();
  }

  lcdHome() {
    this._cursor = { row: 0, col: 0 };
  }

  lcdSetCursor(col: number, row: number) {
    this._cursor = {
      row: Math.min(row, this.rows - 1),
      col: Math.min(col, this.cols - 1),
    };
  }

  lcdPrint(text: string) {
    for (const ch of text) {
      if (this._cursor.col >= this.cols) {
        this._cursor.col = 0;
        this._cursor.row = (this._cursor.row + 1) % this.rows;
      }
      this._buffer[this._cursor.row][this._cursor.col] = ch;
      this._cursor.col++;
    }
    this.requestUpdate();
  }

  lcdBacklight(on: boolean) {
    this._backlight = on;
    this.requestUpdate();
  }

  // ────────────────────────────────────────────────────────────────

  override render() {
    const s = this.SCALE;
    const vbW = 80;
    const vbH = this._vbH;
    const hostW = this._hostW;
    const hostH = this._hostH;

    // Wokwi 치수 (mm)
    const panelW = this.cols * 3.5125;
    const panelH = this.rows * 5.75;
    const bezelW = panelW + 15;
    const bezelH = panelH + 13.7;
    const glassW = panelW + 9.8;
    const glassH = panelH + 4.5;

    const bgColor = this._backlight ? '#6cb201' : '#2a4a2a';
    const charColor = this._backlight ? '#000000' : 'transparent';

    // 문자 렌더링 (5×8 픽셀 폰트 스타일 — simplified: 단일 글자)
    // Wokwi는 HD44780 ROM 기반 path 렌더링, 여기서는 SVG text로 근사
    const charCells = this._buffer.flatMap((row, ri) =>
      row.map((ch, ci) => {
        const cx = this.PANEL_X + ci * this.CHAR_X_SPACING;
        const cy = this.PANEL_Y + ri * this.CHAR_Y_SPACING;
        const isCursor = this._cursor.row === ri && this._cursor.col === ci;
        return { ch, cx, cy, isCursor };
      })
    );

    return html`
      <svg width="${hostW}" height="${hostH}"
           viewBox="0 0 ${vbW} ${vbH}"
           xmlns="http://www.w3.org/2000/svg">

        <!-- ── 메인 PCB (Wokwi: fill=#087f45 진한 녹색) ── -->
        <rect x="0" y="0" width="${vbW}" height="${vbH}"
          fill="#087f45" stroke="#055c33" stroke-width="0.5"/>

        <!-- PCB 상단 미묘한 하이라이트 -->
        <rect x="0" y="0" width="${vbW}" height="3"
          fill="white" opacity="0.05"/>

        <!-- ── 검정 LCD 베젤 (Wokwi: x=4.95 y=5.7) ── -->
        <rect x="4.95" y="5.7" width="${bezelW}" height="${bezelH}"
          fill="#000000"/>

        <!-- ── LCD 유리면 (백라이트 색상) ── -->
        <rect x="7.55" y="10.3" width="${glassW}" height="${glassH}"
          rx="1.5" ry="1.5"
          fill="${bgColor}"/>

        <!-- ── 문자 셀 그리드 오버레이 (셀 경계 미묘한 표시) ── -->
        ${charCells.map(({ ch, cx, cy, isCursor }) => html`
          <!-- 커서 블록 -->
          ${isCursor && this._cursorVisible ? html`
            <rect x="${cx}" y="${cy}" width="2.95" height="5.55"
              fill="white" opacity="0.5"/>
          ` : ''}
          <!-- 문자 (SVG text로 근사 — 실제 Wokwi는 path 폰트) -->
          <text x="${cx + 0.15}" y="${cy + 4.8}"
            font-family="'Courier New', monospace"
            font-size="3.6"
            fill="${this._displayOn ? charColor : 'transparent'}"
            font-weight="bold">${ch}</text>
        `)}

        <!-- 유리 반사 (상단 하이라이트) -->
        <rect x="7.55" y="10.3" width="${glassW}" height="2.0"
          rx="1.5" fill="white" opacity="0.08"/>

        <!-- ── I2C 백팩 영역 (왼쪽 엣지) ── -->
        <!-- I2C 모듈 표시 영역 (viewBox 0~4mm 범위) -->
        <rect x="0.3" y="6.5" width="4.3" height="${vbH - 10}" rx="0.5"
          fill="#055c33" stroke="#044428" stroke-width="0.3"/>
        <!-- PCF8574 IC 표시 -->
        <rect x="0.8" y="${vbH * 0.35}" width="3.3" height="${vbH * 0.22}" rx="0.3"
          fill="#1a1a1a" stroke="#333" stroke-width="0.2"/>
        <text x="2.45" y="${vbH * 0.48}"
          font-size="0.9" fill="#445" font-family="monospace" text-anchor="middle"
          font-weight="bold">I2C</text>

        <!-- ── I2C 핀 패드 (왼쪽, mm 좌표) ── -->
        <!-- GND: y=8.47mm, VCC: 10.98mm, SDA: 13.49mm, SCL: 16.0mm -->
        ${[
          { y: 8.47,  label: 'G', color: '#88ee99' },
          { y: 10.98, label: 'V', color: '#ff8877' },
          { y: 13.49, label: 'D', color: '#ffcc55' },
          { y: 16.00, label: 'C', color: '#88aaff' },
        ].map(({ y, label, color }) => html`
          <!-- 핀 리드 (x=0에서 시작, viewBox 밖으로 나옴) -->
          <line x1="-0.5" y1="${y}" x2="0.8" y2="${y}"
            stroke="#aaa" stroke-width="0.5" stroke-linecap="round"/>
          <!-- 핀 패드 원형 -->
          <circle cx="0.8" cy="${y}" r="0.4"
            fill="#92926d" stroke="#666" stroke-width="0.1"/>
          <!-- 라벨 (IC 위) -->
          <text x="1.5" y="${y - 0.2}"
            font-size="0.9" fill="${color}" font-family="monospace"
            font-weight="bold">${label}</text>
        `)}

        <!-- ── 핀 헤더 (하단 16핀, 장식용) ── -->
        <rect x="7.55" y="${vbH - 3.5}" width="${this.cols * 2.54}" height="2.5"
          fill="#0a0a0a" stroke="#222" stroke-width="0.2" rx="0.3"/>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-lcd': SimLcd;
  }
}
