/**
 * @file ESP32C3.js
 * @brief ESP32-C3 Super Mini 보드 정의 (클래스 기반)
 *
 * 하드웨어 정보:
 *   - MCU: ESP32-C3 (RISC-V 32비트 싱글코어)
 *   - 클럭: 160MHz
 *   - 플래시: 4MB (외부 SPI Flash)
 *   - SRAM: 400KB (ROM 384KB + SRAM 16KB + RTC SRAM 8KB)
 *   - 동작 전압: 3.3V (5V 직접 연결 금지)
 *   - Wi-Fi: 2.4GHz 802.11 b/g/n
 *   - Bluetooth: BLE 5.0
 *   - USB: 내장 USB Full-Speed (CDC-ACM)
 *
 * 핀 구성:
 *   - GPIO: G0~G10, G20(RX), G21(TX)
 *   - ADC: G0~G5 (Wi-Fi 사용 시 불안정)
 *   - PWM(LEDC): 모든 GPIO 사용 가능
 *   - I2C: SDA=G8, SCL=G9 (기본, 변경 가능)
 *   - SPI: SCK=G6, MOSI=G7, MISO=G2, CS=G10
 *   - UART0: RX=G20, TX=G21 (USB CDC)
 *   - LED_BUILTIN: G8 (Active LOW — LOW=켜짐)
 *   - BOOT 버튼: G9
 *
 * 주의사항:
 *   - G8 내장 LED는 Active LOW (LOW=켜짐, HIGH=꺼짐)
 *   - G0: 부팅 스트랩 핀 (LOW=다운로드 모드)
 *   - G9: BOOT 버튼 연결 (INPUT_PULLUP)
 *   - USB CDC On Boot: Enabled 필수 (시리얼 모니터 사용)
 *   - ADC + Wi-Fi 동시 사용 주의
 *
 * SVG 배치:
 *   - 보드 크기: 90×30px (세로 방향 표시)
 *   - 실제 보드: 18mm × 34mm (Super Mini)
 *   - 왼쪽 열 (위→아래, 11핀): G0~G10
 *   - 오른쪽 열 (위→아래, 7핀): 5V, GND, 3V3, G20, G21, RST, GND
 *   - 핀 간격: 25px
 *   - PCB 색상: 진한 녹색 (#1a3a1a)
 *
 * 준비물:
 *   - ESP32-C3 Super Mini 보드
 *   - USB-C 케이블
 *
 * 연결 방법:
 *   - USB-C 케이블로 PC에 연결
 *   - Arduino IDE: 보드 = "ESP32C3 Dev Module"
 *   - USB CDC On Boot: Enabled
 *   - CPU Frequency: 160MHz
 *
 * 참고:
 *   - https://randomnerdtutorials.com/getting-started-esp32-c3-super-mini/
 *   - CLAUDE.md 보드 설정 참조
 */

class ESP32C3Board extends BoardBase {
    constructor() {
        super();

        this.id         = 'esp32-c3';
        this.name       = 'ESP32-C3 Super Mini';
        this.mcu        = 'ESP32-C3';
        this.clockHz    = 160_000_000;
        this.flashBytes = 4 * 1024 * 1024;
        this.sramBytes  = 400 * 1024;

        this.boardWidth  = 90;
        this.boardHeight = 290;  // 세로형 (왼쪽 11핀 × 25px + 여백)
        this.boardColor  = '#1a3a1a'; // 진한 녹색 PCB

        this.builtinLedActiveLow = true;  // G8 LED: LOW=켜짐
        this.adcResolution = 12;          // 12비트 ADC

        this.constants = {
            LED_BUILTIN: 8,   // Active LOW
            BOOT_BUTTON: 9,
            SS:   10,
            MOSI: 7,
            MISO: 2,
            SCK:  6,
            SDA:  8,
            SCL:  9,
        };

        // ── 핀 좌표 ──────────────────────────────────────────────
        const LEFT_X  = 10;
        const RIGHT_X = 80;
        const START_Y = 20;
        const SPACING = 25;
        const ly = i => START_Y + i * SPACING;

        this.pins = [
            // ── 왼쪽 열 (G0~G10) ────────────────────────────────
            {
                number: 0, name: 'G0', label: 'G0',
                x: LEFT_X, y: ly(0), type: 'digital',
                capabilities: ['adc', 'pwm', 'bootButton'],
                // 부팅 스트랩 핀 — LOW = 다운로드 모드
            },
            {
                number: 1, name: 'G1', label: 'G1',
                x: LEFT_X, y: ly(1), type: 'digital',
                capabilities: ['adc', 'pwm'],
            },
            {
                number: 2, name: 'G2', label: 'G2',
                x: LEFT_X, y: ly(2), type: 'digital',
                capabilities: ['adc', 'pwm', 'spi'],
                // SPI MISO 기본
            },
            {
                number: 3, name: 'G3', label: 'G3',
                x: LEFT_X, y: ly(3), type: 'digital',
                capabilities: ['adc', 'pwm'],
            },
            {
                number: 4, name: 'G4', label: 'G4',
                x: LEFT_X, y: ly(4), type: 'digital',
                capabilities: ['adc', 'pwm'],
                // Wi-Fi 활성화 시 ADC 불안정
            },
            {
                number: 5, name: 'G5', label: 'G5',
                x: LEFT_X, y: ly(5), type: 'digital',
                capabilities: ['adc', 'pwm'],
                // Wi-Fi 활성화 시 ADC 불안정
            },
            {
                number: 6, name: 'G6', label: 'G6',
                x: LEFT_X, y: ly(6), type: 'digital',
                capabilities: ['pwm', 'spi'],
                // SPI SCK 기본
            },
            {
                number: 7, name: 'G7', label: 'G7',
                x: LEFT_X, y: ly(7), type: 'digital',
                capabilities: ['pwm', 'spi'],
                // SPI MOSI 기본
            },
            {
                number: 8, name: 'G8', label: 'G8(LED)',
                x: LEFT_X, y: ly(8), type: 'digital',
                capabilities: ['pwm', 'i2c', 'builtinLed'],
                // 내장 LED Active LOW + I2C SDA 기본
            },
            {
                number: 9, name: 'G9', label: 'G9(BOOT)',
                x: LEFT_X, y: ly(9), type: 'digital',
                capabilities: ['pwm', 'i2c', 'bootButton'],
                // BOOT 버튼 + I2C SCL 기본
            },
            {
                number: 10, name: 'G10', label: 'G10',
                x: LEFT_X, y: ly(10), type: 'digital',
                capabilities: ['pwm', 'spi'],
                // SPI CS 기본
            },

            // ── 오른쪽 열 (전원 + UART) ──────────────────────────
            {
                number: null, name: '5V', label: '5V',
                x: RIGHT_X, y: ly(0), type: 'power', capabilities: [],
            },
            {
                number: null, name: 'GND1', label: 'GND',
                x: RIGHT_X, y: ly(1), type: 'gnd', capabilities: [],
            },
            {
                number: null, name: '3V3', label: '3.3V',
                x: RIGHT_X, y: ly(2), type: 'power', capabilities: [],
            },
            {
                number: 20, name: 'G20', label: 'RX/G20',
                x: RIGHT_X, y: ly(3), type: 'digital',
                capabilities: ['pwm', 'uart'],
                // UART0 RX (USB CDC On Boot 활성화 시 Serial)
            },
            {
                number: 21, name: 'G21', label: 'TX/G21',
                x: RIGHT_X, y: ly(4), type: 'digital',
                capabilities: ['pwm', 'uart'],
                // UART0 TX
            },
            {
                number: null, name: 'RST', label: 'RST',
                x: RIGHT_X, y: ly(5), type: 'reset', capabilities: [],
            },
            {
                number: null, name: 'GND2', label: 'GND',
                x: RIGHT_X, y: ly(6), type: 'gnd', capabilities: [],
            },
        ];
    }

    /**
     * SVG 레이어에 ESP32-C3 Super Mini 보드를 그립니다.
     *
     * @param {SVGElement} svgLayerEl
     * @param {number} x
     * @param {number} y
     */
    render(svgLayerEl, x, y) {
        // PCB 본체
        this._drawBoard(svgLayerEl, x, y);

        // USB-C 커넥터 (보드 상단 중앙)
        this._drawUsb(svgLayerEl, x + 30, y - 8, 30, 9, 'USB-C');

        // ESP32-C3 칩 (직접 온보드 — 모듈 아님)
        this._drawChip(svgLayerEl, x, y, 20, 65, 50, 65);

        // Wi-Fi 안테나 (칩 우측 상단에 PCB 패턴 안테나)
        // 구불구불한 안테나 라인
        const antPoints = [
            [x + 72, y + 70],
            [x + 80, y + 70],
            [x + 80, y + 80],
            [x + 72, y + 80],
            [x + 72, y + 90],
            [x + 80, y + 90],
            [x + 80, y + 100],
            [x + 72, y + 100],
            [x + 72, y + 110],
        ].map(([px, py]) => `${px},${py}`).join(' ');

        const antenna = this._el('polyline', {
            points: antPoints,
            fill: 'none',
            stroke: '#c8a800',
            'stroke-width': 1.5,
        });
        svgLayerEl.appendChild(antenna);

        // 보드 이름 라벨
        this._drawLabel(svgLayerEl, x, y, this.boardWidth / 2, 165);

        // 핀 그리기
        for (const pin of this.pins) {
            const side = pin.x < 45 ? 'right' : 'left';
            this._drawPin(svgLayerEl, pin, x, y, side);
        }
    }
}

if (typeof window !== 'undefined') {
    window.ESP32C3Board = ESP32C3Board;
}
