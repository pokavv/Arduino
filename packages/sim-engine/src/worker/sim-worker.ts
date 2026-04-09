import type { MainToWorker, WorkerToMain, CircuitSnapshot } from '../types.js';
import { ArduinoTranspiler } from '../runtime/transpiler.js';
import { SimScheduler } from '../runtime/scheduler.js';
import { GpioController } from '../runtime/gpio.js';
import { buildPreamble } from '../runtime/preamble.js';
import { INPUT_PIN_REGISTRY } from '../runtime/input-pin-registry.js';

function post(msg: WorkerToMain) {
  (self as unknown as Worker).postMessage(msg);
}

let scheduler: SimScheduler | null = null;
let gpio: GpioController | null = null;
let _running = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _ctx: Record<string, any> = {};

// 시리얼 입력 버퍼 — SERIAL_INPUT 메시지로 채워짐
const _serialInputBuffer: number[] = [];

// INIT에서 받은 회로/코드 보관
let _pendingCircuit: CircuitSnapshot | null = null;
let _pendingCode: string | null = null;

function stopSimulation() {
  _running = false;
  scheduler?.stop();
  scheduler = null;
  gpio = null;
  post({ type: 'STOPPED' });
}

async function runSimulation(circuit: CircuitSnapshot, code: string) {
  if (_running) stopSimulation();
  _running = true;

  try {
    const transpiler = new ArduinoTranspiler();
    const jsCode = transpiler.transpile(code);

    scheduler = new SimScheduler();
    gpio = new GpioController(post);

    // 컴포넌트 입력 콜백 등록 — INPUT_PIN_REGISTRY 기반 일반화
    for (const comp of circuit.components) {
      const handlers = INPUT_PIN_REGISTRY[comp.type];
      if (!handlers?.length) continue;
      for (const [pin, target] of Object.entries(comp.connections)) {
        const handler = handlers.find(h => h.pin === pin);
        if (handler && typeof target === 'number') {
          const ctxKey = `${handler.ctxKey}_${comp.id}`;
          const defaultValue = handler.defaultValue;
          gpio.registerInputCallback(target, () => (_ctx[ctxKey] ?? defaultValue) as number);
        }
      }
    }

    const preamble = buildPreamble(gpio, scheduler, post, circuit.boardType, _serialInputBuffer);

    const fullCode = `
${preamble}

// ─── User Code ────────────────────────────────────────────
${jsCode}
// ─────────────────────────────────────────────────────────

await setup();
while (true) {
  await loop();
  await __delay(1);
}
`;

    scheduler.start();

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('gpio', 'scheduler', 'postFn', '_ctx', fullCode);
    await fn(gpio, scheduler, post, _ctx);

  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return; // 정상 종료
    }
    post({
      type: 'RUNTIME_ERROR',
      message: err instanceof Error ? err.message : String(err),
    });
  } finally {
    _running = false;
  }
}

// ─── 단일 메시지 리스너 ───────────────────────────────────────────
(self as unknown as Worker).addEventListener('message', async (e: MessageEvent<MainToWorker>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'INIT':
      _pendingCircuit = msg.circuit;
      _pendingCode    = msg.code;
      _serialInputBuffer.length = 0; // 버퍼 초기화
      Object.keys(_ctx).forEach(k => delete _ctx[k]); // 컨텍스트 초기화
      post({ type: 'READY' });
      break;

    case 'START':
      if (_pendingCircuit && _pendingCode) {
        // await 없이 실행 — 비동기로 시뮬레이션 시작
        runSimulation(_pendingCircuit, _pendingCode).catch(() => {});
      }
      break;

    case 'STOP':
    case 'RESET':
      stopSimulation();
      break;

    case 'PIN_EVENT':
      gpio?.injectPinValue(msg.pin, msg.value);
      break;

    case 'SENSOR_UPDATE': {
      const comp = _pendingCircuit?.components.find(c => c.id === msg.componentId);
      if (comp && msg.data.value !== undefined) {
        // 레지스트리의 모든 핸들러 ctxKey에 값 저장
        const handlers = INPUT_PIN_REGISTRY[comp.type] ?? [];
        for (const h of handlers) {
          _ctx[`${h.ctxKey}_${comp.id}`] = msg.data.value;
        }
      }
      // 범용 센서 데이터도 저장 (preamble에서 직접 참조할 수 있도록)
      _ctx[`__sensor_${msg.componentId}`] = msg.data;
      break;
    }

    case 'SERIAL_INPUT':
      // 문자열을 바이트 배열로 변환해서 버퍼에 추가
      for (const ch of msg.text) {
        _serialInputBuffer.push(ch.charCodeAt(0));
      }
      break;
  }
});
