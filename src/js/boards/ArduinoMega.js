/**
 * @file ArduinoMega.js
 * @brief Arduino Mega 2560 보드 정의
 *
 * 하드웨어 정보:
 *   - MCU: ATmega2560 (8비트 AVR)
 *   - 클럭: 16MHz
 *   - 플래시: 256KB (부트로더 8KB 포함)
 *   - SRAM: 8KB, EEPROM: 4KB
 *   - 동작 전압: 5V
 *   - 입력 전압 권장: 7~12V
 *
 * 핀 구성:
 *   - 디지털: D0~D53 (54핀)
 *   - PWM(~): D2~D13, D44~D46 (15핀)
 *   - 아날로그: A0~A15 (16핀)
 *   - UART: Serial(0)=D0/D1, Serial1=D19/D18, Serial2=D17/D16, Serial3=D15/D14
 *   - I2C: SDA=D20, SCL=D21
 *   - SPI: MOSI=D51, MISO=D50, SCK=D52, SS=D53
 *   - LED_BUILTIN: D13
 *
 * SVG 배치:
 *   - 보드 크기: 220×110px
 *   - 상단 핀 헤더: D0~D13, D14~D21 (인터럽트/통신 핀)
 *   - 하단 핀 헤더: A0~A15, 전원 핀들
 *   - 오른쪽 핀 헤더: D22~D53
 *   - PCB 색상: 초록색 (#1b5e20)
 *
 * 준비물:
 *   - Arduino Mega 2560 보드
 *   - USB-B 케이블
 *
 * 연결 방법:
 *   - USB-B 케이블로 PC와 연결
 *   - 외부 전원: DC 잭(7~12V) 또는 Vin 핀 사용
 */

class ArduinoMegaBoard extends BoardBase {
    constructor() {
        super();

        this.id         = 'arduino-mega';
        this.name       = 'Arduino Mega 2560';
        this.mcu        = 'ATmega2560';
        this.clockHz    = 16_000_000;
        this.flashBytes = 256 * 1024;
        this.sramBytes  = 8 * 1024;

        this.boardWidth  = 220;
        this.boardHeight = 110;
        this.boardColor  = '#1b5e20';

        this.constants = {
            LED_BUILTIN: 13,
            SS:   53,
            MOSI: 51,
            MISO: 50,
            SCK:  52,
            SDA:  20,
            SCL:  21,
            // 아날로그 핀 (디지털 번호로 매핑)
            A0:  54, A1:  55, A2:  56, A3:  57,
            A4:  58, A5:  59, A6:  60, A7:  61,
            A8:  62, A9:  63, A10: 64, A11: 65,
            A12: 66, A13: 67, A14: 68, A15: 69,
        };

        // ── 핀 좌표 정의 ─────────────────────────────────────────
        // 상단 헤더 1열 (D0~D13): y=8,  x= 10~166, 간격 12px
        // 상단 헤더 2열 (D14~D21): y=20, x= 10~94, 간격 12px  (통신 핀)
        // 하단 헤더 (A0~A15 + 전원): y=102, x= 10~202, 간격 12px
        // 오른쪽 헤더 (D22~D53): 2열 × 16핀, x=207/218, y=10~190

        const TOP1_Y = 8;
        const TOP2_Y = 22;
        const BOT_Y  = 102;
        const S      = 12; // 핀 간격

        // PWM 핀 목록
        const PWM_PINS = new Set([2,3,4,5,6,7,8,9,10,11,12,13,44,45,46]);

        // UART 핀 매핑
        const UART_MAP = {
            0:'RX0', 1:'TX0', 14:'TX3', 15:'RX3',
            16:'TX2', 17:'RX2', 18:'TX1', 19:'RX1',
        };

        const makeDigital = (num, x, y) => ({
            number: num,
            name:   `D${num}`,
            label:  PWM_PINS.has(num) ? `~${num}` : (UART_MAP[num] || `${num}`),
            x, y,
            type: 'digital',
            capabilities: [
                ...(PWM_PINS.has(num)    ? ['pwm']  : []),
                ...(UART_MAP[num]        ? ['uart'] : []),
                ...(num === 20           ? ['i2c']  : []),
                ...(num === 21           ? ['i2c']  : []),
                ...(num === 13           ? ['spi', 'builtinLed'] : []),
                ...([50,51,52,53].includes(num) ? ['spi'] : []),
            ],
        });

        this.pins = [];

        // 상단 헤더 1열: D0~D13
        for (let i = 0; i <= 13; i++) {
            this.pins.push(makeDigital(i, 10 + i * S, TOP1_Y));
        }

        // 상단 헤더 2열: D14~D21 (UART + I2C 핀)
        for (let i = 14; i <= 21; i++) {
            this.pins.push(makeDigital(i, 10 + (i - 14) * S, TOP2_Y));
        }

        // 하단 헤더: 전원 + A0~A15
        const powerPins = [
            { number: null, name: 'IOREF', label: 'IOREF', x: 10,  y: BOT_Y, type: 'other', capabilities: [] },
            { number: null, name: 'RST',   label: 'RST',   x: 22,  y: BOT_Y, type: 'reset', capabilities: [] },
            { number: null, name: '3V3',   label: '3.3V',  x: 34,  y: BOT_Y, type: 'power', capabilities: [] },
            { number: null, name: '5V',    label: '5V',    x: 46,  y: BOT_Y, type: 'power', capabilities: [] },
            { number: null, name: 'GND1',  label: 'GND',   x: 58,  y: BOT_Y, type: 'gnd',   capabilities: [] },
            { number: null, name: 'GND2',  label: 'GND',   x: 70,  y: BOT_Y, type: 'gnd',   capabilities: [] },
            { number: null, name: 'VIN',   label: 'Vin',   x: 82,  y: BOT_Y, type: 'power', capabilities: [] },
        ];
        this.pins.push(...powerPins);

        for (let i = 0; i <= 15; i++) {
            this.pins.push({
                number: 54 + i,
                name:   `A${i}`,
                label:  `A${i}`,
                x: 10 + (i + 7) * S,
                y: BOT_Y,
                type: 'analog',
                capabilities: ['adc'],
            });
        }

        // 오른쪽 헤더: D22~D53 (2열, 각 열 16핀)
        // 왼쪽 보조 열: D22,D24,...D52 (짝수)  x=207
        // 오른쪽 보조 열: D23,D25,...D53 (홀수) x=218
        const RIGHT_X1 = 207;
        const RIGHT_X2 = 218;
        const RIGHT_START_Y = 10;
        const RIGHT_SPACING = 6;

        for (let i = 0; i < 16; i++) {
            const evenNum = 22 + i * 2;
            const oddNum  = 23 + i * 2;
            this.pins.push(makeDigital(evenNum, RIGHT_X1, RIGHT_START_Y + i * RIGHT_SPACING));
            this.pins.push(makeDigital(oddNum,  RIGHT_X2, RIGHT_START_Y + i * RIGHT_SPACING));
        }
    }

    /**
     * SVG 레이어에 Arduino Mega 2560 보드를 그립니다.
     *
     * @param {SVGElement} svgLayerEl
     * @param {number} x
     * @param {number} y
     */
    render(svgLayerEl, x, y) {
        // PCB 본체
        this._drawBoard(svgLayerEl, x, y);

        // USB-B 커넥터 (왼쪽 상단)
        this._drawUsb(svgLayerEl, x - 10, y + 12, 12, 16, 'USB-B');

        // DC 잭 (왼쪽 아래)
        svgLayerEl.appendChild(this._el('rect', {
            x: x - 8, y: y + 46, width: 10, height: 14,
            rx: 2, fill: '#555', stroke: '#333', 'stroke-width': 1,
        }));
        svgLayerEl.appendChild(this._el('circle', {
            cx: x - 3, cy: y + 53, r: 3.5, fill: '#222',
        }));

        // MCU 칩 (중앙 좌측)
        this._drawChip(svgLayerEl, x, y, 30, 35, 60, 45);

        // 보드 이름 라벨
        this._drawLabel(svgLayerEl, x, y, 110, 68);

        // 핀 그리기
        for (const pin of this.pins) {
            // 오른쪽 외부 헤더 (x > boardWidth 범위)
            if (pin.x > this.boardWidth) {
                this._drawPin(svgLayerEl, pin, x, y, 'right');
            } else if (pin.y < 15) {
                this._drawPin(svgLayerEl, pin, x, y, 'bottom');
            } else if (pin.y < 30) {
                this._drawPin(svgLayerEl, pin, x, y, 'top');
            } else {
                this._drawPin(svgLayerEl, pin, x, y, 'top');
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.ArduinoMegaBoard = ArduinoMegaBoard;
}
