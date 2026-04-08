import { circuitStore, type PlacedComponent } from '../stores/circuit-store.js';
import { simController } from '../stores/sim-controller.js';

/**
 * 무한 캔버스 — SVG wire + Lit 컴포넌트 오버레이
 * Pan/Zoom: 마우스 휠 + 드래그
 */
export class CircuitCanvas {
  private _container: HTMLElement;
  private _svg!: SVGSVGElement;
  private _layer!: HTMLElement; // 컴포넌트들 올라가는 레이어
  private _wiresLayer!: SVGGElement;

  private _transform = { x: 0, y: 0, scale: 1 };
  private _panning = false;
  private _panStart = { x: 0, y: 0 };
  private _dragging: { id: string; startX: number; startY: number; ox: number; oy: number } | null = null;

  private _elements = new Map<string, HTMLElement>();

  constructor(container: HTMLElement) {
    this._container = container;
    this._buildDOM();
    this._bindEvents();

    circuitStore.subscribe(() => this._render());
    this._render();

    // 시뮬 엔진 → 컴포넌트 업데이트 연결
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
    this._container.innerHTML = '';
    this._container.style.cssText = `
      position: relative; overflow: hidden;
      width: 100%; height: 100%;
      background: #0f0f12;
      background-image:
        radial-gradient(circle, #333 1px, transparent 1px);
      background-size: 20px 20px;
      cursor: default;
    `;

    // SVG 레이어 (와이어용)
    this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this._svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    this._wiresLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._svg.appendChild(this._wiresLayer);
    this._container.appendChild(this._svg);

    // 컴포넌트 레이어
    this._layer = document.createElement('div');
    this._layer.style.cssText = 'position:absolute;top:0;left:0;transform-origin:0 0;z-index:2;';
    this._container.appendChild(this._layer);
  }

  private _bindEvents() {
    // Pan (휠 스크롤 / 중간버튼 드래그)
    this._container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const rect = this._container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this._zoomAt(mx, my, factor);
    }, { passive: false });

    this._container.addEventListener('pointerdown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        this._panning = true;
        this._panStart = { x: e.clientX - this._transform.x, y: e.clientY - this._transform.y };
        this._container.style.cursor = 'grabbing';
      } else if (e.button === 0 && e.target === this._container || e.target === this._svg || e.target === this._layer) {
        circuitStore.selectComponent(null);
      }
    });

    this._container.addEventListener('pointermove', (e) => {
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
        // 즉시 이동
        const el = this._elements.get(d.id);
        if (el) {
          el.style.left = `${newX}px`;
          el.style.top = `${newY}px`;
        }
        this._renderWires();
      }
    });

    this._container.addEventListener('pointerup', (e) => {
      if (this._panning) {
        this._panning = false;
        this._container.style.cursor = 'default';
      }
      if (this._dragging) {
        this._dragging = null;
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
    this._wiresLayer.setAttribute(
      'transform', `translate(${x} ${y}) scale(${scale})`
    );
  }

  private _render() {
    const comps = circuitStore.components;
    const selectedId = circuitStore.selectedId;

    // 기존 엘리먼트 중 삭제된 것 제거
    for (const [id, el] of this._elements) {
      if (!comps.find(c => c.id === id)) {
        el.remove();
        this._elements.delete(id);
      }
    }

    // 컴포넌트 추가/업데이트
    for (const comp of comps) {
      if (!this._elements.has(comp.id)) {
        this._createElement(comp);
      }
      const el = this._elements.get(comp.id)!;
      el.style.left = `${comp.x}px`;
      el.style.top = `${comp.y}px`;
      el.style.transform = `rotate(${comp.rotation ?? 0}deg)`;
      el.classList.toggle('selected', comp.id === selectedId);
    }

    this._renderWires();
  }

  private _createElement(comp: PlacedComponent) {
    const tagMap: Record<string, string> = {
      'board-uno': 'sim-board-uno',
      'board-esp32c3': 'sim-board-esp32c3',
      'led': 'sim-led',
      'rgb-led': 'sim-rgb-led',
      'button': 'sim-button',
      'resistor': 'sim-resistor',
      'buzzer': 'sim-buzzer',
      'potentiometer': 'sim-potentiometer',
      'seven-segment': 'sim-seven-segment',
      'lcd': 'sim-lcd',
      'oled': 'sim-oled',
      'dht': 'sim-dht',
      'ultrasonic': 'sim-ultrasonic',
      'servo': 'sim-servo',
      'neopixel': 'sim-neopixel',
    };

    const tag = tagMap[comp.type];
    if (!tag) return;

    const el = document.createElement(tag);
    el.style.cssText = `
      position: absolute;
      left: ${comp.x}px;
      top: ${comp.y}px;
      cursor: grab;
      user-select: none;
    `;

    // props 적용
    for (const [k, v] of Object.entries(comp.props)) {
      (el as HTMLElement & Record<string, unknown>)[k] = v;
    }

    // comp-id
    (el as HTMLElement & Record<string, unknown>)['compId'] = comp.id;

    // 드래그
    el.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      circuitStore.selectComponent(comp.id);
      this._dragging = {
        id: comp.id,
        startX: e.clientX,
        startY: e.clientY,
        ox: comp.x,
        oy: comp.y,
      };
      el.style.cursor = 'grabbing';
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointerup', (e: PointerEvent) => {
      el.style.cursor = 'grab';
      el.releasePointerCapture(e.pointerId);
    });

    // 버튼 이벤트 → 시뮬레이션 엔진
    if (comp.type === 'button') {
      el.addEventListener('sim-press', () => {
        const gpioPin = comp.connections['PIN1A'];
        if (typeof gpioPin === 'number') {
          simController.sendPinEvent(gpioPin, 1);
        }
        simController.sendSensorUpdate(comp.id, { value: 1 });
      });
      el.addEventListener('sim-release', () => {
        const gpioPin = comp.connections['PIN1A'];
        if (typeof gpioPin === 'number') {
          simController.sendPinEvent(gpioPin, 0);
        }
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

  private _renderWires() {
    // 연결선 렌더링
    while (this._wiresLayer.firstChild) this._wiresLayer.firstChild.remove();

    const comps = circuitStore.components;
    const boardEl = this._elements.get(comps.find(c => c.type.startsWith('board'))?.id ?? '');

    for (const comp of comps) {
      if (comp.type.startsWith('board')) continue;
      const el = this._elements.get(comp.id);
      if (!el) continue;

      for (const [_pinName, target] of Object.entries(comp.connections)) {
        if (typeof target !== 'number' && target !== 'GND' && target !== 'VCC' && target !== '5V' && target !== '3V3') continue;
        if (!boardEl) continue;

        // 와이어: 컴포넌트 중심 → 보드 핀
        const compRect = { x: comp.x, y: comp.y };
        const boardComp = comps.find(c => c.type.startsWith('board'));
        if (!boardComp) continue;

        const wireColor = target === 'GND' ? '#444' :
          (target === 'VCC' || target === '5V') ? '#f44' :
          target === '3V3' ? '#f84' : '#4af';

        const x1 = comp.x + 20;
        const y1 = comp.y + 30;
        const x2 = boardComp.x + 150;
        const y2 = boardComp.y + 100;
        const cx1 = x1 + (x2 - x1) * 0.3;
        const cy1 = y1;
        const cx2 = x2 - (x2 - x1) * 0.3;
        const cy2 = y2;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`);
        path.setAttribute('stroke', wireColor);
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', '0.6');
        this._wiresLayer.appendChild(path);
      }
    }
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

  zoomIn() { this._zoomAt(this._container.clientWidth / 2, this._container.clientHeight / 2, 1.2); }
  zoomOut() { this._zoomAt(this._container.clientWidth / 2, this._container.clientHeight / 2, 0.8); }
}
