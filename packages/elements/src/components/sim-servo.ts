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
      <svg width="60" height="72" viewBox="0 0 60 72">
        <defs>
          <!-- SG90 파란 몸체 -->
          <linearGradient id="servoBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#4466cc"/>
            <stop offset="40%"  stop-color="#2244aa"/>
            <stop offset="100%" stop-color="#112266"/>
          </linearGradient>
          <!-- 상단 케이스 (회색 상단 캡) -->
          <linearGradient id="servoCaseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#666"/>
            <stop offset="100%" stop-color="#333"/>
          </linearGradient>
          <!-- 출력축 금속 -->
          <radialGradient id="servoHubGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stop-color="#aaa"/>
            <stop offset="55%"  stop-color="#666"/>
            <stop offset="100%" stop-color="#333"/>
          </radialGradient>
          <!-- 서보 암 -->
          <linearGradient id="servoArmGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stop-color="#e0e0e0"/>
            <stop offset="100%" stop-color="#aaa"/>
          </linearGradient>
          <!-- 핀 -->
          <linearGradient id="servoPinGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stop-color="#999"/>
            <stop offset="50%"  stop-color="#eee"/>
            <stop offset="100%" stop-color="#999"/>
          </linearGradient>
        </defs>

        <!-- 각도 표시 (상단) -->
        <text x="30" y="12" font-size="7" fill="#8af" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.angle}°</text>

        <!-- 서보 본체 하단 (파란 박스) -->
        <rect x="5" y="18" width="50" height="36" rx="4"
          fill="url(#servoBodyGrad)" stroke="#1133aa" stroke-width="1"/>
        <!-- 하단 마운팅 귀 (좌우 돌출) -->
        <rect x="0"  y="24" width="8"  height="8" rx="2"
          fill="url(#servoBodyGrad)" stroke="#1133aa" stroke-width="0.8"/>
        <rect x="52" y="24" width="8"  height="8" rx="2"
          fill="url(#servoBodyGrad)" stroke="#1133aa" stroke-width="0.8"/>
        <!-- 마운팅 홀 -->
        <circle cx="4"  cy="28" r="2" fill="#111"/>
        <circle cx="56" cy="28" r="2" fill="#111"/>

        <!-- 본체 하이라이트 라인 -->
        <rect x="5" y="18" width="50" height="6" rx="3"
          fill="white" opacity="0.1"/>

        <!-- SG90 라벨 -->
        <text x="30" y="40" font-size="7.5" fill="#6699ee" font-family="monospace"
          text-anchor="middle" font-weight="bold">SG90</text>

        <!-- 상단 그레이 캡 (출력축 하우징) -->
        <rect x="16" y="14" width="28" height="12" rx="3"
          fill="url(#servoCaseGrad)" stroke="#444" stroke-width="0.8"/>

        <!-- 서보 암 (출력축 위에 그려짐) -->
        <g transform="rotate(${armAngle}, ${cx}, ${cy})">
          <!-- 암 몸체 (양쪽 홀 포함한 직사각 바) -->
          <rect x="${cx - 3.5}" y="${cy - armLen}"
            width="7" height="${armLen + shortLen}"
            rx="3.5"
            fill="url(#servoArmGrad)" stroke="#999" stroke-width="0.8"/>
          <!-- 암 끝 홀 -->
          <circle cx="${cx}" cy="${cy - armLen}" r="2.5" fill="#aaa" stroke="#777" stroke-width="0.6"/>
          <circle cx="${cx}" cy="${cy - armLen}" r="1.2" fill="#555"/>
          <!-- 암 짧은 쪽 홀 -->
          <circle cx="${cx}" cy="${cy + shortLen}" r="2.5" fill="#aaa" stroke="#777" stroke-width="0.6"/>
          <circle cx="${cx}" cy="${cy + shortLen}" r="1.2" fill="#555"/>
        </g>

        <!-- 출력축 허브 -->
        <circle cx="${cx}" cy="${cy}" r="7"
          fill="url(#servoHubGrad)" stroke="#555" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="3.5" fill="#444" stroke="#666" stroke-width="0.6"/>
        <!-- 허브 스플라인 (작은 점 6개) -->
        ${Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60 * Math.PI) / 180;
          const sx2 = (cx + 5.5 * Math.cos(a)).toFixed(2);
          const sy2 = (cy + 5.5 * Math.sin(a)).toFixed(2);
          return html`<circle cx="${sx2}" cy="${sy2}" r="0.8" fill="#888"/>`;
        })}

        <!-- 핀 커넥터 하우징 (검은 박스) -->
        <rect x="8" y="53" width="36" height="10" rx="2"
          fill="#111" stroke="#333" stroke-width="0.8"/>
        <!-- 핀 3개 -->
        <rect x="12.5" y="63" width="3" height="9" rx="0.5" fill="#a52"/>
        <rect x="24.5" y="63" width="3" height="9" rx="0.5" fill="url(#servoPinGrad)"/>
        <rect x="36.5" y="63" width="3" height="9" rx="0.5" fill="#fa0"/>
        <!-- 핀 라벨 (색으로 구분) -->
        <text x="9"  y="71" font-size="5" fill="#f88" font-family="monospace">VCC</text>
        <text x="21" y="71" font-size="5" fill="#ccc" font-family="monospace">GND</text>
        <text x="34" y="71" font-size="5" fill="#fa0" font-family="monospace">SIG</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-servo': SimServo;
  }
}
