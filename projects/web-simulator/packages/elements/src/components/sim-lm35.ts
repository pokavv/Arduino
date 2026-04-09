import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-lm35> — LM35 온도 센서 (TO-92 패키지, 45×68px)
 * 실물: 진한 회색/검은색 D자 단면 TO-92, "LM35" 흰색 텍스트
 * Pins: VCC, OUT, GND
 * 인터랙션: 온도 +/- 버튼 (−55°C ~ +150°C)
 */
@customElement('sim-lm35')
export class SimLm35 extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 45px; height: 68px; }
      .ctrl-btn { cursor: pointer; }
    `,
  ];

  @property({ type: Number }) temperature = 25.0;

  override get componentType() { return 'lm35'; }
  override get pins() { return ['VCC', 'OUT', 'GND']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'TEMP' || pin === 'temperature') {
      this.temperature = Math.max(-55, Math.min(150, v));
    } else if (pin === 'OUT') {
      // LM35: 10mV/°C, 0°C = 0V, 전압(mV) → 온도
      // value가 실제 전압(V)으로 들어온다고 가정: T = V * 100
      const tempFromVoltage = v * 100;
      if (!isNaN(tempFromVoltage)) {
        this.temperature = Math.max(-55, Math.min(150, tempFromVoltage));
      }
    }
  }

  override getPinPositions() {
    return new Map([
      ['VCC', { x: 8,  y: 68 }],
      ['OUT', { x: 22, y: 68 }],
      ['GND', { x: 36, y: 68 }],
    ]);
  }

  private _step(e: PointerEvent, delta: number) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    this.temperature = Math.round((this.temperature + delta) * 10) / 10;
    this.temperature = Math.max(-55, Math.min(150, this.temperature));
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('sim-change', {
      bubbles: true, composed: true,
      detail: { temperature: this.temperature },
    }));
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
    }, 60);
  }

  override render() {
    // 온도에 따라 색상 힌트 (따뜻/차가움)
    const isHot  = this.temperature > 40;
    const isCold = this.temperature < 0;
    const accentColor = isHot ? '#ff6633' : isCold ? '#44aaff' : '#aaaaaa';

    return html`
      <svg width="45" height="68" viewBox="0 0 45 68" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- TO-92 몸체 그라디언트 (D자 단면) -->
          <linearGradient id="lm35-body-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#323232"/>
            <stop offset="35%"  stop-color="#484848"/>
            <stop offset="60%"  stop-color="#303030"/>
            <stop offset="100%" stop-color="#1a1a1a"/>
          </linearGradient>
        </defs>

        <!-- ── TO-92 D자 단면 몸체 ── -->
        <!-- 상단 반원 -->
        <path d="M 7 36 A 15.5 15.5 0 0 1 38 36 L 38 44 L 7 44 Z"
          fill="url(#lm35-body-${this.compId})"
          stroke="#222222" stroke-width="0.8"/>
        <!-- 하단 직사각형 (평면부) -->
        <rect x="7" y="36" width="31" height="8"
          fill="url(#lm35-body-${this.compId})"
          stroke="#222222" stroke-width="0.8"/>
        <!-- 합성 경로 (전체 몸체) -->
        <path d="M 7 44 L 7 36 A 15.5 15.5 0 0 1 38 36 L 38 44 Z"
          fill="url(#lm35-body-${this.compId})"/>

        <!-- 3D 하이라이트 -->
        <path d="M 10 36 A 12.5 12.5 0 0 1 35 36"
          fill="none" stroke="white" stroke-width="1" opacity="0.18"/>

        <!-- 측면 음영 -->
        <rect x="34" y="36" width="4" height="8"
          fill="black" opacity="0.25"/>

        <!-- "LM35" 흰색 실크스크린 -->
        <text x="22.5" y="41.5" font-size="5.5" fill="#dddddd" font-family="monospace"
          text-anchor="middle" font-weight="bold">LM35</text>

        <!-- ── 인터랙티브 온도 컨트롤 존 (몸체 위) ── -->
        <rect x="2" y="4" width="41" height="29" rx="2" fill="#0c1420"/>
        <line x1="2" y1="4"  x2="43" y2="4"  stroke="#1a3050" stroke-width="0.3"/>
        <line x1="2" y1="33" x2="43" y2="33" stroke="#1a3050" stroke-width="0.3"/>

        <!-- 온도 라벨 -->
        <text x="22.5" y="13" font-size="5" fill="#6688aa" font-family="monospace"
          text-anchor="middle">LM35 TEMP</text>

        <!-- 온도 값 표시 -->
        <text x="22.5" y="24" font-size="7.5" fill="${accentColor}" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.temperature.toFixed(1)}°C</text>

        <!-- 온도 − 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, -1)}">
          <rect x="4" y="26" width="10" height="6" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.6"/>
          <text x="9" y="31" font-size="7" fill="#66aadd" font-family="monospace"
            text-anchor="middle">−</text>
        </g>

        <!-- 온도 + 버튼 -->
        <g class="ctrl-btn" @pointerdown="${(e: PointerEvent) => this._step(e, +1)}">
          <rect x="31" y="26" width="10" height="6" rx="1.5"
            fill="#131e2e" stroke="#2a5a8a" stroke-width="0.6"/>
          <text x="36" y="31" font-size="7" fill="#66aadd" font-family="monospace"
            text-anchor="middle">+</text>
        </g>

        <!-- 핀 리드 3개 -->
        <!-- VCC -->
        <line x1="8"  y1="44" x2="8"  y2="64" stroke="#cc4433" stroke-width="1.8"/>
        <line x1="8"  y1="44" x2="8"  y2="64" stroke="white" stroke-width="0.5" opacity="0.25"/>
        <!-- OUT -->
        <line x1="22" y1="44" x2="22" y2="64" stroke="#4477cc" stroke-width="1.8"/>
        <line x1="22" y1="44" x2="22" y2="64" stroke="white" stroke-width="0.5" opacity="0.25"/>
        <!-- GND -->
        <line x1="36" y1="44" x2="36" y2="64" stroke="#666666" stroke-width="1.8"/>
        <line x1="36" y1="44" x2="36" y2="64" stroke="white" stroke-width="0.5" opacity="0.2"/>

        <!-- 핀 라벨 존 -->
        <rect x="0" y="55" width="45" height="13" fill="#0d0d14"/>
        <line x1="0" y1="55" x2="45" y2="55" stroke="#252535" stroke-width="0.5"/>
        <text x="8"  y="64" font-size="7" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">VCC</text>
        <text x="22" y="64" font-size="7" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">OUT</text>
        <text x="36" y="64" font-size="7" fill="#88ee99" font-family="monospace"
          text-anchor="middle" font-weight="bold">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-lm35': SimLm35; }
}
