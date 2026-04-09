import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-buzzer> — 부저 (66×66px)
 * Pins: VCC(+), GND(-)
 */
@customElement('sim-buzzer')
export class SimBuzzer extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 66px; height: 66px; }`,
  ];

  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Number }) frequency = 0;

  private _audioCtx: AudioContext | null = null;
  private _oscillator: OscillatorNode | null = null;
  private _gainNode: GainNode | null = null;

  override get componentType() { return 'buzzer'; }
  override get pins() { return ['VCC', 'GND']; }

  // getPinPositions: viewBox 좌표 × 1.5 (host 66×66 / viewBox 44×44 = 1.5)
  override getPinPositions() {
    return new Map([
      ['VCC', { x: 21, y: 66 }],
      ['GND', { x: 45, y: 66 }],
    ]);
  }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (pin === 'VCC') {
      const shouldPlay = v > 0;
      if (shouldPlay !== this.active) { this.active = shouldPlay; this._updateSound(); }
    } else if (pin === 'FREQ') {
      if (v > 0) { this.setFrequency(v); if (!this.active) { this.active = true; this._updateSound(); } }
      else { this.active = false; this._updateSound(); }
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
    const glowColor   = this.active ? '#ffaa00' : 'none';
    const glowOpacity = this.active ? 0.55 : 0;
    const slots = Array.from({ length: 8 }, (_, i) => {
      const angle = (i * 45 * Math.PI) / 180;
      const r1 = 5.5, r2 = 11.5, cx = 22, cy = 20;
      const x1 = cx + r1 * Math.cos(angle), y1 = cy + r1 * Math.sin(angle);
      const x2 = cx + r2 * Math.cos(angle), y2 = cy + r2 * Math.sin(angle);
      return html`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}"
        x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"
        stroke="${this.active ? '#ffcc44' : '#555'}"
        stroke-width="${this.active ? 1.6 : 1.2}"
        stroke-linecap="round"/>`;
    });

    return html`
      <svg width="66" height="66" viewBox="0 0 44 44">

        <!-- active glow -->
        ${this.active ? html`
          <circle cx="22" cy="20" r="18" fill="${glowColor}" opacity="${glowOpacity * 0.5}"/>
          <circle cx="22" cy="20" r="16" fill="${glowColor}" opacity="${glowOpacity * 0.3}"/>
        ` : ''}

        <!-- 은색 외곽 림 -->
        <circle cx="22" cy="20" r="15.5" fill="none" stroke="#aaaaaa" stroke-width="2.5"/>
        <path d="M 8,14 A 15.5 15.5 0 0 1 36,14"
          fill="none" stroke="white" stroke-width="1.5" opacity="0.3"/>

        <!-- 검은 원통 몸체 -->
        <circle cx="22" cy="20" r="14.5" fill="#111111"/>
        <circle cx="22" cy="20" r="14.5" fill="white" opacity="0.04"/>
        <circle cx="22" cy="20" r="13" fill="none" stroke="#333" stroke-width="0.8"/>

        <!-- 방사형 통기구 슬롯 -->
        ${slots}

        <!-- 중앙 멤브레인 -->
        <circle cx="22" cy="20" r="4.5"
          fill="${this.active ? '#cc8800' : '#2a2a2a'}"
          stroke="${this.active ? '#ffcc00' : '#444'}" stroke-width="0.8"/>
        <circle cx="22" cy="20" r="1.5" fill="${this.active ? '#ffee88' : '#444'}"/>

        <!-- 상단 하이라이트 -->
        <ellipse cx="18" cy="14" rx="4" ry="2.5"
          fill="white" opacity="0.12" transform="rotate(-20,18,14)"/>

        <!-- 핀 라벨 (몸체 하단) -->
        <text x="16" y="38" font-size="5.5" fill="#cc6666" font-family="monospace"
          text-anchor="middle" font-weight="bold">+</text>
        <text x="28" y="38" font-size="5.5" fill="#66cc88" font-family="monospace"
          text-anchor="middle">−</text>

        <!-- PCB 마운트 핀 -->
        <rect x="12.5" y="38" width="3" height="6" rx="0.5" fill="#aaaaaa"/>
        <rect x="13"   y="38" width="1.5" height="6" fill="white" opacity="0.35"/>
        <rect x="28.5" y="38" width="3" height="6" rx="0.5" fill="#aaaaaa"/>
        <rect x="29"   y="38" width="1.5" height="6" fill="white" opacity="0.35"/>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-buzzer': SimBuzzer; }
}
