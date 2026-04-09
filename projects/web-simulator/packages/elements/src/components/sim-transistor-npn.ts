import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-transistor-npn> — 2N2222 / BC547 NPN BJT 트랜지스터 (TO-92 패키지, 45×68px)
 *
 * 실물 기준 (TO-92):
 *   - 패키지: 검은색 반원통 (D자 단면, 앞=평면, 뒤=반원)
 *   - 3핀: E(Emitter), B(Base), C(Collector) — 왼쪽→오른쪽 순서
 *   - 핀 간격: 2.54mm, 하단에서 뻗어 나옴
 *   - 실크스크린: "2N2222" 텍스트 (평면 쪽에 각인)
 *   - 상단: 반원형 돔
 *
 * Pins: EMITTER(x=8, y=68), BASE(x=22, y=68), COLLECTOR(x=36, y=68)
 */
@customElement('sim-transistor-npn')
export class SimTransistorNpn extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 45px; height: 68px; }`,
  ];

  override get componentType() { return 'transistor-npn'; }
  override get pins() { return ['EMITTER', 'BASE', 'COLLECTOR']; }

  override setPinState(_pin: string, _value: number | string) {}

  // viewBox 0 0 12 18 (mm), host 45×68px (scale 3.75px/mm)
  // 핀 위치: E=x2mm, B=x6mm, C=x10mm → x=8,22,36(px) y=18mm→68px
  override getPinPositions() {
    return new Map([
      ['EMITTER',   { x: 8,  y: 68 }],
      ['BASE',      { x: 22, y: 68 }],
      ['COLLECTOR', { x: 36, y: 68 }],
    ]);
  }

  override render() {
    return html`
      <svg width="45" height="68" viewBox="0 0 12 18"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- TO-92 몸체 그라디언트 (D자 단면, 좌→우 평면→반원) -->
          <linearGradient id="to92-body-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#1a1a1a"/>
            <stop offset="40%"  stop-color="#2a2a2a"/>
            <stop offset="65%"  stop-color="#383838"/>
            <stop offset="85%"  stop-color="#444"/>
            <stop offset="100%" stop-color="#222"/>
          </linearGradient>
          <!-- 상단 돔 그라디언트 -->
          <linearGradient id="to92-dome-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#1c1c1c"/>
            <stop offset="50%"  stop-color="#3a3a3a"/>
            <stop offset="100%" stop-color="#1c1c1c"/>
          </linearGradient>
          <!-- 리드 그라디언트 -->
          <linearGradient id="to92-lead-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#888"/>
            <stop offset="50%"  stop-color="#c0c0c0"/>
            <stop offset="100%" stop-color="#888"/>
          </linearGradient>
        </defs>

        <!-- ─── 3개 리드선 (하단에서 아래로 뻗음) ─── -->
        <!-- Emitter (왼쪽, x=2mm) -->
        <rect x="1.65" y="12.5" width="0.7" height="5.5"
          fill="url(#to92-lead-${this.compId})"/>
        <line x1="2.0" y1="12.5" x2="2.0" y2="18"
          stroke="white" stroke-width="0.2" opacity="0.3"/>
        <!-- Base (중앙, x=6mm) -->
        <rect x="5.65" y="12.5" width="0.7" height="5.5"
          fill="url(#to92-lead-${this.compId})"/>
        <line x1="6.0" y1="12.5" x2="6.0" y2="18"
          stroke="white" stroke-width="0.2" opacity="0.3"/>
        <!-- Collector (오른쪽, x=10mm) -->
        <rect x="9.65" y="12.5" width="0.7" height="5.5"
          fill="url(#to92-lead-${this.compId})"/>
        <line x1="10.0" y1="12.5" x2="10.0" y2="18"
          stroke="white" stroke-width="0.2" opacity="0.3"/>

        <!-- ─── TO-92 메인 바디 ─── -->
        <!-- D자 하단 직선 베이스 -->
        <rect x="1.0" y="8.5" width="10" height="4.5"
          fill="url(#to92-body-${this.compId})"
          stroke="#111" stroke-width="0.25"/>

        <!-- 상단 반원형 돔 (TO-92 특징) -->
        <!-- 반원 클리핑을 위한 마스크 -->
        <defs>
          <clipPath id="to92-dome-clip-${this.compId}">
            <rect x="1.0" y="2.0" width="10" height="7"/>
          </clipPath>
        </defs>
        <ellipse cx="6" cy="8.8" rx="5" ry="6.8"
          fill="url(#to92-dome-${this.compId})"
          stroke="#111" stroke-width="0.25"
          clip-path="url(#to92-dome-clip-${this.compId})"/>

        <!-- 몸체 평면 쪽 (앞면) 경계 강조 -->
        <line x1="1.0" y1="8.5" x2="11.0" y2="8.5"
          stroke="#555" stroke-width="0.2"/>

        <!-- 상단 하이라이트 (반원 꼭대기 광택) -->
        <ellipse cx="6" cy="3.5" rx="2.5" ry="0.8"
          fill="white" opacity="0.07"/>

        <!-- 측면 광택 하이라이트 (우측 돔 부분) -->
        <path d="M 9.5 5.0 Q 10.5 7.0 10.5 9.5"
          stroke="white" stroke-width="0.4" fill="none" opacity="0.06"/>

        <!-- ─── 실크스크린 라벨 (평면 쪽 중앙) ─── -->
        <text x="6.0" y="11.5" font-size="1.4" fill="#888888"
          font-family="monospace" text-anchor="middle"
          font-weight="bold" letter-spacing="0.0"
          opacity="0.85">2N2222</text>
        <!-- 제조사 로고 자리 (작은 점) -->
        <circle cx="6.0" cy="9.7" r="0.3" fill="#666" opacity="0.6"/>

        <!-- ─── 핀 라벨 존 ─── -->
        <rect x="0" y="14.5" width="12" height="3.5" fill="#0d0d14"/>
        <line x1="0" y1="14.5" x2="12" y2="14.5" stroke="#252535" stroke-width="0.35"/>
        <text x="2.0" y="17.3" font-size="1.5" fill="#ffcc55"
          font-family="monospace" text-anchor="middle" font-weight="bold">E</text>
        <text x="6.0" y="17.3" font-size="1.5" fill="#88aaff"
          font-family="monospace" text-anchor="middle" font-weight="bold">B</text>
        <text x="10.0" y="17.3" font-size="1.5" fill="#ff8877"
          font-family="monospace" text-anchor="middle" font-weight="bold">C</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-transistor-npn': SimTransistorNpn; }
}
