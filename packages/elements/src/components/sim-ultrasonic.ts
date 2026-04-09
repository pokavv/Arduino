import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-ultrasonic> — HC-SR04 초음파 거리 센서
 *
 * Pins: VCC, TRIG, ECHO, GND
 * 실물: 초록 PCB + 2개 트랜스듀서 원통
 */
@customElement('sim-ultrasonic')
export class SimUltrasonic extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 68px; height: 56px; }`,
  ];

  @property({ type: Number }) distanceCm = 20;
  @property({ type: Boolean }) trigActive = false;

  override get componentType() { return 'ultrasonic'; }
  override get pins() { return ['VCC', 'TRIG', 'ECHO', 'GND']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'DIST' || pin === 'distanceCm' || pin === 'ECHO') {
      this.distanceCm = Math.max(2, Math.min(400, v));
    } else if (pin === 'TRIG') {
      this.trigActive = v > 0;
    }
  }

  override getPinPositions() {
    return new Map([
      ['VCC',  { x:  9, y: 56 }],
      ['TRIG', { x: 25, y: 56 }],
      ['ECHO', { x: 43, y: 56 }],
      ['GND',  { x: 59, y: 56 }],
    ]);
  }

  /** 트랜스듀서 원통 렌더링 헬퍼 */
  private _transducer(cx: number, cy: number, active: boolean) {
    // 동심원 링 반경들
    const rings = [10, 7.5, 5.5, 3.2, 1.5];
    return html`
      <!-- 외각 실버 링 -->
      <circle cx="${cx}" cy="${cy}" r="11"
        fill="#787878" stroke="#555" stroke-width="0.8"/>
      <!-- 실버 바디 레이어 (위에서 빛) -->
      <circle cx="${cx}" cy="${cy}" r="10"
        fill="#555555"/>
      <circle cx="${cx}" cy="${cy}" r="10"
        fill="white" opacity="0.08"/>
      <!-- 메쉬 동심원들 -->
      ${rings.map((r, i) => html`
        <circle cx="${cx}" cy="${cy}" r="${r}"
          fill="none"
          stroke="${active
            ? (i < 2 ? '#6be06b' : i < 4 ? '#4ab04a' : '#2a802a')
            : (i < 2 ? '#666' : i < 4 ? '#3a4a3a' : '#2a3a2a')}"
          stroke-width="${i === 0 ? 0.9 : 0.6}"/>
      `)}
      <!-- 중앙 도트 -->
      <circle cx="${cx}" cy="${cy}" r="1.8"
        fill="${active ? '#88ff88' : '#3a3a3a'}"/>
      <!-- 상단 하이라이트 -->
      <ellipse cx="${cx - 3.5}" cy="${cy - 5}" rx="3" ry="1.8"
        fill="white" opacity="0.12" transform="rotate(-20,${cx - 3.5},${cy - 5})"/>
      <!-- TRIG 활성 시 초음파 방출 시각 효과 -->
      ${active ? html`
        <circle cx="${cx}" cy="${cy}" r="13" fill="none"
          stroke="#44ff44" stroke-width="0.8" opacity="0.5"/>
        <circle cx="${cx}" cy="${cy}" r="15.5" fill="none"
          stroke="#44ff44" stroke-width="0.5" opacity="0.3"/>
      ` : ''}
    `;
  }

  override render() {
    return html`
      <svg width="68" height="56" viewBox="0 0 68 56" xmlns="http://www.w3.org/2000/svg">

        <!-- ── 초록 PCB 기판 ── -->
        <rect x="0" y="0" width="68" height="40" rx="4"
          fill="#1a4a1a" stroke="#0a3010" stroke-width="1"/>
        <!-- PCB 상단 광택 -->
        <rect x="0" y="0" width="68" height="5" rx="3"
          fill="white" opacity="0.08"/>
        <!-- PCB 색 변화 (하단 약간 어둡게) -->
        <rect x="0" y="32" width="68" height="8"
          fill="#0a2a0a" opacity="0.4"/>

        <!-- ── 구리 패드 영역 ── -->
        ${[9, 25, 43, 59].map(x => html`
          <rect x="${x - 3}" y="33" width="6" height="5" rx="1"
            fill="#c08030" opacity="0.75"/>
        `)}

        <!-- ── HC-SR04 마킹 ── -->
        <text x="34" y="11" font-size="6" fill="#4fcc4f" font-family="monospace"
          text-anchor="middle" font-weight="bold">HC-SR04</text>
        <text x="34" y="20" font-size="5" fill="#3ab03a" font-family="monospace"
          text-anchor="middle">${this.distanceCm} cm</text>

        <!-- ── 트랜스듀서 왼쪽 (TRIG 연결) ── -->
        ${this._transducer(17, 20, this.trigActive)}
        <text x="17" y="35.5" font-size="5" fill="#5fcc5f" font-family="monospace"
          text-anchor="middle">T</text>

        <!-- ── 트랜스듀서 오른쪽 (ECHO 연결) ── -->
        ${this._transducer(51, 20, false)}
        <text x="51" y="35.5" font-size="5" fill="#5fcc5f" font-family="monospace"
          text-anchor="middle">R</text>

        <!-- ── 핀 4개 ── -->
        <rect x="7.5"  y="40" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="8"    y="40" width="1.5" height="16" rx="0.3" fill="white" opacity="0.35"/>

        <rect x="23.5" y="40" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="24"   y="40" width="1.5" height="16" rx="0.3" fill="white" opacity="0.35"/>

        <rect x="41.5" y="40" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="42"   y="40" width="1.5" height="16" rx="0.3" fill="white" opacity="0.35"/>

        <rect x="57.5" y="40" width="3" height="16" rx="0.5" fill="#aaaaaa"/>
        <rect x="58"   y="40" width="1.5" height="16" rx="0.3" fill="white" opacity="0.35"/>

        <!-- ── 핀 라벨 ── -->
        <text x="3"  y="54" font-size="4.5" fill="#ff8888" font-family="monospace">VCC</text>
        <text x="18" y="54" font-size="4.5" fill="#ffee88" font-family="monospace">TRG</text>
        <text x="37" y="54" font-size="4.5" fill="#88aaff" font-family="monospace">ECH</text>
        <text x="53" y="54" font-size="4.5" fill="#88ee88" font-family="monospace">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-ultrasonic': SimUltrasonic;
  }
}
