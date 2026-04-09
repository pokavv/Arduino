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
    const ringOpacity = this.active ? 0.8 : 0;
    return html`
      <svg width="44" height="44" viewBox="0 0 44 44">
        <!-- 소리파동 -->
        ${this.active ? html`
          <circle cx="22" cy="22" r="18" fill="none" stroke="#ffcc00"
            stroke-width="1.5" opacity="${ringOpacity * 0.5}"/>
          <circle cx="22" cy="22" r="22" fill="none" stroke="#ffcc00"
            stroke-width="1" opacity="${ringOpacity * 0.3}"/>
        ` : ''}
        <!-- 몸체 -->
        <circle cx="22" cy="22" r="14" fill="${this.active ? '#333' : '#222'}" stroke="#555" stroke-width="1.5"/>
        <circle cx="22" cy="22" r="10" fill="#111"/>
        <circle cx="22" cy="22" r="4" fill="${this.active ? '#ffcc00' : '#333'}"/>
        <!-- 핀 -->
        <line x1="14" y1="36" x2="14" y2="44" stroke="#aaa" stroke-width="2"/>
        <line x1="30" y1="36" x2="30" y2="44" stroke="#aaa" stroke-width="2"/>
        <text x="9"  y="42" font-size="7" fill="#888" font-family="monospace">+</text>
        <text x="26" y="42" font-size="7" fill="#888" font-family="monospace">−</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-buzzer': SimBuzzer;
  }
}
