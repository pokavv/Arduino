import { circuitStore, type PlacedComponent, type PlacedWire } from '../stores/circuit-store.js';
import { simController } from '../stores/sim-controller.js';

/**
 * 무한 캔버스 — SVG wire + Lit 컴포넌트 오버레이
 * Pan/Zoom: 마우스 휠 + Alt+드래그
 *
 * 와이어 시스템:
 *   - 컴포넌트 핀 위에 마우스를 올리면 연결 포인트(핀 서클) 표시
 *   - 핀 서클 클릭 → 와이어 드로잉 모드
 *   - 다른 핀 서클 클릭 → 와이어 생성 완료
 *   - 와이어 클릭 → 선택 (Delete로 삭제)
 */
export class CircuitCanvas {
  private _container: HTMLElement;
  private _svg!: SVGSVGElement;
  private _layer!: HTMLElement;
  private _wiresLayer!: SVGGElement;
  private _pinLayer!: SVGGElement;    // 핀 연결 포인트 표시 레이어
  private _drawLayer!: SVGGElement;   // 그리는 중인 와이어 레이어

  private _transform = { x: 0, y: 0, scale: 1 };
  private _panning = false;
  private _panStart = { x: 0, y: 0 };
  private _dragging: { id: string; startX: number; startY: number; ox: number; oy: number } | null = null;

  /** 와이어 드로잉 상태 */
  private _wireDrawing: {
    fromCompId: string;
    fromPin: string;
    fromX: number;
    fromY: number;
  } | null = null;

  /** 마우스 현재 위치 (SVG 좌표) */
  private _mousePos = { x: 0, y: 0 };

  private _elements = new Map<string, HTMLElement>();

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
    this._svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;';
    // SVG는 와이어 클릭을 위해 pointer-events:none 해제
    this._svg.style.pointerEvents = 'none';

    // 레이어 순서: 와이어 → 드로잉 → 핀 포인트
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
          // 와이어 드로잉 취소
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
        const newX = d.ox + dx;
        const newY = d.oy + dy;
        circuitStore.updateComponent(d.id, { x: newX, y: newY });
        const el = this._elements.get(d.id);
        if (el) { el.style.left = `${newX}px`; el.style.top = `${newY}px`; }
        this._renderWires();
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
      if (this._dragging) this._dragging = null;
    });

    // Escape → 와이어 드로잉 취소
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._wireDrawing) {
        this._wireDrawing = null;
        this._renderDrawingWire(null);
        this._container.style.cursor = 'default';
      }
    });
  }

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

    for (const [id, el] of this._elements) {
      if (!comps.find(c => c.id === id)) {
        el.remove();
        this._elements.delete(id);
      }
    }

    for (const comp of comps) {
      if (!this._elements.has(comp.id)) this._createElement(comp);
      const el = this._elements.get(comp.id)!;
      el.style.left = `${comp.x}px`;
      el.style.top  = `${comp.y}px`;
      el.style.transform = `rotate(${comp.rotation ?? 0}deg)`;
      el.classList.toggle('selected', comp.id === selectedId);
    }

    this._renderWires();
    this._renderPinPoints();
  }

  private _createElement(comp: PlacedComponent) {
    const tagMap: Record<string, string> = {
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

    const tag = tagMap[comp.type];
    if (!tag) return;

    const el = document.createElement(tag);
    el.style.cssText = `position:absolute;left:${comp.x}px;top:${comp.y}px;cursor:grab;user-select:none;`;

    for (const [k, v] of Object.entries(comp.props)) {
      (el as HTMLElement & Record<string, unknown>)[k] = v;
    }
    (el as HTMLElement & Record<string, unknown>)['compId'] = comp.id;

    // 드래그
    el.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0 || this._wireDrawing) return;
      e.stopPropagation();
      circuitStore.selectComponent(comp.id);
      this._dragging = { id: comp.id, startX: e.clientX, startY: e.clientY, ox: comp.x, oy: comp.y };
      el.style.cursor = 'grabbing';
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointerup', (e: PointerEvent) => {
      el.style.cursor = 'grab';
      el.releasePointerCapture(e.pointerId);
    });

    // 버튼 이벤트
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

    // 포텐셔미터 이벤트
    if (comp.type === 'potentiometer') {
      el.addEventListener('sim-change', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        simController.sendSensorUpdate(comp.id, { value: detail.value });
      });
    }

    this._layer.appendChild(el);
    this._elements.set(comp.id, el);
  }

  // ─── 와이어 렌더링 ────────────────────────────────────────────

  /** 핀의 절대 SVG 좌표를 반환 */
  private _getPinAbsPos(compId: string, pinName: string): { x: number; y: number } | null {
    const comp = circuitStore.components.find(c => c.id === compId);
    if (!comp) return null;
    const el = this._elements.get(compId);
    if (!el || !('getPinPositions' in el)) return { x: comp.x + 20, y: comp.y + 20 };
    const positions = (el as { getPinPositions: () => Map<string, { x: number; y: number }> }).getPinPositions();
    const local = positions.get(pinName);
    if (!local) return { x: comp.x + 20, y: comp.y + 20 };
    return { x: comp.x + local.x, y: comp.y + local.y };
  }

  /** 와이어 색상 결정 */
  private _wireColor(wire: PlacedWire): string {
    if (wire.color) return wire.color;
    const pin = wire.fromPin + wire.toPin;
    if (/GND/i.test(pin)) return '#555';
    if (/VCC|5V/i.test(pin)) return '#e44';
    if (/3V3|3\.3/i.test(pin)) return '#f84';
    return '#4af';
  }

  private _renderWires() {
    while (this._wiresLayer.firstChild) this._wiresLayer.firstChild.remove();

    const wires = circuitStore.wires;
    const selectedWireId = circuitStore.selectedWireId;

    for (const wire of wires) {
      const from = this._getPinAbsPos(wire.fromCompId, wire.fromPin);
      const to   = this._getPinAbsPos(wire.toCompId,   wire.toPin);
      if (!from || !to) continue;

      const color   = this._wireColor(wire);
      const isSelected = wire.id === selectedWireId;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const cx1 = from.x + dx * 0.4;
      const cy1 = from.y;
      const cx2 = to.x   - dx * 0.4;
      const cy2 = to.y;
      const d = `M${from.x},${from.y} C${cx1},${cy1} ${cx2},${cy2} ${to.x},${to.y}`;

      // 히트 영역 (투명한 넓은 선)
      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hit.setAttribute('d', d);
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('stroke-width', '12');
      hit.setAttribute('fill', 'none');
      hit.style.cursor = 'pointer';
      hit.addEventListener('click', (e) => {
        e.stopPropagation();
        circuitStore.selectWire(wire.id);
      });

      // 실제 와이어 선
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', isSelected ? '#fff' : color);
      path.setAttribute('stroke-width', isSelected ? '2.5' : '1.8');
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0.9');
      path.style.pointerEvents = 'none';
      if (isSelected) {
        path.setAttribute('stroke-dasharray', '6 3');
      }

      // 핀 끝점 원
      for (const pos of [from, to]) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', `${pos.x}`);
        dot.setAttribute('cy', `${pos.y}`);
        dot.setAttribute('r', '2.5');
        dot.setAttribute('fill', color);
        dot.style.pointerEvents = 'none';
        this._wiresLayer.appendChild(dot);
      }

      this._wiresLayer.appendChild(hit);
      this._wiresLayer.appendChild(path);
    }
  }

  /** 핀 연결 포인트(서클) 렌더링 — 컴포넌트 핀마다 클릭 가능한 원 표시 */
  private _renderPinPoints() {
    while (this._pinLayer.firstChild) this._pinLayer.firstChild.remove();

    const comps = circuitStore.components;
    for (const comp of comps) {
      const el = this._elements.get(comp.id);
      if (!el || !('getPinPositions' in el)) continue;
      const positions = (el as { getPinPositions: () => Map<string, { x: number; y: number }> }).getPinPositions();
      if (positions.size === 0) continue;

      for (const [pinName, local] of positions) {
        const ax = comp.x + local.x;
        const ay = comp.y + local.y;

        const isFromPin = this._wireDrawing?.fromCompId === comp.id &&
                          this._wireDrawing?.fromPin === pinName;

        // 핀 서클
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', `${ax}`);
        circle.setAttribute('cy', `${ay}`);
        circle.setAttribute('r', isFromPin ? '5' : '4');
        circle.setAttribute('fill', isFromPin ? '#ff0' : '#4af');
        circle.setAttribute('opacity', '0.0'); // 기본: 숨김
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '1');
        circle.style.cursor = 'crosshair';
        circle.style.transition = 'opacity 0.1s';

        // 그룹 호버 시 표시
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-comp', comp.id);
        g.setAttribute('data-pin', pinName);
        g.style.cursor = 'crosshair';

        // 마우스 진입/이탈 시 투명도 변경
        g.addEventListener('mouseenter', () => {
          circle.setAttribute('opacity', '0.85');
        });
        g.addEventListener('mouseleave', () => {
          if (!isFromPin) circle.setAttribute('opacity', '0.0');
        });

        // 클릭 → 와이어 드로잉 시작/완료
        g.addEventListener('click', (e) => {
          e.stopPropagation();
          this._handlePinClick(comp.id, pinName, ax, ay);
        });

        // 히트 영역 (넓은 투명 원)
        const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hitArea.setAttribute('cx', `${ax}`);
        hitArea.setAttribute('cy', `${ay}`);
        hitArea.setAttribute('r', '8');
        hitArea.setAttribute('fill', 'transparent');

        g.appendChild(hitArea);
        g.appendChild(circle);

        // 와이어 드로잉 중이면 시작 핀 강조
        if (isFromPin) {
          circle.setAttribute('opacity', '1');
          circle.setAttribute('fill', '#ff0');
        }

        this._pinLayer.appendChild(g);
      }
    }
  }

  private _handlePinClick(compId: string, pinName: string, ax: number, ay: number) {
    if (!this._wireDrawing) {
      // 와이어 드로잉 시작
      this._wireDrawing = { fromCompId: compId, fromPin: pinName, fromX: ax, fromY: ay };
      this._container.style.cursor = 'crosshair';
      this._renderPinPoints();
    } else {
      // 같은 핀 클릭 → 취소
      if (this._wireDrawing.fromCompId === compId && this._wireDrawing.fromPin === pinName) {
        this._wireDrawing = null;
        this._renderDrawingWire(null);
        this._container.style.cursor = 'default';
        this._renderPinPoints();
        return;
      }
      // 와이어 완성
      const wire: PlacedWire = {
        id: `wire-${Date.now()}`,
        fromCompId: this._wireDrawing.fromCompId,
        fromPin:    this._wireDrawing.fromPin,
        toCompId:   compId,
        toPin:      pinName,
      };
      circuitStore.addWire(wire);
      this._wireDrawing = null;
      this._renderDrawingWire(null);
      this._container.style.cursor = 'default';
    }
  }

  /** 그리는 중인 와이어 (rubber-band) 렌더링 */
  private _renderDrawingWire(mousePos: { x: number; y: number } | null) {
    while (this._drawLayer.firstChild) this._drawLayer.firstChild.remove();
    if (!this._wireDrawing || !mousePos) return;

    const { fromX, fromY } = this._wireDrawing;
    const dx = mousePos.x - fromX;
    const d = `M${fromX},${fromY} C${fromX + dx * 0.4},${fromY} ${mousePos.x - dx * 0.4},${mousePos.y} ${mousePos.x},${mousePos.y}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#4af');
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-dasharray', '6 4');
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.8');
    this._drawLayer.appendChild(path);

    // 시작점 강조
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', `${fromX}`);
    dot.setAttribute('cy', `${fromY}`);
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', '#ff0');
    dot.setAttribute('opacity', '0.9');
    this._drawLayer.appendChild(dot);
  }

  private _updatePinVisual(pin: number, value: number) {
    for (const comp of circuitStore.components) {
      for (const [pinName, target] of Object.entries(comp.connections)) {
        if (target === pin) {
          const el = this._elements.get(comp.id);
          if (el && 'setPinState' in el) {
            (el as { setPinState: (p: string, v: number) => void }).setPinState(pinName, value);
          }
        }
      }
    }
  }

  fitView() {
    this._transform = { x: 40, y: 40, scale: 1 };
    this._applyTransform();
  }

  zoomIn()  { this._zoomAt(this._container.clientWidth / 2, this._container.clientHeight / 2, 1.2); }
  zoomOut() { this._zoomAt(this._container.clientWidth / 2, this._container.clientHeight / 2, 0.8); }
}
