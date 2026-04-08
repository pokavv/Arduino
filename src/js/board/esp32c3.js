/**
 * @file esp32c3.js
 * @brief ESP32-C3 Super Mini 보드 정의
 *
 * 실제 ESP32-C3 Super Mini 핀아웃 기준으로 작성된 보드 메타데이터입니다.
 *
 * 핀아웃 참고:
 *   - https://randomnerdtutorials.com/getting-started-esp32-c3-super-mini/
 *   - https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf
 *
 * ESP32-C3 Super Mini 특성:
 *   - 동작 전압: 3.3V (5V 직접 연결 금지)
 *   - 내장 LED: G8, Active LOW (LOW = 켜짐)
 *   - BOOT 버튼: G9
 *   - ADC: G0~G5 (Wi-Fi 활성 시 불안정)
 *   - PWM: 모든 GPIO 가능 (LEDC)
 *   - I2C: SDA=G8, SCL=G9 (기본, 변경 가능)
 *   - SPI: SCK=G6, MOSI=G7, MISO=G2, CS=G10
 *   - UART0: RX=G20, TX=G21 (USB CDC)
 *   - Wi-Fi: 2.4GHz 전용
 *   - USB: 내장 USB (CDC-ACM)
 */

/**
 * ESP32-C3 Super Mini 보드 정의 객체
 *
 * 핀 레이아웃:
 *   왼쪽 열 (위→아래): G0, G1, G2, G3, G4, G5, G6, G7, G8, G9, G10
 *   오른쪽 열 (위→아래): 5V, GND, 3.3V, G20(RX), G21(TX), RST, GND
 *
 * SVG 좌표 기준:
 *   boardWidth  = 180px (실제 보드 약 18mm × 34mm, 10배 스케일)
 *   boardHeight = 340px
 *   왼쪽 핀: x = 10
 *   오른쪽 핀: x = 170
 *   첫 핀 y = 30, 핀 간격 = 25px
 */
const ESP32C3 = {
    // ── 보드 기본 정보 ──────────────────────────────────────────
    name:        'ESP32-C3 Super Mini',
    mcu:         'ESP32-C3 (RISC-V 160MHz)',
    flashSize:   '4MB',
    sram:        '400KB',
    voltage:     3.3,
    wifi:        '2.4GHz 802.11 b/g/n',
    bluetooth:   'BLE 5.0',
    usbType:     'USB Type-C (CDC)',

    // ── SVG 렌더링 치수 ──────────────────────────────────────────
    /** 보드 SVG 너비 (px) */
    boardWidth:  180,
    /** 보드 SVG 높이 (px) */
    boardHeight: 340,

    /** 보드 색상 */
    boardColor:  '#1a3a1a',  // 진한 녹색 PCB

    // ── 핀 레이아웃 메타데이터 ────────────────────────────────────
    /**
     * pinLayout: SVG 위치, 핀 배치 방향 정보
     * side: 'left' | 'right' — 보드 좌/우측 열
     */
    pinLayout: {
        leftPins:  ['G0','G1','G2','G3','G4','G5','G6','G7','G8','G9','G10'],
        rightPins: ['5V','GND_TOP','3V3','G20','G21','RST','GND_BOT'],

        // 왼쪽 핀 X 좌표 (핀 헤더 중심)
        leftX:     10,
        // 오른쪽 핀 X 좌표 (핀 헤더 중심)
        rightX:    170,
        // 첫 번째 핀 Y 시작 좌표
        startY:    30,
        // 핀 간격 (px)
        pinSpacing: 25,

        // 칩 위치 (중앙)
        chipX:      55,
        chipY:      120,
        chipWidth:  70,
        chipHeight: 80,
    },

    // ── 핀 정의 배열 ─────────────────────────────────────────────
    /**
     * 각 핀 객체 속성:
     *   number      {number}  Arduino/ESP-IDF 핀 번호
     *   name        {string}  핀 레이블
     *   side        {string}  'left' | 'right' — SVG 배치
     *   index       {number}  해당 열에서의 순서 (0부터)
     *   x           {number}  SVG x 좌표 (px)
     *   y           {number}  SVG y 좌표 (px)
     *
     *   gpio        {boolean} 디지털 I/O 가능
     *   adc         {boolean} ADC (아날로그 읽기) 가능
     *   pwm         {boolean} PWM(LEDC) 출력 가능
     *   i2c         {string}  'SDA' | 'SCL' | null
     *   spi         {string}  'SCK' | 'MOSI' | 'MISO' | 'CS' | null
     *   uart        {string}  'RX' | 'TX' | null
     *   touch       {boolean} 정전식 터치 가능
     *
     *   builtinLed  {boolean} 내장 LED (Active LOW)
     *   bootPin     {boolean} 부팅 관련 핀 (주의 필요)
     *   bootButton  {boolean} BOOT 버튼과 연결
     *
     *   power       {boolean} 전원 핀
     *   ground      {boolean} GND 핀
     *   reset       {boolean} RST 핀
     *   voltage     {number}  전원 핀의 전압
     *
     *   note        {string}  추가 주의 사항
     */
    pins: [
        // ── 왼쪽 열 (위 → 아래) ──────────────────────────────────
        {
            number:     0,
            name:       'G0',
            label:      'GPIO0',
            side:       'left',
            index:      0,
            x:          10,
            y:          30,

            gpio:       true,
            adc:        true,   // ADC1_CH0
            pwm:        true,
            i2c:        null,
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    true,   // BOOT 스트랩 핀 — 주의
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       '부팅 스트랩 핀. LOW로 당기면 다운로드 모드 진입',
            color:      '#ffaa00',  // 주의 핀 색상
        },
        {
            number:     1,
            name:       'G1',
            label:      'GPIO1',
            side:       'left',
            index:      1,
            x:          10,
            y:          55,

            gpio:       true,
            adc:        true,   // ADC1_CH1
            pwm:        true,
            i2c:        null,
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       null,
            color:      '#4CAF50',
        },
        {
            number:     2,
            name:       'G2',
            label:      'GPIO2',
            side:       'left',
            index:      2,
            x:          10,
            y:          80,

            gpio:       true,
            adc:        true,   // ADC1_CH2
            pwm:        true,
            i2c:        null,
            spi:        'MISO', // SPI MISO (기본)
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       'SPI MISO (기본 할당)',
            color:      '#4CAF50',
        },
        {
            number:     3,
            name:       'G3',
            label:      'GPIO3',
            side:       'left',
            index:      3,
            x:          10,
            y:          105,

            gpio:       true,
            adc:        true,   // ADC1_CH3
            pwm:        true,
            i2c:        null,
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       null,
            color:      '#4CAF50',
        },
        {
            number:     4,
            name:       'G4',
            label:      'GPIO4',
            side:       'left',
            index:      4,
            x:          10,
            y:          130,

            gpio:       true,
            adc:        true,   // ADC1_CH4 (ADC2 — Wi-Fi 사용 시 부정확)
            pwm:        true,
            i2c:        null,
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       'Wi-Fi 활성화 시 ADC 불안정',
            color:      '#4CAF50',
        },
        {
            number:     5,
            name:       'G5',
            label:      'GPIO5',
            side:       'left',
            index:      5,
            x:          10,
            y:          155,

            gpio:       true,
            adc:        true,   // ADC2_CH0 — Wi-Fi 사용 시 부정확
            pwm:        true,
            i2c:        null,
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       'Wi-Fi 활성화 시 ADC 불안정',
            color:      '#4CAF50',
        },
        {
            number:     6,
            name:       'G6',
            label:      'GPIO6',
            side:       'left',
            index:      6,
            x:          10,
            y:          180,

            gpio:       true,
            adc:        false,
            pwm:        true,
            i2c:        null,
            spi:        'SCK',  // SPI SCK (기본)
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       'SPI SCK (기본 할당)',
            color:      '#4CAF50',
        },
        {
            number:     7,
            name:       'G7',
            label:      'GPIO7',
            side:       'left',
            index:      7,
            x:          10,
            y:          205,

            gpio:       true,
            adc:        false,
            pwm:        true,
            i2c:        null,
            spi:        'MOSI', // SPI MOSI (기본)
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       'SPI MOSI (기본 할당)',
            color:      '#4CAF50',
        },
        {
            number:     8,
            name:       'G8',
            label:      'GPIO8',
            side:       'left',
            index:      8,
            x:          10,
            y:          230,

            gpio:       true,
            adc:        false,
            pwm:        true,
            i2c:        'SDA',  // I2C SDA (기본)
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: true,   // Active LOW — LOW = 켜짐
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       '내장 LED (Active LOW: LOW=켜짐, HIGH=꺼짐). I2C SDA 기본 핀',
            color:      '#2196F3',  // 내장 LED — 파란색
        },
        {
            number:     9,
            name:       'G9',
            label:      'GPIO9',
            side:       'left',
            index:      9,
            x:          10,
            y:          255,

            gpio:       true,
            adc:        false,
            pwm:        true,
            i2c:        'SCL',  // I2C SCL (기본)
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    true,   // 내장 BOOT 버튼과 연결
            bootButton: true,

            power:      false,
            ground:     false,
            reset:      false,

            note:       'BOOT 버튼 연결 (INPUT_PULLUP 기본). I2C SCL 기본 핀',
            color:      '#ff9800',  // 주의 핀
        },
        {
            number:     10,
            name:       'G10',
            label:      'GPIO10',
            side:       'left',
            index:      10,
            x:          10,
            y:          280,

            gpio:       true,
            adc:        false,
            pwm:        true,
            i2c:        null,
            spi:        'CS',   // SPI CS (기본)
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       'SPI CS (기본 할당)',
            color:      '#4CAF50',
        },

        // ── 오른쪽 열 (위 → 아래) ────────────────────────────────
        {
            number:     null,
            name:       '5V',
            label:      '5V',
            side:       'right',
            index:      0,
            x:          170,
            y:          30,

            gpio:       false,
            adc:        false,
            pwm:        false,
            i2c:        null,
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      true,
            ground:     false,
            reset:      false,
            voltage:    5.0,

            note:       'USB 5V 전원 (ESP32-C3는 3.3V 동작 — 직접 핀에 5V 금지)',
            color:      '#f44336',  // 빨간색 (전원)
        },
        {
            number:     null,
            name:       'GND',
            label:      'GND',
            side:       'right',
            index:      1,
            x:          170,
            y:          55,

            gpio:       false,
            adc:        false,
            pwm:        false,
            i2c:        null,
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     true,
            reset:      false,
            voltage:    0,

            note:       '접지',
            color:      '#212121',  // 검은색 (GND)
        },
        {
            number:     null,
            name:       '3V3',
            label:      '3.3V',
            side:       'right',
            index:      2,
            x:          170,
            y:          80,

            gpio:       false,
            adc:        false,
            pwm:        false,
            i2c:        null,
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      true,
            ground:     false,
            reset:      false,
            voltage:    3.3,

            note:       '3.3V 레귤레이터 출력 (최대 600mA)',
            color:      '#f44336',
        },
        {
            number:     20,
            name:       'G20',
            label:      'GPIO20 / RX',
            side:       'right',
            index:      3,
            x:          170,
            y:          105,

            gpio:       true,
            adc:        false,
            pwm:        true,
            i2c:        null,
            spi:        null,
            uart:       'RX',   // UART0 RX (USB CDC)
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       'UART0 RX. USB CDC On Boot 활성화 시 Serial 모니터로 사용',
            color:      '#9C27B0',  // 보라색 (UART)
        },
        {
            number:     21,
            name:       'G21',
            label:      'GPIO21 / TX',
            side:       'right',
            index:      4,
            x:          170,
            y:          130,

            gpio:       true,
            adc:        false,
            pwm:        true,
            i2c:        null,
            spi:        null,
            uart:       'TX',   // UART0 TX (USB CDC)
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      false,

            note:       'UART0 TX. USB CDC On Boot 활성화 시 Serial 모니터로 사용',
            color:      '#9C27B0',
        },
        {
            number:     null,
            name:       'RST',
            label:      'RST',
            side:       'right',
            index:      5,
            x:          170,
            y:          155,

            gpio:       false,
            adc:        false,
            pwm:        false,
            i2c:        null,
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     false,
            reset:      true,

            note:       '리셋 핀. LOW로 당기면 칩 리셋',
            color:      '#607D8B',  // 회색 (RST)
        },
        {
            number:     null,
            name:       'GND2',
            label:      'GND',
            side:       'right',
            index:      6,
            x:          170,
            y:          180,

            gpio:       false,
            adc:        false,
            pwm:        false,
            i2c:        null,
            spi:        null,
            uart:       null,
            touch:      false,

            builtinLed: false,
            bootPin:    false,
            bootButton: false,

            power:      false,
            ground:     true,
            reset:      false,
            voltage:    0,

            note:       '접지 (두 번째)',
            color:      '#212121',
        },
    ],

    // ── 기능별 핀 빠른 참조 ─────────────────────────────────────
    /**
     * 기능별 핀 번호 빠른 참조 맵
     */
    pinGroups: {
        /** ADC 사용 가능 핀 번호 목록 */
        adc:        [0, 1, 2, 3, 4, 5],

        /** PWM 사용 가능 핀 번호 목록 (GPIO는 모두 가능) */
        pwm:        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 21],

        /** I2C 기본 핀 */
        i2c: {
            sda: 8,
            scl: 9,
        },

        /** SPI 기본 핀 */
        spi: {
            sck:  6,
            mosi: 7,
            miso: 2,
            cs:   10,
        },

        /** UART0 핀 (USB CDC) */
        uart0: {
            rx: 20,
            tx: 21,
        },

        /** 내장 LED */
        builtinLed: 8,

        /** BOOT 버튼 */
        bootButton: 9,

        /** 부팅 스트랩 핀 (주의 필요) */
        bootPins: [0, 9],
    },

    // ── Arduino IDE 설정 ─────────────────────────────────────────
    /**
     * Arduino IDE 권장 보드 설정
     */
    arduinoSettings: {
        board:          'ESP32C3 Dev Module',
        usbCdcOnBoot:   'Enabled',
        cpuFrequency:   '160MHz',
        flashSize:      '4MB (32Mb)',
        uploadSpeed:    921600,
        flashMode:      'QIO',
        partitionScheme:'Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)',
    },

    // ── 유틸리티 메서드 ──────────────────────────────────────────

    /**
     * 핀 번호로 핀 정의 객체를 찾습니다.
     * @param {number} pinNumber - GPIO 핀 번호
     * @returns {object|null}
     */
    getPinByNumber(pinNumber) {
        return this.pins.find(p => p.number === pinNumber) || null;
    },

    /**
     * 핀 이름으로 핀 정의 객체를 찾습니다.
     * @param {string} name - 핀 이름 (예: 'G8', '3V3')
     * @returns {object|null}
     */
    getPinByName(name) {
        return this.pins.find(p => p.name === name || p.label === name) || null;
    },

    /**
     * ADC 핀인지 확인합니다.
     * @param {number} pinNumber
     * @returns {boolean}
     */
    isAdcPin(pinNumber) {
        return this.pinGroups.adc.includes(pinNumber);
    },

    /**
     * PWM 핀인지 확인합니다.
     * @param {number} pinNumber
     * @returns {boolean}
     */
    isPwmPin(pinNumber) {
        return this.pinGroups.pwm.includes(pinNumber);
    },

    /**
     * 부팅 시 주의가 필요한 핀인지 확인합니다.
     * @param {number} pinNumber
     * @returns {boolean}
     */
    isBootPin(pinNumber) {
        return this.pinGroups.bootPins.includes(pinNumber);
    },

    /**
     * 모든 GPIO 핀 목록을 반환합니다 (전원/GND 제외).
     * @returns {object[]}
     */
    getGpioPins() {
        return this.pins.filter(p => p.gpio === true);
    },

    /**
     * 핀의 SVG 위치를 계산합니다.
     * @param {string} side  - 'left' | 'right'
     * @param {number} index - 열에서의 순서 (0부터)
     * @returns {{ x: number, y: number }}
     */
    getPinPosition(side, index) {
        const layout = this.pinLayout;
        return {
            x: side === 'left' ? layout.leftX : layout.rightX,
            y: layout.startY + index * layout.pinSpacing,
        };
    },
};

// 전역으로 노출 (script 태그 로드 호환)
if (typeof window !== 'undefined') {
    window.ESP32C3 = ESP32C3;
}
