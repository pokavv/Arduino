import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-servo> — SG90 서보 모터 (90×114px)
 * Pins: VCC(빨간), GND(갈색), SIGNAL(주황)
 * 인터랙션: 허브 드래그로 각도 조절 (0°~180°)
 */
@customElement('sim-servo')
export class SimServo extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 90px; height: 114px; }
      .arm-handle { cursor: grab; }
      .arm-handle:active { cursor: grabbing; }
    `,
  ];

  @property({ type: Number }) angle = 90;

  private _dragging = false;

  override get componentType() { return 'servo'; }
  override get pins() { return ['VCC', 'GND', 'SIGNAL']; }

  // getPinPositions: viewBox(60×76) × 1.5 = host(90×114)
  // VCC x=14×1.5=21, GND x=26×1.5=39, SIGNAL x=38×1.5=57
  override getPinPositions() {
    return new Map([
      ['VCC',    { x: 21, y: 114 }],
      ['GND',    { x: 39, y: 114 }],
      ['SIGNAL', { x: 57, y: 114 }],
    ]);
  }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'SIGNAL') this.angle = Math.max(0, Math.min(180, v));
  }

  private _armPointerDown(e: PointerEvent) {
    e.stopPropagation();
    this._dragging = true;
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
  }

  private _armPointerMove(e: PointerEvent) {
    if (!this._dragging) return;
    e.stopPropagation();
    this.angle = Math.max(0, Math.min(180, Math.round(this.angle + e.movementX)));
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('sim-change', {
      bubbles: true, composed: true,
      detail: { angle: this.angle },
    }));
  }

  private _armPointerUp(e: PointerEvent) {
    if (!this._dragging) return;
    e.stopPropagation();
    this._dragging = false;
    (e.currentTarget as SVGElement).releasePointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
  }

  override render() {
    const armAngle = this.angle - 90;
    const rad = (armAngle * Math.PI) / 180;
    const armLen = 17, cx = 22, cy = 34;
    const shortLen = 9;
    // 암 끝 위치 계산 (각도 표시용)
    const tipX = (cx + armLen * Math.sin(rad)).toFixed(1);
    const tipY = (cy - armLen * Math.cos(rad)).toFixed(1);

    return html`
      <svg width="90" height="114" viewBox="0 0 60 76" xmlns="http://www.w3.org/2000/svg">

        <!-- 각도 표시 배경 -->
        <rect x="8" y="3" width="44" height="11" rx="2" fill="#0d1a2e"/>
        <!-- 각도 표시 텍스트 -->
        <text x="30" y="12" font-size="7.5" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.angle}°</text>
        <!-- 각도 진행 바 -->
        <rect x="10" y="5" width="${(this.angle / 180) * 40}" height="3" rx="1"
          fill="#4477cc" opacity="0.6"/>

        <!-- 서보 본체 (실물 SG90: 밝은 파란색) -->
        <rect x="5" y="16" width="50" height="36" rx="4"
          fill="#3d8ecf" stroke="#2a6aaa" stroke-width="1"/>
        <rect x="5" y="16" width="50" height="7" rx="3" fill="white" opacity="0.12"/>
        <rect x="5" y="46" width="50" height="6" fill="#0a1a55" opacity="0.5"/>

        <!-- 마운팅 귀 (실물: 본체와 같은 파란색) -->
        <rect x="0"  y="21" width="9" height="10" rx="2" fill="#3d8ecf" stroke="#2a6aaa" stroke-width="0.8"/>
        <rect x="51" y="21" width="9" height="10" rx="2" fill="#3d8ecf" stroke="#2a6aaa" stroke-width="0.8"/>
        <!-- 마운팅 홀 -->
        <circle cx="4.5"  cy="26" r="2.2" fill="#111" stroke="#0a0a1a" stroke-width="0.5"/>
        <circle cx="55.5" cy="26" r="2.2" fill="#111" stroke="#0a0a1a" stroke-width="0.5"/>

        <!-- SG90 라벨 (실물: 흰색 실크스크린) -->
        <text x="30" y="39" font-size="7.5" fill="#ccd8ff" font-family="monospace"
          text-anchor="middle" font-weight="bold">SG90</text>

        <!-- 출력축 하우징 캡 (실물: 짙은 회색, cx=22 기준) -->
        <rect x="7" y="11" width="30" height="13" rx="3" fill="#444" stroke="#333" stroke-width="0.8"/>
        <rect x="7" y="11" width="30" height="5" rx="3" fill="white" opacity="0.07"/>

        <!-- 서보 암 (실물 SG90: 흰색 플라스틱 호른) -->
        <g transform="rotate(${armAngle}, ${cx}, ${cy})">
          <rect x="${cx - 3.5}" y="${cy - armLen}" width="7" height="${armLen + shortLen}"
            rx="3.5" fill="#eeeeee" stroke="#cccccc" stroke-width="0.8"/>
          <rect x="${cx - 1.5}" y="${cy - armLen}" width="3" height="${armLen + shortLen}"
            rx="1.5" fill="white" opacity="0.4"/>
          <circle cx="${cx}" cy="${cy - armLen}" r="2.5" fill="#e0e0e0" stroke="#aaa" stroke-width="0.6"/>
          <circle cx="${cx}" cy="${cy - armLen}" r="1.2" fill="#999"/>
          <circle cx="${cx}" cy="${cy + shortLen}" r="2.5" fill="#e0e0e0" stroke="#aaa" stroke-width="0.6"/>
          <circle cx="${cx}" cy="${cy + shortLen}" r="1.2" fill="#999"/>
        </g>

        <!-- 출력축 허브 -->
        <circle cx="${cx}" cy="${cy}" r="7" fill="#777" stroke="#555" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="7" fill="white" opacity="0.06"/>
        <ellipse cx="${cx - 2}" cy="${cy - 3}" rx="3" ry="2"
          fill="white" opacity="0.15" transform="rotate(-20,${cx - 2},${cy - 3})"/>
        <circle cx="${cx}" cy="${cy}" r="3.5" fill="#444" stroke="#666" stroke-width="0.6"/>
        ${Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60 * Math.PI) / 180;
          return html`<circle cx="${(cx + 5.5 * Math.cos(a)).toFixed(2)}"
            cy="${(cy + 5.5 * Math.sin(a)).toFixed(2)}" r="0.8" fill="#888"/>`;
        })}

        <!-- 드래그 핸들 — 허브 위 투명 오버레이 (마우스 드래그로 각도 조절) -->
        <circle class="arm-handle" cx="${cx}" cy="${cy}" r="13"
          fill="transparent"
          @pointerdown="${this._armPointerDown}"
          @pointermove="${this._armPointerMove}"
          @pointerup="${this._armPointerUp}"
          @pointercancel="${this._armPointerUp}"/>

        <!-- 핀 커넥터 블록 -->
        <rect x="8" y="51" width="36" height="9" rx="2" fill="#111" stroke="#333" stroke-width="0.8"/>

        <!-- 핀 금속 — VCC=빨강, GND=갈색, SIGNAL=주황 -->
        <rect x="12.5" y="60" width="3" height="16" rx="0.5" fill="#cc4433"/>
        <rect x="13.2" y="60" width="1.2" height="16" fill="white" opacity="0.25"/>
        <rect x="24.5" y="60" width="3" height="16" rx="0.5" fill="#6b3a2a"/>
        <rect x="25.2" y="60" width="1.2" height="16" fill="white" opacity="0.2"/>
        <rect x="36.5" y="60" width="3" height="16" rx="0.5" fill="#cc8800"/>
        <rect x="37.2" y="60" width="1.2" height="16" fill="white" opacity="0.25"/>

        <!-- 핀 라벨 존 (Wokwi 스타일) -->
        <rect x="5" y="66" width="44" height="10" fill="#0d0d14"/>
        <line x1="5" y1="66" x2="49" y2="66" stroke="#252535" stroke-width="0.5"/>

        <text x="14" y="74" font-size="7" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">VCC</text>
        <text x="26" y="74" font-size="7" fill="#ddbbaa" font-family="monospace"
          text-anchor="middle" font-weight="bold">GND</text>
        <text x="38" y="74" font-size="7" fill="#ffcc55" font-family="monospace"
          text-anchor="middle" font-weight="bold">SIG</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-servo': SimServo; }
}
