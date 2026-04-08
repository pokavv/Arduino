/**
 * @file runtime.js
 * @brief Arduino API를 JavaScript로 구현하는 런타임
 *
 * ESP32-C3 Super Mini의 하드웨어 동작을 소프트웨어로 에뮬레이션합니다.
 *
 * 주요 기능:
 * - GPIO (pinMode, digitalWrite, digitalRead)
 * - ADC (analogRead 0~4095, 12비트)
 * - PWM (LEDC API: ledcSetup, ledcAttachPin, ledcWrite)
 * - 타이밍 (millis, micros, _delay, _delayMicros)
 * - 인터럽트 (attachInterrupt, detachInterrupt)
 * - 수학 함수 (map, constrain, abs, min, max, random)
 * - Serial 모니터 (_Serial)
 *
 * 사용 예:
 *   const sim = { ... };   // 시뮬레이터 객체
 *   const runtime = new ArduinoRuntime(sim);
 *   // 트랜스파일된 코드에서 _runtime = runtime; 으로 바인딩
 */

/**
 * Arduino/ESP32 런타임 에뮬레이터
 */
class ArduinoRuntime {
    /**
     * @param {object} simulator - 시뮬레이터 인스턴스
     *   simulator.onGpioChange(pin, value)    - GPIO 변경 콜백
     *   simulator.onPwmChange(pin, duty, freq) - PWM 변경 콜백
     *   simulator.serialMonitor               - { print(text), clear() }
     */
    constructor(simulator) {
        /** @type {object} 부모 시뮬레이터 참조 */
        this._simulator = simulator || {};

        // ── GPIO 상태 맵 ──────────────────────────────────────────
        /**
         * 각 핀의 모드/값/PWM 채널 정보
         * key: 핀 번호(number), value: { mode, value, pwmChannel }
         * mode: 0=INPUT, 1=OUTPUT, 2=INPUT_PULLUP
         * @type {Map<number, {mode: number, value: number, pwmChannel: number|null}>}
         */
        this.gpioState = new Map();

        // ── ADC ───────────────────────────────────────────────────
        /**
         * 각 ADC 핀에 주입된 값 (0~4095, 12비트)
         * @type {Map<number, number>}
         */
        this.adcValues = new Map();

        /** ADC 해상도 (기본 12비트) */
        this._adcResolution = 12;

        // ── PWM (LEDC) ────────────────────────────────────────────
        /**
         * LEDC 채널 설정
         * key: 채널 번호, value: { freq, resolution, duty, pin }
         * @type {Map<number, {freq: number, resolution: number, duty: number, pin: number|null}>}
         */
        this.pwmChannels = new Map();

        // ── 인터럽트 ──────────────────────────────────────────────
        /**
         * 핀별 인터럽트 핸들러
         * key: 핀 번호, value: { fn, mode, lastState }
         * mode: 1=RISING, 2=FALLING, 3=CHANGE
         * @type {Map<number, {fn: Function, mode: number, lastState: number}>}
         */
        this.interrupts = new Map();

        // ── 타이밍 ────────────────────────────────────────────────
        /**
         * 시뮬레이션 시작 시각 (실제 Date.now() 기준)
         * @type {number}
         */
        this._startTime = Date.now();

        /**
         * 속도 배율 (1.0 = 실시간, 2.0 = 2배속)
         * Scheduler와 공유
         * @type {number}
         */
        this.speedMultiplier = 1.0;

        // ── Serial ────────────────────────────────────────────────
        this._serialObj = this._createSerialObject();

        // ── 이벤트 리스너 ─────────────────────────────────────────
        /** @type {Map<string, Function[]>} */
        this._listeners = new Map();

        // ── 내장 LED 상태 (Active LOW) ────────────────────────────
        /** G8 = 핀 8, Active LOW */
        this._builtinLedPin = 8;
    }

    // ─────────────────────────────────────────────
    // 이벤트 에미터
    // ─────────────────────────────────────────────

    /**
     * 이벤트 리스너를 등록합니다.
     * @param {string} event - 'gpio-change' | 'pwm-change' | 'serial-output'
     * @param {Function} listener
     */
    on(event, listener) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(listener);
    }

    /**
     * 이벤트 리스너를 해제합니다.
     * @param {string} event
     * @param {Function} listener
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
                    console.warn(`[Runtime] 이벤트 리스너 오류 (${event}):`, e);
                }
            });
        }
        // 시뮬레이터 콜백도 호출
        if (event === 'gpio-change' && typeof this._simulator.onGpioChange === 'function') {
            this._simulator.onGpioChange(...args);
        }
        if (event === 'pwm-change' && typeof this._simulator.onPwmChange === 'function') {
            this._simulator.onPwmChange(...args);
        }
    }

    // ─────────────────────────────────────────────
    // 런타임 수명주기
    // ─────────────────────────────────────────────

    /**
     * 런타임을 초기화(리셋)합니다.
     * 시뮬레이션 재시작 시 호출합니다.
     */
    reset() {
        this.gpioState.clear();
        this.adcValues.clear();
        this.pwmChannels.clear();
        this.interrupts.clear();
        this._startTime = Date.now();
        this._serialObj._inputBuffer = [];
        this._adcResolution = 12;
    }

    // ─────────────────────────────────────────────
    // GPIO
    // ─────────────────────────────────────────────

    /**
     * 핀 모드를 설정합니다.
     * @param {number} pin  - 핀 번호
     * @param {number} mode - OUTPUT(1) | INPUT(0) | INPUT_PULLUP(2)
     */
    pinMode(pin, mode) {
        pin  = parseInt(pin, 10);
        mode = parseInt(mode, 10);

        if (!this.gpioState.has(pin)) {
            this.gpioState.set(pin, { mode: 0, value: 0, pwmChannel: null });
        }
        const state = this.gpioState.get(pin);
        state.mode = mode;

        // INPUT_PULLUP → 기본값 HIGH
        if (mode === 2) {
            state.value = 1;
        }

        this._emit('gpio-change', pin, state.value, mode);
    }

    /**
     * 디지털 출력 핀의 값을 설정합니다.
     * ESP32-C3 Super Mini 내장 LED(G8)는 Active LOW입니다.
     * @param {number} pin   - 핀 번호
     * @param {number} value - HIGH(1) | LOW(0)
     */
    digitalWrite(pin, value) {
        pin   = parseInt(pin, 10);
        value = value ? 1 : 0;

        if (!this.gpioState.has(pin)) {
            this.gpioState.set(pin, { mode: 1, value: 0, pwmChannel: null });
        }
        const state = this.gpioState.get(pin);
        const prevValue = state.value;
        state.value = value;

        this._emit('gpio-change', pin, value);

        // 인터럽트 트리거 확인
        this._checkInterrupt(pin, prevValue, value);
    }

    /**
     * 디지털 입력 핀의 값을 읽습니다.
     * gpioState에 설정된 값 또는 INPUT_PULLUP이면 HIGH를 반환합니다.
     * @param {number} pin - 핀 번호
     * @returns {number} HIGH(1) | LOW(0)
     */
    digitalRead(pin) {
        pin = parseInt(pin, 10);

        if (!this.gpioState.has(pin)) {
            // 미설정 핀 → 부동 입력(floating) 시뮬: 0 반환
            return 0;
        }
        const state = this.gpioState.get(pin);

        // INPUT_PULLUP이고 외부 신호가 없으면 HIGH
        if (state.mode === 2 && state.value === undefined) {
            return 1;
        }
        return state.value;
    }

    /**
     * 외부에서 디지털 핀 값을 강제로 설정합니다 (버튼 시뮬레이션 등).
     * @param {number} pin   - 핀 번호
     * @param {number} value - HIGH(1) | LOW(0)
     */
    setDigitalValue(pin, value) {
        pin   = parseInt(pin, 10);
        value = value ? 1 : 0;

        if (!this.gpioState.has(pin)) {
            this.gpioState.set(pin, { mode: 0, value: 0, pwmChannel: null });
        }
        const state    = this.gpioState.get(pin);
        const prevValue = state.value;
        state.value = value;

        // 인터럽트 트리거
        this._checkInterrupt(pin, prevValue, value);
    }

    // ─────────────────────────────────────────────
    // ADC (아날로그 입력)
    // ─────────────────────────────────────────────

    /**
     * ADC 값을 읽습니다. (0 ~ 4095, 12비트 기본)
     * Wi-Fi 활성화 시 노이즈가 추가됩니다.
     * @param {number} pin - ADC 가능 핀 (G0~G5 등)
     * @returns {number} 0 ~ 2^resolution - 1
     */
    analogRead(pin) {
        pin = parseInt(pin, 10);

        // 주입된 값이 있으면 사용
        if (this.adcValues.has(pin)) {
            const raw  = this.adcValues.get(pin);
            const maxV = (1 << this._adcResolution) - 1;
            // 약간의 노이즈 추가 (실제 ADC 동작 반영)
            const noise = Math.round((Math.random() - 0.5) * 4);
            return Math.max(0, Math.min(maxV, raw + noise));
        }

        // 기본값: 중간값 반환 (연결되지 않은 핀)
        return 0;
    }

    /**
     * ADC 해상도를 설정합니다. (ESP32: 9~12비트)
     * @param {number} bits - 비트 수 (9~12)
     */
    analogReadResolution(bits) {
        bits = parseInt(bits, 10);
        if (bits < 9 || bits > 12) {
            console.warn(`[Runtime] analogReadResolution: ${bits}비트는 지원 범위(9~12) 밖입니다.`);
            bits = 12;
        }
        this._adcResolution = bits;
    }

    /**
     * ADC 감쇠를 설정합니다.
     * @param {number} atten - ADC_0db(0) | ADC_2_5db(1) | ADC_6db(2) | ADC_11db(3)
     */
    analogSetAttenuation(atten) {
        // 시뮬레이터에서는 감쇠 설정 로그만 기록
        const attenMap = {
            0: '0dB (최대 1.1V)',
            1: '2.5dB (최대 1.5V)',
            2: '6dB (최대 2.2V)',
            3: '11dB (최대 3.9V)',
        };
        console.log(`[Runtime] analogSetAttenuation: ${attenMap[atten] || atten}`);
    }

    /**
     * 외부에서 ADC 핀 값을 주입합니다 (전위계, 센서 슬라이더 조작용).
     * @param {number} pin   - ADC 핀 번호
     * @param {number} value - 0 ~ 4095
     */
    setAdcValue(pin, value) {
        pin   = parseInt(pin, 10);
        value = Math.max(0, Math.min(4095, parseInt(value, 10)));
        this.adcValues.set(pin, value);
    }

    // ─────────────────────────────────────────────
    // PWM — ESP32 LEDC API
    // ─────────────────────────────────────────────

    /**
     * LEDC 채널을 초기화합니다.
     * @param {number} channel    - 채널 번호 (0~7)
     * @param {number} freq       - PWM 주파수 (Hz)
     * @param {number} resolution - 듀티 해상도 (비트, 1~16)
     * @returns {number} 실제 설정된 주파수 (Hz)
     */
    ledcSetup(channel, freq, resolution) {
        channel    = parseInt(channel, 10);
        freq       = parseFloat(freq);
        resolution = parseInt(resolution, 10);

        this.pwmChannels.set(channel, {
            freq:       freq,
            resolution: resolution,
            duty:       0,
            pin:        null,
        });

        return freq; // 성공 시 설정 주파수 반환
    }

    /**
     * LEDC 채널을 핀에 연결합니다.
     * @param {number} pin     - GPIO 핀 번호
     * @param {number} channel - LEDC 채널 번호
     */
    ledcAttachPin(pin, channel) {
        pin     = parseInt(pin, 10);
        channel = parseInt(channel, 10);

        if (!this.pwmChannels.has(channel)) {
            // 기본값으로 채널 생성
            this.pwmChannels.set(channel, { freq: 5000, resolution: 8, duty: 0, pin: null });
        }
        this.pwmChannels.get(channel).pin = pin;

        if (!this.gpioState.has(pin)) {
            this.gpioState.set(pin, { mode: 1, value: 0, pwmChannel: channel });
        } else {
            this.gpioState.get(pin).pwmChannel = channel;
        }
    }

    /**
     * LEDC 채널의 듀티를 설정합니다.
     * @param {number} channel - LEDC 채널 번호
     * @param {number} duty    - 듀티 값 (0 ~ 2^resolution - 1)
     */
    ledcWrite(channel, duty) {
        channel = parseInt(channel, 10);
        duty    = parseInt(duty, 10);

        if (!this.pwmChannels.has(channel)) {
            console.warn(`[Runtime] ledcWrite: 채널 ${channel}이 초기화되지 않았습니다.`);
            return;
        }
        const ch = this.pwmChannels.get(channel);
        ch.duty  = duty;

        // 핀에 PWM 값 반영
        if (ch.pin !== null) {
            const maxDuty  = (1 << ch.resolution) - 1;
            const fraction = maxDuty > 0 ? duty / maxDuty : 0;

            this._emit('pwm-change', ch.pin, duty, ch.freq, fraction, ch.resolution);
        }
    }

    /**
     * LEDC 채널로 특정 주파수의 톤을 출력합니다. (부저용)
     * @param {number} channel   - LEDC 채널 번호
     * @param {number} frequency - 출력 주파수 (Hz), 0이면 정지
     */
    ledcWriteTone(channel, frequency) {
        channel   = parseInt(channel, 10);
        frequency = parseFloat(frequency);

        if (!this.pwmChannels.has(channel)) {
            this.pwmChannels.set(channel, { freq: frequency, resolution: 8, duty: 0, pin: null });
        }
        const ch   = this.pwmChannels.get(channel);
        ch.freq    = frequency;

        if (frequency === 0) {
            ch.duty = 0;
        } else {
            // 50% 듀티 (음 출력)
            ch.duty = (1 << ch.resolution) >> 1;
        }

        if (ch.pin !== null) {
            this._emit('pwm-change', ch.pin, ch.duty, frequency, 0.5, ch.resolution);
        }
    }

    /**
     * 핀에서 LEDC 채널을 분리합니다.
     * @param {number} pin - GPIO 핀 번호
     */
    ledcDetachPin(pin) {
        pin = parseInt(pin, 10);

        // 이 핀과 연결된 채널 찾기
        this.pwmChannels.forEach((ch, channel) => {
            if (ch.pin === pin) {
                ch.pin = null;
            }
        });

        if (this.gpioState.has(pin)) {
            this.gpioState.get(pin).pwmChannel = null;
        }
    }

    // ─────────────────────────────────────────────
    // 타이밍
    // ─────────────────────────────────────────────

    /**
     * 시뮬레이션 시작 후 경과 시간을 밀리초로 반환합니다.
     * @returns {number} 경과 ms
     */
    millis() {
        return Math.floor((Date.now() - this._startTime) * this.speedMultiplier);
    }

    /**
     * 시뮬레이션 시작 후 경과 시간을 마이크로초로 반환합니다.
     * @returns {number} 경과 us
     */
    micros() {
        return this.millis() * 1000;
    }

    /**
     * 지정한 밀리초 동안 대기합니다 (Promise 기반, 논블로킹).
     * 속도 배율이 적용됩니다.
     * @param {number} ms - 대기 시간 (밀리초)
     * @returns {Promise<void>}
     */
    _delay(ms) {
        const actualMs = ms / this.speedMultiplier;
        return new Promise(resolve => setTimeout(resolve, actualMs));
    }

    /**
     * 지정한 마이크로초 동안 대기합니다.
     * 실제 us 단위 대기는 어렵기 때문에 최소 0ms setTimeout을 사용합니다.
     * @param {number} us - 대기 시간 (마이크로초)
     * @returns {Promise<void>}
     */
    _delayMicros(us) {
        const ms = us / 1000;
        return this._delay(Math.max(0, ms));
    }

    // ─────────────────────────────────────────────
    // 인터럽트
    // ─────────────────────────────────────────────

    /**
     * 핀 인터럽트를 등록합니다.
     * @param {number}   pin  - GPIO 핀 번호
     * @param {Function} fn   - 인터럽트 핸들러 함수
     * @param {number}   mode - RISING(1) | FALLING(2) | CHANGE(3)
     */
    attachInterrupt(pin, fn, mode) {
        pin  = parseInt(pin, 10);
        mode = parseInt(mode, 10);

        const currentState = this.gpioState.has(pin) ? this.gpioState.get(pin).value : 0;
        this.interrupts.set(pin, {
            fn:        fn,
            mode:      mode,
            lastState: currentState,
        });
    }

    /**
     * 핀 인터럽트를 해제합니다.
     * @param {number} pin - GPIO 핀 번호
     */
    detachInterrupt(pin) {
        pin = parseInt(pin, 10);
        this.interrupts.delete(pin);
    }

    /**
     * 값 변경 시 등록된 인터럽트를 트리거합니다.
     * @private
     */
    _checkInterrupt(pin, prevValue, newValue) {
        if (!this.interrupts.has(pin)) {
            return;
        }
        const isr = this.interrupts.get(pin);

        let triggered = false;

        switch (isr.mode) {
            case 1: // RISING
                triggered = (prevValue === 0 && newValue === 1);
                break;
            case 2: // FALLING
                triggered = (prevValue === 1 && newValue === 0);
                break;
            case 3: // CHANGE
                triggered = (prevValue !== newValue);
                break;
        }

        isr.lastState = newValue;

        if (triggered && typeof isr.fn === 'function') {
            try {
                isr.fn();
            } catch (e) {
                console.warn(`[Runtime] ISR 오류 (핀 ${pin}):`, e);
            }
        }
    }

    // ─────────────────────────────────────────────
    // 수학 함수
    // ─────────────────────────────────────────────

    /**
     * 값을 한 범위에서 다른 범위로 선형 매핑합니다.
     * @param {number} value    - 입력 값
     * @param {number} fromLow  - 입력 범위 최솟값
     * @param {number} fromHigh - 입력 범위 최댓값
     * @param {number} toLow    - 출력 범위 최솟값
     * @param {number} toHigh   - 출력 범위 최댓값
     * @returns {number}
     */
    map(value, fromLow, fromHigh, toLow, toHigh) {
        if (fromHigh === fromLow) {
            return toLow;
        }
        return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
    }

    /**
     * 값을 지정한 범위로 제한합니다.
     * @param {number} value - 입력 값
     * @param {number} min   - 최솟값
     * @param {number} max   - 최댓값
     * @returns {number}
     */
    constrain(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * 절댓값을 반환합니다.
     * @param {number} x
     * @returns {number}
     */
    abs(x) {
        return Math.abs(x);
    }

    /**
     * 두 값 중 작은 값을 반환합니다.
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    min(a, b) {
        return Math.min(a, b);
    }

    /**
     * 두 값 중 큰 값을 반환합니다.
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    max(a, b) {
        return Math.max(a, b);
    }

    /**
     * 난수를 생성합니다.
     * random(max)      → 0 이상 max 미만의 정수
     * random(min, max) → min 이상 max 미만의 정수
     * @param {number} min - 최솟값 (또는 최댓값, 인자 1개일 때)
     * @param {number} [max] - 최댓값
     * @returns {number}
     */
    random(min, max) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * 난수 시드를 설정합니다.
     * JS Math.random()은 시드 설정이 불가능하므로 로그만 남깁니다.
     * @param {number} seed
     */
    randomSeed(seed) {
        // JS 표준 Math.random은 시드 미지원 — 무시
        console.log(`[Runtime] randomSeed(${seed}) — JS에서는 시드 설정이 지원되지 않습니다.`);
    }

    // ─────────────────────────────────────────────
    // 타입 변환
    // ─────────────────────────────────────────────

    /**
     * 값을 문자열로 변환합니다.
     * @param {*} x
     * @returns {string}
     */
    String(x) {
        return String(x);
    }

    /**
     * 문자열을 정수로 파싱합니다.
     * @param {string} s
     * @returns {number}
     */
    parseInt(s) {
        return parseInt(s, 10);
    }

    /**
     * 문자열을 부동소수점으로 파싱합니다.
     * @param {string} s
     * @returns {number}
     */
    parseFloat(s) {
        return parseFloat(s);
    }

    // ─────────────────────────────────────────────
    // Serial
    // ─────────────────────────────────────────────

    /**
     * Serial 객체를 반환합니다.
     * 트랜스파일러가 `_Serial`로 치환한 코드에서 사용됩니다.
     * @returns {object}
     */
    get _Serial() {
        return this._serialObj;
    }

    /**
     * Serial 에뮬레이션 객체를 생성합니다.
     * @private
     * @returns {object}
     */
    _createSerialObject() {
        const runtime = this;

        return {
            /** @type {number} 설정된 보드 속도 */
            _baud: 115200,

            /** @type {string[]} 입력 버퍼 (문자 단위) */
            _inputBuffer: [],

            /** @type {boolean} 초기화 완료 여부 */
            _initialized: false,

            /**
             * 시리얼 통신을 초기화합니다.
             * @param {number} baud - 보드 속도 (예: 115200)
             */
            begin(baud) {
                this._baud        = baud || 115200;
                this._initialized = true;
                runtime._emit('serial-output',
                    `[Serial 초기화: ${this._baud} baud]\n`
                );
            },

            /**
             * 값을 줄바꿈 없이 출력합니다.
             * @param {*} x - 출력할 값
             */
            print(x) {
                const text = this._formatValue(x);
                runtime._emit('serial-output', text);
                if (runtime._simulator.serialMonitor &&
                    typeof runtime._simulator.serialMonitor.print === 'function') {
                    runtime._simulator.serialMonitor.print(text);
                }
            },

            /**
             * 값을 줄바꿈과 함께 출력합니다.
             * @param {*} x - 출력할 값
             */
            println(x) {
                const text = (x !== undefined ? this._formatValue(x) : '') + '\n';
                runtime._emit('serial-output', text);
                if (runtime._simulator.serialMonitor &&
                    typeof runtime._simulator.serialMonitor.print === 'function') {
                    runtime._simulator.serialMonitor.print(text);
                }
            },

            /**
             * 입력 버퍼에 남은 바이트 수를 반환합니다.
             * @returns {number}
             */
            available() {
                return this._inputBuffer.length;
            },

            /**
             * 입력 버퍼에서 문자 하나를 읽습니다.
             * @returns {number} 문자 코드 또는 -1 (버퍼 비어있음)
             */
            read() {
                if (this._inputBuffer.length === 0) {
                    return -1;
                }
                const ch = this._inputBuffer.shift();
                return typeof ch === 'string' ? ch.charCodeAt(0) : ch;
            },

            /**
             * 특정 문자가 나올 때까지 버퍼를 읽어 문자열로 반환합니다.
             * @param {string} terminator - 종료 문자 (예: '\n')
             * @returns {string}
             */
            readStringUntil(terminator) {
                const result = [];
                while (this._inputBuffer.length > 0) {
                    const ch = this._inputBuffer[0];
                    const charStr = typeof ch === 'number' ? String.fromCharCode(ch) : ch;
                    if (charStr === terminator) {
                        this._inputBuffer.shift(); // 종료 문자 소비
                        break;
                    }
                    result.push(charStr);
                    this._inputBuffer.shift();
                }
                return result.join('');
            },

            /**
             * 외부에서 시리얼 입력을 주입합니다.
             * @param {string} text - 입력 문자열
             */
            inject(text) {
                for (const ch of text) {
                    this._inputBuffer.push(ch);
                }
            },

            /**
             * 값을 출력 문자열로 포맷합니다.
             * @private
             */
            _formatValue(x) {
                if (x === null || x === undefined) {
                    return 'null';
                }
                if (typeof x === 'boolean') {
                    return x ? '1' : '0'; // Arduino: true→1, false→0
                }
                if (typeof x === 'number') {
                    // 정수이면 정수 출력, 아니면 2자리 소수
                    return Number.isInteger(x) ? String(x) : x.toFixed(2);
                }
                return String(x);
            },
        };
    }
}

// 전역으로 노출 (script 태그 로드 호환)
if (typeof window !== 'undefined') {
    window.ArduinoRuntime = ArduinoRuntime;
}
