// 모든 sim elements 등록 (side-effect import — custom elements 정의)
import '@sim/elements';

import { CircuitCanvas } from './canvas/circuit-canvas.js';
import { CodeEditor } from './editor/code-editor.js';
import { PropertyPanel } from './panels/property-panel.js';
import { circuitStore } from './stores/circuit-store.js';
import { boardWorkerManager } from './stores/board-worker-manager.js';
import { circuitValidator } from './stores/circuit-validator.js';
import { fetchCompDef } from './stores/comp-def-cache.js';

import { initTheme } from './ui/theme-manager.js';
import { initToolbar } from './ui/toolbar.js';
import { initStatusBar } from './ui/status-bar.js';
import { initPalette, appendTemplateSection } from './ui/palette.js';
import { initSerialMonitor } from './ui/serial-monitor.js';
import { fetchTemplates } from './api/api-client.js';
import type { TemplateInfo } from './api/api-client.js';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco: any;
  }
}

// ─────────────────────────────────────────────────────────────────
// 앱 초기화
// ─────────────────────────────────────────────────────────────────

// ① 테마
initTheme();

// ② 캔버스
const canvasEl = document.getElementById('canvas')!;
const canvas = new CircuitCanvas(canvasEl);

canvasEl.addEventListener('dragover', (e) => e.preventDefault());
canvasEl.addEventListener('drop', (e) => {
  e.preventDefault();
  const type = e.dataTransfer?.getData('component-type');
  if (!type) return;
  const rect = canvasEl.getBoundingClientRect();
  const pos = canvas.clientToCanvas(e.clientX - rect.left, e.clientY - rect.top);
  addComponent(type, pos.x - 30, pos.y - 30);
});

// ③ 코드 에디터
const editorEl = document.getElementById('editor')!;
const codeEditor = new CodeEditor(editorEl);

// ④ 속성 패널
const propPanelEl = document.getElementById('property-panel')!;
new PropertyPanel(propPanelEl);

// ── 탭 전환 ──────────────────────────────────────────────────────
document.querySelectorAll<HTMLButtonElement>('.right-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab!;
    document.querySelectorAll('.right-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.right-tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`)!.classList.add('active');
    if (tab === 'editor') codeEditor.relayout();
  });
});

// 에러 발생 시 시리얼 탭으로 자동 전환
circuitStore.subscribe(() => {
  if (circuitStore.activeBoardSimState === 'error') {
    switchTab('serial');
  }
});

// 보드 선택 시 에디터 탭으로 자동 전환
let _prevBoardId: string | null = null;
circuitStore.subscribe(() => {
  const cur = circuitStore.selectedBoardId;
  if (cur && cur !== _prevBoardId) {
    _prevBoardId = cur;
    switchTab('editor');
    codeEditor.relayout();
  }
  if (!cur) _prevBoardId = null;
});

function switchTab(tab: string) {
  const btn = document.querySelector<HTMLButtonElement>(`.right-tab-btn[data-tab="${tab}"]`);
  btn?.click();
}

// ── 패널 리사이즈 ──────────────────────────────────────────────────
setupPanelResize(
  document.getElementById('divider-left')!,
  document.getElementById('palette-panel')!,
  'left'
);
setupPanelResize(
  document.getElementById('divider-right')!,
  document.getElementById('right-panel')!,
  'right'
);

function setupPanelResize(handle: HTMLElement, panel: HTMLElement, side: 'left' | 'right') {
  let startX = 0, startW = 0;

  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startW = panel.getBoundingClientRect().width;
    handle.classList.add('dragging');
    handle.setPointerCapture(e.pointerId);

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp, { once: true });
  });

  function onMove(e: PointerEvent) {
    const delta = side === 'left'
      ? e.clientX - startX
      : startX - e.clientX;
    const newW = Math.max(140, Math.min(600, startW + delta));
    panel.style.width = `${newW}px`;
    if (side === 'right') codeEditor.relayout();
  }

  function onUp() {
    handle.classList.remove('dragging');
    handle.removeEventListener('pointermove', onMove);
    codeEditor.relayout();
  }
}

// ⑤ 툴바 버튼 이벤트
initToolbar(circuitStore, boardWorkerManager, canvas, switchTab);

// ⑥ 하단 상태바
initStatusBar(circuitStore);

// ⑦ 팔레트
initPalette(canvas, addComponent);

// ⑧ 시리얼 모니터
initSerialMonitor(circuitStore, boardWorkerManager);

setTimeout(() => canvas.fitView(), 150);

// ── 서버 데이터 로드 (템플릿) ─────────────────────────────────────
loadServerData();

// ── 유효성 검사 바 ─────────────────────────────────────────────────
const validationBar = document.getElementById('validation-bar')!;

function renderValidation(results: import('./stores/circuit-validator.js').ValidationResult[]) {
  if (results.length === 0) { validationBar.style.display = 'none'; return; }
  validationBar.style.display = 'block';
  validationBar.innerHTML = results.slice(0, 3).map(r => `
    <div class="validation-item ${r.severity}" title="${r.detail ?? ''}" data-comp="${r.compId ?? ''}">
      <span class="validation-icon">${r.severity === 'error' ? '⛔' : '⚠️'}</span>
      ${r.message}
    </div>
  `).join('') + (results.length > 3 ? `<div class="validation-item info">+ ${results.length - 3}개 더...</div>` : '');

  validationBar.querySelectorAll('[data-comp]').forEach(el => {
    const compId = (el as HTMLElement).dataset.comp;
    if (compId) el.addEventListener('click', () => circuitStore.selectComponent(compId));
  });
}

circuitStore.subscribe(() => renderValidation(circuitValidator.validate()));

let _validateAsyncTimer: ReturnType<typeof setTimeout> | null = null;
circuitStore.subscribe(() => {
  if (_validateAsyncTimer) clearTimeout(_validateAsyncTimer);
  _validateAsyncTimer = setTimeout(() => {
    _validateAsyncTimer = null;
    circuitValidator.validateAsync().then(results => renderValidation(results));
  }, 500);
});

console.log('%c⚡ Arduino Web Simulator 준비 완료', 'color:#4a9eff;font-size:14px;font-weight:bold');

// ─────────────────────────────────────────────────────────────────

async function addComponent(type: string, x: number, y: number) {
  const id = `${type}-${Date.now()}`;
  const def = await fetchCompDef(type).catch(() => null);
  const serverDefaults: Record<string, unknown> = def?.defaultProps ?? {};

  circuitStore.addComponent({
    id, type, x, y, rotation: 0,
    props: serverDefaults,
    connections: {},
  });
}

async function loadServerData() {
  try {
    const templates = await fetchTemplates().catch(() => [] as TemplateInfo[]);
    if (templates.length > 0) {
      appendTemplateSection(templates, canvas, boardWorkerManager, circuitStore);
    }
  } catch { /* 서버 없으면 무시 */ }
}
