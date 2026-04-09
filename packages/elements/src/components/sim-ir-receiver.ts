import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-ir-receiver> — TSOP38238 IR 수신기 (45×68px)
 * 실물: 검은 반구형 돔, 3핀 플라스틱 베이스
 * Pins: VCC, GND, OUT
 */
@customElement('sim-ir-receiver')
export class SimIrReceiver extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 45px; height: 68px; }`,
  ];

  @property({ type: Boolean, reflect: true }) receiving = false;

  override get componentType() { return 'ir-receiver'; }
  override get pins() { return ['VCC', 'GND', 'OUT']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'OUT') {
      // TSOP: Active LOW — 신호 수신 시 OUT = LOW(0)
      this.receiving = v === 0;
    }
  }

  override getPinPositions() {
    return new Map([
      ['VCC', { x: 8,  y: 68 }],
      ['GND', { x: 22, y: 68 }],
      ['OUT', { x: 36, y: 68 }],
    ]);
  }

  override render() {
    const rxGlow = this.receiving ? 0.7 : 0;

    return html`
      <svg width="45" height="68" viewBox="0 0 45 68" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 돔 내부 그라디언트 -->
          <radialGradient id="rx-dome-${this.compId}" cx="38%" cy="32%" r="60%">
            <stop offset="0%"   stop-color="#444444" stop-opacity="1"/>
            <stop offset="60%"  stop-color="#1a1a1a" stop-opacity="1"/>
            <stop offset="100%" stop-color="#0d0d0d" stop-opacity="1"/>
          </radialGradient>
          <!-- 수신 글로우 -->
          <radialGradient id="rx-glow-${this.compId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#ff4400" stop-opacity="${rxGlow * 0.6}"/>
            <stop offset="100%" stop-color="#ff4400" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- ── TSOP38238 반구형 몸체 ── -->

        <!-- 3핀 플라스틱 베이스 (직사각형) -->
        <rect x="2" y="26" width="41" height="18" rx="2"
          fill="#1a1a1a" stroke="#333333" stroke-width="0.8"/>
        <!-- 베이스 상단 하이라이트 -->
        <rect x="2" y="26" width="41" height="3" rx="2"
          fill="white" opacity="0.06"/>
        <!-- 베이스 하단 그림자 -->
        <rect x="2" y="38" width="41" height="6" rx="1"
          fill="black" opacity="0.3"/>

        <!-- 몸체 측면 텍스트 (TSOP38238) -->
        <text x="22.5" y="37" font-size="4.5" fill="#555555" font-family="monospace"
          text-anchor="middle" font-weight="bold">TSOP38238</text>

        <!-- 반구형 돔 (검은 에폭시) -->
        <!-- 돔 배경 글로우 (수신 중) -->
        <ellipse cx="22.5" cy="20" rx="18" ry="18"
          fill="url(#rx-glow-${this.compId})"/>
        <!-- 실제 돔 -->
        <ellipse cx="22.5" cy="22" rx="16" ry="14"
          fill="url(#rx-dome-${this.compId})"
          stroke="${this.receiving ? '#ff440066' : '#333333'}" stroke-width="0.8"/>
        <!-- 돔 하이라이트 -->
        <ellipse cx="16" cy="14" rx="5" ry="3"
          fill="white" opacity="0.12" transform="rotate(-20,16,14)"/>
        <!-- 돔 하단 경계 -->
        <ellipse cx="22.5" cy="22" rx="16" ry="4"
          fill="black" opacity="0.25"/>

        <!-- 수신 표시 LED (신호 수신 시 작은 빨간 점) -->
        <circle cx="22.5" cy="16" r="2.5"
          fill="${this.receiving ? '#ff3300' : '#220000'}"
          opacity="${this.receiving ? 0.9 : 0.4}"/>
        ${this.receiving ? html`
          <circle cx="22.5" cy="16" r="4"
            fill="none" stroke="#ff440088" stroke-width="0.8"/>
        ` : ''}

        <!-- 핀 리드 -->
        <!-- VCC -->
        <line x1="8"  y1="44" x2="8"  y2="64" stroke="#cc4433" stroke-width="1.8"/>
        <line x1="8"  y1="44" x2="8"  y2="64" stroke="white" stroke-width="0.5" opacity="0.25"/>
        <!-- GND -->
        <line x1="22" y1="44" x2="22" y2="64" stroke="#666666" stroke-width="1.8"/>
        <line x1="22" y1="44" x2="22" y2="64" stroke="white" stroke-width="0.5" opacity="0.2"/>
        <!-- OUT -->
        <line x1="36" y1="44" x2="36" y2="64" stroke="#4477cc" stroke-width="1.8"/>
        <line x1="36" y1="44" x2="36" y2="64" stroke="white" stroke-width="0.5" opacity="0.25"/>

        <!-- 핀 라벨 존 -->
        <rect x="0" y="55" width="45" height="13" fill="#0d0d14"/>
        <line x1="0" y1="55" x2="45" y2="55" stroke="#252535" stroke-width="0.5"/>
        <text x="8"  y="64" font-size="7" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">VCC</text>
        <text x="22" y="64" font-size="7" fill="#88ee99" font-family="monospace"
          text-anchor="middle" font-weight="bold">GND</text>
        <text x="36" y="64" font-size="7" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">OUT</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-ir-receiver': SimIrReceiver; }
}
