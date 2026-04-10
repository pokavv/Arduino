// ─── SimElementLike 인터페이스 ────────────────────────────────────────────────
// sim-led, sim-button 등 Lit Custom Element가 공통으로 구현하는 계약

export interface SimElementLike extends HTMLElement {
  compId: string;
  setPinState(pin: string, value: number | string): void;
  getPinPositions(): Map<string, { x: number; y: number }>;
}

export function isSimElement(el: Element): el is SimElementLike {
  return typeof (el as SimElementLike).setPinState === 'function';
}
