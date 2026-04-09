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
    css`:host { width: 44px; height: 60px; }`,
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
      ['VCC',  { x: 10, y: 60 }],
      ['DATA', { x: 22, y: 60 }],
      ['GND',  { x: 34, y: 60 }],
    ]);
  }

  override render() {
    const isDHT22 = this.model === 'DHT22';
    // DHT22: 상단 라운드, DHT11: 직사각형
    const topRadius = isDHT22 ? 18 : 4;

    // 격자 패턴: 가로 4줄 × 세로 4줄 (센싱 영역 표현)
    const gridRows = 4, gridCols = 4;
    const gridX = 8, gridY = 6, gridW = 28, gridH = 22;
    const cellW = gridW / gridCols, cellH = gridH / gridRows;

    return html`
      <svg width="44" height="60" viewBox="0 0 44 60">
        <defs>
          <!-- 파란 몸체 gradient -->
          <linearGradient id="dhtBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#4488cc"/>
            <stop offset="40%"  stop-color="#1e5a8a"/>
            <stop offset="100%" stop-color="#0d3a5a"/>
          </linearGradient>
          <!-- 센싱 격자 영역 배경 -->
          <linearGradient id="dhtGridBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#ddeeff"/>
            <stop offset="100%" stop-color="#aaccee"/>
          </linearGradient>
          <!-- 핀 광택 -->
          <linearGradient id="dhtPinGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stop-color="#999"/>
            <stop offset="50%"  stop-color="#eee"/>
            <stop offset="100%" stop-color="#999"/>
          </linearGradient>
        </defs>

        <!-- 파란 몸체 (DHT22: 위쪽 반원형, DHT11: 직사각) -->
        <rect x="4" y="0" width="36" height="44"
          rx="${topRadius}" ry="${isDHT22 ? 18 : 4}"
          fill="url(#dhtBodyGrad)" stroke="#2a6aaa" stroke-width="1"/>
        <!-- 몸체 상단 하이라이트 -->
        <rect x="4" y="0" width="36" height="6" rx="${topRadius}"
          fill="white" opacity="0.14"/>

        <!-- 센싱 격자 영역 (흰/회색 격자) -->
        <rect x="${gridX}" y="${gridY}" width="${gridW}" height="${gridH}"
          rx="2" fill="url(#dhtGridBg)" stroke="#6aaddd" stroke-width="0.8"/>
        <!-- 가로 격자선 -->
        ${Array.from({ length: gridRows - 1 }, (_, i) => html`
          <line
            x1="${gridX}" y1="${gridY + cellH * (i + 1)}"
            x2="${gridX + gridW}" y2="${gridY + cellH * (i + 1)}"
            stroke="#88bbdd" stroke-width="0.5"/>
        `)}
        <!-- 세로 격자선 -->
        ${Array.from({ length: gridCols - 1 }, (_, i) => html`
          <line
            x1="${gridX + cellW * (i + 1)}" y1="${gridY}"
            x2="${gridX + cellW * (i + 1)}" y2="${gridY + gridH}"
            stroke="#88bbdd" stroke-width="0.5"/>
        `)}

        <!-- 모델명 라벨 -->
        <text x="22" y="36" font-size="7" fill="#eef" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.model}</text>

        <!-- 온도/습도 값 표시 -->
        <text x="22" y="42.5" font-size="5" fill="#88ddff" font-family="monospace"
          text-anchor="middle">${this.temperature.toFixed(1)}°C  ${this.humidity.toFixed(0)}%</text>

        <!-- 핀 3개 -->
        <rect x="8.5"  y="44" width="3" height="16" rx="0.5" fill="url(#dhtPinGrad)"/>
        <rect x="20.5" y="44" width="3" height="16" rx="0.5" fill="url(#dhtPinGrad)"/>
        <rect x="32.5" y="44" width="3" height="16" rx="0.5" fill="url(#dhtPinGrad)"/>

        <!-- 핀 라벨 -->
        <text x="5"  y="58" font-size="4.5" fill="#f88" font-family="monospace">VCC</text>
        <text x="17" y="58" font-size="4.5" fill="#8af" font-family="monospace">DAT</text>
        <text x="29" y="58" font-size="4.5" fill="#8f8" font-family="monospace">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-dht': SimDht;
  }
}
