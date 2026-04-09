import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-dht> — DHT11 / DHT22 온습도 센서
 *
 * Wokwi wokwi-dht22 기준 정밀 재현:
 *   viewBox: 0 0 15.1 30.885 (mm, 1unit=1mm)
 *   scale: 3.78px/mm → host: 57×117px (센서 부분)
 *   body: fill=#f2f2f2 (DHT22 흰색), fill=#1565c0 (DHT11 파란색)
 *   센서 격자: 3열 × 3행 슬롯 (0.934×0.935mm)
 *   모델명: font-size=2.2px, font-family=monospace
 *   핀 4개: x=[3.57, 6.11, 8.65, 11.19]mm, y=30.885mm
 *
 * Pins: VCC(1), DATA(2), NC(3), GND(4)
 */
@customElement('sim-dht')
export class SimDht extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 78px; height: 120px; }
      .ctrl-btn { cursor: pointer; }
    `,
  ];

  @property({ type: String }) model: 'DHT11' | 'DHT22' = 'DHT22';
  @property({ type: Number }) temperature = 25.0;
  @property({ type: Number }) humidity = 60.0;

  override get componentType() { return 'dht'; }
  override get pins() { return ['VCC', 'DATA', 'NC', 'GND']; }

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

  // getPinPositions: Wokwi mm → host px (scale ≈ 5.17px/mm for 78px wide / 15.1mm)
  // x(mm): 3.57, 6.11, 8.65, 11.19 → ×(78/15.1) ≈ ×5.166 → 18, 32, 45, 58
  // y: host 120px — pins at bottom
  override getPinPositions() {
    const s = 78 / 15.1;
    return new Map([
      ['VCC',  { x: Math.round(3.57  * s), y: 120 }],
      ['DATA', { x: Math.round(6.11  * s), y: 120 }],
      ['NC',   { x: Math.round(8.65  * s), y: 120 }],
      ['GND',  { x: Math.round(11.19 * s), y: 120 }],
    ]);
  }

  private _step(e: PointerEvent, type: 'temp' | 'hum', delta: number) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    if (type === 'temp') {
      this.temperature = Math.round((this.temperature + delta) * 10) / 10;
      this.temperature = Math.max(-40, Math.min(125, this.temperature));
    } else {
      this.humidity = Math.round(this.humidity + delta);
      this.humidity = Math.max(0, Math.min(100, this.humidity));
    }
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('sim-change', {
      bubbles: true, composed: true,
      detail: { temperature: this.temperature, humidity: this.humidity },
    }));
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
    }, 60);
  }

  override render() {
    const isDHT22 = this.model === 'DHT22';
    const s = 78 / 15.1;   // scale px/mm

    // Wokwi 색상 (실물 기준)
    const bodyFill   = isDHT22 ? '#f2f2f2' : '#1565c0';
    const bodyStroke = isDHT22 ? '#cccccc' : '#0d47a1';
    const labelColor = isDHT22 ? '#333333' : '#ffffff';
    const grillColor = isDHT22 ? '#aaaaaa' : '#0a3070';
    const grillFill  = isDHT22 ? '#e0e0e0' : '#0d3a80';

    // Wokwi 격자 슬롯 (mm) — 3열×3행 직사각형 슬롯
    // x 시작: 2.8, 5.34, 7.88mm  y 시작: 3.8, 6.5, 9.2mm  w=1.8mm h=1.4mm
    const grillXs = [2.8, 5.34, 7.88];
    const grillYs = [3.8, 6.5, 9.2];
    const gW = 1.8, gH = 1.4;

    // 핀 리드 x(mm)
    const pinXs = [3.57, 6.11, 8.65, 11.19];
    // 핀 색상: VCC=빨강, DATA=파랑, NC=회색, GND=검정
    const pinColors = ['#cc4433', '#4477cc', '#888888', '#333333'];

    // body height in px (Wokwi: 23.885mm body + pin connector zone)
    const bodyH = Math.round(23.885 * s); // ≈ 123px... let viewBox manage

    return html`
      <svg width="78" height="120" viewBox="0 0 ${15.1} 39" xmlns="http://www.w3.org/2000/svg">

        <!-- ── 실물 DHT22/DHT11 본체 (Wokwi: 15.1×23.885mm) ── -->
        <!-- 몸체 그림자 -->
        <rect x="0.3" y="0.3" width="14.8" height="23.585" rx="1.2"
          fill="black" opacity="0.15"/>

        <!-- 메인 바디 -->
        <rect x="0" y="0" width="15.1" height="23.885" rx="1.2"
          fill="${bodyFill}" stroke="${bodyStroke}" stroke-width="0.3"/>

        <!-- 상단 하이라이트 (3D 느낌) -->
        <rect x="0" y="0" width="15.1" height="2.5" rx="1.2"
          fill="white" opacity="${isDHT22 ? 0.5 : 0.12}"/>

        <!-- 오른쪽 음영 -->
        <rect x="13.5" y="0" width="1.6" height="23.885" rx="1"
          fill="black" opacity="${isDHT22 ? 0.05 : 0.12}"/>

        <!-- ── 센서 격자 (환기 슬롯) ── -->
        <!-- 슬롯 배경 (어두운 영역) -->
        <rect x="2.3" y="2.8" width="9.2" height="8.8" rx="0.5"
          fill="${grillFill}" opacity="0.5"/>
        ${grillYs.map(gy => grillXs.map(gx => html`
          <rect x="${gx}" y="${gy}" width="${gW}" height="${gH}" rx="0.35"
            fill="${grillColor}" opacity="0.8"/>
          <!-- 슬롯 내부 어두운 구멍 -->
          <rect x="${gx + 0.2}" y="${gy + 0.15}" width="${gW - 0.4}" height="${gH - 0.3}" rx="0.2"
            fill="${isDHT22 ? '#888' : '#082050'}" opacity="0.9"/>
        `))}

        <!-- ── 모델명 라벨 (Wokwi: font-size=2.2px monospace) ── -->
        <text x="7.55" y="18.0"
          font-size="2.2" fill="${labelColor}" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.model}</text>
        <text x="7.55" y="20.8"
          font-size="1.6" fill="${isDHT22 ? '#666' : '#aaddff'}" font-family="monospace"
          text-anchor="middle">${isDHT22 ? 'AM2302' : 'DHT11'}</text>

        <!-- ── 핀 커넥터 베이스 (몸체 하단부) ── -->
        <rect x="1.5" y="21.885" width="12.1" height="2" rx="0.3"
          fill="${isDHT22 ? '#d8d8d8' : '#0d3a80'}" stroke="${bodyStroke}" stroke-width="0.2"/>

        <!-- 핀 가이드 노치 (4개) -->
        ${pinXs.map(px => html`
          <rect x="${px - 0.4}" y="22.685" width="0.8" height="1.2" rx="0.2"
            fill="${isDHT22 ? '#bbb' : '#0a2860'}"/>
        `)}

        <!-- ── 핀 리드 (몸체 아래로 내려옴) ── -->
        ${pinXs.map((px, i) => html`
          <line x1="${px}" y1="23.885" x2="${px}" y2="30.885"
            stroke="${pinColors[i]}" stroke-width="0.6" stroke-linecap="round"/>
          <!-- 하이라이트 -->
          <line x1="${px - 0.1}" y1="23.885" x2="${px - 0.1}" y2="30.885"
            stroke="white" stroke-width="0.15" opacity="0.3"/>
        `)}

        <!-- ── 인터랙티브 컨트롤 존 ── -->
        <rect x="0" y="30.885" width="15.1" height="8.115" fill="#0c1420" rx="0.5"/>
        <line x1="0" y1="30.885" x2="15.1" y2="30.885" stroke="#2a4a70" stroke-width="0.2"/>

        <!-- 온도 표시 -->
        <text x="2.0" y="33.6" font-size="1.6" fill="#6688aa" font-family="monospace">T</text>
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'temp', -0.5)}">
          <rect x="3.2" y="31.685" width="2.4" height="2.2" rx="0.4" fill="#131e2e" stroke="#2a5a8a" stroke-width="0.2"/>
          <text x="4.4" y="33.3" font-size="2.2" fill="#66aadd" font-family="monospace" text-anchor="middle">−</text>
        </g>
        <text x="7.55" y="33.6" font-size="1.7" fill="#d8eeff" font-family="monospace" text-anchor="middle" font-weight="bold">${this.temperature.toFixed(1)}°</text>
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'temp', +0.5)}">
          <rect x="9.5" y="31.685" width="2.4" height="2.2" rx="0.4" fill="#131e2e" stroke="#2a5a8a" stroke-width="0.2"/>
          <text x="10.7" y="33.3" font-size="2.2" fill="#66aadd" font-family="monospace" text-anchor="middle">+</text>
        </g>

        <!-- 구분선 -->
        <line x1="1" y1="34.4" x2="14.1" y2="34.4" stroke="#1a3050" stroke-width="0.15"/>

        <!-- 습도 표시 -->
        <text x="2.0" y="37.1" font-size="1.6" fill="#6688aa" font-family="monospace">H</text>
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'hum', -1)}">
          <rect x="3.2" y="35.185" width="2.4" height="2.2" rx="0.4" fill="#131e2e" stroke="#2a5a8a" stroke-width="0.2"/>
          <text x="4.4" y="36.8" font-size="2.2" fill="#66aadd" font-family="monospace" text-anchor="middle">−</text>
        </g>
        <text x="7.55" y="37.1" font-size="1.7" fill="#d8eeff" font-family="monospace" text-anchor="middle" font-weight="bold">${this.humidity.toFixed(0)}%</text>
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'hum', +1)}">
          <rect x="9.5" y="35.185" width="2.4" height="2.2" rx="0.4" fill="#131e2e" stroke="#2a5a8a" stroke-width="0.2"/>
          <text x="10.7" y="36.8" font-size="2.2" fill="#66aadd" font-family="monospace" text-anchor="middle">+</text>
        </g>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-dht': SimDht; }
}
