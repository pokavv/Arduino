// Web Worker 진입점 — Vite worker 번들링을 통해 별도 chunk로 분리됨
import type { MainToWorker, WorkerToMain, CircuitSnapshot } from '@sim/engine';
import { ArduinoTranspiler, INPUT_PIN_REGISTRY } from '@sim/engine';
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

    // 컴포넌트 입력 콜백 — INPUT_PIN_REGISTRY 기반 일반화
    for (const comp of circuit.components) {
      const handlers = INPUT_PIN_REGISTRY[comp.type];
      if (!handlers?.length) continue;
      for (const [pin, target] of Object.entries(comp.connections)) {
        const handler = handlers.find(h => h.pin === pin);
        if (handler && typeof target === 'number') {
          const ctxKey = `${handler.ctxKey}_${comp.id}`;
          const defaultVal = handler.defaultValue;
          gpio.registerInputCallback(target, () => (_ctx[ctxKey] ?? defaultVal) as number);
        }
      }
    }

    // GPIO 번호 → { id, type } 역방향 맵
    const _gpioToComp = new Map<number, { id: string; type: string }>();
    for (const comp of circuit.components) {
      for (const [, target] of Object.entries(comp.connections)) {
        if (typeof target === 'number') {
          _gpioToComp.set(target, { id: comp.id, type: comp.type });
        }
      }
    }

    // I2C 주소 → { id, type } 맵
    const _i2cDevices = new Map<number, { id: string; type: string }>();
    for (const comp of circuit.components) {
      const addr = comp.props.i2cAddress;
      if (typeof addr === 'number') {
        _i2cDevices.set(addr, { id: comp.id, type: comp.type });
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
    const fn = new AsyncFunction(
      'gpio', 'scheduler', 'postFn', '_ctx', '_serialInputBuffer', '_gpioToComp', '_i2cDevices',
      fullCode
    );
    await fn(gpio, scheduler, post, _ctx, _serialInputBuffer, _gpioToComp, _i2cDevices);

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

    case 'SENSOR_UPDATE': {
      const comp = _pendingCircuit?.components.find(c => c.id === msg.componentId);
      if (comp) {
        const handlers = INPUT_PIN_REGISTRY[comp.type] ?? [];
        if (msg.data.value !== undefined) {
          for (const h of handlers) {
            _ctx[`${h.ctxKey}_${comp.id}`] = msg.data.value;
          }
        }
        // 타입별 특수 데이터 저장
        if (msg.data.temperature !== undefined) _ctx[`__dht_temp_${comp.id}`] = msg.data.temperature;
        if (msg.data.humidity    !== undefined) _ctx[`__dht_hum_${comp.id}`]  = msg.data.humidity;
        if (msg.data.distanceCm  !== undefined) _ctx[`__ultrasonic_dist_${comp.id}`] = msg.data.distanceCm;
      }
      _ctx[`__sensor_${msg.componentId}`] = msg.data;
      break;
    }

    case 'SERIAL_INPUT':
      for (const ch of msg.text) {
        _serialInputBuffer.push(ch.charCodeAt(0));
      }
      break;
  }
});
