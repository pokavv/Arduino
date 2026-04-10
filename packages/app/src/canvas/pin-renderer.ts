// ─── 핀 포인트 렌더링 ─────────────────────────────────────────────────────────
// 핀 기능별 색상 결정, 핀 포인트 SVG 렌더링, 핀 절대 좌표 계산 헬퍼

import { circuitStore } from '../stores/circuit-store.js';
import { getCachedCompDef } from '../stores/comp-def-cache.js';
import { type SimElementLike } from './sim-element-types.js';

// ─── 핀 기능별 색상 ──────────────────────────────────────────────────────────

export function pinFillColor(pinName: string): string {
  if (/^VCC$|^ANODE$|^RED$|^V\+/i.test(pinName))      return '#ff5555';
  if (/^GND$/i.test(pinName))                          return '#44dd88';
  if (/^SIGNAL$|^SIG$|^TRIG$|^PWM/i.test(pinName))   return '#ffaa33';
  if (/^DATA$|^DIN$|^ECHO$|^SDA$|^SCL$/i.test(pinName)) return '#5599ff';
  if (/^WIPER$/i.test(pinName))                        return '#cc77ff';
  if (/^COMMON$/i.test(pinName))                       return '#dddddd';
  if (/^GREEN$/i.test(pinName))                        return '#44ee77';
  if (/^BLUE$/i.test(pinName))                         return '#5599ff';
  if (/^PIN1/i.test(pinName))                          return '#6688ff';
  if (/^PIN2/i.test(pinName))                          return '#ffaa44';
  return '#44aaff';
}

// ─── 핀 절대 좌표 계산 ───────────────────────────────────────────────────────

export function getPinAbsPos(
  elements: Map<string, SimElementLike>,
  compId: string,
  pinName: string,
): { x: number; y: number } | null {
  const comp = circuitStore.components.find(c => c.id === compId);
  if (!comp) return null;
  return getPinPosWithBase(elements, compId, pinName, { x: comp.x, y: comp.y });
}

export function getPinPosWithBase(
  elements: Map<string, SimElementLike>,
  compId: string,
  pinName: string,
  base: { x: number; y: number },
): { x: number; y: number } | null {
  const el = elements.get(compId);
  if (el && 'getPinPositions' in el) {
    const positions = el.getPinPositions();
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

export function getPinsForComp(
  elements: Map<string, SimElementLike>,
  compId: string,
): Map<string, { x: number; y: number }> {
  const el = elements.get(compId);
  let pinMap = new Map<string, { x: number; y: number }>();
  if (el && 'getPinPositions' in el) pinMap = el.getPinPositions();
  if (pinMap.size === 0) {
    const comp = circuitStore.components.find(c => c.id === compId);
    const def = comp ? getCachedCompDef(comp.type) : undefined;
    if (def) for (const p of def.pins) pinMap.set(p.name, { x: p.x, y: p.y });
  }
  return pinMap;
}

// ─── PinRenderer ──────────────────────────────────────────────────────────────

export type WireDrawingState = {
  fromCompId: string;
  fromPin: string;
  fromX: number;
  fromY: number;
} | null;

export class PinRenderer {
  constructor(
    private _pinLayer: SVGGElement,
    private _elements: Map<string, SimElementLike>,
    private _onPinClick: (compId: string, pinName: string, ax: number, ay: number) => void,
  ) {}

  renderPinPoints(wireDrawing: WireDrawingState) {
    while (this._pinLayer.firstChild) this._pinLayer.firstChild.remove();

    const selPin = circuitStore.selectedPin;

    for (const comp of circuitStore.components) {
      const pins = getPinsForComp(this._elements, comp.id);
      if (pins.size === 0) continue;

      for (const [pinName, local] of pins) {
        const ax = comp.x + local.x;
        const ay = comp.y + local.y;
        const isFrom   = wireDrawing?.fromCompId === comp.id && wireDrawing?.fromPin === pinName;
        const isSelPin = selPin?.compId === comp.id && selPin?.pinName === pinName;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-comp', comp.id);
        g.setAttribute('data-pin',  pinName);
        g.style.cursor = 'crosshair';

        // 핀 기능별 색상
        const color = isFrom ? '#ffee00' : isSelPin ? '#cc44ff' : pinFillColor(pinName);
        const baseOpacity = (isFrom || isSelPin) ? '1' : '0.55';
        const baseR = (isFrom || isSelPin) ? '6' : '5';

        // 히트 영역 (투명, 크게)
        const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hitArea.setAttribute('cx', `${ax}`); hitArea.setAttribute('cy', `${ay}`);
        hitArea.setAttribute('r', '12'); hitArea.setAttribute('fill', 'transparent');

        // 활성 상태 글로우
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glow.setAttribute('cx', `${ax}`); glow.setAttribute('cy', `${ay}`);
        glow.setAttribute('r', '10');
        glow.setAttribute('fill', color);
        glow.setAttribute('opacity', (isFrom || isSelPin) ? '0.25' : '0');
        glow.style.transition = 'opacity 0.1s';

        // 핀 서클 (항상 표시)
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', `${ax}`); circle.setAttribute('cy', `${ay}`);
        circle.setAttribute('r', baseR);
        circle.setAttribute('fill', color);
        circle.setAttribute('opacity', baseOpacity);
        circle.setAttribute('stroke', '#000'); circle.setAttribute('stroke-width', '1.2');
        circle.style.transition = 'opacity 0.1s';

        // 핀 이름 레이블 배경 (hover 시 표시)
        const labelText = pinName.length > 6 ? pinName.slice(0, 6) : pinName;
        const labelW = labelText.length * 7 + 8;
        const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        labelBg.setAttribute('x', `${ax + 8}`); labelBg.setAttribute('y', `${ay - 8}`);
        labelBg.setAttribute('width', `${labelW}`); labelBg.setAttribute('height', '14');
        labelBg.setAttribute('rx', '3'); labelBg.setAttribute('fill', '#060810');
        labelBg.setAttribute('stroke', color); labelBg.setAttribute('stroke-width', '0.8');
        labelBg.setAttribute('opacity', '0');
        labelBg.style.transition = 'opacity 0.1s';
        labelBg.style.pointerEvents = 'none';

        // 핀 이름 레이블 텍스트 (hover 시 표시)
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', `${ax + 12}`); label.setAttribute('y', `${ay + 2.5}`);
        label.setAttribute('font-size', '8.5'); label.setAttribute('fill', color);
        label.setAttribute('font-family', 'monospace'); label.setAttribute('font-weight', 'bold');
        label.setAttribute('opacity', '0');
        label.style.transition = 'opacity 0.1s';
        label.style.pointerEvents = 'none';
        label.textContent = labelText;

        g.addEventListener('mouseenter', () => {
          circle.setAttribute('opacity', '1');
          circle.setAttribute('r', '6.5');
          glow.setAttribute('opacity', '0.3');
          labelBg.setAttribute('opacity', '1');
          label.setAttribute('opacity', '1');
        });
        g.addEventListener('mouseleave', () => {
          if (!isFrom && !isSelPin) {
            circle.setAttribute('opacity', '0.55');
            circle.setAttribute('r', '5');
            glow.setAttribute('opacity', '0');
          }
          labelBg.setAttribute('opacity', '0');
          label.setAttribute('opacity', '0');
        });

        // 좌클릭 → 와이어 드로잉
        g.addEventListener('click', (e) => {
          e.stopPropagation();
          this._onPinClick(comp.id, pinName, ax, ay);
        });
        // 우클릭 → 핀 선택 (속성 패널)
        g.addEventListener('contextmenu', (e) => {
          e.preventDefault(); e.stopPropagation();
          circuitStore.selectPin(comp.id, pinName);
        });

        g.appendChild(hitArea);
        g.appendChild(glow);
        g.appendChild(labelBg);
        g.appendChild(circle);
        g.appendChild(label);
        this._pinLayer.appendChild(g);
      }
    }
  }
}
