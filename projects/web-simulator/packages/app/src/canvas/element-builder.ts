// ─── 부품 엘리먼트 생성 및 이벤트 바인딩 ──────────────────────────────────────
import { circuitStore, isBoard, type PlacedComponent } from '../stores/circuit-store.js';
import { boardWorkerManager } from '../stores/board-worker-manager.js';
import { type CompDef } from '../stores/comp-def-cache.js';
import { type SimElementLike } from './sim-element-types.js';
import { type DraggingState, type WireDrawingState } from './canvas-interaction.js';

export interface BuildElementContext {
  getWireDrawing(): WireDrawingState;
  getDragging(): DraggingState;
  setDragging(s: DraggingState): void;
  showCompCtxMenu(compId: string, clientX: number, clientY: number): void;
}

/** 버튼/센서 이벤트를 올바른 보드 Worker로 라우팅하기 위한 헬퍼 */
function findParentBoardId(compId: string): string | null {
  return circuitStore.findParentBoardForComp(compId);
}

/**
 * 지정 tag로 Lit Custom Element를 생성하고 이벤트 리스너를 등록한다.
 */
export function buildElement(
  comp: PlacedComponent,
  tag: string,
  ctx: BuildElementContext,
): HTMLElement {
  const el = document.createElement(tag);
  el.style.cssText = `position:absolute;left:${comp.x}px;top:${comp.y}px;cursor:grab;user-select:none;`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [k, v] of Object.entries(comp.props)) (el as any)[k] = v;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (el as any)['compId'] = comp.id;

  let _interacting = false;
  el.addEventListener('sim-interaction-start', () => { _interacting = true; });
  el.addEventListener('sim-interaction-end',   () => { _interacting = false; });

  el.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    circuitStore.selectComponent(comp.id);
    ctx.showCompCtxMenu(comp.id, e.clientX, e.clientY);
  });

  el.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0 || ctx.getWireDrawing() || _interacting) return;
    e.stopPropagation();

    // Shift+클릭: 다중선택 토글
    if (e.shiftKey) {
      circuitStore.toggleSelectComponent(comp.id);
      return;
    }

    const alreadyInMultiSel =
      circuitStore.selectedIds.size > 1 && circuitStore.selectedIds.has(comp.id);

    if (!alreadyInMultiSel) {
      circuitStore.selectComponent(comp.id);
    }

    // 보드 컴포넌트 클릭 시 에디터 포커스 전환
    if (!e.shiftKey && !alreadyInMultiSel && isBoard(comp.type)) {
      circuitStore.selectBoard(comp.id);
    }

    const cur = circuitStore.components.find(c => c.id === comp.id);
    const ox = cur?.x ?? 0, oy = cur?.y ?? 0;
    ctx.setDragging({
      id: comp.id, startX: e.clientX, startY: e.clientY,
      ox, oy, liveX: ox, liveY: oy, moved: false,
    });
    el.style.cursor = 'grabbing';
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointerup', (e: PointerEvent) => {
    el.style.cursor = 'grab';
    el.releasePointerCapture(e.pointerId);
  });

  // ── 버튼 이벤트 — 연결된 보드 Worker로 라우팅
  if (comp.type === 'button') {
    const _sendButtonPinEvent = (value: number) => {
      const connMap = circuitStore.getDerivedConnections().get(comp.id);
      const boardId = findParentBoardId(comp.id);
      for (const pinName of ['PIN1A', 'PIN1B'] as const) {
        const gpioPin = connMap?.[pinName];
        if (typeof gpioPin === 'number' && boardId) {
          boardWorkerManager.sendPinEventToBoard(boardId, gpioPin, value);
        }
      }
      if (boardId) boardWorkerManager.sendSensorUpdateToBoard(boardId, comp.id, { value });
    };
    el.addEventListener('sim-press',   () => _sendButtonPinEvent(0));  // INPUT_PULLUP: 눌림=LOW
    el.addEventListener('sim-release', () => _sendButtonPinEvent(1));  // INPUT_PULLUP: 안눌림=HIGH
  }

  // ── 센서 값 변경 — 연결된 보드 Worker로 라우팅
  el.addEventListener('sim-change', (e: Event) => {
    const boardId = findParentBoardId(comp.id);
    if (boardId) boardWorkerManager.sendSensorUpdateToBoard(boardId, comp.id, (e as CustomEvent).detail);
  });

  // ── 보드 BOOT 버튼: GPIO 직접 주입
  el.addEventListener('sim-pin-press', (e: Event) => {
    const gpio = (e as CustomEvent).detail?.gpio;
    if (typeof gpio === 'number' && isBoard(comp.type)) {
      boardWorkerManager.sendPinEventToBoard(comp.id, gpio, 0);
    }
  });
  el.addEventListener('sim-pin-release', (e: Event) => {
    const gpio = (e as CustomEvent).detail?.gpio;
    if (typeof gpio === 'number' && isBoard(comp.type)) {
      boardWorkerManager.sendPinEventToBoard(comp.id, gpio, 1);
    }
  });

  // ── 보드 RST 버튼: 해당 보드만 재시작 (라이브 simState로 체크)
  el.addEventListener('sim-reset', () => {
    const liveComp = circuitStore.components.find(c => c.id === comp.id);
    if (isBoard(comp.type) && liveComp?.simState === 'running') {
      boardWorkerManager.stopBoard(comp.id);
      setTimeout(() => boardWorkerManager.startBoard(comp.id), 300);
    }
  });

  return el;
}

/** sim-generic 엘리먼트에 서버 정의(CompDef)를 적용한다 */
export function applyGenericDef(el: HTMLElement | SimElementLike, def: CompDef) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = el as any;
  g['svgTemplate'] = def.svgTemplate ?? '';
  g['pinDefs']     = def.pins.map(p => ({ name: p.name, x: p.x, y: p.y }));
  g['compWidth']   = def.width;
  g['compHeight']  = def.height;
  g['label']       = def.name;
}
