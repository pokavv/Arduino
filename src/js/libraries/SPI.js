/**
 * @file SPI.js
 * @brief Arduino SPI 라이브러리 시뮬레이션
 *
 * 실제 Arduino SPI API를 에뮬레이션합니다.
 *
 * 사용법:
 *   SPI.begin();
 *   SPI.beginTransaction(SPISettings(speed, bitOrder, dataMode));
 *   byte result = SPI.transfer(data);
 *   SPI.endTransaction();
 *   SPI.end();
 *
 * SPI 설정:
 *   SPISettings(speed, bitOrder, dataMode)
 *   - bitOrder: MSBFIRST(1) / LSBFIRST(0)
 *   - dataMode: SPI_MODE0(0) ~ SPI_MODE3(3)
 *
 * 동작:
 *   - circuit의 SPI 장치(CS 핀 기준)를 찾아 데이터를 주고받습니다.
 *   - 장치는 registerDevice(csPin, handler)로 등록합니다.
 */

(function(global) {
    'use strict';

    // ── SPI 상수 ──────────────────────────────────────────────────────────────
    var MSBFIRST = 1;
    var LSBFIRST = 0;
    var SPI_MODE0 = 0x00;
    var SPI_MODE1 = 0x04;
    var SPI_MODE2 = 0x08;
    var SPI_MODE3 = 0x0C;

    /**
     * SPISettings — SPI 트랜잭션 설정
     * @param {number} speed    - 클럭 속도 (Hz)
     * @param {number} bitOrder - MSBFIRST(1) | LSBFIRST(0)
     * @param {number} dataMode - SPI_MODE0 ~ SPI_MODE3
     */
    function SPISettings(speed, bitOrder, dataMode) {
        this.speed    = speed    || 1000000;
        this.bitOrder = (bitOrder !== undefined) ? bitOrder : MSBFIRST;
        this.dataMode = (dataMode !== undefined) ? dataMode : SPI_MODE0;
    }

    /**
     * SPI 클래스 (Arduino SPI 에뮬레이션)
     */
    function SPIClass() {
        /** 초기화 여부 */
        this._initialized = false;

        /** 현재 트랜잭션 설정 */
        this._settings = new SPISettings(1000000, MSBFIRST, SPI_MODE0);

        /** 트랜잭션 진행 중 여부 */
        this._inTransaction = false;

        /** CS 핀 → 장치 핸들러 맵 */
        this._devices = {};

        /** 활성화된 CS 핀 */
        this._activeCs = null;

        /** MOSI 핀 */
        this._mosiPin = null;

        /** MISO 핀 */
        this._misoPin = null;

        /** SCK 핀 */
        this._sckPin = null;
    }

    /**
     * SPI 버스를 초기화합니다.
     * @param {number} [sck]  - SCK 핀 (시뮬레이터 무시)
     * @param {number} [miso] - MISO 핀
     * @param {number} [mosi] - MOSI 핀
     * @param {number} [ss]   - SS 핀
     */
    SPIClass.prototype.begin = function(sck, miso, mosi, ss) {
        this._sckPin  = sck  || null;
        this._misoPin = miso || null;
        this._mosiPin = mosi || null;
        this._initialized = true;
        console.log('[SPI] 초기화 완료');
    };

    /**
     * SPI 버스를 종료합니다.
     */
    SPIClass.prototype.end = function() {
        this._initialized = false;
        this._inTransaction = false;
        this._activeCs = null;
        console.log('[SPI] 종료');
    };

    /**
     * SPI 트랜잭션을 시작합니다.
     * @param {SPISettings} settings
     */
    SPIClass.prototype.beginTransaction = function(settings) {
        this._settings = settings || new SPISettings();
        this._inTransaction = true;
    };

    /**
     * SPI 트랜잭션을 종료합니다.
     */
    SPIClass.prototype.endTransaction = function() {
        this._inTransaction = false;
    };

    /**
     * 1바이트를 전송하고 수신 바이트를 반환합니다.
     * @param {number} data - 전송할 바이트 (0~255)
     * @returns {number} 수신 바이트 (0~255)
     */
    SPIClass.prototype.transfer = function(data) {
        data = (data >>> 0) & 0xFF;

        // 비트 순서 변환 (LSBFIRST)
        if (this._settings.bitOrder === LSBFIRST) {
            data = this._reverseBits(data);
        }

        // 활성 CS 핀에 연결된 장치에서 응답 받기
        var handler = this._activeCs !== null ? this._devices[this._activeCs] : null;
        var rxByte  = 0xFF; // 기본: 버스 아이들(high)

        if (handler && typeof handler.transfer === 'function') {
            try {
                rxByte = handler.transfer(data) & 0xFF;
            } catch (e) {
                console.warn('[SPI] transfer 오류:', e);
            }
        }

        // 비트 순서 역변환
        if (this._settings.bitOrder === LSBFIRST) {
            rxByte = this._reverseBits(rxByte);
        }

        return rxByte;
    };

    /**
     * 16비트 값을 전송합니다.
     * @param {number} data - 16비트 값
     * @returns {number} 수신 16비트 값
     */
    SPIClass.prototype.transfer16 = function(data) {
        var high = this.transfer((data >> 8) & 0xFF);
        var low  = this.transfer(data & 0xFF);
        return (high << 8) | low;
    };

    /**
     * 버퍼를 전송합니다 (in-place).
     * @param {number[]|Uint8Array} buf  - 전송/수신 버퍼
     * @param {number}              size - 바이트 수
     */
    SPIClass.prototype.transferBytes = function(buf, size) {
        var len = size !== undefined ? size : buf.length;
        for (var i = 0; i < len; i++) {
            buf[i] = this.transfer(buf[i]);
        }
    };

    /**
     * 활성 CS 핀을 설정합니다.
     * (CS LOW → 장치 선택에 해당하며, 여기서는 핀 번호로 관리)
     * @param {number} csPin - CS 핀 번호
     */
    SPIClass.prototype.setActiveCs = function(csPin) {
        this._activeCs = csPin;
    };

    /**
     * SPI 장치 핸들러를 등록합니다.
     * @param {number} csPin   - CS 핀 번호
     * @param {object} handler - { transfer(byte): byte }
     */
    SPIClass.prototype.registerDevice = function(csPin, handler) {
        this._devices[csPin] = handler;
        console.log('[SPI] 장치 등록: CS 핀 ' + csPin);
    };

    /**
     * SPI 장치 핸들러를 제거합니다.
     * @param {number} csPin
     */
    SPIClass.prototype.unregisterDevice = function(csPin) {
        delete this._devices[csPin];
    };

    /**
     * GPIO 핀이 LOW가 되면 해당 CS 핀을 자동으로 활성화합니다.
     * (runtime의 gpio-change 이벤트에 연결하여 사용)
     * @param {number} pin   - CS 핀 번호
     * @param {number} value - HIGH(1) | LOW(0)
     */
    SPIClass.prototype.onGpioChange = function(pin, value) {
        if (this._devices[pin] !== undefined) {
            // CS LOW → 장치 선택
            if (value === 0) {
                this._activeCs = pin;
            } else {
                // CS HIGH → 선택 해제
                if (this._activeCs === pin) {
                    this._activeCs = null;
                }
            }
        }
    };

    /**
     * SPI 버스를 리셋합니다.
     */
    SPIClass.prototype.reset = function() {
        this._initialized   = false;
        this._inTransaction = false;
        this._activeCs      = null;
        this._devices       = {};
    };

    /**
     * 바이트의 비트 순서를 역전합니다.
     * @private
     */
    SPIClass.prototype._reverseBits = function(b) {
        b = (b & 0xF0) >> 4 | (b & 0x0F) << 4;
        b = (b & 0xCC) >> 2 | (b & 0x33) << 2;
        b = (b & 0xAA) >> 1 | (b & 0x55) << 1;
        return b & 0xFF;
    };

    // 싱글턴 인스턴스
    var SPI = new SPIClass();

    // window.SPILib 으로 노출
    global.SPILib = {
        SPI:         SPI,
        SPIClass:    SPIClass,
        SPISettings: SPISettings,
        MSBFIRST:    MSBFIRST,
        LSBFIRST:    LSBFIRST,
        SPI_MODE0:   SPI_MODE0,
        SPI_MODE1:   SPI_MODE1,
        SPI_MODE2:   SPI_MODE2,
        SPI_MODE3:   SPI_MODE3,

        /**
         * app.js _buildGlobals()에서 호출하는 팩토리 메서드.
         * runtime의 gpio-change 이벤트를 SPI CS 핀 관리와 연결합니다.
         * @param {ArduinoRuntime} runtime
         * @returns {SPIClass}
         */
        getInstance: function(runtime) {
            if (runtime && typeof runtime.on === 'function') {
                runtime.on('gpio-change', function(pin, value) {
                    SPI.onGpioChange(pin, value);
                });
            }
            return SPI;
        }
    };

    // 편의 직접 참조
    global.SPI         = SPI;
    global.SPISettings = SPISettings;
    global.MSBFIRST    = MSBFIRST;
    global.LSBFIRST    = LSBFIRST;
    global.SPI_MODE0   = SPI_MODE0;
    global.SPI_MODE1   = SPI_MODE1;
    global.SPI_MODE2   = SPI_MODE2;
    global.SPI_MODE3   = SPI_MODE3;

})(typeof window !== 'undefined' ? window : this);
