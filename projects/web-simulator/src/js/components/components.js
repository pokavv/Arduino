/**
 * components.js
 * ESP32-C3 웹 시뮬레이터 - 전체 컴포넌트 라이브러리
 *
 * 모든 시뮬레이터 컴포넌트를 하나의 파일에 구현합니다.
 * ComponentBase를 상속받아 각 컴포넌트를 정의합니다.
 *
 * 포함 컴포넌트:
 *   LED, Button, Resistor, Potentiometer, LED_RGB,
 *   Buzzer, Servo, DHT11, DHT22, Ultrasonic_HC_SR04,
 *   PIR_Sensor, OLED_SSD1306, LCD_1602,
 *   DC_Motor_L298N, Relay_Module, PowerRail, GndRail
 */

// ─────────────────────────────────────────────────────────────────────────────
// 컴포넌트 레지스트리 - 타입 이름으로 인스턴스 생성
// ─────────────────────────────────────────────────────────────────────────────
var ComponentRegistry = (function() {
  var _map = {};

  return {
    /**
     * 컴포넌트 생성자를 등록합니다.
     * @param {string}   typeName - 타입 이름 (예: "LED")
     * @param {Function} ctor     - 생성자 함수
     */
    register: function(typeName, ctor) {
      _map[typeName] = ctor;
    },

    /**
     * 타입 이름으로 컴포넌트 인스턴스를 생성합니다.
     * @param {string} typeName    - 타입 이름
     * @param {string} id          - 고유 ID (null이면 자동 생성)
     * @param {Object} config      - 설정값
     * @param {number} x           - X 좌표
     * @param {number} y           - Y 좌표
     * @param {Object} connections - 핀 연결 정보
     * @returns {ComponentBase|null}
     */
    create: function(typeName, id, config, x, y, connections) {
      var Ctor = _map[typeName];
      if (!Ctor) {
        console.warn('ComponentRegistry: 알 수 없는 타입 -', typeName);
        return null;
      }
      var inst = new Ctor(id, config);
      inst.x = x || 0;
      inst.y = y || 0;
      inst.connections = connections || {};
      return inst;
    },

    /** 등록된 모든 타입 이름 목록 */
    getTypes: function() {
      return Object.keys(_map);
    },

    /** 생성자 가져오기 */
    get: function(typeName) {
      return _map[typeName] || null;
    }
  };
})();


// ─────────────────────────────────────────────────────────────────────────────
// SVG 헬퍼 유틸리티
// ─────────────────────────────────────────────────────────────────────────────
var SvgUtil = {
  NS: 'http://www.w3.org/2000/svg',

  /** SVG 요소 생성 */
  el: function(tag, attrs, children) {
    var e = document.createElementNS(this.NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function(k) { e.setAttribute(k, attrs[k]); });
    }
    if (children) {
      children.forEach(function(c) { if (c) e.appendChild(c); });
    }
    return e;
  },

  /** 텍스트 요소 생성 */
  text: function(str, attrs) {
    var e = this.el('text', attrs);
    e.textContent = str;
    return e;
  },

  /** 그룹 요소 생성 */
  g: function(attrs, children) {
    return this.el('g', attrs, children);
  },

  /** 핀 연결점 원 생성 */
  pinDot: function(cx, cy, pinName, compId, pinType) {
    var colors = { digital:'#4CAF50', analog:'#FF9800', power:'#F44336', gnd:'#000', signal:'#2196F3', i2c:'#9C27B0' };
    var c = colors[pinType] || '#9E9E9E';
    var g = this.el('g', { 'class':'pin-point', 'data-pin':pinName, 'data-comp':compId, style:'cursor:crosshair' });
    var circle = this.el('circle', { cx:cx, cy:cy, r:5, fill:c, stroke:'#fff', 'stroke-width':'1.5' });
    var t = document.createElementNS(this.NS, 'title');
    t.textContent = compId + ':' + pinName;
    circle.appendChild(t);
    g.appendChild(circle);
    return g;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// 1. LED (발광 다이오드)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * LED 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - { color: 'red'|'green'|'blue'|'yellow'|'white' }
 *
 * 핀:
 *   A (양극, Anode)   - GPIO OUTPUT HIGH → 켜짐
 *   K (음극, Cathode) - 보통 GND
 *
 * 동작:
 *   - GPIO HIGH → 켜짐 (opacity 1.0)
 *   - GPIO LOW  → 꺼짐 (opacity 0.2)
 *   - PWM duty  → 불투명도로 밝기 표현 (0~255 → opacity 0.1~1.0)
 */
function LED(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'LED', config);
  this.color = config.color || 'red';
  this._on = false;
  this._opacity = 0.2;
}
LED.prototype = Object.create(ComponentBase.prototype);
LED.prototype.constructor = LED;

LED.COLOR_MAP = {
  red:    { fill: '#F44336', glow: '#FF8A80', dark: '#7f0000' },
  green:  { fill: '#4CAF50', glow: '#B9F6CA', dark: '#1b5e20' },
  blue:   { fill: '#2196F3', glow: '#82B1FF', dark: '#0d47a1' },
  yellow: { fill: '#FFEB3B', glow: '#FFFF8D', dark: '#f57f17' },
  white:  { fill: '#ECEFF1', glow: '#FFFFFF', dark: '#90A4AE' }
};

LED.prototype.createSvg = function() {
  var self = this;
  var colors = LED.COLOR_MAP[this.color] || LED.COLOR_MAP.red;
  var id = this.id;

  var g = SvgUtil.el('g', { id: id, 'class': 'component component-led', transform: 'translate(0,0)' });

  // 발광 글로우 필터
  var defs = SvgUtil.el('defs');
  var filter = SvgUtil.el('filter', { id: id + '_glow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
  var feGBlur = SvgUtil.el('feGaussianBlur', { stdDeviation: '3', result: 'coloredBlur' });
  var feMerge = SvgUtil.el('feMerge');
  feMerge.appendChild(SvgUtil.el('feMergeNode', { in: 'coloredBlur' }));
  feMerge.appendChild(SvgUtil.el('feMergeNode', { in: 'SourceGraphic' }));
  filter.appendChild(feGBlur);
  filter.appendChild(feMerge);
  defs.appendChild(filter);
  g.appendChild(defs);

  // 배경 원 (꺼진 상태)
  var bgCircle = SvgUtil.el('circle', { cx: 20, cy: 20, r: 14, fill: colors.dark, stroke: '#555', 'stroke-width': '1' });
  g.appendChild(bgCircle);

  // LED 본체 (켜진 상태 레이어)
  var ledBody = SvgUtil.el('circle', {
    cx: 20, cy: 20, r: 14,
    fill: colors.fill,
    opacity: 0.2,
    filter: 'url(#' + id + '_glow)',
    'class': 'led-body'
  });
  g.appendChild(ledBody);

  // LED 심볼 - 삼각형 + 선 (회로도 심볼)
  var symbol = SvgUtil.el('g', { 'class': 'led-symbol', opacity: '0.8' });
  // 삼각형 (전류 방향 표시)
  symbol.appendChild(SvgUtil.el('polygon', {
    points: '12,14 12,26 22,20',
    fill: '#fff', opacity: '0.6'
  }));
  // 캐소드 선
  symbol.appendChild(SvgUtil.el('line', { x1: 22, y1: 14, x2: 22, y2: 26, stroke: '#fff', 'stroke-width': '2' }));
  g.appendChild(symbol);

  // 광택 (하이라이트)
  var shine = SvgUtil.el('circle', { cx: 15, cy: 15, r: 4, fill: 'rgba(255,255,255,0.3)' });
  g.appendChild(shine);

  // 라벨
  g.appendChild(SvgUtil.text(this.color.toUpperCase()[0] + 'LED', {
    x: 20, y: 44, 'text-anchor': 'middle',
    'font-size': '8', fill: '#ccc', 'font-family': 'monospace'
  }));

  // 핀 연결점
  // A (양극) - 위쪽
  g.appendChild(SvgUtil.pinDot(20, 4, 'A', id, 'digital'));
  g.appendChild(SvgUtil.text('A', { x: 28, y: 7, 'font-size': '7', fill: '#aaa' }));
  // K (음극) - 아래쪽
  g.appendChild(SvgUtil.pinDot(20, 36, 'K', id, 'gnd'));
  g.appendChild(SvgUtil.text('K', { x: 28, y: 39, 'font-size': '7', fill: '#aaa' }));

  this.element = g;
  this._ledBody = ledBody;
  return g;
};

LED.prototype.getConnectionPoints = function() {
  return [
    { name: 'A', x: 20, y: 4,  type: 'digital' },
    { name: 'K', x: 20, y: 36, type: 'gnd' }
  ];
};

LED.prototype.getBoundingBox = function() {
  return { x: 4, y: 4, width: 32, height: 40 };
};

LED.prototype.onGpioChange = function(pin, value) {
  this._on = (value === 1);
  this._setOpacity(this._on ? 1.0 : 0.2);
};

LED.prototype.onPwmChange = function(pin, duty, freq) {
  // duty: 0~255 → opacity: 0.1~1.0
  var maxDuty = 255;
  var opacity = 0.1 + (duty / maxDuty) * 0.9;
  this._on = (duty > 0);
  this._setOpacity(Math.min(1, Math.max(0.1, opacity)));
};

LED.prototype._setOpacity = function(opacity) {
  this._opacity = opacity;
  if (this._ledBody) {
    this._ledBody.setAttribute('opacity', opacity);
  }
};

ComponentRegistry.register('LED', LED);


// ─────────────────────────────────────────────────────────────────────────────
// 2. Button (누름 버튼)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Button 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - { label: '버튼 이름' }
 *
 * 핀:
 *   PIN1, PIN2 - 두 단자 (누르면 연결, 떼면 끊김)
 *
 * 동작:
 *   - INPUT_PULLUP 기준: 뗌 = HIGH(1), 누름 = LOW(0)
 *   - 마우스 mousedown → 누름, mouseup/mouseleave → 뗌
 *   - 스페이스바: 해당 버튼이 포커스 상태일 때
 */
function Button(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Button', config);
  this.label = config.label || 'BTN';
  this._pressed = false;
  this._listeners = [];
}
Button.prototype = Object.create(ComponentBase.prototype);
Button.prototype.constructor = Button;

Button.prototype.createSvg = function() {
  var self = this;
  var id = this.id;

  var g = SvgUtil.el('g', { id: id, 'class': 'component component-button' });

  // 버튼 외곽 베이스
  g.appendChild(SvgUtil.el('rect', {
    x: 2, y: 10, width: 46, height: 30,
    rx: 3, fill: '#455A64', stroke: '#78909C', 'stroke-width': '1'
  }));

  // 버튼 본체 (누름 효과용)
  var btnBody = SvgUtil.el('rect', {
    x: 10, y: 14, width: 30, height: 22,
    rx: 4, fill: '#607D8B', stroke: '#90A4AE', 'stroke-width': '1.5',
    style: 'cursor: pointer;'
  });
  g.appendChild(btnBody);

  // 버튼 눌림 표시 원
  var btnDot = SvgUtil.el('circle', {
    cx: 25, cy: 25, r: 7,
    fill: '#B0BEC5', stroke: '#90A4AE', 'stroke-width': '1',
    style: 'cursor: pointer;'
  });
  g.appendChild(btnDot);

  // 라벨
  var labelEl = SvgUtil.text(this.label, {
    x: 25, y: 52, 'text-anchor': 'middle',
    'font-size': '8', fill: '#ccc', 'font-family': 'monospace'
  });
  g.appendChild(labelEl);

  // 핀 연결점
  g.appendChild(SvgUtil.pinDot(2, 20, 'PIN1', id, 'digital'));
  g.appendChild(SvgUtil.text('1', { x: -6, y: 23, 'font-size': '7', fill: '#aaa' }));
  g.appendChild(SvgUtil.pinDot(48, 20, 'PIN2', id, 'digital'));
  g.appendChild(SvgUtil.text('2', { x: 52, y: 23, 'font-size': '7', fill: '#aaa' }));

  // 클릭 이벤트 (터치 영역 확장)
  var hitArea = SvgUtil.el('rect', {
    x: 6, y: 10, width: 38, height: 30,
    fill: 'transparent', style: 'cursor: pointer;'
  });

  var pressHandler = function(e) {
    e.preventDefault();
    self._setPressed(true);
  };
  var releaseHandler = function(e) {
    self._setPressed(false);
  };

  hitArea.addEventListener('mousedown',  pressHandler);
  hitArea.addEventListener('touchstart', pressHandler, { passive: false });
  hitArea.addEventListener('mouseup',    releaseHandler);
  hitArea.addEventListener('mouseleave', releaseHandler);
  hitArea.addEventListener('touchend',   releaseHandler);

  g.appendChild(hitArea);

  this.element = g;
  this._btnBody = btnBody;
  this._btnDot  = btnDot;
  return g;
};

Button.prototype.getConnectionPoints = function() {
  return [
    { name: 'PIN1', x: 2,  y: 20, type: 'digital' },
    { name: 'PIN2', x: 48, y: 20, type: 'digital' }
  ];
};

Button.prototype.getBoundingBox = function() {
  return { x: 2, y: 10, width: 46, height: 44 };
};

Button.prototype._setPressed = function(pressed) {
  this._pressed = pressed;
  if (this._btnBody) {
    this._btnBody.setAttribute('fill', pressed ? '#37474F' : '#607D8B');
  }
  if (this._btnDot) {
    this._btnDot.setAttribute('fill', pressed ? '#78909C' : '#B0BEC5');
    this._btnDot.setAttribute('cy', pressed ? '26' : '25');
  }
  // 콜백 알림 (CircuitEditor가 디지털 값 변화를 시뮬레이터에 전달)
  this._listeners.forEach(function(fn) { fn(pressed); });
};

Button.prototype.onPressCallback = function(fn) {
  this._listeners.push(fn);
};

Button.prototype.getDigitalValue = function(pin) {
  // INPUT_PULLUP 기준: 누름 = LOW(0), 뗌 = HIGH(1)
  return this._pressed ? 0 : 1;
};

ComponentRegistry.register('Button', Button);


// ─────────────────────────────────────────────────────────────────────────────
// 3. Resistor (저항)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Resistor 컴포넌트 (북미 지그재그 심볼)
 * @param {string} id     - 고유 ID
 * @param {Object} config - { value: 220 }  (저항값 Ω)
 */
function Resistor(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Resistor', config);
  this.value = config.value || 220; // 저항값 (Ω)
}
Resistor.prototype = Object.create(ComponentBase.prototype);
Resistor.prototype.constructor = Resistor;

Resistor.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-resistor' });

  // 지그재그 저항 심볼 (북미 스타일)
  // 핀 A에서 핀 B까지 수평 배치: 폭 70px
  // 양쪽 리드선 10px, 지그재그 50px
  g.appendChild(SvgUtil.el('line', { x1:5, y1:15, x2:15, y2:15, stroke:'#ccc', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('line', { x1:55, y1:15, x2:65, y2:15, stroke:'#ccc', 'stroke-width':'2' }));

  // 지그재그 경로
  var zigzag = 'M15,15 L18,8 L23,22 L28,8 L33,22 L38,8 L43,22 L48,8 L52,15 L55,15';
  g.appendChild(SvgUtil.el('path', {
    d: zigzag, fill: 'none', stroke: '#F5A623', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
  }));

  // 저항값 라벨
  var label = Resistor.formatValue(this.value);
  g.appendChild(SvgUtil.text(label, {
    x: 35, y: 30, 'text-anchor': 'middle',
    'font-size': '8', fill: '#aaa', 'font-family': 'monospace'
  }));

  // 핀 연결점
  g.appendChild(SvgUtil.pinDot(5, 15, 'A', id, 'digital'));
  g.appendChild(SvgUtil.text('A', { x: 0, y: 8, 'font-size': '7', fill: '#aaa' }));
  g.appendChild(SvgUtil.pinDot(65, 15, 'B', id, 'digital'));
  g.appendChild(SvgUtil.text('B', { x: 62, y: 8, 'font-size': '7', fill: '#aaa' }));

  this.element = g;
  return g;
};

Resistor.prototype.getConnectionPoints = function() {
  return [
    { name: 'A', x: 5,  y: 15, type: 'digital' },
    { name: 'B', x: 65, y: 15, type: 'digital' }
  ];
};

Resistor.prototype.getBoundingBox = function() {
  return { x: 5, y: 7, width: 60, height: 26 };
};

/** 저항값을 읽기 쉬운 형식으로 변환 (220 → "220Ω", 1000 → "1kΩ") */
Resistor.formatValue = function(ohm) {
  if (ohm >= 1000000) return (ohm / 1000000).toFixed(1).replace(/\.0$/, '') + 'MΩ';
  if (ohm >= 1000)    return (ohm / 1000).toFixed(1).replace(/\.0$/, '') + 'kΩ';
  return ohm + 'Ω';
};

ComponentRegistry.register('Resistor', Resistor);


// ─────────────────────────────────────────────────────────────────────────────
// 4. Potentiometer (가변저항)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Potentiometer 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - { value: 10000 }  (저항값 Ω)
 *
 * 핀: VCC, OUT, GND
 * ADC 출력: 슬라이더 위치에 따라 0~4095 반환
 */
function Potentiometer(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Potentiometer', config);
  this.value = config.value || 10000;
  this._pct = 0.5; // 0.0 ~ 1.0 (현재 위치)
}
Potentiometer.prototype = Object.create(ComponentBase.prototype);
Potentiometer.prototype.constructor = Potentiometer;

Potentiometer.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-potentiometer' });

  // 본체 사각형
  g.appendChild(SvgUtil.el('rect', {
    x: 5, y: 5, width: 50, height: 50, rx: 4,
    fill: '#37474F', stroke: '#546E7A', 'stroke-width': '1.5'
  }));

  // 저항체 호 (반원 트랙)
  g.appendChild(SvgUtil.el('path', {
    d: 'M12,40 A18,18 0 0,1 48,40',
    fill: 'none', stroke: '#78909C', 'stroke-width': '3', 'stroke-linecap': 'round'
  }));

  // 화살표 (와이퍼) - 초기 위치 중앙
  var wiper = SvgUtil.el('line', {
    x1: 30, y1: 30, x2: 30, y2: 18,
    stroke: '#FF9800', 'stroke-width': '2', 'stroke-linecap': 'round'
  });
  g.appendChild(wiper);

  // 중심 원
  g.appendChild(SvgUtil.el('circle', {
    cx: 30, cy: 30, r: 5,
    fill: '#90A4AE', stroke: '#ccc', 'stroke-width': '1'
  }));

  // 값 표시
  var valLabel = SvgUtil.text('50%', {
    x: 30, y: 60, 'text-anchor': 'middle',
    'font-size': '8', fill: '#aaa', 'font-family': 'monospace'
  });
  g.appendChild(valLabel);

  // 슬라이더 HTML (SVG foreignObject)
  var fo = SvgUtil.el('foreignObject', { x: 2, y: 64, width: 56, height: 20 });
  var slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '100';
  slider.value = '50';
  slider.style.cssText = 'width:52px;height:14px;cursor:pointer;';
  slider.addEventListener('input', function() {
    self._pct = parseInt(this.value) / 100;
    valLabel.textContent = this.value + '%';
    // 와이퍼 각도 업데이트 (-120도 ~ +120도 범위)
    var angle = -120 + self._pct * 240; // 도
    var rad = angle * Math.PI / 180;
    var len = 12;
    var x2 = 30 + Math.sin(rad) * len;
    var y2 = 30 - Math.cos(rad) * len;
    wiper.setAttribute('x2', x2.toFixed(1));
    wiper.setAttribute('y2', y2.toFixed(1));
  });
  fo.appendChild(slider);
  g.appendChild(fo);

  // 핀 연결점
  g.appendChild(SvgUtil.pinDot(5, 20, 'VCC', id, 'power'));
  g.appendChild(SvgUtil.text('VCC', { x: -18, y: 23, 'font-size': '7', fill: '#F44336' }));
  g.appendChild(SvgUtil.pinDot(55, 20, 'GND', id, 'gnd'));
  g.appendChild(SvgUtil.text('GND', { x: 58, y: 23, 'font-size': '7', fill: '#aaa' }));
  g.appendChild(SvgUtil.pinDot(30, 5, 'OUT', id, 'analog'));
  g.appendChild(SvgUtil.text('OUT', { x: 35, y: 8, 'font-size': '7', fill: '#FF9800' }));

  this.element = g;
  this._wiper = wiper;
  this._valLabel = valLabel;
  return g;
};

Potentiometer.prototype.getConnectionPoints = function() {
  return [
    { name: 'VCC', x: 5,  y: 20, type: 'power' },
    { name: 'GND', x: 55, y: 20, type: 'gnd' },
    { name: 'OUT', x: 30, y: 5,  type: 'analog' }
  ];
};

Potentiometer.prototype.getBoundingBox = function() {
  return { x: 5, y: 5, width: 50, height: 80 };
};

Potentiometer.prototype.getAdcValue = function(pin) {
  // 12비트 ADC: 0~4095
  return Math.round(this._pct * 4095);
};

ComponentRegistry.register('Potentiometer', Potentiometer);


// ─────────────────────────────────────────────────────────────────────────────
// 5. LED_RGB (RGB LED, 공통 캐소드)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * LED_RGB 컴포넌트 (공통 캐소드)
 * @param {string} id     - 고유 ID
 * @param {Object} config - {}
 *
 * 핀: R, G, B, GND(공통 캐소드)
 * 각 채널 독립 PWM 지원 → 혼합색 표현
 */
function LED_RGB(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'LED_RGB', config);
  this._r = 0; this._g = 0; this._b = 0; // 0~255
}
LED_RGB.prototype = Object.create(ComponentBase.prototype);
LED_RGB.prototype.constructor = LED_RGB;

LED_RGB.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-led-rgb' });

  // 외곽 원 (LED 본체)
  var bgCircle = SvgUtil.el('circle', {
    cx: 25, cy: 25, r: 18,
    fill: '#1a1a1a', stroke: '#555', 'stroke-width': '1.5'
  });
  g.appendChild(bgCircle);

  // 발광 원 (색상 변화)
  var lightCircle = SvgUtil.el('circle', {
    cx: 25, cy: 25, r: 16,
    fill: 'rgb(0,0,0)', opacity: '0.3',
    'class': 'rgb-light'
  });
  g.appendChild(lightCircle);

  // RGB 서브 표시
  var rLabel = SvgUtil.text('R', { x:15, y:22, 'font-size':'7', fill:'#F44336', 'font-weight':'bold' });
  var gLabel = SvgUtil.text('G', { x:23, y:22, 'font-size':'7', fill:'#4CAF50', 'font-weight':'bold' });
  var bLabel = SvgUtil.text('B', { x:31, y:22, 'font-size':'7', fill:'#2196F3', 'font-weight':'bold' });
  g.appendChild(rLabel); g.appendChild(gLabel); g.appendChild(bLabel);

  // 라벨
  g.appendChild(SvgUtil.text('RGB', {
    x:25, y:52, 'text-anchor':'middle', 'font-size':'8', fill:'#ccc', 'font-family':'monospace'
  }));

  // 핀 연결점
  g.appendChild(SvgUtil.pinDot(5,  12, 'R',   id, 'digital'));
  g.appendChild(SvgUtil.text('R', { x:0, y:9, 'font-size':'7', fill:'#F44336' }));
  g.appendChild(SvgUtil.pinDot(25, 5,  'G',   id, 'digital'));
  g.appendChild(SvgUtil.text('G', { x:28, y:8, 'font-size':'7', fill:'#4CAF50' }));
  g.appendChild(SvgUtil.pinDot(45, 12, 'B',   id, 'digital'));
  g.appendChild(SvgUtil.text('B', { x:48, y:9, 'font-size':'7', fill:'#2196F3' }));
  g.appendChild(SvgUtil.pinDot(25, 45, 'GND', id, 'gnd'));
  g.appendChild(SvgUtil.text('GND', { x:28, y:48, 'font-size':'7', fill:'#aaa' }));

  this.element = g;
  this._lightCircle = lightCircle;
  return g;
};

LED_RGB.prototype.getConnectionPoints = function() {
  return [
    { name: 'R',   x: 5,  y: 12, type: 'digital' },
    { name: 'G',   x: 25, y: 5,  type: 'digital' },
    { name: 'B',   x: 45, y: 12, type: 'digital' },
    { name: 'GND', x: 25, y: 45, type: 'gnd' }
  ];
};

LED_RGB.prototype.getBoundingBox = function() {
  return { x: 5, y: 5, width: 42, height: 50 };
};

LED_RGB.prototype.onGpioChange = function(pin, value) {
  var connMap = {};
  Object.keys(this.connections).forEach(function(pname) {
    connMap[this.connections[pname]] = pname;
  }, this);
  var pname = connMap[pin];
  if (!pname) return;
  if (pname === 'R') this._r = value ? 255 : 0;
  else if (pname === 'G') this._g = value ? 255 : 0;
  else if (pname === 'B') this._b = value ? 255 : 0;
  this._updateColor();
};

LED_RGB.prototype.onPwmChange = function(pin, duty, freq) {
  var connMap = {};
  Object.keys(this.connections).forEach(function(pname) {
    connMap[this.connections[pname]] = pname;
  }, this);
  var pname = connMap[pin];
  if (!pname) return;
  var v = Math.round((duty / 255) * 255);
  if (pname === 'R') this._r = v;
  else if (pname === 'G') this._g = v;
  else if (pname === 'B') this._b = v;
  this._updateColor();
};

LED_RGB.prototype._updateColor = function() {
  if (!this._lightCircle) return;
  var r = this._r, gg = this._g, b = this._b;
  var brightness = (r + gg + b) / (255 * 3);
  this._lightCircle.setAttribute('fill', 'rgb(' + r + ',' + gg + ',' + b + ')');
  this._lightCircle.setAttribute('opacity', 0.2 + brightness * 0.8);
};

ComponentRegistry.register('LED_RGB', LED_RGB);


// ─────────────────────────────────────────────────────────────────────────────
// 6. Buzzer (수동 부저)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Buzzer 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - {}
 *
 * 핀: +, -
 * 동작: PWM 주파수에 따라 Web Audio API로 소리 출력
 */
function Buzzer(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Buzzer', config);
  this._audioCtx = null;
  this._oscillator = null;
  this._gainNode = null;
  this._freq = 0;
  this._active = false;
}
Buzzer.prototype = Object.create(ComponentBase.prototype);
Buzzer.prototype.constructor = Buzzer;

Buzzer.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-buzzer' });

  // 부저 본체 (반구 모양)
  g.appendChild(SvgUtil.el('ellipse', {
    cx: 25, cy: 20, rx: 18, ry: 12,
    fill: '#1A1A1A', stroke: '#555', 'stroke-width': '1.5'
  }));
  g.appendChild(SvgUtil.el('ellipse', {
    cx: 25, cy: 22, rx: 18, ry: 10,
    fill: '#212121', stroke: '#444', 'stroke-width': '1'
  }));

  // 사운드 웨이브 선 (3줄)
  var waveG = SvgUtil.el('g', { 'class': 'buzzer-waves', opacity: '0.3' });
  waveG.appendChild(SvgUtil.el('path', { d:'M32,8 Q38,14 32,20', fill:'none', stroke:'#FF9800', 'stroke-width':'1.5' }));
  waveG.appendChild(SvgUtil.el('path', { d:'M36,6 Q44,14 36,22', fill:'none', stroke:'#FF9800', 'stroke-width':'1.5' }));
  waveG.appendChild(SvgUtil.el('path', { d:'M40,4 Q50,14 40,24', fill:'none', stroke:'#FF9800', 'stroke-width':'1.5' }));
  g.appendChild(waveG);

  // 주파수 표시
  var freqLabel = SvgUtil.text('0 Hz', {
    x: 25, y: 44, 'text-anchor': 'middle',
    'font-size': '8', fill: '#aaa', 'font-family': 'monospace'
  });
  g.appendChild(freqLabel);

  // 핀
  g.appendChild(SvgUtil.pinDot(10, 32, '+', id, 'power'));
  g.appendChild(SvgUtil.text('+', { x: 5, y: 30, 'font-size': '9', fill: '#F44336', 'font-weight': 'bold' }));
  g.appendChild(SvgUtil.pinDot(40, 32, '-', id, 'gnd'));
  g.appendChild(SvgUtil.text('−', { x: 44, y: 30, 'font-size': '9', fill: '#aaa' }));

  this.element = g;
  this._freqLabel = freqLabel;
  this._waveG = waveG;
  return g;
};

Buzzer.prototype.getConnectionPoints = function() {
  return [
    { name: '+', x: 10, y: 32, type: 'power' },
    { name: '-', x: 40, y: 32, type: 'gnd' }
  ];
};

Buzzer.prototype.getBoundingBox = function() {
  return { x: 5, y: 5, width: 45, height: 45 };
};

Buzzer.prototype.onPwmChange = function(pin, duty, freq) {
  if (duty > 0 && freq > 0) {
    this._startSound(freq);
  } else {
    this._stopSound();
  }
};

Buzzer.prototype.onGpioChange = function(pin, value) {
  // 단순 ON/OFF (수동 부저에서는 별로 사용하지 않음)
  if (value === 0) this._stopSound();
};

Buzzer.prototype._startSound = function(freq) {
  this._freq = freq;
  if (this._freqLabel) this._freqLabel.textContent = freq + ' Hz';
  if (this._waveG) this._waveG.setAttribute('opacity', '1');

  // Web Audio API로 소리 생성
  try {
    if (!this._audioCtx) {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this._gainNode = this._audioCtx.createGain();
      this._gainNode.gain.value = 0.1; // 볼륨 10%
      this._gainNode.connect(this._audioCtx.destination);
    }
    if (this._oscillator) {
      this._oscillator.frequency.value = freq;
    } else {
      this._oscillator = this._audioCtx.createOscillator();
      this._oscillator.type = 'square'; // 부저 소리 = 사각파
      this._oscillator.frequency.value = freq;
      this._oscillator.connect(this._gainNode);
      this._oscillator.start();
    }
    this._active = true;
  } catch(e) {
    console.warn('Buzzer: Web Audio API 초기화 실패 -', e);
  }
};

Buzzer.prototype._stopSound = function() {
  this._freq = 0;
  if (this._freqLabel) this._freqLabel.textContent = '0 Hz';
  if (this._waveG) this._waveG.setAttribute('opacity', '0.3');

  if (this._oscillator) {
    try {
      this._oscillator.stop();
    } catch(e) {}
    this._oscillator.disconnect();
    this._oscillator = null;
  }
  this._active = false;
};

ComponentRegistry.register('Buzzer', Buzzer);


// ─────────────────────────────────────────────────────────────────────────────
// 7. Servo (서보 모터)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Servo 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - {}
 *
 * 핀: VCC(5V), GND, SIGNAL
 * 동작: PWM 신호(1000~2000μs)에 따라 0~180° 회전 표현
 *   duty(0~255) → 각도: (duty-26)/205 * 180 (대략)
 *   ledcWrite 기준 50Hz, duty 0~8191
 */
function Servo(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Servo', config);
  this._angle = 90; // 초기 각도 (0~180)
}
Servo.prototype = Object.create(ComponentBase.prototype);
Servo.prototype.constructor = Servo;

Servo.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-servo' });

  // 서보 본체
  g.appendChild(SvgUtil.el('rect', {
    x: 5, y: 15, width: 50, height: 35, rx: 4,
    fill: '#1565C0', stroke: '#1976D2', 'stroke-width': '1.5'
  }));
  // 상단 플랜지
  g.appendChild(SvgUtil.el('rect', {
    x: 2, y: 10, width: 56, height: 8, rx: 2,
    fill: '#0D47A1', stroke: '#1565C0', 'stroke-width': '1'
  }));

  // 샤프트 원
  var shaftBase = SvgUtil.el('circle', {
    cx: 30, cy: 15, r: 8,
    fill: '#E0E0E0', stroke: '#9E9E9E', 'stroke-width': '1.5'
  });
  g.appendChild(shaftBase);

  // 회전 암 (각도에 따라 애니메이션)
  var arm = SvgUtil.el('line', {
    x1: 30, y1: 15, x2: 30, y2: 5,
    stroke: '#FF5722', 'stroke-width': '3', 'stroke-linecap': 'round'
  });
  g.appendChild(arm);

  // 각도 표시
  var angleLabel = SvgUtil.text('90°', {
    x: 30, y: 40, 'text-anchor': 'middle',
    'font-size': '10', fill: '#fff', 'font-family': 'monospace', 'font-weight': 'bold'
  });
  g.appendChild(angleLabel);

  g.appendChild(SvgUtil.text('SERVO', {
    x: 30, y: 54, 'text-anchor': 'middle',
    'font-size': '8', fill: '#aaa', 'font-family': 'monospace'
  }));

  // 핀
  g.appendChild(SvgUtil.pinDot(10, 55, 'GND',    id, 'gnd'));
  g.appendChild(SvgUtil.text('G', { x:8, y:65, 'font-size':'7', fill:'#aaa' }));
  g.appendChild(SvgUtil.pinDot(30, 55, 'VCC',    id, 'power'));
  g.appendChild(SvgUtil.text('V', { x:28, y:65, 'font-size':'7', fill:'#F44336' }));
  g.appendChild(SvgUtil.pinDot(50, 55, 'SIGNAL', id, 'signal'));
  g.appendChild(SvgUtil.text('S', { x:48, y:65, 'font-size':'7', fill:'#FF9800' }));

  this.element = g;
  this._arm = arm;
  this._angleLabel = angleLabel;
  return g;
};

Servo.prototype.getConnectionPoints = function() {
  return [
    { name: 'GND',    x: 10, y: 55, type: 'gnd' },
    { name: 'VCC',    x: 30, y: 55, type: 'power' },
    { name: 'SIGNAL', x: 50, y: 55, type: 'signal' }
  ];
};

Servo.prototype.getBoundingBox = function() {
  return { x: 2, y: 5, width: 56, height: 62 };
};

Servo.prototype.onPwmChange = function(pin, duty, freq) {
  // 50Hz PWM: duty 0~8191 (13비트 해상도)
  // 1ms(0°) = duty 약 400, 2ms(180°) = duty 약 800 (기준: 8191 전체)
  // 실용적으로: duty 0~255 범위로 들어오면 0°~180° 매핑
  var angle;
  if (freq && Math.abs(freq - 50) < 5) {
    // 50Hz 서보 신호: 1~2ms 펄스
    var periodUs = 1000000 / freq;
    var pulseUs = (duty / 8191) * periodUs;
    angle = Math.round((pulseUs - 1000) / 1000 * 180);
  } else {
    // 일반 PWM: duty 0~255 → 0~180°
    angle = Math.round((duty / 255) * 180);
  }
  angle = Math.max(0, Math.min(180, angle));
  this._setAngle(angle);
};

Servo.prototype._setAngle = function(angle) {
  this._angle = angle;
  if (this._angleLabel) this._angleLabel.textContent = angle + '°';
  if (this._arm) {
    // 각도를 SVG 회전으로 변환 (0° = 위쪽, 180° = 아래쪽)
    var rad = ((angle - 90) * Math.PI) / 180;
    var len = 10;
    var x2 = 30 + Math.sin(rad) * len;
    var y2 = 15 - Math.cos(rad) * len;
    this._arm.setAttribute('x2', x2.toFixed(1));
    this._arm.setAttribute('y2', y2.toFixed(1));
  }
};

ComponentRegistry.register('Servo', Servo);


// ─────────────────────────────────────────────────────────────────────────────
// 8. DHT11 (온습도 센서)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * DHT11 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - { temp: 25, humidity: 50 }
 *
 * 핀: VCC, DATA, GND
 * 온도: -10~60°C, 습도: 0~100%
 * 슬라이더로 시뮬레이션 값 설정
 */
function DHT11(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'DHT11', config);
  this._temp     = config.temp     || 25;
  this._humidity = config.humidity || 50;
}
DHT11.prototype = Object.create(ComponentBase.prototype);
DHT11.prototype.constructor = DHT11;

DHT11.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-dht11' });

  // 본체 (파란 사각형 센서)
  g.appendChild(SvgUtil.el('rect', {
    x: 5, y: 5, width: 40, height: 55, rx: 6,
    fill: '#1565C0', stroke: '#1976D2', 'stroke-width': '1.5'
  }));
  // 상단 격자 (필터)
  g.appendChild(SvgUtil.el('rect', {
    x: 8, y: 8, width: 34, height: 25, rx: 3,
    fill: '#0D47A1', stroke: '#1976D2', 'stroke-width': '0.5'
  }));
  for (var i = 0; i < 4; i++) {
    g.appendChild(SvgUtil.el('line', {
      x1: 8 + i * 9, y1: 8, x2: 8 + i * 9, y2: 33,
      stroke: '#1976D2', 'stroke-width': '0.5'
    }));
  }

  // 타입 라벨
  g.appendChild(SvgUtil.text('DHT11', {
    x: 25, y: 46, 'text-anchor': 'middle',
    'font-size': '8', fill: '#fff', 'font-family': 'monospace', 'font-weight': 'bold'
  }));

  // 값 표시
  var tempLabel = SvgUtil.text('25°C', {
    x: 25, y: 75, 'text-anchor': 'middle',
    'font-size': '9', fill: '#FF5722', 'font-family': 'monospace'
  });
  var humLabel = SvgUtil.text('50%RH', {
    x: 25, y: 86, 'text-anchor': 'middle',
    'font-size': '8', fill: '#29B6F6', 'font-family': 'monospace'
  });
  g.appendChild(tempLabel);
  g.appendChild(humLabel);

  // 온도 슬라이더
  var foTemp = SvgUtil.el('foreignObject', { x: 2, y: 90, width: 48, height: 18 });
  var sliderTemp = document.createElement('input');
  sliderTemp.type = 'range'; sliderTemp.min = '-10'; sliderTemp.max = '60'; sliderTemp.value = '25';
  sliderTemp.style.cssText = 'width:44px;height:12px;';
  sliderTemp.addEventListener('input', function() {
    self._temp = parseInt(this.value);
    tempLabel.textContent = self._temp + '°C';
  });
  foTemp.appendChild(sliderTemp);
  g.appendChild(foTemp);

  // 습도 슬라이더
  var foHum = SvgUtil.el('foreignObject', { x: 2, y: 110, width: 48, height: 18 });
  var sliderHum = document.createElement('input');
  sliderHum.type = 'range'; sliderHum.min = '0'; sliderHum.max = '100'; sliderHum.value = '50';
  sliderHum.style.cssText = 'width:44px;height:12px;';
  sliderHum.addEventListener('input', function() {
    self._humidity = parseInt(this.value);
    humLabel.textContent = self._humidity + '%RH';
  });
  foHum.appendChild(sliderHum);
  g.appendChild(foHum);

  // 핀
  g.appendChild(SvgUtil.pinDot(10, 65, 'VCC',  id, 'power'));
  g.appendChild(SvgUtil.text('VCC', { x:2, y:62, 'font-size':'6', fill:'#F44336' }));
  g.appendChild(SvgUtil.pinDot(25, 65, 'DATA', id, 'digital'));
  g.appendChild(SvgUtil.text('DAT', { x:18, y:62, 'font-size':'6', fill:'#4CAF50' }));
  g.appendChild(SvgUtil.pinDot(40, 65, 'GND',  id, 'gnd'));
  g.appendChild(SvgUtil.text('GND', { x:33, y:62, 'font-size':'6', fill:'#aaa' }));

  this.element = g;
  return g;
};

DHT11.prototype.getConnectionPoints = function() {
  return [
    { name: 'VCC',  x: 10, y: 65, type: 'power' },
    { name: 'DATA', x: 25, y: 65, type: 'digital' },
    { name: 'GND',  x: 40, y: 65, type: 'gnd' }
  ];
};

DHT11.prototype.getBoundingBox = function() {
  return { x: 5, y: 5, width: 40, height: 125 };
};

/** 시뮬레이터의 dht.readTemperature() 연동 */
DHT11.prototype.readTemperature = function() { return this._temp; };
/** 시뮬레이터의 dht.readHumidity() 연동 */
DHT11.prototype.readHumidity    = function() { return this._humidity; };

ComponentRegistry.register('DHT11', DHT11);


// ─────────────────────────────────────────────────────────────────────────────
// 9. DHT22 (온습도 센서 - 고정밀)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * DHT22 컴포넌트 (DHT11과 유사, 더 넓은 범위)
 * 온도: -40~80°C, 습도: 0~100%
 */
function DHT22(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'DHT22', config);
  this._temp     = config.temp     || 25;
  this._humidity = config.humidity || 50;
}
DHT22.prototype = Object.create(ComponentBase.prototype);
DHT22.prototype.constructor = DHT22;

// DHT22는 DHT11과 SVG가 거의 동일, 색상과 라벨만 다름
DHT22.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-dht22' });

  g.appendChild(SvgUtil.el('rect', {
    x: 5, y: 5, width: 40, height: 55, rx: 6,
    fill: '#4A148C', stroke: '#7B1FA2', 'stroke-width': '1.5'
  }));
  g.appendChild(SvgUtil.el('rect', {
    x: 8, y: 8, width: 34, height: 25, rx: 3,
    fill: '#38006b', stroke: '#7B1FA2', 'stroke-width': '0.5'
  }));

  g.appendChild(SvgUtil.text('DHT22', {
    x: 25, y: 46, 'text-anchor': 'middle',
    'font-size': '8', fill: '#fff', 'font-family': 'monospace', 'font-weight': 'bold'
  }));

  var tempLabel = SvgUtil.text('25.0°C', {
    x: 25, y: 75, 'text-anchor': 'middle',
    'font-size': '8', fill: '#FF5722', 'font-family': 'monospace'
  });
  var humLabel = SvgUtil.text('50.0%RH', {
    x: 25, y: 86, 'text-anchor': 'middle',
    'font-size': '8', fill: '#29B6F6', 'font-family': 'monospace'
  });
  g.appendChild(tempLabel); g.appendChild(humLabel);

  var foTemp = SvgUtil.el('foreignObject', { x: 2, y: 90, width: 48, height: 18 });
  var sliderTemp = document.createElement('input');
  sliderTemp.type = 'range'; sliderTemp.min = '-40'; sliderTemp.max = '80'; sliderTemp.value = '25'; sliderTemp.step = '0.1';
  sliderTemp.style.cssText = 'width:44px;height:12px;';
  sliderTemp.addEventListener('input', function() {
    self._temp = parseFloat(this.value);
    tempLabel.textContent = self._temp.toFixed(1) + '°C';
  });
  foTemp.appendChild(sliderTemp);
  g.appendChild(foTemp);

  var foHum = SvgUtil.el('foreignObject', { x: 2, y: 110, width: 48, height: 18 });
  var sliderHum = document.createElement('input');
  sliderHum.type = 'range'; sliderHum.min = '0'; sliderHum.max = '100'; sliderHum.value = '50'; sliderHum.step = '0.1';
  sliderHum.style.cssText = 'width:44px;height:12px;';
  sliderHum.addEventListener('input', function() {
    self._humidity = parseFloat(this.value);
    humLabel.textContent = self._humidity.toFixed(1) + '%RH';
  });
  foHum.appendChild(sliderHum);
  g.appendChild(foHum);

  g.appendChild(SvgUtil.pinDot(10, 65, 'VCC',  id, 'power'));
  g.appendChild(SvgUtil.text('VCC', { x:2, y:62, 'font-size':'6', fill:'#F44336' }));
  g.appendChild(SvgUtil.pinDot(25, 65, 'DATA', id, 'digital'));
  g.appendChild(SvgUtil.text('DAT', { x:18, y:62, 'font-size':'6', fill:'#4CAF50' }));
  g.appendChild(SvgUtil.pinDot(40, 65, 'GND',  id, 'gnd'));
  g.appendChild(SvgUtil.text('GND', { x:33, y:62, 'font-size':'6', fill:'#aaa' }));

  this.element = g;
  return g;
};

DHT22.prototype.getConnectionPoints = DHT11.prototype.getConnectionPoints;
DHT22.prototype.getBoundingBox = DHT11.prototype.getBoundingBox;
DHT22.prototype.readTemperature = function() { return this._temp; };
DHT22.prototype.readHumidity    = function() { return this._humidity; };

ComponentRegistry.register('DHT22', DHT22);


// ─────────────────────────────────────────────────────────────────────────────
// 10. Ultrasonic_HC_SR04 (초음파 거리 센서)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * HC-SR04 초음파 센서
 * @param {string} id     - 고유 ID
 * @param {Object} config - { distance: 20 }  (cm)
 *
 * 핀: VCC, TRIG, ECHO, GND
 * 동작:
 *   TRIG에 10μs HIGH → ECHO 핀에 거리 비례 펄스 출력
 *   슬라이더로 거리(2~400cm) 설정
 */
function Ultrasonic_HC_SR04(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Ultrasonic_HC_SR04', config);
  this._distance = config.distance || 20; // cm
  this._trigState = 0;
  this._trigStartTime = 0;
  this._echoCallback = null;
}
Ultrasonic_HC_SR04.prototype = Object.create(ComponentBase.prototype);
Ultrasonic_HC_SR04.prototype.constructor = Ultrasonic_HC_SR04;

Ultrasonic_HC_SR04.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-hcsr04' });

  // 기판
  g.appendChild(SvgUtil.el('rect', {
    x: 2, y: 5, width: 72, height: 35, rx: 3,
    fill: '#2E7D32', stroke: '#388E3C', 'stroke-width': '1.5'
  }));

  // 좌측 트랜스듀서 (송신)
  g.appendChild(SvgUtil.el('ellipse', { cx: 20, cy: 22, rx: 13, ry: 13, fill: '#111', stroke: '#555', 'stroke-width': '1.5' }));
  g.appendChild(SvgUtil.el('ellipse', { cx: 20, cy: 22, rx: 9,  ry: 9,  fill: '#222', stroke: '#444', 'stroke-width': '1' }));
  g.appendChild(SvgUtil.el('ellipse', { cx: 20, cy: 22, rx: 4,  ry: 4,  fill: '#333' }));

  // 우측 트랜스듀서 (수신)
  g.appendChild(SvgUtil.el('ellipse', { cx: 56, cy: 22, rx: 13, ry: 13, fill: '#111', stroke: '#555', 'stroke-width': '1.5' }));
  g.appendChild(SvgUtil.el('ellipse', { cx: 56, cy: 22, rx: 9,  ry: 9,  fill: '#222', stroke: '#444', 'stroke-width': '1' }));
  g.appendChild(SvgUtil.el('ellipse', { cx: 56, cy: 22, rx: 4,  ry: 4,  fill: '#333' }));

  // 라벨
  g.appendChild(SvgUtil.text('HC-SR04', {
    x: 38, y: 50, 'text-anchor': 'middle',
    'font-size': '7', fill: '#ccc', 'font-family': 'monospace'
  }));

  // 거리 표시
  var distLabel = SvgUtil.text('20 cm', {
    x: 38, y: 62, 'text-anchor': 'middle',
    'font-size': '9', fill: '#76FF03', 'font-family': 'monospace', 'font-weight': 'bold'
  });
  g.appendChild(distLabel);

  // 거리 슬라이더
  var fo = SvgUtil.el('foreignObject', { x: 2, y: 65, width: 72, height: 18 });
  var slider = document.createElement('input');
  slider.type = 'range'; slider.min = '2'; slider.max = '400'; slider.value = '20';
  slider.style.cssText = 'width:68px;height:12px;';
  slider.addEventListener('input', function() {
    self._distance = parseInt(this.value);
    distLabel.textContent = self._distance + ' cm';
  });
  fo.appendChild(slider);
  g.appendChild(fo);

  // 핀 (왼쪽부터 VCC, TRIG, ECHO, GND)
  var pins = ['VCC','TRIG','ECHO','GND'];
  var types = ['power','signal','signal','gnd'];
  var colors = ['#F44336','#FF9800','#4CAF50','#aaa'];
  for (var i = 0; i < 4; i++) {
    var px = 10 + i * 20;
    g.appendChild(SvgUtil.pinDot(px, 42, pins[i], id, types[i]));
    g.appendChild(SvgUtil.text(pins[i].substring(0, 3), {
      x: px, y: 54, 'text-anchor': 'middle', 'font-size': '6', fill: colors[i]
    }));
  }

  this.element = g;
  this._distLabel = distLabel;
  return g;
};

Ultrasonic_HC_SR04.prototype.getConnectionPoints = function() {
  return [
    { name: 'VCC',  x: 10, y: 42, type: 'power' },
    { name: 'TRIG', x: 30, y: 42, type: 'signal' },
    { name: 'ECHO', x: 50, y: 42, type: 'signal' },
    { name: 'GND',  x: 70, y: 42, type: 'gnd' }
  ];
};

Ultrasonic_HC_SR04.prototype.getBoundingBox = function() {
  return { x: 2, y: 5, width: 72, height: 80 };
};

Ultrasonic_HC_SR04.prototype.onGpioChange = function(pin, value) {
  // TRIG 핀에 HIGH → 타이머 시작, LOW → ECHO 펄스 생성
  var trigPin = this.connections['TRIG'];
  if (pin !== trigPin) return;

  if (value === 1) {
    this._trigStartTime = performance.now();
    this._trigState = 1;
  } else if (value === 0 && this._trigState === 1) {
    this._trigState = 0;
    var pulseUs = (performance.now() - this._trigStartTime) * 1000;
    // 10μs 이상이면 에코 응답 생성
    if (pulseUs >= 10 && this._echoCallback) {
      // 거리(cm) → 에코 시간(μs): 왕복 = cm * 58.2μs/cm
      var echoDurationUs = this._distance * 58.2;
      this._echoCallback(echoDurationUs);
    }
  }
};

/** 에코 응답 콜백 등록 (시뮬레이터 코어에서 사용) */
Ultrasonic_HC_SR04.prototype.setEchoCallback = function(fn) {
  this._echoCallback = fn;
};

ComponentRegistry.register('Ultrasonic_HC_SR04', Ultrasonic_HC_SR04);


// ─────────────────────────────────────────────────────────────────────────────
// 11. PIR_Sensor (인체 감지 센서, HC-SR501)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * PIR Sensor 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - {}
 *
 * 핀: VCC, OUT, GND
 * 동작: 클릭으로 모션 감지 토글 (OUT: 감지시 HIGH, 미감지시 LOW)
 */
function PIR_Sensor(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'PIR_Sensor', config);
  this._motion = false;
}
PIR_Sensor.prototype = Object.create(ComponentBase.prototype);
PIR_Sensor.prototype.constructor = PIR_Sensor;

PIR_Sensor.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-pir' });

  // 베이스 원통
  g.appendChild(SvgUtil.el('ellipse', {
    cx: 25, cy: 32, rx: 20, ry: 6,
    fill: '#455A64', stroke: '#546E7A', 'stroke-width': '1'
  }));
  g.appendChild(SvgUtil.el('rect', {
    x: 5, y: 15, width: 40, height: 18, rx: 0,
    fill: '#455A64', stroke: '#546E7A', 'stroke-width': '1'
  }));

  // 돔 (반구)
  var domPath = 'M5,15 Q5,0 25,0 Q45,0 45,15 Z';
  var dome = SvgUtil.el('path', {
    d: domPath,
    fill: '#F5F5F5', stroke: '#9E9E9E', 'stroke-width': '1.5',
    style: 'cursor: pointer;'
  });
  g.appendChild(dome);

  // 감지 상태 표시 (돔 내부 색상)
  var domeInner = SvgUtil.el('path', {
    d: 'M10,14 Q10,4 25,4 Q40,4 40,14 Z',
    fill: 'rgba(0,255,0,0)',
    'class': 'pir-state'
  });
  g.appendChild(domeInner);

  // 라벨
  g.appendChild(SvgUtil.text('PIR', {
    x: 25, y: 25, 'text-anchor': 'middle',
    'font-size': '8', fill: '#ccc', 'font-family': 'monospace'
  }));

  var stateLabel = SvgUtil.text('NO MOTION', {
    x: 25, y: 48, 'text-anchor': 'middle',
    'font-size': '7', fill: '#aaa', 'font-family': 'monospace'
  });
  g.appendChild(stateLabel);

  // 클릭으로 토글
  var hitArea = SvgUtil.el('path', {
    d: domPath, fill: 'transparent', style: 'cursor: pointer;'
  });
  hitArea.addEventListener('click', function() {
    self._motion = !self._motion;
    if (self._motion) {
      domeInner.setAttribute('fill', 'rgba(76,175,80,0.5)');
      stateLabel.textContent = 'MOTION!';
      stateLabel.setAttribute('fill', '#4CAF50');
    } else {
      domeInner.setAttribute('fill', 'rgba(0,255,0,0)');
      stateLabel.textContent = 'NO MOTION';
      stateLabel.setAttribute('fill', '#aaa');
    }
  });
  g.appendChild(hitArea);

  // 핀
  g.appendChild(SvgUtil.pinDot(10, 40, 'VCC', id, 'power'));
  g.appendChild(SvgUtil.text('VCC', { x:2, y:38, 'font-size':'6', fill:'#F44336' }));
  g.appendChild(SvgUtil.pinDot(25, 40, 'OUT', id, 'digital'));
  g.appendChild(SvgUtil.text('OUT', { x:20, y:38, 'font-size':'6', fill:'#4CAF50' }));
  g.appendChild(SvgUtil.pinDot(40, 40, 'GND', id, 'gnd'));
  g.appendChild(SvgUtil.text('GND', { x:33, y:38, 'font-size':'6', fill:'#aaa' }));

  this.element = g;
  return g;
};

PIR_Sensor.prototype.getConnectionPoints = function() {
  return [
    { name: 'VCC', x: 10, y: 40, type: 'power' },
    { name: 'OUT', x: 25, y: 40, type: 'digital' },
    { name: 'GND', x: 40, y: 40, type: 'gnd' }
  ];
};

PIR_Sensor.prototype.getBoundingBox = function() {
  return { x: 5, y: 0, width: 40, height: 55 };
};

PIR_Sensor.prototype.getDigitalValue = function(pin) {
  return this._motion ? 1 : 0;
};

ComponentRegistry.register('PIR_Sensor', PIR_Sensor);


// ─────────────────────────────────────────────────────────────────────────────
// 12. OLED_SSD1306 (128x64 OLED 디스플레이)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * OLED SSD1306 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - { width: 128, height: 64 }
 *
 * I2C 핀: SDA, SCL, VCC, GND
 * 실제 픽셀 렌더링 (canvas 사용)
 *
 * API:
 *   oled.clearDisplay()
 *   oled.drawPixel(x, y, color)
 *   oled.print(text)  / oled.println(text)
 *   oled.setCursor(x, y)
 *   oled.display()   → 버퍼 반영
 */
function OLED_SSD1306(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'OLED_SSD1306', config);
  this.oledW = config.width  || 128;
  this.oledH = config.height || 64;
  this._buffer = new Uint8Array(this.oledW * this.oledH); // 0=off, 1=on
  this._cursorX = 0;
  this._cursorY = 0;
  this._canvas = null;
  this._ctx = null;
  this._scale = 1.5; // 표시 배율
}
OLED_SSD1306.prototype = Object.create(ComponentBase.prototype);
OLED_SSD1306.prototype.constructor = OLED_SSD1306;

OLED_SSD1306.prototype.createSvg = function() {
  var id = this.id;
  var w = this.oledW;
  var h = this.oledH;
  var scale = this._scale;
  var dispW = w * scale;
  var dispH = h * scale;

  var g = SvgUtil.el('g', { id: id, 'class': 'component component-oled' });

  // 외곽 프레임
  g.appendChild(SvgUtil.el('rect', {
    x: 0, y: 0, width: dispW + 16, height: dispH + 30, rx: 5,
    fill: '#0D0D0D', stroke: '#333', 'stroke-width': '1.5'
  }));

  // 화면 프레임 (파란 테두리)
  g.appendChild(SvgUtil.el('rect', {
    x: 6, y: 6, width: dispW + 4, height: dispH + 4, rx: 2,
    fill: '#000', stroke: '#1565C0', 'stroke-width': '1.5'
  }));

  // Canvas (픽셀 렌더링)
  var fo = SvgUtil.el('foreignObject', { x: 8, y: 8, width: dispW, height: dispH });
  var canvas = document.createElement('canvas');
  canvas.width  = dispW;
  canvas.height = dispH;
  canvas.style.cssText = 'display:block;image-rendering:pixelated;background:#000;';
  fo.appendChild(canvas);
  g.appendChild(fo);

  this._canvas = canvas;
  this._ctx    = canvas.getContext('2d');
  this._render();

  // 라벨
  g.appendChild(SvgUtil.text('SSD1306 128×64', {
    x: (dispW + 16) / 2, y: dispH + 22, 'text-anchor': 'middle',
    'font-size': '7', fill: '#aaa', 'font-family': 'monospace'
  }));

  // I2C 핀
  var pinY = dispH + 28;
  g.appendChild(SvgUtil.pinDot(10,         pinY, 'GND', id, 'gnd'));
  g.appendChild(SvgUtil.pinDot(30,         pinY, 'VCC', id, 'power'));
  g.appendChild(SvgUtil.pinDot(50,         pinY, 'SCL', id, 'i2c'));
  g.appendChild(SvgUtil.pinDot(70,         pinY, 'SDA', id, 'i2c'));
  var labels = ['GND','VCC','SCL','SDA'];
  var lColors = ['#aaa','#F44336','#9C27B0','#9C27B0'];
  for (var i = 0; i < 4; i++) {
    g.appendChild(SvgUtil.text(labels[i], {
      x: 10 + i * 20, y: pinY + 12, 'text-anchor': 'middle',
      'font-size': '6', fill: lColors[i]
    }));
  }

  this.element = g;
  return g;
};

OLED_SSD1306.prototype.getConnectionPoints = function() {
  var pinY = this.oledH * this._scale + 28;
  return [
    { name: 'GND', x: 10, y: pinY, type: 'gnd' },
    { name: 'VCC', x: 30, y: pinY, type: 'power' },
    { name: 'SCL', x: 50, y: pinY, type: 'i2c' },
    { name: 'SDA', x: 70, y: pinY, type: 'i2c' }
  ];
};

OLED_SSD1306.prototype.getBoundingBox = function() {
  return { x: 0, y: 0, width: this.oledW * this._scale + 16, height: this.oledH * this._scale + 40 };
};

/** 화면 지우기 */
OLED_SSD1306.prototype.clearDisplay = function() {
  for (var i = 0; i < this._buffer.length; i++) this._buffer[i] = 0;
  this._cursorX = 0; this._cursorY = 0;
};

/** 픽셀 그리기 */
OLED_SSD1306.prototype.drawPixel = function(x, y, color) {
  if (x < 0 || x >= this.oledW || y < 0 || y >= this.oledH) return;
  this._buffer[y * this.oledW + x] = (color ? 1 : 0);
};

/** 커서 위치 설정 (픽셀 단위) */
OLED_SSD1306.prototype.setCursor = function(x, y) {
  this._cursorX = x;
  this._cursorY = y;
};

/** 텍스트 출력 (8x8 픽셀 폰트 시뮬레이션) */
OLED_SSD1306.prototype.print = function(text) {
  var str = String(text);
  for (var i = 0; i < str.length; i++) {
    this._drawChar(str.charCodeAt(i));
    this._cursorX += 6;
    if (this._cursorX + 6 > this.oledW) {
      this._cursorX = 0;
      this._cursorY += 8;
    }
  }
};

OLED_SSD1306.prototype.println = function(text) {
  this.print(text);
  this._cursorX = 0;
  this._cursorY += 8;
};

/** 내부: 단일 문자 픽셀 렌더링 (단순화된 5x7 폰트) */
OLED_SSD1306.prototype._drawChar = function(code) {
  // 간단한 폰트 데이터 (ASCII 32~126)
  // 실제 구현에서는 전체 폰트 테이블 사용
  var x = this._cursorX;
  var y = this._cursorY;
  var w = this.oledW;
  var buf = this._buffer;

  // 임시 구현: 직사각형으로 문자 위치 표시
  for (var row = 1; row < 7; row++) {
    for (var col = 0; col < 5; col++) {
      if (x + col < w && y + row < this.oledH) {
        // 단순히 테두리 픽셀만 그림 (실제 폰트는 font.js에서 별도 제공)
        if (row === 1 || row === 6 || col === 0 || col === 4) {
          buf[(y + row) * w + (x + col)] = 1;
        }
      }
    }
  }
};

/** 버퍼를 캔버스에 반영 */
OLED_SSD1306.prototype.display = function() {
  this._render();
};

OLED_SSD1306.prototype._render = function() {
  if (!this._ctx) return;
  var ctx = this._ctx;
  var w = this.oledW;
  var h = this.oledH;
  var scale = this._scale;
  var buf = this._buffer;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w * scale, h * scale);

  ctx.fillStyle = '#00E5FF'; // OLED 발광색 (청록)
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      if (buf[y * w + x]) {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
};

ComponentRegistry.register('OLED_SSD1306', OLED_SSD1306);


// ─────────────────────────────────────────────────────────────────────────────
// 13. LCD_1602 (16x2 문자 LCD)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * LCD 1602 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - {}
 *
 * I2C 핀: SDA, SCL, VCC, GND
 * 16컬럼 x 2행 문자 표시
 */
function LCD_1602(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'LCD_1602', config);
  // 16x2 문자 버퍼 (공백으로 초기화)
  this._chars = [
    new Array(16).fill(' '),
    new Array(16).fill(' ')
  ];
  this._cursorCol = 0;
  this._cursorRow = 0;
  this._canvas = null;
  this._ctx = null;
}
LCD_1602.prototype = Object.create(ComponentBase.prototype);
LCD_1602.prototype.constructor = LCD_1602;

LCD_1602.prototype.createSvg = function() {
  var id = this.id;
  var dispW = 120; // 픽셀 너비
  var dispH = 35;  // 픽셀 높이

  var g = SvgUtil.el('g', { id: id, 'class': 'component component-lcd1602' });

  // 외곽 프레임
  g.appendChild(SvgUtil.el('rect', {
    x: 0, y: 0, width: dispW + 16, height: dispH + 30, rx: 4,
    fill: '#1A237E', stroke: '#283593', 'stroke-width': '1.5'
  }));

  // 화면 프레임 (녹색 LCD 색상)
  g.appendChild(SvgUtil.el('rect', {
    x: 6, y: 5, width: dispW + 4, height: dispH + 4, rx: 2,
    fill: '#33691E', stroke: '#558B2F', 'stroke-width': '1'
  }));

  // Canvas (문자 렌더링)
  var fo = SvgUtil.el('foreignObject', { x: 8, y: 7, width: dispW, height: dispH });
  var canvas = document.createElement('canvas');
  canvas.width  = dispW;
  canvas.height = dispH;
  canvas.style.cssText = 'display:block;background:#33691E;';
  fo.appendChild(canvas);
  g.appendChild(fo);

  this._canvas = canvas;
  this._ctx    = canvas.getContext('2d');
  this._render();

  // 라벨
  g.appendChild(SvgUtil.text('LCD 1602 I2C', {
    x: (dispW + 16) / 2, y: dispH + 18, 'text-anchor': 'middle',
    'font-size': '7', fill: '#aaa', 'font-family': 'monospace'
  }));

  // I2C 핀
  var pinY = dispH + 26;
  g.appendChild(SvgUtil.pinDot(10,  pinY, 'GND', id, 'gnd'));
  g.appendChild(SvgUtil.pinDot(30,  pinY, 'VCC', id, 'power'));
  g.appendChild(SvgUtil.pinDot(50,  pinY, 'SCL', id, 'i2c'));
  g.appendChild(SvgUtil.pinDot(70,  pinY, 'SDA', id, 'i2c'));
  var labels  = ['GND','VCC','SCL','SDA'];
  var lColors = ['#aaa','#F44336','#9C27B0','#9C27B0'];
  for (var i = 0; i < 4; i++) {
    g.appendChild(SvgUtil.text(labels[i], {
      x: 10 + i * 20, y: pinY + 12, 'text-anchor': 'middle',
      'font-size': '6', fill: lColors[i]
    }));
  }

  this.element = g;
  return g;
};

LCD_1602.prototype.getConnectionPoints = function() {
  var pinY = 35 + 26;
  return [
    { name: 'GND', x: 10, y: pinY, type: 'gnd' },
    { name: 'VCC', x: 30, y: pinY, type: 'power' },
    { name: 'SCL', x: 50, y: pinY, type: 'i2c' },
    { name: 'SDA', x: 70, y: pinY, type: 'i2c' }
  ];
};

LCD_1602.prototype.getBoundingBox = function() {
  return { x: 0, y: 0, width: 136, height: 75 };
};

LCD_1602.prototype.setCursor = function(col, row) {
  this._cursorCol = Math.max(0, Math.min(15, col));
  this._cursorRow = Math.max(0, Math.min(1,  row));
};

LCD_1602.prototype.print = function(text) {
  var str = String(text);
  for (var i = 0; i < str.length; i++) {
    if (this._cursorCol < 16) {
      this._chars[this._cursorRow][this._cursorCol] = str[i];
      this._cursorCol++;
    }
  }
  this._render();
};

LCD_1602.prototype.clear = function() {
  this._chars = [
    new Array(16).fill(' '),
    new Array(16).fill(' ')
  ];
  this._cursorCol = 0;
  this._cursorRow = 0;
  this._render();
};

LCD_1602.prototype._render = function() {
  if (!this._ctx) return;
  var ctx = this._ctx;
  ctx.fillStyle = '#33691E';
  ctx.fillRect(0, 0, 120, 35);
  ctx.fillStyle = '#CCFF90';
  ctx.font = '14px monospace';
  ctx.fillText(this._chars[0].join(''), 2, 14);
  ctx.fillText(this._chars[1].join(''), 2, 30);
};

ComponentRegistry.register('LCD_1602', LCD_1602);


// ─────────────────────────────────────────────────────────────────────────────
// 14. DC_Motor_L298N (DC 모터 드라이버)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * L298N 모터 드라이버 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - {}
 *
 * 핀: ENA, IN1, IN2, GND, VCC, OUT1, OUT2
 * 동작: 방향 화살표 + 속도 % 표시
 */
function DC_Motor_L298N(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'DC_Motor_L298N', config);
  this._speed = 0;   // 0~100%
  this._dir = 0;     // -1: 역방향, 0: 정지, 1: 정방향
}
DC_Motor_L298N.prototype = Object.create(ComponentBase.prototype);
DC_Motor_L298N.prototype.constructor = DC_Motor_L298N;

DC_Motor_L298N.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-l298n' });

  // 메인 기판
  g.appendChild(SvgUtil.el('rect', {
    x: 2, y: 2, width: 70, height: 60, rx: 4,
    fill: '#004D40', stroke: '#00796B', 'stroke-width': '1.5'
  }));

  // 칩 (중앙)
  g.appendChild(SvgUtil.el('rect', {
    x: 20, y: 15, width: 34, height: 26, rx: 2,
    fill: '#1a1a1a', stroke: '#555', 'stroke-width': '1'
  }));
  g.appendChild(SvgUtil.text('L298N', {
    x: 37, y: 31, 'text-anchor': 'middle',
    'font-size': '8', fill: '#aaa', 'font-family': 'monospace'
  }));

  // 방향 화살표
  var arrowEl = SvgUtil.el('text', {
    x: 37, y: 50, 'text-anchor': 'middle',
    'font-size': '14', fill: '#76FF03', 'font-family': 'monospace'
  });
  arrowEl.textContent = '●';
  g.appendChild(arrowEl);

  // 속도 라벨
  var speedLabel = SvgUtil.text('0%', {
    x: 37, y: 70, 'text-anchor': 'middle',
    'font-size': '9', fill: '#aaa', 'font-family': 'monospace'
  });
  g.appendChild(speedLabel);

  // 핀 (좌: ENA,IN1,IN2,GND | 우: VCC,OUT1,OUT2)
  var leftPins  = ['ENA','IN1','IN2','GND'];
  var rightPins = ['VCC','OUT1','OUT2'];
  var leftTypes  = ['signal','digital','digital','gnd'];
  var rightTypes = ['power','signal','signal'];

  for (var i = 0; i < leftPins.length; i++) {
    var py = 8 + i * 14;
    g.appendChild(SvgUtil.pinDot(2, py, leftPins[i], id, leftTypes[i]));
    g.appendChild(SvgUtil.text(leftPins[i], { x: -22, y: py + 3, 'font-size': '6', fill: '#ccc' }));
  }
  for (var j = 0; j < rightPins.length; j++) {
    var ry = 8 + j * 18;
    g.appendChild(SvgUtil.pinDot(72, ry, rightPins[j], id, rightTypes[j]));
    g.appendChild(SvgUtil.text(rightPins[j], { x: 74, y: ry + 3, 'font-size': '6', fill: '#ccc' }));
  }

  this.element = g;
  this._arrowEl = arrowEl;
  this._speedLabel = speedLabel;
  return g;
};

DC_Motor_L298N.prototype.getConnectionPoints = function() {
  return [
    { name: 'ENA',  x: 2,  y: 8,  type: 'signal' },
    { name: 'IN1',  x: 2,  y: 22, type: 'digital' },
    { name: 'IN2',  x: 2,  y: 36, type: 'digital' },
    { name: 'GND',  x: 2,  y: 50, type: 'gnd' },
    { name: 'VCC',  x: 72, y: 8,  type: 'power' },
    { name: 'OUT1', x: 72, y: 26, type: 'signal' },
    { name: 'OUT2', x: 72, y: 44, type: 'signal' }
  ];
};

DC_Motor_L298N.prototype.getBoundingBox = function() {
  return { x: 2, y: 2, width: 70, height: 72 };
};

DC_Motor_L298N.prototype._updateState = function(in1, in2, ena) {
  if (ena === 0) {
    this._speed = 0;
    this._dir = 0;
  } else {
    if (in1 === 1 && in2 === 0) this._dir = 1;
    else if (in1 === 0 && in2 === 1) this._dir = -1;
    else this._dir = 0;
  }
  if (this._arrowEl) {
    this._arrowEl.textContent = this._dir === 1 ? '▶' : this._dir === -1 ? '◀' : '●';
    this._arrowEl.setAttribute('fill', this._dir === 0 ? '#aaa' : '#76FF03');
  }
  if (this._speedLabel) {
    this._speedLabel.textContent = this._speed + '%';
  }
};

DC_Motor_L298N.prototype.onGpioChange = function(pin, value) {
  // 핀 상태 변화를 내부적으로 추적
  // 실제 구현은 CircuitEditor에서 전체 핀 상태를 종합하여 호출
};

DC_Motor_L298N.prototype.onPwmChange = function(pin, duty, freq) {
  this._speed = Math.round((duty / 255) * 100);
  this._dir = 1; // PWM이 있으면 정방향 가정
  this._updateState(1, 0, 1);
};

ComponentRegistry.register('DC_Motor_L298N', DC_Motor_L298N);


// ─────────────────────────────────────────────────────────────────────────────
// 15. Relay_Module (릴레이 모듈)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Relay Module 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - { activeHigh: false }  (true: HIGH 활성화, false: LOW 활성화)
 *
 * 핀: VCC, GND, IN, NO, COM, NC
 * 동작: 코일 활성화 시 시각화
 */
function Relay_Module(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Relay_Module', config);
  this._activeHigh = (config.activeHigh === true);
  this._activated = false;
}
Relay_Module.prototype = Object.create(ComponentBase.prototype);
Relay_Module.prototype.constructor = Relay_Module;

Relay_Module.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-relay' });

  // 기판
  g.appendChild(SvgUtil.el('rect', {
    x: 2, y: 2, width: 62, height: 55, rx: 3,
    fill: '#1A237E', stroke: '#283593', 'stroke-width': '1.5'
  }));

  // 릴레이 코일 사각형
  g.appendChild(SvgUtil.el('rect', {
    x: 8, y: 8, width: 28, height: 22, rx: 2,
    fill: '#0D47A1', stroke: '#1565C0', 'stroke-width': '1'
  }));
  g.appendChild(SvgUtil.text('COIL', {
    x: 22, y: 20, 'text-anchor': 'middle',
    'font-size': '7', fill: '#90CAF9'
  }));

  // 스위치 심볼
  var switchLine = SvgUtil.el('line', {
    x1: 40, y1: 22, x2: 55, y2: 15,
    stroke: '#aaa', 'stroke-width': '2', 'stroke-linecap': 'round'
  });
  g.appendChild(switchLine);
  g.appendChild(SvgUtil.el('circle', { cx: 40, cy: 22, r: 2, fill: '#aaa' }));
  g.appendChild(SvgUtil.el('circle', { cx: 55, cy: 10, r: 2, fill: '#4CAF50' })); // NO
  g.appendChild(SvgUtil.el('circle', { cx: 55, cy: 22, r: 2, fill: '#F44336' })); // NC

  // LED 표시
  var ledIndicator = SvgUtil.el('circle', {
    cx: 55, cy: 35, r: 5,
    fill: '#1B5E20', stroke: '#2E7D32', 'stroke-width': '1',
    'class': 'relay-led'
  });
  g.appendChild(ledIndicator);

  // 상태 라벨
  var stateLabel = SvgUtil.text('OFF', {
    x: 32, y: 48, 'text-anchor': 'middle',
    'font-size': '8', fill: '#aaa', 'font-family': 'monospace', 'font-weight': 'bold'
  });
  g.appendChild(stateLabel);

  // 핀
  var ctrlPins = ['VCC','GND','IN'];
  var loadPins = ['NO','COM','NC'];
  for (var i = 0; i < 3; i++) {
    var cy = 10 + i * 14;
    g.appendChild(SvgUtil.pinDot(2, cy, ctrlPins[i], id,
      i === 0 ? 'power' : i === 1 ? 'gnd' : 'digital'));
    g.appendChild(SvgUtil.text(ctrlPins[i], { x: -18, y: cy + 3, 'font-size': '6', fill: '#ccc' }));
  }
  for (var j = 0; j < 3; j++) {
    var ly = 10 + j * 14;
    g.appendChild(SvgUtil.pinDot(64, ly, loadPins[j], id, 'signal'));
    g.appendChild(SvgUtil.text(loadPins[j], { x: 66, y: ly + 3, 'font-size': '6', fill: '#ccc' }));
  }

  this.element = g;
  this._ledIndicator = ledIndicator;
  this._stateLabel   = stateLabel;
  this._switchLine   = switchLine;
  return g;
};

Relay_Module.prototype.getConnectionPoints = function() {
  return [
    { name: 'VCC', x: 2,  y: 10, type: 'power' },
    { name: 'GND', x: 2,  y: 24, type: 'gnd' },
    { name: 'IN',  x: 2,  y: 38, type: 'digital' },
    { name: 'NO',  x: 64, y: 10, type: 'signal' },
    { name: 'COM', x: 64, y: 24, type: 'signal' },
    { name: 'NC',  x: 64, y: 38, type: 'signal' }
  ];
};

Relay_Module.prototype.getBoundingBox = function() {
  return { x: 2, y: 2, width: 62, height: 55 };
};

Relay_Module.prototype.onGpioChange = function(pin, value) {
  var activated;
  if (this._activeHigh) {
    activated = (value === 1);
  } else {
    // 보통 릴레이 모듈은 LOW 활성화
    activated = (value === 0);
  }
  this._setActivated(activated);
};

Relay_Module.prototype._setActivated = function(on) {
  this._activated = on;
  if (this._ledIndicator) {
    this._ledIndicator.setAttribute('fill', on ? '#4CAF50' : '#1B5E20');
  }
  if (this._stateLabel) {
    this._stateLabel.textContent = on ? 'ON' : 'OFF';
    this._stateLabel.setAttribute('fill', on ? '#4CAF50' : '#aaa');
  }
  if (this._switchLine) {
    // 스위치 위치 변경 (활성화시 NO쪽으로 연결)
    this._switchLine.setAttribute('y2', on ? '10' : '15');
  }
};

ComponentRegistry.register('Relay_Module', Relay_Module);


// ─────────────────────────────────────────────────────────────────────────────
// 16. PowerRail (전원 레일, 3.3V / 5V)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * PowerRail 컴포넌트
 * @param {string} id     - 고유 ID
 * @param {Object} config - { voltage: 3.3 }  (3.3 또는 5)
 *
 * 브레드보드 전원 레일 역할
 */
function PowerRail(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'PowerRail', config);
  this.voltage = config.voltage || 3.3;
}
PowerRail.prototype = Object.create(ComponentBase.prototype);
PowerRail.prototype.constructor = PowerRail;

PowerRail.prototype.createSvg = function() {
  var id = this.id;
  var label = this.voltage + 'V';
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-power-rail' });

  // 빨간 레일 선
  g.appendChild(SvgUtil.el('rect', {
    x: 0, y: 8, width: 120, height: 6, rx: 3,
    fill: '#F44336', opacity: '0.8'
  }));
  // 전압 라벨 배경
  g.appendChild(SvgUtil.el('rect', {
    x: 2, y: 2, width: 30, height: 14, rx: 2,
    fill: '#B71C1C'
  }));
  g.appendChild(SvgUtil.text(label, {
    x: 17, y: 13, 'text-anchor': 'middle',
    'font-size': '8', fill: '#fff', 'font-family': 'monospace', 'font-weight': 'bold'
  }));

  // 연결 핀들 (5개)
  for (var i = 0; i < 5; i++) {
    var px = 40 + i * 16;
    g.appendChild(SvgUtil.pinDot(px, 11, 'P' + (i + 1), id, 'power'));
  }

  this.element = g;
  return g;
};

PowerRail.prototype.getConnectionPoints = function() {
  var pts = [];
  for (var i = 0; i < 5; i++) {
    pts.push({ name: 'P' + (i + 1), x: 40 + i * 16, y: 11, type: 'power' });
  }
  return pts;
};

PowerRail.prototype.getBoundingBox = function() {
  return { x: 0, y: 2, width: 120, height: 16 };
};

ComponentRegistry.register('PowerRail', PowerRail);


// ─────────────────────────────────────────────────────────────────────────────
// 17. GndRail (GND 레일)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * GndRail 컴포넌트
 * 브레드보드 GND 레일 역할
 */
function GndRail(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'GndRail', config);
}
GndRail.prototype = Object.create(ComponentBase.prototype);
GndRail.prototype.constructor = GndRail;

GndRail.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id: id, 'class': 'component component-gnd-rail' });

  // 검은/파란 GND 레일 선
  g.appendChild(SvgUtil.el('rect', {
    x: 0, y: 8, width: 120, height: 6, rx: 3,
    fill: '#212121', opacity: '0.9'
  }));
  g.appendChild(SvgUtil.el('rect', {
    x: 2, y: 2, width: 30, height: 14, rx: 2,
    fill: '#000'
  }));
  g.appendChild(SvgUtil.text('GND', {
    x: 17, y: 13, 'text-anchor': 'middle',
    'font-size': '8', fill: '#aaa', 'font-family': 'monospace', 'font-weight': 'bold'
  }));

  for (var i = 0; i < 5; i++) {
    var px = 40 + i * 16;
    g.appendChild(SvgUtil.pinDot(px, 11, 'G' + (i + 1), id, 'gnd'));
  }

  this.element = g;
  return g;
};

GndRail.prototype.getConnectionPoints = function() {
  var pts = [];
  for (var i = 0; i < 5; i++) {
    pts.push({ name: 'G' + (i + 1), x: 40 + i * 16, y: 11, type: 'gnd' });
  }
  return pts;
};

GndRail.prototype.getBoundingBox = function() {
  return { x: 0, y: 2, width: 120, height: 16 };
};

ComponentRegistry.register('GndRail', GndRail);
