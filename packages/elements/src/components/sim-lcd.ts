import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-lcd> — I2C LCD 1602 / 2004
 *
 * Pins: VCC, GND, SDA, SCL
 * Attributes:
 *   rows: 2 | 4
 *   cols: 16 | 20
 *   i2c-address: 0x27 (기본값)
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

  /** 현재 화면 내용 [row][col] */
  private _buffer: string[][] = [];
  private _backlight = true;
  private _cursor = { row: 0, col: 0 };
  private _displayOn = true;
  private _cursorVisible = false;
  private _blinkVisible = false;

  override get componentType() { return 'lcd'; }
  override get pins() { return ['VCC', 'GND', 'SDA', 'SCL']; }

  override getPinPositions() {
    // Wokwi LCD I2C: 핀이 왼쪽 측면에서 나옴 (I2C 백팩)
    // h = 20 + rows*14 + (rows-1)*2
    const h = 20 + this.rows * 14 + (this.rows - 1) * 2;
    const totalH = h + 8;
    // 4핀을 수직으로 배분 (위→아래: GND, VCC, SDA, SCL)
    const step = Math.round(totalH * 0.18);
    const y0   = Math.round(totalH * 0.22);
    return new Map([
      ['GND', { x: 0, y: y0 }],
      ['VCC', { x: 0, y: y0 + step }],
      ['SDA', { x: 0, y: y0 + step * 2 }],
      ['SCL', { x: 0, y: y0 + step * 3 }],
    ]);
  }
  override setPinState(pin: string, value: number | string) {
    switch (pin) {
      case 'CLEAR':
        this.lcdClear();
        break;
      case 'HOME':
        this.lcdHome();
        break;
      case 'CURSOR': {
        const parts = String(value).split(',').map(Number);
        if (parts.length >= 2) this.lcdSetCursor(parts[0], parts[1]);
        break;
      }
      case 'PRINT': {
        const text = String(value);
        // 개행문자 처리
        const lines = text.split('\\n');
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) {
            // 다음 줄로 커서 이동
            this._cursor.col = 0;
            this._cursor.row = (this._cursor.row + 1) % this.rows;
          }
          if (lines[i]) this.lcdPrint(lines[i]);
        }
        break;
      }
      case 'INIT': {
        // 'COLSxROWS' 형식
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
    this._buffer = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(' ')
    );
  }

  // ─── LCD API (시뮬레이션 엔진이 호출) ─────────────────────────

  lcdBegin(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
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

  // ──────────────────────────────────────────────────────────────

  override render() {
    const charW = 10;
    const charH = 14;
    const padX  = 12;
    const padY  = 10;
    const lcdW  = padX * 2 + this.cols * charW;
    const lcdH  = padY * 2 + this.rows * charH + (this.rows - 1) * 2;
    const totalH = lcdH + 8;
    const bgColor = this._backlight ? '#4a8c5c' : '#2a4a2a';

    // I2C 백팩 영역 (왼쪽) — 폭 24px + 핀 리드 8px = 32px 오프셋
    const i2cBlockW = 20;
    const pinLeadW  = 10;
    const xShift    = i2cBlockW + pinLeadW;

    // SVG 총 너비
    const svgW = xShift + lcdW + 20;

    // 핀 y 좌표 (getPinPositions와 일치)
    const step = Math.round(totalH * 0.18);
    const y0   = Math.round(totalH * 0.22);
    const pinYs   = [y0, y0 + step, y0 + step * 2, y0 + step * 3];
    const pinLabels: Array<{ label: string; color: string }> = [
      { label: 'GND', color: '#88ee99' },
      { label: 'VCC', color: '#ff8877' },
      { label: 'SDA', color: '#ffcc55' },
      { label: 'SCL', color: '#88aaff' },
    ];

    return html`
      <svg width="${svgW}" height="${totalH}" viewBox="0 0 ${svgW} ${totalH}">

        <!-- ── 메인 PCB ── -->
        <rect x="${xShift}" y="0" width="${lcdW + 20}" height="${totalH}" rx="4"
          fill="#1a3a1a" stroke="#2a5a2a" stroke-width="1"/>

        <!-- ── LCD 화면 ── -->
        <rect x="${xShift + 10}" y="4" width="${lcdW}" height="${lcdH}" rx="3"
          fill="${bgColor}" stroke="#1a4a1a" stroke-width="1"/>

        <!-- ── 문자 셀들 ── -->
        ${this._buffer.map((row, ri) =>
          row.map((ch, ci) => {
            const cx = padX + ci * charW + xShift + 10;
            const cy = padY + ri * (charH + 2) + 4;
            const isCursor = this._cursor.row === ri && this._cursor.col === ci;
            return html`
              <rect x="${cx}" y="${cy}" width="${charW - 1}" height="${charH}"
                fill="${isCursor && this._cursorVisible ? '#ffffff22' : 'transparent'}"/>
              <text x="${cx + 1}" y="${cy + charH - 2}"
                font-family="'Courier New', monospace"
                font-size="11"
                fill="${this._displayOn ? '#00ff44' : 'transparent'}">${ch}</text>
            `;
          })
        )}

        <!-- ── I2C 백팩 PCB (왼쪽) ── -->
        <rect x="${pinLeadW}" y="${Math.round(totalH * 0.12)}"
          width="${i2cBlockW}" height="${Math.round(totalH * 0.76)}" rx="2"
          fill="#0d2a0d" stroke="#1a4a1a" stroke-width="0.8"/>
        <!-- PCF8574 IC 심볼 -->
        <rect x="${pinLeadW + 4}" y="${Math.round(totalH * 0.28)}"
          width="${i2cBlockW - 8}" height="${Math.round(totalH * 0.32)}" rx="1"
          fill="#222" stroke="#333" stroke-width="0.5"/>
        <text x="${pinLeadW + i2cBlockW/2}" y="${Math.round(totalH * 0.49)}"
          font-size="3.5" fill="#556" font-family="monospace" text-anchor="middle"
          font-weight="bold">PCF8574</text>

        <!-- ── 핀 리드 (왼쪽으로 나옴) ── -->
        ${pinYs.map((py, i) => html`
          <line x1="0" y1="${py}" x2="${pinLeadW}" y2="${py}"
            stroke="#aaaaaa" stroke-width="2" stroke-linecap="round"/>
          <!-- 핀 라벨 (I2C 블록 위에 표시) -->
          <text x="${pinLeadW + 2}" y="${py - 2}"
            font-size="3.5" fill="${pinLabels[i].color}" font-family="monospace"
            font-weight="bold">${pinLabels[i].label}</text>
        `)}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-lcd': SimLcd;
  }
}
