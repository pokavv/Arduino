// ── 좌측 부품 팔레트 ────────────────────────────────────────────────
import type { CircuitCanvas } from '../canvas/circuit-canvas.js';
import { fetchCompDef } from '../stores/comp-def-cache.js';
import { componentEditor } from '../panels/component-editor.js';
import { fetchComponents, fetchTemplateDetail } from '../api/api-client.js';
import type { CompSummary, TemplateInfo, TemplateDetail } from '../api/api-client.js';

const CAT_LABELS: Record<string, string> = {
  mcu:           '보드',
  passive:       '수동 소자',
  output:        '출력 소자',
  sensor:        '센서',
  display:       '디스플레이',
  actuator:      '액추에이터',
  ic:            'IC / 반도체',
  communication: '통신 모듈',
  power:         '전원',
  // 레거시 — 서버 DB에 잔존하는 구 카테고리 표시용
  active:        '기타 (active)',
};
const CAT_ORDER = [
  'mcu', 'passive', 'output', 'sensor', 'display', 'actuator', 'ic', 'communication', 'power', 'active',
];

let _canvas: CircuitCanvas;
let _paletteList: HTMLElement;
let _paletteSearchEl: HTMLInputElement;
let _addComponentFn: (type: string, x: number, y: number) => Promise<void>;

/** 팔레트 초기화 — 서버에서 부품 목록 로드 후 렌더링 */
export function initPalette(
  canvas: CircuitCanvas,
  addComponent: (type: string, x: number, y: number) => Promise<void>,
): void {
  _canvas = canvas;
  _addComponentFn = addComponent;
  _paletteList = document.getElementById('palette-list')!;
  _paletteSearchEl = document.getElementById('palette-search') as HTMLInputElement;

  _paletteSearchEl.addEventListener('input', applyPaletteSearch);

  loadPalette();
}

export async function loadPalette(): Promise<void> {
  try {
    const comps = await fetchComponents();
    renderPalette(comps);
    // 팔레트 로드 후 모든 컴포넌트 def를 미리 캐시에 저장 → 드래그 시 즉시 올바른 태그 사용
    for (const comp of comps) {
      fetchCompDef(comp.id).catch(() => null);
    }
  } catch {
    _paletteList.innerHTML = `<div style="padding:12px 16px;color:var(--color-error);font-size:11px;">서버에 연결할 수 없습니다.<br>pnpm dev로 서버를 시작하세요.</div>`;
  }
}

function renderPalette(comps: CompSummary[]): void {
  const groups: Record<string, CompSummary[]> = {};
  for (const c of comps) {
    (groups[c.category] ??= []).push(c);
  }

  _paletteList.innerHTML = '';

  const addBtn = document.createElement('button');
  addBtn.className = 'palette-add-btn';
  addBtn.textContent = '+ 새 부품 등록';
  addBtn.addEventListener('click', () => componentEditor.openNew(() => loadPalette()));
  _paletteList.appendChild(addBtn);

  for (const cat of CAT_ORDER) {
    if (!groups[cat]?.length) continue;

    const title = document.createElement('div');
    title.className = 'palette-category';
    title.textContent = CAT_LABELS[cat] ?? cat;
    _paletteList.appendChild(title);

    for (const comp of groups[cat]) {
      const item = document.createElement('div');
      item.className = 'palette-item';
      item.dataset.compId = comp.id;
      item.dataset.label  = comp.name.toLowerCase();

      const icon = comp.icon ?? '📦';
      item.innerHTML = `
        <span class="palette-icon">${icon}</span>
        <span class="palette-label">${comp.name}</span>
        <button class="palette-edit-btn" title="편집">✏️</button>
      `;
      item.title = comp.description || comp.name;
      item.draggable = true;

      item.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('component-type', comp.id);
      });
      item.addEventListener('dblclick', () => {
        const cx = _canvas.viewCenterX + (Math.random() - 0.5) * 60;
        const cy = _canvas.viewCenterY + (Math.random() - 0.5) * 60;
        _addComponentFn(comp.id, cx, cy);
      });
      item.querySelector('.palette-edit-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        componentEditor.openEdit(comp.id, () => loadPalette());
      });

      _paletteList.appendChild(item);
    }
  }

  // 검색 필터 초기화
  applyPaletteSearch();
}

/** 검색어로 팔레트 아이템 필터링 */
export function applyPaletteSearch(): void {
  const q = _paletteSearchEl.value.toLowerCase().trim();
  let lastCategory: HTMLElement | null = null;
  let lastCategoryVisible = false;

  for (const el of _paletteList.children) {
    const div = el as HTMLElement;
    if (div.classList.contains('palette-category')) {
      if (lastCategory) lastCategory.style.display = lastCategoryVisible ? '' : 'none';
      lastCategory = div;
      lastCategoryVisible = false;
      continue;
    }
    if (div.classList.contains('palette-item')) {
      const label = div.dataset.label ?? '';
      const visible = !q || label.includes(q);
      div.style.display = visible ? '' : 'none';
      if (visible) lastCategoryVisible = true;
    }
  }
  if (lastCategory) lastCategory.style.display = lastCategoryVisible ? '' : 'none';
}

/** 팔레트 하단에 예제 템플릿 섹션 추가 */
export function appendTemplateSection(
  templates: TemplateInfo[],
  canvas: CircuitCanvas,
  simController: { stop: () => void },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  circuitStore: { loadTemplate: (d: any) => void },
): void {
  const div = document.createElement('div');
  div.innerHTML = `<div class="palette-category">예제 템플릿</div>`;

  const categories = [...new Set(templates.map(t => t.category))];
  for (const cat of categories) {
    const catDiv = document.createElement('div');
    catDiv.innerHTML = `<div class="palette-category" style="color:#555;padding-left:16px">${cat}</div>`;
    div.appendChild(catDiv);

    for (const t of templates.filter(tpl => tpl.category === cat)) {
      const item = document.createElement('div');
      item.className = 'palette-item';
      item.dataset.label = t.name.toLowerCase();
      item.innerHTML = `<span class="palette-icon">📋</span><span class="palette-label">${t.name}</span>`;
      item.title = t.description ?? t.name;
      item.style.cursor = 'pointer';
      item.addEventListener('click', async () => {
        try {
          const detail = await fetchTemplateDetail(t.id);
          simController.stop(); // 실행 중인 Worker 종료 후 템플릿 로드
          circuitStore.loadTemplate(detail);
          const hint = document.getElementById('canvas-hint');
          if (hint) hint.style.display = 'none';
          setTimeout(() => canvas.fitView(), 100);
        } catch { /* 무시 */ }
      });
      div.appendChild(item);
    }
  }

  _paletteList.appendChild(div);
}
