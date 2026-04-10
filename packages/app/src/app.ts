// 모든 sim elements 등록 (side-effect import — custom elements 정의)
import '@sim/elements';

import { CircuitCanvas } from './canvas/circuit-canvas.js';
import { CodeEditor } from './editor/code-editor.js';
import { PropertyPanel } from './panels/property-panel.js';
import { circuitStore } from './stores/circuit-store.js';
import { simController } from './stores/sim-controller.js';
import { circuitValidator } from './stores/circuit-validator.js';
import { fetchCompDef } from './stores/comp-def-cache.js';

import { initTheme } from './ui/theme-manager.js';
import { initToolbar } from './ui/toolbar.js';
import { initStatusBar } from './ui/status-bar.js';
import { initPalette, appendTemplateSection } from './ui/palette.js';
import { initSerialMonitor } from './ui/serial-monitor.js';
import { fetchBoards, fetchTemplates } from './api/api-client.js';
import type { BoardInfo, TemplateInfo } from './api/api-client.js';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco: any;
  }
}

// ─────────────────────────────────────────────────────────────────
// 앱 초기화 — index.html의 DOM이 이미 있으므로 즉시 실행
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

// 에러/경고 시 시리얼 탭으로 자동 전환
circuitStore.subscribe(() => {
  if (circuitStore.simState === 'error') {
    switchTab('serial');
  }
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
initToolbar(circuitStore, simController, canvas, switchTab);

// ⑥ 하단 상태바
initStatusBar(circuitStore);

// ⑦ 팔레트
initPalette(canvas, addComponent);

// ⑧ 시리얼 모니터
initSerialMonitor(circuitStore, simController);

setTimeout(() => canvas.fitView(), 150);

// ── 서버 데이터 로드 (보드/템플릿) ───────────────────────────────
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

// validateAsync는 서버 fetch를 포함하므로 500ms 디바운스 적용
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
  // fetchCompDef는 캐시에 저장하므로 이후 _createElement에서 바로 올바른 태그 사용 가능
  const def = await fetchCompDef(type).catch(() => null);
  const serverDefaults: Record<string, unknown> = def?.defaultProps ?? {};

  circuitStore.addComponent({
    id, type, x, y, rotation: 0,
    props: serverDefaults,
    connections: {},
  });
}


async function loadServerData() {
  const boardSelect = document.getElementById('board-select') as HTMLSelectElement | null;
  if (!boardSelect) return;

  try {
    const [boards, templates] = await Promise.all([
      fetchBoards().catch(() => [] as BoardInfo[]),
      fetchTemplates().catch(() => [] as TemplateInfo[]),
    ]);

    if (boards.length > 0) {
      boardSelect.innerHTML = '';
      for (const b of boards) {
        const opt = document.createElement('option');
        opt.value = b.id; opt.textContent = b.name;
        if (b.id === 'arduino-uno') opt.selected = true;
        boardSelect.appendChild(opt);
      }
    }
    boardSelect.addEventListener('change', () => {
      const previousBoardId = circuitStore.boardId;
      const nextBoardId = boardSelect.value;

      // 회로에 컴포넌트가 있으면 사용자에게 초기화 여부 확인
      if (circuitStore.components.length > 0) {
        const confirmed = confirm(
          '보드를 변경하면 현재 회로가 초기화됩니다. 계속하시겠습니까?'
        );
        if (!confirmed) {
          // 보드 변경 취소 — select 값 되돌리기
          boardSelect.value = previousBoardId;
          return;
        }
        // 확인: 실행 중인 Worker 종료 후 회로 초기화
        simController.stop();
        circuitStore.clearCircuit();
      } else if (circuitStore.simState === 'running') {
        // 컴포넌트는 없지만 실행 중인 경우 Worker만 종료
        simController.stop();
      }

      circuitStore.setBoard(nextBoardId);

      const sbBoard = document.getElementById('sb-board');
      if (sbBoard) {
        const selected = boardSelect.options[boardSelect.selectedIndex];
        // SVG 아이콘 유지하고 텍스트만 변경
        const svg = sbBoard.querySelector('svg');
        sbBoard.textContent = selected?.textContent ?? boardSelect.value;
        if (svg) sbBoard.prepend(svg);
      }
    });

    // 템플릿 — 팔레트 아래에 로드 버튼으로 추가
    if (templates.length > 0) {
      appendTemplateSection(templates, canvas, simController, circuitStore);
    }
  } catch { /* 서버 없으면 무시 */ }
}
