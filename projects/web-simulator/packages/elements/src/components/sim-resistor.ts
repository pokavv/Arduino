import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * Wokwi 저항 색상 코드 (인덱스 -2 ~ 9)
 * 출처: wokwi-elements/src/resistor-element.ts
 */
const BAND_HEX: Record<number, string> = {
  [-2]: '#C3C7C0', // Silver
  [-1]: '#F1D863', // Gold
  [0]:  '#000000', // Black
  [1]:  '#8F4814', // Brown
  [2]:  '#FB0000', // Red
  [3]:  '#FC9700', // Orange
  [4]:  '#FCF800', // Yellow
  [5]:  '#00B800', // Green
  [6]:  '#0000FF', // Blue
  [7]:  '#A803D6', // Violet
  [8]:  '#808080', // Gray
  [9]:  '#FCFCFC', // White
};

/**
 * Wokwi breakValue 방식:
 * 저항값 → [base(10~99), exponent]
 * band1 = floor(base/10), band2 = base%10, band3 = exponent
 * band4 = gold (±5% 고정)
 */
function breakValue(ohms: number): [number, number] {
  if (ohms <= 0) return [10, 0];
  const exp = Math.floor(Math.log10(ohms)) - 1;
  const base = Math.round(ohms / Math.pow(10, exp));
  return [Math.min(99, Math.max(10, base)), exp];
}

function resistorBands(ohms: number): [string, string, string, string] {
  const [base, exp] = breakValue(ohms);
  const b1 = BAND_HEX[Math.floor(base / 10)] ?? '#000';
  const b2 = BAND_HEX[base % 10] ?? '#000';
  const b3 = BAND_HEX[exp] ?? '#C3C7C0';
  const b4 = BAND_HEX[-1]; // Gold (±5%)
  return [b1, b2, b3, b4];
}

/**
 * <sim-resistor> — 통공 저항 (118×23px)
 * Wokwi resistor-element.ts 기준 정밀 재현:
 *   viewBox: 0 0 15.645 3 (mm)
 *   리드선: y=1.1759, h=0.638, fill=#aaa
 *   몸체 캡슐: x=2.77~12.75mm, fill=#d5b597
 *   밴드: x=4, 6, 7.8, 10.69 (mm)
 * Pins: PIN1(왼쪽), PIN2(오른쪽)
 */
@customElement('sim-resistor')
export class SimResistor extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 118px; height: 23px; }`,
  ];

  @property({ type: Number }) ohms = 220;

  override get componentType() { return 'resistor'; }
  override get pins() { return ['PIN1', 'PIN2']; }
  override setPinState(_pin: string, _value: number | string) {}

  // viewBox 0 0 15.645 3 (mm), host 118×23px
  // 리드 중심 y = 1.495mm → 1.495/3 × 23 = 11.5px ≈ 12
  // PIN1 x=0, PIN2 x=118
  override getPinPositions() {
    return new Map([
      ['PIN1', { x: 0,   y: 12 }],
      ['PIN2', { x: 118, y: 12 }],
    ]);
  }

  private _label() {
    const o = this.ohms;
    if (o >= 1_000_000) return `${o / 1_000_000}MΩ`;
    if (o >= 1_000)     return `${o / 1_000}kΩ`;
    return `${o}Ω`;
  }

  override render() {
    const [b1, b2, b3, b4] = resistorBands(this.ohms);
    const label = this._label();

    return html`
      <svg width="118" height="23"
           viewBox="0 0 15.645 3"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Wokwi 바디 그라디언트 (3D 광택) -->
          <linearGradient id="body-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#e8c89a"/>
            <stop offset="35%"  stop-color="#d5b597"/>
            <stop offset="100%" stop-color="#a88050"/>
          </linearGradient>
          <!-- 바디 클리핑 (캡슐 모양) -->
          <clipPath id="body-clip">
            <path d="M4.6918 0
              C3.6332 0 2.7733 0.67468 2.7733 1.5022
              C2.7733 2.32976 3.6332 2.9978 4.6918 2.9978
              C5.1159 2.9978 5.5054 2.88613 5.823 2.70369
              H9.9179
              C10.2359 2.88682 10.6287 2.9978 11.0536 2.9978
              C12.1122 2.9978 12.9721 2.32765 12.9721 1.5
              C12.9721 0.6724 12.1122 0 11.0536 0
              C10.6286 0 10.2359 0.11098 9.9179 0.29411
              H5.823
              C5.5054 0.11167 5.116 0 4.6918 0Z"/>
          </clipPath>
        </defs>

        <!-- ── 리드선 (Wokwi: y=1.1759 h=0.638 fill=#aaa) ── -->
        <rect y="1.1759" width="15.558" height="0.63826" fill="#aaaaaa"/>

        <!-- ── 몸체 캡슐 ── -->
        <path d="M4.6918 0
          C3.6332 0 2.7733 0.67468 2.7733 1.5022
          C2.7733 2.32976 3.6332 2.9978 4.6918 2.9978
          C5.1159 2.9978 5.5054 2.88613 5.823 2.70369
          H9.9179
          C10.2359 2.88682 10.6287 2.9978 11.0536 2.9978
          C12.1122 2.9978 12.9721 2.32765 12.9721 1.5
          C12.9721 0.6724 12.1122 0 11.0536 0
          C10.6286 0 10.2359 0.11098 9.9179 0.29411
          H5.823
          C5.5054 0.11167 5.116 0 4.6918 0Z"
          fill="url(#body-grad)" stroke="#b09070" stroke-width="0.08"/>

        <!-- ── 컬러 밴드 (Wokwi 좌표: x=4,6,7.8,10.69, 클리핑 적용) ── -->
        <!-- Band 1: x=4, w=1 -->
        <rect x="4" y="0" width="1" height="3"
          fill="${b1}" clip-path="url(#body-clip)" opacity="0.95"/>
        <!-- Band 2: x=6, w=0.96, inset (y=0.29411 h=2.4117) -->
        <rect x="6" y="0.29411" width="0.96" height="2.4117"
          fill="${b2}" opacity="0.95"/>
        <!-- Band 3: x=7.8, w=0.96, inset -->
        <rect x="7.8" y="0.29411" width="0.96" height="2.4117"
          fill="${b3}" opacity="0.95"/>
        <!-- Band 4 (tolerance): x=10.69, w=1, gold -->
        <rect x="10.69" y="0" width="1" height="3"
          fill="${b4}" clip-path="url(#body-clip)" opacity="0.95"/>

        <!-- 상단 광택 하이라이트 -->
        <path d="M4.6918 0
          C3.6332 0 2.7733 0.67468 2.7733 1.5022
          L2.7733 0.7
          C2.7733 0.3 3.5 0 4.6918 0
          H11.0536
          C12.1122 0 12.9721 0.3 12.9721 0.7
          L12.9721 1.5022
          C12.9721 0.6724 12.1122 0 11.0536 0Z"
          fill="white" opacity="0.22" clip-path="url(#body-clip)"/>

        <!-- ── 저항값 라벨 (리드선 위) ── -->
        <text x="7.823" y="2.75" font-size="0.75" fill="#553300"
          font-family="monospace" text-anchor="middle"
          font-weight="bold" opacity="0.6">${label}</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-resistor': SimResistor; }
}
