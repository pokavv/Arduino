import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-ultrasonic> — HC-SR04 초음파 센서 (102×90px)
 * Pins: VCC, TRIG, ECHO, GND
 */
@customElement('sim-ultrasonic')
export class SimUltrasonic extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 102px; height: 90px; }`,
  ];

  @property({ type: Number }) distanceCm = 20;
  @property({ type: Boolean }) trigActive = false;

  override get componentType() { return 'ultrasonic'; }
  override get pins() { return ['VCC', 'TRIG', 'ECHO', 'GND']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'DIST' || pin === 'distanceCm' || pin === 'ECHO') {
      this.distanceCm = Math.max(2, Math.min(400, v));
    } else if (pin === 'TRIG') {
      this.trigActive = v > 0;
    }
  }

  // getPinPositions: viewBox(68×60) × 1.5 = host(102×90)
  // VCC  x=9×1.5=13.5≈14,  TRIG x=25×1.5=37.5≈38
  // ECHO x=43×1.5=64.5≈65, GND  x=59×1.5=88.5≈89
  override getPinPositions() {
    return new Map([
      ['VCC',  { x: 14, y: 90 }],
      ['TRIG', { x: 38, y: 90 }],
      ['ECHO', { x: 65, y: 90 }],
      ['GND',  { x: 89, y: 90 }],
    ]);
  }

  private _transducer(cx: number, cy: number, active: boolean) {
    const rings = [10, 7.5, 5.5, 3.2, 1.5];
    return html`
      <circle cx="${cx}" cy="${cy}" r="11" fill="#787878" stroke="#555" stroke-width="0.8"/>
      <circle cx="${cx}" cy="${cy}" r="10" fill="#555555"/>
      <circle cx="${cx}" cy="${cy}" r="10" fill="white" opacity="0.08"/>
      ${rings.map((r, i) => html`
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
          stroke="${active
            ? (i < 2 ? '#6be06b' : i < 4 ? '#4ab04a' : '#2a802a')
            : (i < 2 ? '#666' : i < 4 ? '#3a4a3a' : '#2a3a2a')}"
          stroke-width="${i === 0 ? 0.9 : 0.6}"/>
      `)}
      <circle cx="${cx}" cy="${cy}" r="1.8" fill="${active ? '#88ff88' : '#3a3a3a'}"/>
      <ellipse cx="${cx - 3.5}" cy="${cy - 5}" rx="3" ry="1.8"
        fill="white" opacity="0.12" transform="rotate(-20,${cx - 3.5},${cy - 5})"/>
      ${active ? html`
        <circle cx="${cx}" cy="${cy}" r="13" fill="none"
          stroke="#44ff44" stroke-width="0.8" opacity="0.5"/>
        <circle cx="${cx}" cy="${cy}" r="15.5" fill="none"
          stroke="#44ff44" stroke-width="0.5" opacity="0.3"/>
      ` : ''}
    `;
  }

  override render() {
    return html`
      <svg width="102" height="90" viewBox="0 0 68 60" xmlns="http://www.w3.org/2000/svg">

        <!-- 초록 PCB -->
        <rect x="0" y="0" width="68" height="40" rx="4"
          fill="#1a4a1a" stroke="#0a3010" stroke-width="1"/>
        <rect x="0" y="0" width="68" height="5" rx="3" fill="white" opacity="0.08"/>
        <rect x="0" y="32" width="68" height="8" fill="#0a2a0a" opacity="0.4"/>

        <!-- 구리 패드 -->
        ${[9, 25, 43, 59].map(x => html`
          <rect x="${x - 3}" y="33" width="6" height="5" rx="1" fill="#c08030" opacity="0.75"/>
        `)}

        <!-- 라벨 -->
        <text x="34" y="11" font-size="6.5" fill="#4fcc4f" font-family="monospace"
          text-anchor="middle" font-weight="bold">HC-SR04</text>
        <text x="34" y="21" font-size="6" fill="#3ab03a" font-family="monospace"
          text-anchor="middle">${this.distanceCm} cm</text>

        <!-- 트랜스듀서 (T / R) -->
        ${this._transducer(17, 20, this.trigActive)}
        <text x="17" y="35.5" font-size="5.5" fill="#5fcc5f" font-family="monospace"
          text-anchor="middle">T</text>
        ${this._transducer(51, 20, false)}
        <text x="51" y="35.5" font-size="5.5" fill="#5fcc5f" font-family="monospace"
          text-anchor="middle">R</text>

        <!-- 핀 금속 — VCC=빨강, TRIG=주황, ECHO=파랑, GND=회색 -->
        <rect x="7.5"  y="40" width="3" height="20" rx="0.5" fill="#cc4433"/>
        <rect x="8.2"  y="40" width="1.2" height="20" fill="white" opacity="0.25"/>
        <rect x="23.5" y="40" width="3" height="20" rx="0.5" fill="#cc8800"/>
        <rect x="24.2" y="40" width="1.2" height="20" fill="white" opacity="0.25"/>
        <rect x="41.5" y="40" width="3" height="20" rx="0.5" fill="#4477cc"/>
        <rect x="42.2" y="40" width="1.2" height="20" fill="white" opacity="0.25"/>
        <rect x="57.5" y="40" width="3" height="20" rx="0.5" fill="#666666"/>
        <rect x="58.2" y="40" width="1.2" height="20" fill="white" opacity="0.2"/>

        <!-- 핀 라벨 존 (Wokwi 스타일) -->
        <rect x="0" y="49" width="68" height="11" fill="#0d0d14"/>
        <line x1="0" y1="49" x2="68" y2="49" stroke="#252535" stroke-width="0.5"/>

        <text x="9"  y="58" font-size="7" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">VCC</text>
        <text x="25" y="58" font-size="7" fill="#ffcc55" font-family="monospace"
          text-anchor="middle" font-weight="bold">TRG</text>
        <text x="43" y="58" font-size="7" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">ECH</text>
        <text x="59" y="58" font-size="7" fill="#88ee99" font-family="monospace"
          text-anchor="middle" font-weight="bold">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-ultrasonic': SimUltrasonic; }
}
