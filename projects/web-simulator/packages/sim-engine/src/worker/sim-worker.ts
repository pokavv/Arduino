import type { MainToWorker, WorkerToMain, CircuitSnapshot } from '../types.js';
import { ArduinoTranspiler } from '../runtime/transpiler.js';
import { SimScheduler } from '../runtime/scheduler.js';
import { GpioController } from '../runtime/gpio.js';
import { buildPreamble } from '../runtime/preamble.js';

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

    // 컴포넌트 입력 콜백 등록
    for (const comp of circuit.components) {
      if (comp.type === 'button') {
        for (const [pin, target] of Object.entries(comp.connections)) {
          if (pin === 'PIN1A' && typeof target === 'number') {
            gpio.registerInputCallback(target, () => _ctx[`__btn_${comp.id}`] ?? 0);
          }
        }
      }
      if (comp.type === 'potentiometer') {
        for (const [pin, target] of Object.entries(comp.connections)) {
          if (pin === 'WIPER' && typeof target === 'number') {
            gpio.registerInputCallback(target, () => _ctx[`__pot_${comp.id}`] ?? 512);
          }
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

    case 'SENSOR_UPDATE':
      _ctx[`__sensor_${msg.componentId}`] = msg.data;
      if (msg.data.value !== undefined) {
        _ctx[`__btn_${msg.componentId}`] = msg.data.value;
        _ctx[`__pot_${msg.componentId}`] = msg.data.value;
      }
      break;

    case 'SERIAL_INPUT':
      // 문자열을 바이트 배열로 변환해서 버퍼에 추가
      for (const ch of msg.text) {
        _serialInputBuffer.push(ch.charCodeAt(0));
      }
      break;
  }
});
