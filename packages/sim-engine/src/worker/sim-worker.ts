import type { MainToWorker, WorkerToMain, CircuitSnapshot } from '../types.js';
import { ArduinoTranspiler } from '../runtime/transpiler.js';
import { SimScheduler } from '../runtime/scheduler.js';
import { GpioController } from '../runtime/gpio.js';
import { buildPreamble } from '../runtime/preamble.js';
import { INPUT_PIN_REGISTRY } from '../runtime/input-pin-registry.js';

/**
 * 센서 타입별 data 키 → _ctx 키 접두사 매핑 레지스트리
 * 새 센서 추가 시 이 레지스트리만 수정하면 됨 (worker 핸들러 코드 수정 불필요)
 */
const SENSOR_DATA_MAP: Record<string, Record<string, string>> = {
  dht:       { temperature: '__dht_temp',       humidity: '__dht_hum' },
  ultrasonic:{ distanceCm:  '__ultrasonic_dist' },
  servo:     { angle:       '__servo_angle'      },
};

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

    // GPIO번호 → 컴포넌트 맵 (preamble에서 _gpioToComp로 참조)
    const gpioToComp = new Map<number, { id: string; type: string }>();
    const i2cDevices = new Map<number, { id: string; type: string }>();
    for (const comp of circuit.components) {
      for (const [, target] of Object.entries(comp.connections)) {
        if (typeof target === 'number') gpioToComp.set(target, { id: comp.id, type: comp.type });
      }
      const addr = (comp.props as Record<string, unknown>).i2cAddress;
      if (typeof addr === 'number') i2cDevices.set(addr, { id: comp.id, type: comp.type });
    }
    _ctx._gpioToComp = gpioToComp;
    _ctx._i2cDevices = i2cDevices;
    _ctx._serialInputBuffer = _serialInputBuffer; // 동일 참조 — message handler의 push()가 반영됨

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
      const id = msg.componentId;
      const comp = _pendingCircuit?.components.find(c => c.id === id);
      if (comp) {
        // SENSOR_DATA_MAP에 등록된 타입: data 키 → _ctx 키 접두사로 자동 매핑
        const mapping = SENSOR_DATA_MAP[comp.type];
        if (mapping) {
          for (const [dataKey, ctxPrefix] of Object.entries(mapping)) {
            if (msg.data[dataKey] !== undefined) {
              _ctx[`${ctxPrefix}_${id}`] = msg.data[dataKey];
            }
          }
        } else if (msg.data.value !== undefined) {
          // 레지스트리 미등록 타입: INPUT_PIN_REGISTRY 핸들러 기반 폴백
          const handlers = INPUT_PIN_REGISTRY[comp.type] ?? [];
          for (const h of handlers) _ctx[`${h.ctxKey}_${comp.id}`] = msg.data.value;
        }
      }
      // 범용: 항상 전체 데이터 저장
      _ctx[`__sensor_${id}`] = msg.data;
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
