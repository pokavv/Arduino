import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-buzzer> — 압전 부저
 *
 * Wokwi buzzer-element.ts 기준 정밀 재현:
 *   viewBox: 0 0 17 20 (mm, 1unit=1mm)
 *   host: 64×76px  (scale 3.76px/mm)
 *   몸체: cx=8.5 cy=8.5 r=8.15 fill=#1a1a1a
 *   동심원: r=6.3472, r=4.3488 (stroke only)
 *   중심: r=1.3744 fill=#ccc
 *   Pin1(GND): m7.23 16.5v3.5  stroke=black
 *   Pin2(VCC): m9.77 16.5v3.5  stroke=red(#f00)
 *   pinInfo: GND x=27 y=76, VCC x=37 y=76
 */
@customElement('sim-buzzer')
export class SimBuzzer extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 64px; height: 76px; }`,
  ];

  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Number }) frequency = 0;

  private _audioCtx: AudioContext | null = null;
  private _oscillator: OscillatorNode | null = null;
  private _gainNode: GainNode | null = null;

  override get componentType() { return 'buzzer'; }
  override get pins() { return ['GND', 'VCC']; }

  // Wokwi pinInfo: GND x=27 y=76, VCC x=37 y=76
  // (viewBox 17×20 → host 64×76, scale≈3.76)
  // GND: 7.23mm×3.76=27.2≈27, VCC: 9.77mm×3.76=36.7≈37
  override getPinPositions() {
    return new Map([
      ['GND', { x: 27, y: 76 }],
      ['VCC', { x: 37, y: 76 }],
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
    // active 시 음파 애니메이션용 glow
    const glowOpacity = this.active ? 0.45 : 0;

    return html`
      <svg width="64" height="76" viewBox="0 0 17 20"
           xmlns="http://www.w3.org/2000/svg">

        <!-- ── active 글로우 ── -->
        ${this.active ? html`
          <circle cx="8.5" cy="8.5" r="8.5" fill="#ffaa00" opacity="0.18"/>
        ` : ''}

        <!-- ── 외곽 몸체 (Wokwi: cx=8.5 cy=8.5 rx=ry=8.15 fill=#1a1a1a) ── -->
        <ellipse cx="8.5" cy="8.5" rx="8.15" ry="8.15"
          fill="#1a1a1a" stroke="#000000" stroke-width="0.7"/>

        <!-- ── 상단 광택 하이라이트 ── -->
        <ellipse cx="6.8" cy="4.5" rx="2.8" ry="1.6"
          fill="white" opacity="0.07" transform="rotate(-15,6.8,4.5)"/>

        <!-- ── 동심원 링 1 (Wokwi: r=6.3472) ── -->
        <circle cx="8.5" cy="8.5" r="6.3472"
          fill="none" stroke="#000000" stroke-width="0.3"/>

        <!-- ── 동심원 링 2 (Wokwi: r=4.3488) ── -->
        <circle cx="8.5" cy="8.5" r="4.3488"
          fill="none" stroke="#000000" stroke-width="0.3"/>

        <!-- ── 중심 멤브레인 (Wokwi: r=1.3744 fill=#ccc) ── -->
        <circle cx="8.5" cy="8.5" r="1.3744"
          fill="${this.active ? '#ffcc44' : '#cccccc'}"
          stroke="#000000" stroke-width="0.25"/>

        <!-- ── 핀 1: GND (Wokwi: m7.23 16.5v3.5, stroke=black) ── -->
        <path d="M 7.23 16.5 v 3.5"
          fill="none" stroke="#000000" stroke-width="0.5" stroke-linecap="round"/>

        <!-- ── 핀 2: VCC (Wokwi: m9.77 16.5v3.5, stroke=red) ── -->
        <path d="M 9.77 16.5 v 3.5"
          fill="none" stroke="#f00000" stroke-width="0.5" stroke-linecap="round"/>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-buzzer': SimBuzzer; }
}
