// Web Worker 진입점 — Vite worker 번들링을 통해 별도 chunk로 분리됨
import type { MainToWorker, WorkerToMain, CircuitSnapshot } from '@sim/engine';
import { ArduinoTranspiler } from '@sim/engine';
import { SimScheduler } from '@sim/engine';
import { GpioController } from '@sim/engine';
import { buildPreamble } from '@sim/engine';

function post(msg: WorkerToMain) {
  self.postMessage(msg);
}

let scheduler: SimScheduler | null = null;
let gpio: GpioController | null = null;
let _running = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _ctx: Record<string, any> = {};
const _serialInputBuffer: number[] = [];

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

    // 컴포넌트 입력 콜백
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

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor as {
      new(...args: string[]): (...args: unknown[]) => Promise<void>
    };
    const fn = new AsyncFunction('gpio', 'scheduler', 'postFn', '_ctx', '_serialInputBuffer', fullCode);
    await fn(gpio, scheduler, post, _ctx, _serialInputBuffer);

  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    post({
      type: 'RUNTIME_ERROR',
      message: err instanceof Error ? err.message : String(err),
    });
  } finally {
    _running = false;
  }
}

self.addEventListener('message', async (e: MessageEvent<MainToWorker>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'INIT':
      _pendingCircuit = msg.circuit;
      _pendingCode    = msg.code;
      _serialInputBuffer.length = 0;
      Object.keys(_ctx).forEach(k => delete _ctx[k]);
      post({ type: 'READY' });
      break;

    case 'START':
      if (_pendingCircuit && _pendingCode) {
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
      for (const ch of msg.text) {
        _serialInputBuffer.push(ch.charCodeAt(0));
      }
      break;
  }
});
