// ── 시리얼 모니터 UI ────────────────────────────────────────────────
import type { circuitStore as CircuitStoreType } from '../stores/circuit-store.js';
import type { simController as SimControllerType } from '../stores/sim-controller.js';

type CircuitStore = typeof CircuitStoreType;
type SimController = typeof SimControllerType;

/** 시리얼 모니터 초기화 — 출력 표시 및 입력 전송 */
export function initSerialMonitor(
  circuitStore: CircuitStore,
  simController: SimController,
): void {
  const serialOutput = document.getElementById('serial-output')!;

  // ── 시리얼 출력 구독
  circuitStore.subscribe(() => {
    if (serialOutput.textContent !== circuitStore.serialOutput) {
      serialOutput.textContent = circuitStore.serialOutput;
      serialOutput.scrollTop = serialOutput.scrollHeight;
    }
  });

  // ── 시리얼 입력 전송
  const serialInputEl = document.getElementById('serial-input') as HTMLInputElement;
  function sendSerialInput(): void {
    const text = serialInputEl.value;
    if (text) { simController.sendSerial(text + '\n'); serialInputEl.value = ''; }
  }
  document.getElementById('btn-serial-send')!.addEventListener('click', sendSerialInput);
  serialInputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendSerialInput(); });

  // ── 시리얼 지우기
  document.getElementById('btn-clear-serial')!.addEventListener('click', () => circuitStore.clearSerial());
}
