/**
 * @file IRremote.js
 * @brief Arduino IRremote 라이브러리 시뮬레이션
 *
 * IRremote 라이브러리의 수신/송신 API를 에뮬레이션합니다.
 * circuit editor의 IRReceiver 컴포넌트와 연동합니다.
 *
 * 수신 사용법 (Arduino):
 *   IRrecv irrecv(11);
 *   decode_results results;
 *   irrecv.enableIRIn();
 *   if (irrecv.decode(&results)) {
 *     Serial.println(results.value, HEX);
 *     irrecv.resume();
 *   }
 *
 * 송신 사용법 (Arduino):
 *   IRsend irsend;
 *   irsend.sendNEC(0xFF00FF, 32);
 *
 * 프로토콜 상수:
 *   NEC, SONY, RC5, RC6, DISH, SHARP, PANASONIC, JVC, SAMSUNG, WHYNTER,
 *   AIWA_RC_T501, LG, SANYO, MITSUBISHI, UNKNOWN
 *
 * 시뮬레이션 방식:
 *   - circuit의 IRReceiver 컴포넌트에 sendCode(protocol, value, bits)를 호출하면
 *     수신 버퍼에 쌓입니다.
 *   - UI에서 적외선 코드를 주입하려면 IRremoteLib.inject(protocol, value, bits)를 사용합니다.
 */

(function(global) {
    'use strict';

    // ── IR 프로토콜 상수 ──────────────────────────────────────────────────────
    var UNKNOWN      = -1;
    var NEC          = 1;
    var SONY         = 2;
    var RC5          = 3;
    var RC6          = 4;
    var DISH         = 5;
    var SHARP        = 6;
    var PANASONIC    = 7;
    var JVC          = 8;
    var SAMSUNG      = 9;
    var WHYNTER      = 10;
    var AIWA_RC_T501 = 11;
    var LG           = 12;
    var SANYO        = 13;
    var MITSUBISHI   = 14;
    var DENON        = 15;

    // ── decode_results 구조체 ─────────────────────────────────────────────────

    /**
     * decode_results — IR 수신 결과 구조체
     */
    function decode_results() {
        /** 수신된 값 (32비트) */
        this.value   = 0;

        /** 비트 수 */
        this.bits    = 0;

        /** 프로토콜 */
        this.decode_type = UNKNOWN;

        /** 원시 데이터 배열 (µs 단위 펄스/공간) */
        this.rawbuf  = [];

        /** 원시 데이터 길이 */
        this.rawlen  = 0;

        /** 오버플로우 여부 */
        this.overflow = false;
    }

    // ── IRrecv (수신기) ──────────────────────────────────────────────────────

    /**
     * IRrecv 클래스 — IR 수신기 에뮬레이션
     * @param {number} recvPin - IR 수신 핀
     * @param {number} [bufSize=100] - 수신 버퍼 크기
     */
    function IRrecv(recvPin, bufSize) {
        /** 수신 핀 번호 */
        this._pin = parseInt(recvPin, 10);

        /** 수신 버퍼 크기 */
        this._bufSize = bufSize || 100;

        /** 활성화 여부 */
        this._enabled = false;

        /** 수신된 IR 코드 큐 */
        this._rxQueue = [];

        /** 처리 대기 중인 결과 */
        this._pending = null;

        // 전역 수신기 목록에 등록
        IRremoteLib._receivers.push(this);
    }

    /**
     * IR 수신을 시작합니다.
     */
    IRrecv.prototype.enableIRIn = function() {
        this._enabled = true;
        this._rxQueue = [];
        console.log('[IRrecv] 핀 ' + this._pin + ' 수신 활성화');

        // circuit의 IRReceiver 컴포넌트 연결
        var comp = this._findComponent();
        if (comp && typeof comp.setReceiver === 'function') {
            var self = this;
            comp.setReceiver(function(protocol, value, bits) {
                self._enqueue(protocol, value, bits);
            });
        }
    };

    /**
     * 다음 신호 수신 대기를 재개합니다 (decode() 후 반드시 호출).
     */
    IRrecv.prototype.resume = function() {
        this._pending = null;
        // 다음 큐 항목 처리 준비
    };

    /**
     * 수신된 IR 코드를 디코딩합니다.
     * @param {decode_results} results - 결과를 채울 구조체 참조
     * @returns {boolean} 수신 데이터가 있으면 true
     */
    IRrecv.prototype.decode = function(results) {
        if (!this._enabled) return false;
        if (this._rxQueue.length === 0) return false;

        var item = this._rxQueue.shift();
        if (!item) return false;

        results.value       = item.value;
        results.bits        = item.bits;
        results.decode_type = item.protocol;
        results.rawbuf      = item.rawbuf || [];
        results.rawlen      = results.rawbuf.length;
        results.overflow    = false;

        this._pending = item;
        return true;
    };

    /**
     * 수신기를 비활성화합니다.
     */
    IRrecv.prototype.disableIRIn = function() {
        this._enabled = false;
    };

    /**
     * 수신 대기 중인 코드 수를 반환합니다.
     * @returns {number}
     */
    IRrecv.prototype.isIdle = function() {
        return this._rxQueue.length === 0;
    };

    /**
     * 외부에서 IR 코드를 주입합니다.
     * @param {number} protocol
     * @param {number} value
     * @param {number} bits
     */
    IRrecv.prototype._enqueue = function(protocol, value, bits) {
        if (!this._enabled) return;
        this._rxQueue.push({
            protocol: protocol,
            value:    value >>> 0,
            bits:     bits || 32,
            rawbuf:   this._generateRawBuf(protocol, value, bits)
        });
    };

    /**
     * 원시 데이터 버퍼를 시뮬레이션합니다 (NEC 기준 더미 데이터).
     * @private
     */
    IRrecv.prototype._generateRawBuf = function(protocol, value, bits) {
        // NEC 프로토콜 기준 더미 원시 데이터
        var raw = [9000, 4500]; // 리더 펄스/공간
        for (var i = bits - 1; i >= 0; i--) {
            var bit = (value >> i) & 1;
            raw.push(560);
            raw.push(bit ? 1690 : 560);
        }
        raw.push(560); // 종료 펄스
        return raw;
    };

    /**
     * circuit에서 IRReceiver 컴포넌트를 찾습니다.
     * @private
     */
    IRrecv.prototype._findComponent = function() {
        var _pm = (typeof global !== 'undefined' && global._pinNumMatch) ||
            function(v, n) { if (v === n) return true; if (typeof v === 'string') { var x = parseInt(v.replace(/^[A-Za-z]+/, ''), 10); return !isNaN(x) && x === n; } return false; };
        var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return null;

        var pin   = this._pin;
        var comps = circuit.getAllComponents();

        for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            if (comp.type !== 'IRReceiver') continue;
            var conns = comp.connections || {};
            if (_pm(conns['OUT'], pin) || _pm(conns['SIGNAL'], pin)) return comp;
        }
        return null;
    };

    // ── IRsend (송신기) ───────────────────────────────────────────────────────

    /**
     * IRsend 클래스 — IR 송신기 에뮬레이션
     * @param {number} [sendPin] - 송신 핀 (ESP32에서는 선택적)
     */
    function IRsend(sendPin) {
        this._pin = sendPin !== undefined ? parseInt(sendPin, 10) : -1;
    }

    /**
     * NEC 프로토콜로 IR 코드를 송신합니다.
     * @param {number} data - 32비트 코드
     * @param {number} bits - 비트 수 (보통 32)
     * @param {number} [repeat=0] - 반복 횟수
     */
    IRsend.prototype.sendNEC = function(data, bits, repeat) {
        this._send(NEC, data, bits || 32);
    };

    /**
     * Sony 프로토콜로 송신합니다.
     */
    IRsend.prototype.sendSony = function(data, bits, repeat) {
        this._send(SONY, data, bits || 12);
    };

    /**
     * RC5 프로토콜로 송신합니다.
     */
    IRsend.prototype.sendRC5 = function(data, bits) {
        this._send(RC5, data, bits || 12);
    };

    /**
     * RC6 프로토콜로 송신합니다.
     */
    IRsend.prototype.sendRC6 = function(data, bits) {
        this._send(RC6, data, bits || 20);
    };

    /**
     * Samsung 프로토콜로 송신합니다.
     */
    IRsend.prototype.sendSAMSUNG = function(data, bits) {
        this._send(SAMSUNG, data, bits || 32);
    };

    /**
     * LG 프로토콜로 송신합니다.
     */
    IRsend.prototype.sendLG = function(data, bits) {
        this._send(LG, data, bits || 28);
    };

    /**
     * 원시 타이밍 데이터로 송신합니다.
     * @param {number[]} buf    - 원시 데이터 배열 (µs)
     * @param {number}   len    - 길이
     * @param {number}   hz     - 캐리어 주파수
     */
    IRsend.prototype.sendRaw = function(buf, len, hz) {
        this._send(UNKNOWN, 0, 0);
        console.log('[IRsend] RAW 송신: ' + len + '개 타이밍, ' + hz + 'Hz');
    };

    /**
     * IRremoteLib 에 등록된 모든 수신기에게 전달합니다.
     * @private
     */
    IRsend.prototype._send = function(protocol, value, bits) {
        var protoName = _protocolName(protocol);
        console.log('[IRsend] 송신: ' + protoName +
                    ' 0x' + (value >>> 0).toString(16).toUpperCase() +
                    ' (' + bits + 'bits)');

        // 같은 회로의 IRrecv에게 루프백
        IRremoteLib._receivers.forEach(function(recv) {
            recv._enqueue(protocol, value, bits);
        });
    };

    // ── 유틸 ─────────────────────────────────────────────────────────────────

    function _protocolName(protocol) {
        var names = {
            '-1': 'UNKNOWN', '1': 'NEC', '2': 'SONY', '3': 'RC5',
            '4': 'RC6', '5': 'DISH', '6': 'SHARP', '7': 'PANASONIC',
            '8': 'JVC', '9': 'SAMSUNG', '10': 'WHYNTER',
            '11': 'AIWA', '12': 'LG', '13': 'SANYO', '14': 'MITSUBISHI'
        };
        return names[String(protocol)] || 'UNKNOWN';
    }

    // ── IRremoteLib 노출 ──────────────────────────────────────────────────────

    var IRremoteLib = {
        // 클래스
        IRrecv:         IRrecv,
        IRsend:         IRsend,
        decode_results: decode_results,

        // 프로토콜 상수
        UNKNOWN:      UNKNOWN,
        NEC:          NEC,
        SONY:         SONY,
        RC5:          RC5,
        RC6:          RC6,
        DISH:         DISH,
        SHARP:        SHARP,
        PANASONIC:    PANASONIC,
        JVC:          JVC,
        SAMSUNG:      SAMSUNG,
        WHYNTER:      WHYNTER,
        AIWA_RC_T501: AIWA_RC_T501,
        LG:           LG,
        SANYO:        SANYO,
        MITSUBISHI:   MITSUBISHI,
        DENON:        DENON,

        /** 전역 수신기 목록 */
        _receivers: [],

        /**
         * 모든 수신기에 IR 코드를 주입합니다 (UI/테스트용).
         * @param {number} [protocol=NEC]
         * @param {number} value
         * @param {number} [bits=32]
         */
        inject: function(protocol, value, bits) {
            var p = (protocol !== undefined) ? protocol : NEC;
            var b = bits || 32;
            this._receivers.forEach(function(recv) {
                recv._enqueue(p, value, b);
            });
        },

        /**
         * NEC 코드를 주입합니다 (단축 함수).
         * @param {number} value
         */
        injectNEC: function(value) {
            this.inject(NEC, value, 32);
        },

        /**
         * 등록된 수신기를 모두 초기화합니다.
         */
        reset: function() {
            this._receivers = [];
        }
    };

    global.IRremoteLib = IRremoteLib;

    // 트랜스파일된 코드에서 바로 사용 가능하도록
    global.IRrecv         = IRrecv;
    global.IRsend         = IRsend;
    global.decode_results = decode_results;
    global.UNKNOWN        = UNKNOWN;
    global.NEC            = NEC;
    global.SONY           = SONY;
    global.RC5            = RC5;
    global.RC6            = RC6;
    global.DISH           = DISH;
    global.SHARP          = SHARP;
    global.PANASONIC      = PANASONIC;
    global.JVC            = JVC;
    global.SAMSUNG        = SAMSUNG;
    global.WHYNTER        = WHYNTER;
    global.AIWA_RC_T501   = AIWA_RC_T501;
    global.LG             = LG;
    global.SANYO          = SANYO;
    global.MITSUBISHI     = MITSUBISHI;
    global.DENON          = DENON;

})(typeof window !== 'undefined' ? window : this);
