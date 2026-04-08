/**
 * @file Stepper.js
 * @brief Arduino Stepper 라이브러리 시뮬레이션
 *
 * Arduino 내장 Stepper 라이브러리의 API를 에뮬레이션합니다.
 * circuit editor의 Stepper_28BYJ48 컴포넌트와 연동합니다.
 *
 * 사용법 (Arduino):
 *   #include <Stepper.h>
 *   // 4선 방식 (28BYJ-48 + ULN2003)
 *   Stepper myStepper(STEPS_PER_REV, IN1, IN2, IN3, IN4);
 *   myStepper.setSpeed(15);       // RPM
 *   myStepper.step(512);          // 1바퀴 (512 스텝 = 360°)
 *
 *   // 2선 방식
 *   Stepper myStepper(STEPS_PER_REV, pin1, pin2);
 *
 * 28BYJ-48 스펙:
 *   - 스텝 각도: 5.625° (64 스텝 = 1 내부 회전)
 *   - 기어비: 1/64
 *   - 실제 1바퀴: 64 × 64 = 4096 스텝 (풀-스텝), 또는 2048(하프-스텝)
 *   - 일반적으로 Arduino Stepper 라이브러리에서 512 스텝 = 1바퀴로 사용
 *
 * 시뮬레이션 방식:
 *   - IN1~IN4 핀 중 하나가 일치하는 Stepper_28BYJ48 컴포넌트를 circuit에서 찾습니다.
 *   - 컴포넌트의 _angle을 직접 업데이트하여 시각적 회전을 표현합니다.
 *   - 컴포넌트에 onGpioChange(pin, value) 메서드가 있으면 스텝마다 호출합니다.
 */

(function(global) {
    'use strict';

    /**
     * Stepper 클래스 — Arduino Stepper 라이브러리 에뮬레이션
     *
     * @param {number} stepsPerRevolution - 1 바퀴당 스텝 수
     * @param {number} pin1 - IN1 핀 (또는 2선 방식의 핀1)
     * @param {number} pin2 - IN2 핀 (또는 2선 방식의 핀2)
     * @param {number} [pin3] - IN3 핀 (4선 방식)
     * @param {number} [pin4] - IN4 핀 (4선 방식)
     */
    function Stepper(stepsPerRevolution, pin1, pin2, pin3, pin4) {
        /** 1바퀴당 스텝 수 */
        this._stepsPerRev = parseInt(stepsPerRevolution, 10) || 512;

        /** 핀 목록 */
        this._pin1 = parseInt(pin1, 10);
        this._pin2 = parseInt(pin2, 10);
        this._pin3 = pin3 !== undefined ? parseInt(pin3, 10) : -1;
        this._pin4 = pin4 !== undefined ? parseInt(pin4, 10) : -1;

        /** 4선 방식 여부 */
        this._is4Wire = (pin3 !== undefined && pin4 !== undefined);

        /** 현재 스텝 위치 (0 ~ stepsPerRev - 1) */
        this._stepPos = 0;

        /** 현재 속도 (RPM) */
        this._rpm = 0;

        /** 연결된 circuit 컴포넌트 참조 (lazy 탐색) */
        this._comp = null;
    }

    /**
     * 회전 속도를 설정합니다.
     * @param {number} rpm - 분당 회전수 (RPM)
     */
    Stepper.prototype.setSpeed = function(rpm) {
        this._rpm = parseFloat(rpm) || 0;
    };

    /**
     * 지정한 스텝만큼 모터를 회전합니다.
     * 양수 = 정방향(시계 방향), 음수 = 역방향(반시계 방향).
     * @param {number} steps - 이동할 스텝 수 (양수 또는 음수)
     */
    Stepper.prototype.step = function(steps) {
        var n    = parseInt(steps, 10) || 0;
        var comp = this._getComponent();

        if (n === 0) return;

        // 스텝 위치 업데이트
        this._stepPos = (this._stepPos + n) % this._stepsPerRev;
        if (this._stepPos < 0) this._stepPos += this._stepsPerRev;

        if (!comp) return;

        // 각도 직접 업데이트 (스텝 → 각도 변환)
        var deltaDeg = (n / this._stepsPerRev) * 360.0;
        comp._angle  = ((comp._angle || 0) + deltaDeg) % 360;
        if (comp._angle < 0) comp._angle += 360;

        // 시각적 회전 요소 업데이트 (rotor SVG 있을 경우)
        if (comp._rotor) {
            try {
                comp._rotor.setAttribute('transform',
                    'rotate(' + comp._angle.toFixed(2) + ')');
            } catch (e) {
                // DOM 조작 실패 시 무시
            }
        }

        // onGpioChange 방식 지원 (컴포넌트 호환성)
        if (typeof comp.onGpioChange === 'function') {
            var stepsAbs = Math.abs(n);
            var dir      = n > 0 ? 1 : 0;
            var pinToUse = this._is4Wire ? this._pin1 : this._pin1;
            // 스텝 수만큼 onGpioChange 호출 (시각 효과)
            var callCount = Math.min(stepsAbs, 64); // 너무 많으면 64회 제한
            for (var i = 0; i < callCount; i++) {
                comp.onGpioChange(pinToUse, dir);
            }
        }

        // _step 메서드 지원
        if (typeof comp._step === 'function') {
            comp._step(n > 0 ? 1 : -1);
        }

        // render 메서드 지원
        if (typeof comp._render === 'function') {
            comp._render();
        } else if (typeof comp.render === 'function') {
            comp.render();
        }
    };

    /**
     * 현재 스텝 위치를 반환합니다.
     * @returns {number}
     */
    Stepper.prototype.getPosition = function() {
        return this._stepPos;
    };

    // ── 내부 메서드 ──────────────────────────────────────────────────────────

    /**
     * 컴포넌트를 반환합니다. 아직 찾지 못한 경우 다시 탐색합니다.
     * @private
     * @returns {object|null}
     */
    Stepper.prototype._getComponent = function() {
        if (!this._comp) {
            this._comp = this._findComponent();
        }
        return this._comp;
    };

    /**
     * circuit에서 핀이 일치하는 Stepper_28BYJ48 컴포넌트를 찾습니다.
     * IN1~IN4 핀 중 하나라도 일치하면 해당 컴포넌트를 반환합니다.
     * 일치하는 게 없으면 첫 번째 스테퍼 컴포넌트를 반환합니다.
     * @private
     * @returns {object|null}
     */
    Stepper.prototype._findComponent = function() {
        var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return null;

        var comps    = circuit.getAllComponents();
        var pins     = [this._pin1, this._pin2, this._pin3, this._pin4];
        var fallback = null;

        for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            var isStepper = (comp.type === 'Stepper_28BYJ48' ||
                             comp.type === 'Stepper'          ||
                             comp.type === 'StepperMotor');
            if (!isStepper) continue;

            var conns      = comp.connections || {};
            var connValues = Object.values ? Object.values(conns) : _objectValues(conns);

            // IN1~IN4 또는 STEP/DIR 핀 매칭
            var matched = false;
            for (var j = 0; j < pins.length; j++) {
                if (pins[j] >= 0) {
                    for (var k = 0; k < connValues.length; k++) {
                        if (connValues[k] === pins[j]) { matched = true; break; }
                    }
                }
                if (matched) break;
            }

            if (matched) return comp;
            if (!fallback) fallback = comp;
        }
        return fallback;
    };

    /**
     * Object.values 폴리필 (IE 호환)
     * @private
     */
    function _objectValues(obj) {
        var vals = [];
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                vals.push(obj[key]);
            }
        }
        return vals;
    }

    // ── 전역 노출 ────────────────────────────────────────────────────────────

    global.StepperLib = {
        Stepper: Stepper,
        /** app.js _buildGlobals()에서 호출: new Stepper(...) 생성자 반환 */
        create: Stepper
    };

    // 트랜스파일된 코드에서 직접 new Stepper(...) 가 동작하도록
    global.Stepper = Stepper;

})(typeof window !== 'undefined' ? window : this);
