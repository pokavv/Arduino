/**
 * @file BoardBase.js
 * @brief 모든 보드 클래스의 기반 클래스
 *
 * 아두이노/ESP 계열 보드를 SVG로 렌더링하고
 * 핀 메타데이터를 통일된 형식으로 제공하는 기반 클래스입니다.
 *
 * 사용 방법:
 *   class MyBoard extends BoardBase { ... }
 *   const board = new MyBoard();
 *   board.render(svgLayer, 0, 0);
 */

class BoardBase {
    /**
     * 보드 기반 클래스 생성자
     *
     * 하위 클래스에서 super()를 호출한 뒤 반드시
     * this.id, this.name, this.mcu 등을 설정해야 합니다.
     */
    constructor() {
        // ── 보드 식별 정보 ──────────────────────────────────────
        /** @type {string} 보드 고유 ID (예: 'arduino-uno') */
        this.id = '';

        /** @type {string} 보드 표시 이름 (예: 'Arduino Uno') */
        this.name = '';

        /** @type {string} MCU 이름 (예: 'ATmega328P') */
        this.mcu = '';

        // ── 하드웨어 사양 ────────────────────────────────────────
        /** @type {number} 클럭 주파수 (Hz 단위, 예: 16_000_000) */
        this.clockHz = 0;

        /** @type {number} 플래시 크기 (바이트 단위, 예: 32 * 1024) */
        this.flashBytes = 0;

        /** @type {number} SRAM 크기 (바이트 단위, 예: 2 * 1024) */
        this.sramBytes = 0;

        // ── SVG 렌더링 크기 ──────────────────────────────────────
        /** @type {number} 보드 SVG 너비 (px) */
        this.boardWidth = 100;

        /** @type {number} 보드 SVG 높이 (px) */
        this.boardHeight = 60;

        /** @type {string} PCB 본체 색상 (CSS 컬러 문자열) */
        this.boardColor = '#1a5c1a';

        // ── 핀 배열 ──────────────────────────────────────────────
        /**
         * 핀 정의 배열
         *
         * 각 핀 객체 스키마:
         * @type {Array<{
         *   number:       number|null,   // GPIO 번호 (전원핀은 null)
         *   name:         string,        // 내부 핀 이름 (예: 'D3', 'G8', 'A0')
         *   x:            number,        // SVG x 좌표 (px)
         *   y:            number,        // SVG y 좌표 (px)
         *   type:         string,        // 'digital'|'analog'|'power'|'gnd'|'reset'|'other'
         *   capabilities: string[],      // ['adc','pwm','i2c','spi','uart','builtinLed','bootButton']
         *   label:        string,        // 핀 옆에 표시할 짧은 이름 (예: '~3', 'A0')
         * }>}
         */
        this.pins = [];

        // ── 보드별 상수 매핑 ─────────────────────────────────────
        /**
         * Arduino 코드에서 사용하는 심볼과 실제 핀 번호의 매핑
         *
         * 예: { LED_BUILTIN: 13, A0: 14, A1: 15, SS: 10, MOSI: 11 }
         * @type {Object<string, number>}
         */
        this.constants = {};

        // ── 런타임 설정 ──────────────────────────────────────────
        /**
         * 내장 LED Active LOW 여부 (LOW=켜짐인 보드)
         * 예: ESP32-C3 Super Mini, ESP8266 NodeMCU
         * @type {boolean}
         */
        this.builtinLedActiveLow = false;

        /**
         * ADC 해상도 (비트 수)
         * AVR Arduino: 10, ESP32/ESP32-C3: 12
         * @type {number}
         */
        this.adcResolution = 10;
    }

    // ── 런타임 편의 메서드 ───────────────────────────────────────

    /**
     * 내장 LED 핀 번호를 반환합니다.
     * @type {number}
     */
    get builtinLed() {
        return this.constants.LED_BUILTIN ?? 13;
    }

    /**
     * 보드 상수 객체의 복사본을 반환합니다.
     * (app.js _buildGlobals 에서 boardDef.getConstants() 로 호출)
     * @returns {Object<string, number>}
     */
    getConstants() {
        return { ...this.constants };
    }

    /**
     * GPIO 핀 번호 목록을 반환합니다.
     * (pin-state-grid 렌더링에 사용)
     * @type {number[]}
     */
    get gpioPins() {
        return this.pins
            .filter(p => p.number !== null && p.number !== undefined)
            .map(p => p.number);
    }

    /**
     * GPIO 번호에 대응하는 핀 표시 이름을 반환합니다.
     * (pin-state-grid 라벨에 사용)
     * @param {number} gpioNum
     * @returns {string}
     */
    pinLabel(gpioNum) {
        const pin = this.getPinByNumber(gpioNum);
        return pin ? (pin.label || pin.name) : `D${gpioNum}`;
    }

    // ── 핀 조회 유틸리티 ────────────────────────────────────────

    /**
     * GPIO 번호로 핀 정의 객체를 반환합니다.
     *
     * @param {number} num - GPIO 번호
     * @returns {object|null} 핀 객체 또는 null
     */
    getPinByNumber(num) {
        return this.pins.find(p => p.number === num) || null;
    }

    /**
     * 핀 이름으로 핀 정의 객체를 반환합니다.
     *
     * @param {string} name - 핀 이름 (예: 'D3', 'G8')
     * @returns {object|null} 핀 객체 또는 null
     */
    getPinByName(name) {
        return this.pins.find(p => p.name === name || p.label === name) || null;
    }

    /**
     * 특정 기능(capability)을 가진 핀 목록을 반환합니다.
     *
     * @param {string} cap - 기능 문자열 (예: 'pwm', 'adc', 'i2c')
     * @returns {object[]} 해당 기능을 가진 핀 배열
     */
    getPinsByCapability(cap) {
        return this.pins.filter(p => p.capabilities && p.capabilities.includes(cap));
    }

    /**
     * LED_BUILTIN 핀 번호를 반환합니다.
     *
     * @returns {number|null}
     */
    getBuiltinLedPin() {
        return this.constants.LED_BUILTIN ?? null;
    }

    // ── SVG 헬퍼 메서드 (하위 클래스에서 활용) ──────────────────

    /**
     * SVG 네임스페이스 URI
     * @type {string}
     */
    static get SVG_NS() {
        return 'http://www.w3.org/2000/svg';
    }

    /**
     * SVG 요소를 생성합니다.
     *
     * @param {string} tag - 태그 이름 (예: 'rect', 'circle', 'text')
     * @param {Object<string,string|number>} attrs - 속성 객체
     * @returns {SVGElement}
     */
    _el(tag, attrs = {}) {
        const el = document.createElementNS(BoardBase.SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs)) {
            el.setAttribute(k, v);
        }
        return el;
    }

    /**
     * PCB 본체 rect를 그립니다.
     *
     * @param {SVGElement} layer - 부모 SVG 레이어
     * @param {number} x - 보드 왼쪽 상단 x
     * @param {number} y - 보드 왼쪽 상단 y
     */
    _drawBoard(layer, x, y) {
        layer.appendChild(this._el('rect', {
            x, y,
            width:  this.boardWidth,
            height: this.boardHeight,
            rx: 4, ry: 4,
            fill:   this.boardColor,
            stroke: '#333',
            'stroke-width': 1.5,
        }));
    }

    /**
     * 보드 이름 텍스트를 그립니다.
     *
     * @param {SVGElement} layer
     * @param {number} x
     * @param {number} y
     * @param {number} cx - 텍스트 중앙 x (보드 폭의 절반만큼 오프셋)
     * @param {number} cy - 텍스트 y 위치 (상대)
     */
    _drawLabel(layer, x, y, cx, cy) {
        const t = this._el('text', {
            x: x + cx,
            y: y + cy,
            'text-anchor': 'middle',
            'font-size': 7,
            'font-family': 'monospace',
            fill: '#cceeff',
            'font-weight': 'bold',
        });
        t.textContent = this.name;
        layer.appendChild(t);
    }

    /**
     * 칩(MCU) 모양의 rect를 그립니다.
     *
     * @param {SVGElement} layer
     * @param {number} x - 보드 기준 x
     * @param {number} y - 보드 기준 y
     * @param {number} cx - 칩 왼쪽 상단 상대 x
     * @param {number} cy - 칩 왼쪽 상단 상대 y
     * @param {number} cw - 칩 너비
     * @param {number} ch - 칩 높이
     */
    _drawChip(layer, x, y, cx, cy, cw, ch) {
        // 칩 본체
        layer.appendChild(this._el('rect', {
            x: x + cx, y: y + cy,
            width: cw, height: ch,
            rx: 2, ry: 2,
            fill: '#1a1a1a',
            stroke: '#555',
            'stroke-width': 1,
        }));
        // 칩 노치 (방향 표시 반원)
        layer.appendChild(this._el('circle', {
            cx: x + cx + cw / 2,
            cy: y + cy,
            r: 3,
            fill: '#333',
        }));
        // 칩 이름
        const t = this._el('text', {
            x: x + cx + cw / 2,
            y: y + cy + ch / 2 + 3,
            'text-anchor': 'middle',
            'font-size': 5,
            'font-family': 'monospace',
            fill: '#aaa',
        });
        t.textContent = this.mcu;
        layer.appendChild(t);
    }

    /**
     * USB 커넥터 모양을 그립니다.
     *
     * @param {SVGElement} layer
     * @param {number} x - 커넥터 왼쪽 상단 절대 x
     * @param {number} y - 커넥터 왼쪽 상단 절대 y
     * @param {number} w - 너비
     * @param {number} h - 높이
     * @param {string} [label='USB'] - 라벨 텍스트
     */
    _drawUsb(layer, x, y, w, h, label = 'USB') {
        // 커넥터 외형
        layer.appendChild(this._el('rect', {
            x, y, width: w, height: h,
            rx: 2, ry: 2,
            fill: '#888',
            stroke: '#555',
            'stroke-width': 1,
        }));
        // 커넥터 내부 구멍
        layer.appendChild(this._el('rect', {
            x: x + 2, y: y + 2,
            width: w - 4, height: h - 4,
            fill: '#222',
        }));
        // 라벨
        const t = this._el('text', {
            x: x + w / 2,
            y: y + h + 8,
            'text-anchor': 'middle',
            'font-size': 5,
            'font-family': 'monospace',
            fill: '#aaa',
        });
        t.textContent = label;
        layer.appendChild(t);
    }

    /**
     * 핀 원과 핀 이름 텍스트를 그립니다.
     *
     * @param {SVGElement} layer
     * @param {object} pin - 핀 정의 객체
     * @param {number} bx  - 보드 기준점 x (핀의 x는 보드 로컬 좌표)
     * @param {number} by  - 보드 기준점 y
     * @param {'left'|'right'|'top'|'bottom'} textSide - 텍스트 위치
     */
    _drawPin(layer, pin, bx, by, textSide = 'right') {
        const px = bx + pin.x;
        const py = by + pin.y;

        // 핀 타입별 색상 결정
        let fillColor = '#DAA520'; // 금색 (기본 GPIO)
        if (pin.type === 'power')  fillColor = '#e53935'; // 빨간색 (전원)
        if (pin.type === 'gnd')    fillColor = '#424242'; // 어두운 회색 (GND)
        if (pin.type === 'reset')  fillColor = '#78909c'; // 청회색 (RST)
        if (pin.capabilities && pin.capabilities.includes('builtinLed')) fillColor = '#42a5f5'; // 파란색 (LED)
        if (pin.capabilities && pin.capabilities.includes('bootButton')) fillColor = '#ffa726'; // 주황색 (BOOT)

        // 핀 원
        const circle = this._el('circle', {
            cx: px, cy: py, r: 4,
            fill: fillColor,
            stroke: '#222',
            'stroke-width': 0.8,
            style: 'cursor:pointer',
        });
        circle.setAttribute('data-pin-name',  pin.name);
        circle.setAttribute('data-gpio-num',  pin.number ?? '');
        circle.setAttribute('data-pin-type',  pin.type);
        circle.setAttribute('data-pin-caps',  (pin.capabilities || []).join(','));
        layer.appendChild(circle);

        // 핀 이름 텍스트
        let tx = px, ty = py + 4;
        let anchor = 'middle';
        const OFFSET = 7;

        switch (textSide) {
            case 'left':
                tx = px - OFFSET; ty = py + 3;
                anchor = 'end';
                break;
            case 'right':
                tx = px + OFFSET; ty = py + 3;
                anchor = 'start';
                break;
            case 'top':
                tx = px; ty = py - OFFSET;
                anchor = 'middle';
                break;
            case 'bottom':
                tx = px; ty = py + OFFSET + 4;
                anchor = 'middle';
                break;
        }

        const t = this._el('text', {
            x: tx, y: ty,
            'text-anchor': anchor,
            'font-size': 5,
            'font-family': 'monospace',
            fill: '#ddd',
        });
        t.textContent = pin.label;
        layer.appendChild(t);
    }

    // ── 추상 메서드 ─────────────────────────────────────────────

    /**
     * SVG 레이어에 보드를 그립니다.
     * 하위 클래스에서 반드시 오버라이드해야 합니다.
     *
     * @param {SVGElement} svgLayerEl - 보드를 그릴 SVG <g> 요소
     * @param {number} x - 보드 왼쪽 상단 x 좌표
     * @param {number} y - 보드 왼쪽 상단 y 좌표
     */
    render(svgLayerEl, x, y) {
        throw new Error(`${this.constructor.name}.render() 가 구현되지 않았습니다.`);
    }
}

// 전역으로 노출
if (typeof window !== 'undefined') {
    window.BoardBase = BoardBase;
}
