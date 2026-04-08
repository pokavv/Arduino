/**
 * @file scheduler.js
 * @brief 시뮬레이션 타이밍 및 루프 실행 관리자
 *
 * Arduino의 setup() + loop() 실행 모델을 재현합니다.
 *   1. setup() 한 번 실행
 *   2. loop() 무한 반복
 *
 * 속도 배율(speedMultiplier)로 시뮬레이션 속도를 조절합니다.
 * loop()는 비동기(async) 함수여야 합니다 (await _delay 사용).
 *
 * 사용 예:
 *   const scheduler = new Scheduler(runtime);
 *   scheduler.start();
 *   await scheduler.runSetup(setup);
 *   scheduler.runLoop(loop);
 */

/**
 * 시뮬레이션 스케줄러
 */
class Scheduler {
    /**
     * @param {ArduinoRuntime} runtime - ArduinoRuntime 인스턴스
     */
    constructor(runtime) {
        /** @type {ArduinoRuntime} */
        this._runtime = runtime;

        // ── 상태 ──────────────────────────────────────────────────
        /**
         * 시뮬레이션 시작 실제 시각 (Date.now() 기준, ms)
         * @type {number}
         */
        this.startTime = 0;

        /**
         * 시뮬레이션 실행 중 여부
         * @type {boolean}
         */
        this.running = false;

        /**
         * 일시 정지 여부
         * @type {boolean}
         */
        this.paused = false;

        /**
         * 속도 배율
         * 1.0 = 실시간, 2.0 = 2배속, 0.5 = 절반 속도
         * @type {number}
         */
        this.speedMultiplier = 1.0;

        // ── 내부 ──────────────────────────────────────────────────
        /**
         * loop() 실행 취소를 위한 AbortController
         * @type {AbortController|null}
         */
        this._abortController = null;

        /**
         * 현재 실행 중인 루프 Promise
         * @type {Promise<void>|null}
         */
        this._loopPromise = null;

        /**
         * 일시 정지 재개용 resolve 함수
         * @type {Function|null}
         */
        this._resumeResolve = null;

        /**
         * 이전 loop() 호출까지의 누적 경과 ms
         * (일시 정지 시 시간 동결용)
         * @type {number}
         */
        this._elapsedBeforePause = 0;

        /**
         * 일시 정지 시작 시각
         * @type {number}
         */
        this._pauseStartTime = 0;

        /**
         * loop() 한 번 실행 소요 시간 통계 (최근 N회)
         * @type {number[]}
         */
        this._loopTimings = [];

        /**
         * 최대 통계 샘플 수
         * @type {number}
         */
        this._maxTimingSamples = 100;

        /**
         * 이벤트 리스너
         * @type {Map<string, Function[]>}
         */
        this._listeners = new Map();
    }

    // ─────────────────────────────────────────────
    // 수명주기
    // ─────────────────────────────────────────────

    /**
     * 시뮬레이션을 시작합니다.
     * 타이머를 초기화하고 running 상태로 전환합니다.
     */
    start() {
        if (this.running) {
            console.warn('[Scheduler] 이미 실행 중입니다.');
            return;
        }

        this.startTime            = Date.now();
        this._elapsedBeforePause  = 0;
        this.running              = true;
        this.paused               = false;
        this._abortController     = new AbortController();
        this._loopTimings         = [];

        // runtime에 speedMultiplier 동기화
        if (this._runtime) {
            this._runtime._startTime        = this.startTime;
            this._runtime.speedMultiplier   = this.speedMultiplier;
        }

        this._emit('start');
    }

    /**
     * 시뮬레이션을 중지합니다.
     * 실행 중인 루프를 취소하고 stopped 상태로 전환합니다.
     */
    stop() {
        if (!this.running) {
            return;
        }

        this.running = false;
        this.paused  = false;

        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }

        // 일시 정지 상태면 재개하여 루프 종료 처리
        if (this._resumeResolve) {
            this._resumeResolve();
            this._resumeResolve = null;
        }

        this._emit('stop');
    }

    /**
     * 시뮬레이션을 완전히 리셋합니다.
     * 진행 중이면 중지 후 초기화합니다.
     */
    reset() {
        this.stop();

        this.startTime           = 0;
        this._elapsedBeforePause = 0;
        this._loopTimings        = [];

        if (this._runtime) {
            this._runtime.reset();
        }

        this._emit('reset');
    }

    /**
     * 실행을 일시 정지합니다.
     */
    pause() {
        if (!this.running || this.paused) {
            return;
        }

        this.paused             = true;
        this._pauseStartTime    = Date.now();

        this._emit('pause');
    }

    /**
     * 일시 정지를 해제하고 실행을 재개합니다.
     */
    resume() {
        if (!this.running || !this.paused) {
            return;
        }

        // 일시 정지 시간만큼 startTime을 앞으로 당겨 경과 시간 보정
        const pausedDuration = Date.now() - this._pauseStartTime;
        this.startTime      += pausedDuration;

        if (this._runtime) {
            this._runtime._startTime = this.startTime;
        }

        this.paused = false;

        if (this._resumeResolve) {
            this._resumeResolve();
            this._resumeResolve = null;
        }

        this._emit('resume');
    }

    // ─────────────────────────────────────────────
    // 타이밍
    // ─────────────────────────────────────────────

    /**
     * 시뮬레이션 시작 후 경과 시간을 밀리초로 반환합니다.
     * speedMultiplier가 적용됩니다.
     * @returns {number}
     */
    millis() {
        if (!this.running) {
            return 0;
        }
        if (this.paused) {
            return Math.floor(
                (this._pauseStartTime - this.startTime) * this.speedMultiplier
            );
        }
        return Math.floor((Date.now() - this.startTime) * this.speedMultiplier);
    }

    /**
     * 시뮬레이션 시작 후 경과 시간을 마이크로초로 반환합니다.
     * @returns {number}
     */
    micros() {
        return this.millis() * 1000;
    }

    /**
     * 지정한 밀리초 동안 대기합니다 (Promise).
     * 일시 정지 상태면 재개될 때까지 기다립니다.
     * 중지 신호가 오면 즉시 resolve됩니다.
     * @param {number} ms - 대기 시간 (시뮬레이션 ms)
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => {
            if (!this.running) {
                resolve();
                return;
            }

            const actualMs = ms / this.speedMultiplier;
            const signal   = this._abortController ? this._abortController.signal : null;

            // 중지 신호 처리
            const onAbort = () => {
                clearTimeout(timerId);
                resolve();
            };

            if (signal) {
                if (signal.aborted) {
                    resolve();
                    return;
                }
                signal.addEventListener('abort', onAbort, { once: true });
            }

            const timerId = setTimeout(() => {
                if (signal) {
                    signal.removeEventListener('abort', onAbort);
                }

                // 일시 정지 상태 처리
                if (this.paused) {
                    this._waitForResume().then(resolve);
                } else {
                    resolve();
                }
            }, Math.max(0, actualMs));
        });
    }

    /**
     * 재개 신호를 기다립니다.
     * @private
     * @returns {Promise<void>}
     */
    _waitForResume() {
        return new Promise(resolve => {
            if (!this.paused) {
                resolve();
                return;
            }
            this._resumeResolve = resolve;
        });
    }

    // ─────────────────────────────────────────────
    // 속도 설정
    // ─────────────────────────────────────────────

    /**
     * 시뮬레이션 속도 배율을 설정합니다.
     * @param {number} multiplier - 1.0 = 실시간, 0.5 = 절반, 2.0 = 2배속
     */
    setSpeed(multiplier) {
        multiplier = parseFloat(multiplier);
        if (multiplier <= 0) {
            console.warn('[Scheduler] speedMultiplier는 0보다 커야 합니다.');
            return;
        }
        this.speedMultiplier = multiplier;
        if (this._runtime) {
            this._runtime.speedMultiplier = multiplier;
        }
        this._emit('speed-change', multiplier);
    }

    // ─────────────────────────────────────────────
    // 루프 실행
    // ─────────────────────────────────────────────

    /**
     * setup() 함수를 한 번 실행합니다.
     * @param {Function} setupFn - async function setup() { ... }
     * @returns {Promise<void>}
     */
    async runSetup(setupFn) {
        if (typeof setupFn !== 'function') {
            console.warn('[Scheduler] setup() 함수가 없습니다.');
            return;
        }

        try {
            await setupFn();
        } catch (e) {
            console.error('[Scheduler] setup() 실행 오류:', e);
            this._emit('error', e);
        }
    }

    /**
     * loop() 함수를 무한 반복합니다.
     * stop()이 호출되거나 중지 신호가 발생하면 루프가 종료됩니다.
     *
     * @param {Function} loopFn - async function loop() { ... }
     * @returns {Promise<void>}
     */
    async runLoop(loopFn) {
        if (typeof loopFn !== 'function') {
            console.warn('[Scheduler] loop() 함수가 없습니다.');
            return;
        }

        const signal = this._abortController ? this._abortController.signal : null;

        let iterationCount = 0;

        while (this.running) {
            // 중지 신호 확인
            if (signal && signal.aborted) {
                break;
            }

            // 일시 정지 상태면 대기
            if (this.paused) {
                await this._waitForResume();
                if (!this.running) {
                    break;
                }
            }

            const loopStart = performance.now();

            try {
                await loopFn();
            } catch (e) {
                // 중지로 인한 오류 무시
                if (signal && signal.aborted) {
                    break;
                }
                console.error('[Scheduler] loop() 실행 오류:', e);
                this._emit('error', e);

                // 오류 후 짧은 대기 (무한 오류 루프 방지)
                await this._safeDelay(100);
            }

            const loopEnd     = performance.now();
            const loopDuration = loopEnd - loopStart;

            // 타이밍 통계 수집
            this._loopTimings.push(loopDuration);
            if (this._loopTimings.length > this._maxTimingSamples) {
                this._loopTimings.shift();
            }

            iterationCount++;

            // 100회마다 통계 이벤트 발행
            if (iterationCount % 100 === 0) {
                this._emit('stats', this.getStats());
            }

            // delay(0)가 없는 loop()의 무한 스핀 방지
            // loop() 자체에 delay가 없으면 최소 yield 삽입
            if (loopDuration < 1) {
                await this._safeDelay(0);
            }
        }

        this._emit('loop-end');
    }

    /**
     * 중지 신호를 무시하는 안전한 지연입니다 (내부 사용).
     * @private
     */
    _safeDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ─────────────────────────────────────────────
    // 통계
    // ─────────────────────────────────────────────

    /**
     * 루프 실행 통계를 반환합니다.
     * @returns {{ avgLoopMs: number, minLoopMs: number, maxLoopMs: number, elapsedMs: number }}
     */
    getStats() {
        const timings = this._loopTimings;
        if (timings.length === 0) {
            return { avgLoopMs: 0, minLoopMs: 0, maxLoopMs: 0, elapsedMs: this.millis() };
        }

        const sum = timings.reduce((a, b) => a + b, 0);
        return {
            avgLoopMs:  sum / timings.length,
            minLoopMs:  Math.min(...timings),
            maxLoopMs:  Math.max(...timings),
            elapsedMs:  this.millis(),
            iterations: timings.length,
        };
    }

    // ─────────────────────────────────────────────
    // 이벤트 에미터
    // ─────────────────────────────────────────────

    /**
     * 이벤트 리스너를 등록합니다.
     * @param {string}   event    - 이벤트 이름
     * @param {Function} listener - 콜백 함수
     */
    on(event, listener) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(listener);
    }

    /**
     * 이벤트 리스너를 해제합니다.
     * @param {string}   event    - 이벤트 이름
     * @param {Function} listener - 콜백 함수
     */
    off(event, listener) {
        const list = this._listeners.get(event);
        if (!list) {
            return;
        }
        const idx = list.indexOf(listener);
        if (idx !== -1) {
            list.splice(idx, 1);
        }
    }

    /**
     * 이벤트를 발행합니다.
     * @private
     */
    _emit(event, ...args) {
        const list = this._listeners.get(event);
        if (list) {
            list.forEach(fn => {
                try {
                    fn(...args);
                } catch (e) {
                    console.warn(`[Scheduler] 이벤트 리스너 오류 (${event}):`, e);
                }
            });
        }
    }
}

// 전역으로 노출 (script 태그 로드 호환)
if (typeof window !== 'undefined') {
    window.Scheduler = Scheduler;
}
