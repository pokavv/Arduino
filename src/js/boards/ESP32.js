/**
 * @file ESP32.js
 * @brief ESP32 (DevKitC / 30핀) 보드 정의
 *
 * 하드웨어 정보:
 *   - MCU: ESP32 (Xtensa LX6 듀얼코어)
 *   - 클럭: 240MHz (최대)
 *   - 플래시: 4MB (외부 SPI Flash)
 *   - SRAM: 520KB
 *   - 동작 전압: 3.3V (5V 직접 연결 금지)
 *   - Wi-Fi: 2.4GHz 802.11 b/g/n
 *   - Bluetooth: 4.2 BR/EDR + BLE
 *
 * 핀 구성:
 *   - GPIO: 0~39 (일부는 입력 전용)
 *   - ADC1: GPIO 32~39 (Wi-Fi 사용 시에도 안정)
 *   - ADC2: GPIO 0,2,4,12~15,25~27 (Wi-Fi 사용 중 사용 불가)
 *   - PWM(LEDC): 모든 GPIO 사용 가능
 *   - DAC: GPIO 25, 26
 *   - I2C: SDA=GPIO21, SCL=GPIO22 (기본, 변경 가능)
 *   - SPI: SCK=GPIO18, MOSI=GPIO23, MISO=GPIO19, SS=GPIO5
 *   - UART0: RX=GPIO3, TX=GPIO1
 *   - LED_BUILTIN: GPIO2 (일부 보드에 따라 다름)
 *
 * 주의사항:
 *   - GPIO 6~11: 내부 Flash 연결 — 사용 금지
 *   - GPIO 34~39: 입력 전용 (출력 불가)
 *   - GPIO 0: 부팅 스트랩 핀 (Float = 정상 부팅, LOW = 다운로드 모드)
 *   - GPIO 12: 부팅 스트랩 핀 (HIGH = 1.8V Flash 모드 → 브릭 주의)
 *   - ADC2는 Wi-Fi 사용 중 사용 불가
 *
 * SVG 배치:
 *   - 보드 크기: 130×35px (세로 방향으로 표시)
 *   - 실제 보드: 48mm × 26mm 기준 (DevKitC 30핀)
 *   - 왼쪽 열 (위→아래, 15핀): 3V3,GND,GPIO15,GPIO2,...
 *   - 오른쪽 열 (위→아래, 15핀): VIN,GND,GPIO13,...
 *   - PCB 색상: 빨간색 (#b71c1c)
 *
 * 준비물:
 *   - ESP32 DevKitC 또는 호환 모듈
 *   - Micro-USB 케이블
 *
 * 연결 방법:
 *   - Micro-USB로 PC에 연결
 *   - 3.3V / GND 핀으로 외부 센서 연결
 *   - GPIO 34~39는 입력만 가능 (풀업/풀다운 내장 없음)
 */

class ESP32Board extends BoardBase {
    constructor() {
        super();

        this.id         = 'esp32';
        this.name       = 'ESP32 DevKit';
        this.mcu        = 'ESP32';
        this.clockHz    = 240_000_000;
        this.flashBytes = 4 * 1024 * 1024;
        this.sramBytes  = 520 * 1024;

        this.boardWidth  = 130;
        this.boardHeight = 340;  // 세로형 (좌우 15핀 × 22px)
        this.boardColor  = '#b71c1c'; // 빨간색 PCB

        this.builtinLedActiveLow = false;
        this.adcResolution = 12;

        this.constants = {
            LED_BUILTIN: 2,
            SS:   5,
            MOSI: 23,
            MISO: 19,
            SCK:  18,
            SDA:  21,
            SCL:  22,
            DAC1: 25,
            DAC2: 26,
            A0:   36,
        };

        // ── 핀 좌표 ──────────────────────────────────────────────
        const LEFT_X   = 10;
        const RIGHT_X  = 120;
        const START_Y  = 20;
        const SPACING  = 20;
        const ly = i => START_Y + i * SPACING;

        // 입력 전용 핀
        const INPUT_ONLY = new Set([34, 35, 36, 39]);
        // 사용 금지 핀 (Flash 연결)
        const RESERVED   = new Set([6, 7, 8, 9, 10, 11]);
        // ADC1 핀 (Wi-Fi 사용 중에도 사용 가능)
        const ADC1_PINS  = new Set([32, 33, 34, 35, 36, 37, 38, 39]);
        // ADC2 핀 (Wi-Fi 사용 불가)
        const ADC2_PINS  = new Set([0, 2, 4, 12, 13, 14, 15, 25, 26, 27]);
        // DAC 핀
        const DAC_PINS   = new Set([25, 26]);
        // PWM 가능 핀 (입력 전용 및 예약 핀 제외)
        const isPwm = n => n !== null && !INPUT_ONLY.has(n) && !RESERVED.has(n);

        const makeCaps = (num) => {
            if (num === null) return [];
            const caps = [];
            if (!INPUT_ONLY.has(num) && !RESERVED.has(num)) caps.push('pwm');
            if (ADC1_PINS.has(num) || ADC2_PINS.has(num)) caps.push('adc');
            if (DAC_PINS.has(num)) caps.push('dac');
            if (num === 21 || num === 22) caps.push('i2c');
            if ([5, 18, 19, 23].includes(num)) caps.push('spi');
            if (num === 1 || num === 3) caps.push('uart');
            if (num === 2) caps.push('builtinLed');
            if (num === 0) caps.push('bootButton');
            return caps;
        };

        const makeGpio = (num, x, y) => ({
            number: num,
            name:   `GPIO${num}`,
            label:  RESERVED.has(num)   ? `G${num}(!)`   :
                    INPUT_ONLY.has(num)  ? `G${num}(in)`  :
                    `G${num}`,
            x, y,
            type: INPUT_ONLY.has(num) ? 'analog' : 'digital',
            capabilities: makeCaps(num),
        });

        this.pins = [];

        // ── 왼쪽 열 (ESP32 DevKitC 30핀 기준) ───────────────────
        const LEFT_PINS = [
            { type: 'power', name: '3V3',  label: '3.3V', num: null },
            { type: 'gnd',   name: 'GND1', label: 'GND',  num: null },
            { gpio: 15 }, { gpio: 2  }, { gpio: 0  }, { gpio: 4  },
            { gpio: 16 }, { gpio: 17 }, { gpio: 5  }, { gpio: 18 },
            { gpio: 19 }, { gpio: 21 }, { gpio: 3  }, { gpio: 1  },
            { gpio: 22 },
        ];

        // ── 오른쪽 열 ────────────────────────────────────────────
        const RIGHT_PINS = [
            { type: 'power', name: 'VIN',  label: '5V',  num: null },
            { type: 'gnd',   name: 'GND2', label: 'GND', num: null },
            { gpio: 13 }, { gpio: 12 }, { gpio: 14 },
            { gpio: 27 }, { gpio: 26 }, { gpio: 25 }, { gpio: 33 },
            { gpio: 32 }, { gpio: 35 }, { gpio: 34 }, { gpio: 39 },
            { gpio: 36 }, { gpio: 23 },
        ];

        LEFT_PINS.forEach((p, i) => {
            if (p.gpio !== undefined) {
                this.pins.push(makeGpio(p.gpio, LEFT_X, ly(i)));
            } else {
                this.pins.push({
                    number: null, name: p.name, label: p.label,
                    x: LEFT_X, y: ly(i),
                    type: p.type, capabilities: [],
                });
            }
        });

        RIGHT_PINS.forEach((p, i) => {
            if (p.gpio !== undefined) {
                this.pins.push(makeGpio(p.gpio, RIGHT_X, ly(i)));
            } else {
                this.pins.push({
                    number: null, name: p.name, label: p.label,
                    x: RIGHT_X, y: ly(i),
                    type: p.type, capabilities: [],
                });
            }
        });
    }

    /**
     * SVG 레이어에 ESP32 DevKit 보드를 그립니다.
     *
     * @param {SVGElement} svgLayerEl
     * @param {number} x
     * @param {number} y
     */
    render(svgLayerEl, x, y) {
        // PCB 본체
        this._drawBoard(svgLayerEl, x, y);

        // Micro-USB 커넥터 (보드 상단 중앙)
        this._drawUsb(svgLayerEl, x + 47, y - 8, 36, 10, 'Micro-USB');

        // ESP32 모듈 (알루미늄 차폐 캔)
        svgLayerEl.appendChild(this._el('rect', {
            x: x + 20, y: y + 60,
            width: 90, height: 120,
            rx: 3, ry: 3,
            fill: '#888', stroke: '#555', 'stroke-width': 1.5,
        }));
        // 모듈 이름
        const modLabel = this._el('text', {
            x: x + 65, y: y + 128,
            'text-anchor': 'middle',
            'font-size': 7, 'font-family': 'monospace',
            fill: '#222', 'font-weight': 'bold',
        });
        modLabel.textContent = 'ESP32';
        svgLayerEl.appendChild(modLabel);

        // 안테나 (오른쪽 상단)
        svgLayerEl.appendChild(this._el('rect', {
            x: x + 95, y: y + 62, width: 14, height: 4,
            fill: '#aaa',
        }));

        // 보드 이름 라벨
        this._drawLabel(svgLayerEl, x, y, this.boardWidth / 2, 210);

        // 핀 그리기
        for (const pin of this.pins) {
            const side = pin.x < 65 ? 'right' : 'left';
            this._drawPin(svgLayerEl, pin, x, y, side);
        }
    }
}

if (typeof window !== 'undefined') {
    window.ESP32Board = ESP32Board;
}
