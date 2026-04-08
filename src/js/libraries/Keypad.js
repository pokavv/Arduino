/**
 * @file Keypad.js
 * @brief Arduino Keypad 라이브러리 시뮬레이션
 *
 * Mark Stanley의 Keypad 라이브러리를 에뮬레이션합니다.
 * circuit editor의 Keypad_4x4 컴포넌트와 연동합니다.
 *
 * 사용법 (Arduino):
 *   const byte ROWS = 4;
 *   const byte COLS = 4;
 *   char hexaKeys[ROWS][COLS] = {
 *     {'1','2','3','A'},
 *     {'4','5','6','B'},
 *     {'7','8','9','C'},
 *     {'*','0','#','D'}
 *   };
 *   byte rowPins[ROWS] = {9, 8, 7, 6};
 *   byte colPins[COLS] = {5, 4, 3, 2};
 *   Keypad keypad = makeKeymap(hexaKeys), rowPins, colPins, ROWS, COLS);
 *   char key = keypad.getKey();
 *   if (key != NO_KEY) { ... }
 *
 * 상수:
 *   NO_KEY     - 키 없음 (null 문자 '\0')
 *   IDLE       - 대기 상태
 *   PRESSED    - 눌림
 *   HOLD       - 누름 유지
 *   RELEASED   - 뗌
 *
 * 시뮬레이션 방식:
 *   - circuit의 Keypad_4x4 컴포넌트에서 키 이벤트를 구독합니다.
 *   - KeypadLib.pressKey(key)로 키를 주입할 수 있습니다.
 *   - 키 상태 변화는 addEventListener 또는 컴포넌트를 통해 전달됩니다.
 */

(function(global) {
    'use strict';

    // ── 상수 ──────────────────────────────────────────────────────────────────
    var NO_KEY   = '\0';  // 키 없음
    var IDLE     = 0;     // 아무 키도 눌리지 않은 상태
    var PRESSED  = 1;     // 방금 눌림
    var HOLD     = 2;     // 누름 유지
    var RELEASED = 3;     // 방금 뗌

    /**
     * makeKeymap — 2D 배열을 1D 배열로 변환합니다.
     * @param {Array} userKeymap - 2D 문자 배열
     * @returns {char[]} 1D 배열
     */
    function makeKeymap(userKeymap) {
        var flat = [];
        for (var r = 0; r < userKeymap.length; r++) {
            for (var c = 0; c < userKeymap[r].length; c++) {
                flat.push(userKeymap[r][c]);
            }
        }
        return flat;
    }

    /**
     * Key 구조체 — 개별 키 상태
     */
    function Key() {
        this.kchar  = NO_KEY; // 키 문자
        this.kcode  = -1;     // 키 인덱스
        this.kstate = IDLE;   // 현재 상태
        this.stateChanged = false; // 이번 틱에 상태 변경 여부
    }

    /**
     * Keypad 클래스
     * @param {char[]}   userKeymap  - makeKeymap()으로 변환된 키맵
     * @param {number[]} rowPins     - 행 핀 배열
     * @param {number[]} colPins     - 열 핀 배열
     * @param {number}   numRows     - 행 수
     * @param {number}   numCols     - 열 수
     */
    function Keypad(userKeymap, rowPins, colPins, numRows, numCols) {
        /** 키맵 (1D) */
        this._keymap  = userKeymap;

        /** 행 핀 배열 */
        this._rowPins = rowPins;

        /** 열 핀 배열 */
        this._colPins = colPins;

        /** 행 수 */
        this._rows = numRows || 4;

        /** 열 수 */
        this._cols = numCols || 4;

        /** 현재 눌린 키 목록 (최대 10키 동시) */
        this._keys = [];
        for (var i = 0; i < 10; i++) {
            this._keys.push(new Key());
        }

        /** 디바운스 시간 (ms) */
        this._debounceTime = 10;

        /** 누름 유지 시간 (ms) */
        this._holdTime = 500;

        /** 마지막 디바운스 시각 */
        this._lastDebounceTime = 0;

        /** 눌린 키 큐 (비동기 이벤트 저장용) */
        this._keyQueue = [];

        /** 현재 키 상태 맵: key → state */
        this._keyStates = {};

        /** 누름 유지 타이머: key → timeout ID */
        this._holdTimers = {};

        /** 이벤트 리스너 목록 */
        this._listeners = [];

        // circuit 컴포넌트 연결
        this._comp = null;
        this._connectComponent();

        // 전역 목록에 등록
        KeypadLib._instances.push(this);
    }

    /**
     * 단일 키를 반환합니다.
     * @returns {char} 눌린 키 문자, 없으면 NO_KEY
     */
    Keypad.prototype.getKey = function() {
        this._scan();
        for (var i = 0; i < this._keys.length; i++) {
            if (this._keys[i].stateChanged && this._keys[i].kstate === PRESSED) {
                var ch = this._keys[i].kchar;
                this._keys[i].stateChanged = false;
                return ch;
            }
        }
        return NO_KEY;
    };

    /**
     * 현재 눌린 키 목록을 반환합니다.
     * @returns {Key[]} 상태 변화가 있는 키 배열
     */
    Keypad.prototype.getKeys = function() {
        this._scan();
        return this._keys.filter(function(k) {
            return k.kstate !== IDLE;
        });
    };

    /**
     * 특정 키가 현재 눌려있는지 확인합니다.
     * @param {char} keyChar
     * @returns {boolean}
     */
    Keypad.prototype.isPressed = function(keyChar) {
        var state = this._keyStates[keyChar];
        return state === PRESSED || state === HOLD;
    };

    /**
     * 특정 키의 현재 상태를 반환합니다.
     * @param {char} keyChar
     * @returns {number} IDLE | PRESSED | HOLD | RELEASED
     */
    Keypad.prototype.getState = function(keyChar) {
        return this._keyStates[keyChar] || IDLE;
    };

    /**
     * 디바운스 시간을 설정합니다.
     * @param {number} ms
     */
    Keypad.prototype.setDebounceTime = function(ms) {
        this._debounceTime = ms;
    };

    /**
     * 누름 유지 시간을 설정합니다.
     * @param {number} ms
     */
    Keypad.prototype.setHoldTime = function(ms) {
        this._holdTime = ms;
    };

    /**
     * 키 상태 변화 콜백을 등록합니다.
     * @param {Function} callback - (key, state) => void
     */
    Keypad.prototype.addEventListener = function(callback) {
        if (typeof callback === 'function') {
            this._listeners.push(callback);
        }
    };

    /**
     * 키 상태 변화 콜백을 제거합니다.
     * @param {Function} callback
     */
    Keypad.prototype.removeEventListener = function(callback) {
        var idx = this._listeners.indexOf(callback);
        if (idx >= 0) this._listeners.splice(idx, 1);
    };

    /**
     * 외부에서 키 누름을 주입합니다.
     * @param {char} keyChar - 키 문자
     */
    Keypad.prototype.pressKey = function(keyChar) {
        this._keyQueue.push({ key: keyChar, pressed: true });
    };

    /**
     * 외부에서 키 뗌을 주입합니다.
     * @param {char} keyChar - 키 문자
     */
    Keypad.prototype.releaseKey = function(keyChar) {
        this._keyQueue.push({ key: keyChar, pressed: false });
    };

    /**
     * 내부: 키 상태 스캔
     * @private
     */
    Keypad.prototype._scan = function() {
        // 큐에서 이벤트 처리
        while (this._keyQueue.length > 0) {
            var ev = this._keyQueue.shift();
            this._processKeyEvent(ev.key, ev.pressed);
        }

        // 키 슬롯 stateChanged 초기화
        for (var i = 0; i < this._keys.length; i++) {
            this._keys[i].stateChanged = false;
        }
    };

    /**
     * 내부: 키 이벤트 처리
     * @private
     */
    Keypad.prototype._processKeyEvent = function(keyChar, pressed) {
        var self  = this;
        var state = this._keyStates[keyChar] || IDLE;

        if (pressed && (state === IDLE || state === RELEASED)) {
            // 새 누름
            this._keyStates[keyChar] = PRESSED;
            this._updateKeySlot(keyChar, PRESSED);
            this._notifyListeners(keyChar, PRESSED);

            // HOLD 타이머 설정
            if (this._holdTimers[keyChar]) {
                clearTimeout(this._holdTimers[keyChar]);
            }
            this._holdTimers[keyChar] = setTimeout(function() {
                if (self._keyStates[keyChar] === PRESSED) {
                    self._keyStates[keyChar] = HOLD;
                    self._updateKeySlot(keyChar, HOLD);
                    self._notifyListeners(keyChar, HOLD);
                }
            }, this._holdTime);

        } else if (!pressed && (state === PRESSED || state === HOLD)) {
            // 키 뗌
            if (this._holdTimers[keyChar]) {
                clearTimeout(this._holdTimers[keyChar]);
                delete this._holdTimers[keyChar];
            }
            this._keyStates[keyChar] = RELEASED;
            this._updateKeySlot(keyChar, RELEASED);
            this._notifyListeners(keyChar, RELEASED);

            // IDLE로 전환
            var k = keyChar;
            setTimeout(function() {
                if (self._keyStates[k] === RELEASED) {
                    self._keyStates[k] = IDLE;
                    self._updateKeySlot(k, IDLE);
                }
            }, this._debounceTime);
        }
    };

    /**
     * 내부: 키 슬롯 업데이트
     * @private
     */
    Keypad.prototype._updateKeySlot = function(keyChar, state) {
        // 이미 있는 슬롯 찾기
        for (var i = 0; i < this._keys.length; i++) {
            if (this._keys[i].kchar === keyChar) {
                this._keys[i].kstate = state;
                this._keys[i].stateChanged = true;
                if (state === IDLE) {
                    this._keys[i].kchar = NO_KEY;
                    this._keys[i].kcode = -1;
                }
                return;
            }
        }
        // 빈 슬롯에 추가
        for (var j = 0; j < this._keys.length; j++) {
            if (this._keys[j].kstate === IDLE) {
                this._keys[j].kchar  = keyChar;
                this._keys[j].kcode  = this._keymap.indexOf(keyChar);
                this._keys[j].kstate = state;
                this._keys[j].stateChanged = true;
                return;
            }
        }
    };

    /**
     * 내부: 리스너에 알림
     * @private
     */
    Keypad.prototype._notifyListeners = function(keyChar, state) {
        this._listeners.forEach(function(fn) {
            try { fn(keyChar, state); } catch (e) {}
        });
    };

    /**
     * circuit에서 Keypad_4x4 컴포넌트를 찾아 연결합니다.
     * @private
     */
    Keypad.prototype._connectComponent = function() {
        var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return;

        var self  = this;
        var comps = circuit.getAllComponents();

        for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            if (comp.type !== 'Keypad_4x4') continue;

            this._comp = comp;

            // 컴포넌트의 키 이벤트 구독
            if (typeof comp.addEventListener === 'function') {
                comp.addEventListener(function(keyChar, pressed) {
                    self._keyQueue.push({ key: keyChar, pressed: pressed });
                });
            } else if (typeof comp.onKeyEvent === 'function') {
                // 대안 API
                comp.onKeyEvent(function(keyChar, pressed) {
                    self._keyQueue.push({ key: keyChar, pressed: pressed });
                });
            }

            console.log('[Keypad] 컴포넌트 ' + comp.id + ' 연결');
            break;
        }
    };

    // ── KeypadLib 노출 ────────────────────────────────────────────────────────

    var KeypadLib = {
        // 클래스
        Keypad:     Keypad,
        Key:        Key,
        makeKeymap: makeKeymap,

        /** app.js _buildGlobals()에서 호출: new Keypad(...) 생성자 반환 */
        create: Keypad,

        // 상수
        NO_KEY:   NO_KEY,
        IDLE:     IDLE,
        PRESSED:  PRESSED,
        HOLD:     HOLD,
        RELEASED: RELEASED,

        /** 전역 인스턴스 목록 */
        _instances: [],

        /**
         * 모든 Keypad 인스턴스에 키 누름을 주입합니다.
         * @param {char} keyChar
         */
        pressKey: function(keyChar) {
            this._instances.forEach(function(kp) {
                kp.pressKey(keyChar);
            });
        },

        /**
         * 모든 Keypad 인스턴스에 키 뗌을 주입합니다.
         * @param {char} keyChar
         */
        releaseKey: function(keyChar) {
            this._instances.forEach(function(kp) {
                kp.releaseKey(keyChar);
            });
        },

        /**
         * 누름 + 뗌을 빠르게 시뮬레이션합니다.
         * @param {char}   keyChar
         * @param {number} [durationMs=100]
         */
        tapKey: function(keyChar, durationMs) {
            var self = this;
            this.pressKey(keyChar);
            setTimeout(function() {
                self.releaseKey(keyChar);
            }, durationMs || 100);
        },

        /** 등록된 인스턴스를 초기화합니다. */
        reset: function() {
            this._instances = [];
        }
    };

    global.KeypadLib = KeypadLib;

    // 트랜스파일된 코드에서 바로 사용 가능하도록
    global.Keypad     = Keypad;
    global.makeKeymap = makeKeymap;
    global.NO_KEY     = NO_KEY;
    global.IDLE       = IDLE;
    global.PRESSED    = PRESSED;
    global.HOLD       = HOLD;
    global.RELEASED   = RELEASED;

})(typeof window !== 'undefined' ? window : this);
