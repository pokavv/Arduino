import { circuitStore, type PlacedComponent, type PlacedWire } from '../stores/circuit-store.js';
import { simController } from '../stores/sim-controller.js';
import { type CompDef, fetchCompDef, getCachedCompDef } from '../stores/comp-def-cache.js';

// ─── 와이어 경로 계산 (module-level) ─────────────────────────────────────────

function buildWirePath(
  from: { x: number; y: number },
  to:   { x: number; y: number },
  style: PlacedWire['style'] = 'bezier',
  waypoints: NonNullable<PlacedWire['waypoints']> = [],
): string {
  switch (style) {
    case 'straight': {
      if (waypoints.length) {
        const pts = [from, ...waypoints, to];
        return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      }
      return `M${from.x},${from.y} L${to.x},${to.y}`;
    }
    case 'orthogonal': {
      // 3-세그먼트 직각 라우팅: H midX V y2 H x2
      const midX = waypoints[0]?.x ?? (from.x + to.x) / 2;
      return `M${from.x},${from.y} H${midX} V${to.y} H${to.x}`;
    }
    default: { // bezier
      if (waypoints.length >= 1) {
        const wp = waypoints[0];
        // B(0.5) = 0.25*from + 0.5*P1 + 0.25*to = wp → P1 = 2wp − 0.5(from+to)
        // 경유점을 곡선이 실제로 통과하도록 제어점 역산
        const cx = 2 * wp.x - 0.5 * (from.x + to.x);
        const cy = 2 * wp.y - 0.5 * (from.y + to.y);
        return `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`;
      }
      const dx = to.x - from.x;
      return `M${from.x},${from.y} C${from.x + dx * 0.4},${from.y} ${to.x - dx * 0.4},${to.y} ${to.x},${to.y}`;
    }
  }
}

// ─── 컴포넌트 컨텍스트 메뉴 ──────────────────────────────────────────────────

class CompContextMenu {
  private _el: HTMLDivElement;
  private _currentCompId: string | null = null;

  constructor() {
    this._el = document.createElement('div');
    this._el.id = 'comp-ctx-menu';
    this._el.className = 'ctx-menu';
    this._el.style.display = 'none';
    document.body.appendChild(this._el);

    document.addEventListener('click', () => this.hide());
    document.addEventListener('contextmenu', (e) => {
      if (e.target !== this._el && !this._el.contains(e.target as Node)) this.hide();
    });
  }

  show(compId: string, clientX: number, clientY: number) {
    this._currentCompId = compId;
    const comp = circuitStore.components.find(c => c.id === compId);
    if (!comp) return;

    this._el.innerHTML = `
      <div class="ctx-title">부품 조작</div>
      <div class="ctx-item" data-action="rotate">↻ 90° 회전</div>
      <div class="ctx-item" data-action="duplicate">⧉ 복제</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item danger" data-action="delete">🗑 삭제</div>
    `;

    this._el.querySelector('[data-action="rotate"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this._currentCompId) {
        const cur = circuitStore.components.find(c => c.id === this._currentCompId);
        if (cur) circuitStore.updateComponent(this._currentCompId, { rotation: ((cur.rotation ?? 0) + 90) % 360 });
      }
      this.hide();
    });
    this._el.querySelector('[data-action="duplicate"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this._currentCompId) {
        const cur = circuitStore.components.find(c => c.id === this._currentCompId);
        if (cur) {
          circuitStore.addComponent({
            ...cur,
            id: `${cur.type}-${Date.now()}`,
            x: cur.x + 40,
            y: cur.y + 40,
            connections: {},
          });
        }
      }
      this.hide();
    });
    this._el.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this._currentCompId) circuitStore.removeComponent(this._currentCompId);
      this.hide();
    });

    this._el.style.display = 'block';
    const rect = this._el.getBoundingClientRect();
    const x = Math.min(clientX, window.innerWidth  - rect.width  - 8);
    const y = Math.min(clientY, window.innerHeight - rect.height - 8);
    this._el.style.left = `${x}px`;
    this._el.style.top  = `${y}px`;
  }

  hide() {
    this._el.style.display = 'none';
    this._currentCompId = null;
  }
}

// ─── 와이어 컨텍스트 메뉴 ────────────────────────────────────────────────────

class WireContextMenu {
  private _el: HTMLDivElement;
  private _currentWireId: string | null = null;

  constructor() {
    this._el = document.createElement('div');
    this._el.id = 'wire-ctx-menu';
    this._el.className = 'ctx-menu';
    this._el.style.display = 'none';
    document.body.appendChild(this._el);

    document.addEventListener('click', () => this.hide());
    document.addEventListener('contextmenu', (e) => {
      if (e.target !== this._el && !this._el.contains(e.target as Node)) this.hide();
    });
  }

  show(wireId: string, clientX: number, clientY: number) {
    this._currentWireId = wireId;
    const wire = circuitStore.wires.find(w => w.id === wireId);
    const cur = wire?.style ?? 'bezier';

    this._el.innerHTML = `
      <div class="ctx-title">라우팅 스타일</div>
      ${[
        { s: 'bezier',      icon: '〜', label: '곡선 (Bezier)' },
        { s: 'straight',    icon: '╱', label: '직선' },
        { s: 'orthogonal',  icon: '┐', label: '직각' },
      ].map(({ s, icon, label }) => `
        <div class="ctx-item${cur === s ? ' active' : ''}" data-style="${s}">
          <span>${icon}</span>${label}${cur === s ? ' ●' : ''}
        </div>
      `).join('')}
      <div class="ctx-sep"></div>
      <div class="ctx-item danger" data-action="delete">🗑 삭제</div>
    `;

    // 이벤트
    this._el.querySelectorAll('[data-style]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const style = (el as HTMLElement).dataset.style as PlacedWire['style'];
        if (this._currentWireId) {
          circuitStore.updateWire(this._currentWireId, { style, waypoints: [] });
        }
        this.hide();
      });
    });
    this._el.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this._currentWireId) circuitStore.removeWire(this._currentWireId);
      this.hide();
    });

    // 화면 밖으로 나가지 않게 위치 조정
    this._el.style.display = 'block';
    const rect = this._el.getBoundingClientRect();
    const x = Math.min(clientX, window.innerWidth  - rect.width  - 8);
    const y = Math.min(clientY, window.innerHeight - rect.height - 8);
    this._el.style.left = `${x}px`;
    this._el.style.top  = `${y}px`;
  }

  hide() {
    this._el.style.display = 'none';
    this._currentWireId = null;
  }
}

// ─── CircuitCanvas ────────────────────────────────────────────────────────────

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
  private _endpointLayer!: SVGGElement;  // 와이어 끝점 도트
  private _waypointLayer!: SVGGElement;  // bezier/straight 경유점 핸들
  private _pinLayer!: SVGGElement;       // 핀 연결 포인트

  private _transform = { x: 0, y: 0, scale: 1 };
  private _panning   = false;
  private _panStart  = { x: 0, y: 0 };
  private _dragging: {
    id: string; startX: number; startY: number;
    ox: number; oy: number; liveX: number; liveY: number; moved: boolean;
  } | null = null;

  private _wireDrawing: {
    fromCompId: string; fromPin: string; fromX: number; fromY: number;
  } | null = null;

  private _waypointDrag: {
    wireId: string; origWaypoints: Array<{ x: number; y: number }>;
    startX: number; startY: number;
  } | null = null;

  private _mousePos = { x: 0, y: 0 };
  private _elements = new Map<string, HTMLElement>();
  private _ctxMenu = new WireContextMenu();
  private _compCtxMenu = new CompContextMenu();

  constructor(container: HTMLElement) {
    this._container = container;
    this._buildDOM();
    this._bindEvents();
    circuitStore.subscribe(() => this._render());
    this._render();

    simController.onPinState = (pin, value) => this._updatePinVisual(pin, value);
    simController.onComponentUpdate = (id, pin, value) => {
      const el = this._elements.get(id);
      if (el && 'setPinState' in el) (el as any).setPinState(pin, value);
    };
  }

  // ─── DOM 구성 ─────────────────────────────────────────────────────────────

  private _buildDOM() {
    const hint = this._container.querySelector('#canvas-hint') as HTMLElement | null;

    // z=1: 와이어 SVG (pointer-events:none — 히트 영역은 각 요소에서 직접 설정)
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

    // z=3: 끝점 도트 / 경유점 핸들 / 핀 서클 (보드 위에 표시)
    this._topSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this._topSvg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:4;pointer-events:none;';

    this._endpointLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._endpointLayer.style.pointerEvents = 'none';
    this._waypointLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._waypointLayer.style.pointerEvents = 'all';
    this._pinLayer      = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._pinLayer.style.pointerEvents = 'all';

    this._topSvg.appendChild(this._endpointLayer);
    this._topSvg.appendChild(this._waypointLayer);
    this._topSvg.appendChild(this._pinLayer);
    this._container.appendChild(this._topSvg);

    if (hint) this._container.appendChild(hint);
  }

  // ─── 이벤트 바인딩 ────────────────────────────────────────────────────────

  private _bindEvents() {
    this._container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const rect = this._container.getBoundingClientRect();
      this._zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
    }, { passive: false });

    this._container.addEventListener('pointerdown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        this._panning = true;
        this._panStart = { x: e.clientX - this._transform.x, y: e.clientY - this._transform.y };
        this._container.style.cursor = 'grabbing';
      } else if (e.button === 0) {
        const t = e.target as Element;
        if (t === this._container || t === this._layer) {
          circuitStore.selectComponent(null);
          circuitStore.selectPin(null);
          if (this._wireDrawing) {
            this._wireDrawing = null;
            this._renderDrawingWire(null);
            this._container.style.cursor = 'default';
          }
        }
      }
    });

    this._container.addEventListener('pointermove', (e) => {
      const rect = this._container.getBoundingClientRect();
      const svgX = (e.clientX - rect.left - this._transform.x) / this._transform.scale;
      const svgY = (e.clientY - rect.top  - this._transform.y) / this._transform.scale;
      this._mousePos = { x: svgX, y: svgY };

      if (this._panning) {
        this._transform.x = e.clientX - this._panStart.x;
        this._transform.y = e.clientY - this._panStart.y;
        this._applyTransform();
      }
      if (this._dragging) {
        const d = this._dragging;
        d.liveX = d.ox + (e.clientX - d.startX) / this._transform.scale;
        d.liveY = d.oy + (e.clientY - d.startY) / this._transform.scale;
        d.moved = true;
        const el = this._elements.get(d.id);
        if (el) { el.style.left = `${d.liveX}px`; el.style.top = `${d.liveY}px`; }
        this._renderWiresLive(d.id, d.liveX, d.liveY);
      }
      if (this._waypointDrag) {
        const wd = this._waypointDrag;
        const dx = (e.clientX - wd.startX) / this._transform.scale;
        const dy = (e.clientY - wd.startY) / this._transform.scale;
        const base = wd.origWaypoints[0] ?? this._getWireMidpoint(wd.wireId);
        circuitStore.updateWire(wd.wireId, {
          waypoints: [{ x: base.x + dx, y: base.y + dy }],
        });
      }
      if (this._wireDrawing) this._renderDrawingWire({ x: svgX, y: svgY });
    });

    this._container.addEventListener('pointerup', (e) => {
      if (this._panning) {
        this._panning = false;
        this._container.style.cursor = this._wireDrawing ? 'crosshair' : 'default';
      }
      if (this._dragging) {
        const d = this._dragging;
        this._dragging = null;
        if (d.moved) circuitStore.commitMove(d.id, d.liveX, d.liveY);
      }
      if (this._waypointDrag) {
        this._waypointDrag = null;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._wireDrawing) {
        this._wireDrawing = null;
        this._renderDrawingWire(null);
        this._container.style.cursor = 'default';
      }
    });
  }

  // ─── 서버 CompDef 캐시 (공유 캐시 위임) ─────────────────────────────────

  private _fetchCompDef(type: string): Promise<CompDef | null> {
    return fetchCompDef(type);
  }

  // ─── 좌표 변환 ────────────────────────────────────────────────────────────

  private _zoomAt(cx: number, cy: number, factor: number) {
    const ns = Math.max(0.2, Math.min(3, this._transform.scale * factor));
    const sr = ns / this._transform.scale;
    this._transform.x = cx - sr * (cx - this._transform.x);
    this._transform.y = cy - sr * (cy - this._transform.y);
    this._transform.scale = ns;
    this._applyTransform();
  }

  private _applyTransform() {
    const { x, y, scale } = this._transform;
    this._layer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    const tx = `translate(${x} ${y}) scale(${scale})`;
    this._wiresLayer.setAttribute('transform', tx);
    this._drawLayer.setAttribute('transform', tx);
    this._endpointLayer.setAttribute('transform', tx);
    this._waypointLayer.setAttribute('transform', tx);
    this._pinLayer.setAttribute('transform', tx);
  }

  // ─── 메인 렌더 ────────────────────────────────────────────────────────────

  private _render() {
    const comps     = circuitStore.components;
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
      el.style.left      = `${comp.x}px`;
      el.style.top       = `${comp.y}px`;
      el.style.transform = `rotate(${comp.rotation ?? 0}deg)`;
      el.classList.toggle('selected', comp.id === selectedId);
    }

    this._renderWires();
    this._renderEndpointDots();
    this._renderWaypointHandles();
    this._renderPinPoints();
  }

  private _createElement(comp: PlacedComponent) {
    const cachedDef = getCachedCompDef(comp.type);
    const tag = cachedDef?.element ?? 'sim-generic';

    const el = document.createElement(tag);
    el.style.cssText = `position:absolute;left:${comp.x}px;top:${comp.y}px;cursor:grab;user-select:none;`;

    for (const [k, v] of Object.entries(comp.props)) (el as any)[k] = v;
    (el as any)['compId'] = comp.id;

    if (tag === 'sim-generic' && cachedDef) this._applyGenericDef(el, cachedDef);

    this._fetchCompDef(comp.type).then(def => {
      if (!def) return;
      const existing = this._elements.get(comp.id);
      if (!existing) return;
      if (existing.tagName.toLowerCase() === 'sim-generic') this._applyGenericDef(existing, def);
      this._renderWires();
      this._renderEndpointDots();
      this._renderPinPoints();
    });

    el.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      circuitStore.selectComponent(comp.id);
      this._compCtxMenu.show(comp.id, e.clientX, e.clientY);
    });

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0 || this._wireDrawing) return;
      e.stopPropagation();
      circuitStore.selectComponent(comp.id);
      const cur = circuitStore.components.find(c => c.id === comp.id);
      const ox = cur?.x ?? 0, oy = cur?.y ?? 0;
      this._dragging = { id: comp.id, startX: e.clientX, startY: e.clientY, ox, oy, liveX: ox, liveY: oy, moved: false };
      el.style.cursor = 'grabbing';
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointerup', (e: PointerEvent) => {
      el.style.cursor = 'grab';
      el.releasePointerCapture(e.pointerId);
    });

    if (comp.type === 'button') {
      el.addEventListener('sim-press', () => {
        const connMap = circuitStore.getDerivedConnections().get(comp.id);
        const gpioPin = connMap?.['PIN1A'];
        if (typeof gpioPin === 'number') simController.sendPinEvent(gpioPin, 1);
        simController.sendSensorUpdate(comp.id, { value: 1 });
      });
      el.addEventListener('sim-release', () => {
        const connMap = circuitStore.getDerivedConnections().get(comp.id);
        const gpioPin = connMap?.['PIN1A'];
        if (typeof gpioPin === 'number') simController.sendPinEvent(gpioPin, 0);
        simController.sendSensorUpdate(comp.id, { value: 0 });
      });
    }
    if (comp.type === 'potentiometer') {
      el.addEventListener('sim-change', (e: Event) => {
        simController.sendSensorUpdate(comp.id, { value: (e as CustomEvent).detail.value });
      });
    }

    this._layer.appendChild(el);
    this._elements.set(comp.id, el);
  }

  private _applyGenericDef(el: HTMLElement, def: CompDef) {
    const g = el as any;
    g['svgTemplate'] = def.svgTemplate ?? '';
    g['pinDefs']     = def.pins.map(p => ({ name: p.name, x: p.x, y: p.y }));
    g['compWidth']   = def.width;
    g['compHeight']  = def.height;
    g['label']       = def.name;
  }

  // ─── 핀 좌표 계산 ─────────────────────────────────────────────────────────

  private _getPinAbsPos(compId: string, pinName: string): { x: number; y: number } | null {
    const comp = circuitStore.components.find(c => c.id === compId);
    if (!comp) return null;
    return this._getPinPosWithBase(compId, pinName, { x: comp.x, y: comp.y });
  }

  private _getPinPosWithBase(compId: string, pinName: string, base: { x: number; y: number }): { x: number; y: number } | null {
    const el = this._elements.get(compId);
    if (el && 'getPinPositions' in el) {
      const positions = (el as any).getPinPositions() as Map<string, { x: number; y: number }>;
      const local = positions.get(pinName);
      if (local) return { x: base.x + local.x, y: base.y + local.y };
    }
    const comp = circuitStore.components.find(c => c.id === compId);
    const def = comp ? getCachedCompDef(comp.type) : undefined;
    if (def) {
      const pin = def.pins.find(p => p.name === pinName);
      if (pin) return { x: base.x + pin.x, y: base.y + pin.y };
    }
    return { x: base.x + 20, y: base.y + 20 };
  }

  private _getPinsForComp(compId: string): Map<string, { x: number; y: number }> {
    const el = this._elements.get(compId);
    let pinMap = new Map<string, { x: number; y: number }>();
    if (el && 'getPinPositions' in el) pinMap = (el as any).getPinPositions();
    if (pinMap.size === 0) {
      const comp = circuitStore.components.find(c => c.id === compId);
      const def = comp ? getCachedCompDef(comp.type) : undefined;
      if (def) for (const p of def.pins) pinMap.set(p.name, { x: p.x, y: p.y });
    }
    return pinMap;
  }

  // ─── 와이어 색상 ──────────────────────────────────────────────────────────

  private _wireColor(wire: PlacedWire): string {
    if (wire.color) return wire.color;
    const p = wire.fromPin;
    if (/^GND/i.test(p))              return '#666';
    if (/^VCC$|^5V$|^VIN$/i.test(p)) return '#e44';
    if (/^3V3$|^3\.3/i.test(p))      return '#f84';
    if (/^SDA$/i.test(p))             return '#4f4';
    if (/^SCL$/i.test(p))             return '#4ff';
    if (/^SIGNAL$|^PWM/i.test(p))    return '#ff0';
    if (/^WIPER$|^A\d/i.test(p))     return '#a4f';
    if (/MOSI/i.test(p))              return '#f4f';
    if (/MISO/i.test(p))              return '#f4a';
    if (/^SCK$|^SCLK/i.test(p))      return '#ff8';
    if (/^TX$/i.test(p))              return '#fa8';
    if (/^RX$/i.test(p))              return '#f84';
    if (/^DATA$|^DIN$/i.test(p))      return '#8af';
    return '#4af';
  }

  // ─── 와이어 렌더링 ────────────────────────────────────────────────────────

  private _renderWires() {
    while (this._wiresLayer.firstChild) this._wiresLayer.firstChild.remove();
    const selWireId = circuitStore.selectedWireId;

    for (const wire of circuitStore.wires) {
      const from = this._getPinAbsPos(wire.fromCompId, wire.fromPin);
      const to   = this._getPinAbsPos(wire.toCompId,   wire.toPin);
      if (!from || !to) continue;
      this._drawWirePath(wire, from, to, wire.id === selWireId);
    }
  }

  /** 드래그 중 와이어 라이브 렌더 */
  private _renderWiresLive(dragId: string, liveX: number, liveY: number) {
    while (this._wiresLayer.firstChild) this._wiresLayer.firstChild.remove();
    while (this._endpointLayer.firstChild) this._endpointLayer.firstChild.remove();

    const selWireId = circuitStore.selectedWireId;
    for (const wire of circuitStore.wires) {
      const fromComp = circuitStore.components.find(c => c.id === wire.fromCompId);
      const toComp   = circuitStore.components.find(c => c.id === wire.toCompId);
      if (!fromComp || !toComp) continue;
      const fromBase = wire.fromCompId === dragId ? { x: liveX, y: liveY } : { x: fromComp.x, y: fromComp.y };
      const toBase   = wire.toCompId   === dragId ? { x: liveX, y: liveY } : { x: toComp.x,   y: toComp.y   };
      const from = this._getPinPosWithBase(wire.fromCompId, wire.fromPin, fromBase);
      const to   = this._getPinPosWithBase(wire.toCompId,   wire.toPin,   toBase);
      if (!from || !to) continue;
      this._drawWirePath(wire, from, to, wire.id === selWireId);
      this._addEndpointDots(from, to, this._wireColor(wire));
    }
  }

  private _drawWirePath(
    wire: PlacedWire,
    from: { x: number; y: number },
    to:   { x: number; y: number },
    isSelected: boolean,
  ) {
    const color = this._wireColor(wire);
    const d = buildWirePath(from, to, wire.style, wire.waypoints ?? []);

    // 히트 영역 (우클릭 포함)
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hit.setAttribute('d', d);
    hit.setAttribute('stroke', 'transparent');
    hit.setAttribute('stroke-width', '14');
    hit.setAttribute('fill', 'none');
    hit.style.cursor = 'pointer';
    hit.addEventListener('click', (e) => { e.stopPropagation(); circuitStore.selectWire(wire.id); });
    hit.addEventListener('contextmenu', (e) => {
      e.preventDefault(); e.stopPropagation();
      circuitStore.selectWire(wire.id);
      this._ctxMenu.show(wire.id, e.clientX, e.clientY);
    });

    // 실제 선
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', isSelected ? '#fff' : color);
    path.setAttribute('stroke-width', isSelected ? '2.5' : '1.8');
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.9');
    path.style.pointerEvents = 'none';
    if (isSelected) path.setAttribute('stroke-dasharray', '6 3');

    this._wiresLayer.appendChild(hit);
    this._wiresLayer.appendChild(path);
  }

  /** 와이어 끝점 도트를 _endpointLayer(z=3)에 렌더 — 보드 위에 표시 */
  private _renderEndpointDots() {
    while (this._endpointLayer.firstChild) this._endpointLayer.firstChild.remove();

    for (const wire of circuitStore.wires) {
      const from = this._getPinAbsPos(wire.fromCompId, wire.fromPin);
      const to   = this._getPinAbsPos(wire.toCompId,   wire.toPin);
      if (!from || !to) continue;
      this._addEndpointDots(from, to, this._wireColor(wire));
    }
  }

  private _addEndpointDots(
    from: { x: number; y: number },
    to:   { x: number; y: number },
    color: string,
  ) {
    for (const pos of [from, to]) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', `${pos.x}`); dot.setAttribute('cy', `${pos.y}`);
      dot.setAttribute('r', '3'); dot.setAttribute('fill', color);
      dot.setAttribute('stroke', '#000'); dot.setAttribute('stroke-width', '0.5');
      dot.style.pointerEvents = 'none';
      this._endpointLayer.appendChild(dot);
    }
  }

  // ─── 경유점 핸들 렌더링 ────────────────────────────────────────────────────

  private _getWireMidpoint(wireId: string): { x: number; y: number } {
    const wire = circuitStore.wires.find(w => w.id === wireId);
    if (!wire) return { x: 0, y: 0 };
    const from = this._getPinAbsPos(wire.fromCompId, wire.fromPin);
    const to   = this._getPinAbsPos(wire.toCompId,   wire.toPin);
    if (!from || !to) return { x: 0, y: 0 };
    return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  }

  private _renderWaypointHandles() {
    while (this._waypointLayer.firstChild) this._waypointLayer.firstChild.remove();

    const selWireId = circuitStore.selectedWireId;
    if (!selWireId) return;

    const wire = circuitStore.wires.find(w => w.id === selWireId);
    if (!wire || wire.style === 'orthogonal') return; // orthogonal은 자동 라우팅

    // 경유점이 있으면 그 위치, 없으면 from-to 중간점
    const handlePos = wire.waypoints?.[0] ?? this._getWireMidpoint(wire.id);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'move';

    // 핸들 원
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', `${handlePos.x}`); circle.setAttribute('cy', `${handlePos.y}`);
    circle.setAttribute('r', '7');
    circle.setAttribute('fill', wire.waypoints?.length ? '#ff8c00' : '#888');
    circle.setAttribute('stroke', '#fff'); circle.setAttribute('stroke-width', '1.5');
    circle.setAttribute('opacity', '0.9');

    // 십자선
    for (const [x1, y1, x2, y2] of [
      [handlePos.x - 4, handlePos.y, handlePos.x + 4, handlePos.y],
      [handlePos.x, handlePos.y - 4, handlePos.x, handlePos.y + 4],
    ] as [number,number,number,number][]) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1',`${x1}`); line.setAttribute('y1',`${y1}`);
      line.setAttribute('x2',`${x2}`); line.setAttribute('y2',`${y2}`);
      line.setAttribute('stroke','#fff'); line.setAttribute('stroke-width','1.5');
      line.style.pointerEvents = 'none';
      g.appendChild(line);
    }

    g.appendChild(circle);

    // 드래그 시작
    g.addEventListener('pointerdown', (e: PointerEvent) => {
      e.stopPropagation();
      this._waypointDrag = {
        wireId: wire.id,
        origWaypoints: wire.waypoints ? [...wire.waypoints] : [handlePos],
        startX: e.clientX,
        startY: e.clientY,
      };
      g.setPointerCapture(e.pointerId);
    });
    // 더블클릭 → 경유점 리셋
    g.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      circuitStore.updateWire(wire.id, { waypoints: [] });
    });

    this._waypointLayer.appendChild(g);
  }

  // ─── 핀 연결 포인트 렌더링 ────────────────────────────────────────────────

  private _renderPinPoints() {
    while (this._pinLayer.firstChild) this._pinLayer.firstChild.remove();

    const selPin = circuitStore.selectedPin;

    for (const comp of circuitStore.components) {
      const pins = this._getPinsForComp(comp.id);
      if (pins.size === 0) continue;

      for (const [pinName, local] of pins) {
        const ax = comp.x + local.x;
        const ay = comp.y + local.y;
        const isFrom   = this._wireDrawing?.fromCompId === comp.id && this._wireDrawing?.fromPin === pinName;
        const isSelPin = selPin?.compId === comp.id && selPin?.pinName === pinName;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-comp', comp.id);
        g.setAttribute('data-pin',  pinName);
        g.style.cursor = 'crosshair';

        // 히트 영역
        const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hitArea.setAttribute('cx', `${ax}`); hitArea.setAttribute('cy', `${ay}`);
        hitArea.setAttribute('r', '8'); hitArea.setAttribute('fill', 'transparent');

        // 핀 서클
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', `${ax}`); circle.setAttribute('cy', `${ay}`);
        circle.setAttribute('r',  isFrom || isSelPin ? '5' : '4');
        circle.setAttribute('fill', isFrom ? '#ff0' : isSelPin ? '#a0f' : '#4af');
        circle.setAttribute('opacity', (isFrom || isSelPin) ? '1' : '0');
        circle.setAttribute('stroke', '#fff'); circle.setAttribute('stroke-width', '1');
        circle.style.transition = 'opacity 0.12s';

        g.addEventListener('mouseenter', () => circle.setAttribute('opacity', '0.9'));
        g.addEventListener('mouseleave', () => {
          if (!isFrom && !isSelPin) circle.setAttribute('opacity', '0');
        });

        // 좌클릭 → 와이어 드로잉
        g.addEventListener('click', (e) => {
          e.stopPropagation();
          this._handlePinClick(comp.id, pinName, ax, ay);
        });
        // 우클릭 → 핀 선택 (속성 패널)
        g.addEventListener('contextmenu', (e) => {
          e.preventDefault(); e.stopPropagation();
          circuitStore.selectPin(comp.id, pinName);
        });

        g.appendChild(hitArea);
        g.appendChild(circle);
        this._pinLayer.appendChild(g);
      }
    }
  }

  // ─── 와이어 드로잉 ────────────────────────────────────────────────────────

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
        this._fetchCompDef(fromComp.type), this._fetchCompDef(toComp.type),
      ]);
      if (!fromDef || !toDef) return;
      const fromPinDef = fromDef.pins.find(p => p.name === fromPin);
      const toPinDef   = toDef.pins.find(p => p.name === toPin);
      if (!fromPinDef || !toPinDef) return;
      const r = await fetch(`/api/components/connections/validate?from=${encodeURIComponent(fromPinDef.type)}&to=${encodeURIComponent(toPinDef.type)}`);
      if (!r.ok) return;
      const result = await r.json() as { compatible: boolean; severity?: string; message?: string };
      if (!result.compatible) {
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

  private _renderDrawingWire(mousePos: { x: number; y: number } | null) {
    while (this._drawLayer.firstChild) this._drawLayer.firstChild.remove();
    if (!this._wireDrawing || !mousePos) return;

    const { fromX, fromY } = this._wireDrawing;
    const dx = mousePos.x - fromX;
    const d  = `M${fromX},${fromY} C${fromX + dx * 0.4},${fromY} ${mousePos.x - dx * 0.4},${mousePos.y} ${mousePos.x},${mousePos.y}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d); path.setAttribute('stroke', '#4af');
    path.setAttribute('stroke-width', '1.8'); path.setAttribute('stroke-dasharray', '6 4');
    path.setAttribute('fill', 'none'); path.setAttribute('opacity', '0.8');
    this._drawLayer.appendChild(path);

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', `${fromX}`); dot.setAttribute('cy', `${fromY}`);
    dot.setAttribute('r', '4'); dot.setAttribute('fill', '#ff0'); dot.setAttribute('opacity', '0.9');
    this._drawLayer.appendChild(dot);
  }

  // ─── 시뮬레이션 핀 시각 업데이트 ──────────────────────────────────────────

  private _updatePinVisual(pin: number, value: number) {
    const derived = circuitStore.getDerivedConnections();
    for (const [compId, connMap] of derived) {
      for (const [pinName, target] of Object.entries(connMap)) {
        if (target === pin) {
          const el = this._elements.get(compId);
          if (el && 'setPinState' in el) (el as any).setPinState(pinName, value);
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

  zoomIn()   { this._zoomAt(this._container.clientWidth / 2, this._container.clientHeight / 2, 1.2); }
  zoomOut()  { this._zoomAt(this._container.clientWidth / 2, this._container.clientHeight / 2, 0.8); }
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
