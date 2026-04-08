/**
 * ComponentBase.js
 * 모든 시뮬레이터 컴포넌트의 기반 클래스
 *
 * 모든 컴포넌트(LED, 버튼, 저항 등)는 이 클래스를 상속받아 구현합니다.
 * SVG 기반 시각화와 GPIO/ADC/PWM 인터페이스를 제공합니다.
 */

// ─────────────────────────────────────────────
// ComponentBase 클래스
// ─────────────────────────────────────────────
function ComponentBase(id, type, config) {
  // 고유 식별자 (예: "LED_1", "Button_2")
  this.id = id || (type + '_' + (++ComponentBase._counter));

  // 컴포넌트 타입 이름 (예: "LED", "Button", "Resistor")
  this.type = type;

  // 캔버스상의 위치 (SVG 좌표)
  this.x = 0;
  this.y = 0;

  // 핀 연결 정보: { 핀이름: 연결된보드핀이름 }
  // 예: { A: "G2", K: "GND" }
  this.connections = {};

  // 실제 SVG DOM 요소 (createSvg() 호출 후 설정됨)
  this.element = null;

  // 선택 상태
  this.selected = false;

  // 설정값 (색상, 저항값 등 컴포넌트별 초기 설정)
  this.config = config || {};

  // 컴포넌트가 회로 편집기에 추가되어 있는지
  this.mounted = false;

  // 입력 콜백 (버튼 등 입력 컴포넌트용)
  this._pressCallbacks = [];
}

// 전역 카운터 (고유 ID 생성용)
ComponentBase._counter = 0;

// ─────────────────────────────────────────────
// 하위 클래스에서 반드시 구현해야 하는 메서드들
// ─────────────────────────────────────────────

/**
 * SVG 요소를 생성하여 반환합니다.
 * 하위 클래스에서 컴포넌트 모양을 정의합니다.
 * @returns {SVGElement} 컴포넌트를 나타내는 SVG 그룹 요소
 */
ComponentBase.prototype.createSvg = function() {
  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', this.id);
  g.setAttribute('class', 'component component-' + this.type.toLowerCase());
  this.element = g;
  return g;
};

/**
 * 연결 가능한 핀 목록을 반환합니다.
 * @returns {Array} 핀 정보 배열
 *   각 항목: { name: '핀이름', x: 상대X, y: 상대Y, type: 'digital'|'analog'|'power'|'gnd' }
 */
ComponentBase.prototype.getConnectionPoints = function() {
  return [];
};

/**
 * GPIO 출력 값이 변경될 때 호출됩니다.
 * @param {string} pin  - 보드 핀 이름 (예: "G2", "G8")
 * @param {number} value - 0(LOW) 또는 1(HIGH)
 */
ComponentBase.prototype.onGpioChange = function(pin, value) {};

/**
 * PWM 출력 값이 변경될 때 호출됩니다.
 * @param {string} pin   - 보드 핀 이름
 * @param {number} duty  - PWM 듀티 사이클 (0~255)
 * @param {number} freq  - PWM 주파수 (Hz)
 */
ComponentBase.prototype.onPwmChange = function(pin, duty, freq) {};

/**
 * ADC 읽기 요청 시 현재 값을 반환합니다.
 * @param {string} pin - 보드 핀 이름
 * @returns {number} ADC 값 (0~4095, 12비트)
 */
ComponentBase.prototype.getAdcValue = function(pin) {
  return 0;
};

/**
 * 디지털 입력 읽기 요청 시 현재 값을 반환합니다.
 * @param {string} pin - 보드 핀 이름
 * @returns {number} 0(LOW) 또는 1(HIGH)
 */
ComponentBase.prototype.getDigitalValue = function(pin) {
  return 1; // 기본값: INPUT_PULLUP 기준 뗀 상태 = HIGH
};

// ─────────────────────────────────────────────
// 공통 구현 메서드들
// ─────────────────────────────────────────────

/**
 * 컴포넌트를 지정한 좌표로 이동합니다.
 * @param {number} x - 새 X 좌표
 * @param {number} y - 새 Y 좌표
 */
ComponentBase.prototype.move = function(x, y) {
  this.x = x;
  this.y = y;
  if (this.element) {
    this.element.setAttribute('transform', 'translate(' + x + ',' + y + ')');
  }
};

/**
 * 컴포넌트를 선택 상태로 만듭니다.
 */
ComponentBase.prototype.select = function() {
  this.selected = true;
  if (this.element) {
    this.element.classList.add('selected');
    var existing = this.element.querySelector('.selection-rect');
    if (!existing) {
      var bbox = this.getBoundingBox();
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('class', 'selection-rect');
      rect.setAttribute('x', bbox.x - 4);
      rect.setAttribute('y', bbox.y - 4);
      rect.setAttribute('width', bbox.width + 8);
      rect.setAttribute('height', bbox.height + 8);
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', '#2196F3');
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('stroke-dasharray', '4,2');
      rect.setAttribute('rx', '3');
      rect.setAttribute('pointer-events', 'none');
      this.element.insertBefore(rect, this.element.firstChild);
    }
  }
};

/**
 * 컴포넌트의 선택을 해제합니다.
 */
ComponentBase.prototype.deselect = function() {
  this.selected = false;
  if (this.element) {
    this.element.classList.remove('selected');
    var existing = this.element.querySelector('.selection-rect');
    if (existing) existing.parentNode.removeChild(existing);
  }
};

/**
 * 컴포넌트의 바운딩 박스를 반환합니다.
 * @returns {{ x, y, width, height }}
 */
ComponentBase.prototype.getBoundingBox = function() {
  return { x: 0, y: 0, width: 60, height: 60 };
};

/**
 * 특정 핀에 연결된 보드 핀 이름을 반환합니다.
 * @param {string} pinName - 컴포넌트 핀 이름
 * @returns {string|null}
 */
ComponentBase.prototype.getConnectedBoardPin = function(pinName) {
  return this.connections[pinName] || null;
};

/**
 * 핀 연결 정보를 설정합니다.
 * @param {string} pinName      - 컴포넌트 핀 이름
 * @param {string} boardPinName - 연결할 보드 핀 이름
 */
ComponentBase.prototype.setConnection = function(pinName, boardPinName) {
  this.connections[pinName] = boardPinName;
};

/**
 * 핀 연결을 해제합니다.
 * @param {string} pinName - 연결 해제할 컴포넌트 핀 이름
 */
ComponentBase.prototype.removeConnection = function(pinName) {
  delete this.connections[pinName];
};

/**
 * 입력 이벤트 콜백을 등록합니다. (버튼, 스위치 등 입력 컴포넌트용)
 * @param {Function} fn - 콜백 함수 fn(pinName, value)
 */
ComponentBase.prototype.onPressCallback = function(fn) {
  if (typeof fn === 'function') {
    this._pressCallbacks.push(fn);
  }
};

/**
 * 등록된 콜백들을 호출합니다.
 * @param {string} pinName - 핀 이름
 * @param {number} value   - 값
 */
ComponentBase.prototype._firePressCallback = function(pinName, value) {
  for (var i = 0; i < this._pressCallbacks.length; i++) {
    try { this._pressCallbacks[i](pinName, value); } catch(e) {}
  }
};

/**
 * 컴포넌트 상태를 JSON으로 직렬화합니다.
 * @returns {Object}
 */
ComponentBase.prototype.toJSON = function() {
  return {
    id: this.id,
    type: this.type,
    x: this.x,
    y: this.y,
    connections: Object.assign({}, this.connections),
    config: Object.assign({}, this.config)
  };
};

/**
 * JSON 데이터로부터 컴포넌트를 복원합니다.
 * @param {Object} data - toJSON()이 반환한 데이터
 * @returns {ComponentBase}
 */
ComponentBase.fromJSON = function(data) {
  if (typeof ComponentRegistry !== 'undefined') {
    return ComponentRegistry.create(data.type, data.id, data.config, data.x, data.y, data.connections);
  }
  var comp = new ComponentBase(data.id, data.type, data.config);
  comp.x = data.x || 0;
  comp.y = data.y || 0;
  comp.connections = data.connections || {};
  return comp;
};

/**
 * SVG 네임스페이스로 요소를 생성하는 헬퍼
 * @param {string} tag   - SVG 태그 이름
 * @param {Object} attrs - 속성 객체
 * @returns {SVGElement}
 */
ComponentBase.prototype.svgEl = function(tag, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) {
    Object.keys(attrs).forEach(function(k) { el.setAttribute(k, attrs[k]); });
  }
  return el;
};

/**
 * 연결 포인트(동그라미)를 SVG로 생성하는 헬퍼
 * @param {number} cx   - 중심 X
 * @param {number} cy   - 중심 Y
 * @param {string} name - 핀 이름
 * @param {string} type - 핀 타입 ('digital'|'analog'|'power'|'gnd')
 * @returns {SVGElement}
 */
ComponentBase.prototype.createPinCircle = function(cx, cy, name, type) {
  var colorMap = {
    digital: '#4CAF50',
    analog:  '#FF9800',
    power:   '#F44336',
    gnd:     '#212121',
    signal:  '#2196F3',
    i2c:     '#9C27B0'
  };
  var color = colorMap[type] || '#9E9E9E';
  var g = this.svgEl('g', {
    'class': 'pin-point',
    'data-pin': name,
    'data-component': this.id
  });
  var circle = this.svgEl('circle', {
    cx: cx, cy: cy, r: 5,
    fill: color,
    stroke: '#fff',
    'stroke-width': '1.5',
    style: 'cursor: crosshair;'
  });
  var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.textContent = this.id + ' : ' + name;
  circle.appendChild(title);
  g.appendChild(circle);
  return g;
};

// 전역 노출
window.ComponentBase = ComponentBase;
