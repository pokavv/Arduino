import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-buzzer> — 부저 (66×81px)
 * Pins: VCC(+), GND(-)
 */
@customElement('sim-buzzer')
export class SimBuzzer extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { width: 66px; height: 81px; }`,
  ];

  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Number }) frequency = 0;

  private _audioCtx: AudioContext | null = null;
  private _oscillator: OscillatorNode | null = null;
  private _gainNode: GainNode | null = null;

  override get componentType() { return 'buzzer'; }
  override get pins() { return ['VCC', 'GND']; }

  // getPinPositions: viewBox(44×54) × 1.5 = host(66×81)
  // Wokwi: GND(−) 왼쪽, VCC(+) 오른쪽
  // GND x=14×1.5=21, VCC x=30×1.5=45
  override getPinPositions() {
    return new Map([
      ['GND', { x: 21, y: 81 }],
      ['VCC', { x: 45, y: 81 }],
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
      <svg width="66" height="81" viewBox="0 0 44 54">

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

        <!-- 핀 금속 — GND=회색(왼쪽), VCC=빨간색(오른쪽) — Wokwi 실물 순서 -->
        <rect x="12.5" y="37" width="3" height="17" rx="0.5" fill="#666666"/>
        <rect x="13.2" y="37" width="1.2" height="17" fill="white" opacity="0.2"/>
        <rect x="28.5" y="37" width="3" height="17" rx="0.5" fill="#cc4433"/>
        <rect x="29.2" y="37" width="1.2" height="17" fill="white" opacity="0.25"/>

        <!-- VCC 극성 표시 "+" (실물: VCC 핀=오른쪽) -->
        <text x="30" y="36" font-size="5" fill="white" font-family="monospace"
          text-anchor="middle" font-weight="bold">+</text>

        <!-- 핀 라벨 존 (Wokwi 스타일) -->
        <rect x="0" y="43" width="44" height="11" fill="#0d0d14"/>
        <line x1="0" y1="43" x2="44" y2="43" stroke="#252535" stroke-width="0.5"/>

        <text x="14" y="52" font-size="8.5" fill="#88ee99" font-family="monospace"
          text-anchor="middle" font-weight="bold">GND</text>
        <text x="30" y="52" font-size="8.5" fill="#ff8877" font-family="monospace"
          text-anchor="middle" font-weight="bold">VCC</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-buzzer': SimBuzzer; }
}
