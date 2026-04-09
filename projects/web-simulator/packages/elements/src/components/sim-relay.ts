import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-relay> — 5V 릴레이 모듈 (PCB + 릴레이 케이스 + LED, 95×114px)
 *
 * 실물 기준:
 *   - PCB: 짙은 파란색 (#1a3a6a), 전체 기판
 *   - 릴레이 바디: 검은색 직사각형 케이스 (#1a1a1a), 약 15×12mm
 *   - 상태 LED: IN핀 HIGH 시 빨간 LED 점등
 *   - 나사형 터미널 블록: COM/NO/NC (상단 출력)
 *   - 제어 핀 헤더: VCC/GND/IN (하단 입력)
 *
 * 핀 위치:
 *   입력: VCC(x=15, y=114), GND(x=38, y=114), IN(x=61, y=114)
 *   출력: COM(x=10, y=0), NO(x=45, y=0), NC(x=80, y=0)
 */
@customElement('sim-relay')
export class SimRelay extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 95px; height: 114px; }
    `,
  ];

  /** 릴레이 활성화 상태 (IN 핀 HIGH → true) */
  @property({ type: Boolean, reflect: true }) active = false;

  override get componentType() { return 'relay'; }
  override get pins() { return ['VCC', 'GND', 'IN', 'COM', 'NO', 'NC']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'IN') {
      this.active = v > 0;
    }
  }

  override getPinPositions() {
    return new Map([
      ['VCC', { x: 15, y: 114 }],
      ['GND', { x: 38, y: 114 }],
      ['IN',  { x: 61, y: 114 }],
      ['COM', { x: 10, y: 0 }],
      ['NO',  { x: 45, y: 0 }],
      ['NC',  { x: 80, y: 0 }],
    ]);
  }

  override render() {
    // viewBox 0 0 25 30 (mm), host 95×114px (scale 3.8px/mm)
    const ledColor   = this.active ? '#ff2200' : '#330000';
    const ledGlow    = this.active ? '#ff6644' : 'none';
    const ledOpacity = this.active ? '1' : '0.7';
    // 릴레이 암 위치 (활성: NO쪽 연결, 비활성: NC쪽 연결)
    const armAngle = this.active ? -12 : 12;

    return html`
      <svg width="95" height="114" viewBox="0 0 25 30"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- PCB 그라디언트 -->
          <linearGradient id="pcb-grad-${this.compId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stop-color="#1e4475"/>
            <stop offset="100%" stop-color="#142d58"/>
          </linearGradient>
          <!-- 릴레이 케이스 그라디언트 -->
          <linearGradient id="relay-case-${this.compId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#2a2a2a"/>
            <stop offset="40%"  stop-color="#1a1a1a"/>
            <stop offset="100%" stop-color="#111"/>
          </linearGradient>
          <!-- 터미널 블록 그라디언트 -->
          <linearGradient id="terminal-grad-${this.compId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#2a8050"/>
            <stop offset="100%" stop-color="#1a5a38"/>
          </linearGradient>
          <!-- 핀 헤더 그라디언트 -->
          <linearGradient id="header-grad-${this.compId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#333"/>
            <stop offset="100%" stop-color="#1a1a1a"/>
          </linearGradient>
        </defs>

        <!-- ─── PCB 기판 ─── -->
        <rect x="0.3" y="1.5" width="24.4" height="27" rx="0.5"
          fill="url(#pcb-grad-${this.compId})"
          stroke="#0a2040" stroke-width="0.3"/>
        <!-- PCB 상단 하이라이트 -->
        <rect x="0.5" y="1.6" width="24" height="1.0" rx="0.3"
          fill="white" opacity="0.04"/>
        <!-- PCB 구리 패턴 (회로 트레이스 느낌) -->
        <line x1="2" y1="7" x2="4" y2="7" stroke="#c8a028" stroke-width="0.15" opacity="0.4"/>
        <line x1="2" y1="7" x2="2" y2="9" stroke="#c8a028" stroke-width="0.15" opacity="0.4"/>
        <line x1="21" y1="7" x2="23" y2="7" stroke="#c8a028" stroke-width="0.15" opacity="0.4"/>
        <line x1="4" y1="24" x2="4" y2="26" stroke="#c8a028" stroke-width="0.15" opacity="0.4"/>
        <line x1="21" y1="24" x2="21" y2="26" stroke="#c8a028" stroke-width="0.15" opacity="0.4"/>

        <!-- ─── 상단 나사형 터미널 블록 (COM/NO/NC) ─── -->
        <!-- 터미널 하우징 -->
        <rect x="0.5" y="0.2" width="24" height="4.0" rx="0.5"
          fill="url(#terminal-grad-${this.compId})"
          stroke="#0d3d22" stroke-width="0.25"/>
        <!-- 터미널 3개 홀 (나사 구멍) -->
        <!-- COM -->
        <rect x="1.2" y="0.5" width="3" height="3" rx="0.4"
          fill="#145030" stroke="#0a3020" stroke-width="0.2"/>
        <circle cx="2.7" cy="2.0" r="0.9"
          fill="#0a2a18" stroke="#1a6040" stroke-width="0.2"/>
        <circle cx="2.7" cy="2.0" r="0.35" fill="#888"/>
        <!-- NO (정상 열림) -->
        <rect x="11" y="0.5" width="3" height="3" rx="0.4"
          fill="#145030" stroke="#0a3020" stroke-width="0.2"/>
        <circle cx="12.5" cy="2.0" r="0.9"
          fill="#0a2a18" stroke="#1a6040" stroke-width="0.2"/>
        <circle cx="12.5" cy="2.0" r="0.35" fill="#888"/>
        <!-- NC (정상 닫힘) -->
        <rect x="20.8" y="0.5" width="3" height="3" rx="0.4"
          fill="#145030" stroke="#0a3020" stroke-width="0.2"/>
        <circle cx="22.3" cy="2.0" r="0.9"
          fill="#0a2a18" stroke="#1a6040" stroke-width="0.2"/>
        <circle cx="22.3" cy="2.0" r="0.35" fill="#888"/>
        <!-- 터미널 라벨 -->
        <text x="2.7" y="4.8" font-size="1.1" fill="#a0ffcc"
          font-family="monospace" text-anchor="middle" font-weight="bold">COM</text>
        <text x="12.5" y="4.8" font-size="1.1" fill="#88ffaa"
          font-family="monospace" text-anchor="middle" font-weight="bold">NO</text>
        <text x="22.3" y="4.8" font-size="1.1" fill="#ffaa88"
          font-family="monospace" text-anchor="middle" font-weight="bold">NC</text>

        <!-- ─── 릴레이 케이스 (검은색 직사각형 바디) ─── -->
        <rect x="4.5" y="6.0" width="16" height="13" rx="0.6"
          fill="url(#relay-case-${this.compId})"
          stroke="#050505" stroke-width="0.3"/>
        <!-- 케이스 상단 에지 하이라이트 -->
        <rect x="4.5" y="6.0" width="16" height="0.8" rx="0.5"
          fill="white" opacity="0.05"/>
        <!-- 케이스 핀 아웃 소켓 표시 (좌측) -->
        <rect x="4.7" y="8.5" width="1.5" height="7" rx="0.3"
          fill="#222" stroke="#333" stroke-width="0.2"/>
        <!-- 케이스 핀 아웃 소켓 표시 (우측) -->
        <rect x="18.8" y="8.5" width="1.5" height="7" rx="0.3"
          fill="#222" stroke="#333" stroke-width="0.2"/>
        <!-- 핀 홀 4개 (좌측) -->
        <circle cx="5.45" cy="9.5"  r="0.4" fill="#111"/>
        <circle cx="5.45" cy="11.0" r="0.4" fill="#111"/>
        <circle cx="5.45" cy="12.5" r="0.4" fill="#111"/>
        <circle cx="5.45" cy="14.0" r="0.4" fill="#111"/>

        <!-- 릴레이 코일 표시 (케이스 중앙 텍스트) -->
        <text x="12.5" y="11.5" font-size="1.4" fill="#aaaaaa"
          font-family="monospace" text-anchor="middle"
          font-weight="bold" letter-spacing="0.1">5V</text>
        <text x="12.5" y="13.5" font-size="1.1" fill="#888888"
          font-family="monospace" text-anchor="middle">RELAY</text>
        <!-- 내부 접점 심볼 (간략화된 회로 기호) -->
        <line x1="7.5" y1="16.5" x2="17.5" y2="16.5"
          stroke="#555" stroke-width="0.2" opacity="0.5"/>
        <!-- 접점 암 (활성 상태에 따라 각도 변경) -->
        <g transform="rotate(${armAngle}, 12.5, 16.5)">
          <line x1="7.5" y1="16.5" x2="12.5" y2="16.5"
            stroke="#888" stroke-width="0.35"/>
          <circle cx="12.5" cy="16.5" r="0.4" fill="#aaa"/>
        </g>

        <!-- ─── 전류 제한 저항 (PCB 상의 SMD 저항) ─── -->
        <rect x="3.0" y="20.5" width="2.5" height="1.2" rx="0.2"
          fill="#c8c8a0" stroke="#aaa" stroke-width="0.15"/>
        <text x="4.25" y="21.4" font-size="0.8" fill="#333"
          font-family="monospace" text-anchor="middle">1kΩ</text>

        <!-- ─── 옵토커플러 / 트랜지스터 드라이버 IC (PCB 상) ─── -->
        <rect x="8.5" y="20.0" width="4" height="2.5" rx="0.3"
          fill="#222" stroke="#444" stroke-width="0.2"/>
        <text x="10.5" y="21.7" font-size="0.85" fill="#888"
          font-family="monospace" text-anchor="middle">PC817</text>

        <!-- ─── 상태 LED (코일 활성 표시) ─── -->
        <!-- LED 몸체 -->
        <circle cx="20.5" cy="21.2" r="1.2"
          fill="${ledColor}" stroke="#550000" stroke-width="0.2"
          opacity="${ledOpacity}"/>
        <!-- LED 글로우 (활성 시) -->
        ${this.active ? html`
          <circle cx="20.5" cy="21.2" r="2.2"
            fill="${ledGlow}" opacity="0.25"/>
          <circle cx="20.5" cy="21.2" r="1.6"
            fill="${ledGlow}" opacity="0.15"/>
        ` : ''}
        <!-- LED 하이라이트 -->
        <circle cx="19.9" cy="20.6" r="0.4"
          fill="white" opacity="${this.active ? 0.5 : 0.1}"/>
        <!-- LED 라벨 -->
        <text x="20.5" y="23.5" font-size="0.9" fill="#ff8877"
          font-family="monospace" text-anchor="middle">LED</text>

        <!-- ─── 하단 핀 헤더 (VCC/GND/IN) ─── -->
        <!-- 헤더 하우징 -->
        <rect x="2.5" y="25.5" width="10" height="3.0" rx="0.4"
          fill="url(#header-grad-${this.compId})"
          stroke="#111" stroke-width="0.3"/>
        <!-- 3핀 핀 홀 -->
        <!-- VCC -->
        <rect x="3.0" y="26.0" width="2.0" height="2.0" rx="0.3"
          fill="#1a1a1a" stroke="#333" stroke-width="0.2"/>
        <circle cx="4.0" cy="27.0" r="0.5" fill="#c8a028" opacity="0.8"/>
        <!-- GND -->
        <rect x="6.5" y="26.0" width="2.0" height="2.0" rx="0.3"
          fill="#1a1a1a" stroke="#333" stroke-width="0.2"/>
        <circle cx="7.5" cy="27.0" r="0.5" fill="#c8a028" opacity="0.8"/>
        <!-- IN -->
        <rect x="10.0" y="26.0" width="2.0" height="2.0" rx="0.3"
          fill="#1a1a1a" stroke="#333" stroke-width="0.2"/>
        <circle cx="11.0" cy="27.0" r="0.5" fill="#c8a028" opacity="0.8"/>

        <!-- 핀 라벨 -->
        <text x="4.0" y="29.6" font-size="1.1" fill="#ff8877"
          font-family="monospace" text-anchor="middle" font-weight="bold">VCC</text>
        <text x="7.5" y="29.6" font-size="1.1" fill="#88aaff"
          font-family="monospace" text-anchor="middle" font-weight="bold">GND</text>
        <text x="11.0" y="29.6" font-size="1.1" fill="#88ff88"
          font-family="monospace" text-anchor="middle" font-weight="bold">IN</text>

        <!-- 활성 상태 표시 배지 -->
        ${this.active ? html`
          <rect x="15.5" y="25.5" width="8.5" height="2.8" rx="0.5"
            fill="#441100" stroke="#882200" stroke-width="0.25"/>
          <text x="19.8" y="27.5" font-size="1.2" fill="#ff6633"
            font-family="monospace" text-anchor="middle" font-weight="bold">ON</text>
        ` : html`
          <rect x="15.5" y="25.5" width="8.5" height="2.8" rx="0.5"
            fill="#0d1a0d" stroke="#1a3a1a" stroke-width="0.25"/>
          <text x="19.8" y="27.5" font-size="1.2" fill="#336633"
            font-family="monospace" text-anchor="middle" font-weight="bold">OFF</text>
        `}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-relay': SimRelay; }
}
