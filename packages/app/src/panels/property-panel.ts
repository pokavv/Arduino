import { circuitStore, type PlacedComponent, type PlacedWire } from '../stores/circuit-store.js';
import { getCachedCompDef } from '../stores/comp-def-cache.js';

const API_BASE = '/api';

/** 서버에서 가져온 컴포넌트 정의 캐시 */
const _defCache = new Map<string, ComponentDefRemote>();

interface PinDefRemote {
  name: string;
  label: string;
  description: string;
  type: string;
  required: boolean;
}

interface PropDefRemote {
  key: string;
  label: string;
  type: string;
  default: unknown;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

interface ComponentDefRemote {
  id: string;
  name: string;
  category: string;
  description: string;
  element: string;
  props: PropDefRemote[];
  pins: PinDefRemote[];
  electrical: {
    vccMin?: number;
    vccMax?: number;
    currentMa?: number;
    maxCurrentMa?: number;
    forwardVoltage?: Record<string, number>;
    logic?: string;
    pinMaxCurrentMa?: number;
  };
  validation: Array<{ rule: string; message: string; severity: string; pin?: string }>;
  notes: string[];
}

async function fetchDef(type: string): Promise<ComponentDefRemote | null> {
  if (_defCache.has(type)) return _defCache.get(type)!;
  try {
    const r = await fetch(`${API_BASE}/components/${type}`);
    if (!r.ok) return null;
    const def = await r.json() as ComponentDefRemote;
    _defCache.set(type, def);
    return def;
  } catch {
    return null;
  }
}

/**
 * 속성 패널
 * 선택된 컴포넌트 또는 와이어의 전기적 사양과 속성을 표시합니다.
 * 컴포넌트 정의는 /api/components/:id 에서 가져옵니다.
 */
export class PropertyPanel {
  private _el: HTMLElement;

  constructor(container: HTMLElement) {
    this._el = container;
    circuitStore.subscribe(() => this._render());
    this._render();
  }

  private _render() {
    const comp = circuitStore.selectedComponent;
    const wire = circuitStore.selectedWire;
    const pin  = circuitStore.selectedPin;

    if (pin) {
      this._renderPin(pin.compId, pin.pinName);
    } else if (comp) {
      this._renderComponent(comp);
    } else if (wire) {
      this._renderWire(wire);
    } else {
      this._renderEmpty();
    }
  }

  private _renderEmpty() {
    this._el.innerHTML = `
      <div class="prop-empty">
        <div class="prop-empty-icon">🔌</div>
        <div>부품 또는 와이어를 선택하면<br>속성이 표시됩니다</div>
      </div>
    `;
  }

  private async _renderComponent(comp: PlacedComponent) {
    // 즉시 기본 뷰 표시 (서버 응답 대기 중)
    this._el.innerHTML = this._buildComponentBasicHtml(comp, null);
    this._bindComponentEvents(comp, null);

    // 서버에서 상세 정의 가져오기
    const def = await fetchDef(comp.type);
    if (circuitStore.selectedComponent?.id !== comp.id) return; // 이미 선택 해제됨

    this._el.innerHTML = this._buildComponentBasicHtml(comp, def);
    this._bindComponentEvents(comp, def);
  }

  private _buildComponentBasicHtml(
    comp: PlacedComponent,
    def: ComponentDefRemote | null,
  ): string {
    const typeLabel = def?.name ?? comp.type;
    const typeIcon = getCachedCompDef(comp.type)?.icon ?? '📦';

    let html = `
      <div class="prop-header">
        <span class="prop-icon">${typeIcon}</span>
        <div>
          <div class="prop-title">${typeLabel}</div>
          <div class="prop-id">${comp.id}</div>
        </div>
        <button class="prop-delete" data-action="delete-comp" title="삭제 (Delete)">🗑</button>
      </div>
    `;

    // 위치
    html += `
      <div class="prop-section">
        <div class="prop-section-title">위치</div>
        <div class="prop-row">
          <span class="prop-label">X</span><span class="prop-value">${Math.round(comp.x)}px</span>
        </div>
        <div class="prop-row">
          <span class="prop-label">Y</span><span class="prop-value">${Math.round(comp.y)}px</span>
        </div>
      </div>
    `;

    if (!def) {
      html += `<div class="prop-note" style="color:#555">📡 서버에서 사양 로드 중...</div>`;
      return html;
    }

    // 서버 정의 기반 편집 가능 props
    const editableProps = def.props.filter(p => p.type !== 'boolean' || true);
    if (editableProps.length > 0) {
      html += `<div class="prop-section"><div class="prop-section-title">속성</div>`;
      for (const p of editableProps) {
        const currentVal = comp.props[p.key] ?? p.default;
        if (p.type === 'select') {
          html += `
            <div class="prop-row">
              <span class="prop-label">${p.label}</span>
              <select class="prop-select" data-action="set-prop" data-key="${p.key}">
                ${(p.options ?? []).map(opt =>
                  `<option value="${opt}" ${String(currentVal) === String(opt) ? 'selected' : ''}>${opt}</option>`
                ).join('')}
              </select>
            </div>
          `;
        } else if (p.type === 'number') {
          html += `
            <div class="prop-row">
              <span class="prop-label">${p.label}</span>
              <input class="prop-input" type="number"
                ${p.min !== undefined ? `min="${p.min}"` : ''}
                ${p.max !== undefined ? `max="${p.max}"` : ''}
                ${p.step !== undefined ? `step="${p.step}"` : ''}
                data-action="set-prop" data-key="${p.key}"
                value="${currentVal}">
              ${p.unit ? `<span class="prop-unit">${p.unit}</span>` : ''}
            </div>
          `;
        } else if (p.type === 'boolean') {
          html += `
            <div class="prop-row">
              <span class="prop-label">${p.label}</span>
              <input type="checkbox" data-action="set-prop" data-key="${p.key}"
                ${currentVal ? 'checked' : ''}>
            </div>
          `;
        }
      }
      html += `</div>`;
    }

    // 전기적 사양
    const e = def.electrical;
    html += `<div class="prop-section"><div class="prop-section-title">전기적 사양</div>`;
    if (e.vccMin !== undefined) {
      html += `<div class="prop-row"><span class="prop-label">동작 전압</span>
        <span class="prop-value">${e.vccMin}~${e.vccMax}V</span></div>`;
    }
    if (e.currentMa !== undefined) {
      html += `<div class="prop-row"><span class="prop-label">동작 전류</span>
        <span class="prop-value">${e.currentMa}mA${e.maxCurrentMa ? ` (최대 ${e.maxCurrentMa}mA)` : ''}</span></div>`;
    }
    if (e.logic) {
      html += `<div class="prop-row"><span class="prop-label">로직 레벨</span>
        <span class="prop-value spec-highlight">${e.logic}</span></div>`;
    }
    if (e.pinMaxCurrentMa) {
      html += `<div class="prop-row"><span class="prop-label">핀당 최대</span>
        <span class="prop-value">${e.pinMaxCurrentMa}mA</span></div>`;
    }
    // LED 순방향 전압 + 권장 저항 계산
    if (e.forwardVoltage && comp.props.color) {
      const vf = e.forwardVoltage[comp.props.color as string];
      if (vf) {
        const r5v  = Math.round((5 - vf) / 0.010);
        const r33v = Math.round((3.3 - vf) / 0.010);
        html += `
          <div class="prop-row"><span class="prop-label">Vf (${comp.props.color})</span>
            <span class="prop-value spec-highlight">${vf}V</span></div>
          <div class="prop-row"><span class="prop-label">권장 저항</span>
            <span class="prop-value spec-highlight">5V:${r5v}Ω / 3.3V:${r33v}Ω</span></div>
        `;
      }
    }
    html += `</div>`;

    // 핀 정보
    if (def.pins.length > 0) {
      html += `<div class="prop-section"><div class="prop-section-title">핀 정보</div>`;
      for (const pin of def.pins) {
        const typeClass = `pin-type-${pin.type}`;
        html += `
          <div class="prop-pin-row">
            <span class="prop-pin-name ${typeClass}">${pin.label ?? pin.name}</span>
            <span class="prop-pin-desc">${pin.description}</span>
          </div>
        `;
      }
      html += `</div>`;
    }

    // 주의사항
    if (def.notes.length > 0) {
      html += `<div class="prop-section"><div class="prop-section-title">📌 주의사항</div>`;
      for (const note of def.notes) {
        html += `<div class="prop-note">• ${note}</div>`;
      }
      html += `</div>`;
    }

    return html;
  }

  private async _renderPin(compId: string, pinName: string) {
    const comp = circuitStore.components.find(c => c.id === compId);
    if (!comp) { this._renderEmpty(); return; }

    // 즉시 기본 뷰
    this._el.innerHTML = this._buildPinHtml(comp, pinName, null);

    const def = await fetchDef(comp.type);
    if (circuitStore.selectedPin?.compId !== compId ||
        circuitStore.selectedPin?.pinName !== pinName) return;

    this._el.innerHTML = this._buildPinHtml(comp, pinName, def);

    this._el.querySelector('[data-action="deselect-pin"]')?.addEventListener('click', () => {
      circuitStore.selectPin(null);
    });
  }

  private _buildPinHtml(
    comp: PlacedComponent,
    pinName: string,
    def: ComponentDefRemote | null,
  ): string {
    const compLabel  = def?.name ?? comp.type;
    const compIcon   = getCachedCompDef(comp.type)?.icon ?? '📦';
    const pinDef     = def?.pins.find(p => p.name === pinName);
    const typeClass  = pinDef ? `pin-type-${pinDef.type}` : 'pin-type-signal';
    const typeLabel  = pinDef?.type ?? '—';

    // 연결된 와이어 및 GPIO 번호 찾기
    const wires = circuitStore.wires.filter(
      w => (w.fromCompId === comp.id && w.fromPin === pinName) ||
           (w.toCompId   === comp.id && w.toPin   === pinName)
    );
    const derived = circuitStore.getDerivedConnections();
    const gpio = derived.get(comp.id)?.[pinName];

    let html = `
      <div class="prop-header">
        <span class="prop-icon">${compIcon}</span>
        <div>
          <div class="prop-title">${compLabel}</div>
          <div class="prop-id">${comp.id}</div>
        </div>
        <button class="prop-delete" data-action="deselect-pin" title="선택 해제">✕</button>
      </div>
      <div class="prop-section">
        <div class="prop-section-title">핀 정보</div>
        <div class="prop-row">
          <span class="prop-label">핀 이름</span>
          <span class="prop-value">
            <span class="pin-info-badge ${typeClass}">${pinDef?.label ?? pinName}</span>
          </span>
        </div>
        <div class="prop-row">
          <span class="prop-label">유형</span>
          <span class="prop-value" style="text-transform:capitalize">${typeLabel}</span>
        </div>
        ${pinDef?.description ? `
        <div class="prop-row">
          <span class="prop-label">설명</span>
          <span class="prop-value" style="font-size:9px;color:#999">${pinDef.description}</span>
        </div>` : ''}
        ${pinDef?.required ? `
        <div class="prop-row">
          <span class="prop-label">필수</span>
          <span class="prop-value spec-highlight">필수 연결</span>
        </div>` : ''}
      </div>
    `;

    // GPIO/연결 상태
    html += `<div class="prop-section"><div class="prop-section-title">연결 상태</div>`;
    if (gpio !== undefined) {
      const gpioLabel = typeof gpio === 'number'
        ? `GPIO ${gpio}`
        : gpio === 'GND' ? '접지 (GND)'
        : gpio === 'VCC' ? '전원 5V (VCC)'
        : gpio === '3V3' ? '전원 3.3V'
        : String(gpio);
      html += `
        <div class="prop-row">
          <span class="prop-label">연결됨</span>
          <span class="prop-value spec-highlight">${gpioLabel}</span>
        </div>
      `;
    } else {
      html += `
        <div class="prop-row">
          <span class="prop-label">연결됨</span>
          <span class="prop-value" style="color:#555">미연결</span>
        </div>
      `;
    }

    if (wires.length > 0) {
      for (const w of wires) {
        const isFrom = w.fromCompId === comp.id;
        const otherCompId  = isFrom ? w.toCompId   : w.fromCompId;
        const otherPin     = isFrom ? w.toPin       : w.fromPin;
        const otherComp    = circuitStore.components.find(c => c.id === otherCompId);
        const otherLabel   = otherComp?.type ?? otherCompId;
        html += `
          <div class="prop-row">
            <span class="prop-label" style="color:#4af">→ 와이어</span>
            <span class="prop-value" style="font-size:9px">${otherLabel} · <b>${otherPin}</b></span>
          </div>
        `;
      }
    }
    html += `</div>`;

    if (!def) {
      html += `<div class="prop-note" style="color:#555">📡 사양 로드 중...</div>`;
    }

    return html;
  }

  private _renderWire(wire: PlacedWire) {
    const fromComp = circuitStore.components.find(c => c.id === wire.fromCompId);
    const toComp   = circuitStore.components.find(c => c.id === wire.toCompId);
    const style    = wire.style ?? 'bezier';

    const styleOpts: Array<{ value: string; label: string }> = [
      { value: 'bezier',     label: '곡선 (Bezier)' },
      { value: 'straight',   label: '직선 (Straight)' },
      { value: 'orthogonal', label: '직각 (Orthogonal)' },
    ];

    const colorOpts = [
      { value: '',      label: '자동' },
      { value: '#4af',  label: '파랑 (Signal)' },
      { value: '#e44',  label: '빨강 (VCC)' },
      { value: '#666',  label: '회색 (GND)' },
      { value: '#f84',  label: '주황 (3.3V)' },
      { value: '#4f4',  label: '초록' },
      { value: '#fff',  label: '흰색' },
    ];

    this._el.innerHTML = `
      <div class="prop-header">
        <span class="prop-icon">🔗</span>
        <div>
          <div class="prop-title">전선 (Wire)</div>
          <div class="prop-id">${wire.id}</div>
        </div>
        <button class="prop-delete" data-action="delete-wire" title="삭제 (Delete)">🗑</button>
      </div>
      <div class="prop-section">
        <div class="prop-section-title">연결 정보</div>
        <div class="prop-row">
          <span class="prop-label">시작</span>
          <span class="prop-value">${fromComp?.type ?? '?'} · <b>${wire.fromPin}</b></span>
        </div>
        <div class="prop-row">
          <span class="prop-label">끝</span>
          <span class="prop-value">${toComp?.type ?? '?'} · <b>${wire.toPin}</b></span>
        </div>
      </div>
      <div class="prop-section">
        <div class="prop-section-title">스타일</div>
        <div class="prop-row">
          <span class="prop-label">라우팅</span>
          <select class="prop-select" data-action="set-wire-style">
            ${styleOpts.map(o => `<option value="${o.value}" ${style === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
        <div class="prop-row">
          <span class="prop-label">색상</span>
          <select class="prop-select" data-action="set-wire-color">
            ${colorOpts.map(o => `<option value="${o.value}" ${(wire.color ?? '') === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
        ${wire.waypoints?.length ? `
        <div class="prop-row">
          <span class="prop-label">경유점</span>
          <span class="prop-value" style="color:#888">${wire.waypoints.length}개</span>
          <button class="toolbar-btn" style="font-size:9px;padding:1px 5px" data-action="clear-waypoints">초기화</button>
        </div>` : ''}
      </div>
      <div class="prop-note">Delete 키 또는 🗑 버튼으로 삭제</div>
    `;

    this._el.querySelector('[data-action="delete-wire"]')?.addEventListener('click', () => {
      circuitStore.removeWire(wire.id);
    });
    this._el.querySelector('[data-action="set-wire-style"]')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value as 'bezier' | 'straight' | 'orthogonal';
      circuitStore.updateWire(wire.id, { style: val });
    });
    this._el.querySelector('[data-action="set-wire-color"]')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value;
      circuitStore.updateWire(wire.id, { color: val || undefined });
    });
    this._el.querySelector('[data-action="clear-waypoints"]')?.addEventListener('click', () => {
      circuitStore.updateWire(wire.id, { waypoints: [] });
    });
  }

  private _bindComponentEvents(comp: PlacedComponent, _def: ComponentDefRemote | null) {
    this._el.querySelector('[data-action="delete-comp"]')?.addEventListener('click', () => {
      circuitStore.removeComponent(comp.id);
    });

    this._el.querySelectorAll('[data-action="set-prop"]').forEach(el => {
      const key = (el as HTMLElement).dataset.key!;
      el.addEventListener('change', () => {
        let val: unknown;
        if ((el as HTMLInputElement).type === 'checkbox') {
          val = (el as HTMLInputElement).checked;
        } else if ((el as HTMLInputElement).type === 'number') {
          val = parseFloat((el as HTMLInputElement).value);
        } else {
          val = (el as HTMLInputElement | HTMLSelectElement).value;
        }
        circuitStore.updateComponent(comp.id, {
          props: { ...comp.props, [key]: val },
        });
      });
    });
  }
}

