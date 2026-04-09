import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-stepper> — 28BYJ-48 스테퍼 모터 (95x120px)
 * 파란색 원통 + 기어박스 + 5핀 커넥터
 * Pins: IN1(x=10), IN2(x=28), VCC(x=46), IN3(x=64), IN4(x=82), y=120
 */
@customElement('sim-stepper')
export class SimStepper extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 95px; height: 120px; }`,
  ];

  @property({ type: Number }) stepAngle = 0;
  private _pins: Record<string, number> = { IN1:0, IN2:0, IN3:0, IN4:0 };
  private _step = 0;
  private readonly _sequence = [
    [1,0,0,0],[1,1,0,0],[0,1,0,0],[0,1,1,0],
    [0,0,1,0],[0,0,1,1],[0,0,0,1],[1,0,0,1],
  ];

  override get componentType() { return 'stepper'; }
  override get pins() { return ['IN1','IN2','VCC','IN3','IN4']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    this._pins[pin] = v > 0 ? 1 : 0;
    // 시퀀스 감지로 스텝 업데이트
    const cur = [this._pins['IN1'],this._pins['IN2'],this._pins['IN3'],this._pins['IN4']];
    const idx = this._sequence.findIndex(s => s.every((v,i) => v === cur[i]));
    if (idx >= 0) {
      const prev = (idx - 1 + 8) % 8;
      if (prev === this._step) this.stepAngle = (this.stepAngle + 5.625 / 64) % 360;
      else this.stepAngle = (this.stepAngle - 5.625 / 64 + 360) % 360;
      this._step = idx;
      this.requestUpdate();
    }
  }

  override getPinPositions() {
    return new Map([
      ['IN1', { x: 10, y: 120 }],
      ['IN2', { x: 28, y: 120 }],
      ['VCC', { x: 46, y: 120 }],
      ['IN3', { x: 64, y: 120 }],
      ['IN4', { x: 82, y: 120 }],
    ]);
  }

  override render() {
    const angle = this.stepAngle;
    // 5핀 커넥터 와이어 색상 (실물: 주황/노랑/빨강/분홍/파랑)
    const wireColors = ['#ff6600','#ffcc00','#ff2200','#ff88cc','#0044ff'];

    return html`
      <svg width="95" height="120" viewBox="0 0 25 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="body-g-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#0d47a1"/>
            <stop offset="30%"  stop-color="#1565c0"/>
            <stop offset="50%"  stop-color="#1976d2"/>
            <stop offset="70%"  stop-color="#1565c0"/>
            <stop offset="100%" stop-color="#0d47a1"/>
          </linearGradient>
          <linearGradient id="gear-g-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#e8e8e8"/>
            <stop offset="40%"  stop-color="#f5f5f5"/>
            <stop offset="100%" stop-color="#d0d0d0"/>
          </linearGradient>
        </defs>

        <!-- 기어박스 (흰색/크림색, 왼쪽) -->
        <rect x="0" y="4" width="8" height="16" rx="0.8"
          fill="url(#gear-g-${this.compId})" stroke="#bbb" stroke-width="0.3"/>
        <!-- 기어박스 출력축 -->
        <rect x="-1" y="10.5" width="3" height="3" rx="0.6"
          fill="#d0d0d0" stroke="#aaa" stroke-width="0.2"/>
        <!-- 기어박스 스크류 홀 2개 -->
        <circle cx="4" cy="6"  r="0.8" fill="#888" stroke="#666" stroke-width="0.2"/>
        <circle cx="4" cy="18" r="0.8" fill="#888" stroke="#666" stroke-width="0.2"/>
        <!-- 기어박스 텍스트 -->
        <text x="4" y="12.5" font-size="1.4" fill="#555" font-family="monospace"
          text-anchor="middle" transform="rotate(-90,4,12)">GEAR</text>

        <!-- 메인 모터 원통 (파란색) -->
        <rect x="7" y="2" width="16" height="20" rx="2.5"
          fill="url(#body-g-${this.compId})" stroke="#0a3070" stroke-width="0.4"/>
        <!-- 상단 엔드캡 -->
        <ellipse cx="15" cy="2" rx="8" ry="1.5" fill="#1976d2" stroke="#0d47a1" stroke-width="0.3"/>
        <!-- 하단 엔드캡 -->
        <ellipse cx="15" cy="22" rx="8" ry="1.5" fill="#1976d2" stroke="#0d47a1" stroke-width="0.3"/>

        <!-- 모터 볼트 4개 -->
        <circle cx="9"  cy="4"  r="0.6" fill="#888" stroke="#666" stroke-width="0.2"/>
        <circle cx="21" cy="4"  r="0.6" fill="#888" stroke="#666" stroke-width="0.2"/>
        <circle cx="9"  cy="20" r="0.6" fill="#888" stroke="#666" stroke-width="0.2"/>
        <circle cx="21" cy="20" r="0.6" fill="#888" stroke="#666" stroke-width="0.2"/>

        <!-- 로터 표시 (회전 각도) -->
        <circle cx="15" cy="12" r="5" fill="#0d47a1" opacity="0.6"/>
        <circle cx="15" cy="12" r="4.5" fill="none" stroke="#1976d2" stroke-width="0.3"/>
        <line
          x1="15" y1="12"
          x2="${(15 + 4 * Math.sin(angle * Math.PI / 180)).toFixed(2)}"
          y2="${(12 - 4 * Math.cos(angle * Math.PI / 180)).toFixed(2)}"
          stroke="#88bbff" stroke-width="0.6" stroke-linecap="round"/>
        <circle cx="15" cy="12" r="0.8" fill="#aaccff"/>

        <!-- "28BYJ-48" 라벨 -->
        <text x="15" y="7.5" font-size="1.5" fill="#aaccff" font-family="monospace"
          text-anchor="middle" font-weight="bold">28BYJ-48</text>

        <!-- 5핀 커넥터 (흰색 플라스틱) -->
        <rect x="3" y="22" width="19" height="3.5" rx="0.5"
          fill="#e8e8e8" stroke="#bbb" stroke-width="0.3"/>
        <!-- 커넥터 핀 홀 5개 -->
        ${[5,8,11,14,17].map((x) => html`
          <rect x="${x - 0.7}" y="23" width="1.4" height="2" rx="0.3"
            fill="#1a1a1a" stroke="#333" stroke-width="0.2"/>
        `)}

        <!-- 와이어 5개 (색깔 구분) -->
        ${[5,8,11,14,17].map((x, i) => html`
          <rect x="${x - 0.6}" y="25.5" width="1.2" height="6.5" rx="0.4"
            fill="${wireColors[i]}"/>
        `)}

        <!-- 핀 라벨 -->
        <rect x="0" y="28" width="25" height="4" fill="#0d0d14"/>
        <line x1="0" y1="28" x2="25" y2="28" stroke="#252535" stroke-width="0.2"/>
        <text x="5"  y="31.5" font-size="1.5" fill="#ff8844" font-family="monospace" text-anchor="middle">IN1</text>
        <text x="8"  y="31.5" font-size="1.5" fill="#ffcc44" font-family="monospace" text-anchor="middle">IN2</text>
        <text x="11" y="31.5" font-size="1.5" fill="#ff8877" font-family="monospace" text-anchor="middle">VCC</text>
        <text x="14" y="31.5" font-size="1.5" fill="#ff88cc" font-family="monospace" text-anchor="middle">IN3</text>
        <text x="17" y="31.5" font-size="1.5" fill="#88aaff" font-family="monospace" text-anchor="middle">IN4</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-stepper': SimStepper; }
}
