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
 * <sim-board-esp32c3> — ESP32-C3 Super Mini
 *
 * Wokwi wokwi-boards/aitewinrobot-esp32c3-supermini 기준 정밀 재현:
 *   PCB: 18 × 24.576 mm, 검정(#000), viewBox="0 0 18 24.576"
 *   scale: 7 px/mm → host 126 × 172 px
 *
 * 레이아웃 (USB-C = 상단):
 *   USB-C: 상단 중앙 (x≈4.5–13.5mm, y≈0–2.2mm)
 *   BOOT 버튼: center (6.41, 10.16)mm
 *   RST  버튼: center (11.86, 10.16)mm
 *   PWR  LED(빨강): (3.12, 7.02)mm
 *   IO8  LED(파랑): (13.60, 12.89)mm — GPIO8 Active LOW
 *   ESP32-C3 IC QFN32: 45° 회전, 중심 (9.76, 15.93)mm
 *   안테나(다크레드 SMD): x=5.95–11.55mm, y=22.03–24.03mm (하단)
 *   레귤레이터 SOT23-5: (2.62, 13.5)–(5.5, 15.0)mm
 *   크리스탈: (3.39, 17.98)–(6.27, 19.80)mm
 *
 * 왼쪽 핀 (x=1.462mm, 위→아래): G5, G6, G7, G8, G9, G10, RX, TX
 * 오른쪽 핀 (x=16.702mm, 위→아래): 5V, GND, 3V3, G4, G3, G2, G1, G0
 */

// ── 핀 Y 좌표 (mm) ─────────────────────────────────────────────
const HOST_W = 126, HOST_H = 172;
const MM_H = 24.576;
const YS = [3.238, 5.778, 8.318, 10.858, 13.398, 15.938, 18.478, 21.018];
function hy(ymm: number): number { return Math.round(ymm * HOST_H / MM_H); }

const C3_PINS: BoardPin[] = [
  // ── 왼쪽 (위→아래) ───────────────────────────────────────────
  { name:'G5',  hostX:0,       hostY:hy(YS[0]), svgX:1.462, svgY:YS[0], side:'left',  gpioNum:5,  type:'digital' },
  { name:'G6',  hostX:0,       hostY:hy(YS[1]), svgX:1.462, svgY:YS[1], side:'left',  gpioNum:6,  type:'digital' },
  { name:'G7',  hostX:0,       hostY:hy(YS[2]), svgX:1.462, svgY:YS[2], side:'left',  gpioNum:7,  type:'digital' },
  { name:'G8',  hostX:0,       hostY:hy(YS[3]), svgX:1.462, svgY:YS[3], side:'left',  gpioNum:8,  type:'digital' },
  { name:'G9',  hostX:0,       hostY:hy(YS[4]), svgX:1.462, svgY:YS[4], side:'left',  gpioNum:9,  type:'digital' },
  { name:'G10', hostX:0,       hostY:hy(YS[5]), svgX:1.462, svgY:YS[5], side:'left',  gpioNum:10, type:'digital', isPwm:true },
  { name:'RX',  hostX:0,       hostY:hy(YS[6]), svgX:1.462, svgY:YS[6], side:'left',  gpioNum:20, type:'digital' },
  { name:'TX',  hostX:0,       hostY:hy(YS[7]), svgX:1.462, svgY:YS[7], side:'left',  gpioNum:21, type:'digital' },
  // ── 오른쪽 (위→아래) ─────────────────────────────────────────
  { name:'5V',  hostX:HOST_W,  hostY:hy(YS[0]), svgX:16.702, svgY:YS[0], side:'right', type:'power' },
  { name:'GND', hostX:HOST_W,  hostY:hy(YS[1]), svgX:16.702, svgY:YS[1], side:'right', type:'power' },
  { name:'3V3', hostX:HOST_W,  hostY:hy(YS[2]), svgX:16.702, svgY:YS[2], side:'right', type:'power' },
  { name:'G4',  hostX:HOST_W,  hostY:hy(YS[3]), svgX:16.702, svgY:YS[3], side:'right', gpioNum:4, type:'analog', isAdc:true },
  { name:'G3',  hostX:HOST_W,  hostY:hy(YS[4]), svgX:16.702, svgY:YS[4], side:'right', gpioNum:3, type:'analog', isAdc:true },
  { name:'G2',  hostX:HOST_W,  hostY:hy(YS[5]), svgX:16.702, svgY:YS[5], side:'right', gpioNum:2, type:'analog', isAdc:true },
  { name:'G1',  hostX:HOST_W,  hostY:hy(YS[6]), svgX:16.702, svgY:YS[6], side:'right', gpioNum:1, type:'analog', isAdc:true },
  { name:'G0',  hostX:HOST_W,  hostY:hy(YS[7]), svgX:16.702, svgY:YS[7], side:'right', gpioNum:0, type:'analog', isAdc:true },
];

@customElement('sim-board-esp32c3')
export class SimBoardEsp32c3 extends SimElement {
  static override styles = [
    SimElement.styles,
    css`
      :host { width: 126px; height: 172px; }
      .btn-boot { cursor: pointer; }
      .btn-rst  { cursor: pointer; }
    `,
  ];

  @property({ type: Object }) pinStates: Record<number, number> = {};
  @property({ type: Boolean }) bootPressed = false;
  @property({ type: Boolean }) rstPressed  = false;

  override get componentType() { return 'board-esp32c3'; }
  override get pins() { return C3_PINS.map(p => p.name); }

  override setPinState(pin: string, value: number | string) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    const p = C3_PINS.find(
      p => p.name === pin || (p.gpioNum !== undefined && (`G${p.gpioNum}` === pin || p.gpioNum === Number(pin)))
    );
    if (p?.gpioNum !== undefined) {
      this.pinStates = { ...this.pinStates, [p.gpioNum]: v };
    }
  }

  override getPinPositions() {
    return new Map(C3_PINS.map(p => [p.name, { x: p.hostX, y: p.hostY }]));
  }

  // ── BOOT 버튼 (GPIO9 → LOW) ──────────────────────────────────
  private _onBootDown(e: PointerEvent) {
    e.stopPropagation();
    this.bootPressed = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-interaction-start', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('sim-pin-press', {
      bubbles: true, composed: true, detail: { gpio: 9 },
    }));
  }
  private _onBootUp(e: PointerEvent) {
    e.stopPropagation();
    this.bootPressed = false;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('sim-pin-release', {
      bubbles: true, composed: true, detail: { gpio: 9 },
    }));
    this.dispatchEvent(new CustomEvent('sim-interaction-end', { bubbles: true, composed: true }));
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
    const g8 = this.pinStates[8] ?? 1;
    const io8On = g8 === 0; // Active LOW

    return html`
      <svg width="${HOST_W}" height="${HOST_H}"
           viewBox="0 0 18 24.576"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- USB-C 실버 그라디언트 -->
          <linearGradient id="usbc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#d4d4d4"/>
            <stop offset="50%"  stop-color="#9a9a9a"/>
            <stop offset="100%" stop-color="#c0c0c0"/>
          </linearGradient>
          <!-- PWR LED 빨강 글로우 -->
          <radialGradient id="pwr-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%"   stop-color="#ff6060"/>
            <stop offset="100%" stop-color="#cc0000" stop-opacity="0"/>
          </radialGradient>
          <!-- IO8 LED 파랑 글로우 -->
          <radialGradient id="io8-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%"   stop-color="#88bbff"/>
            <stop offset="100%" stop-color="#2244cc" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- ── PCB 본체 (검정) ── -->
        <rect x="0" y="0" width="18" height="24.576" rx="0.3"
          fill="#050505" stroke="#1a1a1a" stroke-width="0.05"/>
        <!-- PCB 미세 텍스처 (실크스크린 그리드 느낌) -->
        <rect x="0.3" y="0.3" width="17.4" height="24.0" rx="0.2"
          fill="none" stroke="#0f0f0f" stroke-width="0.03" opacity="0.6"/>

        <!-- ── 핀 헤더 소켓 (검정 플라스틱 바) ── -->
        <!-- 왼쪽 핀 헤더 소켓: x=−0.4~2.0mm -->
        <rect x="-0.4" y="2.3" width="2.1" height="20.0" rx="0.2"
          fill="#111" stroke="#000" stroke-width="0.05"/>
        <!-- 소켓 구분선 (2.54mm 간격) -->
        ${YS.map(y => svg`
          <line x1="-0.4" y1="${y}" x2="1.7" y2="${y}"
            stroke="#000" stroke-width="0.08" opacity="0.5"/>
        `)}
        <!-- 오른쪽 핀 헤더 소켓: x=16.3~18.4mm -->
        <rect x="16.3" y="2.3" width="2.1" height="20.0" rx="0.2"
          fill="#111" stroke="#000" stroke-width="0.05"/>
        ${YS.map(y => svg`
          <line x1="16.3" y1="${y}" x2="18.4" y2="${y}"
            stroke="#000" stroke-width="0.08" opacity="0.5"/>
        `)}

        <!-- ── USB-C 커넥터 (상단 중앙) ── -->
        <!-- 금속 쉘 -->
        <rect x="4.5" y="0" width="9.0" height="2.3" rx="0.9"
          fill="url(#usbc-grad)" stroke="#787878" stroke-width="0.07"/>
        <!-- 내부 구멍 -->
        <rect x="5.25" y="0.18" width="7.5" height="1.93" rx="0.75"
          fill="#111"/>
        <!-- 중앙 플라스틱 인서트 -->
        <rect x="5.8" y="0.65" width="6.4" height="0.75" rx="0.3"
          fill="#1e1e1e" stroke="#333" stroke-width="0.05"/>
        <!-- 데이터 핀 (금색 points) -->
        ${[6.4, 7.1, 7.8, 8.5, 9.2, 9.9, 10.6, 11.3].map(x => svg`
          <rect x="${x}" y="0.68" width="0.22" height="0.68" rx="0.05"
            fill="#ffd888" opacity="0.85"/>
        `)}
        <!-- USB-C 기판 패드 (금색) -->
        <rect x="4.6" y="0" width="0.7" height="0.6" rx="0.1" fill="#c8a820" opacity="0.7"/>
        <rect x="12.7" y="0" width="0.7" height="0.6" rx="0.1" fill="#c8a820" opacity="0.7"/>

        <!-- ── 소형 SOD-323 다이오드 (ESD 보호) — 상단 좌측 ── -->
        <rect x="2.03" y="1.91" width="1.212" height="1.805" rx="0.15"
          fill="#6e6b6b" stroke="#555" stroke-width="0.05"/>
        <!-- 마킹 라인 -->
        <line x1="2.03" y1="2.95" x2="3.24" y2="2.95"
          stroke="#444" stroke-width="0.12"/>

        <!-- ── PWR LED 빨강 (3.121, 7.022)mm — 0603 SMD ── -->
        <!-- 글로우 -->
        <ellipse cx="3.121" cy="7.022" rx="0.7" ry="0.5"
          fill="url(#pwr-glow)" opacity="0.7"/>
        <!-- 하우징 흰색 -->
        <rect x="2.721" y="6.742" width="0.8" height="0.56" rx="0.12"
          fill="#eeeeee" stroke="#cccccc" stroke-width="0.04"/>
        <!-- 발광체 -->
        <rect x="2.921" y="6.812" width="0.4" height="0.42" rx="0.08"
          fill="#e81010" opacity="0.95"/>
        <!-- LED 다리 (초록 solder) -->
        <rect x="2.62" y="6.76" width="0.22" height="0.40" rx="0.05"
          fill="#91cc7d" opacity="0.7"/>
        <rect x="3.28" y="6.76" width="0.22" height="0.40" rx="0.05"
          fill="#91cc7d" opacity="0.7"/>
        <!-- 라벨 -->
        <text x="3.6" y="7.3" font-size="0.7" fill="#664444"
          font-family="monospace">PWR</text>

        <!-- ── BOOT 버튼 (6.414, 10.163)mm ── -->
        <g class="btn-boot"
          @pointerdown="${this._onBootDown}"
          @pointerup="${this._onBootUp}"
          @pointercancel="${this._onBootUp}">
          <!-- 금속 하우징 -->
          <rect x="4.567" y="8.844" width="3.664" height="2.729" rx="0.25"
            fill="#b0aeae" stroke="${this.bootPressed ? '#88aaff' : '#7a7878'}"
            stroke-width="0.07"/>
          <!-- 하이라이트 -->
          <rect x="4.567" y="8.844" width="3.664" height="0.6" rx="0.25"
            fill="white" opacity="0.15"/>
          <!-- 버튼 돔 -->
          <circle cx="6.414" cy="10.163" r="0.687"
            fill="${this.bootPressed ? '#5577cc' : '#6d6a6a'}"
            stroke="${this.bootPressed ? '#8899ee' : '#555'}"
            stroke-width="0.06"/>
          <!-- 돔 중앙 포인트 -->
          <circle cx="6.414" cy="10.163" r="0.18"
            fill="${this.bootPressed ? '#aabbff' : '#999'}"/>
          <!-- 라벨 (90도 회전, 실물 실크스크린) -->
          <text x="4.25" y="10.55"
            font-size="0.62" fill="#e1e1e1" font-family="monospace"
            transform="rotate(-90, 4.25, 10.55)"
            text-anchor="middle">BOOT</text>
        </g>

        <!-- ── RST 버튼 (11.862, 10.163)mm ── -->
        <g class="btn-rst"
          @pointerdown="${this._onRstDown}"
          @pointerup="${this._onRstUp}"
          @pointercancel="${this._onRstUp}">
          <rect x="10.015" y="8.844" width="3.664" height="2.729" rx="0.25"
            fill="#b0aeae" stroke="${this.rstPressed ? '#ffaa88' : '#7a7878'}"
            stroke-width="0.07"/>
          <rect x="10.015" y="8.844" width="3.664" height="0.6" rx="0.25"
            fill="white" opacity="0.15"/>
          <circle cx="11.862" cy="10.163" r="0.687"
            fill="${this.rstPressed ? '#cc5533' : '#6d6a6a'}"
            stroke="${this.rstPressed ? '#ee8866' : '#555'}"
            stroke-width="0.06"/>
          <circle cx="11.862" cy="10.163" r="0.18"
            fill="${this.rstPressed ? '#ffcc99' : '#999'}"/>
          <text x="13.75" y="10.55"
            font-size="0.62" fill="#e1e1e1" font-family="monospace"
            transform="rotate(90, 13.75, 10.55)"
            text-anchor="middle">RST</text>
        </g>

        <!-- ── IO8 LED 파랑 (13.599, 12.885)mm — GPIO8 Active LOW ── -->
        ${io8On ? svg`
          <ellipse cx="13.599" cy="12.885" rx="0.8" ry="0.55"
            fill="url(#io8-glow)" opacity="0.75"/>
        ` : ''}
        <rect x="13.199" y="12.605" width="0.8" height="0.56" rx="0.12"
          fill="#eeeeee" stroke="#cccccc" stroke-width="0.04"/>
        <rect x="13.399" y="12.675" width="0.4" height="0.42" rx="0.08"
          fill="${io8On ? '#4488ff' : '#112244'}" opacity="0.95"/>
        <rect x="12.9" y="12.62" width="0.22" height="0.40" rx="0.05"
          fill="#91cc7d" opacity="0.7"/>
        <rect x="13.56" y="12.62" width="0.22" height="0.40" rx="0.05"
          fill="#91cc7d" opacity="0.7"/>
        <text x="12.7" y="13.15" font-size="0.7"
          fill="${io8On ? '#6688ff' : '#334455'}"
          font-family="monospace" text-anchor="end">IO8</text>

        <!-- ── 레귤레이터 SOT23-5 (2.622, 13.5)mm ── -->
        <rect x="2.622" y="13.5" width="2.88" height="1.514" rx="0.15"
          fill="#6d6a6a" stroke="#555" stroke-width="0.05"/>
        <!-- 마킹 -->
        <circle cx="5.18" cy="13.75" r="0.12" fill="#444"/>
        <!-- 핀 3개 (상) -->
        ${[2.929, 3.704, 5.015].map(x => svg`
          <rect x="${x}" y="13.22" width="0.22" height="0.28" rx="0.05"
            fill="#ffd888" opacity="0.8"/>
        `)}
        <!-- 핀 2개 (하) -->
        ${[2.929, 5.015].map(x => svg`
          <rect x="${x}" y="15.01" width="0.22" height="0.28" rx="0.05"
            fill="#ffd888" opacity="0.8"/>
        `)}

        <!-- ── 크리스탈 (3.387, 17.976)mm ── -->
        <rect x="3.387" y="17.976" width="2.882" height="1.818" rx="0.18"
          fill="#ababab" stroke="#ffd454" stroke-width="0.08"/>
        <!-- 상단 하이라이트 -->
        <rect x="3.387" y="17.976" width="2.882" height="0.45" rx="0.18"
          fill="white" opacity="0.3"/>
        <!-- 솔더 패드 (4개) -->
        <rect x="3.609" y="17.73"  width="1.089" height="0.25" rx="0.06" fill="#ffd888" opacity="0.8"/>
        <rect x="4.853" y="17.73"  width="1.089" height="0.25" rx="0.06" fill="#ffd888" opacity="0.8"/>
        <rect x="3.609" y="19.795" width="1.089" height="0.25" rx="0.06" fill="#ffd888" opacity="0.8"/>
        <rect x="4.853" y="19.795" width="1.089" height="0.25" rx="0.06" fill="#ffd888" opacity="0.8"/>

        <!-- ── ESP32-C3 IC — QFN32, 45° 회전 ── -->
        <!-- 실물 경로 (Wokwi 기준): 다이아몬드형 IC 패키지 -->
        <path d="M 6.269 15.957 L 9.877 12.35 L 13.259 15.732
                 L 13.259 16.06 L 9.816 19.503 L 6.269 15.957 Z"
          fill="#111" stroke="#282828" stroke-width="0.06"/>
        <!-- IC 상단 하이라이트 -->
        <path d="M 6.269 15.957 L 9.877 12.35 L 10.8 13.27 L 7.19 16.88 Z"
          fill="white" opacity="0.04"/>
        <!-- 핀1 마커 (흰 점) -->
        <circle cx="9.814" cy="18.773" r="0.253" fill="#e1e1e1" opacity="0.7"/>
        <!-- IC 마킹 텍스트 -->
        <text x="9.76" y="15.7" font-size="0.8" fill="#555555"
          font-family="monospace" text-anchor="middle"
          transform="rotate(45, 9.76, 15.93)">ESP32-C3</text>
        <text x="9.76" y="16.65" font-size="0.65" fill="#444444"
          font-family="monospace" text-anchor="middle"
          transform="rotate(45, 9.76, 15.93)">ESPRESSIF</text>

        <!-- QFN32 핀 패드 (4면 × 8핀, 45° 회전) -->
        <!-- 상단-우측 변 핀 -->
        ${Array.from({length:8}, (_,i) => {
          const t = (i - 3.5) * 0.68;
          const bx = 9.877 + t * 0.707 + 1.77 * 0.707;
          const by = 12.35  + t * 0.707 - 1.77 * 0.707;
          return svg`<rect x="${(bx-0.165).toFixed(3)}" y="${(by-0.115).toFixed(3)}"
            width="0.33" height="0.23" rx="0.04"
            fill="#ffd888" opacity="0.85"
            transform="rotate(45,${bx.toFixed(3)},${by.toFixed(3)})"/>`;
        })}
        <!-- 우측-하단 변 핀 -->
        ${Array.from({length:8}, (_,i) => {
          const t = (i - 3.5) * 0.68;
          const bx = 13.259 + 1.77 * 0.707 + t * 0.707;
          const by = 15.896 - 1.77 * 0.707 + t * 0.707;
          return svg`<rect x="${(bx-0.165).toFixed(3)}" y="${(by-0.115).toFixed(3)}"
            width="0.33" height="0.23" rx="0.04"
            fill="#ffd888" opacity="0.85"
            transform="rotate(45,${bx.toFixed(3)},${by.toFixed(3)})"/>`;
        })}

        <!-- ── SMD 세라믹 커패시터 (0402, 곳곳에) ── -->
        <rect x="2.0"  y="5.2"  width="0.7" height="0.4" rx="0.1" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.03"/>
        <rect x="3.5"  y="5.2"  width="0.7" height="0.4" rx="0.1" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.03"/>
        <rect x="14.5" y="8.0"  width="0.7" height="0.4" rx="0.1" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.03"/>
        <rect x="14.5" y="11.0" width="0.7" height="0.4" rx="0.1" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.03"/>
        <rect x="2.0"  y="20.5" width="0.7" height="0.4" rx="0.1" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.03"/>
        <rect x="15.0" y="20.5" width="0.7" height="0.4" rx="0.1" fill="#1e1e1e" stroke="#2a2a2a" stroke-width="0.03"/>

        <!-- ── PCB 안테나 (다크레드 SMD 세라믹, 하단) ── -->
        <rect x="5.953" y="22.031" width="5.600" height="2.000" rx="0.15"
          fill="#902c2c" stroke="#812626" stroke-width="0.06"/>
        <!-- 안테나 내부 패턴 -->
        <rect x="6.2"   y="22.2"  width="5.1"  height="1.60"  rx="0.1"
          fill="#7a2424" opacity="0.6"/>
        <line x1="7.0"  y1="22.031" x2="7.0"  y2="24.031" stroke="#601818" stroke-width="0.08"/>
        <line x1="7.8"  y1="22.031" x2="7.8"  y2="24.031" stroke="#601818" stroke-width="0.08"/>
        <line x1="8.6"  y1="22.031" x2="8.6"  y2="24.031" stroke="#601818" stroke-width="0.08"/>
        <line x1="9.4"  y1="22.031" x2="9.4"  y2="24.031" stroke="#601818" stroke-width="0.08"/>
        <line x1="10.2" y1="22.031" x2="10.2" y2="24.031" stroke="#601818" stroke-width="0.08"/>
        <!-- 안테나 솔더 패드 -->
        <rect x="5.974" y="21.982" width="1.327" height="0.25" rx="0.06" fill="#ffd888" opacity="0.7"/>
        <rect x="10.226" y="21.982" width="1.327" height="0.25" rx="0.06" fill="#ffd888" opacity="0.7"/>
        <!-- 방향 마커 (흰 사각형) -->
        <rect x="10.569" y="22.144" width="0.730" height="1.787" rx="0.1"
          fill="white" opacity="0.18"/>
        <!-- "C3" 텍스트 -->
        <text x="8.753" y="23.45" font-size="1.0" fill="#ffcccc"
          font-family="monospace" text-anchor="middle" font-weight="bold">C3</text>

        <!-- ── 핀 구멍 + 라벨 ── -->
        ${C3_PINS.map(pin => {
          const val = pin.gpioNum !== undefined ? (this.pinStates[pin.gpioNum] ?? 0) : 0;
          const isHigh = val > 0;
          const isLeft = pin.side === 'left';

          // 패드 색상
          const padColor = pin.type === 'power'
            ? (pin.name === 'GND' ? '#4d9966'
             : pin.name === '5V'  ? '#cc6655'
             : '#cc8866')   // 3V3
            : pin.isAdc ? '#b8a040' : '#a0905a';

          const holeColor = isHigh ? '#ffe844' : '#030303';

          // 라벨 색상
          const lblColor = pin.type === 'power'
            ? (pin.name === 'GND' ? '#44bb77'
             : pin.name === '5V'  ? '#ff8877'
             : '#ff9966')
            : pin.isAdc ? '#bbaa33' : '#6688cc';

          const lblX = isLeft ? 3.0 : 15.0;
          const anchor = isLeft ? 'start' : 'end';

          return svg`
            <g>
              <!-- 솔더 패드 링 -->
              <circle cx="${pin.svgX}" cy="${pin.svgY}" r="0.58"
                fill="${padColor}" opacity="0.9"/>
              <!-- 핀 구멍 -->
              <circle cx="${pin.svgX}" cy="${pin.svgY}" r="0.29"
                fill="${holeColor}"/>
              <!-- 핀 라벨 -->
              <text x="${lblX}" y="${pin.svgY + 0.22}"
                font-size="0.82" font-family="monospace"
                fill="${lblColor}" text-anchor="${anchor}"
                font-weight="${pin.type === 'power' ? 'bold' : 'normal'}"
              >${pin.name}</text>
            </g>
          `;
        })}

        <!-- ── 실크스크린 핀 번호 (하단 끝 표시) ── -->
        <text x="2.432" y="22.695" font-size="0.65" fill="#e1e1e1"
          font-family="monospace" text-anchor="middle">21</text>
        <text x="15.991" y="22.695" font-size="0.65" fill="#e1e1e1"
          font-family="monospace" text-anchor="middle">0</text>

        <!-- ── 보드 하단 실크스크린 ── -->
        <text x="9.0" y="24.1" font-size="0.58" fill="#999"
          font-family="monospace" text-anchor="middle">ESP32-C3 Super Mini</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-board-esp32c3': SimBoardEsp32c3; }
}
