/**
 * 시뮬레이션 타이밍 스케줄러
 * 실제 시간 기반으로 millis/micros/delay 구현
 */
export class SimScheduler {
  private _startTime = 0;
  private _running = false;
  private _abortController = new AbortController();

  start() {
    this._startTime = performance.now();
    this._running = true;
    this._abortController = new AbortController();
  }

  stop() {
    this._running = false;
    this._abortController.abort();
  }

  reset() {
    this.stop();
    this._startTime = performance.now();
    this._running = true;
    this._abortController = new AbortController();
  }

  get isRunning() { return this._running; }

  millis(): number {
    if (!this._running) return 0;
    return Math.floor(performance.now() - this._startTime);
  }

  micros(): number {
    if (!this._running) return 0;
    return Math.floor((performance.now() - this._startTime) * 1000);
  }

  /** await __delay(ms) 구현 */
  delay(ms: number): Promise<void> {
    if (!this._running) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const signal = this._abortController.signal;
      if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }

      const id = setTimeout(() => {
        if (!signal.aborted) resolve();
        else reject(new DOMException('Aborted', 'AbortError'));
      }, ms);

      signal.addEventListener('abort', () => {
        clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });
  }

  delayUs(us: number): Promise<void> {
    // 브라우저 setTimeout 최소 정밀도는 ~1ms이므로 1ms 미만은 1ms로 처리
    return this.delay(Math.max(1, us / 1000));
  }
}
