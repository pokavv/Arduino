/**
 * @file EEPROM.js
 * @brief Arduino EEPROM 라이브러리 시뮬레이션
 *
 * 실제 Arduino EEPROM API를 에뮬레이션합니다.
 * 내부적으로 localStorage를 사용하여 시뮬레이션 세션 간 데이터를 유지합니다.
 *
 * 사용법:
 *   EEPROM.read(addr)            → byte
 *   EEPROM.write(addr, val)
 *   EEPROM.update(addr, val)     // 값이 다를 때만 쓰기
 *   EEPROM.get(addr, variable)   // 구조체/타입 읽기
 *   EEPROM.put(addr, variable)   // 구조체/타입 쓰기
 *   EEPROM.length()              → 크기 (bytes)
 *   EEPROM.commit()              // ESP32: 변경사항 플래시에 저장
 *   EEPROM.begin(size)           // ESP32: 초기화
 *
 * ESP32 EEPROM 크기: 512 bytes (기본값, begin()으로 변경 가능)
 *
 * localStorage 키: 'arduino_eeprom_v1'
 */

(function(global) {
    'use strict';

    /** EEPROM 기본 크기 (bytes) — ESP32는 begin(size)로 설정 */
    var DEFAULT_SIZE = 512;

    /** localStorage 저장 키 */
    var STORAGE_KEY = 'arduino_eeprom_v1';

    /**
     * EEPROM 클래스
     */
    function EEPROMClass() {
        /** EEPROM 크기 */
        this._size = DEFAULT_SIZE;

        /** 내부 데이터 배열 (Uint8Array) */
        this._data = null;

        /** ESP32 모드에서 dirty 여부 (commit() 전까지 미저장) */
        this._dirty = false;

        /** 초기화 여부 */
        this._initialized = false;

        // 즉시 로드 (일반 Arduino 모드)
        this._load();
    }

    /**
     * EEPROM을 초기화합니다 (ESP32 전용).
     * @param {number} size - EEPROM 크기 (바이트, 1~4096)
     * @returns {boolean} 성공 여부
     */
    EEPROMClass.prototype.begin = function(size) {
        size = parseInt(size, 10);
        if (isNaN(size) || size < 1) size = DEFAULT_SIZE;
        if (size > 4096) size = 4096;

        this._size = size;
        this._load();
        this._initialized = true;
        console.log('[EEPROM] 초기화: ' + size + ' bytes');
        return true;
    };

    /**
     * 지정 주소의 바이트를 읽습니다.
     * @param {number} addr - 주소 (0 ~ length-1)
     * @returns {number} 0~255, 주소 범위 초과 시 -1
     */
    EEPROMClass.prototype.read = function(addr) {
        addr = parseInt(addr, 10);
        if (addr < 0 || addr >= this._size) {
            console.warn('[EEPROM] read: 주소 ' + addr + ' 범위 초과');
            return -1;
        }
        return this._data[addr];
    };

    /**
     * 지정 주소에 바이트를 씁니다.
     * @param {number} addr - 주소 (0 ~ length-1)
     * @param {number} val  - 값 (0~255)
     */
    EEPROMClass.prototype.write = function(addr, val) {
        addr = parseInt(addr, 10);
        val  = (parseInt(val, 10) >>> 0) & 0xFF;

        if (addr < 0 || addr >= this._size) {
            console.warn('[EEPROM] write: 주소 ' + addr + ' 범위 초과');
            return;
        }

        this._data[addr] = val;
        this._dirty = true;

        // 일반 Arduino 모드: 즉시 저장
        if (!this._initialized) {
            this._save();
        }
    };

    /**
     * 현재 값과 다를 때만 씁니다 (쓰기 횟수 절약).
     * @param {number} addr - 주소
     * @param {number} val  - 새 값 (0~255)
     */
    EEPROMClass.prototype.update = function(addr, val) {
        addr = parseInt(addr, 10);
        val  = (parseInt(val, 10) >>> 0) & 0xFF;

        if (this.read(addr) !== val) {
            this.write(addr, val);
        }
    };

    /**
     * 지정 주소에서 데이터를 읽어 객체에 저장합니다.
     * JavaScript에서는 기본 타입(number/boolean)과 객체를 지원합니다.
     *
     * @param {number} addr - 시작 주소
     * @param {*}      obj  - 참조 (반환값을 사용하세요)
     * @returns {*} 읽은 값
     */
    EEPROMClass.prototype.get = function(addr, obj) {
        addr = parseInt(addr, 10);

        if (typeof obj === 'number' || obj === undefined) {
            // float (4바이트) 읽기
            return this._readFloat(addr);
        }

        if (typeof obj === 'boolean') {
            return this._data[addr] !== 0;
        }

        if (typeof obj === 'object' && obj !== null) {
            // 객체: JSON 직렬화 길이를 첫 2바이트에 저장한 방식으로 읽기
            var len = (this._data[addr] << 8) | this._data[addr + 1];
            if (len <= 0 || addr + 2 + len > this._size) return obj;
            var chars = [];
            for (var i = 0; i < len; i++) {
                chars.push(String.fromCharCode(this._data[addr + 2 + i]));
            }
            try {
                return JSON.parse(chars.join(''));
            } catch (e) {
                return obj;
            }
        }

        // 기본: 1바이트
        return this._data[addr];
    };

    /**
     * 데이터를 지정 주소에 씁니다.
     * @param {number} addr - 시작 주소
     * @param {*}      val  - 쓸 값 (number/boolean/object)
     * @returns {number} 다음 쓰기 주소
     */
    EEPROMClass.prototype.put = function(addr, val) {
        addr = parseInt(addr, 10);

        if (typeof val === 'boolean') {
            this.write(addr, val ? 1 : 0);
            return addr + 1;
        }

        if (typeof val === 'number') {
            // float (4바이트) 쓰기
            this._writeFloat(addr, val);
            return addr + 4;
        }

        if (typeof val === 'object' && val !== null) {
            // 객체: JSON 직렬화, 길이를 2바이트 헤더에 저장
            var json = JSON.stringify(val);
            var len  = json.length;
            if (addr + 2 + len > this._size) {
                console.warn('[EEPROM] put: 크기 초과');
                return addr;
            }
            this._data[addr]     = (len >> 8) & 0xFF;
            this._data[addr + 1] = len & 0xFF;
            for (var i = 0; i < len; i++) {
                this._data[addr + 2 + i] = json.charCodeAt(i) & 0xFF;
            }
            this._dirty = true;
            if (!this._initialized) this._save();
            return addr + 2 + len;
        }

        // 기본: 1바이트
        this.write(addr, (val >>> 0) & 0xFF);
        return addr + 1;
    };

    /**
     * EEPROM 크기를 반환합니다.
     * @returns {number}
     */
    EEPROMClass.prototype.length = function() {
        return this._size;
    };

    /**
     * ESP32 전용: 변경사항을 플래시에 저장합니다.
     * @returns {boolean}
     */
    EEPROMClass.prototype.commit = function() {
        if (!this._dirty) return true;
        this._save();
        this._dirty = false;
        console.log('[EEPROM] commit 완료');
        return true;
    };

    /**
     * ESP32 전용: EEPROM을 종료합니다.
     */
    EEPROMClass.prototype.end = function() {
        this.commit();
        this._initialized = false;
    };

    /**
     * EEPROM 전체를 0xFF로 초기화합니다.
     */
    EEPROMClass.prototype.wipe = function() {
        for (var i = 0; i < this._size; i++) {
            this._data[i] = 0xFF;
        }
        this._dirty = true;
        if (!this._initialized) this._save();
        console.log('[EEPROM] 전체 초기화 (0xFF)');
    };

    /**
     * 배열 인덱스 접근자 — EEPROM[addr] 형태 지원
     * @param {number} addr
     * @returns {number}
     */
    EEPROMClass.prototype.operator = function(addr) {
        return this._data[addr];
    };

    // ── 내부: float 직렬화 ────────────────────────────────────────────────────

    /**
     * 4바이트 IEEE 754 float를 EEPROM에 씁니다.
     * @private
     */
    EEPROMClass.prototype._writeFloat = function(addr, val) {
        var buf = new ArrayBuffer(4);
        new DataView(buf).setFloat32(0, val, true); // little-endian
        var bytes = new Uint8Array(buf);
        for (var i = 0; i < 4; i++) {
            if (addr + i < this._size) {
                this._data[addr + i] = bytes[i];
            }
        }
        this._dirty = true;
        if (!this._initialized) this._save();
    };

    /**
     * EEPROM에서 4바이트 IEEE 754 float를 읽습니다.
     * @private
     */
    EEPROMClass.prototype._readFloat = function(addr) {
        if (addr + 4 > this._size) return 0;
        var buf   = new ArrayBuffer(4);
        var bytes = new Uint8Array(buf);
        for (var i = 0; i < 4; i++) {
            bytes[i] = this._data[addr + i];
        }
        return new DataView(buf).getFloat32(0, true);
    };

    // ── 내부: localStorage 직렬화 ────────────────────────────────────────────

    /**
     * localStorage에서 데이터를 로드합니다.
     * @private
     */
    EEPROMClass.prototype._load = function() {
        this._data = new Uint8Array(this._size).fill(0xFF);

        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;

            var parsed = JSON.parse(stored);
            if (!parsed || !parsed.data) return;

            var savedData = parsed.data;
            var len = Math.min(savedData.length, this._size);
            for (var i = 0; i < len; i++) {
                this._data[i] = savedData[i] & 0xFF;
            }
            console.log('[EEPROM] localStorage에서 ' + len + ' bytes 로드');
        } catch (e) {
            console.warn('[EEPROM] 로드 실패:', e);
            this._data = new Uint8Array(this._size).fill(0xFF);
        }
    };

    /**
     * 데이터를 localStorage에 저장합니다.
     * @private
     */
    EEPROMClass.prototype._save = function() {
        try {
            var obj = {
                version: 1,
                size:    this._size,
                data:    Array.from(this._data)
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
        } catch (e) {
            console.warn('[EEPROM] 저장 실패:', e);
        }
    };

    // 싱글턴 인스턴스
    var EEPROM = new EEPROMClass();

    // window.EEPROMLib 으로 노출
    global.EEPROMLib = {
        EEPROM:      EEPROM,
        EEPROMClass: EEPROMClass,
        STORAGE_KEY: STORAGE_KEY
    };

    // 편의 직접 참조
    global.EEPROM = EEPROM;

})(typeof window !== 'undefined' ? window : this);
