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
 * <sim-board-nano> — Arduino Nano
 *
 * Wokwi wokwi-arduino-nano 기준 정밀 재현:
 *   PCB: 18 × 45 mm, 초록(#1a5a1a), viewBox="0 0 18 45"
 *   scale: 76/18 ≈ 4.22px/mm → host 76 × 190 px
 *
 * 레이아웃 (USB Mini-B = 상단):
 *   USB Mini-B: 상단 중앙
 *   ATmega328P DIP-28: 중앙
 *   16MHz 크리스탈: 칩 아래
 *   LED 4개: PWR(초록), L/D13(주황), TX(주황), RX(주황)
 *
 * 왼쪽 핀 (x=0, 위→아래): D1/TX, D0/RX, RST, GND, D2, D3~, D4, D5~, D6~, D7, D8, D9~, D10~, D11~, D12
 * 오른쪽 핀 (x=76, 위→아래): D13, 3V3, AREF, A0, A1, A2, A3, A4/SDA, A5/SCL, A6, A7, 5V, RST, GND, VIN
 */

// ── 핀 Y 좌표 (host px) ─────────────────────────────────────────
const HOST_W = 76, HOST_H = 190;
const MM_W = 18, MM_H = 45;
// 스케일: px/mm
const SX = HOST_W / MM_W;  // ≈ 4.222
const SY = HOST_H / MM_H;  // ≈ 4.222

// 핀 Y (host px) — 15핀, 2.54mm 간격
const PIN_YS_PX = [10, 22, 34, 46, 58, 70, 82, 94, 106, 118, 130, 142, 154, 166, 178];
// SVG mm 좌표
function px2mm(px: number, total: number, mmTotal: number): number {
  return (px / total) * mmTotal;
}

const NANO_PINS: BoardPin[] = [
  // ── 왼쪽 (위→아래) ─────────────────────────────────────────────
  { name:'D1',   hostX:0, hostY:PIN_YS_PX[0],  svgX:0.5, svgY:px2mm(PIN_YS_PX[0],  HOST_H, MM_H), side:'left',  gpioNum:1,  type:'digital' },
  { name:'D0',   hostX:0, hostY:PIN_YS_PX[1],  svgX:0.5, svgY:px2mm(PIN_YS_PX[1],  HOST_H, MM_H), side:'left',  gpioNum:0,  type:'digital' },
  { name:'RST',  hostX:0, hostY:PIN_YS_PX[2],  svgX:0.5, svgY:px2mm(PIN_YS_PX[2],  HOST_H, MM_H), side:'left',  type:'signal' },
  { name:'GND',  hostX:0, hostY:PIN_YS_PX[3],  svgX:0.5, svgY:px2mm(PIN_YS_PX[3],  HOST_H, MM_H), side:'left',  type:'power' },
  { name:'D2',   hostX:0, hostY:PIN_YS_PX[4],  svgX:0.5, svgY:px2mm(PIN_YS_PX[4],  HOST_H, MM_H), side:'left',  gpioNum:2,  type:'digital' },
  { name:'D3~',  hostX:0, hostY:PIN_YS_PX[5],  svgX:0.5, svgY:px2mm(PIN_YS_PX[5],  HOST_H, MM_H), side:'left',  gpioNum:3,  type:'digital', isPwm:true },
  { name:'D4',   hostX:0, hostY:PIN_YS_PX[6],  svgX:0.5, svgY:px2mm(PIN_YS_PX[6],  HOST_H, MM_H), side:'left',  gpioNum:4,  type:'digital' },
  { name:'D5~',  hostX:0, hostY:PIN_YS_PX[7],  svgX:0.5, svgY:px2mm(PIN_YS_PX[7],  HOST_H, MM_H), side:'left',  gpioNum:5,  type:'digital', isPwm:true },
  { name:'D6~',  hostX:0, hostY:PIN_YS_PX[8],  svgX:0.5, svgY:px2mm(PIN_YS_PX[8],  HOST_H, MM_H), side:'left',  gpioNum:6,  type:'digital', isPwm:true },
  { name:'D7',   hostX:0, hostY:PIN_YS_PX[9],  svgX:0.5, svgY:px2mm(PIN_YS_PX[9],  HOST_H, MM_H), side:'left',  gpioNum:7,  type:'digital' },
  { name:'D8',   hostX:0, hostY:PIN_YS_PX[10], svgX:0.5, svgY:px2mm(PIN_YS_PX[10], HOST_H, MM_H), side:'left',  gpioNum:8,  type:'digital' },
  { name:'D9~',  hostX:0, hostY:PIN_YS_PX[11], svgX:0.5, svgY:px2mm(PIN_YS_PX[11], HOST_H, MM_H), side:'left',  gpioNum:9,  type:'digital', isPwm:true },
  { name:'D10~', hostX:0, hostY:PIN_YS_PX[12], svgX:0.5, svgY:px2mm(PIN_YS_PX[12], HOST_H, MM_H), side:'left',  gpioNum:10, type:'digital', isPwm:true },
  { name:'D11~', hostX:0, hostY:PIN_YS_PX[13], svgX:0.5, svgY:px2mm(PIN_YS_PX[13], HOST_H, MM_H), side:'left',  gpioNum:11, type:'digital', isPwm:true },
  { name:'D12',  hostX:0, hostY:PIN_YS_PX[14], svgX:0.5, svgY:px2mm(PIN_YS_PX[14], HOST_H, MM_H), side:'left',  gpioNum:12, type:'digital' },
  // ── 오른쪽 (위→아래) ────────────────────────────────────────────
  { name:'D13',      hostX:HOST_W, hostY:PIN_YS_PX[0],  svgX:17.5, svgY:px2mm(PIN_YS_PX[0],  HOST_H, MM_H), side:'right', gpioNum:13, type:'digital' },
  { name:'3V3',      hostX:HOST_W, hostY:PIN_YS_PX[1],  svgX:17.5, svgY:px2mm(PIN_YS_PX[1],  HOST_H, MM_H), side:'right', type:'power' },
  { name:'AREF',     hostX:HOST_W, hostY:PIN_YS_PX[2],  svgX:17.5, svgY:px2mm(PIN_YS_PX[2],  HOST_H, MM_H), side:'right', type:'signal' },
  { name:'A0',       hostX:HOST_W, hostY:PIN_YS_PX[3],  svgX:17.5, svgY:px2mm(PIN_YS_PX[3],  HOST_H, MM_H), side:'right', gpioNum:14, type:'analog', isAdc:true },
  { name:'A1',       hostX:HOST_W, hostY:PIN_YS_PX[4],  svgX:17.5, svgY:px2mm(PIN_YS_PX[4],  HOST_H, MM_H), side:'right', gpioNum:15, type:'analog', isAdc:true },
  { name:'A2',       hostX:HOST_W, hostY:PIN_YS_PX[5],  svgX:17.5, svgY:px2mm(PIN_YS_PX[5],  HOST_H, MM_H), side:'right', gpioNum:16, type:'analog', isAdc:true },
  { name:'A3',       hostX:HOST_W, hostY:PIN_YS_PX[6],  svgX:17.5, svgY:px2mm(PIN_YS_PX[6],  HOST_H, MM_H), side:'right', gpioNum:17, type:'analog', isAdc:true },
  { name:'A4',       hostX:HOST_W, hostY:PIN_YS_PX[7],  svgX:17.5, svgY:px2mm(PIN_YS_PX[7],  HOST_H, MM_H), side:'right', gpioNum:18, type:'analog', isAdc:true },
  { name:'A5',       hostX:HOST_W, hostY:PIN_YS_PX[8],  svgX:17.5, svgY:px2mm(PIN_YS_PX[8],  HOST_H, MM_H), side:'right', gpioNum:19, type:'analog', isAdc:true },
  { name:'A6',       hostX:HOST_W, hostY:PIN_YS_PX[9],  svgX:17.5, svgY:px2mm(PIN_YS_PX[9],  HOST_H, MM_H), side:'right', gpioNum:20, type:'analog', isAdc:true },
  { name:'A7',       hostX:HOST_W, hostY:PIN_YS_PX[10], svgX:17.5, svgY:px2mm(PIN_YS_PX[10], HOST_H, MM_H), side:'right', gpioNum:21, type:'analog', isAdc:true },
  { name:'5V',       hostX:HOST_W, hostY:PIN_YS_PX[11], svgX:17.5, svgY:px2mm(PIN_YS_PX[11], HOST_H, MM_H), side:'right', type:'power' },
  { name:'RST2',     hostX:HOST_W, hostY:PIN_YS_PX[12], svgX:17.5, svgY:px2mm(PIN_YS_PX[12], HOST_H, MM_H), side:'right', type:'signal' },
  { name:'GND2',     hostX:HOST_W, hostY:PIN_YS_PX[13], svgX:17.5, svgY:px2mm(PIN_YS_PX[13], HOST_H, MM_H), side:'right', type:'power' },
  { name:'VIN',      hostX:HOST_W, hostY:PIN_YS_PX[14], svgX:17.5, svgY:px2mm(PIN_YS_PX[14], HOST_H, MM_H), side:'right', type:'power' },
];

// SVG 내부용 상수
const SVG_W = MM_W, SVG_H = MM_H;

// LED 위치 (mm)
const LED_PWR_X = 14.5, LED_PWR_Y = 3.2;   // 초록 PWR
const LED_L_X   = 12.0, LED_L_Y   = 3.2;   // 주황 L(D13)
const LED_TX_X  = 14.5, LED_TX_Y  = 5.0;   // 주황 TX
const LED_RX_X  = 12.0, LED_RX_Y  = 5.0;   // 주황 RX

@customElement('sim-board-nano')
export class SimBoardNano extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 76px; height: 190px; }
      .btn-rst { cursor: pointer; }
    `,
  ];

  @property({ type: Object }) pinStates: Record<number, number> = {};
  @property({ type: Boolean }) rstPressed = false;

  override get componentType() { return 'board-nano'; }
  override get pins() { return NANO_PINS.map(p => p.name); }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    const p = NANO_PINS.find(
      p => p.name === pin
        || (p.gpioNum !== undefined && (
          p.gpioNum.toString() === pin
          || `D${p.gpioNum}` === pin
          || `A${p.gpioNum - 14}` === pin
        ))
    );
    if (p?.gpioNum !== undefined) {
      this.pinStates = { ...this.pinStates, [p.gpioNum]: v };
    }
  }

  override getPinPositions() {
    return new Map(NANO_PINS.map(p => [p.name, { x: p.hostX, y: p.hostY }]));
  }

  // ── RST 버튼 ─────────────────────────────────────────────────
  private _onRstDown(e: PointerEvent) {
    e.stopPropagation();
    this.rstPressed = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('sim-reset', { bubbles: true, composed: true }));
    setTimeout(() => {
      this.rstPressed = false;
      this.requestUpdate();
      this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
    }, 150);
  }
  private _onRstUp(e: PointerEvent) {
    e.stopPropagation();
  }

  override render() {
    const d13On = (this.pinStates[13] ?? 0) > 0;
    const txOn  = (this.pinStates[1]  ?? 0) > 0;
    const rxOn  = (this.pinStates[0]  ?? 0) > 0;

    return html`
      <svg width="${HOST_W}" height="${HOST_H}"
           viewBox="0 0 ${SVG_W} ${SVG_H}"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- USB Mini-B 은색 그라디언트 -->
          <linearGradient id="nano-usb-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#d0d0d0"/>
            <stop offset="50%"  stop-color="#909090"/>
            <stop offset="100%" stop-color="#b8b8b8"/>
          </linearGradient>
          <!-- PWR LED 초록 글로우 -->
          <radialGradient id="nano-pwr-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%"   stop-color="#88ff88"/>
            <stop offset="100%" stop-color="#00aa00" stop-opacity="0"/>
          </radialGradient>
          <!-- L LED 주황 글로우 -->
          <radialGradient id="nano-l-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%"   stop-color="#ffcc44"/>
            <stop offset="100%" stop-color="#cc6600" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- ── PCB 본체 (초록) ── -->
        <rect x="0" y="0" width="${SVG_W}" height="${SVG_H}" rx="0.4"
          fill="#1a5a1a" stroke="#124012" stroke-width="0.05"/>
        <!-- PCB 내부 테두리 (실크스크린 효과) -->
        <rect x="0.4" y="0.4" width="${SVG_W - 0.8}" height="${SVG_H - 0.8}" rx="0.3"
          fill="none" stroke="#1e6a1e" stroke-width="0.06" opacity="0.7"/>

        <!-- ── 핀 헤더 소켓 (검정 플라스틱 바) ── -->
        <!-- 왼쪽 핀 헤더: x=−0.5~1.5mm -->
        <rect x="-0.5" y="7.0" width="2.0" height="${(14 * 12 / HOST_H) * SVG_H}" rx="0.2"
          fill="#111" stroke="#000" stroke-width="0.05"/>
        <!-- 오른쪽 핀 헤더: x=16.5~18.5mm -->
        <rect x="16.5" y="7.0" width="2.0" height="${(14 * 12 / HOST_H) * SVG_H}" rx="0.2"
          fill="#111" stroke="#000" stroke-width="0.05"/>

        <!-- ── USB Mini-B 커넥터 (상단 중앙) ── -->
        <!-- 외관 금속 쉘 -->
        <rect x="5.5" y="0" width="7.0" height="2.8" rx="0.5"
          fill="url(#nano-usb-grad)" stroke="#787878" stroke-width="0.07"/>
        <!-- 내부 어두운 구멍 -->
        <rect x="6.2" y="0.15" width="5.6" height="2.5" rx="0.4"
          fill="#222"/>
        <!-- USB Mini-B 특유의 사다리꼴 형상 -->
        <polygon points="6.5,0.4 11.5,0.4 11.8,2.5 6.2,2.5"
          fill="#111"/>
        <!-- 중앙 플라스틱 인서트 -->
        <rect x="7.0" y="1.0" width="4.0" height="1.0" rx="0.2"
          fill="#1e1e1e" stroke="#333" stroke-width="0.04"/>
        <!-- 핀 (금색) -->
        ${[7.6, 8.2, 8.8, 9.4, 10.0].map((x: number) => svg`
          <rect x="${x}" y="1.05" width="0.18" height="0.9" rx="0.04"
            fill="#ffd888" opacity="0.85"/>
        `)}
        <!-- USB Mini-B 마운팅 탭 -->
        <rect x="5.3" y="0" width="0.4" height="1.0" rx="0.1" fill="#a0a0a0"/>
        <rect x="12.3" y="0" width="0.4" height="1.0" rx="0.1" fill="#a0a0a0"/>

        <!-- ── ATmega328P DIP-28 칩 ── -->
        <!-- 칩 케이스 (검정) -->
        <rect x="3.5" y="14.5" width="11.0" height="16.5" rx="0.5"
          fill="#1a1a1a" stroke="#0a0a0a" stroke-width="0.06"/>
        <!-- 칩 상면 (약간 밝음) -->
        <rect x="3.8" y="14.8" width="10.4" height="15.9" rx="0.3"
          fill="#282828"/>
        <!-- 핀1 마커 반원 (상단) -->
        <path d="M 9,14.5 a 0.5,0.5 0 0 0 0,0 l 0,0 a 1.2,1.2 0 0 1 0,-1.2 Z" fill="none"/>
        <path d="M 8.5,14.5 a 1.2,1.2 0 0 0 1.2,0 Z" fill="#111"/>
        <!-- DIP 핀 왼쪽 (14핀) -->
        ${Array.from({length: 14}, (_: unknown, i: number) => svg`
          <rect x="2.8" y="${15.2 + i * 1.1}" width="0.7" height="0.55" rx="0.12"
            fill="#d4d4d4" opacity="0.9"/>
        `)}
        <!-- DIP 핀 오른쪽 (14핀) -->
        ${Array.from({length: 14}, (_: unknown, i: number) => svg`
          <rect x="14.5" y="${15.2 + i * 1.1}" width="0.7" height="0.55" rx="0.12"
            fill="#d4d4d4" opacity="0.9"/>
        `)}
        <!-- 핀1 마커 (동그라미 홈) -->
        <circle cx="4.6" cy="15.3" r="0.35" fill="#111"/>
        <!-- 칩 마킹 텍스트 -->
        <text x="9.0" y="21.0" font-size="0.85" fill="#888888"
          font-family="monospace" text-anchor="middle" letter-spacing="0.05">ATmega328P</text>
        <text x="9.0" y="22.1" font-size="0.7" fill="#666666"
          font-family="monospace" text-anchor="middle">ARDUINO</text>
        <text x="9.0" y="23.1" font-size="0.65" fill="#555555"
          font-family="monospace" text-anchor="middle">NANO</text>
        <!-- 칩 상단 하이라이트 -->
        <rect x="3.8" y="14.8" width="10.4" height="1.2" rx="0.3"
          fill="white" opacity="0.03"/>

        <!-- ── 16MHz 크리스탈 ── -->
        <rect x="5.5" y="32.0" width="4.5" height="2.2" rx="0.6"
          fill="#ccccbb" stroke="#aaaa88" stroke-width="0.07"/>
        <!-- 크리스탈 상단 하이라이트 -->
        <rect x="5.5" y="32.0" width="4.5" height="0.55" rx="0.6"
          fill="white" opacity="0.3"/>
        <!-- 솔더 패드 -->
        <rect x="5.7" y="31.75" width="1.2" height="0.25" rx="0.06" fill="#ffd888" opacity="0.8"/>
        <rect x="7.6" y="31.75" width="1.2" height="0.25" rx="0.06" fill="#ffd888" opacity="0.8"/>
        <rect x="5.7" y="34.2"  width="1.2" height="0.25" rx="0.06" fill="#ffd888" opacity="0.8"/>
        <rect x="7.6" y="34.2"  width="1.2" height="0.25" rx="0.06" fill="#ffd888" opacity="0.8"/>
        <text x="7.75" y="33.4" font-size="0.65" fill="#555544"
          font-family="monospace" text-anchor="middle">16MHz</text>

        <!-- ── 전압 레귤레이터 (SOT-23) ── -->
        <rect x="3.0" y="9.5" width="2.2" height="1.4" rx="0.2"
          fill="#333333" stroke="#222" stroke-width="0.05"/>
        <!-- 핀 3개 -->
        ${[3.2, 3.8, 4.4].map((x: number) => svg`
          <rect x="${x}" y="9.2" width="0.2" height="0.3" rx="0.04"
            fill="#ffd888" opacity="0.8"/>
          <rect x="${x}" y="10.9" width="0.2" height="0.3" rx="0.04"
            fill="#ffd888" opacity="0.8"/>
        `)}

        <!-- ── SMD 커패시터 (0402, 여러 곳) ── -->
        <rect x="12.5" y="5.0"  width="0.8" height="0.45" rx="0.1" fill="#1e3a1e" stroke="#1a1a1a" stroke-width="0.03"/>
        <rect x="2.0"  y="8.5"  width="0.8" height="0.45" rx="0.1" fill="#1e3a1e" stroke="#1a1a1a" stroke-width="0.03"/>
        <rect x="13.5" y="35.0" width="0.8" height="0.45" rx="0.1" fill="#1e3a1e" stroke="#1a1a1a" stroke-width="0.03"/>
        <rect x="2.0"  y="35.0" width="0.8" height="0.45" rx="0.1" fill="#1e3a1e" stroke="#1a1a1a" stroke-width="0.03"/>

        <!-- ── RST 버튼 (상단 오른쪽) ── -->
        <g class="btn-rst"
          @pointerdown="${this._onRstDown}"
          @pointerup="${this._onRstUp}"
          @pointercancel="${this._onRstUp}">
          <!-- 금속 하우징 -->
          <rect x="11.8" y="8.5" width="3.2" height="2.8" rx="0.25"
            fill="#a0a0a0" stroke="${this.rstPressed ? '#ffaa88' : '#707070'}"
            stroke-width="0.07"/>
          <!-- 하이라이트 -->
          <rect x="11.8" y="8.5" width="3.2" height="0.55" rx="0.25"
            fill="white" opacity="0.15"/>
          <!-- 버튼 돔 -->
          <circle cx="13.4" cy="9.9" r="0.75"
            fill="${this.rstPressed ? '#cc5533' : '#6d6a6a'}"
            stroke="${this.rstPressed ? '#ee8866' : '#555'}"
            stroke-width="0.06"/>
          <circle cx="13.4" cy="9.9" r="0.22"
            fill="${this.rstPressed ? '#ffcc99' : '#999'}"/>
        </g>
        <text x="13.4" y="12.0" font-size="0.65" fill="#cccccc"
          font-family="monospace" text-anchor="middle">RST</text>

        <!-- ── LED 4개 ── -->
        <!-- PWR LED (초록, 항상 켜짐) -->
        <ellipse cx="${LED_PWR_X}" cy="${LED_PWR_Y}" rx="0.5" ry="0.35"
          fill="url(#nano-pwr-glow)" opacity="0.75"/>
        <rect x="${LED_PWR_X - 0.22}" y="${LED_PWR_Y - 0.45}"
          width="0.44" height="0.9" rx="0.1"
          fill="#22cc22" stroke="#119911" stroke-width="0.04"/>
        <rect x="${LED_PWR_X - 0.13}" y="${LED_PWR_Y - 0.3}"
          width="0.26" height="0.6" rx="0.05"
          fill="#66ff66" opacity="0.95"/>
        <text x="${LED_PWR_X + 0.35}" y="${LED_PWR_Y + 0.2}" font-size="0.6" fill="#33aa33"
          font-family="monospace">PWR</text>

        <!-- L LED (D13, 주황/켜짐) -->
        ${d13On ? svg`
          <ellipse cx="${LED_L_X}" cy="${LED_L_Y}" rx="0.5" ry="0.35"
            fill="url(#nano-l-glow)" opacity="0.75"/>
        ` : ''}
        <rect x="${LED_L_X - 0.22}" y="${LED_L_Y - 0.45}"
          width="0.44" height="0.9" rx="0.1"
          fill="${d13On ? '#ff9922' : '#663300'}" stroke="${d13On ? '#cc6600' : '#441100'}" stroke-width="0.04"/>
        <rect x="${LED_L_X - 0.13}" y="${LED_L_Y - 0.3}"
          width="0.26" height="0.6" rx="0.05"
          fill="${d13On ? '#ffcc44' : '#442200'}" opacity="0.95"/>
        <text x="${LED_L_X - 0.35}" y="${LED_L_Y + 0.2}" font-size="0.6" fill="${d13On ? '#ff9922' : '#664422'}"
          font-family="monospace" text-anchor="end">L</text>

        <!-- TX LED (주황) -->
        <rect x="${LED_TX_X - 0.22}" y="${LED_TX_Y - 0.45}"
          width="0.44" height="0.9" rx="0.1"
          fill="${txOn ? '#ff9922' : '#663300'}" stroke="${txOn ? '#cc6600' : '#441100'}" stroke-width="0.04"/>
        <rect x="${LED_TX_X - 0.13}" y="${LED_TX_Y - 0.3}"
          width="0.26" height="0.6" rx="0.05"
          fill="${txOn ? '#ffcc44' : '#442200'}" opacity="0.95"/>
        <text x="${LED_TX_X + 0.35}" y="${LED_TX_Y + 0.2}" font-size="0.6" fill="${txOn ? '#ff9922' : '#664422'}"
          font-family="monospace">TX</text>

        <!-- RX LED (주황) -->
        <rect x="${LED_RX_X - 0.22}" y="${LED_RX_Y - 0.45}"
          width="0.44" height="0.9" rx="0.1"
          fill="${rxOn ? '#ff9922' : '#663300'}" stroke="${rxOn ? '#cc6600' : '#441100'}" stroke-width="0.04"/>
        <rect x="${LED_RX_X - 0.13}" y="${LED_RX_Y - 0.3}"
          width="0.26" height="0.6" rx="0.05"
          fill="${rxOn ? '#ffcc44' : '#442200'}" opacity="0.95"/>
        <text x="${LED_RX_X - 0.35}" y="${LED_RX_Y + 0.2}" font-size="0.6" fill="${rxOn ? '#ff9922' : '#664422'}"
          font-family="monospace" text-anchor="end">RX</text>

        <!-- ── 마운팅 홀 (4개) ── -->
        <circle cx="1.5" cy="1.5"  r="0.7" fill="#124012"/>
        <circle cx="1.5" cy="1.5"  r="0.35" fill="#333"/>
        <circle cx="16.5" cy="1.5"  r="0.7" fill="#124012"/>
        <circle cx="16.5" cy="1.5"  r="0.35" fill="#333"/>
        <circle cx="1.5" cy="43.5" r="0.7" fill="#124012"/>
        <circle cx="1.5" cy="43.5" r="0.35" fill="#333"/>
        <circle cx="16.5" cy="43.5" r="0.7" fill="#124012"/>
        <circle cx="16.5" cy="43.5" r="0.35" fill="#333"/>

        <!-- ── Arduino 로고 텍스트 ── -->
        <text x="9.0" y="39.0" font-size="0.9" fill="#ffffff"
          font-family="Arial,sans-serif" text-anchor="middle"
          font-weight="bold" opacity="0.6">ARDUINO</text>
        <text x="9.0" y="40.2" font-size="0.75" fill="#ffffff"
          font-family="Arial,sans-serif" text-anchor="middle"
          opacity="0.5">NANO</text>

        <!-- ── 핀 구멍 + 라벨 ── -->
        ${NANO_PINS.map((pin: BoardPin) => {
          const val = pin.gpioNum !== undefined ? (this.pinStates[pin.gpioNum] ?? 0) : 0;
          const isHigh = val > 0;
          const isLeft = pin.side === 'left';

          // 패드 색상
          const padColor = pin.type === 'power'
            ? (pin.name.startsWith('GND') ? '#4d9966'
             : pin.name === '5V' ? '#cc6655'
             : pin.name === '3V3' ? '#cc8866'
             : '#cc8866')
            : pin.type === 'signal' ? '#8888aa'
            : pin.isAdc ? '#b8a040' : '#a0905a';

          const holeColor = isHigh ? '#ffe844' : '#030303';

          // 라벨 색상
          const lblColor = pin.type === 'power'
            ? (pin.name.startsWith('GND') ? '#44bb77'
             : pin.name === '5V' ? '#ff8877'
             : '#ff9966')
            : pin.type === 'signal' ? '#aaaacc'
            : pin.isAdc ? '#bbaa33' : '#88bb88';

          const lblX = isLeft ? 2.0 : 16.0;
          const anchor = isLeft ? 'start' : 'end';
          // 라벨 표시명 (RST2, GND2 → RST, GND)
          const displayName = pin.name.replace(/\d+$/, (m: string) => isNaN(parseInt(m)) ? m : (pin.name.endsWith(m) && m.length > 0 && parseInt(m) > 1) ? '' : m);
          const label = pin.name === 'RST2' ? 'RST' : pin.name === 'GND2' ? 'GND' : pin.name;

          return svg`
            <g>
              <!-- 솔더 패드 링 -->
              <circle cx="${pin.svgX}" cy="${pin.svgY}" r="0.55"
                fill="${padColor}" opacity="0.9"/>
              <!-- 핀 구멍 -->
              <circle cx="${pin.svgX}" cy="${pin.svgY}" r="0.27"
                fill="${holeColor}"/>
              <!-- 핀 라벨 -->
              <text x="${lblX}" y="${pin.svgY + 0.22}"
                font-size="0.75" font-family="monospace"
                fill="${lblColor}" text-anchor="${anchor}"
                font-weight="${pin.type === 'power' ? 'bold' : 'normal'}"
              >${label}</text>
            </g>
          `;
        })}

        <!-- ── 보드 하단 실크스크린 ── -->
        <text x="9.0" y="44.6" font-size="0.55" fill="#aaccaa"
          font-family="monospace" text-anchor="middle">Arduino Nano (ATmega328P)</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-board-nano': SimBoardNano; }
}
