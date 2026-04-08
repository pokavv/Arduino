/**
 * 부품 편집기 (모달)
 * /api/components CRUD를 통해 서버에 부품을 등록·수정합니다.
 */

const API = '/api/components';

type Category = 'passive' | 'active' | 'sensor' | 'display' | 'actuator' | 'power' | 'mcu';
type PinType = 'power'|'ground'|'digital'|'analog'|'pwm'|'i2c_sda'|'i2c_scl'|
               'spi_mosi'|'spi_miso'|'spi_sck'|'spi_ss'|'uart_tx'|'uart_rx'|
               'signal'|'output'|'input';

interface PinDef {
  name: string; label: string; description: string;
  type: PinType; required: boolean; compatibleWith: string[];
  x: number; y: number;
}

interface PropDef {
  key: string; label: string; type: string; default: unknown;
  options?: string[]; min?: number; max?: number; step?: number; unit?: string;
}

interface ComponentDefPartial {
  id: string; name: string; category: Category;
  tags: string[]; description: string;
  element?: string; svgTemplate?: string;
  width: number; height: number;
  defaultProps: Record<string, unknown>;
  props: PropDef[];
  pins: PinDef[];
  electrical: Record<string, unknown>;
  notes: string[];
  datasheet?: string;
}

export class ComponentEditor {
  private _modal: HTMLElement;
  private _onSave?: () => void;
  private _editingId: string | null = null;

  constructor() {
    this._modal = this._buildModal();
    document.body.appendChild(this._modal);
  }

  /** 새 부품 등록 모드로 열기 */
  openNew(onSave?: () => void) {
    this._editingId = null;
    this._onSave = onSave;
    this._fillForm(null);
    this._modal.style.display = 'flex';
  }

  /** 기존 부품 편집 모드로 열기 */
  async openEdit(id: string, onSave?: () => void) {
    this._onSave = onSave;
    this._editingId = id;
    try {
      const def = await fetch(`${API}/${id}`).then(r => r.json()) as ComponentDefPartial;
      this._fillForm(def);
      this._modal.style.display = 'flex';
    } catch {
      alert(`부품 로드 실패: ${id}`);
    }
  }

  private _buildModal(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'comp-editor-modal';
    el.style.cssText = `
      display: none; position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.75);
      align-items: center; justify-content: center;
    `;
    el.innerHTML = `
      <div class="comp-editor-box">
        <div class="comp-editor-header">
          <span id="comp-editor-title">부품 등록</span>
          <button id="comp-editor-close" class="comp-editor-close-btn">✕</button>
        </div>
        <div class="comp-editor-body">
          <div class="comp-editor-tabs">
            <button class="comp-tab active" data-tab="basic">기본 정보</button>
            <button class="comp-tab" data-tab="pins">핀 정의</button>
            <button class="comp-tab" data-tab="props">속성 정의</button>
            <button class="comp-tab" data-tab="electrical">전기 사양</button>
            <button class="comp-tab" data-tab="notes">주의사항</button>
            <button class="comp-tab" data-tab="svg">SVG 템플릿</button>
          </div>

          <!-- 기본 정보 -->
          <div class="comp-editor-pane active" id="tab-basic">
            <div class="ce-row">
              <label>ID <small>(소문자/하이픈, 변경 불가)</small></label>
              <input id="ce-id" type="text" placeholder="my-sensor" class="ce-input">
            </div>
            <div class="ce-row"><label>이름</label>
              <input id="ce-name" type="text" placeholder="내 센서" class="ce-input"></div>
            <div class="ce-row"><label>카테고리</label>
              <select id="ce-category" class="ce-input">
                ${['passive','active','sensor','display','actuator','power','mcu']
                  .map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="ce-row"><label>태그 <small>(쉼표 구분)</small></label>
              <input id="ce-tags" type="text" placeholder="sensor, i2c" class="ce-input"></div>
            <div class="ce-row"><label>설명</label>
              <textarea id="ce-description" class="ce-input" rows="2"></textarea></div>
            <div class="ce-row">
              <label>Lit element 태그 <small>(기존 요소 재사용 시)</small></label>
              <input id="ce-element" type="text" placeholder="sim-led" class="ce-input">
            </div>
            <div class="ce-row-2">
              <div class="ce-row"><label>너비 (px)</label>
                <input id="ce-width"  type="number" value="60" class="ce-input-sm"></div>
              <div class="ce-row"><label>높이 (px)</label>
                <input id="ce-height" type="number" value="60" class="ce-input-sm"></div>
            </div>
            <div class="ce-row"><label>데이터시트 URL</label>
              <input id="ce-datasheet" type="text" class="ce-input"></div>
          </div>

          <!-- 핀 정의 -->
          <div class="comp-editor-pane" id="tab-pins">
            <div class="ce-pin-list" id="ce-pin-list"></div>
            <button class="ce-add-btn" id="ce-add-pin">+ 핀 추가</button>
          </div>

          <!-- 속성 정의 -->
          <div class="comp-editor-pane" id="tab-props">
            <div class="ce-prop-list" id="ce-prop-list"></div>
            <button class="ce-add-btn" id="ce-add-prop">+ 속성 추가</button>
          </div>

          <!-- 전기 사양 -->
          <div class="comp-editor-pane" id="tab-electrical">
            <div class="ce-row-2">
              <div class="ce-row"><label>최소 전압 (V)</label>
                <input id="ce-vcc-min" type="number" step="0.1" class="ce-input-sm"></div>
              <div class="ce-row"><label>최대 전압 (V)</label>
                <input id="ce-vcc-max" type="number" step="0.1" class="ce-input-sm"></div>
            </div>
            <div class="ce-row-2">
              <div class="ce-row"><label>동작 전류 (mA)</label>
                <input id="ce-current" type="number" class="ce-input-sm"></div>
              <div class="ce-row"><label>최대 전류 (mA)</label>
                <input id="ce-max-current" type="number" class="ce-input-sm"></div>
            </div>
            <div class="ce-row"><label>로직 레벨</label>
              <select id="ce-logic" class="ce-input">
                <option value="">선택 안 함</option>
                <option value="3.3V">3.3V</option>
                <option value="5V">5V</option>
                <option value="both">둘 다 (both)</option>
              </select>
            </div>
            <div class="ce-row"><label>핀당 최대 전류 (mA)</label>
              <input id="ce-pin-max-current" type="number" class="ce-input-sm"></div>
          </div>

          <!-- 주의사항 -->
          <div class="comp-editor-pane" id="tab-notes">
            <div class="ce-row">
              <label>주의사항 <small>(한 줄에 하나씩)</small></label>
              <textarea id="ce-notes" class="ce-input" rows="8"
                placeholder="반드시 직렬 저항 필요&#10;최대 20mA 초과 금지"></textarea>
            </div>
          </div>

          <!-- SVG 템플릿 -->
          <div class="comp-editor-pane" id="tab-svg">
            <div class="ce-row">
              <label>SVG 마크업 <small>(element 없을 때 렌더링에 사용)</small></label>
              <textarea id="ce-svg" class="ce-input ce-mono" rows="12"
                placeholder="&lt;svg width=&quot;60&quot; height=&quot;60&quot;&gt;&#10;  &lt;rect ...&gt;&lt;/rect&gt;&#10;&lt;/svg&gt;"></textarea>
            </div>
            <div class="ce-row">
              <label>SVG 미리보기</label>
              <div id="ce-svg-preview" style="
                background:#111; border:1px solid #333; padding:10px;
                min-height:80px; display:flex; align-items:center; justify-content:center;
              "></div>
            </div>
          </div>
        </div>

        <div class="comp-editor-footer">
          <span id="ce-status" class="ce-status"></span>
          <button id="comp-editor-save" class="ce-save-btn">💾 저장</button>
        </div>
      </div>
    `;

    // 탭 전환
    el.querySelectorAll('.comp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.comp-tab').forEach(t => t.classList.remove('active'));
        el.querySelectorAll('.comp-editor-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        el.querySelector(`#tab-${(tab as HTMLElement).dataset.tab}`)?.classList.add('active');
      });
    });

    // SVG 미리보기
    el.querySelector('#ce-svg')?.addEventListener('input', () => {
      const svgStr = (el.querySelector('#ce-svg') as HTMLTextAreaElement).value;
      const preview = el.querySelector('#ce-svg-preview') as HTMLElement;
      preview.innerHTML = svgStr;
    });

    el.querySelector('#comp-editor-close')?.addEventListener('click', () => {
      el.style.display = 'none';
    });
    el.querySelector('#ce-add-pin')?.addEventListener('click', () => this._addPinRow());
    el.querySelector('#ce-add-prop')?.addEventListener('click', () => this._addPropRow());
    el.querySelector('#comp-editor-save')?.addEventListener('click', () => this._save());

    // 배경 클릭 시 닫기
    el.addEventListener('click', (e) => {
      if (e.target === el) el.style.display = 'none';
    });

    return el;
  }

  private _fillForm(def: ComponentDefPartial | null) {
    const get = (id: string) => this._modal.querySelector(`#${id}`) as HTMLInputElement | null;
    const set = (id: string, val: unknown) => {
      const el = get(id);
      if (el) el.value = String(val ?? '');
    };

    const isEdit = !!def;
    (this._modal.querySelector('#comp-editor-title') as HTMLElement).textContent =
      isEdit ? `부품 편집: ${def!.id}` : '새 부품 등록';

    const idInput = get('ce-id');
    if (idInput) {
      idInput.value = def?.id ?? '';
      idInput.readOnly = isEdit; // 편집 시 ID 변경 불가
      idInput.style.opacity = isEdit ? '0.5' : '1';
    }

    set('ce-name',         def?.name ?? '');
    set('ce-tags',         (def?.tags ?? []).join(', '));
    set('ce-description',  def?.description ?? '');
    set('ce-element',      def?.element ?? '');
    set('ce-width',        def?.width ?? 60);
    set('ce-height',       def?.height ?? 60);
    set('ce-datasheet',    def?.datasheet ?? '');
    set('ce-vcc-min',      def?.electrical?.vccMin ?? '');
    set('ce-vcc-max',      def?.electrical?.vccMax ?? '');
    set('ce-current',      def?.electrical?.currentMa ?? '');
    set('ce-max-current',  def?.electrical?.maxCurrentMa ?? '');
    set('ce-logic',        def?.electrical?.logic ?? '');
    set('ce-pin-max-current', def?.electrical?.pinMaxCurrentMa ?? '');
    set('ce-notes',        (def?.notes ?? []).join('\n'));
    set('ce-svg',          def?.svgTemplate ?? '');

    const catEl = this._modal.querySelector('#ce-category') as HTMLSelectElement | null;
    if (catEl) catEl.value = def?.category ?? 'passive';

    // 핀 목록
    const pinList = this._modal.querySelector('#ce-pin-list') as HTMLElement;
    pinList.innerHTML = '';
    for (const pin of (def?.pins ?? [])) {
      this._addPinRow(pin);
    }

    // 속성 목록
    const propList = this._modal.querySelector('#ce-prop-list') as HTMLElement;
    propList.innerHTML = '';
    for (const prop of (def?.props ?? [])) {
      this._addPropRow(prop);
    }

    (this._modal.querySelector('#ce-status') as HTMLElement).textContent = '';
  }

  private _addPinRow(pin?: PinDef) {
    const list = this._modal.querySelector('#ce-pin-list') as HTMLElement;
    const row = document.createElement('div');
    row.className = 'ce-pin-row';
    row.innerHTML = `
      <input type="text" placeholder="이름(ANODE)" class="ce-pin-name ce-input-sm" value="${pin?.name ?? ''}">
      <input type="text" placeholder="라벨(+)" class="ce-pin-label ce-input-xs" value="${pin?.label ?? ''}">
      <select class="ce-pin-type ce-input-sm">
        ${['power','ground','digital','analog','pwm','i2c_sda','i2c_scl',
           'spi_mosi','spi_miso','spi_sck','spi_ss','uart_tx','uart_rx',
           'signal','output','input'].map(t =>
          `<option value="${t}" ${pin?.type === t ? 'selected':''}>${t}</option>`
        ).join('')}
      </select>
      <input type="number" placeholder="X" class="ce-pin-x ce-input-xs" value="${pin?.x ?? 0}">
      <input type="number" placeholder="Y" class="ce-pin-y ce-input-xs" value="${pin?.y ?? 0}">
      <input type="text" placeholder="설명" class="ce-pin-desc ce-input" value="${pin?.description ?? ''}">
      <label class="ce-pin-req">
        <input type="checkbox" class="ce-pin-required" ${pin?.required ? 'checked':''}>필수
      </label>
      <button class="ce-remove-btn" title="삭제">✕</button>
    `;
    row.querySelector('.ce-remove-btn')?.addEventListener('click', () => row.remove());
    list.appendChild(row);
  }

  private _addPropRow(prop?: PropDef) {
    const list = this._modal.querySelector('#ce-prop-list') as HTMLElement;
    const row = document.createElement('div');
    row.className = 'ce-prop-row';
    row.innerHTML = `
      <input type="text" placeholder="key" class="ce-prop-key ce-input-sm" value="${prop?.key ?? ''}">
      <input type="text" placeholder="라벨" class="ce-prop-label ce-input-sm" value="${prop?.label ?? ''}">
      <select class="ce-prop-type ce-input-sm">
        ${['string','number','boolean','select','color'].map(t =>
          `<option value="${t}" ${prop?.type === t ? 'selected':''}>${t}</option>`
        ).join('')}
      </select>
      <input type="text" placeholder="기본값" class="ce-prop-default ce-input-sm" value="${prop?.default ?? ''}">
      <input type="text" placeholder="options (쉼표 구분)" class="ce-prop-options ce-input" value="${(prop?.options ?? []).join(',')}">
      <input type="text" placeholder="단위" class="ce-prop-unit ce-input-xs" value="${prop?.unit ?? ''}">
      <button class="ce-remove-btn" title="삭제">✕</button>
    `;
    row.querySelector('.ce-remove-btn')?.addEventListener('click', () => row.remove());
    list.appendChild(row);
  }

  private _collectPins(): PinDef[] {
    return [...this._modal.querySelectorAll('.ce-pin-row')].map(row => ({
      name:          (row.querySelector('.ce-pin-name') as HTMLInputElement).value.trim(),
      label:         (row.querySelector('.ce-pin-label') as HTMLInputElement).value.trim(),
      type:          (row.querySelector('.ce-pin-type') as HTMLSelectElement).value as PinType,
      x:             Number((row.querySelector('.ce-pin-x') as HTMLInputElement).value) || 0,
      y:             Number((row.querySelector('.ce-pin-y') as HTMLInputElement).value) || 0,
      description:   (row.querySelector('.ce-pin-desc') as HTMLInputElement).value.trim(),
      required:      (row.querySelector('.ce-pin-required') as HTMLInputElement).checked,
      compatibleWith: [],
    })).filter(p => p.name);
  }

  private _collectProps(): PropDef[] {
    return [...this._modal.querySelectorAll('.ce-prop-row')].map(row => {
      const optStr = (row.querySelector('.ce-prop-options') as HTMLInputElement).value.trim();
      return {
        key:     (row.querySelector('.ce-prop-key')     as HTMLInputElement).value.trim(),
        label:   (row.querySelector('.ce-prop-label')   as HTMLInputElement).value.trim(),
        type:    (row.querySelector('.ce-prop-type')    as HTMLSelectElement).value,
        default: (row.querySelector('.ce-prop-default') as HTMLInputElement).value,
        options: optStr ? optStr.split(',').map(s => s.trim()) : undefined,
        unit:    (row.querySelector('.ce-prop-unit')    as HTMLInputElement).value.trim() || undefined,
      };
    }).filter(p => p.key);
  }

  private _buildBody(): ComponentDefPartial {
    const get = (id: string) => (this._modal.querySelector(`#${id}`) as HTMLInputElement)?.value?.trim() ?? '';
    const getNum = (id: string) => { const v = get(id); return v ? parseFloat(v) : undefined; };

    return {
      id:          get('ce-id'),
      name:        get('ce-name'),
      category:    (this._modal.querySelector('#ce-category') as HTMLSelectElement)?.value as Category,
      tags:        get('ce-tags').split(',').map(t => t.trim()).filter(Boolean),
      description: get('ce-description'),
      element:     get('ce-element') || undefined,
      svgTemplate: get('ce-svg') || undefined,
      width:       Number(get('ce-width')) || 60,
      height:      Number(get('ce-height')) || 60,
      defaultProps: {},
      props:       this._collectProps(),
      pins:        this._collectPins(),
      electrical: {
        vccMin:         getNum('ce-vcc-min'),
        vccMax:         getNum('ce-vcc-max'),
        currentMa:      getNum('ce-current'),
        maxCurrentMa:   getNum('ce-max-current'),
        logic:          (get('ce-logic') || undefined) as '3.3V' | '5V' | 'both' | undefined,
        pinMaxCurrentMa: getNum('ce-pin-max-current'),
      },
      notes:    get('ce-notes').split('\n').map(l => l.trim()).filter(Boolean),
      datasheet: get('ce-datasheet') || undefined,
    };
  }

  private async _save() {
    const body = this._buildBody();
    const statusEl = this._modal.querySelector('#ce-status') as HTMLElement;

    if (!body.id || !body.name) {
      statusEl.textContent = '⛔ ID와 이름은 필수입니다';
      statusEl.style.color = '#f66';
      return;
    }

    statusEl.textContent = '저장 중...';
    statusEl.style.color = '#aaa';

    try {
      const method = this._editingId ? 'PUT' : 'POST';
      const url    = this._editingId ? `${API}/${this._editingId}` : API;

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const err = await r.json() as { error: string };
        throw new Error(err.error);
      }

      statusEl.textContent = '✅ 저장 완료';
      statusEl.style.color = '#4af44a';
      this._onSave?.();
      setTimeout(() => { this._modal.style.display = 'none'; }, 800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      statusEl.textContent = `⛔ ${msg}`;
      statusEl.style.color = '#f66';
    }
  }
}

// 모달 CSS를 head에 주입
function injectStyles() {
  if (document.getElementById('comp-editor-style')) return;
  const style = document.createElement('style');
  style.id = 'comp-editor-style';
  style.textContent = `
    .comp-editor-box {
      background: #141418; border: 1px solid #333; border-radius: 8px;
      width: 720px; max-height: 85vh; display: flex; flex-direction: column;
      overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.7);
    }
    .comp-editor-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid #222;
      font-size: 14px; font-weight: 700; color: #ddd;
    }
    .comp-editor-close-btn {
      background: transparent; border: none; color: #888; cursor: pointer; font-size: 16px;
    }
    .comp-editor-close-btn:hover { color: #fff; }
    .comp-editor-body { flex: 1; overflow-y: auto; }
    .comp-editor-tabs {
      display: flex; border-bottom: 1px solid #222; padding: 0 12px;
      gap: 2px; background: #0e0e14;
    }
    .comp-tab {
      background: transparent; border: none; border-bottom: 2px solid transparent;
      color: #666; cursor: pointer; padding: 8px 12px; font-size: 11px; font-weight: 600;
    }
    .comp-tab:hover { color: #aaa; }
    .comp-tab.active { color: #4a9eff; border-bottom-color: #4a9eff; }
    .comp-editor-pane { display: none; padding: 14px 16px; }
    .comp-editor-pane.active { display: block; }
    .ce-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
    .ce-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ce-row label { font-size: 10px; color: #666; font-weight: 600; text-transform: uppercase; }
    .ce-input {
      background: #1a1a26; border: 1px solid #333; border-radius: 4px;
      color: #ccc; padding: 5px 8px; font-size: 11px; width: 100%;
    }
    .ce-input:focus { outline: 1px solid #4a9eff; border-color: #4a9eff; }
    .ce-input-sm { background: #1a1a26; border: 1px solid #333; border-radius: 4px; color: #ccc; padding: 4px 6px; font-size: 11px; width: 100%; }
    .ce-input-xs { background: #1a1a26; border: 1px solid #333; border-radius: 4px; color: #ccc; padding: 4px 5px; font-size: 11px; width: 52px; }
    .ce-mono { font-family: monospace; font-size: 11px; }
    .ce-add-btn {
      background: #1a3a1a; border: 1px solid #2a6a2a; border-radius: 4px;
      color: #4f4; padding: 4px 12px; font-size: 11px; cursor: pointer; margin-top: 4px;
    }
    .ce-remove-btn {
      background: transparent; border: none; color: #f66; cursor: pointer; font-size: 13px; padding: 0 4px;
    }
    .ce-pin-row, .ce-prop-row {
      display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
      padding: 6px; background: #1a1a22; border-radius: 4px;
    }
    .ce-pin-req { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #888; white-space: nowrap; }
    .comp-editor-footer {
      display: flex; align-items: center; justify-content: flex-end; gap: 12px;
      padding: 10px 16px; border-top: 1px solid #222; background: #0e0e14;
    }
    .ce-status { font-size: 11px; flex: 1; }
    .ce-save-btn {
      background: #1a4a1a; border: 1px solid #2a7a2a; border-radius: 5px;
      color: #4af44a; padding: 6px 18px; font-size: 12px; font-weight: 700; cursor: pointer;
    }
    .ce-save-btn:hover { background: #2a6a2a; }
  `;
  document.head.appendChild(style);
}

injectStyles();
export const componentEditor = new ComponentEditor();
