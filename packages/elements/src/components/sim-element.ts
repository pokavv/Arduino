import { LitElement, css } from 'lit';
import { property } from 'lit/decorators.js';
import type { PinConnection } from '../types.js';

/**
 * 모든 시뮬레이터 컴포넌트의 베이스 클래스
 * SVG 기반의 시각적 표현 + 핀 연결 상태 관리
 */
export abstract class SimElement extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: absolute;
      user-select: none;
      cursor: grab;
    }
    :host(.selected) {
      outline: 2px solid #4a9eff;
      outline-offset: 2px;
    }
    :host(.dragging) {
      cursor: grabbing;
      opacity: 0.8;
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
  abstract setPinState(pin: string, value: number): void;

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
