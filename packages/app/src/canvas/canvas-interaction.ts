// ─── 캔버스 인터랙션 ─────────────────────────────────────────────────────────
// 팬/줌/드래그 이벤트 처리, 트랜스폼 적용

import { circuitStore } from '../stores/circuit-store.js';

/** 컴포넌트 드래그 시 적용되는 그리드 스냅 크기 (px) */
export const CANVAS_GRID_SIZE = 8;

export type Transform = { x: number; y: number; scale: number };

export type DraggingState = {
  id: string;
  startX: number; startY: number;
  ox: number; oy: number;
  liveX: number; liveY: number;
  moved: boolean;
} | null;

export type WaypointDragState = {
  wireId: string;
  origWaypoints: Array<{ x: number; y: number }>;
  startX: number;
  startY: number;
} | null;

export type WireDrawingState = {
  fromCompId: string;
  fromPin: string;
  fromX: number;
  fromY: number;
} | null;

export interface CanvasInteractionCallbacks {
  getTransform(): Transform;
  setTransform(t: Transform): void;
  applyTransform(): void;
  getWireDrawing(): WireDrawingState;
  setWireDrawing(s: WireDrawingState): void;
  renderDrawingWire(mousePos: { x: number; y: number } | null): void;
  renderPinPoints(): void;
  getDragging(): DraggingState;
  setDragging(s: DraggingState): void;
  renderWiresLive(dragId: string, liveX: number, liveY: number): void;
  getWaypointDrag(): WaypointDragState;
  setWaypointDrag(s: WaypointDragState): void;
  getWireMidpoint(wireId: string): { x: number; y: number };
  getElementByCompId(id: string): HTMLElement | undefined;
  /** 빈 캔버스 배경 우클릭: clientX/Y는 화면 좌표, canvasX/Y는 캔버스 좌표 */
  showCanvasCtxMenu(clientX: number, clientY: number, canvasX: number, canvasY: number): void;
}

export function bindCanvasEvents(
  container: HTMLElement,
  layer: HTMLElement,
  wiresLayer: SVGGElement,
  drawLayer: SVGGElement,
  endpointLayer: SVGGElement,
  waypointLayer: SVGGElement,
  pinLayer: SVGGElement,
  cb: CanvasInteractionCallbacks,
) {
  // ─── 빈 배경 우클릭 ────────────────────────────────────────────────────────
  // 부품/와이어 우클릭은 각 요소에서 stopPropagation하므로 여기까지 올라오지 않음.
  // 즉 이 핸들러는 오직 빈 캔버스 영역 우클릭 시에만 실행된다.

  container.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const t = cb.getTransform();
    const rect = container.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left - t.x) / t.scale;
    const canvasY = (e.clientY - rect.top  - t.y) / t.scale;
    cb.showCanvasCtxMenu(e.clientX, e.clientY, canvasX, canvasY);
  });

  // ─── 줌 ────────────────────────────────────────────────────────────────────

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = container.getBoundingClientRect();
    _zoomAt(container, layer, wiresLayer, drawLayer, endpointLayer, waypointLayer, pinLayer, cb,
      e.clientX - rect.left, e.clientY - rect.top, factor);
  }, { passive: false });

  // ─── 포인터 다운 ───────────────────────────────────────────────────────────

  container.addEventListener('pointerdown', (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      const t = cb.getTransform();
      // _panStart 은 로컬 클로저에 저장
      _panStart = { x: e.clientX - t.x, y: e.clientY - t.y };
      _panning = true;
      container.style.cursor = 'grabbing';
    } else if (e.button === 0) {
      const t = e.target as Element;
      if (t === container || t === layer) {
        circuitStore.selectComponent(null);
        circuitStore.selectPin(null);
        if (cb.getWireDrawing()) {
          cb.setWireDrawing(null);
          cb.renderDrawingWire(null);
          container.style.cursor = 'default';
        }
      }
    }
  });

  // ─── 포인터 무브 ───────────────────────────────────────────────────────────

  container.addEventListener('pointermove', (e) => {
    const rect = container.getBoundingClientRect();
    const t = cb.getTransform();
    const svgX = (e.clientX - rect.left - t.x) / t.scale;
    const svgY = (e.clientY - rect.top  - t.y) / t.scale;
    _mousePos = { x: svgX, y: svgY };

    if (_panning) {
      cb.setTransform({ ...t, x: e.clientX - _panStart.x, y: e.clientY - _panStart.y });
      cb.applyTransform();
    }

    const dragging = cb.getDragging();
    if (dragging) {
      const d = dragging;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      // 6px 임계값: 버튼 클릭 등 사소한 움직임에는 드래그 시작 안 함
      if (!d.moved && Math.sqrt(dx * dx + dy * dy) < 6) return;
      const cur = cb.getTransform();
      d.liveX = Math.round((d.ox + dx / cur.scale) / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE;
      d.liveY = Math.round((d.oy + dy / cur.scale) / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE;
      d.moved = true;
      cb.setDragging(d);
      const el = cb.getElementByCompId(d.id);
      if (el) { el.style.left = `${d.liveX}px`; el.style.top = `${d.liveY}px`; }
      cb.renderWiresLive(d.id, d.liveX, d.liveY);
    }

    const waypointDrag = cb.getWaypointDrag();
    if (waypointDrag) {
      const wd = waypointDrag;
      const cur = cb.getTransform();
      const dx = (e.clientX - wd.startX) / cur.scale;
      const dy = (e.clientY - wd.startY) / cur.scale;
      const base = wd.origWaypoints[0] ?? cb.getWireMidpoint(wd.wireId);
      circuitStore.updateWire(wd.wireId, {
        waypoints: [{ x: base.x + dx, y: base.y + dy }],
      });
    }

    if (cb.getWireDrawing()) cb.renderDrawingWire({ x: svgX, y: svgY });
  });

  // ─── 포인터 업 ─────────────────────────────────────────────────────────────

  container.addEventListener('pointerup', () => {
    if (_panning) {
      _panning = false;
      container.style.cursor = cb.getWireDrawing() ? 'crosshair' : 'default';
    }
    const dragging = cb.getDragging();
    if (dragging) {
      cb.setDragging(null);
      if (dragging.moved) circuitStore.commitMove(dragging.id, dragging.liveX, dragging.liveY);
    }
    if (cb.getWaypointDrag()) {
      cb.setWaypointDrag(null);
    }
  });

  // ─── 키보드 ────────────────────────────────────────────────────────────────

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cb.getWireDrawing()) {
      cb.setWireDrawing(null);
      cb.renderDrawingWire(null);
      container.style.cursor = 'default';
      return;
    }
    // Ctrl+D: 선택된 부품 복제
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      const selId = circuitStore.selectedId;
      if (selId) {
        const cur = circuitStore.components.find(c => c.id === selId);
        if (cur) {
          const newId = `${cur.type}-${Date.now()}`;
          circuitStore.addComponent({
            ...cur,
            id: newId,
            x: cur.x + 24,
            y: cur.y + 24,
            connections: {},
          });
          circuitStore.selectComponent(newId);
        }
      }
    }
  });
}

// ─── 트랜스폼 적용 ──────────────────────────────────────────────────────────

export function applyTransform(
  layer: HTMLElement,
  wiresLayer: SVGGElement,
  drawLayer: SVGGElement,
  endpointLayer: SVGGElement,
  waypointLayer: SVGGElement,
  pinLayer: SVGGElement,
  transform: Transform,
) {
  const { x, y, scale } = transform;
  layer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  const tx = `translate(${x} ${y}) scale(${scale})`;
  wiresLayer.setAttribute('transform', tx);
  drawLayer.setAttribute('transform', tx);
  endpointLayer.setAttribute('transform', tx);
  waypointLayer.setAttribute('transform', tx);
  pinLayer.setAttribute('transform', tx);
  // 상태 표시줄 줌 업데이트
  const zoomEl = document.getElementById('canvas-zoom');
  if (zoomEl) zoomEl.textContent = `${Math.round(scale * 100)}%`;
}

// ─── 줌 ─────────────────────────────────────────────────────────────────────

export function zoomAt(
  container: HTMLElement,
  layer: HTMLElement,
  wiresLayer: SVGGElement,
  drawLayer: SVGGElement,
  endpointLayer: SVGGElement,
  waypointLayer: SVGGElement,
  pinLayer: SVGGElement,
  cb: Pick<CanvasInteractionCallbacks, 'getTransform' | 'setTransform' | 'applyTransform'>,
  cx: number,
  cy: number,
  factor: number,
) {
  _zoomAt(container, layer, wiresLayer, drawLayer, endpointLayer, waypointLayer, pinLayer, cb, cx, cy, factor);
}

// ─── 모듈 프라이빗 상태 (팬 상태는 이벤트 핸들러 클로저 내에서 관리) ─────────

let _panning = false;
let _panStart = { x: 0, y: 0 };
let _mousePos = { x: 0, y: 0 };

function _zoomAt(
  _container: HTMLElement,
  _layer: HTMLElement,
  _wiresLayer: SVGGElement,
  _drawLayer: SVGGElement,
  _endpointLayer: SVGGElement,
  _waypointLayer: SVGGElement,
  _pinLayer: SVGGElement,
  cb: Pick<CanvasInteractionCallbacks, 'getTransform' | 'setTransform' | 'applyTransform'>,
  cx: number,
  cy: number,
  factor: number,
) {
  const t = cb.getTransform();
  const ns = Math.max(0.2, Math.min(3, t.scale * factor));
  const sr = ns / t.scale;
  cb.setTransform({
    x: cx - sr * (cx - t.x),
    y: cy - sr * (cy - t.y),
    scale: ns,
  });
  cb.applyTransform();
}
