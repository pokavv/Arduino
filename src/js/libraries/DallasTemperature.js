/**
 * @file DallasTemperature.js
 * @brief Arduino DallasTemperature (DS18B20) 라이브러리 시뮬레이션
 *
 * DallasTemperature 라이브러리의 API를 에뮬레이션합니다.
 * circuit editor의 DS18B20 컴포넌트와 연동합니다.
 *
 * 사용법 (Arduino):
 *   #include <OneWire.h>
 *   #include <DallasTemperature.h>
 *   OneWire oneWire(4);
 *   DallasTemperature sensors(&oneWire);
 *   sensors.begin();
 *   sensors.requestTemperatures();
 *   float temp = sensors.getTempCByIndex(0);
 *
 * 시뮬레이션 방식:
 *   - OneWire 인스턴스의 핀 번호를 기반으로
 *     DATA 핀이 일치하는 DS18B20 컴포넌트를 circuit에서 찾습니다.
 *   - 컴포넌트의 readTemperature() 메서드를 호출하여 온도를 가져옵니다.
 *   - 여러 DS18B20이 같은 핀에 연결된 경우 인덱스로 구분합니다.
 */

(function(global) {
    'use strict';

    /** 읽기 실패 시 반환값 (DallasTemperature DEVICE_DISCONNECTED_C) */
    var DEVICE_DISCONNECTED_C = -127.0;
    var DEVICE_DISCONNECTED_F = -196.6;
    var DEVICE_DISCONNECTED_RAW = -7040;

    /**
     * DallasTemperature 클래스
     * @param {object} oneWire - OneWire 인스턴스 (핀 정보를 담고 있음)
     */
    function DallasTemperature(oneWire) {
        /** OneWire 인스턴스 */
        this._oneWire = oneWire || null;

        /** 발견된 DS18B20 컴포넌트 목록 */
        this._devices = [];

        /** 마지막 온도 읽기 완료 여부 */
        this._requested = false;

        /** 해상도 (비트) */
        this._resolution = 12;

        /** 기생 전원 사용 여부 */
        this._parasite = false;
    }

    /**
     * 센서를 초기화하고 버스에서 DS18B20 컴포넌트를 탐색합니다.
     */
    DallasTemperature.prototype.begin = function() {
        this._devices = this._findDevices();
        if (this._devices.length > 0) {
            console.log('[DallasTemperature] 핀 ' + this._getPin() +
                        ' → DS18B20 ' + this._devices.length + '개 발견');
        } else {
            console.log('[DallasTemperature] 핀 ' + this._getPin() +
                        ' DS18B20 컴포넌트 없음');
        }
    };

    /**
     * 모든 센서에 온도 변환을 요청합니다.
     * 실제 하드웨어에서는 변환 완료까지 최대 750ms 소요됩니다.
     * 에뮬레이션에서는 즉시 완료로 처리합니다.
     */
    DallasTemperature.prototype.requestTemperatures = function() {
        // 디바이스 목록이 비어 있으면 다시 탐색
        if (this._devices.length === 0) {
            this._devices = this._findDevices();
        }
        this._requested = true;
    };

    /**
     * 인덱스 번호로 DS18B20 온도(섭씨)를 반환합니다.
     * @param {number} idx - 0부터 시작하는 디바이스 인덱스
     * @returns {number} 온도(°C) 또는 DEVICE_DISCONNECTED_C(-127)
     */
    DallasTemperature.prototype.getTempCByIndex = function(idx) {
        var comp = this._getDevice(idx);
        if (!comp || typeof comp.readTemperature !== 'function') {
            return DEVICE_DISCONNECTED_C;
        }
        var temp = comp.readTemperature();
        if (typeof temp !== 'number' || isNaN(temp)) {
            return DEVICE_DISCONNECTED_C;
        }
        return temp;
    };

    /**
     * 인덱스 번호로 DS18B20 온도(화씨)를 반환합니다.
     * @param {number} idx - 0부터 시작하는 디바이스 인덱스
     * @returns {number} 온도(°F) 또는 DEVICE_DISCONNECTED_F(-196.6)
     */
    DallasTemperature.prototype.getTempFByIndex = function(idx) {
        var tempC = this.getTempCByIndex(idx);
        if (tempC === DEVICE_DISCONNECTED_C) return DEVICE_DISCONNECTED_F;
        return tempC * 9.0 / 5.0 + 32.0;
    };

    /**
     * 버스에 연결된 DS18B20 개수를 반환합니다.
     * @returns {number}
     */
    DallasTemperature.prototype.getDeviceCount = function() {
        if (this._devices.length === 0) {
            this._devices = this._findDevices();
        }
        return this._devices.length;
    };

    /**
     * 파생 전원(parasitic power) 사용 여부를 반환합니다.
     * @returns {boolean} (에뮬레이션: 항상 false)
     */
    DallasTemperature.prototype.isParasitePowerMode = function() {
        return this._parasite;
    };

    /**
     * 해상도를 설정합니다 (9~12비트).
     * @param {number} res - 9, 10, 11, 12 중 하나
     */
    DallasTemperature.prototype.setResolution = function(res) {
        this._resolution = res;
    };

    /**
     * 현재 해상도를 반환합니다.
     * @returns {number}
     */
    DallasTemperature.prototype.getResolution = function() {
        return this._resolution;
    };

    /**
     * 온도 변환 완료까지 기다립니다 (에뮬레이션: noop).
     */
    DallasTemperature.prototype.blockTillConversionComplete = function() {
        // 에뮬레이션: 즉시 완료
    };

    // ── 내부 메서드 ──────────────────────────────────────────────────────────

    /**
     * OneWire 핀 번호를 반환합니다.
     * @private
     * @returns {number}
     */
    DallasTemperature.prototype._getPin = function() {
        if (!this._oneWire) return -1;
        if (typeof this._oneWire._pin === 'number') return this._oneWire._pin;
        if (typeof this._oneWire.getPin === 'function') return this._oneWire.getPin();
        return -1;
    };

    /**
     * 인덱스에 해당하는 디바이스 컴포넌트를 반환합니다.
     * @private
     * @param {number} idx
     * @returns {object|null}
     */
    DallasTemperature.prototype._getDevice = function(idx) {
        if (this._devices.length === 0) {
            this._devices = this._findDevices();
        }
        if (idx < 0 || idx >= this._devices.length) return null;
        return this._devices[idx];
    };

    /**
     * circuit에서 OneWire 핀에 연결된 DS18B20 컴포넌트를 모두 찾습니다.
     * @private
     * @returns {object[]}
     */
    DallasTemperature.prototype._findDevices = function() {
        var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return [];

        var pin   = this._getPin();
        var comps = circuit.getAllComponents();
        var found = [];

        for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            if (comp.type !== 'DS18B20') continue;
            var conns = comp.connections || {};
            if (conns['DATA'] === pin) {
                found.push(comp);
            }
        }
        return found;
    };

    // ── 전역 상수 노출 ────────────────────────────────────────────────────────

    global.DallasTemperatureLib = {
        DallasTemperature:       DallasTemperature,
        DEVICE_DISCONNECTED_C:   DEVICE_DISCONNECTED_C,
        DEVICE_DISCONNECTED_F:   DEVICE_DISCONNECTED_F,
        DEVICE_DISCONNECTED_RAW: DEVICE_DISCONNECTED_RAW,
        /** app.js _buildGlobals()에서 호출: new DallasTemperature(oneWire) 생성자 반환 */
        create: DallasTemperature
    };

    // 트랜스파일된 코드에서 직접 new DallasTemperature(...) 가 동작하도록
    global.DallasTemperature       = DallasTemperature;
    global.DEVICE_DISCONNECTED_C   = DEVICE_DISCONNECTED_C;
    global.DEVICE_DISCONNECTED_F   = DEVICE_DISCONNECTED_F;
    global.DEVICE_DISCONNECTED_RAW = DEVICE_DISCONNECTED_RAW;

})(typeof window !== 'undefined' ? window : this);
