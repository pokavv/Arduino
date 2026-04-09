import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-dht> — DHT11 / DHT22 온습도 센서 (66×93px)
 * Pins: VCC, DATA, GND
 */
@customElement('sim-dht')
export class SimDht extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 66px; height: 93px; }`,
  ];

  @property({ type: String }) model: 'DHT11' | 'DHT22' = 'DHT22';
  @property({ type: Number }) temperature = 25.0;
  @property({ type: Number }) humidity = 60.0;

  override get componentType() { return 'dht'; }
  override get pins() { return ['VCC', 'DATA', 'GND']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'TEMP' || pin === 'temperature') { this.temperature = v; }
    else if (pin === 'HUM' || pin === 'humidity') { this.humidity = v; }
    else if (pin === 'DATA') {
      try {
        const data = typeof value === 'string' ? JSON.parse(value) : {};
        if (data.temperature !== undefined) this.temperature = data.temperature;
        if (data.humidity    !== undefined) this.humidity    = data.humidity;
      } catch { /* ignore */ }
    }
  }

  // getPinPositions: viewBox 좌표 × 1.5 (host 66×93 / viewBox 44×62 = 1.5)
  override getPinPositions() {
    return new Map([
      ['VCC',  { x: 15, y: 93 }],
      ['DATA', { x: 33, y: 93 }],
      ['GND',  { x: 51, y: 93 }],
    ]);
  }

  override render() {
    const isDHT22 = this.model === 'DHT22';
    const bodyMain  = isDHT22 ? '#1e68aa' : '#1a4a8a';
    const bodyLight = isDHT22 ? '#3a88cc' : '#2266aa';
    const bodyDark  = isDHT22 ? '#0d3a6a' : '#0a2a5a';
    const topRadius = isDHT22 ? 18 : 4;
    const gX = 8, gY = 4, gW = 28, gH = 22;
    const cellW = gW / 4, cellH = gH / 4;

    return html`
      <svg width="66" height="93" viewBox="0 0 44 62" xmlns="http://www.w3.org/2000/svg">

        <!-- 몸체 -->
        <rect x="4" y="0" width="36" height="46"
          rx="${topRadius}" ry="${isDHT22 ? 18 : 4}"
          fill="${bodyMain}" stroke="#1855aa" stroke-width="1"/>
        <rect x="4" y="0" width="36" height="8" rx="${topRadius}"
          fill="${bodyLight}" opacity="0.4"/>
        <rect x="4" y="38" width="36" height="8" fill="${bodyDark}" opacity="0.5"/>

        <!-- 센싱 격자 -->
        <rect x="${gX}" y="${gY}" width="${gW}" height="${gH}"
          rx="2" fill="#ddeeff" stroke="#5599cc" stroke-width="0.8"/>
        ${[0, 2].map(i => html`
          <rect x="${gX}" y="${gY + i * cellH}" width="${gW}" height="${cellH}"
            fill="#c8e8ff" opacity="0.6"/>
        `)}
        ${[1, 2, 3].map(i => html`
          <line x1="${gX}" y1="${gY + i * cellH}" x2="${gX + gW}" y2="${gY + i * cellH}"
            stroke="#7ab0d0" stroke-width="0.5"/>
        `)}
        ${[1, 2, 3].map(i => html`
          <line x1="${gX + i * cellW}" y1="${gY}" x2="${gX + i * cellW}" y2="${gY + gH}"
            stroke="#7ab0d0" stroke-width="0.5"/>
        `)}

        <!-- 모델명 라벨 -->
        <text x="22" y="36" font-size="8" fill="#ffffff" font-family="monospace"
          text-anchor="middle" font-weight="bold" opacity="0.9">${this.model}</text>

        <!-- 측정값 -->
        <text x="22" y="43.5" font-size="4.5" fill="#88ddff" font-family="monospace"
          text-anchor="middle">${this.temperature.toFixed(1)}°  ${this.humidity.toFixed(0)}%</text>

        <!-- 핀 3개 -->
        <rect x="8.5"  y="46" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="9"    y="46" width="1.5" height="16" fill="white" opacity="0.35"/>
        <rect x="20.5" y="46" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="21"   y="46" width="1.5" height="16" fill="white" opacity="0.35"/>
        <rect x="32.5" y="46" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="33"   y="46" width="1.5" height="16" fill="white" opacity="0.35"/>

        <!-- 핀 라벨 (몸체 하단 안쪽) -->
        <text x="6"  y="44" font-size="5" fill="#ff9999" font-family="monospace" font-weight="bold">V</text>
        <text x="18" y="44" font-size="5" fill="#88aaff" font-family="monospace" font-weight="bold">D</text>
        <text x="30" y="44" font-size="5" fill="#88ee88" font-family="monospace" font-weight="bold">G</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-dht': SimDht; }
}
