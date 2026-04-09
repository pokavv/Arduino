import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-potentiometer> — 가변저항 (포텐셔미터)
 *
 * Pins: VCC, GND, WIPER(출력 핀)
 * 출력: 0~1023 (10-bit ADC) 또는 0~4095 (12-bit)
 */
@customElement('sim-potentiometer')
export class SimPotentiometer extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 60px; height: 60px; }
      .knob { cursor: ew-resize; }
    `,
  ];

  @property({ type: Number }) value = 512;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 1023;

  private _dragging = false;
  private _startX = 0;
  private _startValue = 0;

  override get componentType() { return 'potentiometer'; }
  override get pins() { return ['VCC', 'GND', 'WIPER']; }
  override setPinState(_pin: string, _value: number | string) {}

  override getPinPositions() {
    return new Map([
      ['VCC',   { x: 16, y: 58 }],
      ['WIPER', { x: 30, y: 58 }],
      ['GND',   { x: 44, y: 58 }],
    ]);
  }

  getAnalogValue(): number {
    return this.value;
  }

  private _onPointerDown(e: PointerEvent) {
    e.stopPropagation();
    this._dragging = true;
    this._startX = e.clientX;
    this._startValue = this.value;
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  private _onPointerMove(e: PointerEvent) {
    if (!this._dragging) return;
    const dx = e.clientX - this._startX;
    const range = this.max - this.min;
    const newVal = Math.round(this._startValue + (dx / 100) * range);
    this.value = Math.max(this.min, Math.min(this.max, newVal));
    this.dispatchEvent(new CustomEvent('sim-change', {
      bubbles: true, composed: true,
      detail: { value: this.value },
    }));
  }

  private _onPointerUp(e: PointerEvent) {
    this._dragging = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
  }

  override render() {
    const ratio = (this.value - this.min) / (this.max - this.min);
    const angle = -135 + ratio * 270;
    const knobX = 30 + 10 * Math.cos((angle * Math.PI) / 180);
    const knobY = 28 + 10 * Math.sin((angle * Math.PI) / 180);

    return html`
      <svg width="60" height="60" viewBox="0 0 60 60">
        <!-- 몸체 -->
        <rect x="8" y="10" width="44" height="36" rx="4" fill="#2a2a2a" stroke="#555" stroke-width="1"/>
        <!-- 트랙 호 -->
        <path d="M18,42 A16,16 0 1,1 42,42" fill="none" stroke="#444" stroke-width="4" stroke-linecap="round"/>
        <path
          d="M18,42 A16,16 0 1,1 42,42"
          fill="none" stroke="#4a9eff" stroke-width="4"
          stroke-linecap="round"
          stroke-dasharray="50.3"
          stroke-dashoffset="${50.3 * (1 - ratio)}"
          transform="rotate(0,30,28)"
        />
        <!-- 다이얼 -->
        <circle cx="30" cy="28" r="12" fill="#444" stroke="#666" stroke-width="1"
          class="knob"
          @pointerdown="${this._onPointerDown}"
          @pointermove="${this._onPointerMove}"
          @pointerup="${this._onPointerUp}"/>
        <circle cx="${knobX}" cy="${knobY}" r="2.5" fill="#4a9eff"/>

        <!-- 핀 3개 -->
        <line x1="16" y1="46" x2="16" y2="58" stroke="#aaa" stroke-width="2"/>
        <line x1="30" y1="46" x2="30" y2="58" stroke="#aaa" stroke-width="2"/>
        <line x1="44" y1="46" x2="44" y2="58" stroke="#aaa" stroke-width="2"/>
        <text x="12" y="56" font-size="5" fill="#f88" font-family="monospace">VCC</text>
        <text x="26" y="56" font-size="5" fill="#4a9eff" font-family="monospace">W</text>
        <text x="40" y="56" font-size="5" fill="#8f8" font-family="monospace">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sim-potentiometer': SimPotentiometer;
  }
}
