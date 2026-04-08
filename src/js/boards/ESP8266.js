/**
 * @file ESP8266.js
 * @brief ESP8266 NodeMCU (v2/v3) 보드 정의
 *
 * 하드웨어 정보:
 *   - MCU: ESP8266 (Tensilica L106 32비트)
 *   - 클럭: 80MHz (최대 160MHz)
 *   - 플래시: 4MB (외부 SPI Flash)
 *   - SRAM: 80KB (실제 사용 가능 약 36KB)
 *   - 동작 전압: 3.3V (5V 직접 연결 금지)
 *   - Wi-Fi: 2.4GHz 802.11 b/g/n (단일 코어 — Wi-Fi와 사용자 코드 공유)
 *
 * 핀 구성 (NodeMCU 라벨 기준):
 *   - D0 = GPIO16  주의: 딥슬립 wake, INPUT_PULLDOWN_16 전용, PWM 불가
 *   - D1 = GPIO5   I2C SCL
 *   - D2 = GPIO4   I2C SDA
 *   - D3 = GPIO0   부팅 스트랩 핀 (BOOT 버튼), FLASH=LOW
 *   - D4 = GPIO2   내장 LED2 (Active LOW), TXD1
 *   - D5 = GPIO14  SPI SCK
 *   - D6 = GPIO12  SPI MISO
 *   - D7 = GPIO13  SPI MOSI
 *   - D8 = GPIO15  SPI CS (부팅 스트랩: 반드시 LOW로 풀다운)
 *   - RX = GPIO3   UART0 RX
 *   - TX = GPIO1   UART0 TX (내장 LED1 Active LOW)
 *   - A0 = ADC0    아날로그 입력 (0~1V, NodeMCU 분압기로 0~3.3V)
 *   - LED_BUILTIN = 2 (D4, Active LOW)
 *
 * 주의사항:
 *   - GPIO 0, 2, 15: 부팅 스트랩 핀 — 부팅 시 상태가 결정됨
 *   - GPIO 16: 딥슬립 wake 연결 핀 — PWM 불가
 *   - ADC는 하나뿐 (A0), 전압 범위: NodeMCU는 0~3.3V (내부 분압)
 *   - Wi-Fi 사용 중 ADC 값이 불안정해질 수 있음
 *   - Serial.begin() 시 GPIO1(TX) 사용 불가
 *
 * SVG 배치:
 *   - 보드 크기: 120×30px (세로 방향)
 *   - 실제 보드: 48mm × 26mm 기준
 *   - 왼쪽 열 (위→아래, 15핀): A0,RSV,RSV,D0~D8,3V3,GND,VIN
 *   - 오른쪽 열 (위→아래, 15핀): D1~D8,RX,TX,GND,3V3,EN,RST,VIN
 *   - PCB 색상: 파란색 (#0d47a1)
 *
 * 준비물:
 *   - NodeMCU ESP8266 보드 (v2 CH340G 또는 v3 CP2102)
 *   - Micro-USB 케이블
 *   - CH340G 또는 CP2102 드라이버 (Windows)
 *
 * 연결 방법:
 *   - Micro-USB로 PC에 연결
 *   - Arduino IDE: 보드 = "NodeMCU 1.0 (ESP-12E Module)"
 *   - Upload Speed: 115200 또는 921600
 */

class ESP8266Board extends BoardBase {
    constructor() {
        super();

        this.id         = 'esp8266';
        this.name       = 'NodeMCU ESP8266';
        this.mcu        = 'ESP8266';
        this.clockHz    = 80_000_000;
        this.flashBytes = 4 * 1024 * 1024;
        this.sramBytes  = 80 * 1024;

        this.boardWidth  = 120;
        this.boardHeight = 320;  // 세로형
        this.boardColor  = '#0d47a1'; // 파란색 PCB

        this.builtinLedActiveLow = true;  // D4(GPIO2) LED: LOW=켜짐

        // NodeMCU D-핀 → GPIO 번호 매핑
        this.constants = {
            LED_BUILTIN: 2,   // D4 = GPIO2, Active LOW
            D0:  16,
            D1:  5,
            D2:  4,
            D3:  0,
            D4:  2,
            D5:  14,
            D6:  12,
            D7:  13,
            D8:  15,
            RX:  3,
            TX:  1,
            A0:  17,   // ADC 핀 (내부 번호 관례)
            SS:  15,
            MOSI: 13,
            MISO: 12,
            SCK:  14,
            SDA:  4,
            SCL:  5,
        };

        const LEFT_X  = 10;
        const RIGHT_X = 110;
        const START_Y = 20;
        const SPACING = 19;
        const ly = i => START_Y + i * SPACING;

        // 기능 결정 헬퍼
        const makeCaps = (gpio) => {
            if (gpio === null) return [];
            const caps = [];
            if (gpio !== 16) caps.push('pwm');       // GPIO16은 PWM 불가
            if (gpio === 17) caps.push('adc');        // A0
            if (gpio === 4 || gpio === 5) caps.push('i2c');
            if ([12, 13, 14, 15].includes(gpio)) caps.push('spi');
            if (gpio === 1 || gpio === 3) caps.push('uart');
            if (gpio === 2) caps.push('builtinLed');  // Active LOW
            if (gpio === 0) caps.push('bootButton');
            return caps;
        };

        // D-핀 라벨 역매핑
        const GPIO_TO_D = {16:'D0',5:'D1',4:'D2',0:'D3',2:'D4',14:'D5',12:'D6',13:'D7',15:'D8',3:'RX',1:'TX'};

        const makePin = (gpio, x, y) => ({
            number: gpio,
            name:   `GPIO${gpio}`,
            label:  GPIO_TO_D[gpio] ? `${GPIO_TO_D[gpio]}/G${gpio}` : `G${gpio}`,
            x, y,
            type: gpio === 17 ? 'analog' : 'digital',
            capabilities: makeCaps(gpio),
        });

        this.pins = [
            // ── 왼쪽 열 ──────────────────────────────────────────
            { number: 17,   name: 'A0',   label: 'A0',    x: LEFT_X, y: ly(0),  type: 'analog',  capabilities: ['adc'] },
            { number: null, name: 'RSV1', label: 'RSV',   x: LEFT_X, y: ly(1),  type: 'other',   capabilities: [] },
            { number: null, name: 'RSV2', label: 'RSV',   x: LEFT_X, y: ly(2),  type: 'other',   capabilities: [] },
            makePin(16,  LEFT_X, ly(3)),
            makePin(5,   LEFT_X, ly(4)),
            makePin(4,   LEFT_X, ly(5)),
            makePin(0,   LEFT_X, ly(6)),
            makePin(2,   LEFT_X, ly(7)),
            makePin(14,  LEFT_X, ly(8)),
            makePin(12,  LEFT_X, ly(9)),
            makePin(13,  LEFT_X, ly(10)),
            makePin(15,  LEFT_X, ly(11)),
            { number: null, name: '3V3L', label: '3.3V',  x: LEFT_X, y: ly(12), type: 'power', capabilities: [] },
            { number: null, name: 'GNDL', label: 'GND',   x: LEFT_X, y: ly(13), type: 'gnd',   capabilities: [] },
            { number: null, name: 'VINL', label: 'Vin',   x: LEFT_X, y: ly(14), type: 'power', capabilities: [] },

            // ── 오른쪽 열 ─────────────────────────────────────────
            makePin(1,   RIGHT_X, ly(0)),
            makePin(3,   RIGHT_X, ly(1)),
            { number: null, name: 'GND1', label: 'GND',   x: RIGHT_X, y: ly(2),  type: 'gnd',   capabilities: [] },
            { number: null, name: '3V3R', label: '3.3V',  x: RIGHT_X, y: ly(3),  type: 'power', capabilities: [] },
            { number: null, name: 'EN',   label: 'EN',    x: RIGHT_X, y: ly(4),  type: 'other', capabilities: [] },
            { number: null, name: 'RST',  label: 'RST',   x: RIGHT_X, y: ly(5),  type: 'reset', capabilities: [] },
            { number: null, name: 'GND2', label: 'GND',   x: RIGHT_X, y: ly(6),  type: 'gnd',   capabilities: [] },
            { number: null, name: 'VINR', label: 'Vin',   x: RIGHT_X, y: ly(7),  type: 'power', capabilities: [] },
            makePin(15,  RIGHT_X, ly(8)),
            makePin(13,  RIGHT_X, ly(9)),
            makePin(12,  RIGHT_X, ly(10)),
            makePin(14,  RIGHT_X, ly(11)),
            makePin(2,   RIGHT_X, ly(12)),
            makePin(0,   RIGHT_X, ly(13)),
            makePin(4,   RIGHT_X, ly(14)),
        ];
    }

    /**
     * SVG 레이어에 NodeMCU ESP8266 보드를 그립니다.
     *
     * @param {SVGElement} svgLayerEl
     * @param {number} x
     * @param {number} y
     */
    render(svgLayerEl, x, y) {
        // PCB 본체
        this._drawBoard(svgLayerEl, x, y);

        // Micro-USB 커넥터 (보드 상단 중앙)
        this._drawUsb(svgLayerEl, x + 42, y - 8, 36, 10, 'Micro-USB');

        // ESP-12E 모듈 (금속 차폐 캔)
        svgLayerEl.appendChild(this._el('rect', {
            x: x + 20, y: y + 55,
            width: 80, height: 110,
            rx: 3, ry: 3,
            fill: '#888', stroke: '#555', 'stroke-width': 1.5,
        }));
        // 모듈 이름
        const modLabel = this._el('text', {
            x: x + 60, y: y + 116,
            'text-anchor': 'middle',
            'font-size': 7, 'font-family': 'monospace',
            fill: '#222', 'font-weight': 'bold',
        });
        modLabel.textContent = 'ESP-12E';
        svgLayerEl.appendChild(modLabel);

        // 안테나 (오른쪽 상단)
        svgLayerEl.appendChild(this._el('rect', {
            x: x + 88, y: y + 57, width: 12, height: 4, fill: '#aaa',
        }));

        // USB-UART 칩 (CH340G / CP2102)
        svgLayerEl.appendChild(this._el('rect', {
            x: x + 30, y: y + 20, width: 28, height: 22,
            rx: 1, fill: '#1a1a1a', stroke: '#555', 'stroke-width': 1,
        }));
        const uartLabel = this._el('text', {
            x: x + 44, y: y + 34,
            'text-anchor': 'middle',
            'font-size': 5, 'font-family': 'monospace',
            fill: '#aaa',
        });
        uartLabel.textContent = 'CH340G';
        svgLayerEl.appendChild(uartLabel);

        // 보드 이름 라벨
        this._drawLabel(svgLayerEl, x, y, this.boardWidth / 2, 195);

        // 핀 그리기
        for (const pin of this.pins) {
            const side = pin.x < 65 ? 'right' : 'left';
            this._drawPin(svgLayerEl, pin, x, y, side);
        }
    }
}

if (typeof window !== 'undefined') {
    window.ESP8266Board = ESP8266Board;
}
