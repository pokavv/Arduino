import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-dht> — DHT11 / DHT22 온습도 센서 (78×120px)
 *
 * 실물 기준:
 *   - DHT22: 흰색(크림색) 플라스틱 하우징, 전면 환기 격자(5×4 원형 홀)
 *   - DHT11: 파란색 하우징
 *   - 4핀: VCC(1), DATA(2), NC(3), GND(4)
 *
 * Pins: VCC, DATA, NC, GND
 * 인터랙션: TEMP [−][+] / HUM [−][+] 버튼으로 시뮬레이션 값 조정
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

  // getPinPositions: viewBox(52×80) × 1.5 = host(78×120)
  // 4핀 간격: x = 9, 21, 33, 45 (viewBox) → × 1.5 = 13.5, 31.5, 49.5, 67.5
  override getPinPositions() {
    return new Map([
      ['VCC',  { x: 14, y: 120 }],
      ['DATA', { x: 32, y: 120 }],
      ['NC',   { x: 50, y: 120 }],
      ['GND',  { x: 68, y: 120 }],
    ]);
  }

  // 온도/습도 스텝 — sim-interaction-start/end로 캔버스 드래그 차단
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

    // 실물 색상: DHT22=크림백색, DHT11=파란색
    const bodyFill   = isDHT22 ? '#f2f2f2' : '#1e68aa';
    const bodyStroke = isDHT22 ? '#cccccc' : '#1855aa';
    const bodyLight  = isDHT22 ? '#ffffff' : '#3a88cc';
    const bodyShade  = isDHT22 ? '#d8d8d8' : '#0d3a6a';
    const labelColor = isDHT22 ? '#444444' : '#ffffff';
    const holeColor  = isDHT22 ? '#aaaaaa' : '#4488cc';
    const holeBg     = isDHT22 ? '#dadada' : '#0d3a6a';

    // 환기 격자 — Wokwi 기준: 직사각형 슬롯 3열 × 4행
    // Wokwi viewBox 15.1×30.885mm → 우리 viewBox 52×80 스케일 적용
    // slot x(mm): 4.967, 7.135, 9.287 → ×(52/15.1) → 17.1, 24.5, 32.0
    // slot y(mm): 8.66, 10.02, 11.37, 15.56 → ×(80/30.885) → 22.4, 25.9, 29.5, 40.3 (바디기준 ×48/23.885)
    const slotXs = [17.1, 24.5, 32.0];
    const slotYs = [10.5, 16.5, 22.5, 30.5];
    const slotW = 3.2, slotH = 2.2;
    const holes = [];
    for (const sy of slotYs) {
      for (const sx of slotXs) {
        holes.push(html`
          <rect x="${sx}" y="${sy}" width="${slotW}" height="${slotH}"
            fill="${isDHT22 ? '#222' : '#0a1830'}" rx="0.2"/>
        `);
      }
    }

    return html`
      <svg width="78" height="120" viewBox="0 0 52 80" xmlns="http://www.w3.org/2000/svg">

        <!-- 몸체 — 실물: DHT22=크림백색, DHT11=파란색 -->
        <rect x="2" y="0" width="48" height="48" rx="4"
          fill="${bodyFill}" stroke="${bodyStroke}" stroke-width="1"/>
        <!-- 상단 하이라이트 -->
        <rect x="2" y="0" width="48" height="6" rx="4"
          fill="${bodyLight}" opacity="0.3"/>
        <!-- 하단 음영 -->
        <rect x="2" y="40" width="48" height="8" fill="${bodyShade}" opacity="0.3"/>
        <!-- 측면 음영 (3D 느낌) -->
        <rect x="44" y="0" width="6" height="48" rx="4"
          fill="${bodyShade}" opacity="0.2"/>

        <!-- 환기 격자 (전면 5×4 원형 홀) -->
        ${holes}

        <!-- 모델명 라벨 -->
        <text x="26" y="43" font-size="6.5" fill="${labelColor}" font-family="monospace"
          text-anchor="middle" font-weight="bold" opacity="0.85">${this.model}</text>

        <!-- ── 인터랙티브 컨트롤 존 ── -->
        <rect x="0" y="48" width="52" height="22" fill="#0c1420"/>
        <line x1="0" y1="48" x2="52" y2="48" stroke="#2a4a70" stroke-width="0.5"/>

        <!-- 온도 라벨 -->
        <text x="3" y="56" font-size="5" fill="#6688aa" font-family="monospace"
          font-weight="bold">T</text>

        <!-- 온도 − 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'temp', -0.5)}">
          <rect x="8" y="49.5" width="9" height="7.5" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.8"/>
          <text x="12.5" y="56" font-size="8" fill="#66aadd" font-family="monospace"
            text-anchor="middle">−</text>
        </g>

        <!-- 온도 값 -->
        <text x="32" y="56" font-size="5.5" fill="#d8eeff" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.temperature.toFixed(1)}°C</text>

        <!-- 온도 + 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'temp', +0.5)}">
          <rect x="43" y="49.5" width="9" height="7.5" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.8"/>
          <text x="47.5" y="56" font-size="8" fill="#66aadd" font-family="monospace"
            text-anchor="middle">+</text>
        </g>

        <!-- 구분선 -->
        <line x1="3" y1="60" x2="49" y2="60" stroke="#1a3050" stroke-width="0.4"/>

        <!-- 습도 라벨 -->
        <text x="3" y="68" font-size="5" fill="#6688aa" font-family="monospace"
          font-weight="bold">H</text>

        <!-- 습도 − 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'hum', -1)}">
          <rect x="8" y="61.5" width="9" height="7.5" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.8"/>
          <text x="12.5" y="68" font-size="8" fill="#66aadd" font-family="monospace"
            text-anchor="middle">−</text>
        </g>

        <!-- 습도 값 -->
        <text x="32" y="68" font-size="5.5" fill="#d8eeff" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.humidity.toFixed(0)}%</text>

        <!-- 습도 + 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'hum', +1)}">
          <rect x="43" y="61.5" width="9" height="7.5" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.8"/>
          <text x="47.5" y="68" font-size="8" fill="#66aadd" font-family="monospace"
            text-anchor="middle">+</text>
        </g>

        <!-- 핀 스터브 (바닥 플라스틱 베이스) -->
        <rect x="4" y="70" width="44" height="4" rx="1" fill="#888878" stroke="#666658" stroke-width="0.5"/>

        <!-- 핀 금속 — VCC=빨강(1), DATA=파랑(2), NC=회색(3), GND=검정(4) -->
        <rect x="7.5"  y="74" width="3" height="6" rx="0.5" fill="#cc4433"/>
        <rect x="8.2"  y="74" width="1.2" height="6" fill="white" opacity="0.25"/>
        <rect x="19.5" y="74" width="3" height="6" rx="0.5" fill="#4477cc"/>
        <rect x="20.2" y="74" width="1.2" height="6" fill="white" opacity="0.25"/>
        <rect x="31.5" y="74" width="3" height="6" rx="0.5" fill="#888878"/>
        <rect x="32.2" y="74" width="1.2" height="6" fill="white" opacity="0.15"/>
        <rect x="43.5" y="74" width="3" height="6" rx="0.5" fill="#333333"/>
        <rect x="44.2" y="74" width="1.2" height="6" fill="white" opacity="0.1"/>

        <!-- 핀 라벨 존 -->
        <rect x="0" y="70" width="52" height="10" fill="#0d0d14"/>
        <line x1="0" y1="70" x2="52" y2="70" stroke="#252535" stroke-width="0.5"/>

        <text x="9"  y="78" font-size="6" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">VCC</text>
        <text x="21" y="78" font-size="6" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">DAT</text>
        <text x="33" y="78" font-size="6" fill="#888878" font-family="monospace"
          text-anchor="middle" font-weight="bold">NC</text>
        <text x="45" y="78" font-size="6" fill="#88ee99" font-family="monospace"
          text-anchor="middle" font-weight="bold">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-dht': SimDht; }
}
