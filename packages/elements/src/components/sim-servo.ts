import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-servo> — SG90 서보 모터 (90×108px)
 * Pins: VCC(빨간), GND(갈색), SIGNAL(주황)
 */
@customElement('sim-servo')
export class SimServo extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 90px; height: 108px; }`,
  ];

  @property({ type: Number }) angle = 90;

  override get componentType() { return 'servo'; }
  override get pins() { return ['VCC', 'GND', 'SIGNAL']; }

  // getPinPositions: viewBox 좌표 × 1.5 (host 90×108 / viewBox 60×72 = 1.5)
  override getPinPositions() {
    return new Map([
      ['VCC',    { x: 21, y: 108 }],
      ['GND',    { x: 39, y: 108 }],
      ['SIGNAL', { x: 57, y: 108 }],
    ]);
  }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'SIGNAL') this.angle = Math.max(0, Math.min(180, v));
  }

  override render() {
    const armAngle = this.angle - 90;
    const rad = (armAngle * Math.PI) / 180;
    const armLen = 17, cx = 30, cy = 34;
    const ax = cx + armLen * Math.sin(rad);
    const ay = cy - armLen * Math.cos(rad);
    const shortLen = 9;

    return html`
      <svg width="90" height="108" viewBox="0 0 60 72" xmlns="http://www.w3.org/2000/svg">

        <!-- 각도 표시 -->
        <text x="30" y="12" font-size="7.5" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.angle}°</text>

        <!-- 서보 본체 -->
        <rect x="5" y="16" width="50" height="36" rx="4"
          fill="#2244aa" stroke="#1133aa" stroke-width="1"/>
        <rect x="5" y="16" width="50" height="7" rx="3" fill="white" opacity="0.1"/>
        <rect x="5" y="46" width="50" height="6" fill="#0a1a55" opacity="0.5"/>

        <!-- 마운팅 귀 -->
        <rect x="0"  y="22" width="8" height="8" rx="2" fill="#2244aa" stroke="#1133aa" stroke-width="0.8"/>
        <rect x="52" y="22" width="8" height="8" rx="2" fill="#2244aa" stroke="#1133aa" stroke-width="0.8"/>
        <circle cx="4"  cy="26" r="2" fill="#111"/>
        <circle cx="56" cy="26" r="2" fill="#111"/>

        <!-- SG90 라벨 -->
        <text x="30" y="38" font-size="7.5" fill="#6699ee" font-family="monospace"
          text-anchor="middle" font-weight="bold">SG90</text>

        <!-- 출력축 하우징 캡 -->
        <rect x="16" y="12" width="28" height="12" rx="3" fill="#555" stroke="#444" stroke-width="0.8"/>
        <rect x="16" y="12" width="28" height="5" rx="3" fill="white" opacity="0.08"/>

        <!-- 서보 암 -->
        <g transform="rotate(${armAngle}, ${cx}, ${cy})">
          <rect x="${cx - 3.5}" y="${cy - armLen}" width="7" height="${armLen + shortLen}"
            rx="3.5" fill="#cccccc" stroke="#999" stroke-width="0.8"/>
          <rect x="${cx - 1.5}" y="${cy - armLen}" width="3" height="${armLen + shortLen}"
            rx="1.5" fill="white" opacity="0.2"/>
          <circle cx="${cx}" cy="${cy - armLen}" r="2.5" fill="#aaa" stroke="#777" stroke-width="0.6"/>
          <circle cx="${cx}" cy="${cy - armLen}" r="1.2" fill="#555"/>
          <circle cx="${cx}" cy="${cy + shortLen}" r="2.5" fill="#aaa" stroke="#777" stroke-width="0.6"/>
          <circle cx="${cx}" cy="${cy + shortLen}" r="1.2" fill="#555"/>
        </g>

        <!-- 출력축 허브 -->
        <circle cx="${cx}" cy="${cy}" r="7" fill="#777" stroke="#555" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="7" fill="white" opacity="0.06"/>
        <ellipse cx="${cx - 2}" cy="${cy - 3}" rx="3" ry="2"
          fill="white" opacity="0.15" transform="rotate(-20,${cx - 2},${cy - 3})"/>
        <circle cx="${cx}" cy="${cy}" r="3.5" fill="#444" stroke="#666" stroke-width="0.6"/>
        ${Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60 * Math.PI) / 180;
          return html`<circle cx="${(cx + 5.5 * Math.cos(a)).toFixed(2)}"
            cy="${(cy + 5.5 * Math.sin(a)).toFixed(2)}" r="0.8" fill="#888"/>`;
        })}

        <!-- 핀 커넥터 블록 -->
        <rect x="8" y="51" width="36" height="10" rx="2" fill="#111" stroke="#333" stroke-width="0.8"/>

        <!-- 핀 다리 (VCC=빨강, GND=갈색, SIGNAL=주황) -->
        <rect x="12.5" y="61" width="3" height="11" rx="0.5" fill="#cc4422"/>
        <rect x="13"   y="61" width="1.5" height="11" fill="white" opacity="0.2"/>
        <rect x="24.5" y="61" width="3" height="11" rx="0.5" fill="#6b3a2a"/>
        <rect x="25"   y="61" width="1.5" height="11" fill="white" opacity="0.2"/>
        <rect x="36.5" y="61" width="3" height="11" rx="0.5" fill="#ee8800"/>
        <rect x="37"   y="61" width="1.5" height="11" fill="white" opacity="0.2"/>

        <!-- 핀 라벨 -->
        <text x="9"  y="59" font-size="5.5" fill="#ff9988" font-family="monospace" font-weight="bold">VCC</text>
        <text x="21" y="59" font-size="5.5" fill="#bbaaaa" font-family="monospace" font-weight="bold">GND</text>
        <text x="33" y="59" font-size="5.5" fill="#ffaa44" font-family="monospace" font-weight="bold">SIG</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-servo': SimServo; }
}
