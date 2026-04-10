import type { CircuitSnapshot, ComponentSnapshot } from '@sim/engine';
import { resolveBoardPin as _resolveBoardPinUtil } from '../../../sim-engine/src/runtime/pin-utils.js';

export interface PlacedComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  props: Record<string, unknown>;
  connections: Record<string, number | string>;
  element?: HTMLElement;
  // 보드 컴포넌트 전용 (일반 컴포넌트는 undefined)
  code?: string;
  simState?: SimState;
  serialOutput?: string;
}

/** 두 핀 사이의 와이어 */
export interface PlacedWire {
  id: string;
  fromCompId: string;
  fromPin: string;
  toCompId: string;
  toPin: string;
  color?: string;
  style?: 'bezier' | 'straight' | 'orthogonal';
  waypoints?: Array<{ x: number; y: number }>;
  label?: string;
  thickness?: 'thin' | 'normal' | 'thick';
}

/** 선택된 핀 노드 */
export interface SelectedPin {
  compId: string;
  pinName: string;
}

export type SimState = 'idle' | 'running' | 'error';

// ─── 보드 판별 헬퍼 ───────────────────────────────────────────────
const BOARD_COMP_TYPES = new Set([
  'board-uno', 'board-nano', 'board-esp32c3', 'board-esp32', 'board-mega',
]);

export function isBoard(compType: string): boolean {
  return BOARD_COMP_TYPES.has(compType);
}

/** 컴포넌트 타입 → 엔진용 boardType ID 매핑 */
export function boardTypeFromCompType(compType: string): string {
  const MAP: Record<string, string> = {
    'board-uno':     'arduino-uno',
    'board-nano':    'arduino-nano',
    'board-esp32c3': 'esp32-c3-supermini',
    'board-esp32':   'esp32-devkit',
    'board-mega':    'arduino-mega',
  };
  return MAP[compType] ?? compType;
}

/**
 * 회로 상태 저장소 (Reactive Signal 패턴)
 */
type CircuitStateSnapshot = {
  components: PlacedComponent[];
  wires: PlacedWire[];
};

export class CircuitStore {
  private _listeners = new Set<() => void>();
  private _state = {
    components:      [] as PlacedComponent[],
    wires:           [] as PlacedWire[],
    selectedId:      null as string | null,
    selectedIds:     new Set<string>(),
    selectedWireId:  null as string | null,
    selectedPin:     null as SelectedPin | null,
    selectedBoardId: null as string | null,   // 현재 에디터에서 보고 있는 보드의 compId
  };

  /** 클립보드 (메모리, 탭 간 공유 안 됨) */
  clipboardComp: PlacedComponent | null = null;

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

  private _pushHistory() {
    const snap: CircuitStateSnapshot = {
      components: JSON.parse(JSON.stringify(this._state.components)),
      wires:      JSON.parse(JSON.stringify(this._state.wires)),
    };
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push(snap);
    if (this._history.length > CircuitStore.MAX_HISTORY) {
      this._history.shift();
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
      components:     JSON.parse(JSON.stringify(snap.components)),
      wires:          JSON.parse(JSON.stringify(snap.wires)),
      selectedId:     null,
      selectedIds:    new Set(),
      selectedWireId: null,
    };
    // selectedBoardId 유효성 확인
    if (this._state.selectedBoardId) {
      const stillExists = this._state.components.some(c => c.id === this._state.selectedBoardId);
      if (!stillExists) {
        this._state.selectedBoardId = this._state.components.find(c => isBoard(c.type))?.id ?? null;
      }
    }
    this._notify();
  }

  // ─── 기본 접근자 ────────────────────────────────────────────────
  get components()     { return this._state.components; }
  get wires()          { return this._state.wires; }
  get selectedId()     { return this._state.selectedId; }
  get selectedIds(): ReadonlySet<string> { return this._state.selectedIds; }
  get selectedWireId() { return this._state.selectedWireId; }
  get selectedPin(): SelectedPin | null { return this._state.selectedPin; }
  get selectedBoardId(): string | null { return this._state.selectedBoardId; }

  get selectedComponent(): PlacedComponent | null {
    return this._state.components.find(c => c.id === this._state.selectedId) ?? null;
  }

  get selectedWire(): PlacedWire | null {
    return this._state.wires.find(w => w.id === this._state.selectedWireId) ?? null;
  }

  // ─── 보드별 접근자 ───────────────────────────────────────────────

  /** 현재 선택된 보드 컴포넌트 */
  get activeBoard(): PlacedComponent | null {
    if (!this._state.selectedBoardId) return null;
    return this._state.components.find(c => c.id === this._state.selectedBoardId) ?? null;
  }

  /** 현재 선택된 보드의 코드 (없으면 기본 코드) */
  get activeBoardCode(): string {
    return this.activeBoard?.code ?? DEFAULT_CODE;
  }

  /** 현재 선택된 보드의 simState */
  get activeBoardSimState(): SimState {
    return this.activeBoard?.simState ?? 'idle';
  }

  /** 현재 선택된 보드의 시리얼 출력 */
  get activeBoardSerial(): string {
    return this.activeBoard?.serialOutput ?? '';
  }

  /** 모든 보드 컴포넌트 목록 */
  get boards(): PlacedComponent[] {
    return this._state.components.filter(c => isBoard(c.type));
  }

  /** 실행 중인 보드 목록 */
  get runningBoards(): PlacedComponent[] {
    return this._state.components.filter(c => isBoard(c.type) && c.simState === 'running');
  }

  // ─── 보드 선택 ──────────────────────────────────────────────────

  selectBoard(compId: string | null) {
    this._state = { ...this._state, selectedBoardId: compId };
    this._notify();
  }

  // ─── 보드별 상태 업데이트 ──────────────────────────────────────

  setCodeForBoard(compId: string, code: string) {
    this._state = {
      ...this._state,
      components: this._state.components.map(c =>
        c.id === compId && isBoard(c.type) ? { ...c, code } : c
      ),
    };
    this._notify();
  }

  setSimStateForBoard(compId: string, state: SimState) {
    this._state = {
      ...this._state,
      components: this._state.components.map(c =>
        c.id === compId ? { ...c, simState: state } : c
      ),
    };
    this._notify();
  }

  appendSerialForBoard(compId: string, text: string) {
    this._state = {
      ...this._state,
      components: this._state.components.map(c => {
        if (c.id !== compId) return c;
        let serial = (c.serialOutput ?? '') + text;
        if (serial.length > 50000) serial = serial.slice(-40000);
        return { ...c, serialOutput: serial };
      }),
    };
    this._notify();
  }

  clearSerialForBoard(compId: string) {
    this._state = {
      ...this._state,
      components: this._state.components.map(c =>
        c.id === compId ? { ...c, serialOutput: '' } : c
      ),
    };
    this._notify();
  }

  // ─── 컴포넌트 조작 ──────────────────────────────────────────────

  selectComponent(id: string | null) {
    this._state = {
      ...this._state,
      selectedId:     id,
      selectedIds:    id ? new Set([id]) : new Set(),
      selectedWireId: null,
    };
    this._notify();
  }

  toggleSelectComponent(id: string) {
    const ids = new Set(this._state.selectedIds);
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    this._state = {
      ...this._state,
      selectedIds:    ids,
      selectedId:     id,
      selectedWireId: null,
    };
    this._notify();
  }

  removeSelectedComponents() {
    if (this._state.selectedIds.size === 0) return;
    this._pushHistory();
    const ids = this._state.selectedIds;
    // 삭제되는 보드가 selectedBoardId이면 다른 보드로 이동
    let newBoardId = this._state.selectedBoardId;
    if (newBoardId && ids.has(newBoardId)) {
      newBoardId = this._state.components.find(c => isBoard(c.type) && !ids.has(c.id))?.id ?? null;
    }
    this._state = {
      ...this._state,
      components:      this._state.components.filter(c => !ids.has(c.id)),
      wires:           this._state.wires.filter(w => !ids.has(w.fromCompId) && !ids.has(w.toCompId)),
      selectedId:      null,
      selectedIds:     new Set(),
      selectedBoardId: newBoardId,
    };
    this._notify();
  }

  pushMultiMoveHistory() {
    this._pushHistory();
  }

  moveSelectedComponents(dx: number, dy: number) {
    if (this._state.selectedIds.size <= 1) return;
    this._state = {
      ...this._state,
      components: this._state.components.map(c =>
        this._state.selectedIds.has(c.id)
          ? { ...c, x: Math.round((c.x + dx) / 8) * 8, y: Math.round((c.y + dy) / 8) * 8 }
          : c
      ),
    };
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
    if (wire.fromCompId === wire.toCompId && wire.fromPin === wire.toPin) return;
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
    // 보드 컴포넌트면 기본 필드 초기화
    let finalComp = comp;
    if (isBoard(comp.type)) {
      finalComp = {
        ...comp,
        code:         comp.code ?? DEFAULT_CODE,
        simState:     comp.simState ?? 'idle',
        serialOutput: comp.serialOutput ?? '',
      };
    }
    const newComponents = [...this._state.components, finalComp];
    // 최초 보드 추가 시 자동 선택
    let newBoardId = this._state.selectedBoardId;
    if (isBoard(comp.type) && !newBoardId) {
      newBoardId = finalComp.id;
    }
    this._state = {
      ...this._state,
      components:      newComponents,
      selectedBoardId: newBoardId,
    };
    this._notify();
    return finalComp;
  }

  updateComponent(id: string, patch: Partial<PlacedComponent>) {
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
    const comp = this._state.components.find(c => c.id === id);
    let newBoardId = this._state.selectedBoardId;
    if (comp && isBoard(comp.type) && newBoardId === id) {
      // 다른 보드로 포커스 이동
      newBoardId = this._state.components.find(c => isBoard(c.type) && c.id !== id)?.id ?? null;
    }
    this._state = {
      ...this._state,
      components:      this._state.components.filter(c => c.id !== id),
      wires:           this._state.wires.filter(w => w.fromCompId !== id && w.toCompId !== id),
      selectedId:      this._state.selectedId === id ? null : this._state.selectedId,
      selectedBoardId: newBoardId,
    };
    this._notify();
  }

  copyComponent(id: string) {
    const comp = this._state.components.find(c => c.id === id);
    if (comp) this.clipboardComp = JSON.parse(JSON.stringify(comp));
  }

  pasteComponent(canvasX: number, canvasY: number) {
    if (!this.clipboardComp) return;
    const newComp: PlacedComponent = {
      ...JSON.parse(JSON.stringify(this.clipboardComp)),
      id: `${this.clipboardComp.type}-${Date.now()}`,
      x: canvasX,
      y: canvasY,
      connections: {},
      // 보드 복사 시 시뮬 상태 초기화
      ...(isBoard(this.clipboardComp.type) ? { simState: 'idle' as SimState, serialOutput: '' } : {}),
    };
    this.addComponent(newComp);
    this.selectComponent(newComp.id);
  }

  selectAll() {
    const ids = new Set(this._state.components.map(c => c.id));
    const first = this._state.components[0];
    this._state = {
      ...this._state,
      selectedIds:    ids,
      selectedId:     first?.id ?? null,
      selectedWireId: null,
    };
    this._notify();
  }

  clearCircuit() {
    this._pushHistory();
    this._state = {
      ...this._state,
      components:      [],
      wires:           [],
      selectedId:      null,
      selectedIds:     new Set(),
      selectedWireId:  null,
      selectedBoardId: null,
    };
    this._notify();
  }

  loadTemplate(template: {
    boardId: string;
    components: object[];
    code: string;
    wires?: PlacedWire[];
  }) {
    const comps = (template.components as PlacedComponent[]).map(c => {
      if (isBoard(c.type)) {
        return {
          ...c,
          code:         template.code,
          simState:     'idle' as SimState,
          serialOutput: '',
        };
      }
      return c;
    });
    this._state = {
      ...this._state,
      components:      comps,
      wires:           template.wires?.slice() ?? [],
      selectedId:      null,
      selectedIds:     new Set(),
      selectedWireId:  null,
      selectedBoardId: comps.find(c => isBoard(c.type))?.id ?? null,
    };
    this._notify();
  }

  // ─── 연결 도출 ──────────────────────────────────────────────────

  /**
   * 와이어로부터 도출된 연결 정보 반환
   * compId → { pinName → GPIO번호/특수값 }
   */
  getDerivedConnections(): Map<string, Record<string, number | string>> {
    return this._buildDerivedConnections(this._state.components, this._state.wires);
  }

  private _buildDerivedConnections(
    comps: PlacedComponent[],
    wires: PlacedWire[],
  ): Map<string, Record<string, number | string>> {
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
   * BFS로 특정 컴포넌트(버튼/센서)가 연결된 보드 컴포넌트의 ID를 반환
   * 와이어 그래프를 탐색해 가장 가까운 보드를 찾는다.
   * 연결된 보드가 없으면 null 반환.
   */
  findParentBoardForComp(compId: string): string | null {
    const visited = new Set<string>([compId]);
    const queue = [compId];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (cur !== compId) {
        const curComp = this._state.components.find(c => c.id === cur);
        if (curComp && isBoard(curComp.type)) return cur;
      }
      for (const wire of this._state.wires) {
        if (wire.fromCompId === cur && !visited.has(wire.toCompId)) {
          visited.add(wire.toCompId);
          queue.push(wire.toCompId);
        }
        if (wire.toCompId === cur && !visited.has(wire.fromCompId)) {
          visited.add(wire.fromCompId);
          queue.push(wire.fromCompId);
        }
      }
    }
    return null;
  }

  /**
   * 특정 보드에 연결된 컴포넌트만으로 CircuitSnapshot 생성
   * BFS로 해당 보드에서 와이어를 통해 도달 가능한 모든 컴포넌트를 포함
   */
  toSnapshotForBoard(boardCompId: string): CircuitSnapshot | null {
    const boardComp = this._state.components.find(c => c.id === boardCompId);
    if (!boardComp || !isBoard(boardComp.type)) return null;

    // BFS: boardCompId에서 연결된 모든 컴포넌트 ID 수집
    const visited = new Set<string>([boardCompId]);
    const queue = [boardCompId];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const wire of this._state.wires) {
        if (wire.fromCompId === cur && !visited.has(wire.toCompId)) {
          visited.add(wire.toCompId);
          queue.push(wire.toCompId);
        }
        if (wire.toCompId === cur && !visited.has(wire.fromCompId)) {
          visited.add(wire.fromCompId);
          queue.push(wire.fromCompId);
        }
      }
    }

    const connectedComps = this._state.components.filter(c => visited.has(c.id));
    const connectedWires = this._state.wires.filter(
      w => visited.has(w.fromCompId) && visited.has(w.toCompId)
    );
    const derived = this._buildDerivedConnections(connectedComps, connectedWires);

    return {
      boardType: boardTypeFromCompType(boardComp.type),
      components: connectedComps
        .filter(c => !isBoard(c.type))
        .map(c => ({
          id:          c.id,
          type:        c.type,
          props:       c.props,
          connections: derived.get(c.id) ?? {},
        } as ComponentSnapshot)),
    };
  }

  // ─── 저장/불러오기 ──────────────────────────────────────────────

  saveToJson(): string {
    return JSON.stringify({
      version:    2,
      components: this._state.components,
      wires:      this._state.wires,
    }, null, 2);
  }

  loadFromJson(json: string) {
    const data = JSON.parse(json) as {
      version?: number;
      boardId?: string;
      components: PlacedComponent[];
      wires: PlacedWire[];
      code?: string;
    };

    if (!Array.isArray(data.components)) {
      console.warn('[CircuitStore] loadFromJson: components가 배열이 아닙니다.');
      data.components = [];
    }
    if (!Array.isArray(data.wires)) {
      console.warn('[CircuitStore] loadFromJson: wires가 배열이 아닙니다.');
      data.wires = [];
    }

    let comps: PlacedComponent[];

    if (!data.version || data.version === 1) {
      // 구버전 호환: 전역 code를 보드 컴포넌트에 이관
      comps = data.components.map(c => {
        if (isBoard(c.type)) {
          return { ...c, code: data.code ?? DEFAULT_CODE, simState: 'idle' as SimState, serialOutput: '' };
        }
        return c;
      });
    } else {
      // 버전 2
      comps = data.components.map(c => ({
        ...c,
        ...(isBoard(c.type) ? {
          simState:     'idle' as SimState,
          serialOutput: c.serialOutput ?? '',
          code:         c.code ?? DEFAULT_CODE,
        } : {}),
      }));
    }

    this._pushHistory();
    this._state = {
      ...this._state,
      components:      comps,
      wires:           data.wires,
      selectedId:      null,
      selectedIds:     new Set(),
      selectedWireId:  null,
      selectedBoardId: comps.find(c => isBoard(c.type))?.id ?? null,
    };
    this._notify();
  }
}

/**
 * 보드 핀 이름 → 시뮬레이션 GPIO 번호 또는 특수 문자열
 */
function _resolveBoardPin(pinName: string): number | string | null {
  if (/^GND$/i.test(pinName))              return 'GND';
  if (/^5V$|^VIN$|^VCC$/i.test(pinName))  return 'VCC';
  if (/^3[Vv]3$|^3\.3[Vv]$/i.test(pinName)) return '3V3';
  return _resolveBoardPinUtil(pinName);
}

const DEFAULT_CODE = `// Arduino 시뮬레이터
// 보드를 클릭하고 코드를 작성한 뒤 ▶ 업로드 버튼을 누르세요

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
