import type { GpioController } from '../runtime/gpio.js';
import type { WorkerToMain } from '../types.js';

type PostFn = (msg: WorkerToMain) => void;

interface I2CDevice {
  id: string;
  address: number;
  type: string;
}

/**
 * Wire (I2C) 라이브러리 런타임
 */
export class WireRuntime {
  private _devices: I2CDevice[] = [];
  private _currentAddress = 0;
  private _buffer: number[] = [];
  private _gpio: GpioController;
  private _postFn: PostFn;

  constructor(gpio: GpioController, postFn: PostFn) {
    this._gpio = gpio;
    this._postFn = postFn;
  }

  registerDevice(id: string, address: number, type: string) {
    this._devices.push({ id, address, type });
  }

  begin() {
    // I2C 초기화
  }

  beginTransmission(address: number) {
    this._currentAddress = address;
    this._buffer = [];
  }

  write(data: number | number[] | string) {
    if (Array.isArray(data)) {
      this._buffer.push(...data);
    } else if (typeof data === 'string') {
      for (const ch of data) this._buffer.push(ch.charCodeAt(0));
    } else {
      this._buffer.push(data);
    }
  }

  endTransmission(): number {
    const device = this._devices.find(d => d.address === this._currentAddress);
    if (device) {
      this._postFn({
        type: 'COMPONENT_UPDATE',
        id: device.id,
        pin: '__I2C_WRITE',
        value: this._buffer.length,
      });
      // 버퍼를 JSON으로 직렬화해서 전달
      const msg = JSON.stringify(this._buffer);
      this._postFn({
        type: 'SERIAL_OUTPUT',
        text: `[I2C@0x${this._currentAddress.toString(16).toUpperCase()}] ${msg}\n`,
      } as WorkerToMain);
    }
    this._buffer = [];
    return device ? 0 : 2; // 0=success, 2=NACK
  }

  requestFrom(address: number, count: number): number {
    return count;
  }

  available(): number {
    return 0;
  }

  read(): number {
    return 0;
  }
}
