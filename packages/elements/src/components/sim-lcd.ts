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
    // SVG 렌더에서 핀 배치: ['GND','VCC','SDA','SCL'].map((p,i) => x1="${14 + i*18}")
    // h = padY*2 + rows*charH + (rows-1)*2 = 20 + rows*14 + (rows-1)*2
    const h = 20 + this.rows * 14 + (this.rows - 1) * 2;
    const pinY = h + 8; // 핀 선 중간 (y1=h+4, y2=h+12)
    return new Map([
      ['GND', { x: 14, y: pinY }],
      ['VCC', { x: 32, y: pinY }],
      ['SDA', { x: 50, y: pinY }],
      ['SCL', { x: 68, y: pinY }],
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
    const padX = 12;
    const padY = 10;
    const w = padX * 2 + this.cols * charW;
    const h = padY * 2 + this.rows * charH + (this.rows - 1) * 2;
    const bgColor = this._backlight ? '#4a8c5c' : '#2a4a2a';

    return html`
      <svg width="${w + 20}" height="${h + 24}" viewBox="0 0 ${w + 20} ${h + 24}">
        <!-- PCB 기판 -->
        <rect x="0" y="0" width="${w + 20}" height="${h + 24}" rx="4" fill="#1a3a1a" stroke="#2a5a2a" stroke-width="1"/>
        <!-- LCD 화면 -->
        <rect x="10" y="4" width="${w}" height="${h}" rx="3" fill="${bgColor}" stroke="#1a4a1a" stroke-width="1"/>

        <!-- 문자 셀들 -->
        ${this._buffer.map((row, ri) =>
          row.map((ch, ci) => {
            const cx = padX + ci * charW + 10;
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

        <!-- I2C 핀 라벨 -->
        <text x="12" y="${h + 18}" font-size="7" fill="#888" font-family="monospace">GND VCC SDA SCL</text>
        <!-- 핀 4개 -->
        ${['GND','VCC','SDA','SCL'].map((p, i) => html`
          <line x1="${14 + i*18}" y1="${h + 4}" x2="${14 + i*18}" y2="${h + 12}" stroke="#aaa" stroke-width="2"/>
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
