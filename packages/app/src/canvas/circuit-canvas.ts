// ─── CircuitCanvas (파사드) ────────────────────────────────────────────────────
// 각 모듈을 조합해 캔버스 전체를 관리한다.
// 세부 로직은 wire-renderer / pin-renderer / canvas-interaction / context-menus 참고.

import { circuitStore, type PlacedComponent } from '../stores/circuit-store.js';
import { simController } from '../stores/sim-controller.js'; // onPinState / onComponentUpdate 콜백 등록용
import { fetchCompDef, getCachedCompDef } from '../stores/comp-def-cache.js';

import { type SimElementLike } from './sim-element-types.js';
import { CompContextMenu, WireContextMenu } from './context-menus.js';
import { WireRenderer } from './wire-renderer.js';
import { PinRenderer, getPinAbsPos, getPinPosWithBase } from './pin-renderer.js';
import { buildElement, applyGenericDef } from './element-builder.js';
import {
  type Transform,
  type DraggingState,
  type WaypointDragState,
  type WireDrawingState,
  bindCanvasEvents,
  applyTransform,
  zoomAt,
} from './canvas-interaction.js';

export class CircuitCanvas {
  private _container: HTMLElement;

  // SVG 레이어 (z=1) — 와이어 경로 + rubber-band
  private _svg!: SVGSVGElement;
  private _wiresLayer!: SVGGElement;
  private _drawLayer!: SVGGElement;

  // Lit 컴포넌트 레이어 (z=2)
  private _layer!: HTMLElement;

  // Top SVG (z=3) — 끝점 도트, 경유점 핸들, 핀 서클
  private _topSvg!: SVGSVGElement;
  private _endpointLayer!: SVGGElement;
  private _waypointLayer!: SVGGElement;
  private _pinLayer!: SVGGElement;

  // 공유 상태
  private _transform: Transform = { x: 0, y: 0, scale: 1 };
  private _dragging: DraggingState = null;
  private _waypointDrag: WaypointDragState = null;
  private _wireDrawing: WireDrawingState = null;
  private _mousePos = { x: 0, y: 0 };

  // 부품 엘리먼트 맵 (타입 안전)
  private _elements = new Map<string, SimElementLike>();

  // 컨텍스트 메뉴
  private _ctxMenu = new WireContextMenu();
  private _compCtxMenu = new CompContextMenu();

  // 서브 렌더러
  private _wireRenderer!: WireRenderer;
  private _pinRenderer!: PinRenderer;

  constructor(container: HTMLElement) {
    this._container = container;
    this._buildDOM();
    this._initRenderers();
    this._bindEvents();
    circuitStore.subscribe(() => this._render());
    this._render();

    simController.onPinState = (pin, value) => this._updatePinVisual(pin, value);
    simController.onComponentUpdate = (id, pin, value) => {
      const el = this._elements.get(id);
      if (el) el.setPinState(pin, value);
    };
  }

  // ─── DOM 구성 ─────────────────────────────────────────────────────────────

  private _buildDOM() {
    const hint = this._container.querySelector('#canvas-hint') as HTMLElement | null;

    // z=1: 와이어 SVG (pointer-events:none)
    this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this._svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;pointer-events:none;';

    this._wiresLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._wiresLayer.style.pointerEvents = 'all';
    this._drawLayer  = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._drawLayer.style.pointerEvents = 'none';
    this._svg.appendChild(this._wiresLayer);
    this._svg.appendChild(this._drawLayer);
    this._container.appendChild(this._svg);

    // z=2: Lit 컴포넌트
    this._layer = document.createElement('div');
    this._layer.style.cssText = 'position:absolute;top:0;left:0;transform-origin:0 0;z-index:1;';
    this._container.appendChild(this._layer);

    // z=3: 끝점 도트 / 경유점 핸들 / 핀 서클
    this._topSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this._topSvg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:4;pointer-events:none;';

    this._endpointLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._endpointLayer.style.pointerEvents = 'none';
    this._waypointLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._waypointLayer.style.pointerEvents = 'all';
    this._pinLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._pinLayer.style.pointerEvents = 'all';

    this._topSvg.appendChild(this._endpointLayer);
    this._topSvg.appendChild(this._waypointLayer);
    this._topSvg.appendChild(this._pinLayer);
    this._container.appendChild(this._topSvg);

    if (hint) this._container.appendChild(hint);
  }

  // ─── 렌더러 초기화 ────────────────────────────────────────────────────────

  private _initRenderers() {
    this._wireRenderer = new WireRenderer(
      this._wiresLayer,
      this._endpointLayer,
      this._drawLayer,
      (wireId, clientX, clientY) => this._ctxMenu.show(wireId, clientX, clientY),
      (compId, pinName) => getPinAbsPos(this._elements, compId, pinName),
      (compId, pinName, base) => getPinPosWithBase(this._elements, compId, pinName, base),
    );

    this._pinRenderer = new PinRenderer(
      this._pinLayer,
      this._elements,
      (compId, pinName, ax, ay) => this._handlePinClick(compId, pinName, ax, ay),
    );
  }

  // ─── 이벤트 바인딩 ────────────────────────────────────────────────────────

  private _bindEvents() {
    bindCanvasEvents(
      this._container,
      this._layer,
      this._wiresLayer,
      this._drawLayer,
      this._endpointLayer,
      this._waypointLayer,
      this._pinLayer,
      {
        getTransform:    () => this._transform,
        setTransform:    (t) => { this._transform = t; },
        applyTransform:  () => this._applyTransform(),
        getWireDrawing:  () => this._wireDrawing,
        setWireDrawing:  (s) => { this._wireDrawing = s; },
        renderDrawingWire: (mousePos) => this._renderDrawingWire(mousePos),
        renderPinPoints: () => this._renderPinPoints(),
        getDragging:     () => this._dragging,
        setDragging:     (s) => { this._dragging = s; },
        renderWiresLive: (id, x, y) => this._wireRenderer.renderWiresLive(id, x, y),
        getWaypointDrag: () => this._waypointDrag,
        setWaypointDrag: (s) => { this._waypointDrag = s; },
        getWireMidpoint: (wireId) => this._wireRenderer.getWireMidpoint(wireId),
        getElementByCompId: (id) => this._elements.get(id),
      },
    );
  }

  // ─── 트랜스폼 적용 ────────────────────────────────────────────────────────

  private _applyTransform() {
    applyTransform(
      this._layer,
      this._wiresLayer,
      this._drawLayer,
      this._endpointLayer,
      this._waypointLayer,
      this._pinLayer,
      this._transform,
    );
  }

  // ─── 줌 헬퍼 ─────────────────────────────────────────────────────────────

  private _zoomAt(cx: number, cy: number, factor: number) {
    zoomAt(
      this._container,
      this._layer,
      this._wiresLayer,
      this._drawLayer,
      this._endpointLayer,
      this._waypointLayer,
      this._pinLayer,
      {
        getTransform:   () => this._transform,
        setTransform:   (t) => { this._transform = t; },
        applyTransform: () => this._applyTransform(),
      },
      cx, cy, factor,
    );
  }

  // ─── 메인 렌더 ────────────────────────────────────────────────────────────

  private _render() {
    const comps      = circuitStore.components;
    const selectedId = circuitStore.selectedId;

    const hint = document.getElementById('canvas-hint');
    if (hint) hint.style.display = comps.length > 0 ? 'none' : '';

    for (const [id, el] of this._elements) {
      if (!comps.find(c => c.id === id)) { el.remove(); this._elements.delete(id); }
    }
    for (const comp of comps) {
      if (!this._elements.has(comp.id)) this._createElement(comp);
      const el = this._elements.get(comp.id);
      if (!el) continue;
      // props를 Lit 엘리먼트에 동기화 (LED 색상 변경 등)
      for (const [k, v] of Object.entries(comp.props)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((el as any)[k] !== v) (el as any)[k] = v;
      }
      el.style.left      = `${comp.x}px`;
      el.style.top       = `${comp.y}px`;
      el.style.transform = `rotate(${comp.rotation ?? 0}deg)`;
      el.classList.toggle('selected', comp.id === selectedId);
    }

    this._wireRenderer.renderWires();
    this._wireRenderer.renderEndpointDots();
    this._wireRenderer.renderWaypointHandles(
      this._waypointLayer,
      (wireId, origWaypoints, startX, startY) => {
        this._waypointDrag = { wireId, origWaypoints, startX, startY };
      },
    );
    this._renderPinPoints();
  }

  private _createElement(comp: PlacedComponent) {
    const cachedDef = getCachedCompDef(comp.type);
    const tag = cachedDef?.element ?? 'sim-generic';

    const el = this._makeElement(comp, tag);
    if (tag === 'sim-generic' && cachedDef) applyGenericDef(el, cachedDef);

    this._layer.appendChild(el);
    this._elements.set(comp.id, el as unknown as SimElementLike);

    // 비동기로 서버 정의 로드 — 완료 시 실제 태그로 교체 또는 svgTemplate 적용
    fetchCompDef(comp.type).then(def => {
      if (!def) return;
      const existing = this._elements.get(comp.id);
      if (!existing) return;

      const existingTag = existing.tagName.toLowerCase();
      const targetTag   = def.element ?? 'sim-generic';

      if (existingTag === targetTag) {
        if (existingTag === 'sim-generic') applyGenericDef(existing, def);
      } else {
        const newEl = this._makeElement(comp, targetTag);
        if (targetTag === 'sim-generic') applyGenericDef(newEl, def);
        existing.replaceWith(newEl);
        this._elements.set(comp.id, newEl as unknown as SimElementLike);
      }

      this._wireRenderer.renderWires();
      this._wireRenderer.renderEndpointDots();
      this._renderPinPoints();
    });
  }

  /** element-builder에 컨텍스트를 주입해 Lit Custom Element를 생성한다 */
  private _makeElement(comp: PlacedComponent, tag: string): HTMLElement {
    return buildElement(comp, tag, {
      getWireDrawing:   () => this._wireDrawing,
      getDragging:      () => this._dragging,
      setDragging:      (s) => { this._dragging = s; },
      showCompCtxMenu:  (id, cx, cy) => this._compCtxMenu.show(id, cx, cy),
    });
  }

  // ─── 핀 렌더 (위임) ───────────────────────────────────────────────────────

  private _renderPinPoints() {
    this._pinRenderer.renderPinPoints(this._wireDrawing);
  }

  // ─── 와이어 드로잉 (미리보기) 렌더 ───────────────────────────────────────

  private _renderDrawingWire(mousePos: { x: number; y: number } | null) {
    this._wireRenderer.renderDrawingWire(this._wireDrawing, mousePos);
  }

  // ─── 와이어 드로잉 로직 ───────────────────────────────────────────────────

  private async _handlePinClick(compId: string, pinName: string, ax: number, ay: number) {
    if (!this._wireDrawing) {
      this._wireDrawing = { fromCompId: compId, fromPin: pinName, fromX: ax, fromY: ay };
      this._container.style.cursor = 'crosshair';
      this._renderPinPoints();
      return;
    }
    if (this._wireDrawing.fromCompId === compId && this._wireDrawing.fromPin === pinName) {
      this._wireDrawing = null;
      this._renderDrawingWire(null);
      this._container.style.cursor = 'default';
      this._renderPinPoints();
      return;
    }
    const from = this._wireDrawing;
    await this._validateAndWarnConnection(from.fromCompId, from.fromPin, compId, pinName);
    const wireColor = await this._resolveWireColor(from.fromPin);
    circuitStore.addWire({
      id: `wire-${Date.now()}`,
      fromCompId: from.fromCompId, fromPin: from.fromPin,
      toCompId:   compId,          toPin:   pinName,
      color: wireColor,
    });
    this._wireDrawing = null;
    this._renderDrawingWire(null);
    this._container.style.cursor = 'default';
  }

  private async _validateAndWarnConnection(fromCompId: string, fromPin: string, toCompId: string, toPin: string) {
    try {
      const fromComp = circuitStore.components.find(c => c.id === fromCompId);
      const toComp   = circuitStore.components.find(c => c.id === toCompId);
      if (!fromComp || !toComp) return;
      const [fromDef, toDef] = await Promise.all([
        fetchCompDef(fromComp.type), fetchCompDef(toComp.type),
      ]);
      if (!fromDef || !toDef) return;
      const fromPinDef = fromDef.pins.find(p => p.name === fromPin);
      const toPinDef   = toDef.pins.find(p => p.name === toPin);
      if (!fromPinDef || !toPinDef) return;
      const r = await fetch(`/api/components/connections/validate?from=${encodeURIComponent(fromPinDef.type)}&to=${encodeURIComponent(toPinDef.type)}`);
      if (!r.ok) return;
      const result = await r.json() as { valid: boolean; severity?: string; message?: string };
      if (!result.valid) {
        this._showToast(
          result.severity === 'error' ? '⛔' : '⚠️',
          result.message ?? '호환되지 않는 핀 연결',
          result.severity === 'error' ? '#4a1a1a' : '#4a2a0a',
          result.severity === 'error' ? '#f66' : '#fa8',
        );
      }
    } catch { /* ignore */ }
  }

  private async _resolveWireColor(pinName: string): Promise<string | undefined> {
    try {
      const r = await fetch(`/api/components/wires/auto?pin=${encodeURIComponent(pinName)}`);
      if (!r.ok) return undefined;
      return ((await r.json()) as { color: string }).color;
    } catch { return undefined; }
  }

  // ─── 시뮬레이션 핀 시각 업데이트 ──────────────────────────────────────────

  private _updatePinVisual(pin: number, value: number) {
    const derived = circuitStore.getDerivedConnections();
    for (const [compId, connMap] of derived) {
      for (const [pinName, target] of Object.entries(connMap)) {
        if (target === pin) {
          const el = this._elements.get(compId);
          if (el) el.setPinState(pinName, value);
        }
      }
    }
  }

  // ─── 토스트 알림 ──────────────────────────────────────────────────────────

  private _showToast(icon: string, msg: string, bg: string, color: string) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed; bottom:70px; left:50%; transform:translateX(-50%);
      background:${bg}; border:1px solid ${color}; color:${color};
      padding:7px 16px; border-radius:6px; font-size:12px; z-index:9999;
      pointer-events:none; white-space:nowrap; box-shadow:0 2px 10px rgba(0,0,0,0.4);
    `;
    toast.textContent = `${icon} ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  // ─── 공개 API ─────────────────────────────────────────────────────────────

  fitView() {
    const comps = circuitStore.components;
    if (comps.length === 0) {
      this._transform = { x: 0, y: 0, scale: 1 };
      this._applyTransform();
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of comps) {
      const el = this._elements.get(c.id);
      const w = el ? (el.offsetWidth  || 80) : 80;
      const h = el ? (el.offsetHeight || 80) : 80;
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + w);
      maxY = Math.max(maxY, c.y + h);
    }
    const padding = 40;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const containerW = this._container.clientWidth;
    const containerH = this._container.clientHeight;
    const scale = Math.min(containerW / contentW, containerH / contentH, 1.5);
    this._transform.scale = scale;
    this._transform.x = (containerW - contentW * scale) / 2 - (minX - padding) * scale;
    this._transform.y = (containerH - contentH * scale) / 2 - (minY - padding) * scale;
    this._applyTransform();
  }

  zoomIn()  { this._zoomAt(this._container.clientWidth / 2, this._container.clientHeight / 2, 1.2); }
  zoomOut() { this._zoomAt(this._container.clientWidth / 2, this._container.clientHeight / 2, 0.8); }

  /** 현재 줌 레벨 */
  get scale() { return this._transform.scale; }

  /** 캔버스 뷰포트 중앙의 캔버스 좌표 */
  get viewCenterX(): number {
    return (this._container.clientWidth  / 2 - this._transform.x) / this._transform.scale;
  }
  get viewCenterY(): number {
    return (this._container.clientHeight / 2 - this._transform.y) / this._transform.scale;
  }

  /** 클라이언트 좌표(픽셀) → 캔버스 좌표 */
  clientToCanvas(cx: number, cy: number): { x: number; y: number } {
    return {
      x: (cx - this._transform.x) / this._transform.scale,
      y: (cy - this._transform.y) / this._transform.scale,
    };
  }
}
