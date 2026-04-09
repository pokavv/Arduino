import type { MainToWorker, WorkerToMain } from '@sim/engine';
import { circuitStore } from './circuit-store.js';

/**
 * 시뮬레이션 엔진 (Web Worker) 컨트롤러
 */
export class SimController {
  private _worker: Worker | null = null;
  private _starting = false;
  private _terminateTimer: ReturnType<typeof setTimeout> | null = null;
  private _onPinState: ((pin: number, value: number) => void) | null = null;
  private _onComponentUpdate: ((id: string, pin: string, value: number) => void) | null = null;

  set onPinState(fn: (pin: number, value: number) => void) {
    this._onPinState = fn;
  }

  set onComponentUpdate(fn: (id: string, pin: string, value: number) => void) {
    this._onComponentUpdate = fn;
  }

  async start() {
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
        circuitStore.setSimState('error');
        circuitStore.appendSerial(`[오류] ${e.message}\n`);
      });
  
      // INIT 메시지 전송
      const snapshot = circuitStore.toSnapshot();
      this._post({
        type: 'INIT',
        circuit: snapshot,
        code: circuitStore.code,
      });
  
      circuitStore.setSimState('running');
   
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
    circuitStore.setSimState('idle');
  }

  reset() {
    this.stop();
    circuitStore.clearSerial();
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
        circuitStore.appendSerial(msg.text);
        break;

      case 'COMPILE_ERROR':
        circuitStore.setSimState('error');
        circuitStore.appendSerial(`[컴파일 오류] ${msg.message}\n`);
        break;

      case 'RUNTIME_ERROR':
        circuitStore.setSimState('error');
        circuitStore.appendSerial(`[런타임 오류] ${msg.message}\n`);
        break;

      case 'STOPPED':
        circuitStore.setSimState('idle');
        break;

      case 'LOG': {
        const fn = msg.level === 'error' ? console.error : msg.level === 'warn' ? console.warn : console.log;
        fn('[Worker]', msg.message);
        break;
      }
    }
  }
}

export const simController = new SimController();
