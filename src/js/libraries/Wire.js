/**
 * @file Wire.js
 * @brief Arduino Wire (I2C) 라이브러리 시뮬레이션
 *
 * 실제 Arduino Wire API를 그대로 에뮬레이션합니다.
 *
 * 사용법:
 *   Wire.begin();
 *   Wire.beginTransmission(addr);
 *   Wire.write(val);
 *   Wire.endTransmission();
 *   Wire.requestFrom(addr, count);
 *   Wire.available();
 *   Wire.read();
 *
 * 동작 방식:
 *   - I2C 장치 레지스트리(address → 핸들러 객체) 를 통해
 *     circuit의 OLED, LCD, MPU6050, BMP280 등과 통신합니다.
 *   - window.currentCircuit.getAllComponents()에서 I2C 장치를 자동 탐색합니다.
 *   - 장치 핸들러는 wire.registerDevice(addr, handler)로 등록합니다.
 *
 * 핸들러 인터페이스:
 *   handler.onReceive(data: number[]) — 마스터 → 슬레이브 데이터 전송
 *   handler.onRequest()              — 마스터 읽기 요청 시 데이터 준비
 *   handler.read()                   — 슬레이브 → 마스터 1바이트 반환
 *   handler.available()              — 읽을 수 있는 바이트 수
 */

(function(global) {
    'use strict';

    /**
     * I2C 통신 클래스 (Arduino Wire 에뮬레이션)
     */
    function WireClass() {
        /** 현재 전송 대상 주소 */
        this._txAddress = 0;

        /** 전송 버퍼 (write()로 쌓인 바이트) */
        this._txBuffer = [];

        /** 수신 버퍼 (requestFrom() 응답 바이트) */
        this._rxBuffer = [];

        /** I2C 장치 레지스트리: { address(number) → handler } */
        this._devices = {};

        /** 초기화 완료 여부 */
        this._initialized = false;

        /** SCL 주파수 (Hz) */
        this._clock = 100000;
    }

    /**
     * I2C 마스터로 초기화합니다.
     * @param {number} [sda] - SDA 핀 (시뮬레이터에서 무시)
     * @param {number} [scl] - SCL 핀 (시뮬레이터에서 무시)
     */
    WireClass.prototype.begin = function(sda, scl) {
        this._initialized = true;
        this._txBuffer = [];
        this._rxBuffer = [];

        // circuit에서 I2C 주소가 있는 컴포넌트를 자동 등록
        this._autoRegisterComponents();

        console.log('[Wire] I2C 초기화 완료 (SDA=' + (sda || 'default') +
                    ', SCL=' + (scl || 'default') + ')');
    };

    /**
     * I2C 전송 시작
     * @param {number} address - 7비트 I2C 주소
     */
    WireClass.prototype.beginTransmission = function(address) {
        this._txAddress = address & 0x7F;
        this._txBuffer = [];
    };

    /**
     * 전송 버퍼에 데이터를 씁니다.
     * @param {number|number[]|string} data - 바이트 또는 배열 또는 문자열
     * @returns {number} 쓴 바이트 수
     */
    WireClass.prototype.write = function(data) {
        if (Array.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                this._txBuffer.push(data[i] & 0xFF);
            }
            return data.length;
        }
        if (typeof data === 'string') {
            for (var j = 0; j < data.length; j++) {
                this._txBuffer.push(data.charCodeAt(j) & 0xFF);
            }
            return data.length;
        }
        this._txBuffer.push((data >>> 0) & 0xFF);
        return 1;
    };

    /**
     * 전송 버퍼를 해당 주소로 전송하고 완료합니다.
     * @param {boolean} [sendStop=true] - STOP 조건 전송 여부 (시뮬레이터 무시)
     * @returns {number} 0=성공, 1=버퍼 오버플로우, 2=NACK(주소), 3=NACK(데이터), 4=기타
     */
    WireClass.prototype.endTransmission = function(sendStop) {
        var addr    = this._txAddress;
        var handler = this._getDevice(addr);

        if (!handler) {
            console.warn('[Wire] endTransmission: I2C 주소 0x' +
                         addr.toString(16).toUpperCase() + ' 장치 없음');
            this._txBuffer = [];
            return 2; // NACK on address
        }

        if (typeof handler.onReceive === 'function') {
            try {
                handler.onReceive(this._txBuffer.slice());
            } catch (e) {
                console.warn('[Wire] onReceive 오류:', e);
            }
        }

        this._txBuffer = [];
        return 0; // 성공
    };

    /**
     * 슬레이브 장치에 읽기 요청을 보냅니다.
     * @param {number} address  - 7비트 I2C 주소
     * @param {number} quantity - 요청할 바이트 수
     * @param {boolean} [sendStop=true] - STOP 조건 (시뮬레이터 무시)
     * @returns {number} 수신된 바이트 수
     */
    WireClass.prototype.requestFrom = function(address, quantity, sendStop) {
        var addr    = address & 0x7F;
        var handler = this._getDevice(addr);

        this._rxBuffer = [];

        if (!handler) {
            console.warn('[Wire] requestFrom: I2C 주소 0x' +
                         addr.toString(16).toUpperCase() + ' 장치 없음');
            return 0;
        }

        // 장치에 읽기 요청
        if (typeof handler.onRequest === 'function') {
            try {
                handler.onRequest(quantity);
            } catch (e) {
                console.warn('[Wire] onRequest 오류:', e);
            }
        }

        // 장치에서 데이터를 수신 버퍼로 옮김
        var count = 0;
        while (count < quantity) {
            var avail = typeof handler.available === 'function' ? handler.available() : 0;
            if (avail <= 0) break;
            var byte = typeof handler.read === 'function' ? handler.read() : -1;
            if (byte < 0) break;
            this._rxBuffer.push(byte & 0xFF);
            count++;
        }

        return this._rxBuffer.length;
    };

    /**
     * 수신 버퍼에 읽을 수 있는 바이트 수를 반환합니다.
     * @returns {number}
     */
    WireClass.prototype.available = function() {
        return this._rxBuffer.length;
    };

    /**
     * 수신 버퍼에서 바이트 하나를 읽습니다.
     * @returns {number} 0~255, 또는 -1 (버퍼 비어있음)
     */
    WireClass.prototype.read = function() {
        if (this._rxBuffer.length === 0) return -1;
        return this._rxBuffer.shift();
    };

    /**
     * I2C 클럭 주파수를 설정합니다.
     * @param {number} frequency - Hz (예: 100000, 400000)
     */
    WireClass.prototype.setClock = function(frequency) {
        this._clock = frequency;
        console.log('[Wire] setClock: ' + frequency + ' Hz');
    };

    /**
     * I2C 장치 핸들러를 등록합니다.
     * 라이브러리 내부에서 또는 컴포넌트에서 호출합니다.
     * @param {number} address - 7비트 I2C 주소
     * @param {object} handler - { onReceive(data[]), onRequest(qty), read(), available() }
     */
    WireClass.prototype.registerDevice = function(address, handler) {
        this._devices[address & 0x7F] = handler;
        console.log('[Wire] 장치 등록: 0x' + (address & 0x7F).toString(16).toUpperCase());
    };

    /**
     * 등록된 I2C 장치 핸들러를 제거합니다.
     * @param {number} address
     */
    WireClass.prototype.unregisterDevice = function(address) {
        delete this._devices[address & 0x7F];
    };

    /**
     * 등록된 장치를 주소로 조회합니다.
     * @private
     */
    WireClass.prototype._getDevice = function(address) {
        var addr = address & 0x7F;
        // 직접 등록된 장치 먼저 확인
        if (this._devices[addr]) return this._devices[addr];

        // circuit에서 동적으로 찾기
        return this._findInCircuit(addr);
    };

    /**
     * circuit editor의 컴포넌트에서 해당 I2C 주소를 가진 장치를 찾습니다.
     * @private
     */
    WireClass.prototype._findInCircuit = function(address) {
        var circuit = (typeof window !== 'undefined') ? window.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return null;

        var comps = circuit.getAllComponents();
        for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            // i2cAddress 속성 또는 _i2cAddress 속성으로 매칭
            var compAddr = comp.i2cAddress !== undefined ? comp.i2cAddress :
                           comp._i2cAddress !== undefined ? comp._i2cAddress : null;
            if (compAddr !== null && (compAddr & 0x7F) === address) {
                return comp;
            }
        }
        return null;
    };

    /**
     * circuit의 I2C 컴포넌트를 자동으로 레지스트리에 등록합니다.
     * @private
     */
    WireClass.prototype._autoRegisterComponents = function() {
        var circuit = (typeof window !== 'undefined') ? window.currentCircuit : null;
        if (!circuit || typeof circuit.getAllComponents !== 'function') return;

        var self  = this;
        var comps = circuit.getAllComponents();
        comps.forEach(function(comp) {
            var addr = comp.i2cAddress !== undefined ? comp.i2cAddress :
                       comp._i2cAddress !== undefined ? comp._i2cAddress : null;
            if (addr !== null) {
                self._devices[addr & 0x7F] = comp;
                console.log('[Wire] 자동 등록: ' + comp.type +
                            ' @ 0x' + (addr & 0x7F).toString(16).toUpperCase());
            }
        });
    };

    /**
     * I2C 버스를 리셋합니다.
     */
    WireClass.prototype.reset = function() {
        this._txBuffer = [];
        this._rxBuffer = [];
        this._txAddress = 0;
        this._initialized = false;
        this._devices = {};
    };

    // 싱글턴 인스턴스
    var Wire = new WireClass();

    // window.WireLib 으로 노출
    global.WireLib = {
        Wire:      Wire,
        WireClass: WireClass,

        /**
         * app.js _buildGlobals()에서 호출하는 팩토리 메서드.
         * runtime 참조를 Wire에 연결하고 Wire 싱글턴을 반환합니다.
         * @param {ArduinoRuntime} runtime
         * @returns {WireClass}
         */
        getInstance: function(runtime) {
            // circuit 참조를 Wire 내부에서 접근할 수 있도록
            // runtime은 사용하지 않지만 API 호환성 유지
            Wire._autoRegisterComponents();
            return Wire;
        }
    };

    // 편의 직접 참조
    global.Wire = Wire;

})(typeof window !== 'undefined' ? window : this);
