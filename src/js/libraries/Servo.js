/**
 * @file Servo.js
 * @brief Arduino Servo 라이브러리 시뮬레이션
 *
 * 실제 Arduino Servo API를 에뮬레이션합니다.
 *
 * 사용법 (Arduino):
 *   Servo myservo;
 *   myservo.attach(9);
 *   myservo.write(90);
 *   int angle = myservo.read();
 *   myservo.writeMicroseconds(1500);
 *   myservo.detach();
 *
 * 동작:
 *   - attach(pin) 시 window.currentCircuit에서 해당 SIGNAL 핀에
 *     연결된 Servo 컴포넌트를 찾아 angle을 전달합니다.
 *   - window.currentRuntime.ledcWrite()가 호출될 때도 자동으로
 *     Servo 컴포넌트를 업데이트합니다.
 *
 * ESP32-C3 서보 PWM 기준:
 *   - 주파수: 50Hz
 *   - 펄스 범위: 500µs(0°) ~ 2500µs(180°)
 *   - 일반적으로 1000µs(0°) ~ 2000µs(180°)
 */

(function(global) {
    'use strict';

    /** 서보 1개 인스턴스 최대 각도 */
    var SERVO_MIN_US  = 544;    // 0° 펄스 (µs)
    var SERVO_MAX_US  = 2400;   // 180° 펄스 (µs)
    var SERVO_FREQ_HZ = 50;     // 서보 PWM 주파수

    /**
     * Servo 클래스 — Arduino Servo 에뮬레이션
     * 트랜스파일 후 new Servo() 로 인스턴스를 만들어 사용합니다.
     */
    function Servo() {
        /** 연결된 GPIO 핀 번호 (-1: 미연결) */
        this._pin = -1;

        /** 현재 각도 (0~180) */
        this._angle = 90;

        /** 현재 펄스 폭 (µs) */
        this._pulseUs = 1500;

        /** 최소 펄스 폭 (µs) */
        this._minUs = SERVO_MIN_US;

        /** 최대 펄스 폭 (µs) */
        this._maxUs = SERVO_MAX_US;

        /** 연결된 circuit 컴포넌트 참조 */
        this._comp = null;

        /** attach 완료 여부 */
        this._attached = false;
    }

    /**
     * 핀에 서보를 연결합니다.
     * @param {number} pin    - GPIO 핀 번호
     * @param {number} [minUs=544]  - 0° 에 해당하는 최소 펄스 (µs)
     * @param {number} [maxUs=2400] - 180° 에 해당하는 최대 펄스 (µs)
     * @returns {number} 채널 번호 (에뮬레이션 전용)
     */
    Servo.prototype.attach = function(pin, minUs, maxUs) {
        this._pin      = parseInt(pin, 10);
        this._minUs    = minUs  !== undefined ? minUs  : SERVO_MIN_US;
        this._maxUs    = maxUs  !== undefined ? maxUs  : SERVO_MAX_US;
        this._attached = true;

        // circuit에서 해당 핀에 연결된 Servo 컴포넌트 찾기
        this._comp = this._findServoComponent(this._pin);
        if (this._comp) {
            console.log('[Servo] 핀 ' + pin + ' → 컴포넌트 ' + this._comp.id + ' 연결');
        } else {
            console.log('[Servo] 핀 ' + pin + ' 연결 (컴포넌트 없음)');
        }

        // 현재 각도로 초기 업데이트
        this._applyAngle(this._angle);

        return 0;
    };

    /**
     * 서보 연결을 해제합니다.
     */
    Servo.prototype.detach = function() {
        this._pin      = -1;
        this._comp     = null;
        this._attached = false;
    };

    /**
     * 서보 연결 여부를 반환합니다.
     * @returns {boolean}
     */
    Servo.prototype.attached = function() {
        return this._attached;
    };

    /**
     * 각도를 설정합니다.
     * @param {number} angle - 0~180 (도)
     */
    Servo.prototype.write = function(angle) {
        angle = parseInt(angle, 10);

        // 0~180 범위로 제한
        if (angle < 0)   angle = 0;
        if (angle > 180) angle = 180;

        this._angle   = angle;
        this._pulseUs = this._angleToPulse(angle);

        this._applyAngle(angle);
    };

    /**
     * 펄스 폭(µs)으로 서보를 제어합니다.
     * @param {number} us - 펄스 폭 (µs), 보통 1000~2000
     */
    Servo.prototype.writeMicroseconds = function(us) {
        us = parseInt(us, 10);
        us = Math.max(this._minUs, Math.min(this._maxUs, us));

        this._pulseUs = us;
        this._angle   = this._pulseToAngle(us);

        this._applyAngle(this._angle);
    };

    /**
     * 현재 각도를 반환합니다.
     * @returns {number} 0~180
     */
    Servo.prototype.read = function() {
        return this._angle;
    };

    /**
     * 현재 펄스 폭(µs)을 반환합니다.
     * @returns {number}
     */
    Servo.prototype.readMicroseconds = function() {
        return this._pulseUs;
    };

    /**
     * 각도 → 펄스 폭 변환
     * @private
     */
    Servo.prototype._angleToPulse = function(angle) {
        return Math.round(
            this._minUs + (angle / 180) * (this._maxUs - this._minUs)
        );
    };

    /**
     * 펄스 폭 → 각도 변환
     * @private
     */
    Servo.prototype._pulseToAngle = function(us) {
        return Math.round(
            (us - this._minUs) / (this._maxUs - this._minUs) * 180
        );
    };

    /**
     * 실제 컴포넌트와 runtime에 각도를 반영합니다.
     * @private
     */
    Servo.prototype._applyAngle = function(angle) {
        // circuit Servo 컴포넌트 업데이트
        if (this._comp) {
            if (typeof this._comp._setAngle === 'function') {
                this._comp._setAngle(angle);
            }
            // onPwmChange 방식으로도 전달 (컴포넌트 호환성)
            if (typeof this._comp.onPwmChange === 'function') {
                // 50Hz, duty = pulse / period * 8191
                var periodUs = 1000000 / SERVO_FREQ_HZ;
                var duty = Math.round((this._pulseUs / periodUs) * 8191);
                this._comp.onPwmChange(this._pin, duty, SERVO_FREQ_HZ);
            }
        }

        // circuit에서 SIGNAL 핀으로 연결된 Servo 재탐색
        if (!this._comp && this._pin >= 0) {
            this._comp = this._findServoComponent(this._pin);
        }
    };

    /**
     * circuit에서 해당 GPIO 핀에 연결된 Servo 컴포넌트를 찾습니다.
     * @private
     * @param {number} gpioPin
     * @returns {object|null}
     */
    Servo.prototype._findServoComponent = function(gpioPin) {
        var _pm = (typeof global !== 'undefined' && global._pinNumMatch) ||
            function(v, n) { if (v === n) return true; if (typeof v === 'string') { var x = parseInt(v.replace(/^[A-Za-z]+/, ''), 10); return !isNaN(x) && x === n; } return false; };
        var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return null;

        var comps = circuit.getAllComponents();

        for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            if (comp.type !== 'Servo') continue;
            // SIGNAL 핀이 해당 GPIO 핀에 연결되었는지 확인
            var conns = comp.connections || {};
            if (_pm(conns['SIGNAL'], gpioPin) || _pm(conns['S'], gpioPin)) {
                return comp;
            }
        }
        return null;
    };

    // ── ServoLib 팩토리 함수 ──────────────────────────────────────────────────

    /**
     * ServoLib — 트랜스파일된 코드에서 `new Servo()` 로 호출하는 팩토리
     */
    function ServoLib() {
        // 빈 생성자: 실제 인스턴스는 new Servo() 로 생성
    }

    /**
     * window.ServoLib 으로 노출
     */
    global.ServoLib = {
        Servo:      Servo,
        createServo: function() { return new Servo(); },

        /**
         * app.js _buildGlobals()에서 호출: new Servo() 생성자 반환
         * 트랜스파일된 코드에서 `new Servo()` 형태로 사용됩니다.
         */
        create: Servo
    };

    // 트랜스파일된 코드에서 직접 `new Servo()` 가 동작하도록
    global.Servo = Servo;

})(typeof window !== 'undefined' ? window : this);
