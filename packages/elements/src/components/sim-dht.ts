import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-dht> — DHT11 / DHT22 온습도 센서 (66×120px)
 * Pins: VCC, DATA, GND
 * 인터랙션: TEMP [−][+] / HUM [−][+] 버튼으로 시뮬레이션 값 조정
 */
@customElement('sim-dht')
export class SimDht extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 66px; height: 120px; }
      .ctrl-btn { cursor: pointer; }
    `,
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

  // getPinPositions: viewBox(44×80) × 1.5 = host(66×120)
  // VCC x=10×1.5=15, DATA x=22×1.5=33, GND x=34×1.5=51
  override getPinPositions() {
    return new Map([
      ['VCC',  { x: 15, y: 120 }],
      ['DATA', { x: 33, y: 120 }],
      ['GND',  { x: 51, y: 120 }],
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
    // 클릭이 끝났으므로 짧은 딜레이 후 release
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
    }, 60);
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
      <svg width="66" height="120" viewBox="0 0 44 80" xmlns="http://www.w3.org/2000/svg">

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

        <!-- ── 인터랙티브 컨트롤 존 ── -->
        <rect x="0" y="46" width="44" height="22" fill="#0c1420"/>
        <line x1="0" y1="46" x2="44" y2="46" stroke="#2a4a70" stroke-width="0.5"/>

        <!-- 온도 라벨 -->
        <text x="3" y="53.5" font-size="5" fill="#6688aa" font-family="monospace"
          font-weight="bold">T</text>

        <!-- 온도 − 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'temp', -0.5)}">
          <rect x="8" y="47.5" width="9" height="7.5" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.8"/>
          <text x="12.5" y="54" font-size="8" fill="#66aadd" font-family="monospace"
            text-anchor="middle">−</text>
        </g>

        <!-- 온도 값 -->
        <text x="25" y="54" font-size="5.5" fill="#d8eeff" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.temperature.toFixed(1)}°C</text>

        <!-- 온도 + 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'temp', +0.5)}">
          <rect x="35" y="47.5" width="9" height="7.5" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.8"/>
          <text x="39.5" y="54" font-size="8" fill="#66aadd" font-family="monospace"
            text-anchor="middle">+</text>
        </g>

        <!-- 구분선 -->
        <line x1="3" y1="58" x2="41" y2="58" stroke="#1a3050" stroke-width="0.4"/>

        <!-- 습도 라벨 -->
        <text x="3" y="65.5" font-size="5" fill="#6688aa" font-family="monospace"
          font-weight="bold">H</text>

        <!-- 습도 − 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'hum', -1)}">
          <rect x="8" y="59.5" width="9" height="7.5" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.8"/>
          <text x="12.5" y="66" font-size="8" fill="#66aadd" font-family="monospace"
            text-anchor="middle">−</text>
        </g>

        <!-- 습도 값 -->
        <text x="25" y="66" font-size="5.5" fill="#d8eeff" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.humidity.toFixed(0)}%</text>

        <!-- 습도 + 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, 'hum', +1)}">
          <rect x="35" y="59.5" width="9" height="7.5" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.8"/>
          <text x="39.5" y="66" font-size="8" fill="#66aadd" font-family="monospace"
            text-anchor="middle">+</text>
        </g>

        <!-- 핀 금속 — VCC=빨강, DATA=파랑, GND=회색 -->
        <rect x="8.5"  y="68" width="3" height="12" rx="0.5" fill="#cc4433"/>
        <rect x="9.2"  y="68" width="1.2" height="12" fill="white" opacity="0.25"/>
        <rect x="20.5" y="68" width="3" height="12" rx="0.5" fill="#4477cc"/>
        <rect x="21.2" y="68" width="1.2" height="12" fill="white" opacity="0.25"/>
        <rect x="32.5" y="68" width="3" height="12" rx="0.5" fill="#666666"/>
        <rect x="33.2" y="68" width="1.2" height="12" fill="white" opacity="0.2"/>

        <!-- 핀 라벨 존 -->
        <rect x="0" y="69" width="44" height="11" fill="#0d0d14"/>
        <line x1="0" y1="69" x2="44" y2="69" stroke="#252535" stroke-width="0.5"/>

        <text x="10" y="78" font-size="8" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">VCC</text>
        <text x="22" y="78" font-size="8" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">DAT</text>
        <text x="34" y="78" font-size="8" fill="#88ee99" font-family="monospace"
          text-anchor="middle" font-weight="bold">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-dht': SimDht; }
}
