import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

interface BoardPin {
  name: string;
  hostX: number;   // host px — 와이어 연결점
  hostY: number;   // host px
  svgX: number;    // viewBox mm — SVG 구멍 표시용
  svgY: number;    // viewBox mm
  side: 'left' | 'right';
  gpioNum?: number;
  type: 'digital' | 'analog' | 'power' | 'signal';
  isPwm?: boolean;
  isAdc?: boolean;
}

/**
 * <sim-board-esp32> — ESP32 DevKit V1 (38-pin Espressif)
 *
 * 실제 ESP32 DevKit V1 스펙 기반 정밀 재현:
 *   PCB: 52 × 28 mm, 검정(#0a0a0a), viewBox="0 0 30 60"
 *   scale: 114/30 = 3.8px/mm → host 114 × 228 px
 *   ESP32-WROOM-32 모듈 (은색): 상단 중앙
 *   Micro USB: 상단 중앙
 *   EN 버튼: 오른쪽 상단
 *   BOOT 버튼: 왼쪽 상단
 *   내장 LED: D2 (파랑)
 *
 * 왼쪽 핀 (x=0, 위→아래): EN, VP/36, VN/39, D34, D35, D32, D33, D25, D26, D27, D14, D12, GND
 * 오른쪽 핀 (x=114, 위→아래): D13, D9, D10, D11, VIN, GND, 3V3, D15, D2, D4, RX0, TX0, D5
 */

// ── 호스트 크기 ─────────────────────────────────────────────────
const HOST_W = 114, HOST_H = 228;
const MM_W = 30, MM_H = 60;

// 핀 Y 좌표 (host px) — 13핀, 첫 번째부터
const PIN_YS_PX = [18, 36, 54, 72, 90, 108, 126, 144, 162, 180, 198, 216, 228];

function px2svgX(px: number): number { return (px / HOST_W) * MM_W; }
function px2svgY(py: number): number { return (py / HOST_H) * MM_H; }

// 왼쪽 핀 x: SVG mm
const LEFT_SVG_X = 0.7;
const RIGHT_SVG_X = MM_W - 0.7;

const ESP32_PINS: BoardPin[] = [
  // ── 왼쪽 (위→아래) ─────────────────────────────────────────────
  { name:'EN',   hostX:0, hostY:PIN_YS_PX[0],  svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[0]),  side:'left', type:'signal' },
  { name:'VP',   hostX:0, hostY:PIN_YS_PX[1],  svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[1]),  side:'left', gpioNum:36, type:'analog', isAdc:true },
  { name:'VN',   hostX:0, hostY:PIN_YS_PX[2],  svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[2]),  side:'left', gpioNum:39, type:'analog', isAdc:true },
  { name:'D34',  hostX:0, hostY:PIN_YS_PX[3],  svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[3]),  side:'left', gpioNum:34, type:'analog', isAdc:true },
  { name:'D35',  hostX:0, hostY:PIN_YS_PX[4],  svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[4]),  side:'left', gpioNum:35, type:'analog', isAdc:true },
  { name:'D32',  hostX:0, hostY:PIN_YS_PX[5],  svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[5]),  side:'left', gpioNum:32, type:'digital', isPwm:true },
  { name:'D33',  hostX:0, hostY:PIN_YS_PX[6],  svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[6]),  side:'left', gpioNum:33, type:'digital', isPwm:true },
  { name:'D25',  hostX:0, hostY:PIN_YS_PX[7],  svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[7]),  side:'left', gpioNum:25, type:'digital', isPwm:true, isAdc:true },
  { name:'D26',  hostX:0, hostY:PIN_YS_PX[8],  svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[8]),  side:'left', gpioNum:26, type:'digital', isPwm:true, isAdc:true },
  { name:'D27',  hostX:0, hostY:PIN_YS_PX[9],  svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[9]),  side:'left', gpioNum:27, type:'digital', isPwm:true, isAdc:true },
  { name:'D14',  hostX:0, hostY:PIN_YS_PX[10], svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[10]), side:'left', gpioNum:14, type:'digital', isPwm:true, isAdc:true },
  { name:'D12',  hostX:0, hostY:PIN_YS_PX[11], svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[11]), side:'left', gpioNum:12, type:'digital', isPwm:true, isAdc:true },
  { name:'GND',  hostX:0, hostY:PIN_YS_PX[12], svgX:LEFT_SVG_X, svgY:px2svgY(PIN_YS_PX[12]), side:'left', type:'power' },
  // ── 오른쪽 (위→아래) ────────────────────────────────────────────
  { name:'D13',  hostX:HOST_W, hostY:PIN_YS_PX[0],  svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[0]),  side:'right', gpioNum:13, type:'digital', isPwm:true, isAdc:true },
  { name:'D9',   hostX:HOST_W, hostY:PIN_YS_PX[1],  svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[1]),  side:'right', gpioNum:9,  type:'digital' },
  { name:'D10',  hostX:HOST_W, hostY:PIN_YS_PX[2],  svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[2]),  side:'right', gpioNum:10, type:'digital' },
  { name:'D11',  hostX:HOST_W, hostY:PIN_YS_PX[3],  svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[3]),  side:'right', gpioNum:11, type:'digital' },
  { name:'VIN',  hostX:HOST_W, hostY:PIN_YS_PX[4],  svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[4]),  side:'right', type:'power' },
  { name:'GND2', hostX:HOST_W, hostY:PIN_YS_PX[5],  svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[5]),  side:'right', type:'power' },
  { name:'3V3',  hostX:HOST_W, hostY:PIN_YS_PX[6],  svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[6]),  side:'right', type:'power' },
  { name:'D15',  hostX:HOST_W, hostY:PIN_YS_PX[7],  svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[7]),  side:'right', gpioNum:15, type:'digital', isPwm:true, isAdc:true },
  { name:'D2',   hostX:HOST_W, hostY:PIN_YS_PX[8],  svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[8]),  side:'right', gpioNum:2,  type:'digital', isPwm:true },
  { name:'D4',   hostX:HOST_W, hostY:PIN_YS_PX[9],  svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[9]),  side:'right', gpioNum:4,  type:'digital', isPwm:true, isAdc:true },
  { name:'RX0',  hostX:HOST_W, hostY:PIN_YS_PX[10], svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[10]), side:'right', gpioNum:3,  type:'digital' },
  { name:'TX0',  hostX:HOST_W, hostY:PIN_YS_PX[11], svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[11]), side:'right', gpioNum:1,  type:'digital' },
  { name:'D5',   hostX:HOST_W, hostY:PIN_YS_PX[12], svgX:RIGHT_SVG_X, svgY:px2svgY(PIN_YS_PX[12]), side:'right', gpioNum:5,  type:'digital', isPwm:true },
];

@customElement('sim-board-esp32')
export class SimBoardEsp32 extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 114px; height: 228px; }
      .btn-en   { cursor: pointer; }
      .btn-boot { cursor: pointer; }
    `,
  ];

  @property({ type: Object }) pinStates: Record<number, number> = {};
  @property({ type: Boolean }) enPressed   = false;
  @property({ type: Boolean }) bootPressed = false;

  override get componentType() { return 'board-esp32'; }
  override get pins() { return ESP32_PINS.map(p => p.name); }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    const p = ESP32_PINS.find(
      p => p.name === pin
        || (p.gpioNum !== undefined && (
          p.gpioNum.toString() === pin
          || `D${p.gpioNum}` === pin
          || `G${p.gpioNum}` === pin
        ))
    );
    if (p?.gpioNum !== undefined) {
      this.pinStates = { ...this.pinStates, [p.gpioNum]: v };
    }
  }

  override getPinPositions() {
    return new Map(ESP32_PINS.map(p => [p.name, { x: p.hostX, y: p.hostY }]));
  }

  // ── EN 버튼 (리셋) ────────────────────────────────────────────
  private _onEnDown(e: PointerEvent) {
    e.stopPropagation();
    this.enPressed = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('sim-reset', { bubbles: true, composed: true }));
    setTimeout(() => {
      this.enPressed = false;
      this.requestUpdate();
      this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
    }, 150);
  }
  private _onEnUp(e: PointerEvent) {
    e.stopPropagation();
  }

  // ── BOOT 버튼 (GPIO0) ─────────────────────────────────────────
  private _onBootDown(e: PointerEvent) {
    e.stopPropagation();
    this.bootPressed = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('sim-pin-press', {
      bubbles: true, composed: true, detail: { gpio: 0 },
    }));
  }
  private _onBootUp(e: PointerEvent) {
    e.stopPropagation();
    this.bootPressed = false;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-pin-release', {
      bubbles: true, composed: true, detail: { gpio: 0 },
    }));
    this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
  }

  override render() {
    // D2 HIGH → 내장 파란 LED 켜짐
    const d2On = (this.pinStates[2] ?? 0) > 0;

    return html`
      <svg width="${HOST_W}" height="${HOST_H}"
           viewBox="0 0 ${MM_W} ${MM_H}"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Micro USB 은색 그라디언트 -->
          <linearGradient id="esp32-usb-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#d4d4d4"/>
            <stop offset="50%"  stop-color="#909090"/>
            <stop offset="100%" stop-color="#c0c0c0"/>
          </linearGradient>
          <!-- WROOM-32 은색 그라디언트 -->
          <linearGradient id="wroom-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#c8c8c8"/>
            <stop offset="40%"  stop-color="#a8a8a8"/>
            <stop offset="100%" stop-color="#888888"/>
          </linearGradient>
          <!-- D2 LED 파랑 글로우 -->
          <radialGradient id="esp32-d2-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%"   stop-color="#6699ff"/>
            <stop offset="100%" stop-color="#0033cc" stop-opacity="0"/>
          </radialGradient>
          <!-- PWR LED 빨강 글로우 -->
          <radialGradient id="esp32-pwr-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%"   stop-color="#ff6060"/>
            <stop offset="100%" stop-color="#cc0000" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- ── PCB 본체 (검정) ── -->
        <rect x="0" y="0" width="${MM_W}" height="${MM_H}" rx="0.4"
          fill="#0a0a0a" stroke="#1a1a1a" stroke-width="0.05"/>
        <!-- PCB 내부 테두리 -->
        <rect x="0.4" y="0.4" width="${MM_W - 0.8}" height="${MM_H - 0.8}" rx="0.3"
          fill="none" stroke="#111" stroke-width="0.06" opacity="0.6"/>

        <!-- ── 핀 헤더 소켓 (검정 플라스틱 바) ── -->
        <!-- 왼쪽 핀 헤더: x=−0.5~2.0mm -->
        <rect x="-0.5" y="${px2svgY(PIN_YS_PX[0]) - 1.0}" width="2.3" height="${px2svgY(PIN_YS_PX[12]) - px2svgY(PIN_YS_PX[0]) + 2.0}" rx="0.2"
          fill="#111" stroke="#000" stroke-width="0.05"/>
        <!-- 오른쪽 핀 헤더: x=28.2~30.5mm -->
        <rect x="${MM_W - 1.8}" y="${px2svgY(PIN_YS_PX[0]) - 1.0}" width="2.3" height="${px2svgY(PIN_YS_PX[12]) - px2svgY(PIN_YS_PX[0]) + 2.0}" rx="0.2"
          fill="#111" stroke="#000" stroke-width="0.05"/>

        <!-- ── ESP32-WROOM-32 모듈 (은색, 상단) ── -->
        <!-- 모듈 외관 -->
        <rect x="4.0" y="0" width="22.0" height="24.0" rx="0.5"
          fill="url(#wroom-grad)" stroke="#707070" stroke-width="0.08"/>
        <!-- 모듈 내부 테두리 -->
        <rect x="4.5" y="0.5" width="21.0" height="23.0" rx="0.4"
          fill="none" stroke="#999" stroke-width="0.05" opacity="0.4"/>
        <!-- 모듈 상단 하이라이트 -->
        <rect x="4.0" y="0" width="22.0" height="1.5" rx="0.5"
          fill="white" opacity="0.08"/>
        <!-- PCB 가장자리 도금 라인 (FCC 테두리) -->
        <rect x="4.2" y="0.2" width="21.6" height="23.6" rx="0.35"
          fill="none" stroke="#aaaaaa" stroke-width="0.04" opacity="0.3"/>

        <!-- WROOM-32 모듈 내부: ESP32 칩 (QFN48) -->
        <rect x="9.5" y="9.0" width="11.0" height="11.0" rx="0.4"
          fill="#1a1a1a" stroke="#282828" stroke-width="0.06"/>
        <!-- 칩 상면 -->
        <rect x="9.8" y="9.3" width="10.4" height="10.4" rx="0.3"
          fill="#282828"/>
        <!-- 핀1 마커 -->
        <circle cx="10.5" cy="9.8" r="0.3" fill="#111"/>
        <!-- 칩 마킹 -->
        <text x="15.0" y="13.8" font-size="0.9" fill="#666"
          font-family="monospace" text-anchor="middle">ESP32</text>
        <text x="15.0" y="15.0" font-size="0.75" fill="#555"
          font-family="monospace" text-anchor="middle">D0WDQ6</text>

        <!-- QFN 핀 패드 (4면 × 12핀) -->
        <!-- 상단 핀 -->
        ${Array.from({length: 10}, (_: unknown, i: number) => svg`
          <rect x="${10.2 + i * 1.0}" y="8.72" width="0.55" height="0.28" rx="0.06"
            fill="#ffd888" opacity="0.8"/>
        `)}
        <!-- 하단 핀 -->
        ${Array.from({length: 10}, (_: unknown, i: number) => svg`
          <rect x="${10.2 + i * 1.0}" y="20.0" width="0.55" height="0.28" rx="0.06"
            fill="#ffd888" opacity="0.8"/>
        `)}
        <!-- 왼쪽 핀 -->
        ${Array.from({length: 8}, (_: unknown, i: number) => svg`
          <rect x="9.22" y="${10.0 + i * 1.0}" width="0.28" height="0.55" rx="0.06"
            fill="#ffd888" opacity="0.8"/>
        `)}
        <!-- 오른쪽 핀 -->
        ${Array.from({length: 8}, (_: unknown, i: number) => svg`
          <rect x="20.5" y="${10.0 + i * 1.0}" width="0.28" height="0.55" rx="0.06"
            fill="#ffd888" opacity="0.8"/>
        `)}

        <!-- 모듈 라벨 -->
        <text x="15.0" y="4.0" font-size="1.0" fill="#333333"
          font-family="monospace" text-anchor="middle" font-weight="bold">ESP32-WROOM-32</text>
        <text x="15.0" y="5.5" font-size="0.75" fill="#444444"
          font-family="monospace" text-anchor="middle">ESPRESSIF</text>

        <!-- 내장 안테나 (모듈 우측 끝) -->
        <rect x="23.5" y="1.0" width="2.0" height="22.0" rx="0.2"
          fill="none" stroke="#888" stroke-width="0.12" opacity="0.4"/>
        <line x1="24.5" y1="1.5"  x2="24.5" y2="22.5" stroke="#777" stroke-width="0.06" opacity="0.35"/>

        <!-- ── Micro USB 커넥터 (상단 중앙) ── -->
        <!-- 외관 금속 쉘 -->
        <rect x="10.5" y="0" width="9.0" height="2.6" rx="0.6"
          fill="url(#esp32-usb-grad)" stroke="#787878" stroke-width="0.07"/>
        <!-- 내부 어두운 구멍 -->
        <rect x="11.2" y="0.12" width="7.6" height="2.3" rx="0.5"
          fill="#222"/>
        <!-- Micro USB 사다리꼴 형상 -->
        <polygon points="11.5,0.3 18.5,0.3 18.8,2.3 11.2,2.3"
          fill="#111"/>
        <!-- 중앙 플라스틱 인서트 -->
        <rect x="12.0" y="0.85" width="6.0" height="0.9" rx="0.2"
          fill="#1e1e1e" stroke="#333" stroke-width="0.04"/>
        <!-- 5핀 (Micro USB B) -->
        ${[12.5, 13.2, 13.9, 14.6, 15.3].map((x: number) => svg`
          <rect x="${x}" y="0.9" width="0.15" height="0.8" rx="0.03"
            fill="#ffd888" opacity="0.85"/>
        `)}
        <!-- 마운팅 탭 -->
        <rect x="10.3" y="0" width="0.4" height="1.2" rx="0.1" fill="#a0a0a0"/>
        <rect x="19.3" y="0" width="0.4" height="1.2" rx="0.1" fill="#a0a0a0"/>

        <!-- ── PWR LED (빨강, 항상 켜짐) ── -->
        <ellipse cx="4.0" cy="27.0" rx="0.5" ry="0.35"
          fill="url(#esp32-pwr-glow)" opacity="0.75"/>
        <rect x="3.78" y="26.55" width="0.44" height="0.9" rx="0.1"
          fill="#cc2222" stroke="#991111" stroke-width="0.04"/>
        <rect x="3.87" y="26.7" width="0.26" height="0.6" rx="0.05"
          fill="#ff4444" opacity="0.95"/>
        <text x="4.6" y="27.2" font-size="0.62" fill="#cc3333"
          font-family="monospace">PWR</text>

        <!-- ── D2 내장 LED (파랑) ── -->
        ${d2On ? svg`
          <ellipse cx="26.0" cy="${px2svgY(PIN_YS_PX[8])}" rx="0.6" ry="0.4"
            fill="url(#esp32-d2-glow)" opacity="0.8"/>
        ` : ''}
        <rect x="25.78" y="${px2svgY(PIN_YS_PX[8]) - 0.45}" width="0.44" height="0.9" rx="0.1"
          fill="${d2On ? '#2244ee' : '#111133'}" stroke="${d2On ? '#4466ff' : '#222244'}" stroke-width="0.04"/>
        <rect x="25.87" y="${px2svgY(PIN_YS_PX[8]) - 0.3}" width="0.26" height="0.6" rx="0.05"
          fill="${d2On ? '#6699ff' : '#1a1a3a'}" opacity="0.95"/>
        <text x="25.4" y="${px2svgY(PIN_YS_PX[8]) + 0.2}" font-size="0.62"
          fill="${d2On ? '#4488ff' : '#334455'}"
          font-family="monospace" text-anchor="end">D2</text>

        <!-- ── EN 버튼 (오른쪽 상단) ── -->
        <g class="btn-en"
          @pointerdown="${this._onEnDown}"
          @pointerup="${this._onEnUp}"
          @pointercancel="${this._onEnUp}">
          <!-- 금속 하우징 -->
          <rect x="22.0" y="25.5" width="6.0" height="3.5" rx="0.3"
            fill="#a0a0a0" stroke="${this.enPressed ? '#ffaa88' : '#707070'}"
            stroke-width="0.07"/>
          <rect x="22.0" y="25.5" width="6.0" height="0.7" rx="0.3"
            fill="white" opacity="0.15"/>
          <!-- 버튼 돔 -->
          <circle cx="25.0" cy="27.25" r="1.0"
            fill="${this.enPressed ? '#cc5533' : '#6d6a6a'}"
            stroke="${this.enPressed ? '#ee8866' : '#555'}"
            stroke-width="0.07"/>
          <circle cx="25.0" cy="27.25" r="0.28"
            fill="${this.enPressed ? '#ffcc99' : '#999'}"/>
          <text x="25.0" y="30.0" font-size="0.72" fill="#cccccc"
            font-family="monospace" text-anchor="middle">EN</text>
        </g>

        <!-- ── BOOT 버튼 (왼쪽 상단) ── -->
        <g class="btn-boot"
          @pointerdown="${this._onBootDown}"
          @pointerup="${this._onBootUp}"
          @pointercancel="${this._onBootUp}">
          <!-- 금속 하우징 -->
          <rect x="2.0" y="25.5" width="6.0" height="3.5" rx="0.3"
            fill="#a0a0a0" stroke="${this.bootPressed ? '#88aaff' : '#707070'}"
            stroke-width="0.07"/>
          <rect x="2.0" y="25.5" width="6.0" height="0.7" rx="0.3"
            fill="white" opacity="0.15"/>
          <!-- 버튼 돔 -->
          <circle cx="5.0" cy="27.25" r="1.0"
            fill="${this.bootPressed ? '#5577cc' : '#6d6a6a'}"
            stroke="${this.bootPressed ? '#8899ee' : '#555'}"
            stroke-width="0.07"/>
          <circle cx="5.0" cy="27.25" r="0.28"
            fill="${this.bootPressed ? '#aabbff' : '#999'}"/>
          <text x="5.0" y="30.0" font-size="0.72" fill="#cccccc"
            font-family="monospace" text-anchor="middle">BOOT</text>
        </g>

        <!-- ── 전압 레귤레이터 AMS1117-3.3 (TO-223) ── -->
        <rect x="22.5" y="32.0" width="4.5" height="5.5" rx="0.3"
          fill="#2a2a2a" stroke="#1a1a1a" stroke-width="0.06"/>
        <!-- 방열판 상단 탭 -->
        <rect x="23.0" y="30.5" width="3.5" height="1.5" rx="0.2"
          fill="#333" stroke="#222" stroke-width="0.04"/>
        <!-- 핀 3개 -->
        ${[23.2, 24.25, 25.3].map((x: number) => svg`
          <rect x="${x}" y="37.5" width="0.5" height="1.2" rx="0.1"
            fill="#c8c8c8" opacity="0.9"/>
        `)}
        <text x="24.75" y="36.5" font-size="0.7" fill="#555"
          font-family="monospace" text-anchor="middle"
          transform="rotate(90, 24.75, 35.5)">AMS1117</text>

        <!-- ── SMD 전해 커패시터 ── -->
        <ellipse cx="20.0" cy="33.0" rx="1.5" ry="1.8"
          fill="#333" stroke="#222" stroke-width="0.06"/>
        <line x1="20.0" y1="31.2" x2="20.0" y2="31.7" stroke="#555" stroke-width="0.1"/>
        <text x="20.0" y="33.3" font-size="0.55" fill="#666"
          font-family="monospace" text-anchor="middle">100µ</text>

        <!-- ── SMD 세라믹 커패시터 (여러 곳) ── -->
        <rect x="7.5" y="26.5" width="0.8" height="0.45" rx="0.1" fill="#111" stroke="#0a0a0a" stroke-width="0.03"/>
        <rect x="7.5" y="28.0" width="0.8" height="0.45" rx="0.1" fill="#111" stroke="#0a0a0a" stroke-width="0.03"/>
        <rect x="2.5" y="33.0" width="0.8" height="0.45" rx="0.1" fill="#111" stroke="#0a0a0a" stroke-width="0.03"/>
        <rect x="2.5" y="35.0" width="0.8" height="0.45" rx="0.1" fill="#111" stroke="#0a0a0a" stroke-width="0.03"/>

        <!-- ── 마운팅 홀 (4개) ── -->
        <circle cx="2.0" cy="2.0"   r="0.9" fill="#000"/>
        <circle cx="2.0" cy="2.0"   r="0.45" fill="#333"/>
        <circle cx="28.0" cy="2.0"  r="0.9" fill="#000"/>
        <circle cx="28.0" cy="2.0"  r="0.45" fill="#333"/>
        <circle cx="2.0" cy="58.0"  r="0.9" fill="#000"/>
        <circle cx="2.0" cy="58.0"  r="0.45" fill="#333"/>
        <circle cx="28.0" cy="58.0" r="0.9" fill="#000"/>
        <circle cx="28.0" cy="58.0" r="0.45" fill="#333"/>

        <!-- ── 보드 실크스크린 텍스트 ── -->
        <text x="15.0" y="42.0" font-size="1.0" fill="#cccccc"
          font-family="Arial,sans-serif" text-anchor="middle"
          font-weight="bold" opacity="0.6">ESP32 DevKit V1</text>
        <text x="15.0" y="43.5" font-size="0.75" fill="#aaaaaa"
          font-family="Arial,sans-serif" text-anchor="middle"
          opacity="0.5">ESPRESSIF SYSTEMS</text>

        <!-- ── 핀 구멍 + 라벨 ── -->
        ${ESP32_PINS.map((pin: BoardPin) => {
          const val = pin.gpioNum !== undefined ? (this.pinStates[pin.gpioNum] ?? 0) : 0;
          const isHigh = val > 0;
          const isLeft = pin.side === 'left';

          // 패드 색상
          const padColor = pin.type === 'power'
            ? (pin.name.startsWith('GND') ? '#4d9966'
             : pin.name === 'VIN' ? '#cc6655'
             : '#cc8866')   // 3V3
            : pin.type === 'signal' ? '#8888aa'
            : pin.isAdc ? '#b8a040' : '#a0905a';

          const holeColor = isHigh ? '#ffe844' : '#030303';

          // 라벨 색상
          const lblColor = pin.type === 'power'
            ? (pin.name.startsWith('GND') ? '#44bb77'
             : pin.name === 'VIN' ? '#ff8877'
             : '#ff9966')
            : pin.type === 'signal' ? '#aaaacc'
            : pin.isAdc ? '#bbaa33' : '#6688cc';

          const lblX = isLeft ? 2.2 : MM_W - 2.2;
          const anchor = isLeft ? 'start' : 'end';
          const label = pin.name === 'GND2' ? 'GND'
            : pin.name === 'VP' ? 'VP/36'
            : pin.name === 'VN' ? 'VN/39'
            : pin.name;

          return svg`
            <g>
              <!-- 솔더 패드 링 -->
              <circle cx="${pin.svgX}" cy="${pin.svgY}" r="0.6"
                fill="${padColor}" opacity="0.9"/>
              <!-- 핀 구멍 -->
              <circle cx="${pin.svgX}" cy="${pin.svgY}" r="0.3"
                fill="${holeColor}"/>
              <!-- 핀 라벨 -->
              <text x="${lblX}" y="${pin.svgY + 0.23}"
                font-size="0.78" font-family="monospace"
                fill="${lblColor}" text-anchor="${anchor}"
                font-weight="${pin.type === 'power' ? 'bold' : 'normal'}"
              >${label}</text>
            </g>
          `;
        })}

        <!-- ── 보드 하단 실크스크린 ── -->
        <text x="15.0" y="59.5" font-size="0.55" fill="#888888"
          font-family="monospace" text-anchor="middle">ESP32 DevKit V1 (240MHz Dual-Core)</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-board-esp32': SimBoardEsp32; }
}
