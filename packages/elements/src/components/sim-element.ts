import { LitElement, css, type CSSResultGroup } from 'lit';
import { property } from 'lit/decorators.js';
import type { PinConnection } from '../types.js';

/**
 * 모든 시뮬레이터 컴포넌트의 베이스 클래스
 * SVG 기반의 시각적 표현 + 핀 연결 상태 관리
 */
export abstract class SimElement extends LitElement {
  static override styles: CSSResultGroup = css`
    :host {
      display: block;
      position: absolute;
      user-select: none;
      cursor: grab;
      /* 어두운 캔버스에서 컴포넌트가 떠 보이도록 그림자 */
      filter: drop-shadow(0 3px 10px rgba(0,0,0,0.7)) drop-shadow(0 1px 3px rgba(0,0,0,0.5));
      transition: filter 0.12s;
    }
    :host(:hover) {
      filter: drop-shadow(0 4px 14px rgba(0,0,0,0.8)) drop-shadow(0 0 8px rgba(77,143,255,0.2));
    }
    :host(.selected) {
      outline: 2px solid #4a9eff;
      outline-offset: 3px;
      filter: drop-shadow(0 4px 14px rgba(0,0,0,0.8)) drop-shadow(0 0 12px rgba(77,143,255,0.4));
    }
    :host(.dragging) {
      cursor: grabbing;
      opacity: 0.85;
      filter: drop-shadow(0 8px 20px rgba(0,0,0,0.7)) drop-shadow(0 0 16px rgba(77,143,255,0.3));
    }
    svg {
      overflow: visible;
    }
  `;

  @property({ type: String }) compId = '';
  @property({ type: Number }) x = 0;
  @property({ type: Number }) y = 0;
  @property({ type: Number }) rotation = 0;

  /** 핀 이름 → 연결 대상 (GPIO번호 또는 GND/VCC) */
  connections: Map<string, number | string> = new Map();

  /** 컴포넌트 종류 식별자 (예: "led", "button", "resistor") */
  abstract get componentType(): string;

  /** 이 컴포넌트가 노출하는 핀 목록 */
  abstract get pins(): string[];

  /** 시뮬레이션 엔진에서 핀 상태를 업데이트할 때 호출 */
  abstract setPinState(pin: string, value: number | string): void;

  /**
   * 각 핀의 SVG 좌표(컴포넌트 원점 기준)를 반환합니다.
   * 와이어 연결선 그릴 때 사용됩니다.
   */
  getPinPositions(): Map<string, { x: number; y: number }> {
    return new Map();
  }

  /** 엔진에 전달할 직렬화 상태 */
  getState(): Record<string, unknown> {
    return {
      id: this.compId,
      type: this.componentType,
      connections: Object.fromEntries(this.connections),
    };
  }

  /** 핀 연결 설정 */
  setConnection(pin: string, target: number | string) {
    this.connections.set(pin, target);
  }

  /** GPIO 번호로 연결된 핀 이름 찾기 */
  findPinByGpio(gpioNum: number): string | undefined {
    for (const [pin, target] of this.connections) {
      if (target === gpioNum) return pin;
      if (typeof target === 'string') {
        const n = parseInt(target.replace(/^[A-Za-z]+/, ''), 10);
        if (!isNaN(n) && n === gpioNum) return pin;
      }
    }
    return undefined;
  }

  /** 선택 상태 토글 */
  setSelected(selected: boolean) {
    this.classList.toggle('selected', selected);
  }
}
