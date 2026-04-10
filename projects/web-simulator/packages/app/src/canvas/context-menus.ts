// ─── 컨텍스트 메뉴 ────────────────────────────────────────────────────────────
// CompContextMenu:   부품 우클릭 메뉴 (회전 / 복제 / 삭제)
// WireContextMenu:   와이어 우클릭 메뉴 (라우팅 스타일 / 삭제)
// CanvasContextMenu: 빈 캔버스 우클릭 메뉴 (전체 선택 / 붙여넣기 / 화면 맞춤)

import { circuitStore, type PlacedWire } from '../stores/circuit-store.js';

export class CompContextMenu {
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

export class WireContextMenu {
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

// ─── 빈 캔버스 배경 우클릭 메뉴 ─────────────────────────────────────────────

export type CanvasCtxCallbacks = {
  fitView(): void;
};

export class CanvasContextMenu {
  private _el: HTMLDivElement;
  private _canvasX = 0;
  private _canvasY = 0;
  private _cb: CanvasCtxCallbacks;

  constructor(cb: CanvasCtxCallbacks) {
    this._cb = cb;
    this._el = document.createElement('div');
    this._el.id = 'canvas-ctx-menu';
    this._el.className = 'ctx-menu';
    this._el.style.display = 'none';
    document.body.appendChild(this._el);

    document.addEventListener('click', () => this.hide());
    document.addEventListener('contextmenu', (e) => {
      if (e.target !== this._el && !this._el.contains(e.target as Node)) this.hide();
    });
  }

  show(clientX: number, clientY: number, canvasX: number, canvasY: number) {
    this._canvasX = canvasX;
    this._canvasY = canvasY;

    const hasComps = circuitStore.components.length > 0;
    const hasSel   = circuitStore.selectedId != null;
    const hasClip  = circuitStore.clipboardComp != null;

    this._el.innerHTML = `
      <div class="ctx-item${hasSel ? '' : ' disabled'}" data-action="copy">⎘ 복사</div>
      <div class="ctx-item${hasClip ? '' : ' disabled'}" data-action="paste">⎙ 붙여넣기</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item${hasComps ? '' : ' disabled'}" data-action="select-all">☰ 전체 선택</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" data-action="fit">⊡ 화면 맞춤</div>
    `;

    this._el.querySelector('[data-action="copy"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!hasSel) return;
      const comp = circuitStore.components.find(c => c.id === circuitStore.selectedId);
      if (comp) circuitStore.copyComponent(comp.id);
      this.hide();
    });

    this._el.querySelector('[data-action="paste"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!hasClip) return;
      circuitStore.pasteComponent(this._canvasX, this._canvasY);
      this.hide();
    });

    this._el.querySelector('[data-action="select-all"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!hasComps) return;
      circuitStore.selectAll();
      this.hide();
    });

    this._el.querySelector('[data-action="fit"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._cb.fitView();
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
  }
}
