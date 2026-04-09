import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-pir-sensor> — HC-SR501 PIR 모션 센서 (76×95px)
 * 실물: 흰색 Fresnel 렌즈 돔 + 초록 PCB, 트리머 다이얼 2개
 * Pins: VCC, OUT, GND
 */
@customElement('sim-pir-sensor')
export class SimPirSensor extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 76px; height: 95px; }`,
  ];

  @property({ type: Boolean, reflect: true }) detected = false;

  override get componentType() { return 'pir-sensor'; }
  override get pins() { return ['VCC', 'OUT', 'GND']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'OUT') {
      this.detected = v > 0;
    }
  }

  override getPinPositions() {
    return new Map([
      ['VCC', { x: 10, y: 95 }],
      ['OUT', { x: 38, y: 95 }],
      ['GND', { x: 66, y: 95 }],
    ]);
  }

  override render() {
    const glowOp = this.detected ? 0.6 : 0;
    // 돔 색상: 감지 시 약한 노란색 틴트
    const domeBase  = this.detected ? '#fffcf0' : '#f0f0f0';
    const domeTint  = this.detected ? '#ffe06644' : '#ffffff22';

    return html`
      <svg width="76" height="95" viewBox="0 0 76 95" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Fresnel 렌즈 돔 그라디언트 -->
          <radialGradient id="pir-dome-${this.compId}" cx="40%" cy="35%" r="65%">
            <stop offset="0%"   stop-color="white" stop-opacity="0.9"/>
            <stop offset="40%"  stop-color="${domeBase}" stop-opacity="1"/>
            <stop offset="100%" stop-color="#c8c8c8" stop-opacity="1"/>
          </radialGradient>
          <!-- 감지 글로우 -->
          <radialGradient id="pir-glow-${this.compId}" cx="50%" cy="40%" r="55%">
            <stop offset="0%"   stop-color="#ffee44" stop-opacity="${glowOp * 0.5}"/>
            <stop offset="100%" stop-color="#ffee44" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- ── 초록 PCB ── -->
        <rect x="0" y="34" width="76" height="42" rx="3"
          fill="#087f45" stroke="#055a32" stroke-width="0.8"/>
        <!-- PCB 상단 하이라이트 -->
        <rect x="0" y="34" width="76" height="4" rx="3"
          fill="white" opacity="0.08"/>
        <!-- PCB 텍스트 -->
        <text x="38" y="47" font-size="5.5" fill="#aaffcc" font-family="monospace"
          text-anchor="middle" font-weight="bold">HC-SR501</text>

        <!-- ── 트리머 다이얼 2개 (조절 포텐셔미터) ── -->
        <!-- 왼쪽 다이얼 (감도 조절 SX) -->
        <circle cx="16" cy="58" r="7" fill="#cc9933" stroke="#aa7700" stroke-width="0.8"/>
        <circle cx="16" cy="58" r="5.5" fill="#bb8822"/>
        <!-- 다이얼 슬롯 표시 -->
        <line x1="16" y1="52.5" x2="16" y2="56" stroke="#333" stroke-width="1.2" stroke-linecap="round"/>
        <!-- 다이얼 라벨 -->
        <text x="16" y="70" font-size="4" fill="#88ffaa" font-family="monospace"
          text-anchor="middle">SX</text>

        <!-- 오른쪽 다이얼 (지연 조절 TX) -->
        <circle cx="60" cy="58" r="7" fill="#cc9933" stroke="#aa7700" stroke-width="0.8"/>
        <circle cx="60" cy="58" r="5.5" fill="#bb8822"/>
        <!-- 다이얼 슬롯 표시 -->
        <line x1="60" y1="52.5" x2="60" y2="56" stroke="#333" stroke-width="1.2" stroke-linecap="round"/>
        <!-- 다이얼 라벨 -->
        <text x="60" y="70" font-size="4" fill="#88ffaa" font-family="monospace"
          text-anchor="middle">TX</text>

        <!-- 점프 핀 (단/재트리거 선택) -->
        <rect x="32" y="52" width="12" height="6" rx="1"
          fill="#222222" stroke="#444444" stroke-width="0.5"/>
        <rect x="34" y="53" width="3.5" height="4" rx="0.5" fill="#ffdd44"/>
        <text x="38" y="65" font-size="3.5" fill="#88ffaa" font-family="monospace"
          text-anchor="middle">MODE</text>

        <!-- ── Fresnel 렌즈 돔 ── -->
        <!-- 감지 글로우 배경 -->
        <ellipse cx="38" cy="24" rx="36" ry="36"
          fill="url(#pir-glow-${this.compId})"/>

        <!-- 돔 본체 (반구) -->
        <ellipse cx="38" cy="34" rx="30" ry="22"
          fill="url(#pir-dome-${this.compId})"
          stroke="${this.detected ? '#ffee4488' : '#cccccc'}" stroke-width="0.8"/>

        <!-- Fresnel 렌즈 동심원 패턴 -->
        <ellipse cx="38" cy="34" rx="25" ry="18"
          fill="none" stroke="${this.detected ? '#ffee4466' : '#d8d8d8'}" stroke-width="0.5"/>
        <ellipse cx="38" cy="34" rx="20" ry="14"
          fill="none" stroke="${this.detected ? '#ffee4466' : '#d0d0d0'}" stroke-width="0.5"/>
        <ellipse cx="38" cy="34" rx="14" ry="9"
          fill="none" stroke="${this.detected ? '#ffee4466' : '#c8c8c8'}" stroke-width="0.5"/>
        <ellipse cx="38" cy="34" rx="8"  ry="5"
          fill="none" stroke="${this.detected ? '#ffee4466' : '#c0c0c0'}" stroke-width="0.5"/>
        <!-- Fresnel 수직 분할선 -->
        <line x1="38" y1="12" x2="38" y2="56"
          stroke="${this.detected ? '#ffee4433' : '#d0d0d0'}" stroke-width="0.4"/>
        <line x1="14" y1="25" x2="62" y2="43"
          stroke="${this.detected ? '#ffee4433' : '#d0d0d0'}" stroke-width="0.3"/>
        <line x1="14" y1="43" x2="62" y2="25"
          stroke="${this.detected ? '#ffee4433' : '#d0d0d0'}" stroke-width="0.3"/>

        <!-- 돔 상단 하이라이트 -->
        <ellipse cx="27" cy="22" rx="9" ry="5"
          fill="white" opacity="0.35" transform="rotate(-20,27,22)"/>

        <!-- 감지 표시 (감지 시 중앙에 노란 원) -->
        ${this.detected ? html`
          <circle cx="38" cy="34" r="5"
            fill="#ffee44" opacity="0.5"/>
          <circle cx="38" cy="34" r="2.5"
            fill="#ffee44" opacity="0.8"/>
        ` : ''}

        <!-- 구리 패드 영역 -->
        <rect x="4"  y="71" width="8" height="4" rx="1" fill="#c08030" opacity="0.75"/>
        <rect x="34" y="71" width="8" height="4" rx="1" fill="#c08030" opacity="0.75"/>
        <rect x="63" y="71" width="8" height="4" rx="1" fill="#c08030" opacity="0.75"/>

        <!-- 핀 리드 3개 -->
        <!-- VCC -->
        <line x1="10" y1="76" x2="10" y2="91" stroke="#cc4433" stroke-width="1.8"/>
        <line x1="10" y1="76" x2="10" y2="91" stroke="white" stroke-width="0.5" opacity="0.25"/>
        <!-- OUT -->
        <line x1="38" y1="76" x2="38" y2="91" stroke="#4477cc" stroke-width="1.8"/>
        <line x1="38" y1="76" x2="38" y2="91" stroke="white" stroke-width="0.5" opacity="0.25"/>
        <!-- GND -->
        <line x1="66" y1="76" x2="66" y2="91" stroke="#666666" stroke-width="1.8"/>
        <line x1="66" y1="76" x2="66" y2="91" stroke="white" stroke-width="0.5" opacity="0.2"/>

        <!-- 핀 라벨 존 -->
        <rect x="0" y="82" width="76" height="13" fill="#0d0d14"/>
        <line x1="0" y1="82" x2="76" y2="82" stroke="#252535" stroke-width="0.5"/>
        <text x="10" y="91" font-size="7" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">VCC</text>
        <text x="38" y="91" font-size="7" fill="#88aaff" font-family="monospace"
          text-anchor="middle" font-weight="bold">OUT</text>
        <text x="66" y="91" font-size="7" fill="#88ee99" font-family="monospace"
          text-anchor="middle" font-weight="bold">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-pir-sensor': SimPirSensor; }
}
