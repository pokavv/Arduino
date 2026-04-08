/**
 * @file DHT.js
 * @brief Arduino DHT11/DHT22 온습도 센서 라이브러리 시뮬레이션
 *
 * DHT 라이브러리(Adafruit)의 API를 에뮬레이션합니다.
 * circuit editor의 DHT11 또는 DHT22 컴포넌트와 연동합니다.
 *
 * 사용법 (Arduino):
 *   #include <DHT.h>
 *   DHT dht(4, DHT11);
 *   dht.begin();
 *   float temp = dht.readTemperature();
 *   float hum  = dht.readHumidity();
 *   if (isnan(temp)) { Serial.println("읽기 실패"); }
 *
 * 시뮬레이션 방식:
 *   - DATA 핀이 생성자 pin과 일치하는 DHT11/DHT22 컴포넌트를 찾습니다.
 *   - 컴포넌트의 readTemperature() / readHumidity() 메서드를 호출합니다.
 *   - 컴포넌트가 없으면 NaN을 반환합니다.
 */

(function(global) {
    'use strict';

    /** 센서 타입 상수 */
    var DHT11 = 11;
    var DHT22 = 22;
    var DHT21 = 21;
    var AM2301 = 21;

    /**
     * DHT 클래스 — Arduino DHT 라이브러리 에뮬레이션
     * @param {number} pin  - DATA 핀 GPIO 번호
     * @param {number} type - 센서 타입 (DHT11=11, DHT22=22)
     */
    function DHT(pin, type) {
        /** DATA 핀 번호 */
        this._pin = parseInt(pin, 10);

        /** 센서 타입 (11 또는 22) */
        this._type = type !== undefined ? type : DHT11;

        /** 연결된 circuit 컴포넌트 참조 (lazy 탐색) */
        this._comp = null;
    }

    /**
     * 센서를 초기화합니다. setup()에서 호출합니다.
     */
    DHT.prototype.begin = function() {
        this._comp = this._findComponent();
        if (this._comp) {
            console.log('[DHT] 핀 ' + this._pin + ' → 컴포넌트 ' + this._comp.id + ' 연결');
        } else {
            console.log('[DHT] 핀 ' + this._pin + ' DHT 컴포넌트 없음');
        }
    };

    /**
     * 온도를 읽습니다.
     * @param {boolean} [isFahrenheit=false] - true이면 화씨 반환
     * @param {boolean} [force=false]        - 강제 재읽기 (미사용)
     * @returns {number} 온도값 또는 NaN (읽기 실패)
     */
    DHT.prototype.readTemperature = function(isFahrenheit, force) {
        var comp = this._getComponent();
        if (!comp || typeof comp.readTemperature !== 'function') {
            return NaN;
        }

        var temp = comp.readTemperature();
        if (typeof temp !== 'number' || isNaN(temp)) return NaN;

        if (isFahrenheit) {
            // 섭씨 → 화씨 변환
            return temp * 9.0 / 5.0 + 32.0;
        }
        return temp;
    };

    /**
     * 습도를 읽습니다.
     * @param {boolean} [force=false] - 강제 재읽기 (미사용)
     * @returns {number} 습도값(%) 또는 NaN (읽기 실패)
     */
    DHT.prototype.readHumidity = function(force) {
        var comp = this._getComponent();
        if (!comp || typeof comp.readHumidity !== 'function') {
            return NaN;
        }

        var hum = comp.readHumidity();
        if (typeof hum !== 'number' || isNaN(hum)) return NaN;
        return hum;
    };

    /**
     * 열지수(Heat Index)를 계산합니다.
     * @param {number}  temp         - 온도
     * @param {number}  humidity     - 습도(%)
     * @param {boolean} [isFahrenheit=false]
     * @returns {number}
     */
    DHT.prototype.computeHeatIndex = function(temp, humidity, isFahrenheit) {
        var t = isFahrenheit ? temp : (temp * 9.0 / 5.0 + 32.0);
        var hi = -42.379 +
                  2.04901523  * t +
                 10.14333127  * humidity -
                  0.22475541  * t * humidity -
                  0.00683783  * t * t -
                  0.05481717  * humidity * humidity +
                  0.00122874  * t * t * humidity +
                  0.00085282  * t * humidity * humidity -
                  0.00000199  * t * t * humidity * humidity;
        return isFahrenheit ? hi : (hi - 32.0) * 5.0 / 9.0;
    };

    // ── 내부 메서드 ──────────────────────────────────────────────────────────

    /**
     * 컴포넌트를 반환합니다. 아직 찾지 못한 경우 다시 탐색합니다.
     * @private
     * @returns {object|null}
     */
    DHT.prototype._getComponent = function() {
        if (!this._comp) {
            this._comp = this._findComponent();
        }
        return this._comp;
    };

    /**
     * circuit에서 DATA 핀이 일치하는 DHT 컴포넌트를 찾습니다.
     * @private
     * @returns {object|null}
     */
    DHT.prototype._findComponent = function() {
        var _pinNumMatch = (typeof global !== 'undefined' && global._pinNumMatch) ||
            function(v, n) { if (v === n) return true; if (typeof v === 'string') { var x = parseInt(v.replace(/^[A-Za-z]+/, ''), 10); return !isNaN(x) && x === n; } return false; };
        var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return null;

        var comps = circuit.getAllComponents();
        var pin   = this._pin;

        for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            // DHT11 또는 DHT22 타입 컴포넌트만 탐색
            if (comp.type !== 'DHT11' && comp.type !== 'DHT22') continue;
            var conns = comp.connections || {};
            if (_pinNumMatch(conns['DATA'], pin)) {
                return comp;
            }
        }
        return null;
    };

    // ── isnan 전역 헬퍼 (Arduino isnan() 에뮬레이션) ────────────────────────

    /**
     * 값이 NaN인지 확인합니다 (Arduino isnan() 함수 에뮬레이션).
     * @param {number} val
     * @returns {boolean}
     */
    function isnan(val) {
        return typeof val !== 'number' || isNaN(val);
    }

    // ── 전역 노출 ────────────────────────────────────────────────────────────

    global.DHTLib = {
        DHT:   DHT,
        DHT11: DHT11,
        DHT22: DHT22,
        DHT21: DHT21,
        AM2301: AM2301,
        /** app.js _buildGlobals()에서 호출: new DHT(pin, type) 생성자 반환 */
        create: DHT
    };

    // 트랜스파일된 코드에서 직접 new DHT(), DHT11, DHT22 가 동작하도록
    global.DHT   = DHT;
    global.DHT11 = DHT11;
    global.DHT22 = DHT22;
    global.DHT21 = DHT21;
    global.AM2301 = AM2301;
    global.isnan  = isnan;

})(typeof window !== 'undefined' ? window : this);
