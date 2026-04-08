import { circuitStore, type PlacedComponent, type PlacedWire } from '../stores/circuit-store.js';
import { simController } from '../stores/sim-controller.js';

/**
 * 무한 캔버스 — SVG wire + Lit 컴포넌트 오버레이
 * Pan/Zoom: 마우스 휠 + Alt+드래그
 *
 * 와이어 시스템:
 *   - 컴포넌트 핀 위에 마우스를 올리면 연결 포인트(핀 서클) 표시
 *   - 핀 서클 클릭 → 와이어 드로잉 모드
 *   - 다른 핀 서클 클릭 → 와이어 생성 완료 (서버 호환성 검사 포함)
 *   - 와이어 클릭 → 선택 (Delete로 삭제)
 *
 * 서버 연동:
 *   - 컴포넌트 정의 캐시 (_compDefCache)
 *   - 내장 tagMap 없는 타입 → sim-generic + 서버 svgTemplate
 *   - 핀 좌표: getPinPositions() 우선 → 서버 pins[].x,y 폴백
 *   - 와이어 연결 시 /api/components/connections/validate 호출
 */

// 서버 ComponentDef의 필요한 부분만 정의 (import 없이 인라인)
interface ServerPinDef {
  name: string;
  x: number;
  y: number;
  type: string;
  label?: string;
  description?: string;
}

interface ServerCompDef {
  id: string;
  name: string;
  element?: string;
  svgTemplate?: string;
  width: number;
  height: number;
  defaultProps: Record<string, unknown>;
  pins: ServerPinDef[];
}

// 내장 Lit 컴포넌트 태그 매핑 (서버 def가 없을 때 폴백)
const BUILTIN_TAGS: Record<string, string> = {
  'board-uno':     'sim-board-uno',
  'board-esp32c3': 'sim-board-esp32c3',
  'led':           'sim-led',
  'rgb-led':       'sim-rgb-led',
  'button':        'sim-button',
  'resistor':      'sim-resistor',
  'buzzer':        'sim-buzzer',
  'potentiometer': 'sim-potentiometer',
  'seven-segment': 'sim-seven-segment',
  'lcd':           'sim-lcd',
  'oled':          'sim-oled',
  'dht':           'sim-dht',
  'ultrasonic':    'sim-ultrasonic',
  'servo':         'sim-servo',
  'neopixel':      'sim-neopixel',
};

export class CircuitCanvas {
  private _container: HTMLElement;
  private _svg!: SVGSVGElement;
  private _layer!: HTMLElement;
  private _wiresLayer!: SVGGElement;
  private _pinLayer!: SVGGElement;
  private _drawLayer!: SVGGElement;

  private _transform = { x: 0, y: 0, scale: 1 };
  private _panning = false;
  private _panStart = { x: 0, y: 0 };
  private _dragging: {
    id: string;
    startX: number; startY: number;
    ox: number; oy: number;
    /** 드래그 중 실시간 좌표 (commitMove에 사용) */
    liveX: number; liveY: number;
    moved: boolean;
  } | null = null;

  private _wireDrawing: {
    fromCompId: string;
    fromPin: string;
    fromX: number;
    fromY: number;
  } | null = null;

  private _mousePos = { x: 0, y: 0 };
  private _elements = new Map<string, HTMLElement>();

  /** 서버 컴포넌트 정의 캐시. undefined = 미조회, null = 조회 실패 */
  private _compDefCache = new Map<string, ServerCompDef | null>();

  constructor(container: HTMLElement) {
    this._container = container;
    this._buildDOM();
    this._bindEvents();

    circuitStore.subscribe(() => this._render());
    this._render();

    simController.onPinState = (pin, value) => {
      this._updatePinVisual(pin, value);
    };
    simController.onComponentUpdate = (id, pin, value) => {
      const el = this._elements.get(id);
      if (el && 'setPinState' in el) {
        (el as { setPinState: (p: string, v: number) => void }).setPinState(pin, value);
      }
    };
  }

  private _buildDOM() {
    const hint = this._container.querySelector('#canvas-hint') as HTMLElement | null;

    this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this._svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none;';

    this._wiresLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._wiresLayer.style.pointerEvents = 'all';
    this._drawLayer  = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._drawLayer.style.pointerEvents = 'none';
    this._pinLayer   = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._pinLayer.style.pointerEvents = 'all';

    this._svg.appendChild(this._wiresLayer);
    this._svg.appendChild(this._drawLayer);
    this._svg.appendChild(this._pinLayer);
    this._container.appendChild(this._svg);

    this._layer = document.createElement('div');
    this._layer.style.cssText = 'position:absolute;top:0;left:0;transform-origin:0 0;z-index:2;';
    this._container.appendChild(this._layer);

    if (hint) this._container.appendChild(hint);
  }

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
        const dx = (e.clientX - d.startX) / this._transform.scale;
        const dy = (e.clientY - d.startY) / this._transform.scale;
        d.liveX = d.ox + dx;
        d.liveY = d.oy + dy;
        d.moved = true;
        // DOM 직접 업데이트 (store 거치지 않음 — 드래그 중 매 프레임 re-render 방지)
        const el = this._elements.get(d.id);
        if (el) { el.style.left = `${d.liveX}px`; el.style.top = `${d.liveY}px`; }
        // 와이어만 재렌더 (pin 서클은 생략해 성능 향상)
        this._renderWiresLive(d.id, d.liveX, d.liveY);
      }
      if (this._wireDrawing) {
        this._renderDrawingWire({ x: svgX, y: svgY });
      }
    });

    this._container.addEventListener('pointerup', () => {
      if (this._panning) {
        this._panning = false;
        this._container.style.cursor = this._wireDrawing ? 'crosshair' : 'default';
      }
      if (this._dragging) {
        const d = this._dragging;
        this._dragging = null;
        if (d.moved) {
          // 드래그 완료: store에 최종 위치 커밋 (히스토리 1회 기록)
          circuitStore.commitMove(d.id, d.liveX, d.liveY);
        }
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

  // ─── 서버 컴포넌트 정의 캐시 ─────────────────────────────────────

  /** 서버에서 컴포넌트 정의를 가져와 캐시에 저장 */
  private async _fetchCompDef(type: string): Promise<ServerCompDef | null> {
    if (this._compDefCache.has(type)) {
      return this._compDefCache.get(type) ?? null;
    }
    try {
      const r = await fetch(`/api/components/${type}`);
      if (!r.ok) { this._compDefCache.set(type, null); return null; }
      const def = await r.json() as ServerCompDef;
      this._compDefCache.set(type, def);
      return def;
    } catch {
      this._compDefCache.set(type, null);
      return null;
    }
  }

  // ─── 렌더링 ──────────────────────────────────────────────────────

  private _zoomAt(cx: number, cy: number, factor: number) {
    const newScale = Math.max(0.2, Math.min(3, this._transform.scale * factor));
    const scaleRatio = newScale / this._transform.scale;
    this._transform.x = cx - scaleRatio * (cx - this._transform.x);
    this._transform.y = cy - scaleRatio * (cy - this._transform.y);
    this._transform.scale = newScale;
    this._applyTransform();
  }

  private _applyTransform() {
    const { x, y, scale } = this._transform;
    this._layer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    const tx = `translate(${x} ${y}) scale(${scale})`;
    this._wiresLayer.setAttribute('transform', tx);
    this._drawLayer.setAttribute('transform', tx);
    this._pinLayer.setAttribute('transform', tx);
  }

  private _render() {
    const comps = circuitStore.components;
    const selectedId = circuitStore.selectedId;

    const hint = document.getElementById('canvas-hint');
    if (hint) hint.style.display = comps.length > 0 ? 'none' : '';

    // 삭제된 컴포넌트 DOM 제거
    for (const [id, el] of this._elements) {
      if (!comps.find(c => c.id === id)) {
        el.remove();
        this._elements.delete(id);
      }
    }

    for (const comp of comps) {
      if (!this._elements.has(comp.id)) this._createElement(comp);
      const el = this._elements.get(comp.id);
      if (!el) continue;
      el.style.left   = `${comp.x}px`;
      el.style.top    = `${comp.y}px`;
      el.style.transform = `rotate(${comp.rotation ?? 0}deg)`;
      el.classList.toggle('selected', comp.id === selectedId);
    }

    this._renderWires();
    this._renderPinPoints();
  }

  private _createElement(comp: PlacedComponent) {
    // ① 캐시된 서버 def가 있으면 element 태그 우선 사용
    const cachedDef = this._compDefCache.has(comp.type)
      ? this._compDefCache.get(comp.type)
      : undefined;
    const tag = cachedDef?.element ?? BUILTIN_TAGS[comp.type] ?? 'sim-generic';

    const el = document.createElement(tag);
    el.style.cssText = `position:absolute;left:${comp.x}px;top:${comp.y}px;cursor:grab;user-select:none;`;

    // props 적용
    for (const [k, v] of Object.entries(comp.props)) {
      (el as HTMLElement & Record<string, unknown>)[k] = v;
    }
    (el as HTMLElement & Record<string, unknown>)['compId'] = comp.id;

    // ② sim-generic: 캐시 있으면 즉시 적용
    if (tag === 'sim-generic' && cachedDef) {
      this._applyGenericDef(el, cachedDef);
    }

    // ③ 서버 def 비동기 조회 → sim-generic 업데이트 / 핀/와이어 재렌더
    this._fetchCompDef(comp.type).then(def => {
      if (!def) return;
      const existing = this._elements.get(comp.id);
      if (!existing) return;
      if (existing.tagName.toLowerCase() === 'sim-generic') {
        this._applyGenericDef(existing, def);
      }
      // 핀 좌표가 바뀌었을 수 있으므로 재렌더
      this._renderWires();
      this._renderPinPoints();
    });

    // ─── 이벤트 바인딩 ───────────────────────────────────────────

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0 || this._wireDrawing) return;
      e.stopPropagation();
      circuitStore.selectComponent(comp.id);
      // 현재 위치를 store에서 직접 읽음 — stale closure 버그 방지
      const cur = circuitStore.components.find(c => c.id === comp.id);
      const ox = cur?.x ?? 0;
      const oy = cur?.y ?? 0;
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
        const gpioPin = comp.connections['PIN1A'];
        if (typeof gpioPin === 'number') simController.sendPinEvent(gpioPin, 1);
        simController.sendSensorUpdate(comp.id, { value: 1 });
      });
      el.addEventListener('sim-release', () => {
        const gpioPin = comp.connections['PIN1A'];
        if (typeof gpioPin === 'number') simController.sendPinEvent(gpioPin, 0);
        simController.sendSensorUpdate(comp.id, { value: 0 });
      });
    }

    if (comp.type === 'potentiometer') {
      el.addEventListener('sim-change', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        simController.sendSensorUpdate(comp.id, { value: detail.value });
      });
    }

    this._layer.appendChild(el);
    this._elements.set(comp.id, el);
  }

  /** sim-generic 엘리먼트에 서버 def 데이터 적용 */
  private _applyGenericDef(el: HTMLElement, def: ServerCompDef) {
    const g = el as HTMLElement & Record<string, unknown>;
    g['svgTemplate'] = def.svgTemplate ?? '';
    g['pinDefs']     = def.pins.map(p => ({ name: p.name, x: p.x, y: p.y }));
    g['compWidth']   = def.width;
    g['compHeight']  = def.height;
    g['label']       = def.name;
  }

  // ─── 핀 절대 좌표 계산 ───────────────────────────────────────────

  /**
   * 핀의 절대 SVG 좌표를 반환
   * 1순위: Lit getPinPositions() (내장 컴포넌트)
   * 2순위: 서버 def pins[].x,y
   * 3순위: 컴포넌트 원점 + 오프셋 (최후 폴백)
   */
  private _getPinAbsPos(compId: string, pinName: string): { x: number; y: number } | null {
    const comp = circuitStore.components.find(c => c.id === compId);
    if (!comp) return null;

    const el = this._elements.get(compId);
    if (el && 'getPinPositions' in el) {
      const positions = (el as { getPinPositions: () => Map<string, { x: number; y: number }> }).getPinPositions();
      const local = positions.get(pinName);
      if (local) return { x: comp.x + local.x, y: comp.y + local.y };
    }

    // 서버 def 폴백
    const def = this._compDefCache.get(comp.type);
    if (def) {
      const pin = def.pins.find(p => p.name === pinName);
      if (pin) return { x: comp.x + pin.x, y: comp.y + pin.y };
    }

    return { x: comp.x + 20, y: comp.y + 20 };
  }

  // ─── 와이어 렌더링 ────────────────────────────────────────────────

  /**
   * 드래그 중 와이어만 재렌더 (핀 서클/핀레이어 갱신 없음 — 성능 최적화)
   * 드래그 중인 컴포넌트 좌표는 store 대신 liveX/liveY 사용
   */
  private _renderWiresLive(dragId: string, liveX: number, liveY: number) {
    while (this._wiresLayer.firstChild) this._wiresLayer.firstChild.remove();

    const selectedWireId = circuitStore.selectedWireId;

    for (const wire of circuitStore.wires) {
      const fromComp = circuitStore.components.find(c => c.id === wire.fromCompId);
      const toComp   = circuitStore.components.find(c => c.id === wire.toCompId);
      if (!fromComp || !toComp) continue;

      // 드래그 중인 컴포넌트면 라이브 좌표 사용
      const fromBase = wire.fromCompId === dragId
        ? { x: liveX, y: liveY } : { x: fromComp.x, y: fromComp.y };
      const toBase   = wire.toCompId   === dragId
        ? { x: liveX, y: liveY } : { x: toComp.x,   y: toComp.y };

      const fromPins = this._getPinPositionsFor(wire.fromCompId, fromBase);
      const toPins   = this._getPinPositionsFor(wire.toCompId,   toBase);
      const from = fromPins.get(wire.fromPin);
      const to   = toPins.get(wire.toPin);
      if (!from || !to) continue;

      this._drawWirePath(wire, from, to, wire.id === selectedWireId);
    }
  }

  /** 지정 base 좌표로 핀 절대 위치 Map 반환 */
  private _getPinPositionsFor(
    compId: string,
    base: { x: number; y: number },
  ): Map<string, { x: number; y: number }> {
    const el = this._elements.get(compId);
    let pinMap = new Map<string, { x: number; y: number }>();
    if (el && 'getPinPositions' in el) {
      pinMap = (el as { getPinPositions: () => Map<string, { x: number; y: number }> }).getPinPositions();
    }
    if (pinMap.size === 0) {
      const comp = circuitStore.components.find(c => c.id === compId);
      const def = comp ? this._compDefCache.get(comp.type) : undefined;
      if (def) for (const p of def.pins) pinMap.set(p.name, { x: p.x, y: p.y });
    }
    // base 오프셋 적용
    const result = new Map<string, { x: number; y: number }>();
    for (const [name, local] of pinMap) {
      result.set(name, { x: base.x + local.x, y: base.y + local.y });
    }
    return result;
  }

  /** SVG에 와이어 경로 그리기 (공용 헬퍼) */
  private _drawWirePath(
    wire: PlacedWire,
    from: { x: number; y: number },
    to: { x: number; y: number },
    isSelected: boolean,
  ) {
    const color = this._wireColor(wire);
    const dx = to.x - from.x;
    const d  = `M${from.x},${from.y} C${from.x + dx * 0.4},${from.y} ${to.x - dx * 0.4},${to.y} ${to.x},${to.y}`;

    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hit.setAttribute('d', d);
    hit.setAttribute('stroke', 'transparent');
    hit.setAttribute('stroke-width', '12');
    hit.setAttribute('fill', 'none');
    hit.style.cursor = 'pointer';
    hit.addEventListener('click', (e) => { e.stopPropagation(); circuitStore.selectWire(wire.id); });

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', isSelected ? '#fff' : color);
    path.setAttribute('stroke-width', isSelected ? '2.5' : '1.8');
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.9');
    path.style.pointerEvents = 'none';
    if (isSelected) path.setAttribute('stroke-dasharray', '6 3');

    for (const pos of [from, to]) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', `${pos.x}`); dot.setAttribute('cy', `${pos.y}`);
      dot.setAttribute('r', '2.5'); dot.setAttribute('fill', color);
      dot.style.pointerEvents = 'none';
      this._wiresLayer.appendChild(dot);
    }
    this._wiresLayer.appendChild(hit);
    this._wiresLayer.appendChild(path);
  }

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

  private _renderWires() {
    while (this._wiresLayer.firstChild) this._wiresLayer.firstChild.remove();

    const selectedWireId = circuitStore.selectedWireId;

    for (const wire of circuitStore.wires) {
      const from = this._getPinAbsPos(wire.fromCompId, wire.fromPin);
      const to   = this._getPinAbsPos(wire.toCompId,   wire.toPin);
      if (!from || !to) continue;
      this._drawWirePath(wire, from, to, wire.id === selectedWireId);
    }
  }

  /** 핀 연결 포인트(서클) 렌더링 */
  private _renderPinPoints() {
    while (this._pinLayer.firstChild) this._pinLayer.firstChild.remove();

    for (const comp of circuitStore.components) {
      const el = this._elements.get(comp.id);

      // 핀 맵 수집: Lit 우선, 서버 def 폴백
      let pinMap = new Map<string, { x: number; y: number }>();
      if (el && 'getPinPositions' in el) {
        pinMap = (el as { getPinPositions: () => Map<string, { x: number; y: number }> }).getPinPositions();
      }
      if (pinMap.size === 0) {
        const def = this._compDefCache.get(comp.type);
        if (def) {
          for (const p of def.pins) pinMap.set(p.name, { x: p.x, y: p.y });
        }
      }
      if (pinMap.size === 0) continue;

      for (const [pinName, local] of pinMap) {
        const ax = comp.x + local.x;
        const ay = comp.y + local.y;

        const isFromPin = this._wireDrawing?.fromCompId === comp.id &&
                          this._wireDrawing?.fromPin    === pinName;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', `${ax}`); circle.setAttribute('cy', `${ay}`);
        circle.setAttribute('r',  isFromPin ? '5' : '4');
        circle.setAttribute('fill', isFromPin ? '#ff0' : '#4af');
        circle.setAttribute('opacity', isFromPin ? '1' : '0.0');
        circle.setAttribute('stroke', '#fff'); circle.setAttribute('stroke-width', '1');
        circle.style.cursor = 'crosshair';
        circle.style.transition = 'opacity 0.1s';

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-comp', comp.id);
        g.setAttribute('data-pin',  pinName);
        g.style.cursor = 'crosshair';

        g.addEventListener('mouseenter', () => circle.setAttribute('opacity', '0.85'));
        g.addEventListener('mouseleave', () => {
          if (!isFromPin) circle.setAttribute('opacity', '0.0');
        });
        g.addEventListener('click', (e) => {
          e.stopPropagation();
          this._handlePinClick(comp.id, pinName, ax, ay);
        });

        const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hitArea.setAttribute('cx', `${ax}`); hitArea.setAttribute('cy', `${ay}`);
        hitArea.setAttribute('r', '8'); hitArea.setAttribute('fill', 'transparent');

        g.appendChild(hitArea);
        g.appendChild(circle);
        this._pinLayer.appendChild(g);
      }
    }
  }

  // ─── 와이어 드로잉 ────────────────────────────────────────────────

  private async _handlePinClick(compId: string, pinName: string, ax: number, ay: number) {
    if (!this._wireDrawing) {
      this._wireDrawing = { fromCompId: compId, fromPin: pinName, fromX: ax, fromY: ay };
      this._container.style.cursor = 'crosshair';
      this._renderPinPoints();
      return;
    }

    // 같은 핀 클릭 → 취소
    if (this._wireDrawing.fromCompId === compId && this._wireDrawing.fromPin === pinName) {
      this._wireDrawing = null;
      this._renderDrawingWire(null);
      this._container.style.cursor = 'default';
      this._renderPinPoints();
      return;
    }

    const from = this._wireDrawing;

    // ① 서버 핀 타입 호환성 검사
    await this._validateAndWarnConnection(from.fromCompId, from.fromPin, compId, pinName);

    // ② 와이어 색상 결정 (서버 API)
    const wireColor = await this._resolveWireColor(from.fromPin);

    const wire: PlacedWire = {
      id: `wire-${Date.now()}`,
      fromCompId: from.fromCompId,
      fromPin:    from.fromPin,
      toCompId:   compId,
      toPin:      pinName,
      color:      wireColor,
    };
    circuitStore.addWire(wire);
    this._wireDrawing = null;
    this._renderDrawingWire(null);
    this._container.style.cursor = 'default';
  }

  /** 서버 /connections/validate 로 핀 타입 호환성 검사, 오류 시 토스트 표시 */
  private async _validateAndWarnConnection(
    fromCompId: string, fromPin: string,
    toCompId:   string, toPin:   string,
  ) {
    try {
      // 두 컴포넌트 def를 병렬로 가져옴
      const fromComp = circuitStore.components.find(c => c.id === fromCompId);
      const toComp   = circuitStore.components.find(c => c.id === toCompId);
      if (!fromComp || !toComp) return;

      const [fromDef, toDef] = await Promise.all([
        this._fetchCompDef(fromComp.type),
        this._fetchCompDef(toComp.type),
      ]);
      if (!fromDef || !toDef) return;

      const fromPinDef = fromDef.pins.find(p => p.name === fromPin);
      const toPinDef   = toDef.pins.find(p => p.name === toPin);
      if (!fromPinDef || !toPinDef) return;

      const r = await fetch(
        `/api/components/connections/validate?from=${encodeURIComponent(fromPinDef.type)}&to=${encodeURIComponent(toPinDef.type)}`
      );
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
    } catch { /* 검사 실패해도 연결은 허용 */ }
  }

  /** 핀 이름으로 서버에서 전선 색상 결정 */
  private async _resolveWireColor(pinName: string): Promise<string | undefined> {
    try {
      const r = await fetch(`/api/components/wires/auto?pin=${encodeURIComponent(pinName)}`);
      if (!r.ok) return undefined;
      const wire = await r.json() as { color: string };
      return wire.color;
    } catch {
      return undefined;
    }
  }

  /** 그리는 중인 와이어 (rubber-band) 렌더링 */
  private _renderDrawingWire(mousePos: { x: number; y: number } | null) {
    while (this._drawLayer.firstChild) this._drawLayer.firstChild.remove();
    if (!this._wireDrawing || !mousePos) return;

    const { fromX, fromY } = this._wireDrawing;
    const dx = mousePos.x - fromX;
    const d  = `M${fromX},${fromY} C${fromX + dx * 0.4},${fromY} ${mousePos.x - dx * 0.4},${mousePos.y} ${mousePos.x},${mousePos.y}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#4af');
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-dasharray', '6 4');
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.8');
    this._drawLayer.appendChild(path);

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', `${fromX}`); dot.setAttribute('cy', `${fromY}`);
    dot.setAttribute('r', '4'); dot.setAttribute('fill', '#ff0'); dot.setAttribute('opacity', '0.9');
    this._drawLayer.appendChild(dot);
  }

  // ─── 시뮬레이션 핀 시각 업데이트 ────────────────────────────────

  private _updatePinVisual(pin: number, value: number) {
    // 와이어 기반 연결 정보에서 GPIO → 컴포넌트 핀 매핑
    const derived = circuitStore.getDerivedConnections();
    for (const [compId, connMap] of derived) {
      for (const [pinName, target] of Object.entries(connMap)) {
        if (target === pin) {
          const el = this._elements.get(compId);
          if (el && 'setPinState' in el) {
            (el as { setPinState: (p: string, v: number) => void }).setPinState(pinName, value);
          }
        }
      }
    }
  }

  // ─── 토스트 알림 ─────────────────────────────────────────────────

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

  // ─── 공개 API ────────────────────────────────────────────────────

  fitView()  { this._transform = { x: 40, y: 40, scale: 1 }; this._applyTransform(); }
  zoomIn()   { this._zoomAt(this._container.clientWidth / 2, this._container.clientHeight / 2, 1.2); }
  zoomOut()  { this._zoomAt(this._container.clientWidth / 2, this._container.clientHeight / 2, 0.8); }
}
