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

/** 두 핀 사이의 와이어 */
export interface PlacedWire {
  id: string;
  fromCompId: string;
  fromPin: string;
  toCompId: string;
  toPin: string;
  /** 자동 결정: GND=#666, VCC=#e44, GPIO=#4af, 3V3=#f84 */
  color?: string;
  /** 라우팅 스타일 — bezier(기본) | straight | orthogonal */
  style?: 'bezier' | 'straight' | 'orthogonal';
  /** 커스텀 경유점: bezier용 제어점 또는 꺾임점 */
  waypoints?: Array<{ x: number; y: number }>;
}

/** 선택된 핀 노드 */
export interface SelectedPin {
  compId: string;
  pinName: string;
}

export type SimState = 'idle' | 'running' | 'error';

/**
 * 회로 상태 저장소 (Reactive Signal 패턴)
 */
type CircuitStateSnapshot = {
  boardId: string;
  components: PlacedComponent[];
  wires: PlacedWire[];
  code: string;
};

export class CircuitStore {
  private _listeners = new Set<() => void>();
  private _state = {
    boardId: 'arduino-uno',
    components: [] as PlacedComponent[],
    wires: [] as PlacedWire[],
    selectedId: null as string | null,
    selectedWireId: null as string | null,
    selectedPin: null as SelectedPin | null,
    simState: 'idle' as SimState,
    serialOutput: '',
    code: DEFAULT_CODE,
  };

  /** Undo/Redo 히스토리 */
  private _history: CircuitStateSnapshot[] = [];
  private _historyIndex = -1;
  private static readonly MAX_HISTORY = 50;

  subscribe(fn: () => void) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  private _notify() {
    for (const fn of this._listeners) fn();
  }

  /** 현재 회로 상태를 히스토리에 저장 (Undo 가능한 작업 전 호출) */
  private _pushHistory() {
    const snap: CircuitStateSnapshot = {
      boardId:    this._state.boardId,
      components: JSON.parse(JSON.stringify(this._state.components)),
      wires:      JSON.parse(JSON.stringify(this._state.wires)),
      code:       this._state.code,
    };
    // 현재 인덱스 이후 미래 히스토리 제거
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push(snap);
    if (this._history.length > CircuitStore.MAX_HISTORY) {
      this._history.shift();
      // shift() 로 앞 항목을 제거했으므로 인덱스를 마지막 항목에 맞춤
      this._historyIndex = this._history.length - 1;
    } else {
      this._historyIndex++;
    }
  }

  get canUndo() { return this._historyIndex >= 0; }
  get canRedo() { return this._historyIndex < this._history.length - 1; }

  undo() {
    if (this._historyIndex < 0) return;
    const snap = this._history[this._historyIndex];
    this._historyIndex--;
    this._applySnapshot(snap);
  }

  redo() {
    if (this._historyIndex >= this._history.length - 1) return;
    this._historyIndex++;
    const snap = this._history[this._historyIndex];
    this._applySnapshot(snap);
  }

  private _applySnapshot(snap: CircuitStateSnapshot) {
    this._state = {
      ...this._state,
      boardId:    snap.boardId,
      components: JSON.parse(JSON.stringify(snap.components)),
      wires:      JSON.parse(JSON.stringify(snap.wires)),
      code:       snap.code,
      selectedId: null,
      selectedWireId: null,
    };
    this._notify();
  }

  get boardId() { return this._state.boardId; }
  get components() { return this._state.components; }
  get wires() { return this._state.wires; }
  get selectedId() { return this._state.selectedId; }
  get selectedWireId() { return this._state.selectedWireId; }
  get simState() { return this._state.simState; }
  get serialOutput() { return this._state.serialOutput; }
  get code() { return this._state.code; }

  get selectedComponent(): PlacedComponent | null {
    return this._state.components.find(c => c.id === this._state.selectedId) ?? null;
  }

  get selectedWire(): PlacedWire | null {
    return this._state.wires.find(w => w.id === this._state.selectedWireId) ?? null;
  }

  get selectedPin(): SelectedPin | null { return this._state.selectedPin; }

  setBoard(boardId: string) {
    if (this._state.boardId === boardId) return;

    // 보드가 바뀌면 기존 와이어의 핀 참조가 새 보드와 호환되지 않을 수 있으므로
    // 보드 컴포넌트(type이 'board'로 시작)와 연결된 와이어를 모두 제거
    const boardCompIds = new Set(
      this._state.components
        .filter(c => c.type.startsWith('board'))
        .map(c => c.id)
    );
    const incompatibleWires = this._state.wires.filter(
      w => boardCompIds.has(w.fromCompId) || boardCompIds.has(w.toCompId)
    );

    if (incompatibleWires.length > 0) {
      // 호환되지 않는 와이어가 있으면 히스토리에 저장 후 제거
      this._pushHistory();
      this._state = {
        ...this._state,
        boardId,
        wires: this._state.wires.filter(
          w => !boardCompIds.has(w.fromCompId) && !boardCompIds.has(w.toCompId)
        ),
      };
    } else {
      this._state = { ...this._state, boardId };
    }

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
    this._state = { ...this._state, selectedId: id, selectedWireId: null };
    this._notify();
  }

  selectWire(id: string | null) {
    this._state = { ...this._state, selectedWireId: id, selectedId: null, selectedPin: null };
    this._notify();
  }

  selectPin(compId: string | null, pinName?: string) {
    const pin = compId && pinName ? { compId, pinName } : null;
    this._state = { ...this._state, selectedPin: pin, selectedId: null, selectedWireId: null };
    this._notify();
  }

  updateWire(id: string, patch: Partial<PlacedWire>) {
    this._pushHistory();
    this._state = {
      ...this._state,
      wires: this._state.wires.map(w => w.id === id ? { ...w, ...patch } : w),
    };
    this._notify();
  }

  addWire(wire: PlacedWire) {
    const exists = this._state.wires.some(
      w => (w.fromCompId === wire.fromCompId && w.fromPin === wire.fromPin &&
             w.toCompId   === wire.toCompId   && w.toPin   === wire.toPin) ||
           (w.fromCompId === wire.toCompId   && w.fromPin === wire.toPin &&
             w.toCompId   === wire.fromCompId && w.toPin   === wire.fromPin)
    );
    if (exists) return;
    this._pushHistory();
    this._state = { ...this._state, wires: [...this._state.wires, wire] };
    this._notify();
  }

  removeWire(id: string) {
    this._pushHistory();
    this._state = {
      ...this._state,
      wires: this._state.wires.filter(w => w.id !== id),
      selectedWireId: this._state.selectedWireId === id ? null : this._state.selectedWireId,
    };
    this._notify();
  }

  addComponent(comp: PlacedComponent) {
    this._pushHistory();
    this._state = {
      ...this._state,
      components: [...this._state.components, comp],
    };
    this._notify();
  }

  updateComponent(id: string, patch: Partial<PlacedComponent>) {
    // 위치 변경만이면 히스토리 저장 안 함 (드래그 중 매 프레임마다 저장 방지)
    const isPositionOnly = Object.keys(patch).every(k => k === 'x' || k === 'y');
    if (!isPositionOnly) this._pushHistory();
    this._state = {
      ...this._state,
      components: this._state.components.map(c =>
        c.id === id ? { ...c, ...patch } : c
      ),
    };
    this._notify();
  }

  /** 드래그 완료 시 호출 — 위치 변경을 히스토리에 기록 */
  commitMove(id: string, x: number, y: number) {
    this._pushHistory();
    this._state = {
      ...this._state,
      components: this._state.components.map(c =>
        c.id === id ? { ...c, x, y } : c
      ),
    };
    this._notify();
  }

  removeComponent(id: string) {
    this._pushHistory();
    this._state = {
      ...this._state,
      components: this._state.components.filter(c => c.id !== id),
      wires: this._state.wires.filter(w => w.fromCompId !== id && w.toCompId !== id),
      selectedId: this._state.selectedId === id ? null : this._state.selectedId,
    };
    this._notify();
  }

  clearCircuit() {
    this._pushHistory();
    this._state = {
      ...this._state,
      components: [],
      wires: [],
      selectedId: null,
      selectedWireId: null,
    };
    this._notify();
  }

  loadTemplate(template: {
    boardId: string;
    components: object[];
    code: string;
    wires?: PlacedWire[];
  }) {
    this._state = {
      ...this._state,
      boardId: template.boardId,
      components: (template.components as PlacedComponent[]).slice(),
      wires: template.wires?.slice() ?? [],
      code: template.code,
      selectedId: null,
      selectedWireId: null,
      serialOutput: '',
      simState: 'idle',
    };
    this._notify();
  }

  /**
   * 와이어로부터 도출된 연결 정보 반환
   * 반환: compId → { pinName → GPIO번호/특수값 }
   */
  getDerivedConnections(): Map<string, Record<string, number | string>> {
    const comps  = this._state.components;
    const wires  = this._state.wires;
    const result = new Map<string, Record<string, number | string>>();
    for (const c of comps) result.set(c.id, {});

    for (const wire of wires) {
      const fromIsBoard = comps.find(c => c.id === wire.fromCompId)?.type.startsWith('board') ?? false;
      const toIsBoard   = comps.find(c => c.id === wire.toCompId  )?.type.startsWith('board') ?? false;

      if (fromIsBoard && !toIsBoard) {
        const t = _resolveBoardPin(wire.fromPin);
        if (t !== null) result.get(wire.toCompId)![wire.toPin] = t;
      } else if (toIsBoard && !fromIsBoard) {
        const t = _resolveBoardPin(wire.toPin);
        if (t !== null) result.get(wire.fromCompId)![wire.fromPin] = t;
      } else if (!fromIsBoard && !toIsBoard) {
        const net = `net-${wire.id}`;
        result.get(wire.fromCompId)![wire.fromPin] = net;
        result.get(wire.toCompId  )![wire.toPin  ] = net;
      }
    }
    return result;
  }

  /**
   * 시뮬레이션 엔진에 전달할 스냅샷 생성
   * connections는 캔버스에 그린 와이어에서 자동으로 도출됨
   * (하드코딩된 comp.connections는 무시)
   */
  toSnapshot(): CircuitSnapshot {
    const derived = this.getDerivedConnections();
    return {
      boardType: this._state.boardId,
      components: this._state.components.map(c => ({
        id:   c.id,
        type: c.type,
        props: c.props,
        connections: derived.get(c.id) ?? {},
      } as ComponentSnapshot)),
    };
  }


  // ─── 회로 저장/불러오기 ────────────────────────────────────────

  /** 전체 회로 상태를 JSON 문자열로 직렬화 */
  saveToJson(): string {
    return JSON.stringify({
      version: 1,
      boardId: this._state.boardId,
      components: this._state.components,
      wires: this._state.wires,
      code: this._state.code,
    }, null, 2);
  }

  /** JSON 문자열에서 회로 복원 */
  loadFromJson(json: string) {
    const data = JSON.parse(json) as {
      version?: number;
      boardId: string;
      components: PlacedComponent[];
      wires: PlacedWire[];
      code: string;
    };
    this._pushHistory();
    this._state = {
      ...this._state,
      boardId:    data.boardId ?? this._state.boardId,
      components: data.components ?? [],
      wires:      data.wires ?? [],
      code:       data.code ?? this._state.code,
      selectedId: null,
      selectedWireId: null,
      serialOutput: '',
      simState: 'idle',
    };
    this._notify();
  }
}

/**
 * 보드 핀 이름 → 시뮬레이션 GPIO 번호 또는 특수 문자열
 * 예: 'D13' → 13, 'G8' → 8, 'A0' → 0(ADC), 'GND' → 'GND', '5V' → 'VCC'
 */
function _resolveBoardPin(pinName: string): number | string | null {
  if (/^GND$/i.test(pinName))                     return 'GND';
  if (/^5V$|^VIN$|^VCC$/i.test(pinName))          return 'VCC';
  if (/^3[Vv]3$|^3\.3[Vv]$/i.test(pinName))       return '3V3';
  // D0-D13 (Arduino Uno 디지털 핀)
  const d = pinName.match(/^D(\d+)(?:~)?$/);
  if (d) return parseInt(d[1], 10);
  // G0-G21 (ESP32-C3 GPIO)
  const g = pinName.match(/^G(\d+)$/);
  if (g) return parseInt(g[1], 10);
  // A0-A5 (Uno 아날로그 핀 → ADC 채널 번호)
  const a = pinName.match(/^A(\d+)(?:\/.*)?$/);
  if (a) return parseInt(a[1], 10);
  return null;
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
