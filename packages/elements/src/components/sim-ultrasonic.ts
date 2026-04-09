import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-ultrasonic> — HC-SR04 초음파 거리 센서
 *
 * Pins: VCC, TRIG, ECHO, GND
 */
@customElement('sim-ultrasonic')
export class SimUltrasonic extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 60px; height: 50px; }`,
  ];

  @property({ type: Number }) distanceCm = 20;

  override get componentType() { return 'ultrasonic'; }
  override get pins() { return ['VCC', 'TRIG', 'ECHO', 'GND']; }
  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'DIST' || pin === 'distanceCm' || pin === 'ECHO') {
      this.distanceCm = Math.max(2, Math.min(400, v));
    }
  }

  override getPinPositions() {
    return new Map([
      ['VCC',  { x:  8, y: 50 }],
      ['TRIG', { x: 23, y: 50 }],
      ['ECHO', { x: 38, y: 50 }],
      ['GND',  { x: 53, y: 50 }],
    ]);
  }

  override render() {
    return html`
      <svg width="60" height="50" viewBox="0 0 60 50">
        <!-- PCB -->
        <rect x="0" y="0" width="60" height="36" rx="3" fill="#1a3a1a" stroke="#2a6a2a" stroke-width="1"/>
        <!-- 트랜스듀서 2개 -->
        <circle cx="16" cy="16" r="10" fill="#111" stroke="#444" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="#333"/>
        <circle cx="16" cy="16" r="3" fill="#555"/>
        <text x="16" y="32" font-size="5" fill="#888" text-anchor="middle" font-family="monospace">T</text>

        <circle cx="44" cy="16" r="10" fill="#111" stroke="#444" stroke-width="2"/>
        <circle cx="44" cy="16" r="6" fill="#333"/>
        <circle cx="44" cy="16" r="3" fill="#555"/>
        <text x="44" y="32" font-size="5" fill="#888" text-anchor="middle" font-family="monospace">R</text>

        <!-- 거리 표시 -->
        <text x="30" y="10" font-size="5.5" fill="#4a9" font-family="monospace" text-anchor="middle">
          ${this.distanceCm}cm
        </text>

        <!-- 핀 4개 -->
        ${['VCC','TRIG','ECHO','GND'].map((p, i) => html`
          <line x1="${8 + i * 15}" y1="36" x2="${8 + i * 15}" y2="50" stroke="#aaa" stroke-width="2"/>
          <text x="${2 + i * 15}" y="49" font-size="4.5" fill="#888" font-family="monospace">${p[0]}</text>
        `)}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-ultrasonic': SimUltrasonic;
  }
}
