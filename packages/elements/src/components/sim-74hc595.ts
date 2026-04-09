import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-74hc595> — 74HC595 시프트 레지스터 (DIP-16, 60x114px)
 * Pins: QA~QH (좌 x=0, y=10~108), VCC/OE/ST_CP/MR/SH_CP/DS/QH'/GND (우 x=60, y=10~108)
 */
@customElement('sim-74hc595')
export class Sim74hc595 extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 60px; height: 114px; }`,
  ];

  @property({ type: Number }) outputByte = 0;

  private _shiftReg = 0;
  private _dsLast = 0;
  private _shCpLast = 0;

  override get componentType() { return '74hc595'; }
  override get pins() {
    return ['QA','QB','QC','QD','QE','QF','QG','QH','VCC','OE','ST_CP','MR','SH_CP','DS','QH_PRIME','GND'];
  }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    const high = v > 0;
    if (pin === 'DS') { this._dsLast = high ? 1 : 0; }
    if (pin === 'SH_CP') {
      if (high && this._shCpLast === 0) {
        this._shiftReg = ((this._shiftReg << 1) | this._dsLast) & 0xFF;
      }
      this._shCpLast = high ? 1 : 0;
    }
    if (pin === 'ST_CP' && high) {
      this.outputByte = this._shiftReg;
      this.requestUpdate();
    }
    if (pin === 'MR' && !high) {
      this._shiftReg = 0;
      this.outputByte = 0;
      this.requestUpdate();
    }
  }

  override getPinPositions() {
    return new Map([
      ['QA',       { x:  0, y: 10  }],
      ['QB',       { x:  0, y: 24  }],
      ['QC',       { x:  0, y: 38  }],
      ['QD',       { x:  0, y: 52  }],
      ['QE',       { x:  0, y: 66  }],
      ['QF',       { x:  0, y: 80  }],
      ['QG',       { x:  0, y: 94  }],
      ['QH',       { x:  0, y: 108 }],
      ['VCC',      { x: 60, y: 10  }],
      ['OE',       { x: 60, y: 24  }],
      ['ST_CP',    { x: 60, y: 38  }],
      ['MR',       { x: 60, y: 52  }],
      ['SH_CP',    { x: 60, y: 66  }],
      ['DS',       { x: 60, y: 80  }],
      ['QH_PRIME', { x: 60, y: 94  }],
      ['GND',      { x: 60, y: 108 }],
    ]);
  }

  override render() {
    const outputs = ['QA','QB','QC','QD','QE','QF','QG','QH'];
    const leftPins  = ['QA','QB','QC','QD','QE','QF','QG','QH'];
    const rightPins = ['VCC','OE','ST_CP','MR','SH_CP','DS','QH\'','GND'];
    const pinColors: Record<string, string> = {
      VCC:'#ff8877', GND:'#88ee99', DS:'#88aaff', SH_CP:'#ffcc55',
      ST_CP:'#ff88cc', MR:'#ff6644', OE:'#aaddff',
    };

    return html`
      <svg width="60" height="114" viewBox="0 0 16 30" xmlns="http://www.w3.org/2000/svg">
        <!-- DIP IC 패키지 그림자 -->
        <rect x="3.3" y="0.3" width="9.4" height="29.4" rx="0.5"
          fill="black" opacity="0.35"/>

        <!-- IC 바디 (검은색) -->
        <rect x="3" y="0" width="10" height="30" rx="0.5"
          fill="#1a1a1a" stroke="#2a2a2a" stroke-width="0.3"/>

        <!-- IC 바디 상단 하이라이트 -->
        <rect x="3" y="0" width="10" height="1.5" rx="0.5"
          fill="white" opacity="0.05"/>

        <!-- 노치 (상단 중앙 반원) -->
        <path d="M 7 0 A 1 1 0 0 0 9 0" fill="#0a0a0a" stroke="#333" stroke-width="0.2"/>

        <!-- IC 마킹 -->
        <text x="8" y="8" font-size="1.3" fill="#888" font-family="monospace"
          text-anchor="middle" font-weight="bold">74HC</text>
        <text x="8" y="10.5" font-size="1.3" fill="#888" font-family="monospace"
          text-anchor="middle" font-weight="bold">595</text>

        <!-- 출력 비트 표시 (8개 LED 점) -->
        ${outputs.map((q, i) => {
          const bit = (this.outputByte >> (7 - i)) & 1;
          return html`
            <circle cx="6" cy="${6.5 + i * 2.5}" r="0.55"
              fill="${bit ? '#44ff44' : '#1a3a1a'}"
              stroke="${bit ? '#22cc22' : '#0a1a0a'}" stroke-width="0.15"/>
          `;
        })}

        <!-- 좌측 핀 리드 (QA~QH) -->
        ${leftPins.map((name, i) => {
          const y = (i * 2.5) + 0.7;
          const bit = (this.outputByte >> (7 - i)) & 1;
          return html`
            <rect x="0" y="${y + 2}" width="3" height="0.8" rx="0.3"
              fill="#c0c0c0" stroke="#888" stroke-width="0.1"/>
            <text x="2.6" y="${y + 2.7}" font-size="1.0" fill="${bit ? '#44ff44' : '#556'}"
              font-family="monospace" text-anchor="end">${name}</text>
          `;
        })}

        <!-- 우측 핀 리드 (VCC/OE/ST_CP...) -->
        ${rightPins.map((name, i) => {
          const y = (i * 2.5) + 0.7;
          const key = name.replace("'", '_PRIME');
          const color = pinColors[name] ?? '#aaaaaa';
          return html`
            <rect x="13" y="${y + 2}" width="3" height="0.8" rx="0.3"
              fill="#c0c0c0" stroke="#888" stroke-width="0.1"/>
            <text x="13.4" y="${y + 2.7}" font-size="1.0" fill="${color}"
              font-family="monospace">${name}</text>
          `;
        })}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-74hc595': Sim74hc595; }
}
