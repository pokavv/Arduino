import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { SimElement } from './sim-element.js';

export interface GenericPinDef {
  name: string;
  x: number;
  y: number;
  type?: string;
  label?: string;
}

/**
 * 서버 정의 커스텀 컴포넌트 범용 렌더러
 * - svgTemplate: 서버에서 받은 SVG 마크업 문자열
 * - pinDefs: 핀 이름 + 좌표 배열
 *
 * 내장 Lit 컴포넌트가 없는 모든 서버 등록 부품에 사용됩니다.
 */
@customElement('sim-generic')
export class SimGeneric extends SimElement {
  @property({ type: String })  svgTemplate = '';
  @property({ type: Array })   pinDefs: GenericPinDef[] = [];
  @property({ type: Number })  compWidth  = 80;
  @property({ type: Number })  compHeight = 60;
  @property({ type: String })  label      = '부품';

  // SimElement.styles 상속 + 추가 스타일
  static override styles = [
    ...(Array.isArray(SimElement.styles) ? SimElement.styles : [SimElement.styles]),
    css`svg { overflow: visible; }`,
  ];

  // ── SimElement 추상 멤버 구현 ─────────────────────────────────────

  get componentType() { return 'generic'; }
  get pins() { return this.pinDefs.map(p => p.name); }
  setPinState(_pin: string, _value: number | string) { /* 커스텀 부품은 시각 업데이트 없음 */ }

  override getPinPositions(): Map<string, { x: number; y: number }> {
    const map = new Map<string, { x: number; y: number }>();
    for (const p of this.pinDefs) {
      map.set(p.name, { x: p.x, y: p.y });
    }
    return map;
  }

  // ── 렌더링 ────────────────────────────────────────────────────────

  override render() {
    if (this.svgTemplate) {
      // svgTemplate 은 완전한 <svg> 마크업이므로 직접 렌더링
      // 이중 SVG 래핑 없이 shadow DOM 내 직접 삽입
      return html`${unsafeHTML(this.svgTemplate)}`;
    }

    // svgTemplate 없을 때 기본 플레이스홀더
    const cx = this.compWidth  / 2;
    const cy = this.compHeight / 2;
    return html`
      <svg xmlns="http://www.w3.org/2000/svg"
        width="${this.compWidth}" height="${this.compHeight}"
        viewBox="0 0 ${this.compWidth} ${this.compHeight}">
        <rect x="2" y="2"
          width="${this.compWidth - 4}" height="${this.compHeight - 4}"
          fill="#1a2030" stroke="#3a5070" stroke-width="1.5" rx="5"/>
        <text x="${cx}" y="${cy - 5}"
          fill="#6a9ac0" font-size="9" text-anchor="middle"
          font-family="system-ui,sans-serif">${this.label}</text>
        <text x="${cx}" y="${cy + 8}"
          fill="#3a5070" font-size="8" text-anchor="middle">📦</text>
        ${this.pinDefs.map(p => html`
          <circle cx="${p.x}" cy="${p.y}" r="2.5"
            fill="#3a5070" stroke="#5a8090" stroke-width="0.8"/>
        `)}
      </svg>
    `;
  }
}
