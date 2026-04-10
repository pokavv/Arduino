// ─── 와이어 렌더링 ────────────────────────────────────────────────────────────
// buildWirePath: 와이어 경로 계산 (순수 함수)
// WireRenderer:  SVG wiresLayer / endpointLayer에 와이어 및 끝점 도트를 렌더링

import { circuitStore, type PlacedWire } from '../stores/circuit-store.js';
import { WIRE_AUTO_COLORS, WIRE_AUTO_DEFAULT } from './pin-colors.js';
import type { WireEndpointDragState } from './canvas-interaction.js';

// ─── 경로 계산 (module-level 순수 함수) ──────────────────────────────────────

export function buildWirePath(
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

// ─── 와이어 색상 결정 ─────────────────────────────────────────────────────────

export function wireColor(wire: PlacedWire): string {
  if (wire.color) return wire.color;
  const p = wire.fromPin;
  for (const [pattern, color] of WIRE_AUTO_COLORS) {
    if (pattern.test(p)) return color;
  }
  return WIRE_AUTO_DEFAULT;
}

// ─── WireRenderer ─────────────────────────────────────────────────────────────

export type PinAbsPosResolver = (compId: string, pinName: string) => { x: number; y: number } | null;
export type PinPosWithBaseResolver = (compId: string, pinName: string, base: { x: number; y: number }) => { x: number; y: number } | null;

export class WireRenderer {
  constructor(
    private _wiresLayer:    SVGGElement,
    private _endpointLayer: SVGGElement,
    private _drawLayer:     SVGGElement,
    private _ctxMenuShow:   (wireId: string, clientX: number, clientY: number) => void,
    private _getPinAbsPos:        PinAbsPosResolver,
    private _getPinPosWithBase:   PinPosWithBaseResolver,
    private _onEndpointDragStart?: (drag: NonNullable<WireEndpointDragState>) => void,
  ) {}

  // ─── 정적 와이어 렌더 ──────────────────────────────────────────────────────

  renderWires() {
    while (this._wiresLayer.firstChild) this._wiresLayer.firstChild.remove();
    const selWireId = circuitStore.selectedWireId;

    for (const wire of circuitStore.wires) {
      const from = this._getPinAbsPos(wire.fromCompId, wire.fromPin);
      const to   = this._getPinAbsPos(wire.toCompId,   wire.toPin);
      if (!from || !to) continue;
      this._drawWirePath(wire, from, to, wire.id === selWireId);
    }
  }

  // ─── 드래그 중 라이브 렌더 ─────────────────────────────────────────────────

  renderWiresLive(dragId: string, liveX: number, liveY: number) {
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
      this.addEndpointDots(from, to, wireColor(wire));
    }
  }

  // ─── 끝점 도트 렌더 ────────────────────────────────────────────────────────

  renderEndpointDots() {
    while (this._endpointLayer.firstChild) this._endpointLayer.firstChild.remove();

    for (const wire of circuitStore.wires) {
      const from = this._getPinAbsPos(wire.fromCompId, wire.fromPin);
      const to   = this._getPinAbsPos(wire.toCompId,   wire.toPin);
      if (!from || !to) continue;
      this._addEndpointDotsForWire(wire, from, to);
    }
  }

  /** renderWiresLive 전용: 색상만 전달하는 단순 버전 (드래그 중 빠른 렌더) */
  addEndpointDots(
    from: { x: number; y: number },
    to:   { x: number; y: number },
    color: string,
  ) {
    for (const pos of [from, to]) {
      // 글로우
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', `${pos.x}`); glow.setAttribute('cy', `${pos.y}`);
      glow.setAttribute('r', '6'); glow.setAttribute('fill', color);
      glow.setAttribute('opacity', '0.25');
      glow.style.pointerEvents = 'none';
      this._endpointLayer.appendChild(glow);

      // 도트
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', `${pos.x}`); dot.setAttribute('cy', `${pos.y}`);
      dot.setAttribute('r', '4'); dot.setAttribute('fill', color);
      dot.setAttribute('stroke', '#000'); dot.setAttribute('stroke-width', '1');
      dot.setAttribute('opacity', '0.95');
      dot.style.pointerEvents = 'none';
      this._endpointLayer.appendChild(dot);
    }
  }

  /** 와이어별 끝점 도트 + 드래그 핸들 렌더 */
  private _addEndpointDotsForWire(
    wire: PlacedWire,
    from: { x: number; y: number },
    to:   { x: number; y: number },
  ) {
    const color = wireColor(wire);
    const endpoints = [
      { pos: from, isFromEnd: true,  fixedCompId: wire.toCompId,   fixedPin: wire.toPin,   fixedPos: to   },
      { pos: to,   isFromEnd: false, fixedCompId: wire.fromCompId, fixedPin: wire.fromPin, fixedPos: from },
    ];

    for (const ep of endpoints) {
      const { pos } = ep;

      // 히트 영역 (드래그 가능, 넓게)
      const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hitArea.setAttribute('cx', `${pos.x}`); hitArea.setAttribute('cy', `${pos.y}`);
      hitArea.setAttribute('r', '8'); hitArea.setAttribute('fill', 'transparent');
      hitArea.style.cursor = this._onEndpointDragStart ? 'grab' : 'default';
      hitArea.style.pointerEvents = this._onEndpointDragStart ? 'all' : 'none';

      // 글로우
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', `${pos.x}`); glow.setAttribute('cy', `${pos.y}`);
      glow.setAttribute('r', '6'); glow.setAttribute('fill', color);
      glow.setAttribute('opacity', '0.25');
      glow.style.pointerEvents = 'none';

      // 도트
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', `${pos.x}`); dot.setAttribute('cy', `${pos.y}`);
      dot.setAttribute('r', '4'); dot.setAttribute('fill', color);
      dot.setAttribute('stroke', '#000'); dot.setAttribute('stroke-width', '1');
      dot.setAttribute('opacity', '0.95');
      dot.style.pointerEvents = 'none';

      // 끝점 드래그 시작 핸들러
      if (this._onEndpointDragStart) {
        const onDragStart = this._onEndpointDragStart;
        hitArea.addEventListener('pointerdown', (e: PointerEvent) => {
          e.stopPropagation();
          hitArea.setPointerCapture(e.pointerId);
          onDragStart({
            wireId:      wire.id,
            isFromEnd:   ep.isFromEnd,
            fixedCompId: ep.fixedCompId,
            fixedPin:    ep.fixedPin,
            startX:      ep.fixedPos.x,
            startY:      ep.fixedPos.y,
            _orig: {
              id:         wire.id,
              fromCompId: wire.fromCompId,
              fromPin:    wire.fromPin,
              toCompId:   wire.toCompId,
              toPin:      wire.toPin,
              color:      wire.color,
            },
          });
        });
        hitArea.addEventListener('mouseenter', () => {
          glow.setAttribute('opacity', '0.5');
          dot.setAttribute('r', '5.5');
        });
        hitArea.addEventListener('mouseleave', () => {
          glow.setAttribute('opacity', '0.25');
          dot.setAttribute('r', '4');
        });
      }

      this._endpointLayer.appendChild(glow);
      this._endpointLayer.appendChild(dot);
      this._endpointLayer.appendChild(hitArea);
    }
  }

  // ─── 드로잉 중 점선 미리보기 렌더 ─────────────────────────────────────────

  renderDrawingWire(
    wireDrawing: { fromX: number; fromY: number } | null,
    mousePos: { x: number; y: number } | null,
    nearestPin?: { x: number; y: number } | null,
  ) {
    while (this._drawLayer.firstChild) this._drawLayer.firstChild.remove();
    if (!wireDrawing || !mousePos) return;

    const { fromX, fromY } = wireDrawing;

    // 마그넷 스냅: 가장 가까운 핀이 15px 이내면 스냅
    const SNAP_DIST = 15;
    const snapped = nearestPin !== null && nearestPin !== undefined && (() => {
      const dx2 = mousePos.x - nearestPin.x;
      const dy2 = mousePos.y - nearestPin.y;
      return Math.sqrt(dx2 * dx2 + dy2 * dy2) <= SNAP_DIST;
    })();

    const endX = snapped ? nearestPin!.x : mousePos.x;
    const endY = snapped ? nearestPin!.y : mousePos.y;
    const strokeColor = snapped ? '#44ff88' : '#4af';

    const dx = endX - fromX;
    const d  = `M${fromX},${fromY} C${fromX + dx * 0.4},${fromY} ${endX - dx * 0.4},${endY} ${endX},${endY}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d); path.setAttribute('stroke', strokeColor);
    path.setAttribute('stroke-width', snapped ? '2.4' : '1.8');
    path.setAttribute('stroke-dasharray', snapped ? '0' : '6 4');
    path.setAttribute('fill', 'none'); path.setAttribute('opacity', '0.9');
    this._drawLayer.appendChild(path);

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', `${fromX}`); dot.setAttribute('cy', `${fromY}`);
    dot.setAttribute('r', '4'); dot.setAttribute('fill', '#ff0'); dot.setAttribute('opacity', '0.9');
    this._drawLayer.appendChild(dot);

    // 스냅됐을 때 끝점 강조
    if (snapped) {
      const snapGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      snapGlow.setAttribute('cx', `${endX}`); snapGlow.setAttribute('cy', `${endY}`);
      snapGlow.setAttribute('r', '10'); snapGlow.setAttribute('fill', '#44ff88');
      snapGlow.setAttribute('opacity', '0.3');
      this._drawLayer.appendChild(snapGlow);

      const snapDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      snapDot.setAttribute('cx', `${endX}`); snapDot.setAttribute('cy', `${endY}`);
      snapDot.setAttribute('r', '5'); snapDot.setAttribute('fill', '#44ff88');
      snapDot.setAttribute('opacity', '0.95');
      this._drawLayer.appendChild(snapDot);
    }
  }

  // ─── 경유점 미드포인트 계산 ────────────────────────────────────────────────

  getWireMidpoint(wireId: string): { x: number; y: number } {
    const wire = circuitStore.wires.find(w => w.id === wireId);
    if (!wire) return { x: 0, y: 0 };
    const from = this._getPinAbsPos(wire.fromCompId, wire.fromPin);
    const to   = this._getPinAbsPos(wire.toCompId,   wire.toPin);
    if (!from || !to) return { x: 0, y: 0 };
    return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  }

  // ─── 경유점 핸들 렌더 ──────────────────────────────────────────────────────

  renderWaypointHandles(
    waypointLayer: SVGGElement,
    onDragStart: (wireId: string, origWaypoints: Array<{ x: number; y: number }>, startX: number, startY: number) => void,
  ) {
    while (waypointLayer.firstChild) waypointLayer.firstChild.remove();

    const selWireId = circuitStore.selectedWireId;
    if (!selWireId) return;

    const wire = circuitStore.wires.find(w => w.id === selWireId);
    if (!wire || wire.style === 'orthogonal') return; // orthogonal은 자동 라우팅

    // 경유점이 있으면 그 위치, 없으면 from-to 중간점
    const handlePos = wire.waypoints?.[0] ?? this.getWireMidpoint(wire.id);

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
    ] as [number, number, number, number][]) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', `${x1}`); line.setAttribute('y1', `${y1}`);
      line.setAttribute('x2', `${x2}`); line.setAttribute('y2', `${y2}`);
      line.setAttribute('stroke', '#fff'); line.setAttribute('stroke-width', '1.5');
      line.style.pointerEvents = 'none';
      g.appendChild(line);
    }

    g.appendChild(circle);

    // 드래그 시작
    g.addEventListener('pointerdown', (e: PointerEvent) => {
      e.stopPropagation();
      onDragStart(
        wire.id,
        wire.waypoints ? [...wire.waypoints] : [handlePos],
        e.clientX,
        e.clientY,
      );
      g.setPointerCapture(e.pointerId);
    });
    // 더블클릭 → 경유점 리셋
    g.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      circuitStore.updateWire(wire.id, { waypoints: [] });
    });

    waypointLayer.appendChild(g);
  }

  // ─── 내부 헬퍼 ────────────────────────────────────────────────────────────

  private _drawWirePath(
    wire: PlacedWire,
    from: { x: number; y: number },
    to:   { x: number; y: number },
    isSelected: boolean,
  ) {
    const color = wireColor(wire);
    const d = buildWirePath(from, to, wire.style, wire.waypoints ?? []);

    // 두께 계산: thin=1.5, normal=2.5(기본), thick=4
    const baseStrokeWidth =
      wire.thickness === 'thin'  ? 1.5 :
      wire.thickness === 'thick' ? 4   : 2.5;
    const shadowStrokeWidth = baseStrokeWidth + 1.5;

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
      this._ctxMenuShow(wire.id, e.clientX, e.clientY);
    });

    // 실제 선 — 그림자(underlayer) + 본선
    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    shadow.setAttribute('d', d);
    shadow.setAttribute('stroke', '#000');
    shadow.setAttribute('stroke-width', isSelected ? `${shadowStrokeWidth + 1}` : `${shadowStrokeWidth}`);
    shadow.setAttribute('fill', 'none');
    shadow.setAttribute('opacity', '0.35');
    shadow.style.pointerEvents = 'none';
    this._wiresLayer.appendChild(shadow);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', isSelected ? '#ffffff' : color);
    path.setAttribute('stroke-width', isSelected ? `${baseStrokeWidth + 0.5}` : `${baseStrokeWidth}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.95');
    path.style.pointerEvents = 'none';
    if (isSelected) path.setAttribute('stroke-dasharray', '7 3');

    this._wiresLayer.appendChild(hit);
    this._wiresLayer.appendChild(path);

    // 레이블 렌더링 — 와이어 중간 지점에 텍스트 표시
    if (wire.label) {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;

      // 레이블 배경
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.setAttribute('x', `${midX}`);
      labelText.setAttribute('y', `${midY}`);
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('dominant-baseline', 'middle');
      labelText.setAttribute('font-size', '9');
      labelText.setAttribute('font-family', 'monospace');
      labelText.setAttribute('fill', color);
      labelText.setAttribute('stroke', '#111');
      labelText.setAttribute('stroke-width', '2.5');
      labelText.setAttribute('paint-order', 'stroke');
      labelText.setAttribute('opacity', '0.95');
      labelText.style.pointerEvents = 'none';
      labelText.textContent = wire.label;

      this._wiresLayer.appendChild(labelBg);
      this._wiresLayer.appendChild(labelText);
    }
  }
}
