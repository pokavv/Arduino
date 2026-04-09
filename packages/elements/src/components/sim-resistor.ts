import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

function resistorBands(ohms: number): [string, string, string, string] {
  const colors = ['black','brown','red','orange','yellow','green','blue','violet','grey','white'];
  const tol = 'gold';
  if (ohms <= 0) return ['black','black','black',tol];
  const exp = Math.floor(Math.log10(ohms)) - 1;
  const d1   = Math.floor(ohms / Math.pow(10, exp + 1));
  const d2   = Math.floor((ohms % Math.pow(10, exp + 1)) / Math.pow(10, exp));
  const mult = exp < 0 ? 'silver' : colors[Math.max(0, Math.min(exp, 9))];
  return [colors[d1] ?? 'black', colors[d2] ?? 'black', mult, tol];
}

const BAND_COLORS: Record<string, string> = {
  black:'#111', brown:'#6b3a2a', red:'#d00', orange:'#f80',
  yellow:'#ff0', green:'#0a0', blue:'#00c', violet:'#808',
  grey:'#888', white:'#eee', gold:'#cc9900', silver:'#aaa',
};

/**
 * <sim-resistor> — 저항 (105×42px)
 * Pins: PIN1, PIN2
 */
@customElement('sim-resistor')
export class SimResistor extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 105px; height: 42px; }`,
  ];

  @property({ type: Number }) ohms = 220;

  override get componentType() { return 'resistor'; }
  override get pins() { return ['PIN1', 'PIN2']; }
  override setPinState(_pin: string, _value: number | string) {}

  // getPinPositions: viewBox 좌표 × 1.5 (host 105×42 / viewBox 70×28 = 1.5)
  override getPinPositions() {
    return new Map([
      ['PIN1', { x: 0,   y: 21 }],
      ['PIN2', { x: 105, y: 21 }],
    ]);
  }

  override render() {
    const [b1, b2, b3, b4] = resistorBands(this.ohms);
    const label = this.ohms >= 1000000
      ? `${this.ohms / 1000000}M`
      : this.ohms >= 1000
        ? `${this.ohms / 1000}k`
        : `${this.ohms}Ω`;

    return html`
      <svg width="105" height="42" viewBox="0 0 70 28" xmlns="http://www.w3.org/2000/svg">

        <!-- 리드선 -->
        <line x1="0"  y1="14" x2="14" y2="14" stroke="#cccccc" stroke-width="2.5"/>
        <line x1="0"  y1="14" x2="14" y2="14" stroke="white"   stroke-width="0.8" opacity="0.4"/>
        <line x1="56" y1="14" x2="70" y2="14" stroke="#cccccc" stroke-width="2.5"/>
        <line x1="56" y1="14" x2="70" y2="14" stroke="white"   stroke-width="0.8" opacity="0.4"/>

        <!-- 오른쪽 끝 타원 (어두운 면) -->
        <ellipse cx="56" cy="14" rx="3" ry="8" fill="#8a5a28"/>
        <!-- 몸체 베이스 -->
        <rect x="14" y="6" width="42" height="16" fill="#d4a96a"/>
        <!-- 상단 광택 -->
        <rect x="14" y="6" width="42" height="5" fill="white" opacity="0.15"/>
        <!-- 왼쪽 끝 타원 (밝은 면) -->
        <ellipse cx="14" cy="14" rx="3" ry="8" fill="#e8c080"/>
        <ellipse cx="13" cy="11" rx="1.5" ry="3.5" fill="#f5d8a8" opacity="0.7"/>

        <!-- 컬러 밴드 4개 -->
        <rect x="20" y="6" width="4" height="16" fill="${BAND_COLORS[b1] ?? '#000'}" opacity="0.95"/>
        <rect x="27" y="6" width="4" height="16" fill="${BAND_COLORS[b2] ?? '#000'}" opacity="0.95"/>
        <rect x="34" y="6" width="4" height="16" fill="${BAND_COLORS[b3] ?? '#000'}" opacity="0.95"/>
        <rect x="44" y="6" width="4" height="16" fill="${BAND_COLORS[b4] ?? '#000'}" opacity="0.95"/>

        <!-- 상단 광택 하이라이트 -->
        <rect x="14" y="7" width="42" height="2.5" fill="white" opacity="0.22" rx="1"/>

        <!-- 저항값 라벨 -->
        <text x="35" y="27" font-size="6.5" fill="#888" font-family="monospace"
          text-anchor="middle" font-weight="500">${label}</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-resistor': SimResistor; }
}
