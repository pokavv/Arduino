import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * 7-세그먼트 path (viewBox 0 0 44 58 기준)
 *    A
 *  F   B
 *    G
 *  E   C
 *    D   DP
 */
const SEG_PATHS: Record<string, string> = {
  A: 'M7,4 H25',
  B: 'M26,5 V18',
  C: 'M26,21 V34',
  D: 'M7,35 H25',
  E: 'M6,21 V34',
  F: 'M6,5  V18',
  G: 'M7,19.5 H25',
};

const DIGIT_SEGS: Record<string, string[]> = {
  '0': ['A','B','C','D','E','F'],
  '1': ['B','C'],
  '2': ['A','B','D','E','G'],
  '3': ['A','B','C','D','G'],
  '4': ['B','C','F','G'],
  '5': ['A','C','D','F','G'],
  '6': ['A','C','D','E','F','G'],
  '7': ['A','B','C'],
  '8': ['A','B','C','D','E','F','G'],
  '9': ['A','B','C','D','F','G'],
  'A': ['A','B','C','E','F','G'],
  'B': ['C','D','E','F','G'],
  'C': ['A','D','E','F'],
  'D': ['B','C','D','E','G'],
  'E': ['A','D','E','F','G'],
  'F': ['A','E','F','G'],
};

/**
 * <sim-seven-segment> — 7-세그먼트 디스플레이 (66×88px)
 * Pins: A,B,C,D,E,F,G,DP,COM (5px 간격)
 */
@customElement('sim-seven-segment')
export class SimSevenSegment extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 66px; height: 88px; }`,
  ];

  @property({ type: Object }) segments: Record<string, boolean> = {
    A:false, B:false, C:false, D:false, E:false, F:false, G:false, DP:false,
  };
  @property({ type: String }) color = '#ff2020';

  override get componentType() { return 'seven-segment'; }
  override get pins() { return ['A','B','C','D','E','F','G','DP','COM']; }

  // getPinPositions: viewBox(44×58) × 1.5 = host(66×88)
  // 핀 x: 3+i*5 in viewBox → ×1.5 ≈ 4.5+i*7.5
  override getPinPositions() {
    const pins = ['A','B','C','D','E','F','G','DP','COM'];
    return new Map(pins.map((p, i) => [p, { x: Math.round(4.5 + i * 7.5), y: 88 }]));
  }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin in this.segments) this.segments = { ...this.segments, [pin]: v > 0 };
  }

  displayChar(char: string) {
    const segs = DIGIT_SEGS[char.toUpperCase()] ?? [];
    const next: Record<string, boolean> = {};
    for (const s of Object.keys(this.segments)) next[s] = false;
    for (const s of segs) next[s] = true;
    this.segments = next;
  }

  override render() {
    const on  = this.color;
    const off = '#1a0000';
    // 핀 x = 3 + i*5 (viewBox 44px 폭, 9핀 × 5px 간격)
    const pinXs = Array.from({ length: 9 }, (_, i) => 3 + i * 5);

    return html`
      <svg width="66" height="88" viewBox="0 0 44 58" xmlns="http://www.w3.org/2000/svg">

        <!-- 배경 패키지 -->
        <rect x="2" y="1" width="40" height="47" rx="2" fill="#111"/>
        <!-- 세그먼트 창 영역 -->
        <rect x="4" y="3" width="36" height="43" rx="1" fill="#0a0000"/>

        <!-- 세그먼트 7개 -->
        ${(Object.entries(SEG_PATHS) as [string, string][]).map(([seg, path]) => svg`
          <path d="${path}"
            stroke="${this.segments[seg] ? on : off}"
            stroke-width="3.5" stroke-linecap="round" fill="none"/>
        `)}

        <!-- DP (소수점) -->
        <circle cx="31" cy="35" r="2.2"
          fill="${this.segments['DP'] ? on : off}"/>

        <!-- 핀 금속 — 신호 핀 (데이터=파란색) -->
        ${pinXs.map((px, i) => svg`
          <rect x="${px - 1.5}" y="48" width="3" height="10" rx="0.5"
            fill="${i === 8 ? '#cc4433' : '#4477cc'}"/>
          <rect x="${px - 0.5}" y="48" width="1" height="10"
            fill="white" opacity="0.25"/>
        `)}

        <!-- 핀 라벨 존 (Wokwi 스타일: 어두운 배경 + 고대비 텍스트) -->
        <rect x="0" y="49" width="44" height="9" fill="#0d0d14"/>
        <line x1="0" y1="49" x2="44" y2="49" stroke="#252535" stroke-width="0.5"/>

        <!-- 핀 라벨 (A~G, DP, COM) — font-size 5.5로 확대 -->
        ${['A','B','C','D','E','F','G','P','C'].map((label, i) => svg`
          <text x="${pinXs[i]}" y="57" font-size="5.5"
            fill="${i === 8 ? '#ff8877' : '#88aaff'}"
            font-family="monospace" text-anchor="middle" font-weight="bold">${label}</text>
        `)}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-seven-segment': SimSevenSegment; }
}
