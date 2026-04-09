import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-dht> — DHT11 / DHT22 온습도 센서
 *
 * Pins: VCC, DATA, GND
 * DHT22: 흰색/파란 반원형 패키지
 * DHT11: 파란 직사각형 패키지
 */
@customElement('sim-dht')
export class SimDht extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 44px; height: 62px; }`,
  ];

  @property({ type: String }) model: 'DHT11' | 'DHT22' = 'DHT22';
  @property({ type: Number }) temperature = 25.0;
  @property({ type: Number }) humidity = 60.0;

  override get componentType() { return 'dht'; }
  override get pins() { return ['VCC', 'DATA', 'GND']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'TEMP' || pin === 'temperature') {
      this.temperature = v;
    } else if (pin === 'HUM' || pin === 'humidity') {
      this.humidity = v;
    } else if (pin === 'DATA') {
      try {
        const data = typeof value === 'string' ? JSON.parse(value) : {};
        if (data.temperature !== undefined) this.temperature = data.temperature;
        if (data.humidity    !== undefined) this.humidity    = data.humidity;
      } catch { /* ignore */ }
    }
  }

  override getPinPositions() {
    return new Map([
      ['VCC',  { x: 10, y: 62 }],
      ['DATA', { x: 22, y: 62 }],
      ['GND',  { x: 34, y: 62 }],
    ]);
  }

  override render() {
    const isDHT22 = this.model === 'DHT22';
    // 몸체 색상: DHT22=파랑, DHT11=파랑(더 진한)
    const bodyMain   = isDHT22 ? '#1e68aa'  : '#1a4a8a';
    const bodyLight  = isDHT22 ? '#3a88cc'  : '#2266aa';
    const bodyDark   = isDHT22 ? '#0d3a6a'  : '#0a2a5a';
    const topRadius  = isDHT22 ? 18 : 4;

    // 센싱 격자 영역
    const gX = 8, gY = 5, gW = 28, gH = 22;
    const cellW = gW / 4, cellH = gH / 4;

    return html`
      <svg width="44" height="62" viewBox="0 0 44 62" xmlns="http://www.w3.org/2000/svg">

        <!-- ── 몸체 기반 레이어 (진한 파란색) ── -->
        <rect x="4" y="0" width="36" height="46"
          rx="${topRadius}" ry="${isDHT22 ? 18 : 4}"
          fill="${bodyMain}" stroke="#1855aa" stroke-width="1"/>

        <!-- 몸체 상단 광택 레이어 -->
        <rect x="4" y="0" width="36" height="8" rx="${topRadius}"
          fill="${bodyLight}" opacity="0.4"/>

        <!-- 몸체 측면 그림자 (깊이감) -->
        <rect x="4" y="38" width="36" height="8"
          fill="${bodyDark}" opacity="0.5"/>

        <!-- ── 센싱 격자 영역 (습도/온도 센서 메쉬) ── -->
        <!-- 배경 -->
        <rect x="${gX}" y="${gY}" width="${gW}" height="${gH}"
          rx="2" fill="#ddeeff" stroke="#5599cc" stroke-width="0.8"/>
        <!-- 격자 배경 어두운 행 -->
        ${[0, 2].map(i => html`
          <rect x="${gX}" y="${gY + i * cellH}" width="${gW}" height="${cellH}"
            fill="#c8e8ff" opacity="0.6"/>
        `)}
        <!-- 가로 격자선 -->
        ${[1, 2, 3].map(i => html`
          <line
            x1="${gX}" y1="${gY + i * cellH}"
            x2="${gX + gW}" y2="${gY + i * cellH}"
            stroke="#7ab0d0" stroke-width="0.5"/>
        `)}
        <!-- 세로 격자선 -->
        ${[1, 2, 3].map(i => html`
          <line
            x1="${gX + i * cellW}" y1="${gY}"
            x2="${gX + i * cellW}" y2="${gY + gH}"
            stroke="#7ab0d0" stroke-width="0.5"/>
        `)}

        <!-- ── 모델명 라벨 ── -->
        <text x="22" y="36" font-size="8" fill="#ffffff" font-family="monospace"
          text-anchor="middle" font-weight="bold" opacity="0.9">${this.model}</text>

        <!-- ── 측정값 표시 ── -->
        <text x="22" y="43.5" font-size="4.5" fill="#88ddff" font-family="monospace"
          text-anchor="middle">${this.temperature.toFixed(1)}°  ${this.humidity.toFixed(0)}%</text>

        <!-- ── 핀 3개 (직접 색상으로 광택 구현) ── -->
        <!-- VCC (빨간 계열 핀) -->
        <rect x="8.5"  y="46" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="9"    y="46" width="1.5" height="16" rx="0.3" fill="white" opacity="0.35"/>

        <!-- DATA (파란 계열 핀) -->
        <rect x="20.5" y="46" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="21"   y="46" width="1.5" height="16" rx="0.3" fill="white" opacity="0.35"/>

        <!-- GND (초록 계열 핀) -->
        <rect x="32.5" y="46" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="33"   y="46" width="1.5" height="16" rx="0.3" fill="white" opacity="0.35"/>

        <!-- ── 핀 라벨 ── -->
        <text x="6"  y="60" font-size="4.5" fill="#ff8888" font-family="monospace">VCC</text>
        <text x="17" y="60" font-size="4.5" fill="#88aaff" font-family="monospace">DAT</text>
        <text x="29" y="60" font-size="4.5" fill="#88ee88" font-family="monospace">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-dht': SimDht;
  }
}
