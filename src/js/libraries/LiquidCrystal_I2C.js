/**
 * @file LiquidCrystal_I2C.js
 * @brief Arduino LiquidCrystal_I2C 라이브러리 시뮬레이션
 *
 * I2C 인터페이스(PCF8574 I/O 익스팬더) 를 통해 연결된 LCD를 에뮬레이션합니다.
 * LiquidCrystal.js와 동일한 API를 제공하며, Wire를 통해 I2C LCD와 통신합니다.
 *
 * 사용법 (Arduino):
 *   LiquidCrystal_I2C lcd(0x27, 16, 2);
 *   lcd.init();      // 또는 lcd.begin()
 *   lcd.backlight();
 *   lcd.setCursor(0, 0);
 *   lcd.print("Hello I2C LCD");
 *   lcd.noBacklight();
 *
 * 일반 I2C LCD 주소: 0x27 또는 0x3F
 *
 * Wire 통신 방식:
 *   - PCF8574 I/O 익스팬더를 통해 4비트 병렬 LCD와 통신
 *   - 실제 I2C 비트 프로토콜은 시뮬레이션하지 않고 컴포넌트 직접 제어
 */

(function(global) {
    'use strict';

    /**
     * LiquidCrystal_I2C 클래스
     * @param {number} addr - I2C 주소 (예: 0x27)
     * @param {number} cols - 열 수 (기본: 16)
     * @param {number} rows - 행 수 (기본: 2)
     */
    function LiquidCrystal_I2C(addr, cols, rows) {
        /** I2C 주소 */
        this._addr = (addr !== undefined) ? (addr & 0x7F) : 0x27;

        /** LCD 크기 */
        this._cols = cols || 16;
        this._rows = rows || 2;

        /** 커서 위치 */
        this._cursorCol = 0;
        this._cursorRow = 0;

        /** 문자 버퍼 */
        this._buffer = [];

        /** 백라이트 상태 */
        this._backlightOn = false;

        /** 커서 표시 여부 */
        this._cursorVisible = false;

        /** 커서 깜빡임 여부 */
        this._blinkVisible = false;

        /** 디스플레이 켜짐 여부 */
        this._displayOn = true;

        /** 텍스트 방향 */
        this._leftToRight = true;

        /** 자동 스크롤 */
        this._autoscroll = false;

        /** 사용자 정의 문자 */
        this._customChars = {};

        /** 연결된 LCD_1602 컴포넌트 */
        this._comp = null;

        /** Wire 라이브러리 참조 */
        this._wire = null;

        this._initBuffer();
    }

    /**
     * LCD를 초기화합니다.
     * Arduino LiquidCrystal_I2C 라이브러리는 init() 또는 begin()을 사용합니다.
     */
    LiquidCrystal_I2C.prototype.init = function() {
        this._backlightOn = false;
        this._initBuffer();
        this._cursorCol = 0;
        this._cursorRow = 0;

        // Wire 라이브러리 참조
        this._wire = (typeof global !== 'undefined') ? global.Wire : null;

        // circuit에서 LCD_1602 컴포넌트 찾기 (I2C 주소 매칭)
        this._comp = this._findLcdComponent();
        if (this._comp) {
            console.log('[LCD_I2C] 0x' + this._addr.toString(16).toUpperCase() +
                        ' → 컴포넌트 ' + this._comp.id + ' 연결');
        } else {
            console.log('[LCD_I2C] 0x' + this._addr.toString(16).toUpperCase() +
                        ' LCD_1602 컴포넌트 없음');
        }

        // Wire 장치로 등록
        if (this._wire && typeof this._wire.registerDevice === 'function') {
            var self = this;
            this._wire.registerDevice(this._addr, {
                onReceive: function(data) { self._handleI2CReceive(data); },
                onRequest: function(qty)  {},
                read:      function()     { return 0xFF; },
                available: function()     { return 0; }
            });
        }
    };

    /**
     * begin() — init()의 별칭 (라이브러리 버전에 따라 다름)
     * @param {number} [cols]
     * @param {number} [rows]
     */
    LiquidCrystal_I2C.prototype.begin = function(cols, rows) {
        if (cols !== undefined) this._cols = cols;
        if (rows !== undefined) this._rows = rows;
        this.init();
    };

    /**
     * 백라이트를 켭니다.
     */
    LiquidCrystal_I2C.prototype.backlight = function() {
        this._backlightOn = true;
        this._applyBacklight();
    };

    /**
     * 백라이트를 끕니다.
     */
    LiquidCrystal_I2C.prototype.noBacklight = function() {
        this._backlightOn = false;
        this._applyBacklight();
    };

    /**
     * 화면을 지우고 커서를 (0,0)으로 이동합니다.
     */
    LiquidCrystal_I2C.prototype.clear = function() {
        this._initBuffer();
        this._cursorCol = 0;
        this._cursorRow = 0;
        this._render();
    };

    /**
     * 커서를 (0,0)으로 이동합니다.
     */
    LiquidCrystal_I2C.prototype.home = function() {
        this._cursorCol = 0;
        this._cursorRow = 0;
    };

    /**
     * 커서 위치를 설정합니다.
     * @param {number} col
     * @param {number} row
     */
    LiquidCrystal_I2C.prototype.setCursor = function(col, row) {
        this._cursorCol = Math.max(0, Math.min(this._cols - 1, parseInt(col, 10)));
        this._cursorRow = Math.max(0, Math.min(this._rows - 1, parseInt(row, 10)));
    };

    /**
     * 1바이트 문자를 씁니다.
     * @param {number} ch - 문자 코드
     * @returns {number}
     */
    LiquidCrystal_I2C.prototype.write = function(ch) {
        var char = typeof ch === 'number' ? String.fromCharCode(ch) : String(ch)[0];
        this._writeChar(char);
        this._render();
        return 1;
    };

    /**
     * 값을 출력합니다.
     * @param {*}      val
     * @param {number} [base]
     */
    LiquidCrystal_I2C.prototype.print = function(val, base) {
        var str = this._formatValue(val, base);
        for (var i = 0; i < str.length; i++) {
            this._writeChar(str[i]);
        }
        this._render();
        return str.length;
    };

    /**
     * 값을 줄바꿈과 함께 출력합니다.
     * @param {*}      val
     * @param {number} [base]
     */
    LiquidCrystal_I2C.prototype.println = function(val, base) {
        this.print(val, base);
        this._cursorCol = 0;
        this._cursorRow = Math.min(this._cursorRow + 1, this._rows - 1);
        this._render();
    };

    LiquidCrystal_I2C.prototype.cursor    = function() { this._cursorVisible = true;  this._render(); };
    LiquidCrystal_I2C.prototype.noCursor  = function() { this._cursorVisible = false; this._render(); };
    LiquidCrystal_I2C.prototype.blink     = function() { this._blinkVisible  = true;  this._render(); };
    LiquidCrystal_I2C.prototype.noBlink   = function() { this._blinkVisible  = false; this._render(); };
    LiquidCrystal_I2C.prototype.display   = function() { this._displayOn     = true;  this._render(); };
    LiquidCrystal_I2C.prototype.noDisplay = function() { this._displayOn     = false; this._render(); };

    LiquidCrystal_I2C.prototype.scrollDisplayLeft = function() {
        for (var r = 0; r < this._rows; r++) {
            this._buffer[r].shift();
            this._buffer[r].push(' ');
        }
        this._render();
    };

    LiquidCrystal_I2C.prototype.scrollDisplayRight = function() {
        for (var r = 0; r < this._rows; r++) {
            this._buffer[r].unshift(' ');
            this._buffer[r].pop();
        }
        this._render();
    };

    LiquidCrystal_I2C.prototype.leftToRight  = function() { this._leftToRight = true;  };
    LiquidCrystal_I2C.prototype.rightToLeft  = function() { this._leftToRight = false; };
    LiquidCrystal_I2C.prototype.autoscroll   = function() { this._autoscroll  = true;  };
    LiquidCrystal_I2C.prototype.noAutoscroll = function() { this._autoscroll  = false; };

    /**
     * 사용자 정의 문자를 CGRAM에 저장합니다.
     * @param {number}   location - 0~7
     * @param {number[]} charmap  - 8 bytes
     */
    LiquidCrystal_I2C.prototype.createChar = function(location, charmap) {
        this._customChars[location & 0x07] = charmap;
    };

    // ── 내부 메서드 ──────────────────────────────────────────────────────────

    LiquidCrystal_I2C.prototype._initBuffer = function() {
        this._buffer = [];
        for (var r = 0; r < this._rows; r++) {
            this._buffer.push(new Array(this._cols).fill(' '));
        }
    };

    LiquidCrystal_I2C.prototype._writeChar = function(ch) {
        var row = this._cursorRow;
        var col = this._cursorCol;
        if (row >= this._rows) return;

        if (this._leftToRight) {
            if (col < this._cols) {
                this._buffer[row][col] = ch;
                this._cursorCol++;
            }
        } else {
            if (col >= 0) {
                this._buffer[row][col] = ch;
                this._cursorCol--;
            }
        }

        if (this._autoscroll && this._cursorCol >= this._cols) {
            this.scrollDisplayLeft();
            this._cursorCol = this._cols - 1;
        }
    };

    LiquidCrystal_I2C.prototype._render = function() {
        if (!this._displayOn) return;

        if (this._comp) {
            if (this._comp._chars) {
                for (var r = 0; r < Math.min(this._rows, 2); r++) {
                    for (var c = 0; c < Math.min(this._cols, 16); c++) {
                        this._comp._chars[r][c] = this._buffer[r][c] || ' ';
                    }
                }
                if (typeof this._comp._render === 'function') {
                    this._comp._render();
                }
            } else {
                this._comp.clear();
                this._comp.setCursor(0, 0);
                this._comp.print(this._buffer[0].join(''));
                if (this._rows > 1) {
                    this._comp.setCursor(0, 1);
                    this._comp.print(this._buffer[1].join(''));
                }
            }
        }
    };

    LiquidCrystal_I2C.prototype._applyBacklight = function() {
        if (this._comp) {
            // 컴포넌트의 백라이트 시각 효과 (선택적)
            if (this._comp._canvas) {
                this._comp._canvas.style.background = this._backlightOn ?
                    '#4CAF50' : '#1A3A1A';
            }
            this._render();
        }
    };

    /**
     * I2C 수신 데이터 처리 (PCF8574 프로토콜 에뮬레이션)
     * 실제 I2C 바이트 디코딩은 생략하고 컴포넌트에 직접 전달
     * @private
     */
    LiquidCrystal_I2C.prototype._handleI2CReceive = function(data) {
        // PCF8574: 8비트 출력 포트
        // 비트 맵: [D7,D6,D5,D4, BL,EN,RW,RS]
        // 간단히 로그만 기록
        // console.log('[LCD_I2C] I2C 수신:', data);
    };

    LiquidCrystal_I2C.prototype._formatValue = function(val, base) {
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

    LiquidCrystal_I2C.prototype._findLcdComponent = function() {
        var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return null;

        var comps = circuit.getAllComponents();
        for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            if (comp.type !== 'LCD_1602') continue;
            // I2C 주소 매칭 (없으면 첫 번째 LCD_1602)
            var compAddr = comp.i2cAddress !== undefined ? comp.i2cAddress :
                           comp._i2cAddress !== undefined ? comp._i2cAddress : null;
            if (compAddr === null || (compAddr & 0x7F) === this._addr) {
                return comp;
            }
        }
        return null;
    };

    // ── LiquidCrystalI2CLib 노출 ──────────────────────────────────────────────

    global.LiquidCrystalI2CLib = {
        LiquidCrystal_I2C: LiquidCrystal_I2C,
        /** app.js _buildGlobals()에서 호출: new LiquidCrystal_I2C(...) 생성자 반환 */
        create: LiquidCrystal_I2C
    };

    // 트랜스파일된 코드에서 new LiquidCrystal_I2C(addr, cols, rows) 가 동작하도록
    global.LiquidCrystal_I2C = LiquidCrystal_I2C;

})(typeof window !== 'undefined' ? window : this);
