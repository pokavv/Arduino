import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * 7-세그먼트 세그먼트 인덱스 → SVG path
 *   _
 *  |_|
 *  |_|  •
 *
 * 세그먼트: A(상), B(우상), C(우하), D(하), E(좌하), F(좌상), G(중간), DP(점)
 */
const SEG_PATHS: Record<string, string> = {
  A:  'M6,4 H24',
  B:  'M25,5 V18',
  C:  'M25,21 V34',
  D:  'M6,35 H24',
  E:  'M5,21 V34',
  F:  'M5,5 V18',
  G:  'M6,19.5 H24',
};

/** 숫자 0~9, A~F → 켜질 세그먼트 */
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
 * <sim-seven-segment> — 7-세그먼트 디스플레이
 *
 * Pins: A,B,C,D,E,F,G,DP,COM
 */
@customElement('sim-seven-segment')
export class SimSevenSegment extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 44px; height: 64px; }`,
  ];

  @property({ type: Object }) segments: Record<string, boolean> = {
    A:false,B:false,C:false,D:false,E:false,F:false,G:false,DP:false,
  };
  @property({ type: String }) color = '#ff2020';

  override get componentType() { return 'seven-segment'; }
  override get pins() { return ['A','B','C','D','E','F','G','DP','COM']; }

  override getPinPositions() {
    const pins = ['A','B','C','D','E','F','G','DP','COM'];
    return new Map(pins.map((p, i) => [p, { x: 4 + i * 4, y: 64 }]));
  }

  override setPinState(pin: string, value: number) {
    if (pin in this.segments) {
      this.segments = { ...this.segments, [pin]: value > 0 };
    }
  }

  /** 숫자/문자 표시 헬퍼 */
  displayChar(char: string) {
    const segs = DIGIT_SEGS[char.toUpperCase()] ?? [];
    const next: Record<string, boolean> = {};
    for (const s of Object.keys(this.segments)) next[s] = false;
    for (const s of segs) next[s] = true;
    this.segments = next;
  }

  override render() {
    const segColor = this.color;
    const offColor = '#1a0000';

    return html`
      <svg width="44" height="64" viewBox="0 0 44 64">
        <!-- 배경 -->
        <rect width="44" height="50" rx="3" fill="#111"/>

        <!-- 세그먼트 -->
        ${(Object.entries(SEG_PATHS) as [string, string][]).map(([seg, path]) => svg`
          <path d="${path}" stroke="${this.segments[seg] ? segColor : offColor}"
            stroke-width="3" stroke-linecap="round" fill="none"/>
        `)}

        <!-- DP -->
        <circle cx="29" cy="35" r="2"
          fill="${this.segments['DP'] ? segColor : offColor}"/>

        <!-- 핀 (아래 9개) -->
        ${['A','B','C','D','E','F','G','DP','COM'].map((pin, i) => svg`
          <line x1="${4 + i*4}" y1="50" x2="${4 + i*4}" y2="64" stroke="#aaa" stroke-width="1.5"/>
          <text x="${2 + i*4}" y="63" font-size="4" fill="#777" font-family="monospace">${pin[0]}</text>
        `)}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-seven-segment': SimSevenSegment;
  }
}
