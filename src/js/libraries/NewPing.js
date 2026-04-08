/**
 * @file NewPing.js
 * @brief Arduino NewPing (HC-SR04 초음파 거리 센서) 라이브러리 시뮬레이션
 *
 * NewPing 라이브러리의 API를 에뮬레이션합니다.
 * circuit editor의 Ultrasonic_HCSR04 컴포넌트와 연동합니다.
 *
 * 사용법 (Arduino):
 *   #include <NewPing.h>
 *   NewPing sonar(TRIG_PIN, ECHO_PIN, MAX_DISTANCE);
 *   int dist = sonar.ping_cm();
 *   int dist = sonar.ping_median(5);
 *
 * 시뮬레이션 방식:
 *   - TRIG 핀이 trigPin과 일치하는 Ultrasonic_HCSR04 컴포넌트를 찾습니다.
 *   - 컴포넌트의 _distance 속성에서 거리(cm)를 읽습니다.
 *   - 기본 거리값은 20cm입니다.
 *
 * HC-SR04 핀 연결:
 *   - VCC → 3.3V 또는 5V
 *   - GND → GND
 *   - TRIG → GPIO (짧은 펄스 송신)
 *   - ECHO → GPIO (반사 신호 수신)
 */

(function(global) {
    'use strict';

    /** 최대 거리 기본값 (cm) */
    var DEFAULT_MAX_DIST = 200;

    /** 소리의 속도: 1cm 왕복에 필요한 시간(µs) */
    var US_ROUNDTRIP_CM = 57.0;

    /**
     * NewPing 클래스 — HC-SR04 초음파 거리 센서 라이브러리 에뮬레이션
     * @param {number} trigPin  - TRIG 핀 GPIO 번호
     * @param {number} echoPin  - ECHO 핀 GPIO 번호
     * @param {number} [maxDist=200] - 최대 측정 거리 (cm)
     */
    function NewPing(trigPin, echoPin, maxDist) {
        /** TRIG 핀 GPIO 번호 */
        this._trigPin = parseInt(trigPin, 10);

        /** ECHO 핀 GPIO 번호 */
        this._echoPin = parseInt(echoPin, 10);

        /** 최대 측정 거리 (cm) */
        this._maxDist = maxDist !== undefined ? parseInt(maxDist, 10) : DEFAULT_MAX_DIST;

        /** 연결된 circuit 컴포넌트 참조 (lazy 탐색) */
        this._comp = null;
    }

    /**
     * 거리를 센티미터(cm)로 반환합니다.
     * @returns {number} 거리(cm), 범위 초과 또는 컴포넌트 없으면 0
     */
    NewPing.prototype.ping_cm = function() {
        var comp = this._getComponent();
        if (!comp) return 0;

        var dist = (typeof comp._distance === 'number') ? comp._distance : 20;
        if (dist <= 0 || dist > this._maxDist) return 0;
        return dist;
    };

    /**
     * 거리를 인치(inch)로 반환합니다.
     * @returns {number} 거리(inch)
     */
    NewPing.prototype.ping_in = function() {
        return this.ping_cm() * 0.3937;
    };

    /**
     * 왕복 시간(µs)을 반환합니다.
     * @returns {number} 마이크로초, 범위 초과이면 0
     */
    NewPing.prototype.ping = function() {
        var cm = this.ping_cm();
        if (cm === 0) return 0;
        return Math.round(cm * US_ROUNDTRIP_CM);
    };

    /**
     * 여러 번 측정하여 중앙값을 반환합니다 (µs).
     * @param {number} [iterations=5] - 측정 반복 횟수
     * @returns {number} 중앙값(µs)
     */
    NewPing.prototype.ping_median = function(iterations) {
        var n    = iterations !== undefined ? parseInt(iterations, 10) : 5;
        var cm   = this.ping_cm();
        var us   = cm === 0 ? 0 : Math.round(cm * US_ROUNDTRIP_CM);
        // 에뮬레이션: 모든 측정값이 동일하므로 중앙값도 동일
        return us;
    };

    /**
     * 거리(cm) 값을 µs로 변환하는 정적 유틸리티입니다.
     * @param {number} cm
     * @returns {number}
     */
    NewPing.convert_cm = function(us) {
        return us === 0 ? 0 : (us / US_ROUNDTRIP_CM);
    };

    /**
     * 거리(inch) 값을 µs로 변환하는 정적 유틸리티입니다.
     * @param {number} us
     * @returns {number}
     */
    NewPing.convert_in = function(us) {
        return us === 0 ? 0 : (us / 148.0);
    };

    // ── 내부 메서드 ──────────────────────────────────────────────────────────

    /**
     * 컴포넌트를 반환합니다. 아직 찾지 못한 경우 다시 탐색합니다.
     * @private
     * @returns {object|null}
     */
    NewPing.prototype._getComponent = function() {
        if (!this._comp) {
            this._comp = this._findComponent();
        }
        return this._comp;
    };

    /**
     * circuit에서 TRIG 핀이 일치하는 Ultrasonic_HCSR04 컴포넌트를 찾습니다.
     * TRIG가 일치하지 않으면 ECHO 핀도 확인합니다.
     * 핀 매칭 실패 시 첫 번째 Ultrasonic_HCSR04 컴포넌트를 반환합니다.
     * @private
     * @returns {object|null}
     */
    NewPing.prototype._findComponent = function() {
        var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return null;

        var comps    = circuit.getAllComponents();
        var trigPin  = this._trigPin;
        var echoPin  = this._echoPin;
        var fallback = null;

        for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            if (comp.type !== 'Ultrasonic_HCSR04') continue;

            var conns = comp.connections || {};
            if (conns['TRIG'] === trigPin || conns['ECHO'] === echoPin) {
                return comp;
            }
            // 첫 번째 HC-SR04를 폴백으로 보관
            if (!fallback) fallback = comp;
        }
        return fallback;
    };

    // ── 전역 노출 ────────────────────────────────────────────────────────────

    global.NewPingLib = {
        NewPing: NewPing,
        /** app.js _buildGlobals()에서 호출: new NewPing(trig, echo, maxDist) 생성자 반환 */
        create: NewPing
    };

    // 트랜스파일된 코드에서 직접 new NewPing(...) 가 동작하도록
    global.NewPing = NewPing;

})(typeof window !== 'undefined' ? window : this);
