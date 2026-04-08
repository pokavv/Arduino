/**
 * @file ArduinoUno.js
 * @brief Arduino Uno 보드 정의
 *
 * 하드웨어 정보:
 *   - MCU: ATmega328P (8비트 AVR)
 *   - 클럭: 16MHz
 *   - 플래시: 32KB (부트로더 0.5KB 포함)
 *   - SRAM: 2KB, EEPROM: 1KB
 *   - 동작 전압: 5V
 *   - 입력 전압 권장: 7~12V
 *
 * 핀 구성:
 *   - 디지털: D0~D13 (14핀)
 *   - PWM(~): D3, D5, D6, D9, D10, D11
 *   - 아날로그: A0~A5 (디지털로도 사용 가능)
 *   - I2C: SDA=A4, SCL=A5
 *   - SPI: MOSI=D11, MISO=D12, SCK=D13, SS=D10
 *   - UART: RX=D0, TX=D1
 *   - LED_BUILTIN: D13
 *
 * SVG 배치:
 *   - 보드 크기: 180×70px (실제 68.6mm×53.3mm 기준)
 *   - 왼쪽(하단) 핀 헤더: D0~D13 (상단 가로)
 *   - 오른쪽(상단) 핀 헤더: A0~A5, 전원 핀 (하단 가로)
 *   - PCB 색상: 초록색 (#2e7d32)
 *
 * 준비물:
 *   - Arduino Uno 보드
 *   - USB-B 케이블
 *
 * 연결 방법:
 *   - USB-B 케이블로 PC와 연결
 *   - DC 잭 또는 Vin/GND 핀으로 외부 전원 공급 가능
 */

class ArduinoUnoBoard extends BoardBase {
    constructor() {
        super();

        this.id         = 'arduino-uno';
        this.name       = 'Arduino Uno';
        this.mcu        = 'ATmega328P';
        this.clockHz    = 16_000_000;
        this.flashBytes = 32 * 1024;
        this.sramBytes  = 2 * 1024;

        this.boardWidth  = 180;
        this.boardHeight = 70;
        this.boardColor  = '#2e7d32'; // 초록색 PCB

        // ── 상수 매핑 ────────────────────────────────────────────
        this.constants = {
            LED_BUILTIN: 13,
            SS:   10,
            MOSI: 11,
            MISO: 12,
            SCK:  13,
            SDA:  18,   // A4 = 아날로그 4번 핀 (디지털 번호 18)
            SCL:  19,   // A5 = 아날로그 5번 핀 (디지털 번호 19)
            A0: 14,
            A1: 15,
            A2: 16,
            A3: 17,
            A4: 18,
            A5: 19,
        };

        // ── 핀 정의 ─────────────────────────────────────────────
        // 레이아웃:
        //   디지털 헤더 (상단 가로줄): D0~D13, x= 14~167, y=8
        //   아날로그+전원 헤더 (하단 가로줄): IOREF,RST,3V3,5V,GND,GND,Vin,A0~A5, x= 6~167, y=62
        //
        // 핀 간격: 디지털 = (167-14)/13 ≈ 11.77  → 12px
        //          하단    = 13px 간격
        this.pins = [
            // ── 디지털 헤더 (보드 상단, D0~D13) ─────────────────
            {
                number: 0, name: 'D0', label: 'RX',
                x: 14, y: 8,
                type: 'digital',
                capabilities: ['uart'],
            },
            {
                number: 1, name: 'D1', label: 'TX',
                x: 26, y: 8,
                type: 'digital',
                capabilities: ['uart'],
            },
            {
                number: 2, name: 'D2', label: '2',
                x: 38, y: 8,
                type: 'digital',
                capabilities: [],
            },
            {
                number: 3, name: 'D3', label: '~3',
                x: 50, y: 8,
                type: 'digital',
                capabilities: ['pwm'],
            },
            {
                number: 4, name: 'D4', label: '4',
                x: 62, y: 8,
                type: 'digital',
                capabilities: [],
            },
            {
                number: 5, name: 'D5', label: '~5',
                x: 74, y: 8,
                type: 'digital',
                capabilities: ['pwm'],
            },
            {
                number: 6, name: 'D6', label: '~6',
                x: 86, y: 8,
                type: 'digital',
                capabilities: ['pwm'],
            },
            {
                number: 7, name: 'D7', label: '7',
                x: 98, y: 8,
                type: 'digital',
                capabilities: [],
            },
            {
                number: 8, name: 'D8', label: '8',
                x: 110, y: 8,
                type: 'digital',
                capabilities: [],
            },
            {
                number: 9, name: 'D9', label: '~9',
                x: 122, y: 8,
                type: 'digital',
                capabilities: ['pwm'],
            },
            {
                number: 10, name: 'D10', label: '~10',
                x: 134, y: 8,
                type: 'digital',
                capabilities: ['pwm', 'spi'],
            },
            {
                number: 11, name: 'D11', label: '~11',
                x: 146, y: 8,
                type: 'digital',
                capabilities: ['pwm', 'spi'],
            },
            {
                number: 12, name: 'D12', label: '12',
                x: 158, y: 8,
                type: 'digital',
                capabilities: ['spi'],
            },
            {
                number: 13, name: 'D13', label: '13',
                x: 170, y: 8,
                type: 'digital',
                capabilities: ['spi', 'builtinLed'],
            },

            // ── 하단 전원 + 아날로그 헤더 ─────────────────────────
            {
                number: null, name: 'IOREF', label: 'IOREF',
                x: 6, y: 62,
                type: 'other',
                capabilities: [],
            },
            {
                number: null, name: 'RST', label: 'RST',
                x: 19, y: 62,
                type: 'reset',
                capabilities: [],
            },
            {
                number: null, name: '3V3', label: '3.3V',
                x: 32, y: 62,
                type: 'power',
                capabilities: [],
            },
            {
                number: null, name: '5V', label: '5V',
                x: 45, y: 62,
                type: 'power',
                capabilities: [],
            },
            {
                number: null, name: 'GND1', label: 'GND',
                x: 58, y: 62,
                type: 'gnd',
                capabilities: [],
            },
            {
                number: null, name: 'GND2', label: 'GND',
                x: 71, y: 62,
                type: 'gnd',
                capabilities: [],
            },
            {
                number: null, name: 'VIN', label: 'Vin',
                x: 84, y: 62,
                type: 'power',
                capabilities: [],
            },
            {
                number: 14, name: 'A0', label: 'A0',
                x: 103, y: 62,
                type: 'analog',
                capabilities: ['adc'],
            },
            {
                number: 15, name: 'A1', label: 'A1',
                x: 116, y: 62,
                type: 'analog',
                capabilities: ['adc'],
            },
            {
                number: 16, name: 'A2', label: 'A2',
                x: 129, y: 62,
                type: 'analog',
                capabilities: ['adc'],
            },
            {
                number: 17, name: 'A3', label: 'A3',
                x: 142, y: 62,
                type: 'analog',
                capabilities: ['adc'],
            },
            {
                number: 18, name: 'A4', label: 'A4',
                x: 155, y: 62,
                type: 'analog',
                capabilities: ['adc', 'i2c'],
            },
            {
                number: 19, name: 'A5', label: 'A5',
                x: 168, y: 62,
                type: 'analog',
                capabilities: ['adc', 'i2c'],
            },
        ];
    }

    /**
     * SVG 레이어에 Arduino Uno 보드를 그립니다.
     *
     * @param {SVGElement} svgLayerEl - 부모 SVG <g> 요소
     * @param {number} x - 보드 왼쪽 상단 x 좌표
     * @param {number} y - 보드 왼쪽 상단 y 좌표
     */
    render(svgLayerEl, x, y) {
        // PCB 본체
        this._drawBoard(svgLayerEl, x, y);

        // USB-B 커넥터 (왼쪽 상단)
        this._drawUsb(svgLayerEl, x - 10, y + 18, 12, 16, 'USB-B');

        // DC 잭 (왼쪽 하단)
        svgLayerEl.appendChild(this._el('rect', {
            x: x - 8, y: y + 42, width: 10, height: 14,
            rx: 2, fill: '#555', stroke: '#333', 'stroke-width': 1,
        }));
        svgLayerEl.appendChild(this._el('circle', {
            cx: x - 3, cy: y + 49, r: 3.5,
            fill: '#222',
        }));

        // MCU 칩 (중앙)
        this._drawChip(svgLayerEl, x, y, 60, 20, 55, 32);

        // 보드 이름 라벨
        this._drawLabel(svgLayerEl, x, y, this.boardWidth / 2, 45);

        // 핀 그리기 (상단 핀 = 텍스트 아래, 하단 핀 = 텍스트 위)
        for (const pin of this.pins) {
            const side = pin.y < 35 ? 'bottom' : 'top';
            this._drawPin(svgLayerEl, pin, x, y, side);
        }
    }
}

// ── window.BOARDS 등록 (boards.js 에서 통합) ─────────────────────
if (typeof window !== 'undefined') {
    window.ArduinoUnoBoard = ArduinoUnoBoard;
}
