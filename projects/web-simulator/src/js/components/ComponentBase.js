/**
 * ComponentBase.js
 * 모든 시뮬레이터 컴포넌트의 기본 클래스
 *
 * 모든 컴포넌트(LED, 버튼, 저항 등)는 이 클래스를 상속받아 구현합니다.
 * SVG 기반 시각화와 GPIO/ADC/PWM 인터페이스를 제공합니다.
 */

// ─────────────────────────────────────────────
// 고유 ID 생성 유틸리티
// ─────────────────────────────────────────────
var _componentIdCounter = 0;
function generateComponentId(type) {
  _componentIdCounter++;
  return type + '_' + _componentIdCounter;
}

// ─────────────────────────────────────────────
// ComponentBase 클래스
// ─────────────────────────────────────────────
function ComponentBase(id, type, config) {
  // 고유 식별자 (예: "LED_1", "Button_2")
  this.id = id || generateComponentId(type);

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
}

// ─────────────────────────────────────────────
// 하위 클래스에서 반드시 구현해야 하는 메서드들
// ─────────────────────────────────────────────

/**
 * SVG 요소를 생성하여 반환합니다.
 * 하위 클래스에서 컴포넌트 모양을 정의합니다.
 * @returns {SVGElement} 컴포넌트를 나타내는 SVG 그룹 요소
 */
ComponentBase.prototype.createSvg = function() {
  // 기본 구현: 빈 그룹 반환
  // 하위 클래스에서 오버라이드하여 실제 SVG 그리기
  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', this.id);
  g.setAttribute('class', 'component component-' + this.type.toLowerCase());
  return g;
};

/**
 * 연결 가능한 핀 목록을 반환합니다.
 * @returns {Array} 핀 정보 배열
 *   각 항목: { name: '핀이름', x: 상대X, y: 상대Y, type: 'digital'|'analog'|'power'|'gnd' }
 */
ComponentBase.prototype.getConnectionPoints = function() {
  // 하위 클래스에서 오버라이드
  return [];
};

/**
 * GPIO 출력 값이 변경될 때 호출됩니다.
 * 예: digitalWrite(pin, HIGH) → 연결된 컴포넌트의 이 메서드 호출
 * @param {string} pin  - 보드 핀 이름 (예: "G2", "G8")
 * @param {number} value - 0(LOW) 또는 1(HIGH)
 */
ComponentBase.prototype.onGpioChange = function(pin, value) {
  // 하위 클래스에서 오버라이드 (예: LED는 이 값으로 켜고 끔)
};

/**
 * PWM 출력 값이 변경될 때 호출됩니다.
 * 예: ledcWrite(channel, duty) → 연결된 컴포넌트의 이 메서드 호출
 * @param {string} pin   - 보드 핀 이름
 * @param {number} duty  - PWM 듀티 사이클 (0~255 또는 0~1023)
 * @param {number} freq  - PWM 주파수 (Hz)
 */
ComponentBase.prototype.onPwmChange = function(pin, duty, freq) {
  // 하위 클래스에서 오버라이드 (예: Buzzer는 주파수로 소리 출력)
};

/**
 * ADC 읽기 요청 시 현재 값을 반환합니다.
 * 예: analogRead(pin) → 연결된 컴포넌트의 이 메서드 호출
 * @param {string} pin - 보드 핀 이름
 * @returns {number} ADC 값 (0~4095, 12비트)
 */
ComponentBase.prototype.getAdcValue = function(pin) {
  // 하위 클래스에서 오버라이드 (예: 가변저항은 슬라이더 위치 반환)
  return 0;
};

/**
 * 디지털 입력 읽기 요청 시 현재 값을 반환합니다.
 * 예: digitalRead(pin) → 연결된 컴포넌트의 이 메서드 호출
 * @param {string} pin - 보드 핀 이름
 * @returns {number} 0(LOW) 또는 1(HIGH)
 */
ComponentBase.prototype.getDigitalValue = function(pin) {
  // 하위 클래스에서 오버라이드 (예: 버튼은 눌림 상태 반환)
  return 1; // 기본값: INPUT_PULLUP 기준 뗀 상태 = HIGH
};

// ─────────────────────────────────────────────
// 공통 구현 메서드들
// ─────────────────────────────────────────────

/**
 * 컴포넌트를 지정한 좌표로 이동합니다.
 * SVG 요소의 transform을 업데이트합니다.
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
 * 선택된 컴포넌트는 파란색 테두리로 표시됩니다.
 */
ComponentBase.prototype.select = function() {
  this.selected = true;
  if (this.element) {
    this.element.classList.add('selected');
    // 선택 테두리 표시
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
    if (existing) {
      existing.parentNode.removeChild(existing);
    }
  }
};

/**
 * 컴포넌트의 바운딩 박스를 반환합니다.
 * 선택 표시 등에 사용됩니다.
 * @returns {{ x, y, width, height }}
 */
ComponentBase.prototype.getBoundingBox = function() {
  // 기본값: 하위 클래스에서 오버라이드 가능
  return { x: 0, y: 0, width: 60, height: 60 };
};

/**
 * 특정 핀에 연결된 보드 핀 이름을 반환합니다.
 * @param {string} pinName - 컴포넌트 핀 이름 (예: "A", "K")
 * @returns {string|null} 연결된 보드 핀 이름 (예: "G2") 또는 null
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
 * 컴포넌트 상태를 JSON으로 직렬화합니다.
 * 회로 저장/불러오기에 사용됩니다.
 * @returns {Object} JSON 직렬화 가능한 객체
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
 * JSON 데이터로부터 컴포넌트를 복원하는 정적 메서드
 * 하위 클래스에서 오버라이드하여 인스턴스 생성
 * @param {Object} data - toJSON()이 반환한 데이터
 * @returns {ComponentBase} 복원된 컴포넌트 인스턴스
 */
ComponentBase.fromJSON = function(data) {
  // ComponentRegistry를 통해 올바른 하위 클래스 생성
  // (실제 구현은 components.js의 ComponentRegistry에서 처리)
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
 * @param {string} tag        - SVG 태그 이름
 * @param {Object} attrs      - 속성 객체
 * @returns {SVGElement}
 */
ComponentBase.prototype.svgEl = function(tag, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) {
    Object.keys(attrs).forEach(function(k) {
      el.setAttribute(k, attrs[k]);
    });
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
    digital: '#4CAF50',  // 초록 - 디지털
    analog:  '#FF9800',  // 주황 - 아날로그
    power:   '#F44336',  // 빨강 - 전원
    gnd:     '#212121',  // 검정 - GND
    signal:  '#2196F3'   // 파랑 - 신호
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

  // 핀 이름 툴팁
  var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.textContent = this.id + ' : ' + name;
  circle.appendChild(title);

  g.appendChild(circle);
  return g;
};
