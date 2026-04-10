import type { MainToWorker, WorkerToMain, CircuitSnapshot } from '@sim/engine';
import { circuitStore } from './circuit-store.js';

/**
 * 시뮬레이션 엔진 (Web Worker) 컨트롤러 — 보드 1개당 인스턴스 1개
 */
export class SimController {
  private _boardCompId: string;
  private _worker: Worker | null = null;
  private _starting = false;
  private _terminateTimer: ReturnType<typeof setTimeout> | null = null;
  private _onPinState: ((pin: number, value: number) => void) | null = null;
  private _onComponentUpdate: ((id: string, pin: string, value: number | string) => void) | null = null;

  constructor(boardCompId: string) {
    this._boardCompId = boardCompId;
  }

  set onPinState(fn: (pin: number, value: number) => void) {
    this._onPinState = fn;
  }

  set onComponentUpdate(fn: (id: string, pin: string, value: number | string) => void) {
    this._onComponentUpdate = fn;
  }

  async start(circuit: CircuitSnapshot, code: string) {
    if (this._starting) return;
    this._starting = true;
    try {
      this.stop();

      this._worker = new Worker(
        new URL('../worker/sim-worker-entry.ts', import.meta.url),
        { type: 'module' }
      );

      this._worker.addEventListener('message', (e: MessageEvent<WorkerToMain>) => {
        this._handleMessage(e.data);
      });

      this._worker.addEventListener('error', (e) => {
        circuitStore.setSimStateForBoard(this._boardCompId, 'error');
        circuitStore.appendSerialForBoard(this._boardCompId, `[오류] ${e.message}\n`);
      });

      this._post({ type: 'INIT', circuit, code });
      circuitStore.setSimStateForBoard(this._boardCompId, 'running');

    } finally {
      this._starting = false;
    }
  }

  stop() {
    if (this._terminateTimer) {
      clearTimeout(this._terminateTimer);
      this._terminateTimer = null;
    }
    if (this._worker) {
      this._post({ type: 'STOP' });
      const w = this._worker;
      this._worker = null;
      this._terminateTimer = setTimeout(() => {
        w.terminate();
        this._terminateTimer = null;
      }, 200);
    }
    circuitStore.setSimStateForBoard(this._boardCompId, 'idle');
  }

  /** 버튼 이벤트 등 외부 입력 전달 */
  sendPinEvent(pin: number, value: number) {
    this._post({ type: 'PIN_EVENT', pin, value });
  }

  sendSensorUpdate(componentId: string, data: Record<string, number>) {
    this._post({ type: 'SENSOR_UPDATE', componentId, data });
  }

  sendSerial(text: string) {
    this._post({ type: 'SERIAL_INPUT', text });
  }

  private _post(msg: MainToWorker) {
    this._worker?.postMessage(msg);
  }

  private _handleMessage(msg: WorkerToMain) {
    switch (msg.type) {
      case 'READY':
        this._post({ type: 'START' });
        break;

      case 'PIN_STATE':
        this._onPinState?.(msg.pin, msg.value);
        break;

      case 'COMPONENT_UPDATE':
        this._onComponentUpdate?.(msg.id, msg.pin, msg.value);
        break;

      case 'SERIAL_OUTPUT':
        circuitStore.appendSerialForBoard(this._boardCompId, msg.text);
        break;

      case 'COMPILE_ERROR':
        circuitStore.setSimStateForBoard(this._boardCompId, 'error');
        circuitStore.appendSerialForBoard(this._boardCompId, `[컴파일 오류] ${msg.message}\n`);
        break;

      case 'RUNTIME_ERROR':
        circuitStore.setSimStateForBoard(this._boardCompId, 'error');
        circuitStore.appendSerialForBoard(this._boardCompId, `[런타임 오류] ${msg.message}\n`);
        break;

      case 'STOPPED':
        circuitStore.setSimStateForBoard(this._boardCompId, 'idle');
        break;

      case 'LOG': {
        const fn = msg.level === 'error' ? console.error : msg.level === 'warn' ? console.warn : console.log;
        fn('[Worker]', msg.message);
        break;
      }
    }
  }
}
