import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-diode> — 1N4007 정류 다이오드 (axial lead, glass body, 76×30px)
 *
 * 실물 기준:
 *   - 몸체: 검은/짙은 회색 원통형 (직사각형 rx=2)
 *   - 캐소드 쪽 은색 밴드 (흰색/회색 띠) — 우측
 *   - "1N4007" 라벨 (흰색 실크스크린)
 *   - 리드선: 양쪽으로 길게 뻗음 (axial형)
 *
 * Pins: ANODE(x=0, y=15), CATHODE(x=76, y=15)
 *   좌=애노드, 우=캐소드(띠 있는 쪽)
 */
@customElement('sim-diode')
export class SimDiode extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 76px; height: 30px; }`,
  ];

  override get componentType() { return 'diode'; }
  override get pins() { return ['ANODE', 'CATHODE']; }

  override setPinState(_pin: string, _value: number | string) {}

  // viewBox 0 0 20 8 (mm), host 76×30px (scale 3.78px/mm)
  // 리드 중심 y=4mm → 4/8×30=15px
  // ANODE x=0, CATHODE x=76
  override getPinPositions() {
    return new Map([
      ['ANODE',   { x: 0,  y: 15 }],
      ['CATHODE', { x: 76, y: 15 }],
    ]);
  }

  override render() {
    return html`
      <svg width="76" height="30" viewBox="0 0 20 8"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 몸체 그라디언트 (3D 원통 효과) -->
          <linearGradient id="diode-body-${this.compId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#5a5a5a"/>
            <stop offset="25%"  stop-color="#2a2a2a"/>
            <stop offset="75%"  stop-color="#1a1a1a"/>
            <stop offset="100%" stop-color="#444"/>
          </linearGradient>
          <!-- 캐소드 밴드 그라디언트 (은색 링) -->
          <linearGradient id="diode-band-${this.compId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#d8d8d8"/>
            <stop offset="40%"  stop-color="#eeeeee"/>
            <stop offset="100%" stop-color="#999"/>
          </linearGradient>
          <!-- 리드선 그라디언트 -->
          <linearGradient id="diode-lead-${this.compId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#cccccc"/>
            <stop offset="50%"  stop-color="#aaaaaa"/>
            <stop offset="100%" stop-color="#888888"/>
          </linearGradient>
        </defs>

        <!-- ─── 리드선 (y=3.8~4.2, 수평선) ─── -->
        <rect x="0" y="3.72" width="20" height="0.56"
          fill="url(#diode-lead-${this.compId})"/>
        <!-- 리드 상단 하이라이트 -->
        <line x1="0" y1="3.8" x2="20" y2="3.8"
          stroke="white" stroke-width="0.12" opacity="0.4"/>

        <!-- ─── 몸체 (원통형 캡슐) ─── -->
        <!-- 메인 바디 (검은색, rx로 곡면 처리) -->
        <rect x="3.5" y="1.5" width="10" height="5" rx="1.2"
          fill="url(#diode-body-${this.compId})"
          stroke="#111" stroke-width="0.15"/>

        <!-- 몸체 좌측 에지 캡 (둥근 끝부분 약간 밝게) -->
        <ellipse cx="3.5" cy="4.0" rx="0.6" ry="2.5"
          fill="#3a3a3a" opacity="0.6"/>
        <!-- 몸체 우측 에지 캡 -->
        <ellipse cx="13.5" cy="4.0" rx="0.6" ry="2.5"
          fill="#3a3a3a" opacity="0.6"/>

        <!-- 몸체 상단 광택 하이라이트 -->
        <rect x="3.8" y="1.6" width="9.4" height="1.0" rx="0.8"
          fill="white" opacity="0.10"/>

        <!-- ─── 캐소드 밴드 (우측에서 1mm 위치) ─── -->
        <rect x="12.0" y="1.5" width="1.2" height="5"
          fill="url(#diode-band-${this.compId})"
          stroke="#bbb" stroke-width="0.08"/>
        <!-- 밴드 상단 하이라이트 -->
        <rect x="12.0" y="1.55" width="1.2" height="0.5"
          fill="white" opacity="0.35"/>

        <!-- ─── 실크스크린 라벨 "1N4007" ─── -->
        <text x="7.8" y="4.7" font-size="1.15" fill="#e0e0e0"
          font-family="monospace" text-anchor="middle"
          font-weight="bold" letter-spacing="0.05"
          opacity="0.88">1N4007</text>

        <!-- ─── 핀 라벨 존 ─── -->
        <!-- 애노드 쪽 (왼쪽) -->
        <text x="1.2" y="7.6" font-size="1.4" fill="#ff8877"
          font-family="monospace" text-anchor="middle"
          font-weight="bold">A</text>
        <!-- 캐소드 쪽 (오른쪽, 밴드 방향) -->
        <text x="18.8" y="7.6" font-size="1.4" fill="#88aaff"
          font-family="monospace" text-anchor="middle"
          font-weight="bold">K</text>

        <!-- 방향 화살표 (기호 표시: → 방향이 순방향 전류) -->
        <line x1="9.0" y1="5.6" x2="10.4" y2="5.6"
          stroke="#aaaaaa" stroke-width="0.2" opacity="0.5"/>
        <polygon points="10.4,5.3 11.0,5.6 10.4,5.9"
          fill="#aaaaaa" opacity="0.5"/>
        <line x1="11.0" y1="5.2" x2="11.0" y2="6.0"
          stroke="#aaaaaa" stroke-width="0.2" opacity="0.5"/>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-diode': SimDiode; }
}
