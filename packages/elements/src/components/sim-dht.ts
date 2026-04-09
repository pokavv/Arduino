import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-dht> — DHT11 / DHT22 온습도 센서
 *
 * Pins: VCC, DATA, GND
 */
@customElement('sim-dht')
export class SimDht extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 40px; height: 56px; }`,
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
      // DATA 핀에 복합 데이터가 오는 경우 (JSON 형태)
      try {
        const data = typeof value === 'string' ? JSON.parse(value) : {};
        if (data.temperature !== undefined) this.temperature = data.temperature;
        if (data.humidity    !== undefined) this.humidity    = data.humidity;
      } catch { /* ignore */ }
    }
  }

  override getPinPositions() {
    return new Map([
      ['VCC',  { x: 10, y: 56 }],
      ['DATA', { x: 20, y: 56 }],
      ['GND',  { x: 30, y: 56 }],
    ]);
  }

  override render() {
    const isDHT22 = this.model === 'DHT22';
    return html`
      <svg width="40" height="56" viewBox="0 0 40 56">
        <!-- 몸체 -->
        <rect x="4" y="0" width="32" height="40" rx="${isDHT22 ? 16 : 4}" fill="#1a3a5a" stroke="#2a5a8a" stroke-width="1"/>
        <!-- 격자 패턴 -->
        ${Array.from({ length: 5 }, (_, i) => html`
          <line x1="8" y1="${6 + i*6}" x2="32" y2="${6 + i*6}" stroke="#2a5a8a" stroke-width="0.5"/>
        `)}
        <!-- 모델 라벨 -->
        <text x="20" y="24" font-size="7" fill="#88ccff" font-family="monospace"
          text-anchor="middle">${this.model}</text>
        <!-- 값 표시 -->
        <text x="20" y="29" font-size="5.5" fill="#aaddff" font-family="monospace"
          text-anchor="middle">${this.temperature.toFixed(1)}°C</text>
        <text x="20" y="37" font-size="5.5" fill="#aaddff" font-family="monospace"
          text-anchor="middle">${this.humidity.toFixed(1)}%H</text>

        <!-- 핀 3개 -->
        <line x1="10" y1="40" x2="10" y2="56" stroke="#aaa" stroke-width="2"/>
        <line x1="20" y1="40" x2="20" y2="56" stroke="#aaa" stroke-width="2"/>
        <line x1="30" y1="40" x2="30" y2="56" stroke="#aaa" stroke-width="2"/>
        <text x="5"  y="54" font-size="5" fill="#f88" font-family="monospace">V</text>
        <text x="16" y="54" font-size="5" fill="#8af" font-family="monospace">D</text>
        <text x="26" y="54" font-size="5" fill="#8f8" font-family="monospace">G</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-dht': SimDht;
  }
}
