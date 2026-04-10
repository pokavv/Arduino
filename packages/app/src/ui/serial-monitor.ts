// ── 시리얼 모니터 UI ────────────────────────────────────────────────
import type { circuitStore as CircuitStoreType } from '../stores/circuit-store.js';
import type { boardWorkerManager as BoardWorkerManagerType } from '../stores/board-worker-manager.js';

type CircuitStore = typeof CircuitStoreType;
type BoardWorkerManager = typeof BoardWorkerManagerType;

/** 시리얼 모니터 초기화 — 출력 표시 및 입력 전송 */
export function initSerialMonitor(
  circuitStore: CircuitStore,
  boardWorkerManager: BoardWorkerManager,
): void {
  const serialOutput = document.getElementById('serial-output')!;

  // ── 선택된 보드의 시리얼 출력 구독
  circuitStore.subscribe(() => {
    const text = circuitStore.activeBoardSerial;
    if (serialOutput.textContent !== text) {
      serialOutput.textContent = text;
      serialOutput.scrollTop = serialOutput.scrollHeight;
    }
  });

  // ── 시리얼 입력 전송
  const serialInputEl = document.getElementById('serial-input') as HTMLInputElement;
  function sendSerialInput(): void {
    const text = serialInputEl.value;
    if (!text) return;
    const boardId = circuitStore.selectedBoardId;
    if (boardId) boardWorkerManager.sendSerialToBoard(boardId, text + '\n');
    serialInputEl.value = '';
  }
  document.getElementById('btn-serial-send')!.addEventListener('click', sendSerialInput);
  serialInputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendSerialInput(); });

  // ── 시리얼 지우기
  document.getElementById('btn-clear-serial')!.addEventListener('click', () => {
    const boardId = circuitStore.selectedBoardId;
    if (boardId) circuitStore.clearSerialForBoard(boardId);
  });
}
