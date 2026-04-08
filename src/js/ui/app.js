/**
 * @file app.js
 * @brief 범용 Arduino 웹 시뮬레이터 — 메인 앱
 *
 * Scheduler + ArduinoRuntime + Transpiler + CircuitEditor 통합.
 * window.BOARDS 에 등록된 보드 정의를 기반으로 동작합니다.
 */

/* ═══════════════════════════════════════════════════════
   SimulatorEngine — 시뮬레이션 핵심 로직
═══════════════════════════════════════════════════════ */
class SimulatorEngine {
    /**
     * @param {object}   circuitEditor - CircuitEditor 인스턴스
     * @param {Function} onSerial      - (text, type) => void
     * @param {Function} onError       - (msg) => void
     * @param {Function} onStop        - () => void
     */
    constructor(circuitEditor, onSerial, onError, onStop) {
        this.circuit  = circuitEditor;
        this.onSerial = onSerial;
        this.onError  = onError;
        this.onStop   = onStop;

        this.transpiler  = new Transpiler();
        this.scheduler   = null;
        this.runtime     = null;
        this._running    = false;
        this._boardDef   = null; // 현재 선택된 보드 정의
    }

    /**
     * 사용할 보드 정의를 설정합니다.
     * @param {object|null} boardDef - window.BOARDS 의 항목
     */
    setBoard(boardDef) {
        this._boardDef = boardDef || null;
    }

    /**
     * 코드를 컴파일하고 시뮬레이션을 시작합니다.
     * @param {string} cppCode - Arduino C++ 소스 코드
     */
    run(cppCode) {
        if (this._running) this.stop();

        // 1. 트랜스파일
        let jsCode;
        try {
            jsCode = this.transpiler.transpile(cppCode);
        } catch (e) {
            throw new Error('[트랜스파일 오류] ' + e.message);
        }

        // 2. 런타임 생성
        const self     = this;
        const boardDef = this._boardDef;

        const simProxy = {
            onGpioChange(pin, value) {
                self.circuit?.onGpioChange?.(pin, value);
                // 내장 LED 시각화
                if (boardDef && pin === boardDef.builtinLed) {
                    const el = document.getElementById('builtin-led-svg');
                    if (el) {
                        const lit = boardDef.builtinLedActiveLow ? (value === 0) : (value === 1);
                        el.style.opacity = lit ? '1' : '0.15';
                    }
                }
            },
            onPwmChange(pin, duty, freq) {
                self.circuit?.onPwmChange?.(pin, duty, freq);
            },
            serialMonitor: {
                print(text) { self.onSerial(text, 'received'); },
                clear()     { /* no-op */ },
            },
            readAdc(pin)     { return self.circuit?.getAdcValue?.(pin)     ?? 0; },
            readDigital(pin) { return self.circuit?.getDigitalInput?.(pin) ?? 1; },
        };

        this.runtime = new ArduinoRuntime(simProxy, boardDef);

        // runtime ADC/디지털 읽기를 회로에 위임
        this.runtime.analogRead = (pin) => {
            const injected = this.runtime.adcValues.get(parseInt(pin, 10));
            if (injected !== undefined) return injected;
            return simProxy.readAdc(pin);
        };
        this.runtime.digitalRead = (pin) => {
            const state = this.runtime.gpioState.get(parseInt(pin, 10));
            if (state && state.mode === 1 /* OUTPUT */) return state.value;
            return simProxy.readDigital(pin);
        };

        // window에 현재 런타임/회로 노출 (라이브러리에서 접근 가능)
        window.currentRuntime = this.runtime;
        window.currentCircuit = this.circuit;

        // 3. Scheduler 생성
        this.scheduler = new Scheduler(this.runtime);

        // 4. 전역 바인딩 구성
        const globals = this._buildGlobals(boardDef);

        // 5. 사용자 코드 컴파일
        let userFns;
        try {
            const fnBody = `
                "use strict";
                ${jsCode}
                return {
                    setup: (typeof setup !== "undefined" ? setup : null),
                    loop:  (typeof loop  !== "undefined" ? loop  : null),
                };
            `;
            const fn = new Function(...Object.keys(globals), fnBody);
            userFns = fn(...Object.values(globals));
        } catch (e) {
            throw new Error(
                '[코드 파싱 오류] ' + e.message +
                '\n\n--- 변환된 코드 ---\n' + jsCode.slice(0, 800)
            );
        }

        if (!userFns.setup) throw new Error('setup() 함수가 없습니다.');
        if (!userFns.loop)  throw new Error('loop() 함수가 없습니다.');

        // 6. 버튼 컴포넌트 → runtime 인터럽트 자동 연결
        this._wireButtonInterrupts();

        // 7. 실행
        this._running = true;
        this.scheduler.on('error', (e) => {
            this.onError('[런타임 오류] ' + (e?.message || String(e)));
        });
        this.scheduler.start();
        this._runAsync(userFns.setup, userFns.loop);
    }

    async _runAsync(setupFn, loopFn) {
        try {
            await this.scheduler.runSetup(setupFn);
            await this.scheduler.runLoop(loopFn);
        } catch (e) {
            if (e && e.name !== 'AbortError' && !String(e.message).includes('stopped')) {
                this.onError('[런타임 오류] ' + (e.message || e));
            }
        } finally {
            this._running = false;
            this.onStop();
        }
    }

    /**
     * 버튼 컴포넌트 → runtime.setDigitalValue 인터럽트 자동 연결
     * 버튼 PIN1/PIN2 중 GPIO에 연결된 핀을 찾아 onPressCallback을 등록합니다.
     */
    _wireButtonInterrupts() {
        const r     = this.runtime;
        const comps = this.circuit?.getAllComponents?.() || [];
        comps.forEach(comp => {
            if (comp.type !== 'Button') return;
            ['PIN1', 'PIN2'].forEach(pinName => {
                const boardPin = comp.connections?.[pinName];
                if (!boardPin) return;
                // 'G9' → 9, '9' → 9, 숫자 포함 핀 이름 파싱
                const gpioNum = this._parsePinNumber(boardPin);
                if (gpioNum === null) return;
                comp.onPressCallback?.((pressed) => {
                    // INPUT_PULLUP 기준: 눌림 = LOW(0), 뗌 = HIGH(1)
                    r.setDigitalValue(gpioNum, pressed ? 0 : 1);
                });
            });
        });
    }

    /**
     * 보드 핀 이름에서 GPIO 번호를 추출합니다.
     * 'G9' → 9, 'D9' → 9, '9' → 9, 'A0' → null (아날로그 핀은 제외)
     * @param {string} pinName
     * @returns {number|null}
     */
    _parsePinNumber(pinName) {
        if (!pinName) return null;
        const m = String(pinName).match(/^[GgDd](\d+)$/) || String(pinName).match(/^(\d+)$/);
        if (m) return parseInt(m[1], 10);
        return null;
    }

    stop() {
        this.scheduler?.stop();
        this._running = false;
    }

    reset() {
        this.stop();
        this.runtime?.reset?.();
        this.scheduler = null;
        this.runtime   = null;
        window.currentRuntime = null;
    }

    getElapsedMs() {
        return this.scheduler?.millis() ?? 0;
    }

    getPinStates() {
        if (!this.runtime) return {};
        const result = {};
        this.runtime.gpioState.forEach((info, pin) => {
            const pwmCh = info.pwmChannel;
            if (pwmCh !== null && pwmCh !== undefined) {
                const ch = this.runtime.pwmChannels.get(pwmCh);
                result[pin] = { mode: 'pwm', duty: ch?.duty ?? 0, freq: ch?.freq ?? 0 };
            } else {
                result[pin] = { mode: info.mode === 0 ? 'in' : 'out', value: info.value };
            }
        });
        // analogWrite 핀
        this.runtime._analogWriteValues?.forEach((val, pin) => {
            if (!result[pin]) result[pin] = { mode: 'pwm', duty: val, freq: 490 };
        });
        // ADC 핀
        this.runtime.adcValues.forEach((val, pin) => {
            if (!result[pin]) result[pin] = { mode: 'adc', value: val };
        });
        return result;
    }

    sendSerial(text) {
        this.runtime?._serialObj?.inject(text);
    }

    /**
     * Arduino C++ 전역 상수 + API 함수를 JS 함수 스코프에 주입합니다.
     * @param {object|null} boardDef - 현재 보드 정의
     * @returns {object} globals 맵
     */
    _buildGlobals(boardDef) {
        const r = this.runtime;
        const s = this.scheduler;
        const bind = (fn) => fn ? fn.bind(r) : () => {};

        // 보드별 상수 (LED_BUILTIN, A0~A15 핀 번호 등)
        const boardConstants = (boardDef && typeof boardDef.getConstants === 'function')
            ? boardDef.getConstants()
            : {};

        // 보드 정의에서 직접 상수 추출 (getConstants가 없는 경우 대비)
        const builtinLedConst = (boardDef && boardDef.builtinLed !== undefined)
            ? { LED_BUILTIN: boardDef.builtinLed, BUILTIN_LED: boardDef.builtinLed }
            : { LED_BUILTIN: 13, BUILTIN_LED: 13 };

        return {
            // ── 기본 상수 ──────────────────────────────────────────
            OUTPUT: 1, INPUT: 0, INPUT_PULLUP: 2, INPUT_PULLDOWN: 3,
            HIGH: 1, LOW: 0,
            RISING: 1, FALLING: 2, CHANGE: 3,
            MSBFIRST: 1, LSBFIRST: 0,
            true: true, false: false,
            PI: Math.PI, TWO_PI: Math.PI * 2, HALF_PI: Math.PI / 2,
            // ESP32 ADC 감쇠 상수
            ADC_0db: 0, ADC_2_5db: 1, ADC_6db: 2, ADC_11db: 3,
            // AVR analogReference 상수
            DEFAULT: 1, INTERNAL: 2, EXTERNAL: 0,

            // ── 보드별 상수 (LED_BUILTIN, A0~A15 등) ───────────────
            ...builtinLedConst,
            ...boardConstants,

            // ── GPIO ───────────────────────────────────────────────
            pinMode:      bind(r.pinMode),
            digitalWrite: bind(r.digitalWrite),
            digitalRead:  (pin) => r.digitalRead(pin),

            // ── ADC ────────────────────────────────────────────────
            analogRead:           (pin) => r.analogRead(pin),
            analogWrite:          bind(r.analogWrite),
            analogReadResolution: bind(r.analogReadResolution),
            analogReference:      bind(r.analogReference),
            analogSetAttenuation: () => {},

            // ── PWM (ESP32 LEDC) ────────────────────────────────────
            ledcSetup:     bind(r.ledcSetup),
            ledcAttachPin: bind(r.ledcAttachPin),
            ledcWrite:     bind(r.ledcWrite),
            ledcWriteTone: bind(r.ledcWriteTone),
            ledcDetachPin: bind(r.ledcDetachPin),

            // ── tone ───────────────────────────────────────────────
            tone:   bind(r.tone),
            noTone: bind(r.noTone),

            // ── 타이밍 ─────────────────────────────────────────────
            millis:            () => s.millis(),
            micros:            () => s.micros(),
            delay:             (ms) => s.delay(ms),
            delayMicroseconds: (us) => s.delay(us / 1000),
            _delay:            (ms) => s.delay(ms),
            _delayMicros:      (us) => s.delay(us / 1000),

            // ── 인터럽트 ───────────────────────────────────────────
            attachInterrupt:       bind(r.attachInterrupt),
            detachInterrupt:       bind(r.detachInterrupt),
            digitalPinToInterrupt: (pin) => pin, // 대부분의 보드: 핀번호 = ISR 번호
            noInterrupts:          () => {},
            interrupts:            () => {},

            // ── 수학 ───────────────────────────────────────────────
            map:        bind(r.map),
            constrain:  bind(r.constrain),
            abs:        (x)    => Math.abs(x),
            min:        (a, b) => Math.min(a, b),
            max:        (a, b) => Math.max(a, b),
            pow:        (b, e) => Math.pow(b, e),
            sq:         (x)    => x * x,
            cb:         (x)    => x * x * x,
            sqrt:       (x)    => Math.sqrt(x),
            floor:      (x)    => Math.floor(x),
            ceil:       (x)    => Math.ceil(x),
            round:      (x)    => Math.round(x),
            random:     bind(r.random),
            randomSeed: bind(r.randomSeed),
            sin:   Math.sin,  cos:  Math.cos,  tan:  Math.tan,
            asin:  Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
            log:   Math.log,  exp:  Math.exp,

            // ── 비트 조작 ──────────────────────────────────────────
            bitRead:  (val, bit) => (val >> bit) & 1,
            bitSet:   (val, bit) => val | (1 << bit),
            bitClear: (val, bit) => val & ~(1 << bit),
            bitWrite: (val, bit, v) => v ? (val | (1 << bit)) : (val & ~(1 << bit)),
            bit:      (b) => (1 << b),
            lowByte:  (x) => x & 0xFF,
            highByte: (x) => (x >> 8) & 0xFF,

            // ── 타입 변환 ──────────────────────────────────────────
            // String은 내장 전역 사용 → String.fromCharCode 보존
            String:     globalThis.String,
            parseInt:   (s, base) => parseInt(s, base || 10),
            parseFloat: (s) => parseFloat(s),
            isnan:      (x) => isNaN(x),
            isNaN:      (x) => isNaN(x),

            // ── 직렬 프로토콜 ──────────────────────────────────────
            shiftOut: bind(r.shiftOut),
            shiftIn:  bind(r.shiftIn),
            pulseIn:  bind(r.pulseIn),

            // ── Serial ─────────────────────────────────────────────
            Serial:   r._serialObj,
            _Serial:  r._serialObj,
            Serial1:  r._serialObj, // 추가 시리얼 포트 (단순 매핑)

            // ── 라이브러리 (window에서 로드) ───────────────────────
            Wire: window.WireLib        ? window.WireLib.getInstance(r)        : null,
            SPI:  window.SPILib         ? window.SPILib.getInstance(r)         : null,

            // ── Servo ──────────────────────────────────────────────
            Servo: window.ServoLib      ? window.ServoLib.create               : null,

            // ── SoftwareSerial ─────────────────────────────────────
            SoftwareSerial: window.SoftwareSerialLib
                ? window.SoftwareSerialLib.create : null,

            // ── EEPROM ─────────────────────────────────────────────
            EEPROM: window.EEPROMLib    ?? null,

            // ── LCD 계열 ───────────────────────────────────────────
            LiquidCrystal: window.LiquidCrystalLib
                ? window.LiquidCrystalLib.create : null,
            LiquidCrystal_I2C: window.LiquidCrystalI2CLib
                ? window.LiquidCrystalI2CLib.create : null,
            Adafruit_SSD1306: window.SSD1306Lib
                ? window.SSD1306Lib.create : null,

            // ── IRremote ───────────────────────────────────────────
            IRrecv: window.IRremoteLib  ? window.IRremoteLib.IRrecv            : null,
            IRsend: window.IRremoteLib  ? window.IRremoteLib.IRsend            : null,

            // ── Keypad ─────────────────────────────────────────────
            Keypad:    window.KeypadLib ? window.KeypadLib.create              : null,
            makeKeymap: window.KeypadLib ? window.KeypadLib.makeKeymap         : null,

            // ── DHT (온습도 센서) ───────────────────────────────────
            DHT:       window.DHTLib    ? window.DHTLib.DHT                   : null,
            DHT11:     window.DHTLib    ? window.DHTLib.DHT11                 : 11,
            DHT22:     window.DHTLib    ? window.DHTLib.DHT22                 : 22,

            // ── OneWire / DallasTemperature (DS18B20) ──────────────
            OneWire:             window.OneWire             ?? null,
            DallasTemperature:   window.DallasTemperature   ?? null,
            DEVICE_DISCONNECTED_C: -127.0,
            DEVICE_DISCONNECTED_F: -196.6,

            // ── NewPing (초음파) ────────────────────────────────────
            NewPing:   window.NewPing   ?? null,

            // ── FastLED / NeoPixel ─────────────────────────────────
            FastLED:           window.FastLED           ?? null,
            CRGB:              window.CRGB              ?? null,
            Adafruit_NeoPixel: window.Adafruit_NeoPixel ?? null,
            NEO_GRB:   6, NEO_RGB: 0, NEO_BRG: 3,
            NEO_KHZ800: 0x0200, NEO_KHZ400: 0x0100,

            // ── FastLED 색 상수 ────────────────────────────────────
            CRGB_Red:    window.CRGB ? window.CRGB.Red    : null,
            CRGB_Green:  window.CRGB ? window.CRGB.Green  : null,
            CRGB_Blue:   window.CRGB ? window.CRGB.Blue   : null,
            CRGB_White:  window.CRGB ? window.CRGB.White  : null,
            CRGB_Black:  window.CRGB ? window.CRGB.Black  : null,

            // ── Stepper (스텝 모터) ────────────────────────────────
            Stepper:   window.Stepper   ?? null,

            // ── TM1637 Display ─────────────────────────────────────
            TM1637Display: window.TM1637DisplayLib ? window.TM1637DisplayLib.create : null,

            // ── 디스플레이 상수 ────────────────────────────────────
            SSD1306_SWITCHCAPVCC: 1,
            SSD1306_EXTERNALVCC:  2,
            WHITE: 1, BLACK: 0, INVERSE: 2,
            SSD1306_BLACK: 0, SSD1306_WHITE: 1,
            GFX_FONT: null,

            // ── MPU6050 / BMP280 I2C 센서 ──────────────────────────
            MPU6050:   window.MPU6050Lib   ? window.MPU6050Lib.create   : null,
            Adafruit_BMP280: window.BMP280Lib ? window.BMP280Lib.create : null,

            // ── MFRC522 (RFID) ─────────────────────────────────────
            MFRC522:   window.MFRCLib ?? null,

            // ── Arduino/AVR 호환 매크로 ────────────────────────────
            F:               (s) => s,
            pgm_read_byte:   (x) => x,
            pgm_read_word:   (x) => x,
            IRAM_ATTR:       undefined,
            DRAM_ATTR:       undefined,
            PROGMEM:         undefined,
        };
    }
}

/* ═══════════════════════════════════════════════════════
   App — UI 통합
═══════════════════════════════════════════════════════ */
class App {
    constructor() {
        this.engine    = null;
        this.circuit   = null;
        this.editor    = null;

        /** @type {object|null} 현재 선택된 보드 정의 */
        this._boardDef   = null;

        this._simTimer = null;
        this._pinTimer = null;
        this._dragging = null;

        this._init();
    }

    async _init() {
        // Monaco 에디터
        await this._initMonaco();

        // 보드 목록 초기화
        this._initBoardSelector();

        // CircuitEditor 초기화
        const svg = document.getElementById('circuit-svg');
        this.circuit = new CircuitEditor(svg);

        // 선택된 보드로 보드 렌더링
        const initialBoard = this._getSelectedBoard();
        this._boardDef = initialBoard;
        this.circuit.renderBoard(initialBoard);

        // ComponentFactory → ComponentRegistry 브릿지
        window.ComponentFactory = {
            create(type, id, config) {
                if (window.ComponentRegistry) {
                    return ComponentRegistry.create(type, id, config, config.x, config.y, {});
                }
                return null;
            }
        };

        // SimulatorEngine
        this.engine = new SimulatorEngine(
            this.circuit,
            (text, type) => this._serialLog(text, type),
            (msg)        => this._showError(msg),
            ()           => this._onStop(),
        );
        this.engine.setBoard(initialBoard);

        // 전역 노출
        window.currentCircuit = this.circuit;

        // 핀 그리드
        this._initPinGrid();
        this._bindEvents();
        this._loadDefaultCode();
    }

    // ─────────────────────────────────────────────
    // 보드 선택
    // ─────────────────────────────────────────────

    /**
     * 보드 선택 드롭다운을 초기화합니다.
     * window.BOARDS 가 있으면 항목을 채웁니다.
     */
    _initBoardSelector() {
        const sel = document.getElementById('board-select');
        if (!sel) return;

        const boards = window.BOARDS || {};
        const DEFAULT_BOARD = 'esp32-c3';
        let hasDefault = false;
        Object.keys(boards).forEach(key => {
            const opt  = document.createElement('option');
            opt.value  = key;
            opt.textContent = boards[key].name || key;
            if (key === DEFAULT_BOARD) { opt.selected = true; hasDefault = true; }
            sel.appendChild(opt);
        });
        // 기본값이 없으면 첫 번째 항목 선택
        if (!hasDefault && sel.options.length > 0) sel.options[0].selected = true;
    }

    /**
     * 현재 선택된 보드 정의를 반환합니다.
     * @returns {object|null}
     */
    _getSelectedBoard() {
        const sel = document.getElementById('board-select');
        if (!sel || !window.BOARDS) return null;
        return window.BOARDS[sel.value] || null;
    }

    /**
     * 보드 변경 시 회로 초기화 및 재렌더링.
     * @param {string} boardKey
     */
    _changeBoard(boardKey) {
        const boardDef = window.BOARDS?.[boardKey] || null;
        this._boardDef = boardDef;

        // 실행 중이면 중지
        this._stop();

        // 회로 초기화 + 보드 렌더링
        this.circuit?.clearAll?.();
        this.circuit?.renderBoard?.(boardDef);

        // 엔진에 보드 반영
        this.engine?.setBoard?.(boardDef);

        // 핀 그리드 재초기화
        this._initPinGrid();

        this._serialLog(`보드 변경: ${boardDef?.name || boardKey}`, 'info');
    }

    // ─────────────────────────────────────────────
    // Monaco
    // ─────────────────────────────────────────────

    async _initMonaco() {
        return new Promise(resolve => {
            require.config({
                paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }
            });
            require(['vs/editor/editor.main'], () => {
                this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                    language: 'cpp',
                    theme: 'vs-dark',
                    fontSize: 13,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    fontFamily: 'Consolas,"Courier New",monospace',
                });
                resolve();
            });
        });
    }

    // ─────────────────────────────────────────────
    // 이벤트 바인딩
    // ─────────────────────────────────────────────

    _bindEvents() {
        // 실행/중지/리셋
        document.getElementById('btn-run')?.addEventListener('click',   () => this._run());
        document.getElementById('btn-stop')?.addEventListener('click',  () => this._stop());
        document.getElementById('btn-reset')?.addEventListener('click', () => this._reset());

        // 키보드 단축키
        document.addEventListener('keydown', e => {
            const inEditor = document.activeElement?.closest?.('#monaco-editor');
            if (e.key === 'F5') { e.preventDefault(); this._run(); }
            if (e.key === 'F6') { e.preventDefault(); this._stop(); }
            if (e.key === 'F7') { e.preventDefault(); this._reset(); }
            if (!inEditor) {
                if (e.key === 'Delete') this.circuit?.deleteSelected?.();
                if (e.key === 'w')      this._setMode('wire');
                if (e.key === 's' && !e.ctrlKey) this._setMode('select');
            }
        });

        // 모드 버튼
        document.getElementById('btn-wire-mode')?.addEventListener('click',   () => this._setMode('wire'));
        document.getElementById('btn-select-mode')?.addEventListener('click', () => this._setMode('select'));
        document.getElementById('btn-delete-selected')?.addEventListener('click', () => this.circuit?.deleteSelected?.());

        // 보드 선택
        document.getElementById('board-select')?.addEventListener('change', e => {
            this._changeBoard(e.target.value);
        });

        // 팔레트 드래그 & 클릭
        document.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('dragstart', e => {
                this._dragging = this._itemConfig(item);
                e.dataTransfer.effectAllowed = 'copy';
            });
            item.addEventListener('click', () => {
                const cfg = this._itemConfig(item);
                // 팔레트 클릭 시 캔버스 중앙 부근 월드 좌표에 배치
                const svgEl = document.getElementById('circuit-svg');
                let wx = 400, wy = 280;
                if (this.circuit?.screenToWorld && svgEl) {
                    const r = svgEl.getBoundingClientRect();
                    const w = this.circuit.screenToWorld(r.width / 2, r.height / 2);
                    wx = w.x + (Math.random() - 0.5) * 60;
                    wy = w.y + (Math.random() - 0.5) * 60;
                }
                this.circuit?.addComponent?.(cfg.type, wx, wy, cfg);
            });
        });

        const svgEl = document.getElementById('circuit-svg');
        if (svgEl) {
            svgEl.addEventListener('dragover',  e => { e.preventDefault(); svgEl.classList.add('drag-over'); });
            svgEl.addEventListener('dragleave', () => svgEl.classList.remove('drag-over'));
            svgEl.addEventListener('drop', e => {
                e.preventDefault();
                svgEl.classList.remove('drag-over');
                if (!this._dragging) return;
                // 화면 좌표 → 월드 좌표 변환
                const rect = svgEl.getBoundingClientRect();
                let wx = e.clientX - rect.left, wy = e.clientY - rect.top;
                if (this.circuit?.screenToWorld) {
                    const w = this.circuit.screenToWorld(wx, wy);
                    wx = w.x; wy = w.y;
                }
                this.circuit?.addComponent?.(this._dragging.type, wx, wy, this._dragging);
                this._dragging = null;
            });
        }

        // 템플릿 불러오기
        document.getElementById('btn-load-template')?.addEventListener('click', () => {
            const id = document.getElementById('template-select')?.value;
            if (id) this._loadTemplate(id);
        });

        // 시리얼
        document.getElementById('btn-serial-send')?.addEventListener('click', () => this._serialSend());
        document.getElementById('serial-input')?.addEventListener('keypress', e => {
            if (e.key === 'Enter') this._serialSend();
        });
        document.getElementById('btn-serial-clear')?.addEventListener('click', () => {
            const out = document.getElementById('serial-output');
            if (out) out.innerHTML = '';
        });

        // 탭 전환
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
            });
        });

        // 내보내기/가져오기
        document.getElementById('btn-export')?.addEventListener('click', () => this._export());
        document.getElementById('btn-import')?.addEventListener('click', () =>
            document.getElementById('import-file')?.click());
        document.getElementById('import-file')?.addEventListener('change', e => {
            const f = e.target.files[0];
            if (!f) return;
            const fr = new FileReader();
            fr.onload = ev => this._import(ev.target.result);
            fr.readAsText(f);
        });

        // 회로 초기화
        document.getElementById('btn-clear-circuit')?.addEventListener('click', () => {
            if (confirm('회로를 초기화하시겠습니까?')) {
                this.circuit?.clearAll?.();
                this.circuit?.renderBoard?.(this._getSelectedBoard());
            }
        });

        // 에러 닫기
        document.getElementById('btn-close-error')?.addEventListener('click', () => {
            const p = document.getElementById('error-panel');
            if (p) p.style.display = 'none';
        });

        // 기본 코드 불러오기
        document.getElementById('btn-example')?.addEventListener('click', () => this._loadDefaultCode());

        this._initPanelResize();
    }

    _itemConfig(item) {
        return {
            type:  item.dataset.type,
            color: item.dataset.color || undefined,
            value: item.dataset.value ? parseInt(item.dataset.value) : undefined,
        };
    }

    // ─────────────────────────────────────────────
    // 시뮬레이션
    // ─────────────────────────────────────────────

    _run() {
        const code = this.editor?.getValue() || '';
        if (!code.trim()) { this._showError('코드를 입력하세요.'); return; }
        const ep = document.getElementById('error-panel');
        if (ep) ep.style.display = 'none';
        this._serialLog('=== 시뮬레이션 시작 ===', 'info');
        try {
            // 실행 전 엔진에 현재 보드 반영
            this.engine.setBoard(this._getSelectedBoard());
            this.engine.run(code);
            this._setRunState(true);
            this._simTimer = setInterval(() => {
                const ms = this.engine.getElapsedMs();
                const el = document.getElementById('sim-time');
                if (el) el.textContent = (ms / 1000).toFixed(3) + 's';
            }, 100);
            this._pinTimer = setInterval(() => this._updatePins(), 250);
        } catch (e) {
            this._showError(e.message || String(e));
        }
    }

    _stop() {
        this.engine?.stop();
        this._onStop();
        this._serialLog('=== 중지 ===', 'info');
    }

    _reset() {
        this._stop();
        this.engine?.reset();
        this.circuit?.resetComponents?.();
        const el = document.getElementById('sim-time');
        if (el) el.textContent = '0.000s';
        this._serialLog('=== 리셋 ===', 'info');
        this._updatePins();
    }

    _onStop() {
        this._setRunState(false);
        clearInterval(this._simTimer);
        clearInterval(this._pinTimer);
    }

    _setRunState(running) {
        const btnRun  = document.getElementById('btn-run');
        const btnStop = document.getElementById('btn-stop');
        if (btnRun)  btnRun.disabled  = running;
        if (btnStop) btnStop.disabled = !running;

        const s = document.getElementById('sim-status');
        if (s) {
            s.textContent = running ? '실행 중' : '정지됨';
            s.className   = 'sim-status ' + (running ? 'running' : 'stopped');
        }
    }

    _setMode(mode) {
        this.circuit?.setMode?.(mode);
        document.getElementById('btn-wire-mode')?.classList.toggle('active',   mode === 'wire');
        document.getElementById('btn-select-mode')?.classList.toggle('active', mode === 'select');
        const hints = {
            wire:   '핀 클릭으로 와이어 연결 (ESC 취소)',
            select: '클릭 선택 / 드래그 이동',
        };
        const hint = document.getElementById('circuit-hint');
        if (hint) hint.textContent = hints[mode] || '';
    }

    // ─────────────────────────────────────────────
    // 시리얼
    // ─────────────────────────────────────────────

    _serialLog(text, type = 'received') {
        const out = document.getElementById('serial-output');
        if (!out) return;
        const lines = text.split('\n');
        lines.forEach((line, i) => {
            if (i === lines.length - 1 && line === '') return;
            const span = document.createElement('span');
            span.className  = `line ${type}`;
            span.textContent = line;
            out.appendChild(span);
            out.appendChild(document.createElement('br'));
        });
        if (out.scrollTop + out.clientHeight >= out.scrollHeight - 50) {
            out.scrollTop = out.scrollHeight;
        }
        while (out.children.length > 2000) out.removeChild(out.firstChild);
    }

    _serialSend() {
        const input  = document.getElementById('serial-input');
        const ending = document.getElementById('serial-line-ending')?.value || '\n';
        const text   = input?.value || '';
        if (!text.trim()) return;
        this.engine?.sendSerial?.(text + ending);
        this._serialLog('> ' + text, 'sent');
        if (input) input.value = '';
    }

    // ─────────────────────────────────────────────
    // 핀 상태 그리드
    // ─────────────────────────────────────────────

    /**
     * 선택된 보드의 핀 목록으로 핀 그리드를 구성합니다.
     */
    _initPinGrid() {
        const grid = document.getElementById('pin-state-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const boardDef = this._getSelectedBoard();
        // 보드 정의에 pins 배열이 있으면 사용, 없으면 기본 핀 목록
        const pins = (boardDef && Array.isArray(boardDef.gpioPins))
            ? boardDef.gpioPins
            : [0,1,2,3,4,5,6,7,8,9,10,11,12,13];

        pins.forEach(pin => {
            const div = document.createElement('div');
            div.className = 'pin-state-item';
            div.id = `pin-item-${pin}`;
            const label = boardDef?.pinLabel?.(pin) || `D${pin}`;
            div.innerHTML = `
                <div class="pin-state-dot"></div>
                <span class="pin-state-name">${label}</span>
                <span class="pin-state-val" id="pin-val-${pin}">—</span>`;
            grid.appendChild(div);
        });
    }

    _updatePins() {
        const states = this.engine?.getPinStates() || {};
        Object.entries(states).forEach(([pin, info]) => {
            const item = document.getElementById(`pin-item-${pin}`);
            const val  = document.getElementById(`pin-val-${pin}`);
            if (!item || !val) return;
            item.className = 'pin-state-item';
            if (info.mode === 'pwm') {
                item.classList.add('pwm');
                val.textContent = Math.round((info.duty / 255) * 100) + '%';
            } else if (info.mode === 'adc') {
                item.classList.add('adc');
                val.textContent = info.value;
            } else if (info.value === 1) {
                item.classList.add('high');
                val.textContent = 'HIGH';
            } else {
                item.classList.add('low');
                val.textContent = info.mode ? 'LOW' : '—';
            }
        });
    }

    // ─────────────────────────────────────────────
    // 템플릿
    // ─────────────────────────────────────────────

    _loadTemplate(id) {
        const tmpl = window.TEMPLATES?.[id];
        if (!tmpl) { this._showError(`템플릿 '${id}'를 찾을 수 없습니다.`); return; }

        this._stop();

        // 템플릿에 지정된 보드가 있으면 자동 전환
        if (tmpl.board && window.BOARDS?.[tmpl.board]) {
            const sel = document.getElementById('board-select');
            if (sel) sel.value = tmpl.board;
            this._changeBoard(tmpl.board);
        } else {
            this.circuit?.clearAll?.();
            this.circuit?.renderBoard?.(this._getSelectedBoard());
        }

        // 컴포넌트 형식 정규화
        const normalized = Object.assign({}, tmpl);
        if (normalized.components) {
            let idx = 0;
            normalized.components = normalized.components.map(c => {
                const { type, x, y, id: cid, config, ...rest } = c;
                return {
                    id:     cid || `comp_${idx++}`,
                    type:   type,
                    x:      x || 400,
                    y:      y || 200,
                    config: config || rest,
                };
            });
        }

        this.circuit?.loadTemplate?.(normalized);
        if (tmpl.defaultCode) this.editor?.setValue(tmpl.defaultCode.trim());
        this._serialLog(`템플릿: ${tmpl.name}`, 'info');
    }

    // ─────────────────────────────────────────────
    // 내보내기/가져오기
    // ─────────────────────────────────────────────

    _export() {
        const sel     = document.getElementById('board-select');
        const boardKey = sel?.value || '';
        const data = {
            version: '1.1',
            board:   boardKey,
            code:    this.editor?.getValue() || '',
            circuit: this.circuit?.toJSON() || {},
        };
        const a = document.createElement('a');
        a.href = URL.createObjectURL(
            new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        );
        a.download = 'arduino-sim.json';
        a.click();
    }

    _import(json) {
        try {
            const d = JSON.parse(json);
            // 보드 복원
            if (d.board && window.BOARDS?.[d.board]) {
                const sel = document.getElementById('board-select');
                if (sel) sel.value = d.board;
                this._changeBoard(d.board);
            }
            if (d.code)    this.editor?.setValue(d.code);
            if (d.circuit) {
                this.circuit?.clearAll?.();
                this.circuit?.loadFromJSON?.(d.circuit);
            }
            this._serialLog('프로젝트 로드됨', 'info');
        } catch (e) { this._showError('파일 오류: ' + e.message); }
    }

    // ─────────────────────────────────────────────
    // 에러
    // ─────────────────────────────────────────────

    _showError(msg) {
        const ep = document.getElementById('error-panel');
        if (ep) ep.style.display = 'block';
        const em = document.getElementById('error-message');
        if (em) em.textContent = msg;
        const s = document.getElementById('sim-status');
        if (s) { s.textContent = '오류'; s.className = 'sim-status error'; }
        this._serialLog('[오류] ' + msg.split('\n')[0], 'error');
        this._onStop();
    }

    // ─────────────────────────────────────────────
    // 패널 리사이즈
    // ─────────────────────────────────────────────

    _initPanelResize() {
        const div = document.getElementById('panel-divider');
        const ep  = document.getElementById('editor-panel');
        const bp  = document.getElementById('bottom-panel');
        if (!div || !ep || !bp) return;

        let sy, se, sb;
        div.addEventListener('mousedown', e => {
            sy = e.clientY; se = ep.offsetHeight; sb = bp.offsetHeight;
            const onMove = me => {
                const dy = me.clientY - sy;
                ep.style.flex   = 'none';
                ep.style.height = Math.max(80, se + dy) + 'px';
                bp.style.height = Math.max(80, sb - dy) + 'px';
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup',   onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup',   onUp);
            e.preventDefault();
        });
    }

    // ─────────────────────────────────────────────
    // 기본 코드
    // ─────────────────────────────────────────────

    _loadDefaultCode() {
        const boardDef  = this._getSelectedBoard();
        const boardName = boardDef?.name || 'Arduino';
        const ledPin    = boardDef?.builtinLed ?? 13;
        const activeLow = boardDef?.builtinLedActiveLow === true;

        const onValue  = activeLow ? 'LOW'  : 'HIGH';
        const offValue = activeLow ? 'HIGH' : 'LOW';
        const noteOn   = activeLow ? '  // Active LOW: LOW = 켜짐' : '';
        const noteOff  = activeLow ? '  // Active LOW: HIGH = 꺼짐' : '';

        this.editor?.setValue(`/*
 * ${boardName} 웹 시뮬레이터에 오신 것을 환영합니다!
 *
 * 사용 방법:
 *   1. 위쪽 보드 선택기에서 사용할 보드를 고르세요
 *   2. 왼쪽 팔레트에서 부품을 캔버스로 드래그하세요
 *   3. 템플릿 선택 → 불러오기로 회로+코드를 한번에 로드할 수 있습니다
 *   4. F5 또는 ▶ 실행 버튼으로 시뮬레이션을 시작하세요
 */

#define LED_PIN   ${ledPin}   // 내장 LED 핀
#define INTERVAL  500         // 깜빡임 간격 (ms)

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("${boardName} 시뮬레이터 시작!");
}

void loop() {
  digitalWrite(LED_PIN, ${onValue});${noteOn}
  Serial.println("LED ON");
  delay(INTERVAL);

  digitalWrite(LED_PIN, ${offValue});${noteOff}
  Serial.println("LED OFF");
  delay(INTERVAL);
}`);
    }
}

/* ── 앱 시작 ── */
window.addEventListener('load', () => { window.app = new App(); });
