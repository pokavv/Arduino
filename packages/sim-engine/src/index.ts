export { ArduinoTranspiler } from './runtime/transpiler.js';
export { SimScheduler } from './runtime/scheduler.js';
export { GpioController } from './runtime/gpio.js';
export { buildPreamble } from './runtime/preamble.js';
export { WireRuntime } from './libraries/wire.js';
export { getBoardConfig } from './boards.js';
export type { BoardConfig } from './boards.js';
export { INPUT_PIN_REGISTRY } from './runtime/input-pin-registry.js';
export type { InputPinHandler } from './runtime/input-pin-registry.js';
export type {
  MainToWorker,
  WorkerToMain,
  CircuitSnapshot,
  ComponentSnapshot,
} from './types.js';
