import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-pir-sensor> — HC-SR501 PIR 모션 센서 (76x95px)
 * Wokwi 기준: 흰색 Fresnel 렌즈 돔 + 초록 PCB
 * Pins: VCC(x=10,y=95), OUT(x=38,y=95), GND(x=66,y=95)
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
    if (pin === 'OUT') this.detected = v > 0;
  }

  override getPinPositions() {
    return new Map([
      ['VCC', { x: 10, y: 95 }],
      ['OUT', { x: 38, y: 95 }],
      ['GND', { x: 66, y: 95 }],
    ]);
  }

  private _onToggle(e: PointerEvent) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    this.detected = !this.detected;
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('sim-change', {
      bubbles: true, composed: true,
      detail: { detected: this.detected },
    }));
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
    }, 60);
  }

  override render() {
    const glowOpacity = this.detected ? 0.7 : 0;
    const domeFill = this.detected ? '#fffbe0' : '#f0f0f0';

    return html`
      <svg width="76" height="95" viewBox="0 0 20 25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="dome-g-${this.compId}" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stop-color="white" stop-opacity="0.6"/>
            <stop offset="60%"  stop-color="${domeFill}" stop-opacity="1"/>
            <stop offset="100%" stop-color="#d0d0d0" stop-opacity="1"/>
          </radialGradient>
          <radialGradient id="glow-g-${this.compId}" cx="50%" cy="50%" r="60%">
            <stop offset="0%"   stop-color="#ffee88" stop-opacity="${glowOpacity}"/>
            <stop offset="100%" stop-color="#ffee88" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- PCB (초록) -->
        <rect x="0" y="9" width="20" height="16" rx="0.5"
          fill="#087f45" stroke="#055c33" stroke-width="0.3"/>

        <!-- 감지 글로우 -->
        ${this.detected ? html`
          <ellipse cx="10" cy="11" rx="10" ry="8"
            fill="url(#glow-g-${this.compId})"/>
        ` : ''}

        <!-- Fresnel 렌즈 돔 (흰색 반구) -->
        <ellipse cx="10" cy="9" rx="8.5" ry="9"
          fill="url(#dome-g-${this.compId})"
          stroke="#cccccc" stroke-width="0.3"/>

        <!-- Fresnel 렌즈 패턴 (동심원) -->
        <circle cx="10" cy="9" r="6.5" fill="none" stroke="#ddd" stroke-width="0.25" opacity="0.6"/>
        <circle cx="10" cy="9" r="4.5" fill="none" stroke="#ddd" stroke-width="0.25" opacity="0.6"/>
        <circle cx="10" cy="9" r="2.5" fill="none" stroke="#ddd" stroke-width="0.25" opacity="0.6"/>
        <!-- Fresnel 분할선 (수직/수평) -->
        <line x1="10" y1="0" x2="10" y2="9"  stroke="#ccc" stroke-width="0.2" opacity="0.5"/>
        <line x1="1.5" y1="9" x2="18.5" y2="9" stroke="#ccc" stroke-width="0.2" opacity="0.5"/>
        <line x1="3.6" y1="3.4" x2="16.4" y2="14.6" stroke="#ccc" stroke-width="0.15" opacity="0.3"/>
        <line x1="16.4" y1="3.4" x2="3.6" y2="14.6" stroke="#ccc" stroke-width="0.15" opacity="0.3"/>

        <!-- 돔 하이라이트 -->
        <ellipse cx="7" cy="5" rx="2" ry="1.3"
          fill="white" opacity="0.4" transform="rotate(-20,7,5)"/>

        <!-- PCB SMD (트리머 2개) -->
        <circle cx="4"  cy="16" r="2" fill="#333" stroke="#555" stroke-width="0.3"/>
        <circle cx="4"  cy="16" r="0.5" fill="#888"/>
        <line x1="3.3" y1="16" x2="4.7" y2="16" stroke="#aaa" stroke-width="0.3"/>
        <circle cx="16" cy="16" r="2" fill="#333" stroke="#555" stroke-width="0.3"/>
        <circle cx="16" cy="16" r="0.5" fill="#888"/>
        <line x1="15.3" y1="16" x2="16.7" y2="16" stroke="#aaa" stroke-width="0.3"/>

        <!-- IC (LM324) -->
        <rect x="7.5" y="12.5" width="5" height="3.5" rx="0.3" fill="#1a1a1a" stroke="#333" stroke-width="0.2"/>
        <text x="10" y="14.8" font-size="0.9" fill="#888" font-family="monospace" text-anchor="middle">LM324</text>

        <!-- 핀 와이어 -->
        <rect x="1.5" y="25" width="1.5" height="6" rx="0.4" fill="#cc2200"/>
        <rect x="9.2" y="25" width="1.5" height="6" rx="0.4" fill="#888"/>
        <rect x="17" y="25" width="1.5" height="6" rx="0.4" fill="#222"/>

        <!-- 토글 버튼 영역 (PCB 하단 여백) -->
        <g style="cursor:pointer" @pointerdown="${this._onToggle}">
          <rect x="1" y="17" width="18" height="3.2" rx="0.6"
            fill="${this.detected ? '#1a3a1a' : '#1a1a2a'}"
            stroke="${this.detected ? '#44bb44' : '#334455'}" stroke-width="0.2"/>
          <text x="10" y="19.1" font-size="1.5" fill="${this.detected ? '#44ff44' : '#556677'}"
            font-family="monospace" text-anchor="middle" font-weight="bold">
            ${this.detected ? '🏃 MOTION DETECTED' : 'NO MOTION'}
          </text>
        </g>

        <!-- 핀 라벨 -->
        <rect x="0" y="20.5" width="20" height="5" fill="#0d0d14"/>
        <line x1="0" y1="20.5" x2="20" y2="20.5" stroke="#252535" stroke-width="0.3"/>
        <text x="2.2"  y="24.2" font-size="1.8" fill="#ff8877" font-family="monospace" text-anchor="middle" font-weight="bold">VCC</text>
        <text x="10"   y="24.2" font-size="1.8" fill="#88aaff" font-family="monospace" text-anchor="middle" font-weight="bold">OUT</text>
        <text x="17.8" y="24.2" font-size="1.8" fill="#88ee99" font-family="monospace" text-anchor="middle" font-weight="bold">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-pir-sensor': SimPirSensor; }
}
