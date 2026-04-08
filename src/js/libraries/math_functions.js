/**
 * @file math_functions.js
 * @brief Arduino 추가 수학/유틸 함수 모음
 *
 * 트랜스파일러에서 자동 변환되지 않는 Arduino 수학 함수들을 제공합니다.
 * window.ArduinoMath 으로 노출합니다.
 *
 * 포함 함수:
 *   sq(x)          - x의 제곱 (x*x)
 *   cb(x)          - x의 세제곱 (x*x*x)
 *   abs2(x)        - abs와 동일 (오버로드 충돌 방지용)
 *   min3(a,b,c)    - 세 값 중 최솟값
 *   max3(a,b,c)    - 세 값 중 최댓값
 *   degrees(rad)   - 라디안 → 도 변환
 *   radians(deg)   - 도 → 라디안 변환
 *   hypot(x,y)     - 빗변 길이 (√(x²+y²))
 *   isnan(x)       - NaN 여부
 *   isinf(x)       - 무한대 여부
 *   sign(x)        - 부호 (-1, 0, 1)
 *   truncate(x)    - 소수점 이하 버림 (정수 방향으로)
 *   fmod(x,y)      - 부동소수점 나머지 (C fmod 에뮬레이션)
 *   bitCount(x)    - 1비트 개수 (popcount)
 *   crc8(data,len) - CRC-8 체크섬
 *   lerp(a,b,t)    - 선형 보간
 *   clamp(x,lo,hi) - 범위 제한 (constrain 별칭)
 *
 * 제외 (runtime.js에 이미 있음):
 *   constrain, map, min, max, abs, random
 */

(function(global) {
    'use strict';

    // ── 제곱/세제곱 ───────────────────────────────────────────────────────────

    /**
     * x의 제곱을 반환합니다.
     * Arduino: sq(x) → x*x
     * @param {number} x
     * @returns {number}
     */
    function sq(x) {
        return x * x;
    }

    /**
     * x의 세제곱을 반환합니다.
     * @param {number} x
     * @returns {number}
     */
    function cb(x) {
        return x * x * x;
    }

    /**
     * 절댓값을 반환합니다 (abs와 동일, 오버로드 충돌 방지용 별칭).
     * @param {number} x
     * @returns {number}
     */
    function abs2(x) {
        return x < 0 ? -x : x;
    }

    // ── 다중 인자 min/max ─────────────────────────────────────────────────────

    /**
     * 세 값 중 최솟값을 반환합니다.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @returns {number}
     */
    function min3(a, b, c) {
        return Math.min(a, Math.min(b, c));
    }

    /**
     * 세 값 중 최댓값을 반환합니다.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @returns {number}
     */
    function max3(a, b, c) {
        return Math.max(a, Math.max(b, c));
    }

    // ── 각도 변환 ─────────────────────────────────────────────────────────────

    /**
     * 라디안을 도(degree)로 변환합니다.
     * Arduino: degrees(rad)
     * @param {number} rad - 라디안 값
     * @returns {number} 도 값
     */
    function degrees(rad) {
        return rad * (180.0 / Math.PI);
    }

    /**
     * 도(degree)를 라디안으로 변환합니다.
     * Arduino: radians(deg)
     * @param {number} deg - 도 값
     * @returns {number} 라디안 값
     */
    function radians(deg) {
        return deg * (Math.PI / 180.0);
    }

    // ── 기하 ──────────────────────────────────────────────────────────────────

    /**
     * 직각삼각형의 빗변을 계산합니다 (√(x²+y²)).
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    function hypot2(x, y) {
        return Math.sqrt(x * x + y * y);
    }

    // ── 판별 함수 ─────────────────────────────────────────────────────────────

    /**
     * NaN 여부를 반환합니다.
     * @param {number} x
     * @returns {boolean}
     */
    function isnan(x) {
        return isNaN(x);
    }

    /**
     * 무한대 여부를 반환합니다.
     * @param {number} x
     * @returns {boolean}
     */
    function isinf(x) {
        return !isFinite(x) && !isNaN(x);
    }

    // ── 부호 ──────────────────────────────────────────────────────────────────

    /**
     * 값의 부호를 반환합니다.
     * @param {number} x
     * @returns {number} -1, 0, 또는 1
     */
    function sign(x) {
        if (x > 0) return 1;
        if (x < 0) return -1;
        return 0;
    }

    // ── 소수점 처리 ───────────────────────────────────────────────────────────

    /**
     * 소수점 이하를 0 방향으로 버립니다 (C truncate).
     * @param {number} x
     * @returns {number}
     */
    function truncate(x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }

    /**
     * 부동소수점 나머지를 반환합니다 (C fmod 에뮬레이션).
     * fmod(x, y) = x - trunc(x/y)*y
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    function fmod(x, y) {
        if (y === 0) return NaN;
        return x - truncate(x / y) * y;
    }

    // ── 비트 연산 ─────────────────────────────────────────────────────────────

    /**
     * 정수에서 1인 비트 수를 셉니다 (popcount).
     * @param {number} x - 32비트 정수
     * @returns {number} 1비트 개수
     */
    function bitCount(x) {
        x = (x >>> 0); // 32비트 부호없는 정수로
        x -= (x >> 1) & 0x55555555;
        x  = (x & 0x33333333) + ((x >> 2) & 0x33333333);
        x  = (x + (x >> 4)) & 0x0F0F0F0F;
        return (x * 0x01010101) >>> 24;
    }

    // ── 체크섬 ────────────────────────────────────────────────────────────────

    /**
     * CRC-8 체크섬을 계산합니다.
     * 폴리노미얼: 0x07 (CRC-8/SMBUS)
     * @param {number[]|Uint8Array} data - 바이트 배열
     * @param {number} [len]             - 길이 (기본: 배열 전체)
     * @returns {number} 0~255
     */
    function crc8(data, len) {
        var crc = 0x00;
        var n   = (len !== undefined) ? len : data.length;
        for (var i = 0; i < n; i++) {
            crc ^= data[i] & 0xFF;
            for (var j = 0; j < 8; j++) {
                if (crc & 0x80) {
                    crc = ((crc << 1) ^ 0x07) & 0xFF;
                } else {
                    crc = (crc << 1) & 0xFF;
                }
            }
        }
        return crc;
    }

    /**
     * CRC-16/CCITT 체크섬을 계산합니다.
     * @param {number[]|Uint8Array} data
     * @param {number} [len]
     * @returns {number} 0~65535
     */
    function crc16(data, len) {
        var crc = 0xFFFF;
        var n   = (len !== undefined) ? len : data.length;
        for (var i = 0; i < n; i++) {
            crc ^= (data[i] & 0xFF) << 8;
            for (var j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }
        return crc;
    }

    // ── 보간 ──────────────────────────────────────────────────────────────────

    /**
     * 두 값을 선형 보간합니다.
     * @param {number} a - 시작 값
     * @param {number} b - 끝 값
     * @param {number} t - 보간 계수 (0.0 ~ 1.0)
     * @returns {number}
     */
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * 값을 범위로 제한합니다 (constrain의 별칭).
     * @param {number} x  - 입력 값
     * @param {number} lo - 최솟값
     * @param {number} hi - 최댓값
     * @returns {number}
     */
    function clamp(x, lo, hi) {
        return Math.min(Math.max(x, lo), hi);
    }

    // ── 반올림 변형 ───────────────────────────────────────────────────────────

    /**
     * x를 step의 배수로 반올림합니다.
     * @param {number} x    - 값
     * @param {number} step - 배수 단위
     * @returns {number}
     */
    function roundTo(x, step) {
        if (step === 0) return x;
        return Math.round(x / step) * step;
    }

    /**
     * 숫자를 고정 소수점 문자열로 변환합니다.
     * Arduino: dtostrf(val, width, prec, buf) 에뮬레이션
     * @param {number} val   - 값
     * @param {number} width - 최소 너비 (공백 패딩)
     * @param {number} prec  - 소수점 이하 자릿수
     * @returns {string}
     */
    function dtostrf(val, width, prec) {
        var str = val.toFixed(prec);
        while (str.length < width) str = ' ' + str;
        return str;
    }

    /**
     * 비트 거울 반전 (8비트).
     * @param {number} b - 0~255
     * @returns {number}
     */
    function reverseByte(b) {
        b = (b & 0xF0) >> 4 | (b & 0x0F) << 4;
        b = (b & 0xCC) >> 2 | (b & 0x33) << 2;
        b = (b & 0xAA) >> 1 | (b & 0x55) << 1;
        return b & 0xFF;
    }

    // ── ArduinoMath 노출 ──────────────────────────────────────────────────────

    var ArduinoMath = {
        // 제곱/세제곱
        sq:         sq,
        cb:         cb,
        abs2:       abs2,

        // 다중 인자
        min3:       min3,
        max3:       max3,

        // 각도 변환
        degrees:    degrees,
        radians:    radians,

        // 기하
        hypot2:     hypot2,

        // 판별
        isnan:      isnan,
        isinf:      isinf,

        // 부호
        sign:       sign,

        // 소수점
        truncate:   truncate,
        fmod:       fmod,

        // 비트
        bitCount:   bitCount,
        reverseByte: reverseByte,

        // 체크섬
        crc8:       crc8,
        crc16:      crc16,

        // 보간
        lerp:       lerp,
        clamp:      clamp,
        roundTo:    roundTo,

        // 포맷
        dtostrf:    dtostrf,
    };

    global.ArduinoMath = ArduinoMath;

    // 트랜스파일된 코드에서 직접 호출 가능하도록 개별 등록
    global.sq          = sq;
    global.cb          = cb;
    global.abs2        = abs2;
    global.min3        = min3;
    global.max3        = max3;
    global.degrees     = degrees;
    global.radians     = radians;
    global.hypot2      = hypot2;
    global.isnan       = isnan;
    global.isinf       = isinf;
    global.sign        = sign;
    global.truncate    = truncate;
    global.fmod        = fmod;
    global.bitCount    = bitCount;
    global.reverseByte = reverseByte;
    global.crc8        = crc8;
    global.crc16       = crc16;
    global.lerp        = lerp;
    global.clamp       = clamp;
    global.roundTo     = roundTo;
    global.dtostrf     = dtostrf;

})(typeof window !== 'undefined' ? window : this);
