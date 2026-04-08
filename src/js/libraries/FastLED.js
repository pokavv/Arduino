/**
 * @file FastLED.js
 * @brief FastLED 및 Adafruit NeoPixel 라이브러리 시뮬레이션
 *
 * FastLED / Adafruit_NeoPixel 라이브러리의 API를 에뮬레이션합니다.
 * circuit editor의 RGB_WS2812B_Strip / RGB_WS2812B 컴포넌트와 연동합니다.
 *
 * FastLED 사용법 (Arduino):
 *   #include <FastLED.h>
 *   CRGB leds[NUM_LEDS];
 *   FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
 *   leds[0] = CRGB::Red;
 *   FastLED.show();
 *
 * Adafruit NeoPixel 사용법 (Arduino):
 *   #include <Adafruit_NeoPixel.h>
 *   Adafruit_NeoPixel strip(NUM_LEDS, DATA_PIN, NEO_GRB + NEO_KHZ800);
 *   strip.begin();
 *   strip.setPixelColor(0, strip.Color(255, 0, 0));
 *   strip.show();
 *
 * 시뮬레이션 방식:
 *   - DATA 핀이 일치하는 RGB_WS2812B_Strip 또는 RGB_WS2812B 컴포넌트를 찾습니다.
 *   - Strip 컴포넌트: setPixels([ {r,g,b}, ... ]) 메서드로 전체 LEDs를 업데이트합니다.
 *   - 단일 LED 컴포넌트: setColor(r, g, b) 메서드로 색상을 업데이트합니다.
 */

(function(global) {
    'use strict';

    // ── NeoPixel 타입 상수 ────────────────────────────────────────────────────
    var NEO_RGB     = 0;
    var NEO_RBG     = 1;
    var NEO_GRB     = 6;
    var NEO_GBR     = 4;
    var NEO_BRG     = 3;
    var NEO_BGR     = 2;
    var NEO_KHZ800  = 0x0200;
    var NEO_KHZ400  = 0x0100;

    // ── LED 타입 상수 (FastLED) ───────────────────────────────────────────────
    var WS2812  = 'WS2812';
    var WS2812B = 'WS2812B';
    var WS2811  = 'WS2811';
    var SK6812  = 'SK6812';
    var NEOPIXEL = 'NEOPIXEL';

    // ── 색상 순서 상수 (FastLED) ─────────────────────────────────────────────
    var GRB = 'GRB';
    var RGB = 'RGB';
    var BGR = 'BGR';

    // ─────────────────────────────────────────────────────────────────────────
    // CRGB 클래스
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * CRGB — FastLED의 RGB 색상 표현 클래스
     * @param {number} r - 빨강 (0~255)
     * @param {number} g - 초록 (0~255)
     * @param {number} b - 파랑 (0~255)
     */
    function CRGB(r, g, b) {
        if (typeof r === 'number' && g === undefined) {
            // 32비트 팩 색상 (0xRRGGBB)
            this.r = (r >> 16) & 0xFF;
            this.g = (r >> 8)  & 0xFF;
            this.b =  r        & 0xFF;
        } else {
            this.r = _clamp(r || 0);
            this.g = _clamp(g || 0);
            this.b = _clamp(b || 0);
        }
    }

    /**
     * 두 CRGB 색상의 덧셈.
     * @param {CRGB} other
     * @returns {CRGB}
     */
    CRGB.prototype.addToRGB = function(other) {
        this.r = _clamp(this.r + other.r);
        this.g = _clamp(this.g + other.g);
        this.b = _clamp(this.b + other.b);
        return this;
    };

    /**
     * 스케일(0~255) 적용.
     * @param {number} scale
     * @returns {CRGB}
     */
    CRGB.prototype.scale8 = function(scale) {
        this.r = Math.round(this.r * scale / 255);
        this.g = Math.round(this.g * scale / 255);
        this.b = Math.round(this.b * scale / 255);
        return this;
    };

    // ── CRGB 정적 색상 상수 ───────────────────────────────────────────────────
    CRGB.Red          = new CRGB(255, 0,   0);
    CRGB.Green        = new CRGB(0,   128, 0);
    CRGB.Blue         = new CRGB(0,   0,   255);
    CRGB.White        = new CRGB(255, 255, 255);
    CRGB.Black        = new CRGB(0,   0,   0);
    CRGB.Yellow       = new CRGB(255, 255, 0);
    CRGB.Cyan         = new CRGB(0,   255, 255);
    CRGB.Magenta      = new CRGB(255, 0,   255);
    CRGB.Orange       = new CRGB(255, 165, 0);
    CRGB.Purple       = new CRGB(128, 0,   128);
    CRGB.Pink         = new CRGB(255, 192, 203);
    CRGB.Lime         = new CRGB(0,   255, 0);
    CRGB.Teal         = new CRGB(0,   128, 128);
    CRGB.Indigo       = new CRGB(75,  0,   130);
    CRGB.Violet       = new CRGB(238, 130, 238);
    CRGB.Gold         = new CRGB(255, 215, 0);
    CRGB.DarkRed      = new CRGB(139, 0,   0);
    CRGB.DarkGreen    = new CRGB(0,   100, 0);
    CRGB.DarkBlue     = new CRGB(0,   0,   139);
    CRGB.DeepPink     = new CRGB(255, 20,  147);
    CRGB.Aqua         = new CRGB(0,   255, 255);
    CRGB.Coral        = new CRGB(255, 127, 80);
    CRGB.Salmon       = new CRGB(250, 128, 114);
    CRGB.HotPink      = new CRGB(255, 105, 180);
    CRGB.LightBlue    = new CRGB(173, 216, 230);
    CRGB.LightGreen   = new CRGB(144, 238, 144);
    CRGB.LightPink    = new CRGB(255, 182, 193);
    CRGB.LightYellow  = new CRGB(255, 255, 224);
    CRGB.SkyBlue      = new CRGB(135, 206, 235);
    CRGB.Snow         = new CRGB(255, 250, 250);
    CRGB.Seashell     = new CRGB(255, 245, 238);
    CRGB.FairyLight   = new CRGB(255, 244, 176);
    CRGB.HTMLColorCode = {};

    // ─────────────────────────────────────────────────────────────────────────
    // FastLED 싱글톤 객체
    // ─────────────────────────────────────────────────────────────────────────

    var FastLED = (function() {
        /** 등록된 LED 스트립 정보 목록 */
        var _strips = [];

        /** 전역 밝기 (0~255) */
        var _brightness = 255;

        /**
         * LED 스트립을 등록합니다.
         * 트랜스파일 시 addLeds<WS2812B, PIN, GRB>(leds, numLeds) 형태로 호출됩니다.
         * @param {CRGB[]} leds    - LED 색상 배열
         * @param {number} numLeds - LED 개수
         * @param {number} pin     - DATA 핀 GPIO 번호
         * @returns {object} FastLED (메서드 체이닝용)
         */
        function addLeds(leds, numLeds, pin) {
            // 이미 등록된 같은 배열 참조가 있으면 업데이트
            for (var i = 0; i < _strips.length; i++) {
                if (_strips[i].leds === leds) {
                    _strips[i].numLeds = numLeds || leds.length;
                    if (pin !== undefined) _strips[i].pin = parseInt(pin, 10);
                    return FastLED;
                }
            }
            _strips.push({
                leds:    leds,
                numLeds: numLeds || leds.length,
                pin:     pin !== undefined ? parseInt(pin, 10) : -1,
                comp:    null
            });
            return FastLED;
        }

        /**
         * 모든 등록된 스트립을 컴포넌트에 반영합니다.
         */
        function show() {
            for (var i = 0; i < _strips.length; i++) {
                _applyStrip(_strips[i]);
            }
        }

        /**
         * 전역 밝기를 설정합니다.
         * @param {number} val - 0~255
         */
        function setBrightness(val) {
            _brightness = _clamp(val);
        }

        /**
         * 전역 밝기를 반환합니다.
         * @returns {number}
         */
        function getBrightness() {
            return _brightness;
        }

        /**
         * 모든 LED를 끕니다 (show()는 별도 호출 필요).
         */
        function clear() {
            for (var i = 0; i < _strips.length; i++) {
                var strip = _strips[i];
                for (var j = 0; j < strip.leds.length; j++) {
                    strip.leds[j] = new CRGB(0, 0, 0);
                }
            }
        }

        /**
         * 배열 전체를 단색으로 채웁니다.
         * @param {CRGB[]} leds
         * @param {number} numLeds
         * @param {CRGB}   color
         */
        function fill_solid(leds, numLeds, color) {
            var n = numLeds !== undefined ? numLeds : leds.length;
            for (var i = 0; i < n; i++) {
                leds[i] = new CRGB(color.r, color.g, color.b);
            }
        }

        /**
         * 무지개 색으로 배열을 채웁니다.
         * @param {CRGB[]} leds
         * @param {number} numLeds
         * @param {number} [initialHue=0]  - 시작 색조 (0~255)
         * @param {number} [deltaHue=5]    - 픽셀 간 색조 증가량
         */
        function fill_rainbow(leds, numLeds, initialHue, deltaHue) {
            var n     = numLeds !== undefined ? numLeds : leds.length;
            var hue   = initialHue !== undefined ? initialHue : 0;
            var delta = deltaHue   !== undefined ? deltaHue   : Math.floor(256 / n);

            for (var i = 0; i < n; i++) {
                var rgb = _hsv2rgb((hue & 0xFF) / 255.0, 1.0, 1.0);
                leds[i] = new CRGB(rgb.r, rgb.g, rgb.b);
                hue += delta;
            }
        }

        /**
         * 그라데이션 색으로 배열을 채웁니다 (단순 구현).
         * @param {CRGB[]} leds
         * @param {number} numLeds
         * @param {CRGB}   startColor
         * @param {CRGB}   endColor
         */
        function fill_gradient_RGB(leds, numLeds, startColor, endColor) {
            var n = numLeds !== undefined ? numLeds : leds.length;
            for (var i = 0; i < n; i++) {
                var t = n > 1 ? i / (n - 1) : 0;
                leds[i] = new CRGB(
                    Math.round(startColor.r + (endColor.r - startColor.r) * t),
                    Math.round(startColor.g + (endColor.g - startColor.g) * t),
                    Math.round(startColor.b + (endColor.b - startColor.b) * t)
                );
            }
        }

        /**
         * 딜레이 (에뮬레이션: noop)
         * @param {number} ms
         */
        function delay(ms) {
            // 에뮬레이션: noop (실제 delay는 runtime에서 처리)
        }

        /** @private 스트립 1개를 circuit 컴포넌트에 반영 */
        function _applyStrip(strip) {
            if (!strip.comp) {
                strip.comp = _findStripComponent(strip.pin);
            }
            if (!strip.comp) return;

            var comp    = strip.comp;
            var leds    = strip.leds;
            var numLeds = strip.numLeds;
            var scale   = _brightness / 255.0;

            // RGB_WS2812B_Strip: setPixels([{r,g,b}, ...])
            if (typeof comp.setPixels === 'function') {
                var pixels = [];
                for (var i = 0; i < numLeds; i++) {
                    var led = leds[i] || { r: 0, g: 0, b: 0 };
                    pixels.push({
                        r: Math.round((led.r || 0) * scale),
                        g: Math.round((led.g || 0) * scale),
                        b: Math.round((led.b || 0) * scale)
                    });
                }
                comp.setPixels(pixels);
            }
            // 단일 RGB_WS2812B: setColor(r, g, b) — 첫 번째 픽셀만 사용
            else if (typeof comp.setColor === 'function') {
                var first = leds[0] || { r: 0, g: 0, b: 0 };
                comp.setColor(
                    Math.round((first.r || 0) * scale),
                    Math.round((first.g || 0) * scale),
                    Math.round((first.b || 0) * scale)
                );
            }
        }

        /** @private DATA 핀이 일치하는 WS2812B 컴포넌트 탐색 */
        function _findStripComponent(pin) {
            var _pm = (typeof global !== 'undefined' && global._pinNumMatch) ||
                function(v, n) { if (v === n) return true; if (typeof v === 'string') { var x = parseInt(v.replace(/^[A-Za-z]+/, ''), 10); return !isNaN(x) && x === n; } return false; };
            var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
            if (!circuit || typeof circuit.getAllComponents !== 'function') return null;

            var comps    = circuit.getAllComponents();
            var fallback = null;

            for (var i = 0; i < comps.length; i++) {
                var comp = comps[i];
                var isStrip = (comp.type === 'RGB_WS2812B_Strip' ||
                               comp.type === 'RGB_WS2812B'        ||
                               comp.type === 'WS2812B_Strip'      ||
                               comp.type === 'WS2812B');
                if (!isStrip) continue;

                var conns = comp.connections || {};
                if (_pm(conns['DATA'], pin) || _pm(conns['DIN'], pin) ||
                    _pm(conns['IN'],   pin) || _pm(conns['DO'],  pin)) {
                    return comp;
                }
                if (!fallback) fallback = comp;
            }
            return fallback;
        }

        // 공개 인터페이스
        return {
            addLeds:           addLeds,
            show:              show,
            setBrightness:     setBrightness,
            getBrightness:     getBrightness,
            clear:             clear,
            fill_solid:        fill_solid,
            fill_rainbow:      fill_rainbow,
            fill_gradient_RGB: fill_gradient_RGB,
            delay:             delay,
            /** 내부 strips 배열 (디버깅용) */
            _strips: _strips
        };
    })();

    // ─────────────────────────────────────────────────────────────────────────
    // Adafruit_NeoPixel 클래스
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Adafruit_NeoPixel 클래스 — Adafruit NeoPixel 라이브러리 에뮬레이션
     * @param {number} numLeds - LED 개수
     * @param {number} pin     - DATA 핀 GPIO 번호
     * @param {number} [type]  - LED 타입 (NEO_GRB + NEO_KHZ800 등)
     */
    function Adafruit_NeoPixel(numLeds, pin, type) {
        /** LED 개수 */
        this._numLeds = parseInt(numLeds, 10) || 1;

        /** DATA 핀 GPIO 번호 */
        this._pin = parseInt(pin, 10);

        /** LED 타입 플래그 */
        this._type = type !== undefined ? type : (NEO_GRB + NEO_KHZ800);

        /** 픽셀 색상 버퍼 [{r,g,b}, ...] */
        this._pixels = [];
        for (var i = 0; i < this._numLeds; i++) {
            this._pixels.push({ r: 0, g: 0, b: 0 });
        }

        /** 밝기 (0~255) */
        this._brightness = 255;

        /** 연결된 circuit 컴포넌트 참조 (lazy 탐색) */
        this._comp = null;
    }

    /**
     * 스트립을 초기화합니다. setup()에서 호출합니다.
     */
    Adafruit_NeoPixel.prototype.begin = function() {
        this._comp = this._findComponent();
        if (this._comp) {
            console.log('[NeoPixel] 핀 ' + this._pin + ' → 컴포넌트 ' + this._comp.id + ' 연결');
        } else {
            console.log('[NeoPixel] 핀 ' + this._pin + ' WS2812B 컴포넌트 없음');
        }
    };

    /**
     * 픽셀 데이터를 하드웨어(컴포넌트)에 전송합니다.
     */
    Adafruit_NeoPixel.prototype.show = function() {
        var comp = this._getComponent();
        if (!comp) return;

        var scale = this._brightness / 255.0;

        if (typeof comp.setPixels === 'function') {
            var pixels = [];
            for (var i = 0; i < this._numLeds; i++) {
                var p = this._pixels[i] || { r: 0, g: 0, b: 0 };
                pixels.push({
                    r: Math.round(p.r * scale),
                    g: Math.round(p.g * scale),
                    b: Math.round(p.b * scale)
                });
            }
            comp.setPixels(pixels);
        } else if (typeof comp.setColor === 'function') {
            var first = this._pixels[0] || { r: 0, g: 0, b: 0 };
            comp.setColor(
                Math.round(first.r * scale),
                Math.round(first.g * scale),
                Math.round(first.b * scale)
            );
        }
    };

    /**
     * 단일 픽셀의 색상을 설정합니다.
     * setPixelColor(idx, r, g, b) 또는 setPixelColor(idx, color) 형태로 호출합니다.
     * @param {number} idx
     * @param {number} r_or_color - r값 또는 Color()로 팩된 색상
     * @param {number} [g]
     * @param {number} [b]
     */
    Adafruit_NeoPixel.prototype.setPixelColor = function(idx, r_or_color, g, b) {
        if (idx < 0 || idx >= this._numLeds) return;

        if (g === undefined) {
            // 팩된 색상 (32비트)
            var packed = r_or_color >>> 0;
            this._pixels[idx] = {
                r: (packed >> 16) & 0xFF,
                g: (packed >> 8)  & 0xFF,
                b:  packed        & 0xFF
            };
        } else {
            this._pixels[idx] = {
                r: _clamp(r_or_color || 0),
                g: _clamp(g || 0),
                b: _clamp(b || 0)
            };
        }
    };

    /**
     * 픽셀의 현재 색상을 팩된 32비트 값으로 반환합니다.
     * @param {number} idx
     * @returns {number}
     */
    Adafruit_NeoPixel.prototype.getPixelColor = function(idx) {
        if (idx < 0 || idx >= this._numLeds) return 0;
        var p = this._pixels[idx];
        return ((p.r & 0xFF) << 16) | ((p.g & 0xFF) << 8) | (p.b & 0xFF);
    };

    /**
     * RGB를 팩된 32비트 색상 값으로 변환합니다.
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @returns {number}
     */
    Adafruit_NeoPixel.prototype.Color = function(r, g, b) {
        return ((_clamp(r) & 0xFF) << 16) |
               ((_clamp(g) & 0xFF) << 8)  |
                (_clamp(b) & 0xFF);
    };

    /**
     * 지정 범위를 색상으로 채웁니다.
     * @param {number} color - 팩된 32비트 색상
     * @param {number} [first=0]  - 시작 인덱스
     * @param {number} [count]    - 채울 개수 (기본: 전체)
     */
    Adafruit_NeoPixel.prototype.fill = function(color, first, count) {
        var start = first !== undefined ? Math.max(0, first) : 0;
        var end   = count !== undefined
            ? Math.min(start + count, this._numLeds)
            : this._numLeds;

        var r = (color >> 16) & 0xFF;
        var g = (color >> 8)  & 0xFF;
        var b =  color        & 0xFF;

        for (var i = start; i < end; i++) {
            this._pixels[i] = { r: r, g: g, b: b };
        }
    };

    /**
     * 모든 픽셀을 끕니다 (show()는 별도 호출 필요).
     */
    Adafruit_NeoPixel.prototype.clear = function() {
        for (var i = 0; i < this._numLeds; i++) {
            this._pixels[i] = { r: 0, g: 0, b: 0 };
        }
    };

    /**
     * 밝기를 설정합니다.
     * @param {number} val - 0~255
     */
    Adafruit_NeoPixel.prototype.setBrightness = function(val) {
        this._brightness = _clamp(val);
    };

    /**
     * 현재 밝기를 반환합니다.
     * @returns {number}
     */
    Adafruit_NeoPixel.prototype.getBrightness = function() {
        return this._brightness;
    };

    /**
     * LED 개수를 반환합니다.
     * @returns {number}
     */
    Adafruit_NeoPixel.prototype.numPixels = function() {
        return this._numLeds;
    };

    /**
     * 색조(hue, 0~65535)를 팩된 32비트 색상으로 변환합니다.
     * @param {number} hue  - 0~65535
     * @param {number} [sat=255]
     * @param {number} [val=255]
     * @returns {number}
     */
    Adafruit_NeoPixel.prototype.ColorHSV = function(hue, sat, val) {
        sat = sat !== undefined ? sat : 255;
        val = val !== undefined ? val : 255;
        var rgb = _hsv2rgb(hue / 65535.0, sat / 255.0, val / 255.0);
        return this.Color(rgb.r, rgb.g, rgb.b);
    };

    /**
     * 팩된 32비트 gamma 보정된 색상으로 변환합니다.
     * @param {number} x
     * @returns {number}
     */
    Adafruit_NeoPixel.prototype.gamma32 = function(x) {
        // 간단한 감마 2.6 보정
        var r = Math.round(Math.pow(((x >> 16) & 0xFF) / 255.0, 2.6) * 255);
        var g = Math.round(Math.pow(((x >> 8)  & 0xFF) / 255.0, 2.6) * 255);
        var b = Math.round(Math.pow(( x        & 0xFF) / 255.0, 2.6) * 255);
        return this.Color(r, g, b);
    };

    // ── 내부 메서드 ──────────────────────────────────────────────────────────

    Adafruit_NeoPixel.prototype._getComponent = function() {
        if (!this._comp) {
            this._comp = this._findComponent();
        }
        return this._comp;
    };

    Adafruit_NeoPixel.prototype._findComponent = function() {
        var _pm = (typeof global !== 'undefined' && global._pinNumMatch) ||
            function(v, n) { if (v === n) return true; if (typeof v === 'string') { var x = parseInt(v.replace(/^[A-Za-z]+/, ''), 10); return !isNaN(x) && x === n; } return false; };
        var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return null;

        var comps    = circuit.getAllComponents();
        var pin      = this._pin;
        var fallback = null;

        for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            var isStrip = (comp.type === 'RGB_WS2812B_Strip' ||
                           comp.type === 'RGB_WS2812B'        ||
                           comp.type === 'WS2812B_Strip'      ||
                           comp.type === 'WS2812B');
            if (!isStrip) continue;

            var conns = comp.connections || {};
            if (_pm(conns['DATA'], pin) || _pm(conns['DIN'], pin) ||
                _pm(conns['IN'],   pin) || _pm(conns['DO'],  pin)) {
                return comp;
            }
            if (!fallback) fallback = comp;
        }
        return fallback;
    };

    // ── 공용 내부 유틸리티 ────────────────────────────────────────────────────

    /**
     * 0~255 범위로 정수를 제한합니다.
     * @private
     */
    function _clamp(v) {
        var n = parseInt(v, 10);
        if (isNaN(n)) return 0;
        return n < 0 ? 0 : n > 255 ? 255 : n;
    }

    /**
     * HSV → RGB 변환
     * @private
     * @param {number} h - 0.0~1.0
     * @param {number} s - 0.0~1.0
     * @param {number} v - 0.0~1.0
     * @returns {{r:number,g:number,b:number}}
     */
    function _hsv2rgb(h, s, v) {
        var r, g, b;
        var i = Math.floor(h * 6);
        var f = h * 6 - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
            default: r = 0; g = 0; b = 0;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    // ── 전역 노출 ────────────────────────────────────────────────────────────

    global.FastLEDLib = {
        FastLED:          FastLED,
        CRGB:             CRGB,
        Adafruit_NeoPixel: Adafruit_NeoPixel,
        // LED 타입 상수
        WS2812:           WS2812,
        WS2812B:          WS2812B,
        WS2811:           WS2811,
        SK6812:           SK6812,
        NEOPIXEL:         NEOPIXEL,
        // 색상 순서
        GRB:              GRB,
        RGB:              RGB,
        BGR:              BGR,
        // NeoPixel 타입
        NEO_RGB:          NEO_RGB,
        NEO_RBG:          NEO_RBG,
        NEO_GRB:          NEO_GRB,
        NEO_GBR:          NEO_GBR,
        NEO_BRG:          NEO_BRG,
        NEO_BGR:          NEO_BGR,
        NEO_KHZ800:       NEO_KHZ800,
        NEO_KHZ400:       NEO_KHZ400
    };

    // 트랜스파일된 코드에서 직접 FastLED.xxx, new CRGB(), new Adafruit_NeoPixel() 이 동작하도록
    global.FastLED           = FastLED;
    global.CRGB              = CRGB;
    global.Adafruit_NeoPixel = Adafruit_NeoPixel;

    // LED 타입 상수
    global.WS2812   = WS2812;
    global.WS2812B  = WS2812B;
    global.WS2811   = WS2811;
    global.SK6812   = SK6812;
    global.NEOPIXEL = NEOPIXEL;
    global.GRB      = GRB;
    global.RGB      = RGB;
    global.BGR      = BGR;

    // NeoPixel 타입 상수
    global.NEO_RGB    = NEO_RGB;
    global.NEO_RBG    = NEO_RBG;
    global.NEO_GRB    = NEO_GRB;
    global.NEO_GBR    = NEO_GBR;
    global.NEO_BRG    = NEO_BRG;
    global.NEO_BGR    = NEO_BGR;
    global.NEO_KHZ800 = NEO_KHZ800;
    global.NEO_KHZ400 = NEO_KHZ400;

})(typeof window !== 'undefined' ? window : this);
