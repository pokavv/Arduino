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
    const armAngle = this.angle - 90;
    const rad = (armAngle * Math.PI) / 180;
    const armLen = 17;
    const cx = 30, cy = 34;
    const ax = cx + armLen * Math.sin(rad);
    const ay = cy - armLen * Math.cos(rad);
    // 암 끝 두 번째 홀 위치 (짧은 쪽)
    const shortLen = 9;
    const sx = cx + shortLen * Math.sin(rad);
    const sy = cy - shortLen * Math.cos(rad);

    return html`
      <svg width="60" height="72" viewBox="0 0 60 72" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- defs 비어 있음 (url() 없이 직접 색상 사용) -->
        </defs>

        <!-- ── 각도 표시 (상단) ── -->
        <text x="30" y="12" font-size="7" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.angle}°</text>

        <!-- ── 서보 본체 (파란 박스) ── -->
        <rect x="5" y="18" width="50" height="36" rx="4"
          fill="#2244aa" stroke="#1133aa" stroke-width="1"/>
        <!-- 본체 상단 광택 -->
        <rect x="5" y="18" width="50" height="7" rx="3"
          fill="white" opacity="0.1"/>
        <!-- 본체 하단 그림자 -->
        <rect x="5" y="48" width="50" height="6"
          fill="#0a1a55" opacity="0.5"/>

        <!-- 마운팅 귀 (좌우 돌출) -->
        <rect x="0"  y="24" width="8" height="8" rx="2"
          fill="#2244aa" stroke="#1133aa" stroke-width="0.8"/>
        <rect x="52" y="24" width="8" height="8" rx="2"
          fill="#2244aa" stroke="#1133aa" stroke-width="0.8"/>
        <!-- 마운팅 홀 -->
        <circle cx="4"  cy="28" r="2" fill="#111"/>
        <circle cx="56" cy="28" r="2" fill="#111"/>

        <!-- SG90 라벨 -->
        <text x="30" y="40" font-size="7.5" fill="#6699ee" font-family="monospace"
          text-anchor="middle" font-weight="bold">SG90</text>

        <!-- ── 상단 그레이 캡 (출력축 하우징) ── -->
        <rect x="16" y="14" width="28" height="12" rx="3"
          fill="#555" stroke="#444" stroke-width="0.8"/>
        <rect x="16" y="14" width="28" height="5" rx="3"
          fill="white" opacity="0.08"/>

        <!-- ── 서보 암 ── -->
        <g transform="rotate(${armAngle}, ${cx}, ${cy})">
          <!-- 암 몸체 -->
          <rect x="${cx - 3.5}" y="${cy - armLen}"
            width="7" height="${armLen + shortLen}"
            rx="3.5"
            fill="#cccccc" stroke="#999" stroke-width="0.8"/>
          <!-- 암 광택 -->
          <rect x="${cx - 1.5}" y="${cy - armLen}"
            width="3" height="${armLen + shortLen}"
            rx="1.5"
            fill="white" opacity="0.2"/>
          <!-- 암 끝 홀 (큰) -->
          <circle cx="${cx}" cy="${cy - armLen}" r="2.5" fill="#aaa" stroke="#777" stroke-width="0.6"/>
          <circle cx="${cx}" cy="${cy - armLen}" r="1.2" fill="#555"/>
          <!-- 암 짧은 쪽 홀 -->
          <circle cx="${cx}" cy="${cy + shortLen}" r="2.5" fill="#aaa" stroke="#777" stroke-width="0.6"/>
          <circle cx="${cx}" cy="${cy + shortLen}" r="1.2" fill="#555"/>
        </g>

        <!-- ── 출력축 허브 ── -->
        <circle cx="${cx}" cy="${cy}" r="7" fill="#777" stroke="#555" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="7" fill="white" opacity="0.06"/>
        <!-- 하이라이트 -->
        <ellipse cx="${cx - 2}" cy="${cy - 3}" rx="3" ry="2"
          fill="white" opacity="0.15" transform="rotate(-20,${cx-2},${cy-3})"/>
        <circle cx="${cx}" cy="${cy}" r="3.5" fill="#444" stroke="#666" stroke-width="0.6"/>
        <!-- 스플라인 점 6개 -->
        ${Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60 * Math.PI) / 180;
          const sx2 = (cx + 5.5 * Math.cos(a)).toFixed(2);
          const sy2 = (cy + 5.5 * Math.sin(a)).toFixed(2);
          return html`<circle cx="${sx2}" cy="${sy2}" r="0.8" fill="#888"/>`;
        })}

        <!-- ── 핀 커넥터 ── -->
        <rect x="8" y="53" width="36" height="10" rx="2"
          fill="#111" stroke="#333" stroke-width="0.8"/>
        <!-- 빨간 (VCC) -->
        <rect x="12.5" y="63" width="3" height="9" rx="0.5" fill="#cc4422"/>
        <rect x="13"   y="63" width="1.5" height="9" rx="0.3" fill="white" opacity="0.2"/>
        <!-- 갈색 (GND) -->
        <rect x="24.5" y="63" width="3" height="9" rx="0.5" fill="#6b3a2a"/>
        <rect x="25"   y="63" width="1.5" height="9" rx="0.3" fill="white" opacity="0.2"/>
        <!-- 주황 (SIGNAL) -->
        <rect x="36.5" y="63" width="3" height="9" rx="0.5" fill="#ee8800"/>
        <rect x="37"   y="63" width="1.5" height="9" rx="0.3" fill="white" opacity="0.2"/>
        <!-- 핀 라벨 -->
        <text x="9"  y="71" font-size="5" fill="#ff8888" font-family="monospace">VCC</text>
        <text x="21" y="71" font-size="5" fill="#bbaaaa" font-family="monospace">GND</text>
        <text x="34" y="71" font-size="5" fill="#ffaa44" font-family="monospace">SIG</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-servo': SimServo;
  }
}
