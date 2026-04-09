import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SimElement } from './sim-element.js';

/**
 * <sim-neopixel> — WS2812B NeoPixel Strip (동적 너비 × 60px)
 *
 * Wokwi neopixel-element.ts 기준 픽셀 렌더링:
 *   viewBox 단위: 5.6631 × 5 mm per pixel
 *   - 외곽 돔: cx=2.8331 cy=2.5 r=2.1 fill=#ddd
 *   - 내부 돔: r=1.7325 fill=#e6e6e6
 *   - 서브픽셀: R(2.5,2.3), G(3.5,3.2), B(3.3,1.45) r=0.3mm
 *   - Glow: cx=3 cy=2.5 r=2.2 blur=0.5
 *
 * Pins: 5V(왼쪽 상단), DOUT(왼쪽 하단), DIN(오른쪽 상단), GND(오른쪽 하단)
 */
@customElement('sim-neopixel')
export class SimNeopixel extends SimElement {
  static override styles = [
    SimElement.styles,
    css`:host { display: block; }`,
  ];

  @property({ type: Number }) count = 8;
  private _pixels: Array<[number, number, number]> = [];

  override get componentType() { return 'neopixel'; }
  // 단순화된 3핀: VCC, GND, DIN (strip 기준)
  override get pins() { return ['5V', 'GND', 'DIN']; }

  override connectedCallback() {
    super.connectedCallback();
    this._pixels = Array.from({ length: this.count }, () => [0, 0, 0] as [number,number,number]);
  }

  override setPinState(_pin: string, _value: number | string) {}

  setPixel(index: number, r: number, g: number, b: number) {
    if (index < 0 || index >= this.count) return;
    this._pixels[index] = [r, g, b];
    this.requestUpdate();
  }

  setAllPixels(pixels: Array<[number, number, number]>) {
    this._pixels = pixels.slice(0, this.count);
    this.requestUpdate();
  }

  // strip 핀 위치 (PCB 왼쪽/오른쪽 끝)
  // 픽셀 하나: 5.6631mm × 1.5scale = 8.5px, strip 너비 = count×pixW + gap
  override getPinPositions() {
    const pixW = 34; // host px per pixel
    const stripW = this.count * pixW + 8;
    return new Map([
      ['5V',  { x: 0,      y: 30 }],
      ['GND', { x: 0,      y: 45 }],
      ['DIN', { x: stripW, y: 30 }],
    ]);
  }

  private _renderPixel(r: number, g: number, b: number, px: number) {
    // Wokwi 방식: 서브픽셀 opacity 계산
    // viewBox 좌표 (mm): 5.6631 × 5 per pixel, 픽셀 오프셋 px (mm)
    const cx = px;  // 픽셀 좌측 오프셋

    const rN = r / 255;
    const gN = g / 255;
    const bN = b / 255;
    const maxOp = Math.max(rN, gN, bN);
    const spotOp = (v: number) => v > 0.001 ? 0.7 + v * 0.3 : 0;
    const glowOp = maxOp > 0.001 ? 0.6 + maxOp * 0.3 : 0;
    const cssR = Math.round(r), cssG = Math.round(g), cssB = Math.round(b);

    // Wokwi bkgWhite: 명도에 따라 배경 밝기 조정
    const bkgWhite = Math.round(maxOp * 50);
    const bkgFill = `rgb(${bkgWhite},${bkgWhite},${bkgWhite})`;

    const stdDev = Math.max(0.1, maxOp * 0.8);

    return svg`
      <!-- SMD 패키지 배경 -->
      <rect x="${cx}" y="0" width="5.6631" height="5"
        fill="#111111" rx="0.15"/>
      <!-- 배경 밝기 (Wokwi bkgWhite) -->
      <rect x="${cx + 0.33}" y="0" width="5.0" height="5"
        fill="${bkgFill}" rx="0.1"/>

      <defs>
        <filter id="light1-${px.toFixed(0)}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="${stdDev}"/>
        </filter>
        <filter id="light2-${px.toFixed(0)}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.5"/>
        </filter>
      </defs>

      <!-- Glow (통합 색상) -->
      <ellipse cx="${cx + 3.0}" cy="2.5" rx="2.2" ry="2.2"
        fill="rgb(${cssR},${cssG},${cssB})"
        filter="url(#light2-${px.toFixed(0)})"
        opacity="${glowOp}"/>

      <!-- 외곽 돔 (Wokwi: r=2.1 fill=#ddd) -->
      <circle cx="${cx + 2.8331}" cy="2.5" r="2.1" fill="#dddddd"/>
      <!-- 내부 돔 (r=1.7325 fill=#e6e6e6) -->
      <circle cx="${cx + 2.8331}" cy="2.5" r="1.7325" fill="#e6e6e6"/>

      <!-- IC 다이 (회색 4분면, Wokwi 기준) -->
      <path d="M${cx+2.8331} 2.5 L${cx+2.8331} 0.8 A1.7 1.7 0 0 1 ${cx+4.5} 2.5Z"
        fill="#bfbfbf"/>
      <path d="M${cx+2.8331} 2.5 L${cx+4.5} 2.5 A1.7 1.7 0 0 1 ${cx+2.8331} 4.2Z"
        fill="#bfbfbf"/>
      <path d="M${cx+2.8331} 2.5 L${cx+2.8331} 4.2 A1.7 1.7 0 0 1 ${cx+1.2} 2.5Z"
        fill="#c8c8c8"/>
      <path d="M${cx+2.8331} 2.5 L${cx+1.2} 2.5 A1.7 1.7 0 0 1 ${cx+2.8331} 0.8Z"
        fill="#c8c8c8"/>
      <!-- 본드 와이어 블록 (우상단 어두운 패치) -->
      <path d="M${cx+2.8331} 2.5 L${cx+3.8} 1.0 L${cx+4.5} 2.0 L${cx+4.0} 2.5Z"
        fill="#666666"/>

      <!-- 서브픽셀 R (2.5, 2.3) -->
      <circle cx="${cx + 2.5}" cy="2.3" r="0.3"
        fill="red"
        filter="url(#light1-${px.toFixed(0)})"
        opacity="${spotOp(rN)}"/>
      <!-- 서브픽셀 G (3.5, 3.2) -->
      <circle cx="${cx + 3.5}" cy="3.2" r="0.3"
        fill="lime"
        filter="url(#light1-${px.toFixed(0)})"
        opacity="${spotOp(gN)}"/>
      <!-- 서브픽셀 B (3.3, 1.45) -->
      <circle cx="${cx + 3.3}" cy="1.45" r="0.3"
        fill="blue"
        filter="url(#light1-${px.toFixed(0)})"
        opacity="${spotOp(bN)}"/>

      <!-- 핀 스터브 (4개: left-top, left-bottom, right-top, right-bottom) -->
      <rect x="${cx}" y="0.5" width="0.35" height="0.9" fill="#b3b1b0"/>
      <rect x="${cx}" y="3.1" width="0.35" height="0.9" fill="#b3b1b0"/>
      <rect x="${cx + 5.313}" y="0.5" width="0.35" height="0.9" fill="#b3b1b0"/>
      <rect x="${cx + 5.313}" y="3.1" width="0.35" height="0.9" fill="#b3b1b0"/>
    `;
  }

  override render() {
    // Wokwi: 5.6631mm per pixel → 우리 scale ≈ 6 (host px/mm)
    // 각 픽셀 viewBox 너비 = 5.6631, 간격 = 0.5
    const pitch = 6.1631; // 5.6631 + 0.5 gap
    const vbW = 2.0 + this.count * pitch; // 좌우 여백 포함
    const vbH = 10;   // 픽셀(5mm) + 상하 여백 + 라벨
    const scale = 6;  // px/mm
    const dispW = Math.ceil(vbW * scale);
    const dispH = 60;

    const pixels = this._pixels.length === this.count
      ? this._pixels
      : Array.from({ length: this.count }, () => [0,0,0] as [number,number,number]);

    return html`
      <svg width="${dispW}" height="${dispH}"
           viewBox="0 0 ${vbW} ${vbH}"
           xmlns="http://www.w3.org/2000/svg">

        <!-- PCB 스트립 (짙은 녹색) -->
        <rect x="0" y="1.0" width="${vbW}" height="6.5" rx="0.4"
          fill="#1a2a1a" stroke="#2a4a2a" stroke-width="0.08"/>
        <!-- 상단 실크스크린 라인 -->
        <rect x="0" y="1.0" width="${vbW}" height="0.6" rx="0.4"
          fill="white" opacity="0.06"/>

        <!-- 픽셀들 -->
        ${pixels.map(([r, g, b], i) => {
          const px = 1.0 + i * pitch; // 픽셀 x 오프셋
          return this._renderPixel(r, g, b, px);
        })}

        <!-- 연결 리드 핀 (왼쪽: 5V 위, DOUT 아래) -->
        <rect x="0.3" y="1.5" width="1.0" height="0.5" rx="0.15" fill="#ffd888" opacity="0.8"/>
        <rect x="0.3" y="3.5" width="1.0" height="0.5" rx="0.15" fill="#ffd888" opacity="0.8"/>

        <!-- 핀 라벨 존 -->
        <rect x="0" y="7.5" width="${vbW}" height="2.5" fill="#0d0d14"/>
        <line x1="0" y1="7.5" x2="${vbW}" y2="7.5" stroke="#252535" stroke-width="0.08"/>

        <text x="1.0" y="9.2" font-size="1.2" fill="#ff8877"
          font-family="monospace" font-weight="bold">5V</text>
        <text x="${vbW - 1.0}" y="9.2" font-size="1.2" fill="#88aaff"
          font-family="monospace" font-weight="bold" text-anchor="end">DIN</text>
        <text x="${vbW * 0.5}" y="9.2" font-size="1.0" fill="#88ee99"
          font-family="monospace" text-anchor="middle">GND</text>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sim-neopixel': SimNeopixel; }
}
