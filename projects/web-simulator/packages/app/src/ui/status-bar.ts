// ── 하단 상태바 업데이트 ────────────────────────────────────────────
import type { circuitStore as CircuitStoreType } from '../stores/circuit-store.js';

type CircuitStore = typeof CircuitStoreType;

/** 하단 상태바 DOM 업데이트 구독 초기화 */
export function initStatusBar(circuitStore: CircuitStore): void {
  // ── 시뮬레이션 상태 + 시리얼 연결 표시 + 부품/와이어 개수 구독
  circuitStore.subscribe(() => {
    const state = circuitStore.activeBoardSimState;
    const sbStatus = document.getElementById('sb-sim-status');
    const serialDot = document.getElementById('serial-conn-dot');
    const serialLabel = document.getElementById('serial-conn-label');

    if (sbStatus) {
      if (state === 'running') {
        sbStatus.textContent = '● 실행 중';
        sbStatus.style.background = 'rgba(52,211,120,0.25)';
      } else if (state === 'error') {
        sbStatus.textContent = '✕ 오류';
        sbStatus.style.background = 'rgba(255,80,80,0.25)';
      } else {
        sbStatus.textContent = '준비';
        sbStatus.style.background = '';
      }
    }

    if (serialDot && serialLabel) {
      if (state === 'running') {
        serialDot.classList.add('connected');
        serialLabel.textContent = '연결됨';
      } else {
        serialDot.classList.remove('connected');
        serialLabel.textContent = '연결 대기';
      }
    }

    // 상태 표시줄 — 부품/와이어 개수 업데이트
    const sbComp = document.getElementById('sb-comp-count');
    const sbWire = document.getElementById('sb-wire-count');
    if (sbComp) sbComp.innerHTML = sbComp.innerHTML.replace(/부품 \d+개/, `부품 ${circuitStore.components.length}개`);
    if (sbWire) sbWire.innerHTML = sbWire.innerHTML.replace(/와이어 \d+개/, `와이어 ${circuitStore.wires.length}개`);
  });

  // ── 회로 변경 → 부품/와이어 개수 업데이트
  circuitStore.subscribe(() => {
    const sbComp = document.getElementById('sb-comp-count');
    const sbWire = document.getElementById('sb-wire-count');
    if (sbComp) {
      const cnt = circuitStore.components.length;
      sbComp.innerHTML = sbComp.innerHTML.replace(/부품 \d+개/, `부품 ${cnt}개`);
    }
    if (sbWire) {
      const cnt = circuitStore.wires.length;
      sbWire.innerHTML = sbWire.innerHTML.replace(/와이어 \d+개/, `와이어 ${cnt}개`);
    }
  });
}
