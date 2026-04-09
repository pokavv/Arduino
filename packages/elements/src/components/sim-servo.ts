import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-servo> — SG90 마이크로 서보 모터 (90×114px)
 *
 * Wokwi wokwi-servo 기준 정밀 재현:
 *   실물 SG90:
 *   - 몸체: 진한 회색 (#555) 플라스틱 케이스
 *   - 마운팅 귀: 같은 회색, 나사 홀 포함
 *   - 출력축 캡: 어두운 회색 (#3a3a3a)
 *   - 서보 암: 흰색/크림색 플라스틱
 *   - 커넥터 와이어: 갈색(GND), 빨강(V+), 주황(PWM)
 *
 * Pins: VCC(빨강), GND(갈색), SIGNAL(주황) — 하단
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

  // host 90×114px, viewBox 60×76
  // 와이어 커넥터 하단: VCC=빨강 x=14→21px, GND=갈색 x=26→39px, SIG=주황 x=38→57px
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
    // 출력축 중심: viewBox(60×76) 기준 cx=22, cy=32
    const armLen = 17, cx = 22, cy = 32;
    const shortLen = 9;

    return html`
      <svg width="90" height="114" viewBox="0 0 60 76" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 서보 몸체 그라디언트 (진한 회색, Wokwi SG90 색상) -->
          <linearGradient id="body-grad-${this.compId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#3a3a3a"/>
            <stop offset="20%"  stop-color="#5a5a5a"/>
            <stop offset="70%"  stop-color="#555"/>
            <stop offset="100%" stop-color="#3a3a3a"/>
          </linearGradient>
          <!-- 허브 그라디언트 -->
          <radialGradient id="hub-grad-${this.compId}" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stop-color="#888"/>
            <stop offset="100%" stop-color="#444"/>
          </radialGradient>
        </defs>

        <!-- 각도 HUD (상단) -->
        <rect x="7" y="2" width="46" height="9" rx="1.5" fill="#0d1a2e"/>
        <rect x="9" y="3.5" width="${(this.angle / 180) * 42}" height="2.5" rx="1"
          fill="#4477cc" opacity="0.7"/>
        <text x="30" y="9.5" font-size="6.5" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">${this.angle}°</text>

        <!-- ── SG90 서보 실물 몸체 ── -->
        <!-- 마운팅 귀 (좌우 돌출, Wokwi 스타일: 같은 회색) -->
        <rect x="0"  y="18" width="8"  height="9" rx="1.5"
          fill="#484848" stroke="#333" stroke-width="0.6"/>
        <rect x="52" y="18" width="8"  height="9" rx="1.5"
          fill="#484848" stroke="#333" stroke-width="0.6"/>
        <!-- 마운팅 홀 (나사 구멍) -->
        <circle cx="4"  cy="22.5" r="2.0" fill="#111" stroke="#222" stroke-width="0.3"/>
        <circle cx="56" cy="22.5" r="2.0" fill="#111" stroke="#222" stroke-width="0.3"/>
        <!-- 홀 금속 테 -->
        <circle cx="4"  cy="22.5" r="2.0" fill="none" stroke="#666" stroke-width="0.3"/>
        <circle cx="56" cy="22.5" r="2.0" fill="none" stroke="#666" stroke-width="0.3"/>

        <!-- 메인 서보 바디 (Wokwi: 진한 회색 #555) -->
        <rect x="7" y="13" width="46" height="33" rx="2"
          fill="url(#body-grad-${this.compId})" stroke="#2a2a2a" stroke-width="0.7"/>
        <!-- 바디 상단 에지 하이라이트 -->
        <rect x="7" y="13" width="46" height="3" rx="2"
          fill="white" opacity="0.07"/>
        <!-- 바디 하단 에지 -->
        <rect x="7" y="43" width="46" height="3" fill="#252525" opacity="0.5"/>

        <!-- SG90 실크스크린 라벨 (Wokwi 스타일: 흰색 텍스트) -->
        <text x="30" y="34" font-size="7" fill="#cccccc" font-family="monospace"
          text-anchor="middle" font-weight="bold" letter-spacing="0.5">SG90</text>

        <!-- 출력축 캡 하우징 (상단, Wokwi: 어두운 회색 #3a3a3a) -->
        <rect x="8" y="8" width="27" height="11" rx="2"
          fill="#3a3a3a" stroke="#252525" stroke-width="0.6"/>
        <rect x="8" y="8" width="27" height="4" rx="2"
          fill="white" opacity="0.05"/>

        <!-- ── 서보 암 (흰색 플라스틱, 단일 암 호른) ── -->
        <g transform="rotate(${armAngle}, ${cx}, ${cy})">
          <!-- 암 바디 -->
          <rect x="${cx - 3.5}" y="${cy - armLen}" width="7" height="${armLen + shortLen}"
            rx="3.5" fill="#ebebeb" stroke="#cccccc" stroke-width="0.6"/>
          <!-- 암 중앙 릿지 라인 -->
          <rect x="${cx - 1.2}" y="${cy - armLen + 2}" width="2.4" height="${armLen + shortLen - 4}"
            rx="1.2" fill="white" opacity="0.45"/>
          <!-- 암 끝 원형 홀 (상단) -->
          <circle cx="${cx}" cy="${cy - armLen}" r="2.8" fill="#e0e0e0" stroke="#bbb" stroke-width="0.5"/>
          <circle cx="${cx}" cy="${cy - armLen}" r="1.1" fill="#999"/>
          <!-- 암 끝 원형 홀 (하단) -->
          <circle cx="${cx}" cy="${cy + shortLen}" r="2.8" fill="#e0e0e0" stroke="#bbb" stroke-width="0.5"/>
          <circle cx="${cx}" cy="${cy + shortLen}" r="1.1" fill="#999"/>
        </g>

        <!-- 출력축 허브 (중심 원형, Wokwi 스타일) -->
        <circle cx="${cx}" cy="${cy}" r="7.2"
          fill="url(#hub-grad-${this.compId})" stroke="#333" stroke-width="0.8"/>
        <!-- 허브 표면 반사 -->
        <ellipse cx="${cx - 2}" cy="${cy - 2.5}" rx="2.8" ry="1.8"
          fill="white" opacity="0.14" transform="rotate(-20,${cx - 2},${cy - 2.5})"/>
        <!-- 허브 중앙 스플라인 홀 -->
        <circle cx="${cx}" cy="${cy}" r="3.5"
          fill="#2a2a2a" stroke="#555" stroke-width="0.5"/>
        <!-- 허브 스크루 홀 6개 -->
        ${Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60 * Math.PI) / 180;
          return html`<circle
            cx="${(cx + 5.6 * Math.cos(a)).toFixed(2)}"
            cy="${(cy + 5.6 * Math.sin(a)).toFixed(2)}"
            r="0.7" fill="#333"/>`;
        })}

        <!-- 드래그 핸들 (허브+암 조작용 투명 오버레이) -->
        <circle class="arm-handle" cx="${cx}" cy="${cy}" r="14"
          fill="transparent"
          @pointerdown="${this._armPointerDown}"
          @pointermove="${this._armPointerMove}"
          @pointerup="${this._armPointerUp}"
          @pointercancel="${this._armPointerUp}"/>

        <!-- ── 커넥터 블록 (하단 와이어 커넥터) ── -->
        <!-- 커넥터 하우징 -->
        <rect x="8" y="46" width="36" height="8" rx="1.5"
          fill="#111" stroke="#222" stroke-width="0.6"/>
        <!-- 커넥터 내부 핀 홀 3개 -->
        <rect x="11.5" y="48.5" width="4" height="3" rx="0.5" fill="#1a1a1a" stroke="#333" stroke-width="0.3"/>
        <rect x="23.5" y="48.5" width="4" height="3" rx="0.5" fill="#1a1a1a" stroke="#333" stroke-width="0.3"/>
        <rect x="35.5" y="48.5" width="4" height="3" rx="0.5" fill="#1a1a1a" stroke="#333" stroke-width="0.3"/>

        <!-- ── 와이어 케이블 (Wokwi 실제 색상) ── -->
        <!-- VCC — 빨간 와이어 (#ff2300) -->
        <rect x="12" y="54" width="3" height="22" rx="0.8"
          fill="#dd2200" stroke="#aa1800" stroke-width="0.3"/>
        <line x1="13" y1="54" x2="13" y2="76" stroke="#ff5533" stroke-width="0.5" opacity="0.4"/>
        <!-- GND — 갈색 와이어 (#b44200) -->
        <rect x="24" y="54" width="3" height="22" rx="0.8"
          fill="#a03800" stroke="#7a2a00" stroke-width="0.3"/>
        <line x1="25" y1="54" x2="25" y2="76" stroke="#cc5520" stroke-width="0.5" opacity="0.4"/>
        <!-- SIGNAL — 주황 와이어 (#f47b00) -->
        <rect x="36" y="54" width="3" height="22" rx="0.8"
          fill="#e07000" stroke="#bb5500" stroke-width="0.3"/>
        <line x1="37" y1="54" x2="37" y2="76" stroke="#ff9933" stroke-width="0.5" opacity="0.4"/>

        <!-- 핀 라벨 존 -->
        <rect x="5" y="64" width="44" height="10" fill="#0d0d14"/>
        <line x1="5" y1="64" x2="49" y2="64" stroke="#252535" stroke-width="0.4"/>
        <text x="13.5" y="72" font-size="6.5" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">V+</text>
        <text x="25.5" y="72" font-size="6.5" fill="#ddbbaa" font-family="monospace"
          text-anchor="middle" font-weight="bold">GND</text>
        <text x="37.5" y="72" font-size="6.5" fill="#ffcc55" font-family="monospace"
          text-anchor="middle" font-weight="bold">SIG</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-servo': SimServo; }
}
