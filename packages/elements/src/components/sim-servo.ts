import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-servo> — SG90 서보 모터
 *
 * Pins: VCC(빨간), GND(갈색), SIGNAL(주황)
 */
@customElement('sim-servo')
export class SimServo extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 60px; height: 72px; }`,
  ];

  @property({ type: Number }) angle = 90;

  override get componentType() { return 'servo'; }
  override get pins() { return ['VCC', 'GND', 'SIGNAL']; }

  override getPinPositions() {
    return new Map([
      ['VCC',    { x: 14, y: 72 }],
      ['GND',    { x: 26, y: 72 }],
      ['SIGNAL', { x: 38, y: 72 }],
    ]);
  }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'SIGNAL') {
      // value: 0~180 (도)
      this.angle = Math.max(0, Math.min(180, v));
    }
  }

  override render() {
    // 암 회전: 0도=왼쪽, 90도=위, 180도=오른쪽
    const armAngle = this.angle - 90; // -90 ~ +90 → 0위 기준
    const rad = (armAngle * Math.PI) / 180;
    const armLen = 18;
    const cx = 30, cy = 36;
    const ax = cx + armLen * Math.sin(rad);
    const ay = cy - armLen * Math.cos(rad);

    return html`
      <svg width="60" height="72" viewBox="0 0 60 72">
        <!-- 몸체 -->
        <rect x="6" y="16" width="48" height="38" rx="4" fill="#2244aa" stroke="#1133cc" stroke-width="1"/>
        <rect x="10" y="20" width="40" height="30" rx="2" fill="#1a3388"/>
        <!-- 라벨 -->
        <text x="30" y="38" font-size="7" fill="#8af" font-family="monospace" text-anchor="middle">SG90</text>

        <!-- 출력축 -->
        <circle cx="${cx}" cy="${cy}" r="8" fill="#444" stroke="#666" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="4" fill="#555"/>

        <!-- 암 -->
        <line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}"
          stroke="#ddd" stroke-width="4" stroke-linecap="round"/>
        <circle cx="${ax}" cy="${ay}" r="3" fill="#aaa"/>
        <circle cx="${cx}" cy="${cy}" r="2.5" fill="#888"/>

        <!-- 각도 표시 -->
        <text x="30" y="13" font-size="7" fill="#8af" font-family="monospace" text-anchor="middle">
          ${this.angle}°
        </text>

        <!-- 핀 3개 -->
        <line x1="14" y1="54" x2="14" y2="72" stroke="#a52" stroke-width="2"/>
        <line x1="26" y1="54" x2="26" y2="72" stroke="#aaa" stroke-width="2"/>
        <line x1="38" y1="54" x2="38" y2="72" stroke="#fa0" stroke-width="2"/>
        <text x="9"  y="71" font-size="5" fill="#a52" font-family="monospace">V</text>
        <text x="21" y="71" font-size="5" fill="#aaa" font-family="monospace">G</text>
        <text x="34" y="71" font-size="5" fill="#fa0" font-family="monospace">S</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-servo': SimServo;
  }
}
