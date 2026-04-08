import { circuitStore, type PlacedComponent, type PlacedWire } from '../stores/circuit-store.js';
import { getSpec } from '../../../elements/src/specs/component-specs.js';

/**
 * 속성 패널
 * 선택된 컴포넌트 또는 와이어의 전기적 사양과 속성을 표시합니다.
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

    if (comp) {
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

  private _renderComponent(comp: PlacedComponent) {
    const spec = getSpec(comp.type);
    const typeLabel = spec?.name ?? comp.type;
    const typeIcon = COMP_ICONS[comp.type] ?? '📦';

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

    // 위치 정보
    html += `
      <div class="prop-section">
        <div class="prop-section-title">위치</div>
        <div class="prop-row">
          <span class="prop-label">X</span>
          <span class="prop-value">${Math.round(comp.x)}px</span>
        </div>
        <div class="prop-row">
          <span class="prop-label">Y</span>
          <span class="prop-value">${Math.round(comp.y)}px</span>
        </div>
      </div>
    `;

    // 편집 가능한 속성
    if (comp.type === 'led' || comp.type === 'rgb-led') {
      html += `
        <div class="prop-section">
          <div class="prop-section-title">속성</div>
          <div class="prop-row">
            <span class="prop-label">색상</span>
            <select class="prop-select" data-action="set-prop" data-key="color">
              ${['red','green','blue','yellow','white','orange','purple'].map(c =>
                `<option value="${c}" ${comp.props.color === c ? 'selected' : ''}>${c}</option>`
              ).join('')}
            </select>
          </div>
        </div>
      `;
    }

    if (comp.type === 'resistor') {
      html += `
        <div class="prop-section">
          <div class="prop-section-title">속성</div>
          <div class="prop-row">
            <span class="prop-label">저항값</span>
            <input class="prop-input" type="number" min="1" max="10000000"
              data-action="set-prop" data-key="ohms"
              value="${comp.props.ohms ?? 220}">
            <span class="prop-unit">Ω</span>
          </div>
        </div>
      `;
    }

    if (comp.type === 'dht') {
      html += `
        <div class="prop-section">
          <div class="prop-section-title">센서 값 (시뮬레이션)</div>
          <div class="prop-row">
            <span class="prop-label">온도</span>
            <input class="prop-input" type="number" step="0.1" min="-40" max="80"
              data-action="set-prop" data-key="temperature"
              value="${comp.props.temperature ?? 25}">
            <span class="prop-unit">°C</span>
          </div>
          <div class="prop-row">
            <span class="prop-label">습도</span>
            <input class="prop-input" type="number" step="1" min="0" max="100"
              data-action="set-prop" data-key="humidity"
              value="${comp.props.humidity ?? 60}">
            <span class="prop-unit">%</span>
          </div>
        </div>
      `;
    }

    if (comp.type === 'ultrasonic') {
      html += `
        <div class="prop-section">
          <div class="prop-section-title">센서 값 (시뮬레이션)</div>
          <div class="prop-row">
            <span class="prop-label">거리</span>
            <input class="prop-input" type="number" min="2" max="400"
              data-action="set-prop" data-key="distanceCm"
              value="${comp.props.distanceCm ?? 20}">
            <span class="prop-unit">cm</span>
          </div>
        </div>
      `;
    }

    // 전기적 사양
    if (spec) {
      html += `<div class="prop-section"><div class="prop-section-title">전기적 사양</div>`;

      if (spec.operatingVoltageMin !== undefined) {
        html += `
          <div class="prop-row">
            <span class="prop-label">동작 전압</span>
            <span class="prop-value">${spec.operatingVoltageMin}~${spec.operatingVoltageMax}V</span>
          </div>
        `;
      }
      if (spec.currentMa !== undefined) {
        html += `
          <div class="prop-row">
            <span class="prop-label">동작 전류</span>
            <span class="prop-value">${spec.currentMa}mA${spec.maxCurrentMa ? ` (최대 ${spec.maxCurrentMa}mA)` : ''}</span>
          </div>
        `;
      }
      if (spec.forwardVoltage && comp.props.color) {
        const vf = spec.forwardVoltage[comp.props.color as string];
        if (vf) {
          html += `
            <div class="prop-row">
              <span class="prop-label">순방향 전압 Vf</span>
              <span class="prop-value spec-highlight">${vf}V (${comp.props.color})</span>
            </div>
          `;
          if (spec.recommendedResistorOhms) {
            // 5V 시스템 기준 권장 저항값 계산
            const r5v = Math.round((5 - vf) / 0.02);
            const r33v = Math.round((3.3 - vf) / 0.02);
            html += `
              <div class="prop-row">
                <span class="prop-label">권장 저항</span>
                <span class="prop-value spec-highlight">
                  5V: ${r5v}Ω / 3.3V: ${r33v}Ω
                </span>
              </div>
            `;
          }
        }
      }
      html += `</div>`;

      // 핀 설명
      if (spec.pins) {
        html += `<div class="prop-section"><div class="prop-section-title">핀 정보</div>`;
        for (const [pinName, pinInfo] of Object.entries(spec.pins)) {
          const pinTypeClass = `pin-type-${pinInfo.type}`;
          html += `
            <div class="prop-pin-row">
              <span class="prop-pin-name ${pinTypeClass}">${pinName}</span>
              <span class="prop-pin-desc">${pinInfo.description}</span>
            </div>
          `;
        }
        html += `</div>`;
      }

      // 주의사항
      if (spec.notes?.length) {
        html += `<div class="prop-section"><div class="prop-section-title">📌 주의사항</div>`;
        for (const note of spec.notes) {
          html += `<div class="prop-note">• ${note}</div>`;
        }
        html += `</div>`;
      }
    }

    this._el.innerHTML = html;
    this._bindComponentEvents(comp);
  }

  private _renderWire(wire: PlacedWire) {
    const fromComp = circuitStore.components.find(c => c.id === wire.fromCompId);
    const toComp   = circuitStore.components.find(c => c.id === wire.toCompId);

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
          <span class="prop-value">${fromComp?.type ?? '?'} / <b>${wire.fromPin}</b></span>
        </div>
        <div class="prop-row">
          <span class="prop-label">끝</span>
          <span class="prop-value">${toComp?.type ?? '?'} / <b>${wire.toPin}</b></span>
        </div>
      </div>
      <div class="prop-note" style="margin-top:8px">
        Delete 키로 삭제할 수 있습니다
      </div>
    `;

    this._el.querySelector('[data-action="delete-wire"]')?.addEventListener('click', () => {
      circuitStore.removeWire(wire.id);
    });
  }

  private _bindComponentEvents(comp: PlacedComponent) {
    this._el.querySelector('[data-action="delete-comp"]')?.addEventListener('click', () => {
      circuitStore.removeComponent(comp.id);
    });

    this._el.querySelectorAll('[data-action="set-prop"]').forEach(el => {
      const key = (el as HTMLElement).dataset.key!;
      el.addEventListener('change', () => {
        const raw = (el as HTMLInputElement | HTMLSelectElement).value;
        const val = el.getAttribute('type') === 'number' ? parseFloat(raw) : raw;
        circuitStore.updateComponent(comp.id, {
          props: { ...comp.props, [key]: val },
        });
      });
    });
  }
}

// 컴포넌트 타입별 아이콘
const COMP_ICONS: Record<string, string> = {
  led:           '💡',
  'rgb-led':     '🌈',
  button:        '🔘',
  resistor:      '〰️',
  buzzer:        '🔊',
  potentiometer: '🔄',
  servo:         '⚙️',
  dht:           '🌡️',
  ultrasonic:    '📡',
  lcd:           '🖥️',
  oled:          '📺',
  'seven-segment':'7️⃣',
  neopixel:      '✨',
  'board-uno':   '🟢',
  'board-esp32c3':'🔵',
};
