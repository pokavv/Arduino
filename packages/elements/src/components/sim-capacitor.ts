import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-capacitor> — 전해 커패시터 (through-hole electrolytic, 40×60px)
 *
 * 실물 기준:
 *   - 알루미늄 원통 몸체 (짙은 파란색 슬리브 #1c4a7c)
 *   - 음극 스트라이프: 왼쪽에 흰색 세로 띠 + "−−−" 텍스트 반복
 *   - 상단 캡: 알루미늄 +  벤트 X자 각인
 *   - 하단 플라스틱 베이스: 검은색
 *   - 리드: PLUS(오른쪽, 더 길다), MINUS(왼쪽, 더 짧다) — 극성 구분
 *
 * Pins: PLUS(x=12, y=60), MINUS(x=28, y=60)
 */
@customElement('sim-capacitor')
export class SimCapacitor extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 40px; height: 60px; }`,
  ];

  /** 정전 용량 표시 문자열 (예: "100µF") */
  @property({ type: String }) capacitance = '100µF';
  /** 내압 전압 (예: "25V") */
  @property({ type: String }) voltage = '25V';

  override get componentType() { return 'capacitor'; }
  override get pins() { return ['PLUS', 'MINUS']; }

  override setPinState(_pin: string, _value: number | string) {}

  // viewBox 0 0 15 32 (mm), host 40×60px  (scale ≈ 2.67 px/mm)
  // 하단 리드 y=60 → viewBox y=32
  // PLUS (오른쪽, 더 긴 리드) x=10mm → 40×(10/15)≈26.7 → ≈ 28px   →  핀위치 x=28
  // MINUS(왼쪽,  짧은 리드) x=5mm  → 40×(5/15) ≈13.3 → ≈ 12px   →  핀위치 x=12
  override getPinPositions() {
    return new Map([
      ['PLUS',  { x: 28, y: 60 }],
      ['MINUS', { x: 12, y: 60 }],
    ]);
  }

  override render() {
    return html`
      <svg width="40" height="60" viewBox="0 0 15 32"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 알루미늄 원통 몸체 그라디언트 (측면 3D 광택) -->
          <linearGradient id="body-grad-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#0e2e55"/>
            <stop offset="8%"   stop-color="#1c4a7c"/>
            <stop offset="85%"  stop-color="#1c4a7c"/>
            <stop offset="100%" stop-color="#0e2e55"/>
          </linearGradient>
          <!-- 알루미늄 상단 캡 그라디언트 -->
          <linearGradient id="cap-grad-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#888"/>
            <stop offset="30%"  stop-color="#d8d8d8"/>
            <stop offset="60%"  stop-color="#c0c0c0"/>
            <stop offset="100%" stop-color="#888"/>
          </linearGradient>
          <!-- 음극 스트라이프 그라디언트 -->
          <linearGradient id="stripe-grad-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#e8e8e8"/>
            <stop offset="100%" stop-color="#c8c8c8"/>
          </linearGradient>
        </defs>

        <!-- ─── 하단 리드선 ─── -->
        <!-- MINUS(−) 리드 — 왼쪽, 짧다 (y=22 ~ 30) -->
        <line x1="4.5" y1="22" x2="4.5" y2="30"
          stroke="#aaaaaa" stroke-width="0.7"/>
        <line x1="4.5" y1="22" x2="4.5" y2="30"
          stroke="white" stroke-width="0.25" opacity="0.35"/>
        <!-- PLUS(+) 리드 — 오른쪽, 더 길다 (y=22 ~ 32) -->
        <line x1="10.5" y1="22" x2="10.5" y2="32"
          stroke="#aaaaaa" stroke-width="0.7"/>
        <line x1="10.5" y1="22" x2="10.5" y2="32"
          stroke="white" stroke-width="0.25" opacity="0.35"/>

        <!-- ─── 하단 검은 플라스틱 베이스 ─── -->
        <rect x="2" y="19.5" width="11" height="3.0" rx="0.4"
          fill="#1a1a1a" stroke="#333" stroke-width="0.3"/>
        <!-- 베이스 내 핀 홀 표시 -->
        <rect x="3.8" y="20" width="1.4" height="2" rx="0.2" fill="#111"/>
        <rect x="9.8" y="20" width="1.4" height="2" rx="0.2" fill="#111"/>

        <!-- ─── 원통 몸체 ─── -->
        <!-- 메인 슬리브 (파란색 알루미늄 피복) -->
        <rect x="2" y="3" width="11" height="17" rx="0.4"
          fill="url(#body-grad-${this.compId})"/>

        <!-- 음극 스트라이프 (왼쪽 흰색 세로 띠) -->
        <rect x="2" y="3" width="2.8" height="17"
          fill="url(#stripe-grad-${this.compId})" rx="0.4"/>
        <!-- 스트라이프 오른쪽 경계 미묘한 그림자 -->
        <rect x="4.6" y="3" width="0.4" height="17"
          fill="#0e2e55" opacity="0.4"/>

        <!-- 음극 스트라이프 "−" 기호 텍스트 -->
        <text x="3.4" y="7.2" font-size="1.7" fill="#1c1c1c"
          font-family="monospace" text-anchor="middle" font-weight="bold">−</text>
        <text x="3.4" y="10.0" font-size="1.7" fill="#1c1c1c"
          font-family="monospace" text-anchor="middle" font-weight="bold">−</text>
        <text x="3.4" y="12.8" font-size="1.7" fill="#1c1c1c"
          font-family="monospace" text-anchor="middle" font-weight="bold">−</text>
        <text x="3.4" y="15.6" font-size="1.7" fill="#1c1c1c"
          font-family="monospace" text-anchor="middle" font-weight="bold">−</text>
        <text x="3.4" y="18.4" font-size="1.7" fill="#1c1c1c"
          font-family="monospace" text-anchor="middle" font-weight="bold">−</text>

        <!-- 몸체 우측 광택 하이라이트 -->
        <rect x="11.5" y="3" width="1.2" height="17"
          fill="white" opacity="0.06" rx="0.3"/>

        <!-- 용량/전압 라벨 텍스트 (파란 몸체에 흰 글씨) -->
        <text x="8.2" y="10.5" font-size="1.8" fill="#e8e8e8"
          font-family="monospace" text-anchor="middle" font-weight="bold"
          transform="rotate(-90, 8.2, 10.5)"
          letter-spacing="0.1">${this.capacitance}</text>
        <text x="8.2" y="12.5" font-size="1.5" fill="#aaccff"
          font-family="monospace" text-anchor="middle"
          transform="rotate(-90, 8.2, 12.5)">${this.voltage}</text>

        <!-- ─── 상단 알루미늄 캡 ─── -->
        <!-- 캡 본체 -->
        <rect x="2" y="1" width="11" height="2.5" rx="0.4"
          fill="url(#cap-grad-${this.compId})"/>
        <!-- 캡 상단 하이라이트 라인 -->
        <rect x="2.2" y="1.1" width="10.6" height="0.6"
          fill="white" opacity="0.35" rx="0.2"/>
        <!-- 벤트 X자 각인 (안전 밸브) -->
        <!-- X 대각선 1 (\ 방향) -->
        <line x1="5.8" y1="1.4" x2="8.2" y2="3.0"
          stroke="#999" stroke-width="0.28" stroke-linecap="round"/>
        <!-- X 대각선 2 (/ 방향) -->
        <line x1="8.2" y1="1.4" x2="5.8" y2="3.0"
          stroke="#999" stroke-width="0.28" stroke-linecap="round"/>
        <!-- 캡 좌우 에지 다크 섀도 -->
        <rect x="2" y="1" width="0.8" height="2.5"
          fill="#666" opacity="0.3" rx="0.3"/>
        <rect x="12.2" y="1" width="0.8" height="2.5"
          fill="#666" opacity="0.3" rx="0.3"/>

        <!-- ─── 상단 돔 (약간 볼록) ─── -->
        <ellipse cx="7.5" cy="1.1" rx="5.5" ry="0.7"
          fill="#bbbbbb" opacity="0.25"/>

        <!-- ─── 핀 라벨 존 (하단) ─── -->
        <rect x="0" y="25" width="15" height="7" fill="#0d0d14"/>
        <line x1="0" y1="25" x2="15" y2="25" stroke="#252535" stroke-width="0.4"/>
        <text x="4.5" y="29.5" font-size="2.0" fill="#88aaff"
          font-family="monospace" text-anchor="middle" font-weight="bold">−</text>
        <text x="10.5" y="29.5" font-size="2.0" fill="#ff8877"
          font-family="monospace" text-anchor="middle" font-weight="bold">+</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-capacitor': SimCapacitor; }
}
