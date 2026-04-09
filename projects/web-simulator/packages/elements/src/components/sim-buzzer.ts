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
          <!-- 원통 몸체 광택 -->
          <radialGradient id="buzzerBodyGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stop-color="#4a4a4a"/>
            <stop offset="55%"  stop-color="#1e1e1e"/>
            <stop offset="100%" stop-color="#0a0a0a"/>
          </radialGradient>
          <!-- active glow 필터 -->
          <filter id="buzzerGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <!-- 은색 테두리 gradient -->
          <linearGradient id="buzzerRimGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#888"/>
            <stop offset="50%"  stop-color="#ccc"/>
            <stop offset="100%" stop-color="#666"/>
          </linearGradient>
          <!-- 핀 광택 -->
          <linearGradient id="buzzerPinGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stop-color="#999"/>
            <stop offset="50%"  stop-color="#eee"/>
            <stop offset="100%" stop-color="#999"/>
          </linearGradient>
        </defs>

        <!-- active 상태 외곽 glow -->
        ${this.active ? html`
          <circle cx="22" cy="20" r="16" fill="${glowColor}"
            opacity="${glowOpacity}" filter="url(#buzzerGlow)"/>
        ` : ''}

        <!-- 은색 외곽 림 -->
        <circle cx="22" cy="20" r="15.5"
          fill="none" stroke="url(#buzzerRimGrad)" stroke-width="2.5"/>

        <!-- 검은 원통 몸체 -->
        <circle cx="22" cy="20" r="14.5" fill="url(#buzzerBodyGrad)"/>

        <!-- 내부 다크 링 (통기구 영역 경계) -->
        <circle cx="22" cy="20" r="13" fill="none"
          stroke="#333" stroke-width="0.8"/>

        <!-- 방사형 통기구 슬롯 -->
        ${slots}

        <!-- 중앙 멤브레인 원 -->
        <circle cx="22" cy="20" r="4.5"
          fill="${this.active ? '#cc8800' : '#2a2a2a'}"
          stroke="${this.active ? '#ffcc00' : '#444'}"
          stroke-width="0.8"/>
        <!-- 멤브레인 중심점 -->
        <circle cx="22" cy="20" r="1.5"
          fill="${this.active ? '#ffee88' : '#444'}"/>

        <!-- 상단 하이라이트 -->
        <ellipse cx="18" cy="14" rx="4" ry="2.5"
          fill="white" opacity="0.12" transform="rotate(-20,18,14)"/>

        <!-- PCB 마운트 핀 2개 -->
        <rect x="12.5" y="34" width="3" height="10" rx="0.5" fill="url(#buzzerPinGrad)"/>
        <rect x="28.5" y="34" width="3" height="10" rx="0.5" fill="url(#buzzerPinGrad)"/>

        <!-- 핀 라벨 -->
        <text x="10" y="43" font-size="6.5" fill="#f88" font-family="monospace"
          font-weight="bold">+</text>
        <text x="29.5" y="43" font-size="6.5" fill="#8f8" font-family="monospace">−</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-buzzer': SimBuzzer;
  }
}
