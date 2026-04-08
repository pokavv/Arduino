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
let _loopTimeout: ReturnType<typeof setTimeout> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _ctx: Record<string, any> = {};

function stopSimulation() {
  if (_loopTimeout) { clearTimeout(_loopTimeout); _loopTimeout = null; }
  scheduler?.stop();
  post({ type: 'STOPPED' });
}

async function runSimulation(circuit: CircuitSnapshot, code: string) {
  try {
    const transpiler = new ArduinoTranspiler();
    const jsCode = transpiler.transpile(code);

    scheduler = new SimScheduler();
    gpio = new GpioController(post);

    // 컴포넌트에서 입력 콜백 등록
    for (const comp of circuit.components) {
      if (comp.type === 'button') {
        for (const [pin, target] of Object.entries(comp.connections)) {
          if (pin === 'PIN1A' && typeof target === 'number') {
            gpio.registerInputCallback(target, () => {
              // 버튼 상태는 메인에서 SENSOR_UPDATE로 전달됨
              return _ctx[`__btn_${comp.id}`] ?? 0;
            });
          }
        }
      }
      if (comp.type === 'potentiometer') {
        for (const [pin, target] of Object.entries(comp.connections)) {
          if (pin === 'WIPER' && typeof target === 'number') {
            gpio.registerInputCallback(target, () => {
              return _ctx[`__pot_${comp.id}`] ?? 512;
            });
          }
        }
      }
    }

    const preamble = buildPreamble(gpio, scheduler, post, circuit.boardType);

    const fullCode = `
${preamble}

// ─── User Code ────────────────────────────────────────────
${jsCode}
// ─────────────────────────────────────────────────────────

// 실행 엔트리
await setup();
while (true) {
  await loop();
  await __delay(1); // yield
}
`;

    scheduler.start();

    // AsyncFunction으로 실행
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('gpio', 'scheduler', 'postFn', fullCode);
    await fn(gpio, scheduler, post);

  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // 정상 종료
      return;
    }
    post({
      type: 'RUNTIME_ERROR',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

(self as unknown as Worker).addEventListener('message', async (e: MessageEvent<MainToWorker>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'INIT':
      post({ type: 'READY' });
      break;

    case 'START':
      break;

    case 'INIT':
      // 이미 처리됨
      break;

    case 'STOP':
      stopSimulation();
      break;

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
  }
});

// INIT+START를 합친 메시지 처리
(self as unknown as Worker).addEventListener('message', async (e: MessageEvent<MainToWorker>) => {
  if (e.data.type === 'INIT' && 'code' in e.data) {
    await runSimulation(e.data.circuit, e.data.code);
  }
});
