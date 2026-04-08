import type { CircuitSnapshot, ComponentSnapshot } from '@sim/engine';

export interface PlacedComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  props: Record<string, unknown>;
  connections: Record<string, number | string>;
  element?: HTMLElement;
}

export type SimState = 'idle' | 'running' | 'error';

/**
 * 회로 상태 저장소 (Reactive Signal 패턴)
 */
export class CircuitStore {
  private _listeners = new Set<() => void>();
  private _state = {
    boardId: 'arduino-uno',
    components: [] as PlacedComponent[],
    selectedId: null as string | null,
    simState: 'idle' as SimState,
    serialOutput: '',
    code: DEFAULT_CODE,
  };

  subscribe(fn: () => void) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  private _notify() {
    for (const fn of this._listeners) fn();
  }

  get boardId() { return this._state.boardId; }
  get components() { return this._state.components; }
  get selectedId() { return this._state.selectedId; }
  get simState() { return this._state.simState; }
  get serialOutput() { return this._state.serialOutput; }
  get code() { return this._state.code; }

  get selectedComponent(): PlacedComponent | null {
    return this._state.components.find(c => c.id === this._state.selectedId) ?? null;
  }

  setBoard(boardId: string) {
    this._state = { ...this._state, boardId };
    this._notify();
  }

  setCode(code: string) {
    this._state = { ...this._state, code };
    this._notify();
  }

  setSimState(simState: SimState) {
    this._state = { ...this._state, simState };
    this._notify();
  }

  appendSerial(text: string) {
    this._state = {
      ...this._state,
      serialOutput: this._state.serialOutput + text,
    };
    this._notify();
  }

  clearSerial() {
    this._state = { ...this._state, serialOutput: '' };
    this._notify();
  }

  selectComponent(id: string | null) {
    this._state = { ...this._state, selectedId: id };
    this._notify();
  }

  addComponent(comp: PlacedComponent) {
    this._state = {
      ...this._state,
      components: [...this._state.components, comp],
    };
    this._notify();
  }

  updateComponent(id: string, patch: Partial<PlacedComponent>) {
    this._state = {
      ...this._state,
      components: this._state.components.map(c =>
        c.id === id ? { ...c, ...patch } : c
      ),
    };
    this._notify();
  }

  removeComponent(id: string) {
    this._state = {
      ...this._state,
      components: this._state.components.filter(c => c.id !== id),
      selectedId: this._state.selectedId === id ? null : this._state.selectedId,
    };
    this._notify();
  }

  clearCircuit() {
    this._state = {
      ...this._state,
      components: [],
      selectedId: null,
    };
    this._notify();
  }

  loadTemplate(template: {
    boardId: string;
    components: object[];
    code: string;
  }) {
    this._state = {
      ...this._state,
      boardId: template.boardId,
      components: (template.components as PlacedComponent[]).slice(),
      code: template.code,
      selectedId: null,
      serialOutput: '',
      simState: 'idle',
    };
    this._notify();
  }

  toSnapshot(): CircuitSnapshot {
    return {
      boardType: this._state.boardId,
      components: this._state.components.map(c => ({
        id: c.id,
        type: c.type,
        props: c.props,
        connections: c.connections,
      } as ComponentSnapshot)),
    };
  }
}

const DEFAULT_CODE = `// Arduino 시뮬레이터
// 코드를 작성하고 ▶ 실행 버튼을 누르세요

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("시뮬레이터 시작!");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}
`;

export const circuitStore = new CircuitStore();
