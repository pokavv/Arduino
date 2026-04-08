/**
 * @file runtime.js
 * @brief Arduino API를 JavaScript로 구현하는 범용 런타임
 *
 * 다양한 Arduino 호환 보드의 하드웨어 동작을 소프트웨어로 에뮬레이션합니다.
 *
 * 주요 기능:
 * - GPIO (pinMode, digitalWrite, digitalRead)
 * - ADC (analogRead, analogReadResolution)
 * - PWM: 표준 analogWrite (0~255) + ESP32 LEDC API
 * - 타이밍 (millis, micros, _delay, _delayMicros)
 * - 인터럽트 (attachInterrupt, detachInterrupt)
 * - 수학 함수 (map, constrain, abs, min, max, random)
 * - 비트 조작 (bitRead, bitSet, bitClear, bitWrite)
 * - 디지털 프로토콜 (shiftOut, shiftIn, pulseIn)
 * - tone / noTone
 * - I2C 디바이스 레지스트리
 * - SPI 디바이스 레지스트리
 * - Serial 모니터 (readString, parseInt, parseFloat, peek, flush, setTimeout)
 *
 * 사용 예:
 *   const boardDef = window.BOARDS['esp32-c3-supermini'];
 *   const runtime  = new ArduinoRuntime(simProxy, boardDef);
 */

/**
 * 범용 Arduino 런타임 에뮬레이터
 */
class ArduinoRuntime {
    /**
     * @param {object} simulator  - 시뮬레이터 인스턴스
     *   simulator.onGpioChange(pin, value)     - GPIO 변경 콜백
     *   simulator.onPwmChange(pin, duty, freq)  - PWM 변경 콜백
     *   simulator.serialMonitor                 - { print(text), clear() }
     * @param {object} [boardDef] - 보드 정의 객체 (window.BOARDS 항목)
     *   boardDef.builtinLed     - 내장 LED 핀 번호
     *   boardDef.builtinLedActiveLow - Active LOW 여부
     *   boardDef.adcResolution  - 기본 ADC 해상도
     */
    constructor(simulator, boardDef) {
        /** @type {object} 부모 시뮬레이터 참조 */
        this._simulator = simulator || {};

        /** @type {object|null} 보드 정의 */
        this._boardDef = boardDef || null;

        // ── 내장 LED ───────────────────────────────────────────────
        /**
         * 내장 LED 핀 번호 — 보드 정의에서 읽어오며, 없으면 13(표준 Arduino)
         * @type {number}
         */
        this._builtinLedPin = (boardDef && boardDef.builtinLed !== undefined)
            ? boardDef.builtinLed
            : 13;

        /**
         * Active LOW 여부 — ESP32-C3처럼 LOW = 켜짐인 보드
         * @type {boolean}
         */
        this._builtinLedActiveLow = (boardDef && boardDef.builtinLedActiveLow === true);

        // ── GPIO 상태 맵 ──────────────────────────────────────────
        /**
         * 각 핀의 모드/값/PWM 채널 정보
         * key: 핀 번호(number), value: { mode, value, pwmChannel }
         * mode: 0=INPUT, 1=OUTPUT, 2=INPUT_PULLUP, 3=INPUT_PULLDOWN
         * @type {Map<number, {mode: number, value: number, pwmChannel: number|null}>}
         */
        this.gpioState = new Map();

        // ── ADC ───────────────────────────────────────────────────
        /**
         * 각 ADC 핀에 주입된 값 (0~maxAdc)
         * @type {Map<number, number>}
         */
        this.adcValues = new Map();

        /**
         * ADC 해상도 — 보드 정의에서 읽어오며, 없으면 10비트(표준 Arduino)
         * @type {number}
         */
        this._adcResolution = (boardDef && boardDef.adcResolution !== undefined)
            ? boardDef.adcResolution
            : 10;

        // ── PWM (LEDC) ────────────────────────────────────────────
        /**
         * LEDC 채널 설정 (ESP32 전용 API)
         * key: 채널 번호, value: { freq, resolution, duty, pin }
         * @type {Map<number, {freq: number, resolution: number, duty: number, pin: number|null}>}
         */
        this.pwmChannels = new Map();

        /**
         * 표준 analogWrite 핀별 듀티 (0~255)
         * @type {Map<number, number>}
         */
        this._analogWriteValues = new Map();

        // ── tone ──────────────────────────────────────────────────
        /**
         * tone() 활성 핀별 타이머 ID
         * @type {Map<number, ReturnType<setTimeout>>}
         */
        this._toneTimers = new Map();

        // ── 인터럽트 ──────────────────────────────────────────────
        /**
         * 핀별 인터럽트 핸들러
         * key: 핀 번호, value: { fn, mode, lastState }
         * mode: 1=RISING, 2=FALLING, 3=CHANGE
         * @type {Map<number, {fn: Function, mode: number, lastState: number}>}
         */
        this.interrupts = new Map();

        // ── I2C 디바이스 레지스트리 ──────────────────────────────
        /**
         * I2C 주소별 디바이스 핸들러
         * @type {Map<number, object>}
         */
        this._i2cDevices = new Map();

        // ── SPI 디바이스 레지스트리 ──────────────────────────────
        /**
         * CS 핀별 SPI 디바이스 핸들러
         * @type {Map<number, object>}
         */
        this._spiDevices = new Map();

        // ── 타이밍 ────────────────────────────────────────────────
        /**
         * 시뮬레이션 시작 시각 (실제 Date.now() 기준)
         * @type {number}
         */
        this._startTime = Date.now();

        /**
         * 속도 배율 (1.0 = 실시간, 2.0 = 2배속)
         * @type {number}
         */
        this.speedMultiplier = 1.0;

        // ── Serial ────────────────────────────────────────────────
        this._serialObj = this._createSerialObject();

        // ── 이벤트 리스너 ─────────────────────────────────────────
        /** @type {Map<string, Function[]>} */
        this._listeners = new Map();
    }

    // ─────────────────────────────────────────────
    // 이벤트 에미터
    // ─────────────────────────────────────────────

    /**
     * 이벤트 리스너를 등록합니다.
     * @param {string}   event    - 'gpio-change' | 'pwm-change' | 'serial-output'
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
     * @param {string}   event
     * @param {Function} listener
     */
    off(event, listener) {
        const list = this._listeners.get(event);
        if (!list) return;
        const idx = list.indexOf(listener);
        if (idx !== -1) list.splice(idx, 1);
    }

    /**
     * 이벤트를 발행합니다.
     * @private
     */
    _emit(event, ...args) {
        const list = this._listeners.get(event);
        if (list) {
            list.forEach(fn => {
                try { fn(...args); } catch (e) {
                    console.warn(`[Runtime] 이벤트 리스너 오류 (${event}):`, e);
                }
            });
        }
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
     */
    reset() {
        this.gpioState.clear();
        this.adcValues.clear();
        this.pwmChannels.clear();
        this._analogWriteValues.clear();
        this.interrupts.clear();
        this._i2cDevices.clear();
        this._spiDevices.clear();
        // tone 타이머 정리
        this._toneTimers.forEach(id => clearTimeout(id));
        this._toneTimers.clear();
        this._startTime = Date.now();
        this._serialObj._inputBuffer = [];
        this._adcResolution = (this._boardDef && this._boardDef.adcResolution !== undefined)
            ? this._boardDef.adcResolution
            : 10;
    }

    // ─────────────────────────────────────────────
    // GPIO
    // ─────────────────────────────────────────────

    /**
     * 핀 모드를 설정합니다.
     * @param {number} pin  - 핀 번호
     * @param {number} mode - OUTPUT(1) | INPUT(0) | INPUT_PULLUP(2) | INPUT_PULLDOWN(3)
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
        if (mode === 2) state.value = 1;
        // INPUT_PULLDOWN → 기본값 LOW
        if (mode === 3) state.value = 0;

        this._emit('gpio-change', pin, state.value, mode);
    }

    /**
     * 디지털 출력 핀의 값을 설정합니다.
     * @param {number} pin   - 핀 번호
     * @param {number} value - HIGH(1) | LOW(0)
     */
    digitalWrite(pin, value) {
        pin   = parseInt(pin, 10);
        value = value ? 1 : 0;

        if (!this.gpioState.has(pin)) {
            this.gpioState.set(pin, { mode: 1, value: 0, pwmChannel: null });
        }
        const state     = this.gpioState.get(pin);
        const prevValue = state.value;
        state.value = value;

        this._emit('gpio-change', pin, value);
        this._checkInterrupt(pin, prevValue, value);
    }

    /**
     * 디지털 입력 핀의 값을 읽습니다.
     * @param {number} pin - 핀 번호
     * @returns {number} HIGH(1) | LOW(0)
     */
    digitalRead(pin) {
        pin = parseInt(pin, 10);

        if (!this.gpioState.has(pin)) return 0;
        const state = this.gpioState.get(pin);

        if (state.mode === 2 && state.value === undefined) return 1;
        return state.value;
    }

    /**
     * 외부에서 디지털 핀 값을 강제로 설정합니다 (버튼/센서 시뮬레이션).
     * @param {number} pin   - 핀 번호
     * @param {number} value - HIGH(1) | LOW(0)
     */
    setDigitalValue(pin, value) {
        pin   = parseInt(pin, 10);
        value = value ? 1 : 0;

        if (!this.gpioState.has(pin)) {
            this.gpioState.set(pin, { mode: 0, value: 0, pwmChannel: null });
        }
        const state     = this.gpioState.get(pin);
        const prevValue = state.value;
        state.value = value;

        this._checkInterrupt(pin, prevValue, value);
    }

    // ─────────────────────────────────────────────
    // ADC (아날로그 입력)
    // ─────────────────────────────────────────────

    /**
     * ADC 값을 읽습니다.
     * @param {number} pin - ADC 핀 번호
     * @returns {number} 0 ~ 2^resolution - 1
     */
    analogRead(pin) {
        pin = parseInt(pin, 10);

        if (this.adcValues.has(pin)) {
            const raw  = this.adcValues.get(pin);
            const maxV = (1 << this._adcResolution) - 1;
            const noise = Math.round((Math.random() - 0.5) * 4);
            return Math.max(0, Math.min(maxV, raw + noise));
        }
        return 0;
    }

    /**
     * ADC 해상도를 설정합니다.
     * @param {number} bits - 비트 수 (1~16)
     */
    analogReadResolution(bits) {
        bits = parseInt(bits, 10);
        if (bits < 1 || bits > 16) {
            console.warn(`[Runtime] analogReadResolution: ${bits}비트는 지원 범위(1~16) 밖입니다.`);
            bits = 10;
        }
        this._adcResolution = bits;
    }

    /**
     * 아날로그 기준 전압을 설정합니다 (AVR 호환).
     * @param {number} type - DEFAULT | INTERNAL | EXTERNAL
     */
    analogReference(type) {
        // 시뮬레이터에서는 로그만 기록
        console.log(`[Runtime] analogReference(${type}) — 시뮬레이터에서는 무시됩니다.`);
    }

    /**
     * ADC 감쇠를 설정합니다 (ESP32 전용).
     * @param {number} atten
     */
    analogSetAttenuation(atten) {
        const attenMap = {
            0: '0dB (최대 1.1V)', 1: '2.5dB (최대 1.5V)',
            2: '6dB (최대 2.2V)', 3: '11dB (최대 3.9V)',
        };
        console.log(`[Runtime] analogSetAttenuation: ${attenMap[atten] || atten}`);
    }

    /**
     * 외부에서 ADC 핀 값을 주입합니다.
     * @param {number} pin   - ADC 핀 번호
     * @param {number} value - 0 ~ 4095 (또는 보드 해상도 최댓값)
     */
    setAdcValue(pin, value) {
        pin   = parseInt(pin, 10);
        value = Math.max(0, Math.min((1 << this._adcResolution) - 1, parseInt(value, 10)));
        this.adcValues.set(pin, value);
    }

    // ─────────────────────────────────────────────
    // PWM — 표준 analogWrite (Arduino UNO 호환)
    // ─────────────────────────────────────────────

    /**
     * 표준 Arduino PWM 출력 (0~255).
     * ESP32에서도 동작하도록 LEDC 채널에 자동 매핑합니다.
     * @param {number} pin   - PWM 가능 핀
     * @param {number} value - 0 (완전 OFF) ~ 255 (완전 ON)
     */
    analogWrite(pin, value) {
        pin   = parseInt(pin, 10);
        value = Math.max(0, Math.min(255, parseInt(value, 10)));

        this._analogWriteValues.set(pin, value);

        // 핀 초기화
        if (!this.gpioState.has(pin)) {
            this.gpioState.set(pin, { mode: 1, value: 0, pwmChannel: null });
        }

        const fraction = value / 255;
        const freq     = 490; // 표준 Arduino PWM 주파수 (490Hz)

        this._emit('pwm-change', pin, value, freq, fraction, 8);

        // ESP32 LEDC 자동 매핑: 핀에 연결된 LEDC 채널이 있으면 함께 업데이트
        const state = this.gpioState.get(pin);
        if (state && state.pwmChannel !== null && state.pwmChannel !== undefined) {
            const ch = this.pwmChannels.get(state.pwmChannel);
            if (ch) {
                const maxDuty = (1 << ch.resolution) - 1;
                ch.duty = Math.round(fraction * maxDuty);
            }
        }
    }

    // ─────────────────────────────────────────────
    // PWM — ESP32 LEDC API
    // ─────────────────────────────────────────────

    /**
     * LEDC 채널을 초기화합니다.
     * @param {number} channel    - 채널 번호 (0~7)
     * @param {number} freq       - PWM 주파수 (Hz)
     * @param {number} resolution - 듀티 해상도 (비트, 1~16)
     * @returns {number} 설정된 주파수
     */
    ledcSetup(channel, freq, resolution) {
        channel    = parseInt(channel, 10);
        freq       = parseFloat(freq);
        resolution = parseInt(resolution, 10);

        this.pwmChannels.set(channel, { freq, resolution, duty: 0, pin: null });
        return freq;
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

        if (ch.pin !== null) {
            const maxDuty  = (1 << ch.resolution) - 1;
            const fraction = maxDuty > 0 ? duty / maxDuty : 0;
            this._emit('pwm-change', ch.pin, duty, ch.freq, fraction, ch.resolution);
        }
    }

    /**
     * LEDC 채널로 특정 주파수의 톤을 출력합니다 (부저용).
     * @param {number} channel   - LEDC 채널 번호
     * @param {number} frequency - 출력 주파수 (Hz), 0이면 정지
     */
    ledcWriteTone(channel, frequency) {
        channel   = parseInt(channel, 10);
        frequency = parseFloat(frequency);

        if (!this.pwmChannels.has(channel)) {
            this.pwmChannels.set(channel, { freq: frequency, resolution: 8, duty: 0, pin: null });
        }
        const ch = this.pwmChannels.get(channel);
        ch.freq  = frequency;
        ch.duty  = (frequency === 0) ? 0 : (1 << ch.resolution) >> 1;

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
        this.pwmChannels.forEach(ch => { if (ch.pin === pin) ch.pin = null; });
        if (this.gpioState.has(pin)) this.gpioState.get(pin).pwmChannel = null;
    }

    // ─────────────────────────────────────────────
    // tone / noTone
    // ─────────────────────────────────────────────

    /**
     * 지정 핀에 사각파 tone을 출력합니다 (부저/압전 스피커용).
     * @param {number} pin      - 출력 핀 번호
     * @param {number} freq     - 주파수 (Hz)
     * @param {number} [duration] - 지속 시간 (ms), 생략 시 noTone() 호출까지 계속
     */
    tone(pin, freq, duration) {
        pin  = parseInt(pin, 10);
        freq = parseFloat(freq);

        // 기존 tone 타이머 취소
        if (this._toneTimers.has(pin)) {
            clearTimeout(this._toneTimers.get(pin));
            this._toneTimers.delete(pin);
        }

        const duty = 128; // 50% 듀티 (8비트 기준)
        this._emit('pwm-change', pin, duty, freq, 0.5, 8);

        if (duration !== undefined && duration > 0) {
            const id = setTimeout(() => {
                this.noTone(pin);
                this._toneTimers.delete(pin);
            }, duration / this.speedMultiplier);
            this._toneTimers.set(pin, id);
        }
    }

    /**
     * 지정 핀의 tone 출력을 정지합니다.
     * @param {number} pin - 핀 번호
     */
    noTone(pin) {
        pin = parseInt(pin, 10);

        if (this._toneTimers.has(pin)) {
            clearTimeout(this._toneTimers.get(pin));
            this._toneTimers.delete(pin);
        }

        this._emit('pwm-change', pin, 0, 0, 0, 8);
    }

    // ─────────────────────────────────────────────
    // 디지털 프로토콜
    // ─────────────────────────────────────────────

    /**
     * SPI 방식으로 1바이트를 시프트 출력합니다.
     * @param {number} dataPin  - 데이터 핀
     * @param {number} clockPin - 클록 핀
     * @param {number} bitOrder - MSBFIRST(1) | LSBFIRST(0)
     * @param {number} value    - 출력할 바이트 값 (0~255)
     */
    shiftOut(dataPin, clockPin, bitOrder, value) {
        dataPin  = parseInt(dataPin,  10);
        clockPin = parseInt(clockPin, 10);
        value    = parseInt(value,    10) & 0xFF;

        for (let i = 0; i < 8; i++) {
            const bit = (bitOrder === 1)
                ? (value >> (7 - i)) & 1   // MSBFIRST
                : (value >> i) & 1;         // LSBFIRST

            this.digitalWrite(dataPin,  bit);
            this.digitalWrite(clockPin, 1);
            this.digitalWrite(clockPin, 0);
        }
    }

    /**
     * SPI 방식으로 1바이트를 시프트 입력합니다.
     * @param {number} dataPin  - 데이터 핀
     * @param {number} clockPin - 클록 핀
     * @param {number} bitOrder - MSBFIRST(1) | LSBFIRST(0)
     * @returns {number} 읽은 바이트 값 (0~255)
     */
    shiftIn(dataPin, clockPin, bitOrder) {
        dataPin  = parseInt(dataPin,  10);
        clockPin = parseInt(clockPin, 10);

        let value = 0;
        for (let i = 0; i < 8; i++) {
            this.digitalWrite(clockPin, 1);
            const bit = this.digitalRead(dataPin) ? 1 : 0;
            this.digitalWrite(clockPin, 0);

            if (bitOrder === 1) {
                value |= (bit << (7 - i)); // MSBFIRST
            } else {
                value |= (bit << i);       // LSBFIRST
            }
        }
        return value;
    }

    /**
     * 핀이 지정한 상태가 될 때까지의 시간을 마이크로초로 반환합니다.
     * 시뮬레이터에서는 핀 상태를 즉시 읽어 근사치를 반환합니다.
     * @param {number} pin     - 측정할 핀
     * @param {number} value   - 기다릴 상태 (HIGH=1 | LOW=0)
     * @param {number} [timeout=1000000] - 타임아웃 (us)
     * @returns {number} 펄스 폭 (us), 타임아웃 시 0
     */
    pulseIn(pin, value, timeout) {
        pin     = parseInt(pin, 10);
        value   = value ? 1 : 0;
        timeout = timeout !== undefined ? parseInt(timeout, 10) : 1000000;

        const current = this.digitalRead(pin);
        // 시뮬레이터에서는 현재 상태가 요청 값과 같으면 임의 펄스 폭 반환
        if (current === value) {
            return Math.floor(Math.random() * 500) + 100; // 100~600 us
        }
        return 0; // 타임아웃 또는 다른 상태
    }

    // ─────────────────────────────────────────────
    // I2C 디바이스 레지스트리
    // ─────────────────────────────────────────────

    /**
     * I2C 주소에 디바이스 핸들러를 등록합니다.
     * Wire 라이브러리 구현에서 사용합니다.
     * @param {number} address - 7비트 I2C 주소 (예: 0x3C)
     * @param {object} handler - { read(reg), write(reg, val) } 형식의 핸들러
     */
    registerI2CDevice(address, handler) {
        this._i2cDevices.set(address, handler);
    }

    /**
     * 등록된 I2C 디바이스 핸들러를 반환합니다.
     * @param {number} address - 7비트 I2C 주소
     * @returns {object|undefined}
     */
    getI2CDevice(address) {
        return this._i2cDevices.get(address);
    }

    // ─────────────────────────────────────────────
    // SPI 디바이스 레지스트리
    // ─────────────────────────────────────────────

    /**
     * CS 핀에 SPI 디바이스 핸들러를 등록합니다.
     * @param {number} csPin   - CS(Chip Select) 핀 번호
     * @param {object} handler - { transfer(byte) } 형식의 핸들러
     */
    registerSPIDevice(csPin, handler) {
        csPin = parseInt(csPin, 10);
        this._spiDevices.set(csPin, handler);
    }

    /**
     * 등록된 SPI 디바이스 핸들러를 반환합니다.
     * @param {number} csPin - CS 핀 번호
     * @returns {object|undefined}
     */
    getSPIDevice(csPin) {
        csPin = parseInt(csPin, 10);
        return this._spiDevices.get(csPin);
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
     * @param {number} ms - 대기 시간 (밀리초)
     * @returns {Promise<void>}
     */
    _delay(ms) {
        const actualMs = ms / this.speedMultiplier;
        return new Promise(resolve => setTimeout(resolve, actualMs));
    }

    /**
     * 지정한 마이크로초 동안 대기합니다.
     * @param {number} us - 대기 시간 (마이크로초)
     * @returns {Promise<void>}
     */
    _delayMicros(us) {
        return this._delay(Math.max(0, us / 1000));
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
        this.interrupts.set(pin, { fn, mode, lastState: currentState });
    }

    /**
     * 핀 인터럽트를 해제합니다.
     * @param {number} pin - GPIO 핀 번호
     */
    detachInterrupt(pin) {
        this.interrupts.delete(parseInt(pin, 10));
    }

    /**
     * 값 변경 시 등록된 인터럽트를 트리거합니다.
     * @private
     */
    _checkInterrupt(pin, prevValue, newValue) {
        if (!this.interrupts.has(pin)) return;
        const isr = this.interrupts.get(pin);
        let triggered = false;

        switch (isr.mode) {
            case 1: triggered = (prevValue === 0 && newValue === 1); break; // RISING
            case 2: triggered = (prevValue === 1 && newValue === 0); break; // FALLING
            case 3: triggered = (prevValue !== newValue);             break; // CHANGE
        }

        isr.lastState = newValue;

        if (triggered && typeof isr.fn === 'function') {
            try { isr.fn(); } catch (e) {
                console.warn(`[Runtime] ISR 오류 (핀 ${pin}):`, e);
            }
        }
    }

    // ─────────────────────────────────────────────
    // 수학 함수
    // ─────────────────────────────────────────────

    map(value, fromLow, fromHigh, toLow, toHigh) {
        if (fromHigh === fromLow) return toLow;
        return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
    }

    constrain(value, min, max) { return Math.min(Math.max(value, min), max); }

    abs(x)    { return Math.abs(x); }
    min(a, b) { return Math.min(a, b); }
    max(a, b) { return Math.max(a, b); }

    sq(x)  { return x * x; }
    cb(x)  { return x * x * x; }

    random(min, max) {
        if (max === undefined) { max = min; min = 0; }
        return Math.floor(Math.random() * (max - min)) + min;
    }

    randomSeed(seed) {
        console.log(`[Runtime] randomSeed(${seed}) — JS에서는 시드 설정이 지원되지 않습니다.`);
    }

    // ─────────────────────────────────────────────
    // 타입 변환
    // ─────────────────────────────────────────────

    String(x)      { return String(x); }
    parseInt(s)    { return parseInt(s, 10); }
    parseFloat(s)  { return parseFloat(s); }

    // ─────────────────────────────────────────────
    // Serial
    // ─────────────────────────────────────────────

    get _Serial() {
        return this._serialObj;
    }

    /**
     * Serial 에뮬레이션 객체를 생성합니다.
     * @private
     */
    _createSerialObject() {
        const runtime = this;

        return {
            /** @type {number} 보드 속도 */
            _baud: 115200,

            /** @type {Array<string|number>} 입력 버퍼 */
            _inputBuffer: [],

            /** @type {boolean} 초기화 완료 여부 */
            _initialized: false,

            /** @type {number} readString 타임아웃 (ms) */
            _timeout: 1000,

            begin(baud) {
                this._baud        = baud || 115200;
                this._initialized = true;
                runtime._emit('serial-output', `[Serial 초기화: ${this._baud} baud]\n`);
            },

            print(x) {
                const text = this._formatValue(x);
                runtime._emit('serial-output', text);
                if (runtime._simulator.serialMonitor &&
                    typeof runtime._simulator.serialMonitor.print === 'function') {
                    runtime._simulator.serialMonitor.print(text);
                }
            },

            println(x) {
                const text = (x !== undefined ? this._formatValue(x) : '') + '\n';
                runtime._emit('serial-output', text);
                if (runtime._simulator.serialMonitor &&
                    typeof runtime._simulator.serialMonitor.print === 'function') {
                    runtime._simulator.serialMonitor.print(text);
                }
            },

            available() {
                return this._inputBuffer.length;
            },

            /**
             * 버퍼에서 문자 하나를 읽고 제거합니다.
             * @returns {number} 문자 코드 또는 -1
             */
            read() {
                if (this._inputBuffer.length === 0) return -1;
                const ch = this._inputBuffer.shift();
                return typeof ch === 'string' ? ch.charCodeAt(0) : ch;
            },

            /**
             * 버퍼에서 문자 하나를 읽되, 제거하지 않습니다.
             * @returns {number} 문자 코드 또는 -1
             */
            peek() {
                if (this._inputBuffer.length === 0) return -1;
                const ch = this._inputBuffer[0];
                return typeof ch === 'string' ? ch.charCodeAt(0) : ch;
            },

            /**
             * 버퍼 전체를 문자열로 읽어 반환합니다.
             * @returns {string}
             */
            readString() {
                const result = [];
                while (this._inputBuffer.length > 0) {
                    const ch = this._inputBuffer.shift();
                    result.push(typeof ch === 'number' ? String.fromCharCode(ch) : ch);
                }
                return result.join('');
            },

            readStringUntil(terminator) {
                const result = [];
                while (this._inputBuffer.length > 0) {
                    const ch     = this._inputBuffer[0];
                    const charStr = typeof ch === 'number' ? String.fromCharCode(ch) : ch;
                    if (charStr === terminator) {
                        this._inputBuffer.shift();
                        break;
                    }
                    result.push(charStr);
                    this._inputBuffer.shift();
                }
                return result.join('');
            },

            /**
             * 버퍼에서 정수를 파싱해 반환합니다.
             * @returns {number}
             */
            parseInt() {
                // 숫자가 아닌 문자를 건너뛰고, 숫자를 읽어 반환
                while (this._inputBuffer.length > 0) {
                    const ch = this._inputBuffer[0];
                    const c  = typeof ch === 'number' ? String.fromCharCode(ch) : ch;
                    if (/[0-9\-]/.test(c)) break;
                    this._inputBuffer.shift();
                }
                let numStr = '';
                while (this._inputBuffer.length > 0) {
                    const ch = this._inputBuffer[0];
                    const c  = typeof ch === 'number' ? String.fromCharCode(ch) : ch;
                    if (/[0-9\-]/.test(c)) {
                        numStr += c;
                        this._inputBuffer.shift();
                    } else {
                        break;
                    }
                }
                return numStr ? parseInt(numStr, 10) : 0;
            },

            /**
             * 버퍼에서 부동소수점을 파싱해 반환합니다.
             * @returns {number}
             */
            parseFloat() {
                while (this._inputBuffer.length > 0) {
                    const ch = this._inputBuffer[0];
                    const c  = typeof ch === 'number' ? String.fromCharCode(ch) : ch;
                    if (/[0-9\-\.]/.test(c)) break;
                    this._inputBuffer.shift();
                }
                let numStr = '';
                while (this._inputBuffer.length > 0) {
                    const ch = this._inputBuffer[0];
                    const c  = typeof ch === 'number' ? String.fromCharCode(ch) : ch;
                    if (/[0-9\-\.]/.test(c)) {
                        numStr += c;
                        this._inputBuffer.shift();
                    } else {
                        break;
                    }
                }
                return numStr ? parseFloat(numStr) : 0;
            },

            /**
             * 출력 버퍼를 비웁니다 (시뮬레이터에서는 no-op).
             */
            flush() {
                // 시뮬레이터에서는 즉시 출력되므로 무시
            },

            /**
             * readString 계열 타임아웃을 설정합니다.
             * @param {number} ms - 타임아웃 (ms)
             */
            setTimeout(ms) {
                this._timeout = parseInt(ms, 10);
            },

            inject(text) {
                for (const ch of text) {
                    this._inputBuffer.push(ch);
                }
            },

            _formatValue(x) {
                if (x === null || x === undefined) return 'null';
                if (typeof x === 'boolean') return x ? '1' : '0';
                if (typeof x === 'number') {
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
