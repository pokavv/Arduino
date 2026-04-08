/**
 * @file SoftwareSerial.js
 * @brief Arduino SoftwareSerial 라이브러리 시뮬레이션
 *
 * 실제 Arduino SoftwareSerial API를 에뮬레이션합니다.
 *
 * 사용법 (Arduino):
 *   SoftwareSerial ss(rxPin, txPin);
 *   ss.begin(9600);
 *   ss.print("hello");
 *   ss.println(123);
 *   while (ss.available()) {
 *     char c = ss.read();
 *   }
 *   String s = ss.readString();
 *
 * 동작:
 *   - print()/println() 출력은 시뮬레이터 시리얼 모니터에 [SS:] 접두어로 표시됩니다.
 *   - available()/read()는 inject()로 주입한 데이터를 반환합니다.
 *   - 여러 SoftwareSerial 인스턴스가 동시에 동작합니다.
 *   - 실제 핀 신호 시뮬레이션은 하지 않습니다 (소프트웨어 수준 에뮬레이션).
 */

(function(global) {
    'use strict';

    /** 전체 SoftwareSerial 인스턴스 목록 (inject 브로드캐스트용) */
    var _allInstances = [];

    /**
     * SoftwareSerial 클래스
     * @param {number} rxPin - RX 핀 번호
     * @param {number} txPin - TX 핀 번호
     * @param {boolean} [inverse_logic=false] - 신호 반전 여부 (시뮬레이터 무시)
     */
    function SoftwareSerial(rxPin, txPin, inverse_logic) {
        /** RX 핀 번호 */
        this._rxPin = parseInt(rxPin, 10);

        /** TX 핀 번호 */
        this._txPin = parseInt(txPin, 10);

        /** 신호 반전 여부 */
        this._inverseLogic = !!inverse_logic;

        /** 설정된 보드 속도 */
        this._baud = 9600;

        /** 초기화 여부 */
        this._initialized = false;

        /** 수신 버퍼 */
        this._rxBuffer = [];

        /** 읽기 타임아웃 (ms) */
        this._timeout = 1000;

        /** 오버플로우 발생 여부 */
        this._overflow = false;

        /** 수신 버퍼 최대 크기 */
        this._bufferSize = 64;

        _allInstances.push(this);
    }

    /**
     * 통신을 시작합니다.
     * @param {number} baudRate - 보드 속도 (예: 9600, 115200)
     */
    SoftwareSerial.prototype.begin = function(baudRate) {
        this._baud        = baudRate || 9600;
        this._initialized = true;
        this._rxBuffer    = [];
        this._overflow    = false;

        this._log('[SS:RX=' + this._rxPin + ',TX=' + this._txPin +
                  '] 시작 (baud=' + this._baud + ')');
    };

    /**
     * 통신을 종료합니다.
     */
    SoftwareSerial.prototype.end = function() {
        this._initialized = false;
        this._rxBuffer = [];
    };

    /**
     * 값을 줄바꿈 없이 전송합니다.
     * @param {*} val - 전송할 값
     * @param {number} [format] - 출력 형식 (DEC, HEX, BIN, OCT)
     */
    SoftwareSerial.prototype.print = function(val, format) {
        var text = this._format(val, format);
        this._output(text);
        return text.length;
    };

    /**
     * 값을 줄바꿈과 함께 전송합니다.
     * @param {*} val
     * @param {number} [format]
     */
    SoftwareSerial.prototype.println = function(val, format) {
        var text = (val !== undefined ? this._format(val, format) : '') + '\n';
        this._output(text);
        return text.length;
    };

    /**
     * 수신 버퍼에 읽을 수 있는 바이트 수를 반환합니다.
     * @returns {number}
     */
    SoftwareSerial.prototype.available = function() {
        return this._rxBuffer.length;
    };

    /**
     * 수신 버퍼에서 1바이트를 읽습니다.
     * @returns {number} 문자 코드 또는 -1
     */
    SoftwareSerial.prototype.read = function() {
        if (this._rxBuffer.length === 0) return -1;
        var ch = this._rxBuffer.shift();
        return typeof ch === 'string' ? ch.charCodeAt(0) : (ch & 0xFF);
    };

    /**
     * 수신 버퍼의 다음 바이트를 제거하지 않고 봅니다.
     * @returns {number} 문자 코드 또는 -1
     */
    SoftwareSerial.prototype.peek = function() {
        if (this._rxBuffer.length === 0) return -1;
        var ch = this._rxBuffer[0];
        return typeof ch === 'string' ? ch.charCodeAt(0) : (ch & 0xFF);
    };

    /**
     * 수신 버퍼를 비웁니다.
     */
    SoftwareSerial.prototype.flush = function() {
        this._rxBuffer = [];
        this._overflow = false;
    };

    /**
     * 수신 버퍼 전체를 문자열로 읽습니다.
     * @returns {string}
     */
    SoftwareSerial.prototype.readString = function() {
        var result = [];
        while (this._rxBuffer.length > 0) {
            var ch = this._rxBuffer.shift();
            result.push(typeof ch === 'string' ? ch : String.fromCharCode(ch & 0xFF));
        }
        return result.join('');
    };

    /**
     * 종료 문자까지 읽어 문자열로 반환합니다.
     * @param {string} terminator - 종료 문자 (예: '\n')
     * @returns {string}
     */
    SoftwareSerial.prototype.readStringUntil = function(terminator) {
        var result = [];
        while (this._rxBuffer.length > 0) {
            var ch = this._rxBuffer[0];
            var charStr = typeof ch === 'string' ? ch : String.fromCharCode(ch & 0xFF);
            if (charStr === terminator) {
                this._rxBuffer.shift();
                break;
            }
            result.push(charStr);
            this._rxBuffer.shift();
        }
        return result.join('');
    };

    /**
     * 수신 버퍼에서 정수를 읽습니다.
     * @returns {number}
     */
    SoftwareSerial.prototype.parseInt = function() {
        var str = this.readStringUntil('\n').trim();
        return parseInt(str, 10) || 0;
    };

    /**
     * 수신 버퍼에서 부동소수점을 읽습니다.
     * @returns {number}
     */
    SoftwareSerial.prototype.parseFloat = function() {
        var str = this.readStringUntil('\n').trim();
        return parseFloat(str) || 0;
    };

    /**
     * 읽기 타임아웃을 설정합니다.
     * @param {number} ms - 밀리초
     */
    SoftwareSerial.prototype.setTimeout = function(ms) {
        this._timeout = ms;
    };

    /**
     * 오버플로우 여부를 반환하고 플래그를 초기화합니다.
     * @returns {boolean}
     */
    SoftwareSerial.prototype.overflow = function() {
        var v = this._overflow;
        this._overflow = false;
        return v;
    };

    /**
     * 이 포트를 리스닝 포트로 설정합니다 (시뮬레이터 무시).
     */
    SoftwareSerial.prototype.listen = function() {
        // 시뮬레이터에서는 모든 포트가 동시에 리스닝
    };

    /**
     * 이 포트가 리스닝 중인지 반환합니다.
     * @returns {boolean}
     */
    SoftwareSerial.prototype.isListening = function() {
        return this._initialized;
    };

    /**
     * 외부에서 수신 데이터를 주입합니다 (테스트/시뮬레이션용).
     * @param {string} text - 주입할 문자열
     */
    SoftwareSerial.prototype.inject = function(text) {
        for (var i = 0; i < text.length; i++) {
            if (this._rxBuffer.length >= this._bufferSize) {
                this._overflow = true;
                break;
            }
            this._rxBuffer.push(text[i]);
        }
    };

    /**
     * 값을 포맷합니다.
     * @private
     */
    SoftwareSerial.prototype._format = function(val, format) {
        if (val === null || val === undefined) return '';
        if (typeof val === 'boolean')  return val ? '1' : '0';
        if (typeof val === 'number') {
            if (format === 16 /* HEX */) return val.toString(16).toUpperCase();
            if (format === 2  /* BIN */) return val.toString(2);
            if (format === 8  /* OCT */) return val.toString(8);
            return Number.isInteger(val) ? String(val) : val.toFixed(2);
        }
        return String(val);
    };

    /**
     * 출력을 시뮬레이터 시리얼 모니터로 전달합니다.
     * @private
     */
    SoftwareSerial.prototype._output = function(text) {
        var prefix = '[SS:RX=' + this._rxPin + '] ';
        var runtime = (typeof global !== 'undefined') ? global.currentRuntime : null;
        if (runtime && runtime._serialObj) {
            // 시리얼 모니터에 출력
            runtime._emit('serial-output', prefix + text);
        } else {
            console.log(prefix + text);
        }
    };

    /**
     * 내부 로그 출력
     * @private
     */
    SoftwareSerial.prototype._log = function(msg) {
        console.log('[SoftwareSerial] ' + msg);
    };

    // ── SoftwareSerialLib 노출 ────────────────────────────────────────────────

    global.SoftwareSerialLib = {
        SoftwareSerial: SoftwareSerial,

        /**
         * app.js _buildGlobals()에서 호출: new SoftwareSerial(rx, tx) 생성자 반환
         */
        create: SoftwareSerial,

        /**
         * 모든 SoftwareSerial 인스턴스에 데이터를 브로드캐스트합니다.
         * @param {string} text
         */
        broadcastInject: function(text) {
            _allInstances.forEach(function(inst) {
                if (inst._initialized) inst.inject(text);
            });
        },

        /** 인스턴스 목록 (read-only) */
        get instances() { return _allInstances.slice(); }
    };

    // 트랜스파일된 코드에서 new SoftwareSerial(rx, tx) 가 동작하도록
    global.SoftwareSerial = SoftwareSerial;

})(typeof window !== 'undefined' ? window : this);
