import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-hall-sensor> — KY-035 홀 이펙트 센서 A3144 (TO-92 패키지, 45×68px)
 * 실물: 검은 반원통형 D자 단면 TO-92 패키지, "A3144" 실크스크린
 * Pins: VCC, GND, OUT
 */
@customElement('sim-hall-sensor')
export class SimHallSensor extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 45px; height: 68px; }`,
  ];

  @property({ type: Boolean, reflect: true }) detected = false;

  override get componentType() { return 'hall-sensor'; }
  override get pins() { return ['VCC', 'GND', 'OUT']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'OUT') {
      // A3144: Active LOW — 자기장 감지 시 OUT = LOW
      this.detected = v === 0;
    }
  }

  override getPinPositions() {
    return new Map([
      ['VCC', { x: 8,  y: 68 }],
      ['GND', { x: 22, y: 68 }],
      ['OUT', { x: 36, y: 68 }],
    ]);
  }

  private _onToggle(e: PointerEvent) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    this.detected = !this.detected;
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('sim-change', {
      bubbles: true, composed: true,
      detail: { detected: this.detected },
    }));
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
    }, 60);
  }

  override render() {
    const fieldOpacity = this.detected ? 0.7 : 0;

    return html`
      <svg width="45" height="68" viewBox="0 0 45 68" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- TO-92 몸체 그라디언트 (D자 단면) -->
          <linearGradient id="to92-body-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#2a2a2a"/>
            <stop offset="35%"  stop-color="#444444"/>
            <stop offset="60%"  stop-color="#2a2a2a"/>
            <stop offset="100%" stop-color="#111111"/>
          </linearGradient>
          <!-- 자기장 글로우 -->
          <radialGradient id="hall-glow-${this.compId}" cx="50%" cy="40%" r="55%">
            <stop offset="0%"   stop-color="#4499ff" stop-opacity="${fieldOpacity * 0.5}"/>
            <stop offset="100%" stop-color="#4499ff" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- 토글 버튼 영역 (상단 y=0~26px) -->
        <rect x="2" y="2" width="41" height="22" rx="2" fill="#0c1420"/>
        <text x="22.5" y="11" font-size="4.5" fill="#6688aa" font-family="monospace" text-anchor="middle">HALL SENSOR</text>
        <g style="cursor:pointer" @pointerdown="${this._onToggle}">
          <rect x="6" y="14" width="33" height="8" rx="3"
            fill="${this.detected ? '#1a3a1a' : '#1a1a2a'}"
            stroke="${this.detected ? '#44bb44' : '#334455'}" stroke-width="0.8"/>
          <text x="22.5" y="20" font-size="5.5" fill="${this.detected ? '#44ff44' : '#556677'}"
            font-family="monospace" text-anchor="middle" font-weight="bold">
            ${this.detected ? '🧲 DETECTED' : 'NO FIELD'}
          </text>
        </g>

        <!-- 자기장 글로우 배경 (감지 시) -->
        <ellipse cx="22.5" cy="18" rx="22" ry="20"
          fill="url(#hall-glow-${this.compId})"/>

        <!-- ── TO-92 D자 단면 몸체 ── -->
        <!-- 평평한 면이 앞쪽(하단), 둥근 면이 뒤쪽 -->
        <!-- 몸체 상단 반원 (둥근 뒷면) -->
        <path d="M 7 28 A 15.5 15.5 0 0 1 38 28 L 38 44 L 7 44 Z"
          fill="url(#to92-body-${this.compId})"
          stroke="${this.detected ? '#4499ff55' : '#222222'}" stroke-width="0.8"/>
        <!-- 몸체 하단 직사각형 (평평한 앞면) -->
        <rect x="7" y="28" width="31" height="16" rx="0"
          fill="url(#to92-body-${this.compId})"
          stroke="${this.detected ? '#4499ff55' : '#222222'}" stroke-width="0.8"/>
        <!-- 몸체 전체 클리핑용 합성 -->
        <path d="M 7 44 L 7 28 A 15.5 15.5 0 0 1 38 28 L 38 44 Z"
          fill="url(#to92-body-${this.compId})"/>

        <!-- 3D 하이라이트 (상단 곡면) -->
        <path d="M 10 28 A 12.5 12.5 0 0 1 35 28"
          fill="none" stroke="white" stroke-width="1" opacity="0.18"/>

        <!-- 측면 음영 -->
        <rect x="34" y="28" width="4" height="16"
          fill="black" opacity="0.25"/>
        <rect x="7"  y="28" width="4" height="16"
          fill="white" opacity="0.06"/>

        <!-- "A3144" 실크스크린 텍스트 -->
        <text x="22.5" y="36.5" font-size="5.5" fill="#aaaaaa" font-family="monospace"
          text-anchor="middle" font-weight="bold">A3144</text>
        <!-- 하단 보조 텍스트 -->
        <text x="22.5" y="42.5" font-size="3.8" fill="#666666" font-family="monospace"
          text-anchor="middle">HALL</text>

        <!-- 자기장 라인 (감지 시) -->
        ${this.detected ? html`
          <g opacity="${fieldOpacity}" stroke="#4499ff" stroke-width="0.8" fill="none" stroke-linecap="round">
            <!-- 왼쪽 자기장 라인 -->
            <path d="M 3 20 Q 0 16 3 12 Q 6 8 3 4"/>
            <path d="M 6 22 Q 2 18 6 14 Q 10 10 6 6"/>
            <!-- 오른쪽 자기장 라인 -->
            <path d="M 42 20 Q 45 16 42 12 Q 39 8 42 4"/>
            <path d="M 39 22 Q 43 18 39 14 Q 35 10 39 6"/>
          </g>
          <!-- 중앙 감지 표시 -->
          <circle cx="22.5" cy="14" r="3"
            fill="none" stroke="#4499ff" stroke-width="0.8" opacity="0.6"/>
          <circle cx="22.5" cy="14" r="1.2"
            fill="#4499ff" opacity="0.8"/>
        ` : ''}

        <!-- 핀 리드 3개 -->
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
  interface HTMLElementTagNameMap { 'sim-hall-sensor': SimHallSensor; }
}
