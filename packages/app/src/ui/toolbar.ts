// ── 상단 툴바 버튼 이벤트 ────────────────────────────────────────────
import type { CircuitCanvas } from '../canvas/circuit-canvas.js';
import type { circuitStore as CircuitStoreType } from '../stores/circuit-store.js';
import type { simController as SimControllerType } from '../stores/sim-controller.js';

type CircuitStore = typeof CircuitStoreType;
type SimController = typeof SimControllerType;

const RUN_ICON_PLAY = `<svg id="run-icon" width="11" height="12" viewBox="0 0 11 12" fill="currentColor" style="flex-shrink:0"><path d="M2 1.5l8 4.5-8 4.5V1.5z"/></svg>`;
const RUN_ICON_STOP = `<svg id="run-icon" width="11" height="11" viewBox="0 0 11 11" fill="currentColor" style="flex-shrink:0"><rect x="2" y="2" width="7" height="7" rx="1.5"/></svg>`;

/** 상단 툴바 버튼 이벤트 바인딩 및 상태 구독 */
export function initToolbar(
  circuitStore: CircuitStore,
  simController: SimController,
  canvas: CircuitCanvas,
  switchTab: (tab: string) => void,
): void {
  // ── 새로 만들기
  document.getElementById('btn-new')!.addEventListener('click', () => {
    if (!confirm('현재 회로를 지우고 새로 시작할까요?')) return;
    simController.stop();
    circuitStore.clearCircuit();
  });

  // ── 실행/정지
  document.getElementById('btn-run')!.addEventListener('click', () => {
    if (circuitStore.simState === 'running') {
      simController.stop();
    } else {
      circuitStore.clearSerial();
      simController.start();
      switchTab('serial'); // 실행 시 시리얼 탭으로
    }
  });

  // ── 줌 컨트롤
  document.getElementById('btn-zoom-in')!.addEventListener('click',  () => canvas.zoomIn());
  document.getElementById('btn-zoom-out')!.addEventListener('click', () => canvas.zoomOut());
  document.getElementById('btn-fit')!.addEventListener('click',      () => canvas.fitView());

  // ── Undo / Redo
  document.getElementById('btn-undo')!.addEventListener('click', () => circuitStore.undo());
  document.getElementById('btn-redo')!.addEventListener('click', () => circuitStore.redo());

  // ── 저장
  document.getElementById('btn-save')!.addEventListener('click', () => {
    const json = circuitStore.saveToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `circuit-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  });

  // ── 불러오기
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  document.getElementById('btn-load')!.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        simController.stop(); // 실행 중인 Worker 종료 후 회로 로드
        circuitStore.loadFromJson(reader.result as string);
        const hint = document.getElementById('canvas-hint');
        if (hint) hint.style.display = 'none';
        setTimeout(() => canvas.fitView(), 100);
      } catch {
        alert('파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  // ── 키보드 단축키
  document.addEventListener('keydown', (e) => {
    const active = document.activeElement?.tagName;
    const isEditing = active === 'INPUT' || active === 'TEXTAREA';

    if ((e.ctrlKey || e.metaKey) && !isEditing) {
      if (e.key === 'z') { e.preventDefault(); circuitStore.undo(); return; }
      if (e.key === 'y') { e.preventDefault(); circuitStore.redo(); return; }
      if (e.key === 's') { e.preventDefault(); document.getElementById('btn-save')!.click(); return; }
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditing) {
      const selComp = circuitStore.selectedId;
      const selWire = circuitStore.selectedWireId;
      if (selComp) circuitStore.removeComponent(selComp);
      if (selWire) circuitStore.removeWire(selWire);
    }
  });

  // ── Undo/Redo 버튼 상태 구독
  circuitStore.subscribe(() => {
    const undoBtn = document.getElementById('btn-undo') as HTMLButtonElement | null;
    const redoBtn = document.getElementById('btn-redo') as HTMLButtonElement | null;
    if (undoBtn) undoBtn.style.opacity = circuitStore.canUndo ? '1' : '0.3';
    if (redoBtn) redoBtn.style.opacity = circuitStore.canRedo ? '1' : '0.3';
  });

  // ── 실행 상태 → 버튼/인디케이터 업데이트 구독
  circuitStore.subscribe(() => {
    const state = circuitStore.simState;
    const runBtn = document.getElementById('btn-run') as HTMLButtonElement | null;
    const statusEl = document.getElementById('status-indicator');

    if (runBtn) {
      if (state === 'running') {
        runBtn.innerHTML = `${RUN_ICON_STOP} 정지`;
        runBtn.className = 'toolbar-btn running';
      } else if (state === 'error') {
        runBtn.innerHTML = `${RUN_ICON_PLAY} 실행`;
        runBtn.className = 'toolbar-btn error';
      } else {
        runBtn.innerHTML = `${RUN_ICON_PLAY} 실행`;
        runBtn.className = 'toolbar-btn';
      }
    }

    if (statusEl) {
      statusEl.id = 'status-indicator';
      statusEl.className = state === 'running' ? 'running' : state === 'error' ? 'error' : '';
      statusEl.title = state === 'running' ? '실행 중' : state === 'error' ? '오류' : '정지';
    }
  });
}
