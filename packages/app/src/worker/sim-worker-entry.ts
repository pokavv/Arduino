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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _ctx: Record<string, any> = {};

function stopSimulation() {
  scheduler?.stop();
  post({ type: 'STOPPED' });
}

async function runSimulation(circuit: CircuitSnapshot, code: string) {
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
            const cid = comp.id;
            gpio.registerInputCallback(target, () => _ctx[`__btn_${cid}`] ?? 0);
          }
        }
      }
      if (comp.type === 'potentiometer') {
        for (const [pin, target] of Object.entries(comp.connections)) {
          if (pin === 'WIPER' && typeof target === 'number') {
            const cid = comp.id;
            gpio.registerInputCallback(target, () => _ctx[`__pot_${cid}`] ?? 512);
          }
        }
      }
    }

    const preamble = buildPreamble(gpio, scheduler, post, circuit.boardType);
    const fullCode = `
${preamble}
${jsCode}
// ─── 실행 엔트리 ───
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
    const fn = new AsyncFunction('gpio', 'scheduler', 'postFn', fullCode);
    await fn(gpio, scheduler, post);

  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    post({
      type: 'RUNTIME_ERROR',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

self.addEventListener('message', async (e: MessageEvent<MainToWorker>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'INIT':
      await runSimulation(msg.circuit, msg.code);
      break;
    case 'STOP':
    case 'RESET':
      stopSimulation();
      break;
    case 'PIN_EVENT':
      gpio?.injectPinValue(msg.pin, msg.value);
      break;
    case 'SENSOR_UPDATE':
      if (msg.data.value !== undefined) {
        _ctx[`__btn_${msg.componentId}`] = msg.data.value;
        _ctx[`__pot_${msg.componentId}`] = msg.data.value;
      }
      Object.assign(_ctx, {[`__sensor_${msg.componentId}`]: msg.data});
      break;
  }
});
