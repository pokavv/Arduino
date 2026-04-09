import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/** 저항값에서 컬러 코드 밴드 계산 */
function resistorBands(ohms: number): [string, string, string, string] {
  const colors = ['black','brown','red','orange','yellow','green','blue','violet','grey','white'];
  const tol = 'gold';
  if (ohms <= 0) return ['black','black','black',tol];

  const exp = Math.floor(Math.log10(ohms)) - 1;
  const d1 = Math.floor(ohms / Math.pow(10, exp + 1));
  const d2 = Math.floor((ohms % Math.pow(10, exp + 1)) / Math.pow(10, exp));
  const mult = exp < 0 ? 'silver' : colors[Math.max(0, Math.min(exp, 9))];
  return [colors[d1] ?? 'black', colors[d2] ?? 'black', mult, tol];
}

const BAND_COLORS: Record<string, string> = {
  black:'#111', brown:'#6b3a2a', red:'#d00', orange:'#f80',
  yellow:'#ff0', green:'#0a0', blue:'#00c', violet:'#808',
  grey:'#888', white:'#eee', gold:'#cc9900', silver:'#aaa',
};

/**
 * <sim-resistor> — 저항
 *
 * Pins: PIN1, PIN2
 */
@customElement('sim-resistor')
export class SimResistor extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 60px; height: 24px; }`,
  ];

  @property({ type: Number }) ohms = 220;

  override get componentType() { return 'resistor'; }
  override get pins() { return ['PIN1', 'PIN2']; }
  override setPinState(_pin: string, _value: number | string) {}

  override getPinPositions() {
    return new Map([
      ['PIN1', { x: 0,  y: 12 }],
      ['PIN2', { x: 60, y: 12 }],
    ]);
  }

  override render() {
    const [b1, b2, b3, b4] = resistorBands(this.ohms);
    const label = this.ohms >= 1000
      ? (this.ohms >= 1000000 ? `${this.ohms/1000000}M` : `${this.ohms/1000}k`)
      : `${this.ohms}Ω`;

    return html`
      <svg width="60" height="24" viewBox="0 0 60 24">
        <!-- 리드선 -->
        <line x1="0" y1="12" x2="12" y2="12" stroke="#aaa" stroke-width="2"/>
        <line x1="48" y1="12" x2="60" y2="12" stroke="#aaa" stroke-width="2"/>
        <!-- 몸체 -->
        <rect x="12" y="6" width="36" height="12" rx="5" fill="#d4a96a"/>
        <!-- 밴드 -->
        <rect x="18" y="6" width="4" height="12" fill="${BAND_COLORS[b1] ?? '#000'}"/>
        <rect x="24" y="6" width="4" height="12" fill="${BAND_COLORS[b2] ?? '#000'}"/>
        <rect x="30" y="6" width="4" height="12" fill="${BAND_COLORS[b3] ?? '#000'}"/>
        <rect x="38" y="6" width="4" height="12" fill="${BAND_COLORS[b4] ?? '#000'}"/>
        <!-- 저항값 라벨 -->
        <text x="30" y="22" font-size="6" fill="#aaa" font-family="monospace"
          text-anchor="middle">${label}</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-resistor': SimResistor;
  }
}
