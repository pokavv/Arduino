import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-sound-sensor> — KY-037 소리 감지 모듈 (76×60px)
 * 실물: 짙은 파란 PCB + 일렉트렛 마이크 + 컴퍼레이터 IC
 * Pins: VCC, GND, DOUT, AOUT
 */
@customElement('sim-sound-sensor')
export class SimSoundSensor extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 76px; height: 60px; }`,
  ];

  /** ADC 값 (0~1023) */
  @property({ type: Number }) soundLevel = 0;
  /** 디지털 감지 출력 (컴퍼레이터 임계값 초과) */
  @property({ type: Boolean, reflect: true }) detected = false;

  override get componentType() { return 'sound-sensor'; }
  override get pins() { return ['VCC', 'GND', 'DOUT', 'AOUT']; }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'AOUT') {
      // 아날로그 출력: 0~3.3V → 0~1023 ADC 값으로 환산
      this.soundLevel = isNaN(v) ? 0 : Math.round(Math.max(0, Math.min(1023, v)));
    } else if (pin === 'DOUT') {
      this.detected = v > 0;
    }
  }

  override getPinPositions() {
    return new Map([
      ['VCC',  { x: 10, y: 60 }],
      ['GND',  { x: 28, y: 60 }],
      ['DOUT', { x: 46, y: 60 }],
      ['AOUT', { x: 64, y: 60 }],
    ]);
  }

  override render() {
    // 사운드 레벨 바 그래프 (5단계)
    const barCount = 8;
    const levelRatio = this.soundLevel / 1023;
    const activeBars = Math.round(levelRatio * barCount);

    return html`
      <svg width="76" height="60" viewBox="0 0 76 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 마이크 메탈 그라디언트 -->
          <radialGradient id="mic-metal-${this.compId}" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stop-color="#dddddd"/>
            <stop offset="50%"  stop-color="#999999"/>
            <stop offset="100%" stop-color="#555555"/>
          </radialGradient>
          <!-- PCB 그라디언트 -->
          <linearGradient id="pcb-bg-${this.compId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#1a3a6a"/>
            <stop offset="100%" stop-color="#0d2248"/>
          </linearGradient>
        </defs>

        <!-- ── 파란 PCB 몸체 ── -->
        <rect x="0" y="0" width="76" height="42" rx="3"
          fill="url(#pcb-bg-${this.compId})" stroke="#0a1a40" stroke-width="0.8"/>
        <!-- PCB 상단 하이라이트 -->
        <rect x="0" y="0" width="76" height="4" rx="3"
          fill="white" opacity="0.07"/>

        <!-- KY-037 라벨 -->
        <text x="52" y="10" font-size="5" fill="#88aaee" font-family="monospace"
          text-anchor="middle" font-weight="bold">KY-037</text>

        <!-- ── 일렉트렛 마이크 (원통형 은색) ── -->
        <!-- 마이크 외곽 원통 -->
        <circle cx="13" cy="19" r="11"
          fill="url(#mic-metal-${this.compId})"
          stroke="#777777" stroke-width="0.8"/>
        <!-- 마이크 폴라리티 마커 (−측 마크) -->
        <circle cx="13" cy="19" r="9" fill="#888888" opacity="0.5"/>
        <!-- 메쉬/구멍 패턴 -->
        <circle cx="13" cy="15" r="1.5" fill="#333333" opacity="0.8"/>
        <circle cx="9"  cy="21" r="1.5" fill="#333333" opacity="0.8"/>
        <circle cx="13" cy="23" r="1.5" fill="#333333" opacity="0.8"/>
        <circle cx="17" cy="21" r="1.5" fill="#333333" opacity="0.8"/>
        <circle cx="9"  cy="15" r="1.2" fill="#333333" opacity="0.6"/>
        <circle cx="17" cy="15" r="1.2" fill="#333333" opacity="0.6"/>
        <circle cx="9"  cy="23" r="1.2" fill="#333333" opacity="0.6"/>
        <circle cx="17" cy="23" r="1.2" fill="#333333" opacity="0.6"/>
        <!-- 마이크 중앙 -->
        <circle cx="13" cy="19" r="3" fill="#555555"/>
        <circle cx="13" cy="19" r="1.5" fill="#333333"/>
        <!-- 하이라이트 -->
        <ellipse cx="9" cy="13" rx="3" ry="1.8"
          fill="white" opacity="0.3" transform="rotate(-30,9,13)"/>

        <!-- ── 컴퍼레이터 IC 칩 (LM393) ── -->
        <rect x="28" y="8" width="14" height="9" rx="1"
          fill="#1a1a1a" stroke="#444444" stroke-width="0.5"/>
        <!-- IC 핀 1번 마커 (원형 노치) -->
        <circle cx="29.5" cy="9.5" r="0.8" fill="#555555"/>
        <!-- IC 라벨 -->
        <text x="35" y="14.5" font-size="3.5" fill="#888888" font-family="monospace"
          text-anchor="middle">LM393</text>

        <!-- 트리머 포텐셔미터 (임계값 조절) -->
        <circle cx="56" cy="18" r="7" fill="#cc9933" stroke="#aa7700" stroke-width="0.8"/>
        <circle cx="56" cy="18" r="5.5" fill="#bb8822"/>
        <!-- 트리머 슬롯 -->
        <line x1="56" y1="12.5" x2="56" y2="16" stroke="#333" stroke-width="1.2" stroke-linecap="round"/>
        <text x="56" y="30" font-size="3.5" fill="#88aaee" font-family="monospace"
          text-anchor="middle">THRESH</text>

        <!-- 감지 표시 LED (상태 LED) -->
        <circle cx="68" cy="10" r="3.5"
          fill="${this.detected ? '#ff3300' : '#220000'}"
          stroke="${this.detected ? '#ff330066' : '#330000'}" stroke-width="0.5"/>
        ${this.detected ? html`
          <circle cx="68" cy="10" r="5.5"
            fill="none" stroke="#ff330055" stroke-width="0.8"/>
        ` : ''}
        <text x="68" y="19" font-size="3.5" fill="#88aaee" font-family="monospace"
          text-anchor="middle">D</text>

        <!-- ── 사운드 레벨 바 그래프 ── -->
        <rect x="27" y="31" width="47" height="10" rx="1" fill="#0a1428"/>
        <text x="29" y="39" font-size="4.5" fill="#6688aa" font-family="monospace">♪</text>
        ${Array.from({ length: barCount }, (_, i) => {
          const barX = 36 + i * 4.8;
          const isActive = i < activeBars;
          // 낮은 레벨=초록, 중간=노랑, 높음=빨강
          const barColor = i < 3 ? '#44ff88' : i < 6 ? '#ffdd44' : '#ff4444';
          return html`
            <rect x="${barX}" y="${isActive ? 32.5 : 35}" width="3.5" height="${isActive ? 7.5 : 5}" rx="0.5"
              fill="${isActive ? barColor : '#1a2a3a'}"
              opacity="${isActive ? 0.9 : 0.4}"/>
          `;
        })}
        <!-- 레벨 값 텍스트 -->
        <text x="38" y="31" font-size="3.8" fill="#4466aa" font-family="monospace"
          text-anchor="middle">${this.soundLevel}</text>

        <!-- 구리 패드 영역 -->
        <rect x="5"  y="37" width="8" height="4" rx="1" fill="#c08030" opacity="0.7"/>
        <rect x="23" y="37" width="8" height="4" rx="1" fill="#c08030" opacity="0.7"/>
        <rect x="41" y="37" width="8" height="4" rx="1" fill="#c08030" opacity="0.7"/>
        <rect x="59" y="37" width="8" height="4" rx="1" fill="#c08030" opacity="0.7"/>

        <!-- 핀 리드 4개 -->
        <!-- VCC -->
        <line x1="10" y1="42" x2="10" y2="56" stroke="#cc4433" stroke-width="1.8"/>
        <line x1="10" y1="42" x2="10" y2="56" stroke="white" stroke-width="0.5" opacity="0.25"/>
        <!-- GND -->
        <line x1="28" y1="42" x2="28" y2="56" stroke="#666666" stroke-width="1.8"/>
        <line x1="28" y1="42" x2="28" y2="56" stroke="white" stroke-width="0.5" opacity="0.2"/>
        <!-- DOUT -->
        <line x1="46" y1="42" x2="46" y2="56" stroke="#44aa88" stroke-width="1.8"/>
        <line x1="46" y1="42" x2="46" y2="56" stroke="white" stroke-width="0.5" opacity="0.25"/>
        <!-- AOUT -->
        <line x1="64" y1="42" x2="64" y2="56" stroke="#cc8844" stroke-width="1.8"/>
        <line x1="64" y1="42" x2="64" y2="56" stroke="white" stroke-width="0.5" opacity="0.25"/>

        <!-- 핀 라벨 존 -->
        <rect x="0" y="47" width="76" height="13" fill="#0d0d14"/>
        <line x1="0" y1="47" x2="76" y2="47" stroke="#252535" stroke-width="0.5"/>
        <text x="10" y="57" font-size="6.5" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">VCC</text>
        <text x="28" y="57" font-size="6.5" fill="#88ee99" font-family="monospace"
          text-anchor="middle" font-weight="bold">GND</text>
        <text x="46" y="57" font-size="6.5" fill="#44ddaa" font-family="monospace"
          text-anchor="middle" font-weight="bold">DO</text>
        <text x="64" y="57" font-size="6.5" fill="#ffaa44" font-family="monospace"
          text-anchor="middle" font-weight="bold">AO</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-sound-sensor': SimSoundSensor; }
}
