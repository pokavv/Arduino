import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-seven-segment> — 7-세그먼트 디스플레이
 *
 * Wokwi 7segment-element.ts 기준 정밀 재현:
 *   viewBox: 0 0 12.55 22 (mm, 1unit=1mm)  digits=1, pins=top
 *   host: 47×83px (scale 3.74px/mm)
 *   PCB: x=0 y=0 w=12.55 h=20.5 fill=black
 *   세그먼트 그룹: transform="skewX(-8) translate(3.5, 2.4) scale(0.81)"
 *   polygon CSS: transform:scale(0.9), transform-origin:50% 50%, transform-box:fill-box
 *   세그먼트 ON: red (#ff2020), OFF: #444
 *   DP circle: cx=10.9 cy=18.5 r=0.89 (viewBox 기준)
 *   핀 패턴: 상단 y=0~1mm (G,F,COM,A,B), 하단 y=21~22mm (E,D,COM,C,DP)
 *   핀 간격: 2.54mm (브레드보드 1칸)
 *
 *    A
 *  F   B
 *    G
 *  E   C
 *    D   DP
 */

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

// Wokwi 로컬 좌표 (10×18 그리드) — skewX(-8) + translate(3.5,2.4) + scale(0.81) 그룹 내
// 각 polygon에 CSS scale(0.9) transform-box:fill-box 추가로 모서리 간격 생김
const SEG_POLYS: Record<string, string> = {
  A: '2,0 8,0 9,1 8,2 2,2 1,1',
  B: '10,2 10,8 9,9 8,8 8,2 9,1',
  C: '10,10 10,16 9,17 8,16 8,10 9,9',
  D: '8,18 2,18 1,17 2,16 8,16 9,17',
  E: '0,16 0,10 1,9 2,10 2,16 1,17',
  F: '0,8 0,2 1,1 2,2 2,8 1,9',
  G: '2,8 8,8 9,9 8,10 2,10 1,9',
};

@customElement('sim-seven-segment')
export class SimSevenSegment extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 47px; height: 83px; }
      polygon {
        transform: scale(0.9);
        transform-origin: 50% 50%;
        transform-box: fill-box;
      }
    `,
  ];

  @property({ type: Object }) segments: Record<string, boolean> = {
    A:false, B:false, C:false, D:false, E:false, F:false, G:false, DP:false,
  };
  @property({ type: String }) color = '#ff2020';

  override get componentType() { return 'seven-segment'; }
  // 실물 7세그먼트: 상단 5핀(G,F,COM,A,B) + 하단 5핀(E,D,COM,C,DP)
  override get pins() { return ['A','B','C','D','E','F','G','DP','COM']; }

  // viewBox mm → host px (scale ≈ 3.74px/mm)
  // 상단 핀(y=0mm→host y=0): G(1.195mm), F(3.735mm), COM(6.275mm), A(8.815mm), B(11.355mm)
  // 하단 핀(y=22mm→host y=83): E(1.195mm), D(3.735mm), COM(6.275mm), C(8.815mm), DP(11.355mm)
  override getPinPositions() {
    const scale = 47 / 12.55; // ≈3.74px/mm
    const topY = 0;
    const botY = 83;
    const xMM = [1.195, 3.735, 6.275, 8.815, 11.355];
    return new Map([
      ['G',   { x: Math.round(xMM[0] * scale), y: topY }],
      ['F',   { x: Math.round(xMM[1] * scale), y: topY }],
      ['A',   { x: Math.round(xMM[3] * scale), y: topY }],
      ['B',   { x: Math.round(xMM[4] * scale), y: topY }],
      ['E',   { x: Math.round(xMM[0] * scale), y: botY }],
      ['D',   { x: Math.round(xMM[1] * scale), y: botY }],
      ['COM', { x: Math.round(xMM[2] * scale), y: botY }],
      ['C',   { x: Math.round(xMM[3] * scale), y: botY }],
      ['DP',  { x: Math.round(xMM[4] * scale), y: botY }],
    ]);
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
    const off = '#444';

    // 상단/하단 핀 x 좌표 (viewBox mm 기준)
    const pinXs = [1.195, 3.735, 6.275, 8.815, 11.355];

    return html`
      <svg width="47" height="83" viewBox="0 0 12.55 22"
           xmlns="http://www.w3.org/2000/svg">

        <!-- ── 상단 핀 (y=0~1mm: 원형 패드 5개) ── -->
        <!-- G, F, COM, A, B -->
        ${pinXs.map((px, i) => svg`
          <circle cx="${px}" cy="0.5" r="0.45"
            fill="${i === 2 ? '#cc4433' : '#9D9D9A'}"
            stroke="${i === 2 ? '#aa2200' : '#666'}" stroke-width="0.1"/>
        `)}

        <!-- ── PCB 본체 (Wokwi: x=0 y=0 w=12.55 h=20.5 fill=black) ── -->
        <rect x="0" y="1" width="12.55" height="19.5" fill="#111111"/>

        <!-- 세그먼트 디스플레이 창 (약간 더 어두운 사각형) -->
        <rect x="0.5" y="1.4" width="11.55" height="17.5" rx="0.3" fill="#0a0000"/>

        <!-- ── 세그먼트 그룹 (Wokwi: skewX(-8) translate(3.5,2.4) scale(0.81)) ── -->
        <g transform="skewX(-8) translate(3.5, 2.4) scale(0.81)">
          ${(Object.entries(SEG_POLYS) as [string, string][]).map(([seg, pts]) => svg`
            <polygon points="${pts}"
              fill="${this.segments[seg] ? on : off}"/>
          `)}
        </g>

        <!-- ── DP (소수점) — 그룹 외부 viewBox 좌표 ── -->
        <circle cx="10.9" cy="18.5" r="0.89"
          fill="${this.segments['DP'] ? on : off}"/>

        <!-- ── 하단 핀 (y=21~22mm: 원형 패드 5개) ── -->
        <!-- E, D, COM, C, DP_pin -->
        ${pinXs.map((px, i) => svg`
          <circle cx="${px}" cy="21.5" r="0.45"
            fill="${i === 2 ? '#cc4433' : '#9D9D9A'}"
            stroke="${i === 2 ? '#aa2200' : '#666'}" stroke-width="0.1"/>
        `)}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-seven-segment': SimSevenSegment; }
}
