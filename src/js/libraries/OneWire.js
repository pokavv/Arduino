/**
 * @file OneWire.js
 * @brief Arduino OneWire 프로토콜 라이브러리 시뮬레이션
 *
 * OneWire 라이브러리의 기본 API를 에뮬레이션합니다.
 * 실제 1-Wire 비트 프로토콜은 시뮬레이션하지 않으며,
 * DallasTemperature 등 상위 라이브러리가 핀 정보를 가져가도록
 * 핀 번호를 보관하는 역할을 합니다.
 *
 * 사용법 (Arduino):
 *   #include <OneWire.h>
 *   OneWire oneWire(4);
 *   // DallasTemperature 에 전달하여 사용
 *   DallasTemperature sensors(&oneWire);
 *
 * 시뮬레이션 방식:
 *   - reset() / select() / write() / read() / search() 등
 *     기본 1-Wire 동작은 스텁(stub)으로 처리합니다.
 *   - 실제 센서 읽기는 DallasTemperature 레이어에서 컴포넌트와 직접 연동합니다.
 */

(function(global) {
    'use strict';

    /**
     * OneWire 클래스 — Arduino OneWire 라이브러리 에뮬레이션
     * @param {number} pin - 데이터 핀 GPIO 번호
     */
    function OneWire(pin) {
        /** 데이터 핀 번호 (DallasTemperature 등이 참조) */
        this._pin = parseInt(pin, 10);
    }

    /**
     * 버스를 리셋합니다.
     * @returns {boolean} 디바이스가 존재하면 true (에뮬레이션: 항상 true)
     */
    OneWire.prototype.reset = function() {
        return true;
    };

    /**
     * 디바이스를 선택합니다 (ROM 주소 전송).
     * @param {Uint8Array|number[]} addr - 8바이트 ROM 주소
     */
    OneWire.prototype.select = function(addr) {
        // 에뮬레이션: noop
    };

    /**
     * 1바이트를 버스에 씁니다.
     * @param {number} byte_val - 전송할 바이트
     * @param {number} [power=0] - 기생 전원 유지 여부
     */
    OneWire.prototype.write = function(byte_val, power) {
        // 에뮬레이션: noop
    };

    /**
     * 여러 바이트를 버스에 씁니다.
     * @param {Uint8Array|number[]} buf
     * @param {number}              len
     * @param {number}              [power=0]
     */
    OneWire.prototype.write_bytes = function(buf, len, power) {
        // 에뮬레이션: noop
    };

    /**
     * 1바이트를 버스에서 읽습니다.
     * @returns {number} 읽은 바이트 (에뮬레이션: 항상 0)
     */
    OneWire.prototype.read = function() {
        return 0;
    };

    /**
     * 여러 바이트를 버스에서 읽습니다.
     * @param {Uint8Array|number[]} buf
     * @param {number}              len
     */
    OneWire.prototype.read_bytes = function(buf, len) {
        // 에뮬레이션: noop
    };

    /**
     * 1비트를 씁니다.
     * @param {number} v
     */
    OneWire.prototype.write_bit = function(v) {
        // 에뮬레이션: noop
    };

    /**
     * 1비트를 읽습니다.
     * @returns {number} (에뮬레이션: 항상 0)
     */
    OneWire.prototype.read_bit = function() {
        return 0;
    };

    /**
     * 버스에서 디바이스를 검색합니다.
     * @param {Uint8Array|number[]} newAddr - ROM 주소가 채워질 배열
     * @returns {boolean} 디바이스를 찾으면 true (에뮬레이션: 항상 false)
     */
    OneWire.prototype.search = function(newAddr) {
        // 에뮬레이션: 간략화, 항상 false 반환
        return false;
    };

    /**
     * 디바이스 검색을 리셋하여 처음부터 다시 탐색합니다.
     */
    OneWire.prototype.reset_search = function() {
        // 에뮬레이션: noop
    };

    /**
     * 다음 디바이스를 검색합니다.
     * @param {Uint8Array|number[]} newAddr
     * @param {boolean}             [search_mode=true]
     * @returns {boolean}
     */
    OneWire.prototype.next = function(newAddr, search_mode) {
        return false;
    };

    /**
     * CRC8을 계산합니다.
     * @param {Uint8Array|number[]} addr
     * @param {number}              len
     * @returns {number}
     */
    OneWire.prototype.crc8 = function(addr, len) {
        var crc = 0;
        for (var i = 0; i < len; i++) {
            var inbyte = addr[i];
            for (var j = 8; j > 0; j--) {
                var mix = (crc ^ inbyte) & 0x01;
                crc >>= 1;
                if (mix) crc ^= 0x8C;
                inbyte >>= 1;
            }
        }
        return crc;
    };

    /**
     * 데이터 핀 번호를 반환합니다 (DallasTemperature 등이 사용).
     * @returns {number}
     */
    OneWire.prototype.getPin = function() {
        return this._pin;
    };

    // ── 전역 노출 ────────────────────────────────────────────────────────────

    global.OneWireLib = {
        OneWire: OneWire,
        /** app.js _buildGlobals()에서 호출: new OneWire(pin) 생성자 반환 */
        create: OneWire
    };

    // 트랜스파일된 코드에서 직접 new OneWire(pin) 가 동작하도록
    global.OneWire = OneWire;

})(typeof window !== 'undefined' ? window : this);
