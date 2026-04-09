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
    css`:host { width: 68px; height: 54px; }`,
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
      ['VCC',  { x:  9, y: 54 }],
      ['TRIG', { x: 25, y: 54 }],
      ['ECHO', { x: 43, y: 54 }],
      ['GND',  { x: 59, y: 54 }],
    ]);
  }

  override render() {
    // 트랜스듀서 동심원 레이어 수
    const rings = [10, 7.5, 5.5, 3];

    return html`
      <svg width="68" height="54" viewBox="0 0 68 54">
        <defs>
          <!-- 초록 PCB 기판 -->
          <linearGradient id="usoPcbGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#2a6a2a"/>
            <stop offset="50%"  stop-color="#1a4a1a"/>
            <stop offset="100%" stop-color="#0e3010"/>
          </linearGradient>
          <!-- 트랜스듀서 원통 외각 (실버) -->
          <radialGradient id="usoTransGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stop-color="#888"/>
            <stop offset="50%"  stop-color="#444"/>
            <stop offset="100%" stop-color="#111"/>
          </radialGradient>
          <!-- 트랜스듀서 내부 원 (검은 메쉬) -->
          <radialGradient id="usoMeshGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stop-color="#333"/>
            <stop offset="70%"  stop-color="#111"/>
            <stop offset="100%" stop-color="#080808"/>
          </radialGradient>
          <!-- 핀 광택 -->
          <linearGradient id="usoPinGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stop-color="#999"/>
            <stop offset="50%"  stop-color="#eee"/>
            <stop offset="100%" stop-color="#999"/>
          </linearGradient>
        </defs>

        <!-- PCB 기판 (초록 rounded rect) -->
        <rect x="0" y="0" width="68" height="40" rx="4"
          fill="url(#usoPcbGrad)" stroke="#3a8a3a" stroke-width="1"/>
        <!-- PCB 상단 광택 -->
        <rect x="0" y="0" width="68" height="5" rx="3"
          fill="white" opacity="0.1"/>

        <!-- PCB 구리 트레이스 패드 (핀 근처) -->
        ${[9, 25, 43, 59].map((x) => html`
          <rect x="${x - 3}" y="32" width="6" height="5" rx="1"
            fill="#b87333" opacity="0.8"/>
        `)}

        <!-- HC-SR04 텍스트 -->
        <text x="34" y="13" font-size="6" fill="#4fcc4f" font-family="monospace"
          text-anchor="middle" font-weight="bold">HC-SR04</text>

        <!-- 거리 측정값 -->
        <text x="34" y="22" font-size="5.5" fill="#88ee88" font-family="monospace"
          text-anchor="middle">${this.distanceCm}cm</text>

        <!-- 트랜스듀서 왼쪽 (TRIG) -->
        <!-- 외각 은색 원통 -->
        <circle cx="17" cy="20" r="10.5"
          fill="url(#usoTransGrad)" stroke="#666" stroke-width="1"/>
        <!-- 내부 동심원들 -->
        ${rings.map((r, i) => html`
          <circle cx="17" cy="20" r="${r}"
            fill="${i === rings.length - 1 ? 'url(#usoMeshGrad)' : 'none'}"
            stroke="${i === 0 ? '#777' : i === 1 ? '#555' : i === 2 ? '#3a3' : '#2a2'}"
            stroke-width="0.8"/>
        `)}
        <!-- 중앙 도트 -->
        <circle cx="17" cy="20" r="1.5" fill="#555"/>
        <!-- 트랜스듀서 상단 하이라이트 -->
        <ellipse cx="13" cy="15" rx="3" ry="2"
          fill="white" opacity="0.12" transform="rotate(-20,13,15)"/>
        <text x="17" y="35" font-size="5" fill="#4fcc4f" font-family="monospace"
          text-anchor="middle">T</text>

        <!-- 트랜스듀서 오른쪽 (ECHO) -->
        <circle cx="51" cy="20" r="10.5"
          fill="url(#usoTransGrad)" stroke="#666" stroke-width="1"/>
        ${rings.map((r, i) => html`
          <circle cx="51" cy="20" r="${r}"
            fill="${i === rings.length - 1 ? 'url(#usoMeshGrad)' : 'none'}"
            stroke="${i === 0 ? '#777' : i === 1 ? '#555' : i === 2 ? '#3a3' : '#2a2'}"
            stroke-width="0.8"/>
        `)}
        <circle cx="51" cy="20" r="1.5" fill="#555"/>
        <ellipse cx="47" cy="15" rx="3" ry="2"
          fill="white" opacity="0.12" transform="rotate(-20,47,15)"/>
        <text x="51" y="35" font-size="5" fill="#4fcc4f" font-family="monospace"
          text-anchor="middle">R</text>

        <!-- 핀 4개 -->
        <rect x="7.5"  y="40" width="3" height="14" rx="0.5" fill="url(#usoPinGrad)"/>
        <rect x="23.5" y="40" width="3" height="14" rx="0.5" fill="url(#usoPinGrad)"/>
        <rect x="41.5" y="40" width="3" height="14" rx="0.5" fill="url(#usoPinGrad)"/>
        <rect x="57.5" y="40" width="3" height="14" rx="0.5" fill="url(#usoPinGrad)"/>

        <!-- 핀 라벨 -->
        <text x="3"  y="52" font-size="4.5" fill="#f88" font-family="monospace">VCC</text>
        <text x="18" y="52" font-size="4.5" fill="#ff8" font-family="monospace">TRG</text>
        <text x="37" y="52" font-size="4.5" fill="#8af" font-family="monospace">ECH</text>
        <text x="53" y="52" font-size="4.5" fill="#8f8" font-family="monospace">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-ultrasonic': SimUltrasonic;
  }
}
