import { SimController } from './sim-controller.js';
import { circuitStore, isBoard } from './circuit-store.js';

/**
 * 보드별 독립 Worker 인스턴스를 관리하는 매니저
 * 캔버스에 올라간 각 보드 컴포넌트에 대해 독립된 SimController를 생성/관리한다.
 */
class BoardWorkerManager {
  private _workers = new Map<string, SimController>();

  // Canvas에서 등록하는 핀 상태 업데이트 콜백
  private _onPinState: ((boardCompId: string, pin: number, value: number) => void) | null = null;
  private _onComponentUpdate: ((boardCompId: string, id: string, pin: string, value: number | string) => void) | null = null;

  registerPinStateHandler(fn: (boardCompId: string, pin: number, value: number) => void) {
    this._onPinState = fn;
  }

  registerComponentUpdateHandler(fn: (boardCompId: string, id: string, pin: string, value: number | string) => void) {
    this._onComponentUpdate = fn;
  }

  getWorker(boardCompId: string): SimController | null {
    return this._workers.get(boardCompId) ?? null;
  }

  async startBoard(boardCompId: string): Promise<void> {
    // 기존 Worker 정리
    this.stopBoard(boardCompId);

    const snapshot = circuitStore.toSnapshotForBoard(boardCompId);
    const board = circuitStore.boards.find(b => b.id === boardCompId);
    const code = board?.code ?? '';

    if (!snapshot || !code.trim()) {
      console.warn('[BoardWorkerManager] 스냅샷 또는 코드가 없어 시작 불가:', boardCompId);
      return;
    }

    const controller = new SimController(boardCompId);

    controller.onPinState = (pin, value) => {
      this._onPinState?.(boardCompId, pin, value);
    };
    controller.onComponentUpdate = (id, pin, value) => {
      this._onComponentUpdate?.(boardCompId, id, pin, value);
    };

    this._workers.set(boardCompId, controller);
    await controller.start(snapshot, code);
  }

  stopBoard(boardCompId: string): void {
    const controller = this._workers.get(boardCompId);
    if (controller) {
      controller.stop();
      this._workers.delete(boardCompId);
    } else {
      // Worker가 없어도 상태는 idle로 초기화
      circuitStore.setSimStateForBoard(boardCompId, 'idle');
    }
  }

  disposeBoard(boardCompId: string): void {
    this.stopBoard(boardCompId);
  }

  stopAll(): void {
    for (const [id] of this._workers) {
      this.stopBoard(id);
    }
    // Worker가 없는 보드들도 idle로 초기화
    for (const board of circuitStore.boards) {
      circuitStore.setSimStateForBoard(board.id, 'idle');
    }
  }

  sendPinEventToBoard(boardCompId: string, pin: number, value: number): void {
    this._workers.get(boardCompId)?.sendPinEvent(pin, value);
  }

  sendSensorUpdateToBoard(boardCompId: string, compId: string, data: Record<string, number>): void {
    this._workers.get(boardCompId)?.sendSensorUpdate(compId, data);
  }

  sendSerialToBoard(boardCompId: string, text: string): void {
    this._workers.get(boardCompId)?.sendSerial(text);
  }
}

export const boardWorkerManager = new BoardWorkerManager();
