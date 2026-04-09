import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-sound-sensor> — KY-037 소리 감지 모듈 (76x60px)
 * Pins: VCC(x=10,y=60), GND(x=28,y=60), DOUT(x=46,y=60), AOUT(x=64,y=60)
 */
@customElement('sim-sound-sensor')
export class SimSoundSensor extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 76px; height: 60px; }`,
  ];

  @property({ type: Number }) soundLevel = 0;
  @property({ type: Boolean, reflect: true }) detected = false;

  override get componentType() { return 'sound-sensor'; }
  override get pins() { return ['VCC', 'GND', 'DOUT', 'AOUT']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'AOUT') { this.soundLevel = Math.max(0, Math.min(1023, v)); }
    if (pin === 'DOUT') { this.detected = v > 0; }
  }

  override getPinPositions() {
    return new Map([
      ['VCC',  { x: 10, y: 60 }],
      ['GND',  { x: 28, y: 60 }],
      ['DOUT', { x: 46, y: 60 }],
      ['AOUT', { x: 64, y: 60 }],
    ]);
  }

  override render() {
    const level = this.soundLevel / 1023;
    const barW = Math.round(level * 8);

    return html`
      <svg width="76" height="60" viewBox="0 0 20 16" xmlns="http://www.w3.org/2000/svg">
        <!-- PCB -->
        <rect x="0" y="0" width="20" height="16" rx="0.5"
          fill="#1a3a8a" stroke="#0d2060" stroke-width="0.3"/>
        <rect x="0" y="0" width="20" height="1.5" rx="0.5" fill="white" opacity="0.04"/>

        <!-- 마이크 (일렉트렛, 은색 원통) -->
        <circle cx="4.5" cy="6" r="3.2"
          fill="#888" stroke="#666" stroke-width="0.3"/>
        <circle cx="4.5" cy="6" r="2.8" fill="#aaa"/>
        <!-- 마이크 음공 (3개 홀) -->
        <circle cx="4.5" cy="4.5" r="0.5" fill="#444"/>
        <circle cx="3.3" cy="6.8" r="0.5" fill="#444"/>
        <circle cx="5.7" cy="6.8" r="0.5" fill="#444"/>
        <!-- 마이크 하이라이트 -->
        <ellipse cx="3.5" cy="4.5" rx="1.2" ry="0.7"
          fill="white" opacity="0.2" transform="rotate(-30,3.5,4.5)"/>

        <!-- 비교기 IC (LM393) -->
        <rect x="8.5" y="2.5" width="4.5" height="5" rx="0.3" fill="#1a1a1a" stroke="#333" stroke-width="0.2"/>
        <text x="10.75" y="5.5" font-size="0.9" fill="#777" font-family="monospace" text-anchor="middle">LM393</text>

        <!-- 가변저항 (파란 트리머) -->
        <rect x="14.5" y="2.5" width="3.5" height="3.5" rx="0.4" fill="#3355aa" stroke="#2244aa" stroke-width="0.2"/>
        <circle cx="16.25" cy="4.25" r="1.2" fill="#2244aa"/>
        <line x1="16.25" y1="3.2" x2="16.25" y2="5.3" stroke="#88aaff" stroke-width="0.4"/>

        <!-- 상태 LED (빨간) -->
        <circle cx="14" cy="8" r="0.8"
          fill="${this.detected ? '#ff3300' : '#440000'}"
          stroke="${this.detected ? '#ff6633' : '#220000'}" stroke-width="0.2"/>
        ${this.detected ? html`
          <circle cx="14" cy="8" r="1.2" fill="#ff3300" opacity="0.3"/>
        ` : ''}

        <!-- 소리 레벨 바 -->
        <rect x="8" y="8.5" width="10" height="2" rx="0.3" fill="#0a1830"/>
        ${Array.from({ length: 10 }, (_, i) => html`
          <rect x="${8.2 + i * 0.95}" y="8.7" width="0.7" height="1.6" rx="0.15"
            fill="${i < barW ? (i < 7 ? '#44cc44' : '#ff4444') : '#1a2a3a'}"/>
        `)}

        <!-- 핀 리드 -->
        <rect x="1.8"  y="16" width="1.4" height="4" rx="0.4" fill="#cc2200"/>
        <rect x="6.4"  y="16" width="1.4" height="4" rx="0.4" fill="#222"/>
        <rect x="10.8" y="16" width="1.4" height="4" rx="0.4" fill="#4477cc"/>
        <rect x="15.8" y="16" width="1.4" height="4" rx="0.4" fill="#ccaa44"/>

        <!-- 핀 라벨 -->
        <rect x="0" y="12" width="20" height="4" fill="#0d0d14"/>
        <line x1="0" y1="12" x2="20" y2="12" stroke="#252535" stroke-width="0.2"/>
        <text x="2.5"  y="14.8" font-size="1.5" fill="#ff8877" font-family="monospace" text-anchor="middle">VCC</text>
        <text x="7.1"  y="14.8" font-size="1.5" fill="#88ee99" font-family="monospace" text-anchor="middle">GND</text>
        <text x="11.5" y="14.8" font-size="1.5" fill="#88aaff" font-family="monospace" text-anchor="middle">DO</text>
        <text x="16.5" y="14.8" font-size="1.5" fill="#ffcc55" font-family="monospace" text-anchor="middle">AO</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-sound-sensor': SimSoundSensor; }
}
