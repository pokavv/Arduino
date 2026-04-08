/**
 * @file ArduinoNano.js
 * @brief Arduino Nano 보드 정의
 *
 * 하드웨어 정보:
 *   - MCU: ATmega328P (8비트 AVR)
 *   - 클럭: 16MHz
 *   - 플래시: 32KB (부트로더 2KB 포함)
 *   - SRAM: 2KB, EEPROM: 1KB
 *   - 동작 전압: 5V
 *   - 폼팩터: DIP 형태, 브레드보드 친화적
 *
 * 핀 구성:
 *   - 디지털: D0~D13 (14핀)
 *   - PWM(~): D3, D5, D6, D9, D10, D11
 *   - 아날로그: A0~A7 (A6, A7은 아날로그 전용)
 *   - I2C: SDA=A4, SCL=A5
 *   - SPI: MOSI=D11, MISO=D12, SCK=D13, SS=D10
 *   - UART: RX=D0, TX=D1
 *   - LED_BUILTIN: D13
 *
 * SVG 배치:
 *   - 보드 크기: 90×35px
 *   - 왼쪽 열 (위→아래, 15핀): D1,D0,RST,GND,D2,D3,D4,D5,D6,D7,D8,D9,D10,D11,D12
 *   - 오른쪽 열 (위→아래, 15핀): D13,3V3,AREF,A0,A1,A2,A3,A4,A5,A6,A7,5V,RST2,GND2,VIN
 *   - 핀 간격: 22px
 *   - PCB 색상: 초록색 (#2e7d32)
 *
 * 준비물:
 *   - Arduino Nano 보드
 *   - Mini-USB 또는 Micro-USB 케이블 (버전에 따라 다름)
 *
 * 연결 방법:
 *   - USB 케이블로 PC와 연결
 *   - 브레드보드에 꽂아 사용 가능 (DIP 폼팩터)
 */

class ArduinoNanoBoard extends BoardBase {
    constructor() {
        super();

        this.id         = 'arduino-nano';
        this.name       = 'Arduino Nano';
        this.mcu        = 'ATmega328P';
        this.clockHz    = 16_000_000;
        this.flashBytes = 32 * 1024;
        this.sramBytes  = 2 * 1024;

        this.boardWidth  = 90;
        this.boardHeight = 340;  // 세로 방향 (좌우 15핀 × 22px + 여백)
        this.boardColor  = '#2e7d32';

        this.constants = {
            LED_BUILTIN: 13,
            SS:   10,
            MOSI: 11,
            MISO: 12,
            SCK:  13,
            SDA:  18,
            SCL:  19,
            A0: 14,
            A1: 15,
            A2: 16,
            A3: 17,
            A4: 18,
            A5: 19,
            A6: 20,
            A7: 21,
        };

        // ── 핀 좌표 계산 ─────────────────────────────────────────
        // 왼쪽 핀: x=10, 오른쪽 핀: x=80
        // 첫 핀 y=20, 간격=20px
        const LEFT_X   = 10;
        const RIGHT_X  = 80;
        const START_Y  = 20;
        const SPACING  = 20;
        const ly  = i => START_Y + i * SPACING;

        this.pins = [
            // ── 왼쪽 열 (위→아래) ────────────────────────────────
            { number: 1,  name: 'D1',   label: 'TX',    x: LEFT_X, y: ly(0),  type: 'digital', capabilities: ['uart'] },
            { number: 0,  name: 'D0',   label: 'RX',    x: LEFT_X, y: ly(1),  type: 'digital', capabilities: ['uart'] },
            { number: null,name:'RST',  label: 'RST',   x: LEFT_X, y: ly(2),  type: 'reset',   capabilities: [] },
            { number: null,name:'GND1', label: 'GND',   x: LEFT_X, y: ly(3),  type: 'gnd',     capabilities: [] },
            { number: 2,  name: 'D2',   label: '2',     x: LEFT_X, y: ly(4),  type: 'digital', capabilities: [] },
            { number: 3,  name: 'D3',   label: '~3',    x: LEFT_X, y: ly(5),  type: 'digital', capabilities: ['pwm'] },
            { number: 4,  name: 'D4',   label: '4',     x: LEFT_X, y: ly(6),  type: 'digital', capabilities: [] },
            { number: 5,  name: 'D5',   label: '~5',    x: LEFT_X, y: ly(7),  type: 'digital', capabilities: ['pwm'] },
            { number: 6,  name: 'D6',   label: '~6',    x: LEFT_X, y: ly(8),  type: 'digital', capabilities: ['pwm'] },
            { number: 7,  name: 'D7',   label: '7',     x: LEFT_X, y: ly(9),  type: 'digital', capabilities: [] },
            { number: 8,  name: 'D8',   label: '8',     x: LEFT_X, y: ly(10), type: 'digital', capabilities: [] },
            { number: 9,  name: 'D9',   label: '~9',    x: LEFT_X, y: ly(11), type: 'digital', capabilities: ['pwm'] },
            { number: 10, name: 'D10',  label: '~10',   x: LEFT_X, y: ly(12), type: 'digital', capabilities: ['pwm','spi'] },
            { number: 11, name: 'D11',  label: '~11',   x: LEFT_X, y: ly(13), type: 'digital', capabilities: ['pwm','spi'] },
            { number: 12, name: 'D12',  label: '12',    x: LEFT_X, y: ly(14), type: 'digital', capabilities: ['spi'] },

            // ── 오른쪽 열 (위→아래) ──────────────────────────────
            { number: 13, name: 'D13',  label: '13',    x: RIGHT_X, y: ly(0),  type: 'digital', capabilities: ['spi','builtinLed'] },
            { number: null,name:'3V3',  label: '3.3V',  x: RIGHT_X, y: ly(1),  type: 'power',   capabilities: [] },
            { number: null,name:'AREF', label: 'AREF',  x: RIGHT_X, y: ly(2),  type: 'other',   capabilities: [] },
            { number: 14, name: 'A0',   label: 'A0',    x: RIGHT_X, y: ly(3),  type: 'analog',  capabilities: ['adc'] },
            { number: 15, name: 'A1',   label: 'A1',    x: RIGHT_X, y: ly(4),  type: 'analog',  capabilities: ['adc'] },
            { number: 16, name: 'A2',   label: 'A2',    x: RIGHT_X, y: ly(5),  type: 'analog',  capabilities: ['adc'] },
            { number: 17, name: 'A3',   label: 'A3',    x: RIGHT_X, y: ly(6),  type: 'analog',  capabilities: ['adc'] },
            { number: 18, name: 'A4',   label: 'A4',    x: RIGHT_X, y: ly(7),  type: 'analog',  capabilities: ['adc','i2c'] },
            { number: 19, name: 'A5',   label: 'A5',    x: RIGHT_X, y: ly(8),  type: 'analog',  capabilities: ['adc','i2c'] },
            { number: 20, name: 'A6',   label: 'A6',    x: RIGHT_X, y: ly(9),  type: 'analog',  capabilities: ['adc'] },
            { number: 21, name: 'A7',   label: 'A7',    x: RIGHT_X, y: ly(10), type: 'analog',  capabilities: ['adc'] },
            { number: null,name:'5V',   label: '5V',    x: RIGHT_X, y: ly(11), type: 'power',   capabilities: [] },
            { number: null,name:'RST2', label: 'RST',   x: RIGHT_X, y: ly(12), type: 'reset',   capabilities: [] },
            { number: null,name:'GND2', label: 'GND',   x: RIGHT_X, y: ly(13), type: 'gnd',     capabilities: [] },
            { number: null,name:'VIN',  label: 'Vin',   x: RIGHT_X, y: ly(14), type: 'power',   capabilities: [] },
        ];
    }

    /**
     * SVG 레이어에 Arduino Nano 보드를 그립니다.
     *
     * @param {SVGElement} svgLayerEl
     * @param {number} x
     * @param {number} y
     */
    render(svgLayerEl, x, y) {
        // PCB 본체
        this._drawBoard(svgLayerEl, x, y);

        // Mini-USB 커넥터 (보드 상단 중앙)
        this._drawUsb(svgLayerEl, x + 32, y - 8, 26, 10, 'Mini-USB');

        // MCU 칩 (보드 중앙)
        this._drawChip(svgLayerEl, x, y, 22, 110, 46, 60);

        // 보드 이름 라벨
        this._drawLabel(svgLayerEl, x, y, this.boardWidth / 2, 185);

        // 핀 그리기 (왼쪽 핀=텍스트 오른쪽, 오른쪽 핀=텍스트 왼쪽)
        for (const pin of this.pins) {
            const side = pin.x < 45 ? 'right' : 'left';
            this._drawPin(svgLayerEl, pin, x, y, side);
        }
    }
}

if (typeof window !== 'undefined') {
    window.ArduinoNanoBoard = ArduinoNanoBoard;
}
