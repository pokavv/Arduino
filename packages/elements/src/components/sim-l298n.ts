import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-l298n> — L298N 모터 드라이버 모듈 (150x152px)
 * Pins: ENA/IN1/IN2/IN3/IN4/ENB (우), OUT1/OUT2/OUT3/OUT4 (상), VIN/GND/5V (하)
 */
@customElement('sim-l298n')
export class SimL298n extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 150px; height: 152px; }`,
  ];

  @property({ type: Number }) speedA = 0;
  @property({ type: Number }) speedB = 0;
  private _pins: Record<string, number> = { ENA:1, IN1:0, IN2:0, IN3:0, IN4:0, ENB:1 };

  override get componentType() { return 'l298n'; }
  override get pins() { return ['ENA','IN1','IN2','IN3','IN4','ENB','OUT1','OUT2','OUT3','OUT4','VIN','GND','5V']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    this._pins[pin] = v;
    if (pin === 'ENA') this.speedA = v;
    if (pin === 'ENB') this.speedB = v;
    this.requestUpdate();
  }

  override getPinPositions() {
    return new Map([
      ['ENA',  { x: 150, y: 20  }],
      ['IN1',  { x: 150, y: 38  }],
      ['IN2',  { x: 150, y: 56  }],
      ['IN3',  { x: 150, y: 74  }],
      ['IN4',  { x: 150, y: 92  }],
      ['ENB',  { x: 150, y: 110 }],
      ['OUT1', { x: 30,  y: 0   }],
      ['OUT2', { x: 60,  y: 0   }],
      ['OUT3', { x: 90,  y: 0   }],
      ['OUT4', { x: 120, y: 0   }],
      ['VIN',  { x: 15,  y: 152 }],
      ['GND',  { x: 40,  y: 152 }],
      ['5V',   { x: 65,  y: 152 }],
    ]);
  }

  override render() {
    const in1 = this._pins['IN1'] > 0, in2 = this._pins['IN2'] > 0;
    const in3 = this._pins['IN3'] > 0, in4 = this._pins['IN4'] > 0;
    const motorADir = in1 && !in2 ? 'CW' : (!in1 && in2 ? 'CCW' : (in1 && in2 ? 'BRAKE' : 'STOP'));
    const motorBDir = in3 && !in4 ? 'CW' : (!in3 && in4 ? 'CCW' : (in3 && in4 ? 'BRAKE' : 'STOP'));
    const dirColor = (d: string) => d === 'CW' ? '#44ff44' : d === 'CCW' ? '#ff8844' : d === 'BRAKE' ? '#ff4444' : '#444';

    return html`
      <svg width="150" height="152" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <!-- PCB -->
        <rect x="0" y="0" width="40" height="40" rx="1"
          fill="#1a3a8a" stroke="#0d2060" stroke-width="0.4"/>
        <rect x="0" y="0" width="40" height="2" rx="1" fill="white" opacity="0.04"/>

        <!-- L298N IC 메인 칩 -->
        <rect x="8" y="10" width="16" height="18" rx="0.5"
          fill="#0d0d0d" stroke="#1a1a1a" stroke-width="0.3"/>
        <!-- IC 방열판 (알루미늄) -->
        <rect x="7" y="8" width="18" height="3" rx="0.4"
          fill="#b0b0b0" stroke="#808080" stroke-width="0.3"/>
        <!-- 방열판 핀 -->
        ${Array.from({ length: 7 }, (_, i) => html`
          <rect x="${8.2 + i * 2.2}" y="6.5" width="1.4" height="1.8" rx="0.2" fill="#c0c0c0"/>
        `)}
        <!-- IC 텍스트 -->
        <text x="16" y="17" font-size="2" fill="#888" font-family="monospace"
          text-anchor="middle" font-weight="bold">L298N</text>

        <!-- 모터 A 상태 표시 -->
        <rect x="1" y="12" width="6" height="7" rx="0.5" fill="#0a1a3a" stroke="#1a3060" stroke-width="0.2"/>
        <text x="4" y="14.5" font-size="1.3" fill="#aaaaaa" font-family="monospace" text-anchor="middle">MOT-A</text>
        <text x="4" y="17.5" font-size="1.6" fill="${dirColor(motorADir)}" font-family="monospace"
          text-anchor="middle" font-weight="bold">${motorADir}</text>

        <!-- 모터 B 상태 표시 -->
        <rect x="33" y="12" width="6" height="7" rx="0.5" fill="#0a1a3a" stroke="#1a3060" stroke-width="0.2"/>
        <text x="36" y="14.5" font-size="1.3" fill="#aaaaaa" font-family="monospace" text-anchor="middle">MOT-B</text>
        <text x="36" y="17.5" font-size="1.6" fill="${dirColor(motorBDir)}" font-family="monospace"
          text-anchor="middle" font-weight="bold">${motorBDir}</text>

        <!-- 상단 스크류 터미널 (OUT1~4) -->
        ${[8, 15, 23, 30].map((x, i) => html`
          <rect x="${x}" y="0" width="5" height="4" rx="0.4"
            fill="#2a2a2a" stroke="#111" stroke-width="0.2"/>
          <circle cx="${x + 2.5}" cy="2" r="1" fill="#555" stroke="#333" stroke-width="0.2"/>
          <line x1="${x + 2.5}" y1="1.2" x2="${x + 2.5}" y2="2.8" stroke="#888" stroke-width="0.4"/>
          <text x="${x + 2.5}" y="5.5" font-size="1.3" fill="#aaaaaa" font-family="monospace"
            text-anchor="middle">OUT${i + 1}</text>
        `)}

        <!-- 우측 핀 헤더 -->
        ${['ENA','IN1','IN2','IN3','IN4','ENB'].map((name, i) => {
          const colors: Record<string, string> = {ENA:'#ffcc55',IN1:'#88aaff',IN2:'#88aaff',IN3:'#ff88cc',IN4:'#ff88cc',ENB:'#aaffcc'};
          return html`
            <circle cx="38.5" cy="${5.3 + i * 4.8}" r="0.8"
              fill="${this._pins[name] > 0 ? colors[name] : '#1a2a3a'}"
              stroke="#333" stroke-width="0.2"/>
            <text x="37" y="${5.7 + i * 4.8}" font-size="1.3" fill="${colors[name]}"
              font-family="monospace" text-anchor="end">${name}</text>
          `;
        })}

        <!-- 하단 전원 터미널 (VIN, GND, 5V) -->
        ${[4, 10, 17].map((x, i) => {
          const labels = ['VIN','GND','5V'];
          const tcolors = ['#ff8877','#88ee99','#ffaa44'];
          return html`
            <rect x="${x}" y="36" width="5" height="4" rx="0.4"
              fill="#2a2a2a" stroke="#111" stroke-width="0.2"/>
            <circle cx="${x + 2.5}" cy="38" r="1" fill="#555" stroke="#333" stroke-width="0.2"/>
            <text x="${x + 2.5}" y="35.5" font-size="1.3" fill="${tcolors[i]}" font-family="monospace"
              text-anchor="middle">${labels[i]}</text>
          `;
        })}

        <!-- 전원 LED (빨간) -->
        <circle cx="28" cy="33" r="1.2"
          fill="#ff2200" stroke="#cc1100" stroke-width="0.3"/>
        <circle cx="28" cy="33" r="0.6" fill="white" opacity="0.4"/>
        <text x="28" y="36.5" font-size="1.2" fill="#ff8877" font-family="monospace" text-anchor="middle">PWR</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-l298n': SimL298n; }
}
