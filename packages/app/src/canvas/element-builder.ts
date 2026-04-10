// ─── 부품 엘리먼트 생성 및 이벤트 바인딩 ──────────────────────────────────────
// _buildElement 로직 분리: Lit Custom Element 생성 + 이벤트 리스너 등록

import { circuitStore, type PlacedComponent } from '../stores/circuit-store.js';
import { simController } from '../stores/sim-controller.js';
import { type CompDef } from '../stores/comp-def-cache.js';
import { type SimElementLike } from './sim-element-types.js';
import { type DraggingState, type WireDrawingState } from './canvas-interaction.js';

export interface BuildElementContext {
  getWireDrawing(): WireDrawingState;
  getDragging(): DraggingState;
  setDragging(s: DraggingState): void;
  showCompCtxMenu(compId: string, clientX: number, clientY: number): void;
}

/**
 * 지정 tag로 Lit Custom Element를 생성하고 이벤트 리스너를 등록한다.
 * 공유 상태는 ctx를 통해 주입받아 파사드와의 결합을 최소화한다.
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

  // sim-interaction-start/end: 포텐셔미터 노브 등 내부 인터랙션 중 드래그 차단
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
    circuitStore.selectComponent(comp.id);
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

  el.addEventListener('sim-change', (e: Event) => {
    simController.sendSensorUpdate(comp.id, (e as CustomEvent).detail);
  });

  // 보드 BOOT 버튼: GPIO 직접 주입
  el.addEventListener('sim-pin-press', (e: Event) => {
    const gpio = (e as CustomEvent).detail?.gpio;
    if (typeof gpio === 'number') simController.sendPinEvent(gpio, 0);
  });
  el.addEventListener('sim-pin-release', (e: Event) => {
    const gpio = (e as CustomEvent).detail?.gpio;
    if (typeof gpio === 'number') simController.sendPinEvent(gpio, 1);
  });

  // 보드 RST 버튼: 시뮬레이션 재시작
  el.addEventListener('sim-reset', () => {
    if (circuitStore.simState === 'running') {
      simController.stop();
      setTimeout(() => simController.start(), 300);
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
