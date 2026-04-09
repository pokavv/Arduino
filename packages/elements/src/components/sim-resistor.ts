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
    css`:host { width: 70px; height: 28px; }`,
  ];

  @property({ type: Number }) ohms = 220;

  override get componentType() { return 'resistor'; }
  override get pins() { return ['PIN1', 'PIN2']; }
  override setPinState(_pin: string, _value: number | string) {}

  override getPinPositions() {
    return new Map([
      ['PIN1', { x: 0,  y: 14 }],
      ['PIN2', { x: 70, y: 14 }],
    ]);
  }

  override render() {
    const [b1, b2, b3, b4] = resistorBands(this.ohms);
    const label = this.ohms >= 1000
      ? (this.ohms >= 1000000 ? `${this.ohms/1000000}M` : `${this.ohms/1000}k`)
      : `${this.ohms}Ω`;

    return html`
      <svg width="70" height="28" viewBox="0 0 70 28">
        <defs>
          <!-- 몸체 원통 광택 (위에서 빛이 오는 방향) -->
          <radialGradient id="resBodyGrad" cx="50%" cy="25%" r="65%">
            <stop offset="0%"   stop-color="#f0deb0"/>
            <stop offset="45%"  stop-color="#d4a96a"/>
            <stop offset="85%"  stop-color="#b07a40"/>
            <stop offset="100%" stop-color="#8a5a28"/>
          </radialGradient>
          <!-- 리드선 광택 -->
          <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#ddd"/>
            <stop offset="50%"  stop-color="#fff"/>
            <stop offset="100%" stop-color="#bbb"/>
          </linearGradient>
        </defs>

        <!-- 리드선 (양쪽 은색 금속선) -->
        <line x1="0"  y1="14" x2="14" y2="14" stroke="url(#leadGrad)" stroke-width="2.5"/>
        <line x1="56" y1="14" x2="70" y2="14" stroke="url(#leadGrad)" stroke-width="2.5"/>

        <!-- 원통 몸체 — 좌우 끝 타원으로 3D 효과 -->
        <!-- 오른쪽 끝 타원 (밑에 먼저 그려서 가려지게) -->
        <ellipse cx="56" cy="14" rx="3" ry="8" fill="#8a5a28"/>
        <!-- 몸체 직사각형 -->
        <rect x="14" y="6" width="42" height="16" fill="url(#resBodyGrad)"/>
        <!-- 왼쪽 끝 타원 (광택, 위에 그림) -->
        <ellipse cx="14" cy="14" rx="3" ry="8" fill="#d4a96a"/>
        <!-- 왼쪽 끝 하이라이트 -->
        <ellipse cx="13" cy="11" rx="1.5" ry="3.5" fill="#f0deb0" opacity="0.6"/>

        <!-- 컬러 밴드 4개 (클리핑 없이 정확한 rect) -->
        <rect x="20" y="6" width="4" height="16" fill="${BAND_COLORS[b1] ?? '#000'}" opacity="0.95"/>
        <rect x="27" y="6" width="4" height="16" fill="${BAND_COLORS[b2] ?? '#000'}" opacity="0.95"/>
        <rect x="34" y="6" width="4" height="16" fill="${BAND_COLORS[b3] ?? '#000'}" opacity="0.95"/>
        <rect x="44" y="6" width="4" height="16" fill="${BAND_COLORS[b4] ?? '#000'}" opacity="0.95"/>

        <!-- 몸체 상단 광택 하이라이트 라인 -->
        <rect x="14" y="7" width="42" height="3" fill="white" opacity="0.18" rx="1"/>

        <!-- 저항값 라벨 -->
        <text x="35" y="26" font-size="6" fill="#aaa" font-family="monospace"
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
