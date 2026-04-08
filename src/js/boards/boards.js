/**
 * @file boards.js
 * @brief 모든 보드 클래스를 window.BOARDS 에 등록하는 진입 파일
 *
 * 로드 순서 (HTML에서 script 태그 순서와 동일):
 *   1. BoardBase.js   — 기반 클래스
 *   2. ArduinoUno.js
 *   3. ArduinoNano.js
 *   4. ArduinoMega.js
 *   5. ESP32.js
 *   6. ESP8266.js
 *   7. ESP32C3.js
 *   8. boards.js      — 이 파일 (마지막에 로드)
 *
 * HTML 예시:
 *   <script src="js/boards/BoardBase.js"></script>
 *   <script src="js/boards/ArduinoUno.js"></script>
 *   <script src="js/boards/ArduinoNano.js"></script>
 *   <script src="js/boards/ArduinoMega.js"></script>
 *   <script src="js/boards/ESP32.js"></script>
 *   <script src="js/boards/ESP8266.js"></script>
 *   <script src="js/boards/ESP32C3.js"></script>
 *   <script src="js/boards/boards.js"></script>
 *
 * 사용 방법:
 *   const board = window.BOARDS['esp32-c3'];
 *   board.render(svgLayerEl, 0, 0);
 *
 *   const ledPin = board.getBuiltinLedPin();  // 8
 *   const pwmPins = board.getPinsByCapability('pwm');
 */

(function () {
    'use strict';

    // ── 필수 의존성 확인 ────────────────────────────────────────
    const REQUIRED = [
        'BoardBase',
        'ArduinoUnoBoard',
        'ArduinoNanoBoard',
        'ArduinoMegaBoard',
        'ESP32Board',
        'ESP8266Board',
        'ESP32C3Board',
    ];

    for (const name of REQUIRED) {
        if (typeof window[name] === 'undefined') {
            console.error(
                `[boards.js] 오류: window.${name} 가 정의되지 않았습니다. ` +
                `${name}.js 파일이 boards.js 보다 먼저 로드되었는지 확인하세요.`
            );
        }
    }

    // ── 보드 인스턴스 등록 ──────────────────────────────────────
    /**
     * 지원하는 보드 목록
     *
     * 키: 보드 ID 문자열 (셀렉트 박스 value 등에 사용)
     * 값: BoardBase 를 상속한 보드 인스턴스
     *
     * @type {Object<string, BoardBase>}
     */
    window.BOARDS = {
        'arduino-uno':  new ArduinoUnoBoard(),
        'arduino-nano': new ArduinoNanoBoard(),
        'arduino-mega': new ArduinoMegaBoard(),
        'esp32':        new ESP32Board(),
        'esp8266':      new ESP8266Board(),
        'esp32-c3':     new ESP32C3Board(),
    };

    // ── 등록 확인 로그 ──────────────────────────────────────────
    console.log(
        '[boards.js] 보드 등록 완료:',
        Object.keys(window.BOARDS).join(', ')
    );

    // ── 편의 함수 ────────────────────────────────────────────────

    /**
     * 등록된 보드 ID 목록을 반환합니다.
     *
     * @returns {string[]}
     */
    window.getBoardIds = function () {
        return Object.keys(window.BOARDS);
    };

    /**
     * 보드 ID로 보드 인스턴스를 반환합니다.
     * 존재하지 않는 ID이면 null을 반환합니다.
     *
     * @param {string} id - 보드 ID (예: 'esp32-c3')
     * @returns {BoardBase|null}
     */
    window.getBoard = function (id) {
        return window.BOARDS[id] || null;
    };

    /**
     * <select> 요소에 보드 옵션을 채웁니다.
     *
     * 사용 예:
     *   populateBoardSelect(document.getElementById('board-select'));
     *
     * @param {HTMLSelectElement} selectEl
     * @param {string} [defaultId] - 기본 선택 보드 ID
     */
    window.populateBoardSelect = function (selectEl, defaultId = 'esp32-c3') {
        if (!selectEl) return;

        selectEl.innerHTML = '';

        for (const [id, board] of Object.entries(window.BOARDS)) {
            const option = document.createElement('option');
            option.value    = id;
            option.textContent = board.name;
            if (id === defaultId) option.selected = true;
            selectEl.appendChild(option);
        }
    };

})();
