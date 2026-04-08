/**
 * @file LiquidCrystal.js
 * @brief Arduino LiquidCrystal (병렬 LCD) 라이브러리 시뮬레이션
 *
 * 실제 Arduino LiquidCrystal API를 에뮬레이션합니다.
 * circuit editor의 LCD_1602 컴포넌트와 연동하여 텍스트를 표시합니다.
 *
 * 사용법 (Arduino):
 *   LiquidCrystal lcd(rs, en, d4, d5, d6, d7);
 *   lcd.begin(16, 2);
 *   lcd.print("Hello World");
 *   lcd.setCursor(0, 1);
 *   lcd.print("Row 2");
 *   lcd.clear();
 *
 * 지원 API:
 *   begin(cols, rows)
 *   print(text), println(text)
 *   setCursor(col, row)
 *   clear(), home()
 *   cursor(), noCursor()
 *   blink(), noBlink()
 *   display(), noDisplay()
 *   scrollDisplayLeft(), scrollDisplayRight()
 *   leftToRight(), rightToLeft()
 *   autoscroll(), noAutoscroll()
 *   createChar(location, charmap)
 *   write(ch)
 */

(function(global) {
    'use strict';

    /**
     * LiquidCrystal 클래스 — 병렬 4비트 LCD 에뮬레이션
     *
     * @param {number} rs  - RS 핀
     * @param {number} en  - Enable 핀
     * @param {number} d4  - 데이터 핀 D4
     * @param {number} d5  - 데이터 핀 D5
     * @param {number} d6  - 데이터 핀 D6
     * @param {number} d7  - 데이터 핀 D7
     * @param {number} [rw] - RW 핀 (선택, 보통 GND)
     */
    function LiquidCrystal(rs, en, d4, d5, d6, d7, rw) {
        /** 핀 배열 */
        this._pins = { rs: rs, en: en, d4: d4, d5: d5, d6: d6, d7: d7, rw: rw };

        /** LCD 크기 */
        this._cols = 16;
        this._rows = 2;

        /** 커서 위치 */
        this._cursorCol = 0;
        this._cursorRow = 0;

        /** 문자 버퍼 (행 × 열) */
        this._buffer = [];

        /** 커서 표시 여부 */
        this._cursorVisible = false;

        /** 커서 깜빡임 여부 */
        this._blinkVisible = false;

        /** 디스플레이 켜짐 여부 */
        this._displayOn = true;

        /** 텍스트 방향 (true: 왼→오) */
        this._leftToRight = true;

        /** 자동 스크롤 여부 */
        this._autoscroll = false;

        /** 사용자 정의 문자 (0~7) */
        this._customChars = {};

        /** 연결된 LCD_1602 컴포넌트 */
        this._comp = null;

        this._initBuffer();
    }

    /**
     * LCD를 초기화합니다.
     * @param {number} cols - 열 수 (보통 16)
     * @param {number} rows - 행 수 (보통 2)
     */
    LiquidCrystal.prototype.begin = function(cols, rows) {
        this._cols = cols || 16;
        this._rows = rows || 2;
        this._initBuffer();
        this._cursorCol = 0;
        this._cursorRow = 0;

        // circuit에서 LCD_1602 컴포넌트 찾기
        this._comp = this._findLcdComponent();
        if (this._comp) {
            console.log('[LCD] 컴포넌트 ' + this._comp.id + ' 연결');
            this._syncToComp();
        } else {
            console.log('[LCD] LCD_1602 컴포넌트 없음 (console 출력 모드)');
        }
    };

    /**
     * 화면을 지우고 커서를 (0,0)으로 이동합니다.
     */
    LiquidCrystal.prototype.clear = function() {
        this._initBuffer();
        this._cursorCol = 0;
        this._cursorRow = 0;
        this._render();
    };

    /**
     * 커서를 (0,0)으로 이동합니다 (화면 내용은 유지).
     */
    LiquidCrystal.prototype.home = function() {
        this._cursorCol = 0;
        this._cursorRow = 0;
    };

    /**
     * 커서를 지정 위치로 이동합니다.
     * @param {number} col - 열 (0 기반)
     * @param {number} row - 행 (0 기반)
     */
    LiquidCrystal.prototype.setCursor = function(col, row) {
        this._cursorCol = Math.max(0, Math.min(this._cols - 1, parseInt(col, 10)));
        this._cursorRow = Math.max(0, Math.min(this._rows - 1, parseInt(row, 10)));
    };

    /**
     * 1바이트 문자를 씁니다.
     * @param {number} ch - 문자 코드
     * @returns {number} 쓴 바이트 수
     */
    LiquidCrystal.prototype.write = function(ch) {
        var char = typeof ch === 'number' ? String.fromCharCode(ch) : String(ch)[0];
        this._writeChar(char);
        return 1;
    };

    /**
     * 값을 출력합니다.
     * @param {*}      val    - 출력할 값
     * @param {number} [base] - 진법 (DEC=10, HEX=16, BIN=2, OCT=8)
     * @returns {number} 출력한 문자 수
     */
    LiquidCrystal.prototype.print = function(val, base) {
        var str = this._formatValue(val, base);
        for (var i = 0; i < str.length; i++) {
            this._writeChar(str[i]);
        }
        this._render();
        return str.length;
    };

    /**
     * 값을 줄바꿈과 함께 출력합니다 (Arduino 호환).
     * 실제 LCD는 줄바꿈 없지만, 시뮬레이터 편의상 다음 행으로 이동합니다.
     * @param {*}      val
     * @param {number} [base]
     */
    LiquidCrystal.prototype.println = function(val, base) {
        this.print(val, base);
        // 다음 행으로 이동
        this._cursorCol = 0;
        this._cursorRow = Math.min(this._cursorRow + 1, this._rows - 1);
        this._render();
    };

    /**
     * 커서를 표시합니다 (밑줄).
     */
    LiquidCrystal.prototype.cursor = function() {
        this._cursorVisible = true;
        this._render();
    };

    /**
     * 커서를 숨깁니다.
     */
    LiquidCrystal.prototype.noCursor = function() {
        this._cursorVisible = false;
        this._render();
    };

    /**
     * 커서 깜빡임을 켭니다.
     */
    LiquidCrystal.prototype.blink = function() {
        this._blinkVisible = true;
        this._render();
    };

    /**
     * 커서 깜빡임을 끕니다.
     */
    LiquidCrystal.prototype.noBlink = function() {
        this._blinkVisible = false;
        this._render();
    };

    /**
     * 디스플레이를 켭니다 (커서 위치/내용 유지).
     */
    LiquidCrystal.prototype.display = function() {
        this._displayOn = true;
        this._render();
    };

    /**
     * 디스플레이를 끕니다 (내용은 DDRAM에 유지).
     */
    LiquidCrystal.prototype.noDisplay = function() {
        this._displayOn = false;
        this._render();
    };

    /**
     * 화면을 왼쪽으로 한 칸 스크롤합니다.
     */
    LiquidCrystal.prototype.scrollDisplayLeft = function() {
        for (var r = 0; r < this._rows; r++) {
            this._buffer[r].shift();
            this._buffer[r].push(' ');
        }
        this._render();
    };

    /**
     * 화면을 오른쪽으로 한 칸 스크롤합니다.
     */
    LiquidCrystal.prototype.scrollDisplayRight = function() {
        for (var r = 0; r < this._rows; r++) {
            this._buffer[r].unshift(' ');
            this._buffer[r].pop();
        }
        this._render();
    };

    /**
     * 텍스트 방향을 왼쪽→오른쪽으로 설정합니다 (기본값).
     */
    LiquidCrystal.prototype.leftToRight = function() {
        this._leftToRight = true;
    };

    /**
     * 텍스트 방향을 오른쪽→왼쪽으로 설정합니다.
     */
    LiquidCrystal.prototype.rightToLeft = function() {
        this._leftToRight = false;
    };

    /**
     * 자동 스크롤을 켭니다.
     */
    LiquidCrystal.prototype.autoscroll = function() {
        this._autoscroll = true;
    };

    /**
     * 자동 스크롤을 끕니다.
     */
    LiquidCrystal.prototype.noAutoscroll = function() {
        this._autoscroll = false;
    };

    /**
     * 사용자 정의 문자를 CGRAM에 저장합니다.
     * @param {number}   location - 위치 (0~7)
     * @param {number[]} charmap  - 5×8 폰트 데이터 (8 bytes)
     */
    LiquidCrystal.prototype.createChar = function(location, charmap) {
        this._customChars[location & 0x07] = charmap;
    };

    // ── 내부 메서드 ──────────────────────────────────────────────────────────

    LiquidCrystal.prototype._initBuffer = function() {
        this._buffer = [];
        for (var r = 0; r < this._rows; r++) {
            this._buffer.push(new Array(this._cols).fill(' '));
        }
    };

    LiquidCrystal.prototype._writeChar = function(ch) {
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

        // 자동 스크롤
        if (this._autoscroll && this._cursorCol >= this._cols) {
            this.scrollDisplayLeft();
            this._cursorCol = this._cols - 1;
        }
    };

    LiquidCrystal.prototype._render = function() {
        if (!this._displayOn) return;

        // circuit LCD_1602 컴포넌트 업데이트
        if (this._comp) {
            if (typeof this._comp.clear === 'function') {
                // 컴포넌트 내부 버퍼를 직접 조작
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
                    // 컴포넌트 API 호출 방식
                    this._comp.clear();
                    this._comp.setCursor(0, 0);
                    this._comp.print(this._buffer[0].join(''));
                    if (this._rows > 1) {
                        this._comp.setCursor(0, 1);
                        this._comp.print(this._buffer[1].join(''));
                    }
                }
            }
        }
    };

    LiquidCrystal.prototype._syncToComp = function() {
        if (this._comp && typeof this._comp.clear === 'function') {
            this._comp.clear();
        }
    };

    LiquidCrystal.prototype._formatValue = function(val, base) {
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
     * circuit에서 LCD_1602 컴포넌트를 찾습니다.
     * RS 핀 또는 타입으로 매칭합니다.
     * @private
     * @returns {object|null}
     */
    LiquidCrystal.prototype._findLcdComponent = function() {
        var circuit = (typeof global !== 'undefined') ? global.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return null;

        var comps = circuit.getAllComponents();
        for (var i = 0; i < comps.length; i++) {
            if (comps[i].type === 'LCD_1602') return comps[i];
        }
        return null;
    };

    // ── LiquidCrystalLib 노출 ─────────────────────────────────────────────────

    global.LiquidCrystalLib = {
        LiquidCrystal: LiquidCrystal,
        /** app.js _buildGlobals()에서 호출: new LiquidCrystal(...) 생성자 반환 */
        create: LiquidCrystal
    };

    // 트랜스파일된 코드에서 new LiquidCrystal(rs, en, d4, d5, d6, d7) 가 동작하도록
    global.LiquidCrystal = LiquidCrystal;

})(typeof window !== 'undefined' ? window : this);
