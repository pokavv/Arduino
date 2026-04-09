import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-buzzer> — 부저 (Passive/Active)
 *
 * Pins: VCC(+), GND(-)
 */
@customElement('sim-buzzer')
export class SimBuzzer extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 44px; height: 44px; }`,
  ];

  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Number }) frequency = 0;

  private _audioCtx: AudioContext | null = null;
  private _oscillator: OscillatorNode | null = null;
  private _gainNode: GainNode | null = null;

  override get componentType() { return 'buzzer'; }
  override get pins() { return ['VCC', 'GND']; }

  override getPinPositions() {
    return new Map([
      ['VCC', { x: 14, y: 44 }],
      ['GND', { x: 30, y: 44 }],
    ]);
  }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'VCC') {
      const shouldPlay = v > 0;
      if (shouldPlay !== this.active) {
        this.active = shouldPlay;
        this._updateSound();
      }
    } else if (pin === 'FREQ') {
      if (v > 0) {
        this.setFrequency(v);
        if (!this.active) {
          this.active = true;
          this._updateSound();
        }
      } else {
        this.active = false;
        this._updateSound();
      }
    }
  }

  setFrequency(hz: number) {
    this.frequency = hz;
    if (this._oscillator) {
      this._oscillator.frequency.setTargetAtTime(hz, this._audioCtx!.currentTime, 0.01);
    }
  }

  private _updateSound() {
    if (this.active) {
      if (!this._audioCtx) {
        this._audioCtx = new AudioContext();
        this._gainNode = this._audioCtx.createGain();
        this._gainNode.gain.value = 0.1;
        this._gainNode.connect(this._audioCtx.destination);
      }
      this._oscillator = this._audioCtx.createOscillator();
      this._oscillator.type = 'square';
      this._oscillator.frequency.value = this.frequency || 1000;
      this._oscillator.connect(this._gainNode!);
      this._oscillator.start();
    } else {
      this._oscillator?.stop();
      this._oscillator = null;
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._oscillator?.stop();
    this._audioCtx?.close();
  }

  override render() {
    // active 상태: 노란 glow 효과
    const glowColor  = this.active ? '#ffaa00' : 'none';
    const glowOpacity = this.active ? 0.55 : 0;
    // 통기구 슬롯 8개 방사형 path 생성
    const slots = Array.from({ length: 8 }, (_, i) => {
      const angle  = (i * 45 * Math.PI) / 180;
      const r1 = 5.5, r2 = 11.5;
      const cx = 22, cy = 20;
      const x1 = cx + r1 * Math.cos(angle);
      const y1 = cy + r1 * Math.sin(angle);
      const x2 = cx + r2 * Math.cos(angle);
      const y2 = cy + r2 * Math.sin(angle);
      return html`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}"
        x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"
        stroke="${this.active ? '#ffcc44' : '#555'}"
        stroke-width="${this.active ? 1.6 : 1.2}"
        stroke-linecap="round"/>`;
    });

    return html`
      <svg width="44" height="44" viewBox="0 0 44 44">
        <defs>
          <!-- defs 비어 있음 (url() 없이 직접 색상 사용) -->
        </defs>

        <!-- ── active 상태 외곽 glow (직접 색상) ── -->
        ${this.active ? html`
          <circle cx="22" cy="20" r="18"
            fill="${glowColor}" opacity="${glowOpacity * 0.5}"/>
          <circle cx="22" cy="20" r="16"
            fill="${glowColor}" opacity="${glowOpacity * 0.3}"/>
        ` : ''}

        <!-- ── 은색 외곽 림 (직접 색상 + 광택 레이어) ── -->
        <circle cx="22" cy="20" r="15.5"
          fill="none" stroke="#aaaaaa" stroke-width="2.5"/>
        <!-- 광택 하이라이트 (상단) -->
        <path d="M 8,14 A 15.5 15.5 0 0 1 36,14"
          fill="none" stroke="white" stroke-width="1.5" opacity="0.3"/>

        <!-- ── 검은 원통 몸체 (레이어) ── -->
        <circle cx="22" cy="20" r="14.5" fill="#111111"/>
        <circle cx="22" cy="20" r="14.5" fill="white" opacity="0.04"/>

        <!-- 내부 다크 링 -->
        <circle cx="22" cy="20" r="13"
          fill="none" stroke="#333" stroke-width="0.8"/>

        <!-- ── 방사형 통기구 슬롯 ── -->
        ${slots}

        <!-- ── 중앙 멤브레인 원 ── -->
        <circle cx="22" cy="20" r="4.5"
          fill="${this.active ? '#cc8800' : '#2a2a2a'}"
          stroke="${this.active ? '#ffcc00' : '#444'}"
          stroke-width="0.8"/>
        <circle cx="22" cy="20" r="1.5"
          fill="${this.active ? '#ffee88' : '#444'}"/>

        <!-- 상단 하이라이트 -->
        <ellipse cx="18" cy="14" rx="4" ry="2.5"
          fill="white" opacity="0.12" transform="rotate(-20,18,14)"/>

        <!-- ── PCB 마운트 핀 2개 ── -->
        <rect x="12.5" y="34" width="3" height="10" rx="0.5" fill="#aaaaaa"/>
        <rect x="13"   y="34" width="1.5" height="10" rx="0.3" fill="white" opacity="0.35"/>
        <rect x="28.5" y="34" width="3" height="10" rx="0.5" fill="#aaaaaa"/>
        <rect x="29"   y="34" width="1.5" height="10" rx="0.3" fill="white" opacity="0.35"/>

        <!-- ── 핀 라벨 ── -->
        <text x="10" y="43" font-size="6.5" fill="#ff8888" font-family="monospace"
          font-weight="bold">+</text>
        <text x="29.5" y="43" font-size="6.5" fill="#88ee88" font-family="monospace">−</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-buzzer': SimBuzzer;
  }
}
