/**
 * @file Adafruit_SSD1306.js
 * @brief Adafruit SSD1306 OLED 라이브러리 시뮬레이션
 *
 * Adafruit_SSD1306 라이브러리의 전체 API를 에뮬레이션합니다.
 * circuit editor의 OLED_SSD1306 컴포넌트 Canvas에 실제 렌더링합니다.
 *
 * 사용법 (Arduino):
 *   Adafruit_SSD1306 display(128, 64, &Wire);
 *   display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
 *   display.clearDisplay();
 *   display.setTextSize(1);
 *   display.setTextColor(WHITE);
 *   display.setCursor(0, 0);
 *   display.println("Hello World");
 *   display.display();
 *
 * 색상 상수: WHITE(1), BLACK(0), INVERSE(2)
 *
 * 렌더링:
 *   - display.display() 호출 시 픽셀 버퍼를 OLED_SSD1306 컴포넌트의 canvas에 반영
 *   - 선, 사각형, 원, 삼각형, 비트맵 그리기 지원
 */

(function(global) {
    'use strict';

    // ── 상수 ──────────────────────────────────────────────────────────────────
    var WHITE   = 1;
    var BLACK   = 0;
    var INVERSE = 2;

    var SSD1306_SWITCHCAPVCC = 0x02;
    var SSD1306_EXTERNALVCC  = 0x01;

    // 5×8 픽셀 ASCII 폰트 (코드 32~126)
    // 각 문자는 5컬럼 × 8행 비트맵 (5바이트)
    var FONT5X8 = (function() {
        var data = {
            32:  [0x00,0x00,0x00,0x00,0x00], // ' '
            33:  [0x00,0x00,0x5F,0x00,0x00], // '!'
            34:  [0x00,0x07,0x00,0x07,0x00], // '"'
            35:  [0x14,0x7F,0x14,0x7F,0x14], // '#'
            36:  [0x24,0x2A,0x7F,0x2A,0x12], // '$'
            37:  [0x23,0x13,0x08,0x64,0x62], // '%'
            38:  [0x36,0x49,0x55,0x22,0x50], // '&'
            39:  [0x00,0x05,0x03,0x00,0x00], // '\''
            40:  [0x00,0x1C,0x22,0x41,0x00], // '('
            41:  [0x00,0x41,0x22,0x1C,0x00], // ')'
            42:  [0x08,0x2A,0x1C,0x2A,0x08], // '*'
            43:  [0x08,0x08,0x3E,0x08,0x08], // '+'
            44:  [0x00,0x50,0x30,0x00,0x00], // ','
            45:  [0x08,0x08,0x08,0x08,0x08], // '-'
            46:  [0x00,0x60,0x60,0x00,0x00], // '.'
            47:  [0x20,0x10,0x08,0x04,0x02], // '/'
            48:  [0x3E,0x51,0x49,0x45,0x3E], // '0'
            49:  [0x00,0x42,0x7F,0x40,0x00], // '1'
            50:  [0x42,0x61,0x51,0x49,0x46], // '2'
            51:  [0x21,0x41,0x45,0x4B,0x31], // '3'
            52:  [0x18,0x14,0x12,0x7F,0x10], // '4'
            53:  [0x27,0x45,0x45,0x45,0x39], // '5'
            54:  [0x3C,0x4A,0x49,0x49,0x30], // '6'
            55:  [0x01,0x71,0x09,0x05,0x03], // '7'
            56:  [0x36,0x49,0x49,0x49,0x36], // '8'
            57:  [0x06,0x49,0x49,0x29,0x1E], // '9'
            58:  [0x00,0x36,0x36,0x00,0x00], // ':'
            59:  [0x00,0x56,0x36,0x00,0x00], // ';'
            60:  [0x00,0x08,0x14,0x22,0x41], // '<'
            61:  [0x14,0x14,0x14,0x14,0x14], // '='
            62:  [0x41,0x22,0x14,0x08,0x00], // '>'
            63:  [0x02,0x01,0x51,0x09,0x06], // '?'
            64:  [0x32,0x49,0x79,0x41,0x3E], // '@'
            65:  [0x7E,0x11,0x11,0x11,0x7E], // 'A'
            66:  [0x7F,0x49,0x49,0x49,0x36], // 'B'
            67:  [0x3E,0x41,0x41,0x41,0x22], // 'C'
            68:  [0x7F,0x41,0x41,0x22,0x1C], // 'D'
            69:  [0x7F,0x49,0x49,0x49,0x41], // 'E'
            70:  [0x7F,0x09,0x09,0x09,0x01], // 'F'
            71:  [0x3E,0x41,0x41,0x49,0x7A], // 'G'
            72:  [0x7F,0x08,0x08,0x08,0x7F], // 'H'
            73:  [0x00,0x41,0x7F,0x41,0x00], // 'I'
            74:  [0x20,0x40,0x41,0x3F,0x01], // 'J'
            75:  [0x7F,0x08,0x14,0x22,0x41], // 'K'
            76:  [0x7F,0x40,0x40,0x40,0x40], // 'L'
            77:  [0x7F,0x02,0x04,0x02,0x7F], // 'M'
            78:  [0x7F,0x04,0x08,0x10,0x7F], // 'N'
            79:  [0x3E,0x41,0x41,0x41,0x3E], // 'O'
            80:  [0x7F,0x09,0x09,0x09,0x06], // 'P'
            81:  [0x3E,0x41,0x51,0x21,0x5E], // 'Q'
            82:  [0x7F,0x09,0x19,0x29,0x46], // 'R'
            83:  [0x46,0x49,0x49,0x49,0x31], // 'S'
            84:  [0x01,0x01,0x7F,0x01,0x01], // 'T'
            85:  [0x3F,0x40,0x40,0x40,0x3F], // 'U'
            86:  [0x1F,0x20,0x40,0x20,0x1F], // 'V'
            87:  [0x3F,0x40,0x38,0x40,0x3F], // 'W'
            88:  [0x63,0x14,0x08,0x14,0x63], // 'X'
            89:  [0x07,0x08,0x70,0x08,0x07], // 'Y'
            90:  [0x61,0x51,0x49,0x45,0x43], // 'Z'
            91:  [0x00,0x7F,0x41,0x41,0x00], // '['
            92:  [0x02,0x04,0x08,0x10,0x20], // '\'
            93:  [0x00,0x41,0x41,0x7F,0x00], // ']'
            94:  [0x04,0x02,0x01,0x02,0x04], // '^'
            95:  [0x40,0x40,0x40,0x40,0x40], // '_'
            96:  [0x00,0x01,0x02,0x04,0x00], // '`'
            97:  [0x20,0x54,0x54,0x54,0x78], // 'a'
            98:  [0x7F,0x48,0x44,0x44,0x38], // 'b'
            99:  [0x38,0x44,0x44,0x44,0x20], // 'c'
            100: [0x38,0x44,0x44,0x48,0x7F], // 'd'
            101: [0x38,0x54,0x54,0x54,0x18], // 'e'
            102: [0x08,0x7E,0x09,0x01,0x02], // 'f'
            103: [0x0C,0x52,0x52,0x52,0x3E], // 'g'
            104: [0x7F,0x08,0x04,0x04,0x78], // 'h'
            105: [0x00,0x44,0x7D,0x40,0x00], // 'i'
            106: [0x20,0x40,0x44,0x3D,0x00], // 'j'
            107: [0x7F,0x10,0x28,0x44,0x00], // 'k'
            108: [0x00,0x41,0x7F,0x40,0x00], // 'l'
            109: [0x7C,0x04,0x18,0x04,0x78], // 'm'
            110: [0x7C,0x08,0x04,0x04,0x78], // 'n'
            111: [0x38,0x44,0x44,0x44,0x38], // 'o'
            112: [0x7C,0x14,0x14,0x14,0x08], // 'p'
            113: [0x08,0x14,0x14,0x18,0x7C], // 'q'
            114: [0x7C,0x08,0x04,0x04,0x08], // 'r'
            115: [0x48,0x54,0x54,0x54,0x20], // 's'
            116: [0x04,0x3F,0x44,0x40,0x20], // 't'
            117: [0x3C,0x40,0x40,0x20,0x7C], // 'u'
            118: [0x1C,0x20,0x40,0x20,0x1C], // 'v'
            119: [0x3C,0x40,0x30,0x40,0x3C], // 'w'
            120: [0x44,0x28,0x10,0x28,0x44], // 'x'
            121: [0x0C,0x50,0x50,0x50,0x3C], // 'y'
            122: [0x44,0x64,0x54,0x4C,0x44], // 'z'
            123: [0x00,0x08,0x36,0x41,0x00], // '{'
            124: [0x00,0x00,0x7F,0x00,0x00], // '|'
            125: [0x00,0x41,0x36,0x08,0x00], // '}'
            126: [0x08,0x04,0x08,0x10,0x08], // '~'
        };
        return data;
    })();

    /**
     * Adafruit_SSD1306 클래스
     * @param {number} width  - 디스플레이 가로 픽셀 (기본: 128)
     * @param {number} height - 디스플레이 세로 픽셀 (기본: 64)
     * @param {object} [wire] - Wire 객체 참조 (무시, 자동 참조)
     * @param {number} [rstPin] - RESET 핀 (시뮬레이터 무시)
     */
    function Adafruit_SSD1306(width, height, wire, rstPin) {
        /** 디스플레이 크기 */
        this.width  = width  || 128;
        this.height = height || 64;

        /** 픽셀 버퍼: 0=off, 1=on */
        this._buffer = new Uint8Array(this.width * this.height);

        /** 커서 위치 (픽셀 단위) */
        this._cursorX = 0;
        this._cursorY = 0;

        /** 텍스트 크기 (1~4) */
        this._textSize = 1;

        /** 텍스트 색상 */
        this._textColor = WHITE;

        /** 텍스트 배경색 (-1: 투명) */
        this._textBgColor = BLACK;

        /** 자동 줄바꿈 */
        this._wrap = true;

        /** 연결된 OLED 컴포넌트 */
        this._comp = null;

        /** I2C 주소 */
        this._i2cAddr = 0x3C;

        /** 초기화 여부 */
        this._initialized = false;

        /** Wire 참조 */
        this._wire = wire || null;
    }

    /**
     * OLED를 초기화합니다.
     * @param {number} vccstate - SSD1306_SWITCHCAPVCC | SSD1306_EXTERNALVCC
     * @param {number} [addr=0x3C] - I2C 주소
     * @returns {boolean} 성공 여부
     */
    Adafruit_SSD1306.prototype.begin = function(vccstate, addr) {
        this._i2cAddr    = (addr !== undefined) ? (addr & 0x7F) : 0x3C;
        this._initialized = true;

        // circuit에서 OLED 컴포넌트 찾기
        this._comp = this._findOledComponent();
        if (this._comp) {
            console.log('[SSD1306] 0x' + this._i2cAddr.toString(16).toUpperCase() +
                        ' → 컴포넌트 ' + this._comp.id + ' 연결');
        } else {
            console.log('[SSD1306] 0x' + this._i2cAddr.toString(16).toUpperCase() +
                        ' OLED 컴포넌트 없음');
        }

        // Wire에 I2C 장치로 등록
        var wire = this._wire || ((typeof global !== 'undefined') ? global.Wire : null);
        if (wire && typeof wire.registerDevice === 'function') {
            var self = this;
            wire.registerDevice(this._i2cAddr, {
                onReceive: function(data) { self._handleI2CReceive(data); },
                onRequest: function(qty)  {},
                read:      function()     { return 0xFF; },
                available: function()     { return 0; }
            });
        }

        this.clearDisplay();
        return true;
    };

    /**
     * 픽셀 버퍼를 지웁니다 (BLACK으로 채움).
     */
    Adafruit_SSD1306.prototype.clearDisplay = function() {
        this._buffer.fill(0);
        this._cursorX = 0;
        this._cursorY = 0;
    };

    /**
     * 픽셀 버퍼를 디스플레이(컴포넌트 canvas)에 출력합니다.
     */
    Adafruit_SSD1306.prototype.display = function() {
        if (!this._comp) {
            // 컴포넌트 재탐색
            this._comp = this._findOledComponent();
        }

        if (this._comp) {
            // 컴포넌트의 _buffer를 직접 업데이트
            if (this._comp._buffer) {
                var len = Math.min(this._buffer.length, this._comp._buffer.length);
                for (var i = 0; i < len; i++) {
                    this._comp._buffer[i] = this._buffer[i];
                }
                if (typeof this._comp._render === 'function') {
                    this._comp._render();
                }
                if (typeof this._comp.display === 'function') {
                    // 컴포넌트의 display 호출 (재귀 방지)
                    this._comp._render();
                }
            }
        }
    };

    // ── 그리기 기본 ───────────────────────────────────────────────────────────

    /**
     * 픽셀을 설정합니다.
     * @param {number} x     - X 좌표
     * @param {number} y     - Y 좌표
     * @param {number} color - WHITE(1) | BLACK(0) | INVERSE(2)
     */
    Adafruit_SSD1306.prototype.drawPixel = function(x, y, color) {
        x = Math.round(x); y = Math.round(y);
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

        var idx = y * this.width + x;
        if (color === INVERSE) {
            this._buffer[idx] ^= 1;
        } else {
            this._buffer[idx] = color ? 1 : 0;
        }
    };

    /**
     * 전체 화면을 단색으로 채웁니다.
     * @param {number} color - WHITE(1) | BLACK(0)
     */
    Adafruit_SSD1306.prototype.fillScreen = function(color) {
        this._buffer.fill(color ? 1 : 0);
    };

    // ── 선 그리기 ─────────────────────────────────────────────────────────────

    /**
     * 선을 그립니다 (Bresenham 알고리즘).
     * @param {number} x0    - 시작 X
     * @param {number} y0    - 시작 Y
     * @param {number} x1    - 끝 X
     * @param {number} y1    - 끝 Y
     * @param {number} color
     */
    Adafruit_SSD1306.prototype.drawLine = function(x0, y0, x1, y1, color) {
        x0 = Math.round(x0); y0 = Math.round(y0);
        x1 = Math.round(x1); y1 = Math.round(y1);

        var dx  = Math.abs(x1 - x0);
        var dy  = Math.abs(y1 - y0);
        var sx  = x0 < x1 ? 1 : -1;
        var sy  = y0 < y1 ? 1 : -1;
        var err = dx - dy;

        while (true) {
            this.drawPixel(x0, y0, color);
            if (x0 === x1 && y0 === y1) break;
            var e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 <  dx) { err += dx; y0 += sy; }
        }
    };

    /**
     * 수평선을 그립니다 (빠른 구현).
     * @param {number} x     - 시작 X
     * @param {number} y     - Y
     * @param {number} w     - 너비
     * @param {number} color
     */
    Adafruit_SSD1306.prototype.drawFastHLine = function(x, y, w, color) {
        for (var i = 0; i < w; i++) this.drawPixel(x + i, y, color);
    };

    /**
     * 수직선을 그립니다 (빠른 구현).
     * @param {number} x     - X
     * @param {number} y     - 시작 Y
     * @param {number} h     - 높이
     * @param {number} color
     */
    Adafruit_SSD1306.prototype.drawFastVLine = function(x, y, h, color) {
        for (var i = 0; i < h; i++) this.drawPixel(x, y + i, color);
    };

    // ── 사각형 ────────────────────────────────────────────────────────────────

    /**
     * 빈 사각형을 그립니다.
     * @param {number} x     - 왼쪽 X
     * @param {number} y     - 위쪽 Y
     * @param {number} w     - 너비
     * @param {number} h     - 높이
     * @param {number} color
     */
    Adafruit_SSD1306.prototype.drawRect = function(x, y, w, h, color) {
        this.drawFastHLine(x,         y,         w, color);
        this.drawFastHLine(x,         y + h - 1, w, color);
        this.drawFastVLine(x,         y,         h, color);
        this.drawFastVLine(x + w - 1, y,         h, color);
    };

    /**
     * 채워진 사각형을 그립니다.
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} color
     */
    Adafruit_SSD1306.prototype.fillRect = function(x, y, w, h, color) {
        for (var j = 0; j < h; j++) {
            this.drawFastHLine(x, y + j, w, color);
        }
    };

    /**
     * 둥근 모서리 사각형을 그립니다.
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} r     - 모서리 반지름
     * @param {number} color
     */
    Adafruit_SSD1306.prototype.drawRoundRect = function(x, y, w, h, r, color) {
        this.drawFastHLine(x + r,         y,         w - 2 * r, color);
        this.drawFastHLine(x + r,         y + h - 1, w - 2 * r, color);
        this.drawFastVLine(x,             y + r,     h - 2 * r, color);
        this.drawFastVLine(x + w - 1,     y + r,     h - 2 * r, color);
        this._drawCircleHelper(x + r,         y + r,         r, 1, color);
        this._drawCircleHelper(x + w - r - 1, y + r,         r, 2, color);
        this._drawCircleHelper(x + w - r - 1, y + h - r - 1, r, 4, color);
        this._drawCircleHelper(x + r,         y + h - r - 1, r, 8, color);
    };

    /**
     * 채워진 둥근 모서리 사각형을 그립니다.
     */
    Adafruit_SSD1306.prototype.fillRoundRect = function(x, y, w, h, r, color) {
        this.fillRect(x + r, y, w - 2 * r, h, color);
        this._fillCircleHelper(x + w - r - 1, y + r, r, 1, h - 2 * r - 1, color);
        this._fillCircleHelper(x + r,         y + r, r, 2, h - 2 * r - 1, color);
    };

    // ── 원 ────────────────────────────────────────────────────────────────────

    /**
     * 원을 그립니다 (Bresenham).
     * @param {number} x0    - 중심 X
     * @param {number} y0    - 중심 Y
     * @param {number} r     - 반지름
     * @param {number} color
     */
    Adafruit_SSD1306.prototype.drawCircle = function(x0, y0, r, color) {
        var f     = 1 - r;
        var ddF_x = 1;
        var ddF_y = -2 * r;
        var x     = 0;
        var y     = r;

        this.drawPixel(x0,     y0 + r, color);
        this.drawPixel(x0,     y0 - r, color);
        this.drawPixel(x0 + r, y0,     color);
        this.drawPixel(x0 - r, y0,     color);

        while (x < y) {
            if (f >= 0) { y--; ddF_y += 2; f += ddF_y; }
            x++; ddF_x += 2; f += ddF_x;
            this.drawPixel(x0 + x, y0 + y, color);
            this.drawPixel(x0 - x, y0 + y, color);
            this.drawPixel(x0 + x, y0 - y, color);
            this.drawPixel(x0 - x, y0 - y, color);
            this.drawPixel(x0 + y, y0 + x, color);
            this.drawPixel(x0 - y, y0 + x, color);
            this.drawPixel(x0 + y, y0 - x, color);
            this.drawPixel(x0 - y, y0 - x, color);
        }
    };

    /**
     * 채워진 원을 그립니다.
     * @param {number} x0
     * @param {number} y0
     * @param {number} r
     * @param {number} color
     */
    Adafruit_SSD1306.prototype.fillCircle = function(x0, y0, r, color) {
        this.drawFastVLine(x0, y0 - r, 2 * r + 1, color);
        this._fillCircleHelper(x0, y0, r, 3, 0, color);
    };

    /** @private */
    Adafruit_SSD1306.prototype._drawCircleHelper = function(x0, y0, r, cornername, color) {
        var f     = 1 - r;
        var ddF_x = 1;
        var ddF_y = -2 * r;
        var x = 0, y = r;
        while (x < y) {
            if (f >= 0) { y--; ddF_y += 2; f += ddF_y; }
            x++; ddF_x += 2; f += ddF_x;
            if (cornername & 4) { this.drawPixel(x0 + x, y0 + y, color); this.drawPixel(x0 + y, y0 + x, color); }
            if (cornername & 2) { this.drawPixel(x0 + x, y0 - y, color); this.drawPixel(x0 + y, y0 - x, color); }
            if (cornername & 8) { this.drawPixel(x0 - y, y0 + x, color); this.drawPixel(x0 - x, y0 + y, color); }
            if (cornername & 1) { this.drawPixel(x0 - y, y0 - x, color); this.drawPixel(x0 - x, y0 - y, color); }
        }
    };

    /** @private */
    Adafruit_SSD1306.prototype._fillCircleHelper = function(x0, y0, r, corners, delta, color) {
        var f     = 1 - r;
        var ddF_x = 1;
        var ddF_y = -2 * r;
        var x = 0, y = r;
        var px = x, py = y;
        delta++;
        while (x < y) {
            if (f >= 0) { y--; ddF_y += 2; f += ddF_y; }
            x++; ddF_x += 2; f += ddF_x;
            if (x < (y + 1)) {
                if (corners & 1) this.drawFastVLine(x0 + x, y0 - y, 2 * y + delta, color);
                if (corners & 2) this.drawFastVLine(x0 - x, y0 - y, 2 * y + delta, color);
            }
            if (y !== py) {
                if (corners & 1) this.drawFastVLine(x0 + py, y0 - px, 2 * px + delta, color);
                if (corners & 2) this.drawFastVLine(x0 - py, y0 - px, 2 * px + delta, color);
                py = y;
            }
            px = x;
        }
        if (corners & 1) this.drawFastVLine(x0 + py, y0 - px, 2 * px + delta, color);
        if (corners & 2) this.drawFastVLine(x0 - py, y0 - px, 2 * px + delta, color);
    };

    // ── 삼각형 ────────────────────────────────────────────────────────────────

    /**
     * 빈 삼각형을 그립니다.
     */
    Adafruit_SSD1306.prototype.drawTriangle = function(x0, y0, x1, y1, x2, y2, color) {
        this.drawLine(x0, y0, x1, y1, color);
        this.drawLine(x1, y1, x2, y2, color);
        this.drawLine(x2, y2, x0, y0, color);
    };

    /**
     * 채워진 삼각형을 그립니다.
     */
    Adafruit_SSD1306.prototype.fillTriangle = function(x0, y0, x1, y1, x2, y2, color) {
        var a, b, y, last;

        if (y0 > y1) { var t; t=y0;y0=y1;y1=t; t=x0;x0=x1;x1=t; }
        if (y1 > y2) { var t; t=y1;y1=y2;y2=t; t=x1;x1=x2;x2=t; }
        if (y0 > y1) { var t; t=y0;y0=y1;y1=t; t=x0;x0=x1;x1=t; }

        if (y0 === y2) return;

        var dx01 = x1 - x0, dy01 = y1 - y0;
        var dx02 = x2 - x0, dy02 = y2 - y0;
        var dx12 = x2 - x1, dy12 = y2 - y1;
        var sa   = 0, sb = 0;

        last = (y1 === y2) ? y1 : y1 - 1;

        for (y = y0; y <= last; y++) {
            a  = x0 + sa / dy01;
            b  = x0 + sb / dy02;
            sa += dx01; sb += dx02;
            if (a > b) { var tt = a; a = b; b = tt; }
            this.drawFastHLine(Math.round(a), y, Math.round(b - a + 1), color);
        }

        sa = dx12 * (y - y1);
        sb = dx02 * (y - y0);
        for (; y <= y2; y++) {
            a  = x1 + sa / dy12;
            b  = x0 + sb / dy02;
            sa += dx12; sb += dx02;
            if (a > b) { var tt = a; a = b; b = tt; }
            this.drawFastHLine(Math.round(a), y, Math.round(b - a + 1), color);
        }
    };

    // ── 비트맵 ────────────────────────────────────────────────────────────────

    /**
     * 1비트 비트맵을 그립니다.
     * @param {number}   x      - 시작 X
     * @param {number}   y      - 시작 Y
     * @param {number[]|Uint8Array} bitmap - 비트맵 데이터 (가로 패딩 포함)
     * @param {number}   w      - 너비 (픽셀)
     * @param {number}   h      - 높이 (픽셀)
     * @param {number}   color  - 전경색
     * @param {number}   [bg]   - 배경색 (-1: 투명)
     */
    Adafruit_SSD1306.prototype.drawBitmap = function(x, y, bitmap, w, h, color, bg) {
        var byteWidth = Math.floor((w + 7) / 8);
        var byte_ = 0;

        for (var j = 0; j < h; j++) {
            for (var i = 0; i < w; i++) {
                if (i & 7) {
                    byte_ <<= 1;
                } else {
                    byte_ = bitmap[j * byteWidth + Math.floor(i / 8)];
                }
                if (byte_ & 0x80) {
                    this.drawPixel(x + i, y + j, color);
                } else if (bg !== undefined && bg >= 0) {
                    this.drawPixel(x + i, y + j, bg);
                }
            }
        }
    };

    // ── 텍스트 ────────────────────────────────────────────────────────────────

    /**
     * 텍스트 크기를 설정합니다.
     * @param {number} size - 1(기본) ~ 4
     */
    Adafruit_SSD1306.prototype.setTextSize = function(size) {
        this._textSize = Math.max(1, parseInt(size, 10));
    };

    /**
     * 텍스트 색상을 설정합니다.
     * @param {number} color - WHITE(1) | BLACK(0)
     * @param {number} [bg]  - 배경색 (없으면 투명)
     */
    Adafruit_SSD1306.prototype.setTextColor = function(color, bg) {
        this._textColor   = color;
        this._textBgColor = (bg !== undefined) ? bg : -1;
    };

    /**
     * 커서 위치를 설정합니다.
     * @param {number} x - 픽셀 X
     * @param {number} y - 픽셀 Y
     */
    Adafruit_SSD1306.prototype.setCursor = function(x, y) {
        this._cursorX = parseInt(x, 10);
        this._cursorY = parseInt(y, 10);
    };

    /**
     * 자동 줄바꿈을 설정합니다.
     * @param {boolean} wrap
     */
    Adafruit_SSD1306.prototype.setTextWrap = function(wrap) {
        this._wrap = !!wrap;
    };

    /**
     * 값을 현재 커서 위치에 출력합니다.
     * @param {*}      val
     * @param {number} [base]
     * @returns {number} 출력 문자 수
     */
    Adafruit_SSD1306.prototype.print = function(val, base) {
        var str = this._formatValue(val, base);
        for (var i = 0; i < str.length; i++) {
            this._writeChar(str.charCodeAt(i));
        }
        return str.length;
    };

    /**
     * 값을 줄바꿈과 함께 출력합니다.
     * @param {*}      val
     * @param {number} [base]
     */
    Adafruit_SSD1306.prototype.println = function(val, base) {
        this.print(val, base);
        this._cursorX = 0;
        this._cursorY += 8 * this._textSize;
    };

    /**
     * 1글자를 현재 위치에 씁니다.
     * @param {number} ch - 문자 코드
     */
    Adafruit_SSD1306.prototype.write = function(ch) {
        this._writeChar(typeof ch === 'number' ? ch : ch.charCodeAt(0));
        return 1;
    };

    /**
     * 내부: 단일 문자 렌더링 (5×8 폰트 × textSize 배율)
     * @private
     */
    Adafruit_SSD1306.prototype._writeChar = function(code) {
        if (code === 13) return; // CR 무시
        if (code === 10) {       // LF: 줄바꿈
            this._cursorX = 0;
            this._cursorY += 8 * this._textSize;
            return;
        }

        var sz   = this._textSize;
        var cw   = 6 * sz; // 문자 폭 (5픽셀 + 1 간격)
        var ch   = 8 * sz; // 문자 높이

        // 자동 줄바꿈
        if (this._wrap && (this._cursorX + cw > this.width)) {
            this._cursorX = 0;
            this._cursorY += ch;
        }

        var glyph = FONT5X8[code] || FONT5X8[63]; // 없으면 '?'

        for (var col = 0; col < 5; col++) {
            var line = glyph[col];
            for (var row = 0; row < 8; row++) {
                var bitOn = (line >> row) & 1;
                var color = bitOn ? this._textColor : this._textBgColor;

                if (color < 0) continue; // 투명 배경

                if (sz === 1) {
                    this.drawPixel(this._cursorX + col, this._cursorY + row, color);
                } else {
                    this.fillRect(
                        this._cursorX + col * sz,
                        this._cursorY + row * sz,
                        sz, sz, color
                    );
                }
            }
        }

        // 문자 간격 (오른쪽 1픽셀)
        if (this._textBgColor >= 0) {
            for (var r = 0; r < 8 * sz; r++) {
                this.drawPixel(this._cursorX + 5 * sz, this._cursorY + r, this._textBgColor);
            }
        }

        this._cursorX += cw;
    };

    /**
     * 현재 커서 X 좌표를 반환합니다.
     * @returns {number}
     */
    Adafruit_SSD1306.prototype.getCursorX = function() { return this._cursorX; };

    /**
     * 현재 커서 Y 좌표를 반환합니다.
     * @returns {number}
     */
    Adafruit_SSD1306.prototype.getCursorY = function() { return this._cursorY; };

    /**
     * 디스플레이 너비를 반환합니다.
     * @returns {number}
     */
    Adafruit_SSD1306.prototype.getWidth  = function() { return this.width; };

    /**
     * 디스플레이 높이를 반환합니다.
     * @returns {number}
     */
    Adafruit_SSD1306.prototype.getHeight = function() { return this.height; };

    /**
     * 회전을 설정합니다 (시뮬레이터에서 무시).
     * @param {number} r - 0~3
     */
    Adafruit_SSD1306.prototype.setRotation = function(r) {
        // 시뮬레이터에서는 회전 미지원
    };

    /**
     * I2C 수신 처리 (SSD1306 커맨드 파싱 — 간략 구현)
     * @private
     */
    Adafruit_SSD1306.prototype._handleI2CReceive = function(data) {
        // 실제 SSD1306 I2C 커맨드 처리는 복잡하므로 생략
        // 고수준 API(clearDisplay, drawPixel 등)를 직접 사용
    };

    /**
     * 값 포맷
     * @private
     */
    Adafruit_SSD1306.prototype._formatValue = function(val, base) {
        if (val === null || val === undefined) return '';
        if (typeof val === 'boolean') return val ? '1' : '0';
        if (typeof val === 'number') {
            if (base === 16) return val.toString(16).toUpperCase();
            if (base === 2)  return val.toString(2);
            if (base === 8)  return val.toString(8);
            return Number.isInteger(val) ? String(val) : val.toFixed(2);
        }
        return String(val);
    };

    /**
     * circuit에서 OLED_SSD1306 컴포넌트를 탐색합니다.
     * @private
     */
    Adafruit_SSD1306.prototype._findOledComponent = function() {
        var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return null;

        var comps = circuit.getAllComponents();
        for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            if (comp.type !== 'OLED_SSD1306') continue;
            // I2C 주소 매칭 (없으면 첫 번째)
            var compAddr = comp.i2cAddress !== undefined ? comp.i2cAddress :
                           comp._i2cAddress !== undefined ? comp._i2cAddress : null;
            if (compAddr === null || (compAddr & 0x7F) === this._i2cAddr) {
                return comp;
            }
        }
        return null;
    };

    // ── SSD1306Lib 노출 ───────────────────────────────────────────────────────

    global.SSD1306Lib = {
        Adafruit_SSD1306: Adafruit_SSD1306,
        WHITE:            WHITE,
        BLACK:            BLACK,
        INVERSE:          INVERSE,
        SSD1306_SWITCHCAPVCC: SSD1306_SWITCHCAPVCC,
        SSD1306_EXTERNALVCC:  SSD1306_EXTERNALVCC,
        FONT5X8:          FONT5X8,
        /** app.js _buildGlobals()에서 호출: new Adafruit_SSD1306(...) 생성자 반환 */
        create: Adafruit_SSD1306
    };

    // 트랜스파일된 코드에서 바로 사용 가능하도록
    global.Adafruit_SSD1306      = Adafruit_SSD1306;
    global.WHITE                 = WHITE;
    global.BLACK                 = BLACK;
    global.INVERSE               = INVERSE;
    global.SSD1306_SWITCHCAPVCC  = SSD1306_SWITCHCAPVCC;
    global.SSD1306_EXTERNALVCC   = SSD1306_EXTERNALVCC;

})(typeof window !== 'undefined' ? window : this);
