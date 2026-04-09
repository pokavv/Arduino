/** 회로 컴포넌트 직렬화 상태 */
export interface ComponentSnapshot {
  id: string;
  type: string;
  props: Record<string, unknown>;
  connections: Record<string, number | string>; // pin→gpio
}

/** 회로 전체 직렬화 상태 */
export interface CircuitSnapshot {
  boardType: string;
  components: ComponentSnapshot[];
}

// ─── Main → Worker 메시지 ─────────────────────────────────────

export type MainToWorker =
  | { type: 'INIT'; circuit: CircuitSnapshot; code: string }
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'RESET' }
  | { type: 'PIN_EVENT'; pin: number; value: number }
  | { type: 'SENSOR_UPDATE'; componentId: string; data: Record<string, number> }
  | { type: 'SERIAL_INPUT'; text: string };

// ─── Worker → Main 메시지 ─────────────────────────────────────

export type WorkerToMain =
  | { type: 'READY' }
  | { type: 'PIN_STATE'; pin: number; value: number }
  | { type: 'COMPONENT_UPDATE'; id: string; pin: string; value: number | string }
  | { type: 'SERIAL_OUTPUT'; text: string }
  | { type: 'COMPILE_ERROR'; message: string; line?: number }
  | { type: 'RUNTIME_ERROR'; message: string }
  | { type: 'STOPPED' }
  | { type: 'LOG'; level: 'info' | 'warn' | 'error'; message: string };
