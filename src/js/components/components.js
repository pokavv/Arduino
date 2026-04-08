/**
 * components.js
 * ESP32-C3 웹 시뮬레이터 - 종합 컴포넌트 라이브러리
 *
 * ComponentBase를 상속받아 48개 컴포넌트를 구현합니다.
 * 각 컴포넌트는 ComponentRegistry에 등록됩니다.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ComponentRegistry - 타입 이름으로 인스턴스 생성
// ─────────────────────────────────────────────────────────────────────────────
var ComponentRegistry = (function() {
  var _map = {};
  return {
    register: function(typeName, ctor) { _map[typeName] = ctor; },
    create: function(typeName, id, config, x, y, connections) {
      var Ctor = _map[typeName];
      if (!Ctor) { console.warn('ComponentRegistry: 알 수 없는 타입 -', typeName); return null; }
      var inst = new Ctor(id, config);
      inst.x = x || 0; inst.y = y || 0;
      inst.connections = connections || {};
      return inst;
    },
    getTypes: function() { return Object.keys(_map); },
    get: function(typeName) { return _map[typeName] || null; }
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// SVG 헬퍼 유틸리티
// ─────────────────────────────────────────────────────────────────────────────
var SvgUtil = {
  NS: 'http://www.w3.org/2000/svg',
  el: function(tag, attrs, children) {
    var e = document.createElementNS(this.NS, tag);
    if (attrs) Object.keys(attrs).forEach(function(k) { e.setAttribute(k, attrs[k]); });
    if (children) children.forEach(function(c) { if (c) e.appendChild(c); });
    return e;
  },
  text: function(str, attrs) {
    var e = this.el('text', attrs);
    e.textContent = str;
    return e;
  },
  g: function(attrs, children) { return this.el('g', attrs, children); },
  pinDot: function(cx, cy, pinName, compId, pinType) {
    var colors = { digital:'#4CAF50', analog:'#FF9800', power:'#F44336', gnd:'#212121', signal:'#2196F3', i2c:'#9C27B0', spi:'#FF5722', pwm:'#00BCD4' };
    var c = colors[pinType] || '#9E9E9E';
    var g = this.el('g', { 'class':'pin-point', 'data-pin':pinName, 'data-comp':compId, style:'cursor:crosshair' });
    var circle = this.el('circle', { cx:cx, cy:cy, r:5, fill:c, stroke:'#fff', 'stroke-width':'1.5' });
    var t = document.createElementNS(this.NS, 'title');
    t.textContent = compId + ':' + pinName;
    circle.appendChild(t);
    g.appendChild(circle);
    return g;
  },
  glow: function(id, color, blur) {
    blur = blur || 3;
    var defs = this.el('defs');
    var filter = this.el('filter', { id: id, x:'-50%', y:'-50%', width:'200%', height:'200%' });
    var blur_el = this.el('feGaussianBlur', { stdDeviation: blur, result:'coloredBlur' });
    var merge = this.el('feMerge');
    merge.appendChild(this.el('feMergeNode', { in:'coloredBlur' }));
    merge.appendChild(this.el('feMergeNode', { in:'SourceGraphic' }));
    filter.appendChild(blur_el);
    filter.appendChild(merge);
    defs.appendChild(filter);
    return defs;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 공통 핀 레이블 유틸
// ─────────────────────────────────────────────────────────────────────────────
function _pinLabel(x, y, label) {
  return SvgUtil.text(label, { x:x, y:y, 'font-size':'7', fill:'#aaa', 'font-family':'monospace' });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LED
// ─────────────────────────────────────────────────────────────────────────────
function LED(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'LED', config);
  this.color = config.color || 'red';
  this._opacity = 0.2;
  this._ledBody = null;
}
LED.prototype = Object.create(ComponentBase.prototype);
LED.prototype.constructor = LED;

LED.COLOR_MAP = {
  red:    { fill:'#F44336', glow:'#FF8A80', dark:'#7f0000' },
  green:  { fill:'#4CAF50', glow:'#B9F6CA', dark:'#1b5e20' },
  blue:   { fill:'#2196F3', glow:'#82B1FF', dark:'#0d47a1' },
  yellow: { fill:'#FFEB3B', glow:'#FFFF8D', dark:'#f57f17' },
  white:  { fill:'#ECEFF1', glow:'#FFFFFF', dark:'#90A4AE' },
  orange: { fill:'#FF9800', glow:'#FFD180', dark:'#e65100' }
};

LED.prototype.createSvg = function() {
  var self = this;
  var colors = LED.COLOR_MAP[this.color] || LED.COLOR_MAP.red;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-led' });
  g.appendChild(SvgUtil.glow(id + '_glow', colors.fill, 4));
  g.appendChild(SvgUtil.el('circle', { cx:20, cy:20, r:14, fill:colors.dark, stroke:'#555', 'stroke-width':'1' }));
  var ledBody = SvgUtil.el('circle', { cx:20, cy:20, r:14, fill:colors.fill, opacity:0.2, filter:'url(#'+id+'_glow)', 'class':'led-body' });
  g.appendChild(ledBody);
  var sym = SvgUtil.el('g', { opacity:'0.7' });
  sym.appendChild(SvgUtil.el('polygon', { points:'12,14 12,26 22,20', fill:'#fff', opacity:'0.5' }));
  sym.appendChild(SvgUtil.el('line', { x1:22, y1:14, x2:22, y2:26, stroke:'#fff', 'stroke-width':'2' }));
  g.appendChild(sym);
  g.appendChild(SvgUtil.el('circle', { cx:15, cy:15, r:4, fill:'rgba(255,255,255,0.25)' }));
  g.appendChild(SvgUtil.text(this.color[0].toUpperCase()+'LED', { x:20, y:44, 'text-anchor':'middle', 'font-size':'8', fill:'#ccc', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(20, 4, 'A', id, 'digital'));
  g.appendChild(_pinLabel(26, 7, 'A'));
  g.appendChild(SvgUtil.pinDot(20, 36, 'K', id, 'gnd'));
  g.appendChild(_pinLabel(26, 39, 'K'));
  this.element = g;
  this._ledBody = ledBody;
  return g;
};
LED.prototype.getConnectionPoints = function() {
  return [{ name:'A', x:20, y:4, type:'digital' }, { name:'K', x:20, y:36, type:'gnd' }];
};
LED.prototype.getBoundingBox = function() { return { x:4, y:4, width:32, height:40 }; };
LED.prototype.onGpioChange = function(pin, value) { this._setOpacity(value === 1 ? 1.0 : 0.2); };
LED.prototype.onPwmChange = function(pin, duty, freq) { this._setOpacity(0.1 + (duty/255)*0.9); };
LED.prototype._setOpacity = function(v) {
  this._opacity = v;
  if (this._ledBody) this._ledBody.setAttribute('opacity', v);
};
ComponentRegistry.register('LED', LED);


// ─────────────────────────────────────────────────────────────────────────────
// 2. LED_RGB (공통 캐소드 RGB LED)
// ─────────────────────────────────────────────────────────────────────────────
function LED_RGB(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'LED_RGB', config);
  this._r = 0; this._g = 0; this._b = 0;
  this._circle = null;
}
LED_RGB.prototype = Object.create(ComponentBase.prototype);
LED_RGB.prototype.constructor = LED_RGB;

LED_RGB.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-led-rgb' });
  g.appendChild(SvgUtil.glow(id+'_glow', '#fff', 5));
  g.appendChild(SvgUtil.el('circle', { cx:22, cy:22, r:16, fill:'#111', stroke:'#555', 'stroke-width':'1.5' }));
  var circle = SvgUtil.el('circle', { cx:22, cy:22, r:14, fill:'#111', filter:'url(#'+id+'_glow)' });
  g.appendChild(circle);
  g.appendChild(SvgUtil.el('circle', { cx:17, cy:17, r:4, fill:'rgba(255,255,255,0.2)' }));
  g.appendChild(SvgUtil.text('RGB', { x:22, y:50, 'text-anchor':'middle', 'font-size':'8', fill:'#ccc', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(4,  8,  'R',   id, 'digital')); g.appendChild(_pinLabel(10, 7, 'R'));
  g.appendChild(SvgUtil.pinDot(4,  22, 'G',   id, 'digital')); g.appendChild(_pinLabel(10, 21, 'G'));
  g.appendChild(SvgUtil.pinDot(4,  36, 'B',   id, 'digital')); g.appendChild(_pinLabel(10, 35, 'B'));
  g.appendChild(SvgUtil.pinDot(40, 22, 'GND', id, 'gnd'));     g.appendChild(_pinLabel(32, 35, 'GND'));
  this.element = g;
  this._circle = circle;
  return g;
};
LED_RGB.prototype.getConnectionPoints = function() {
  return [
    { name:'R',   x:4,  y:8,  type:'digital' },
    { name:'G',   x:4,  y:22, type:'digital' },
    { name:'B',   x:4,  y:36, type:'digital' },
    { name:'GND', x:40, y:22, type:'gnd' }
  ];
};
LED_RGB.prototype.getBoundingBox = function() { return { x:4, y:4, width:40, height:48 }; };
LED_RGB.prototype._updateColor = function() {
  var r = Math.round(this._r), g = Math.round(this._g), b = Math.round(this._b);
  var hex = '#' + ('0'+r.toString(16)).slice(-2) + ('0'+g.toString(16)).slice(-2) + ('0'+b.toString(16)).slice(-2);
  if (this._circle) this._circle.setAttribute('fill', hex);
};
LED_RGB.prototype.onGpioChange = function(pin, value) {
  var bpMap = this.connections;
  for (var pname in bpMap) {
    if (bpMap[pname] === pin) {
      if (pname === 'R') this._r = value * 255;
      else if (pname === 'G') this._g = value * 255;
      else if (pname === 'B') this._b = value * 255;
    }
  }
  this._updateColor();
};
LED_RGB.prototype.onPwmChange = function(pin, duty, freq) {
  var bpMap = this.connections;
  for (var pname in bpMap) {
    if (bpMap[pname] === pin) {
      if (pname === 'R') this._r = duty;
      else if (pname === 'G') this._g = duty;
      else if (pname === 'B') this._b = duty;
    }
  }
  this._updateColor();
};
ComponentRegistry.register('LED_RGB', LED_RGB);


// ─────────────────────────────────────────────────────────────────────────────
// 3. Resistor (IEC 유럽식)
// ─────────────────────────────────────────────────────────────────────────────
function Resistor(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Resistor', config);
  this.value = config.value || 220;
  this.unit = config.unit || 'Ω';
}
Resistor.prototype = Object.create(ComponentBase.prototype);
Resistor.prototype.constructor = Resistor;

Resistor.prototype.createSvg = function() {
  var id = this.id;
  var label = this.value + this.unit;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-resistor' });
  g.appendChild(SvgUtil.el('line', { x1:4, y1:15, x2:18, y2:15, stroke:'#aaa', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('rect', { x:18, y:8, width:34, height:14, rx:2, fill:'#D4A017', stroke:'#8B6914', 'stroke-width':'1.5' }));
  // 색띠 (저항 값 표시용 장식)
  g.appendChild(SvgUtil.el('rect', { x:23, y:8, width:3, height:14, fill:'#8B0000', opacity:'0.7' }));
  g.appendChild(SvgUtil.el('rect', { x:29, y:8, width:3, height:14, fill:'#FF0000', opacity:'0.7' }));
  g.appendChild(SvgUtil.el('rect', { x:35, y:8, width:3, height:14, fill:'#8B4513', opacity:'0.7' }));
  g.appendChild(SvgUtil.el('rect', { x:43, y:8, width:3, height:14, fill:'#FFD700', opacity:'0.7' }));
  g.appendChild(SvgUtil.el('line', { x1:52, y1:15, x2:66, y2:15, stroke:'#aaa', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.text(label, { x:35, y:32, 'text-anchor':'middle', 'font-size':'8', fill:'#ccc', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(4,  15, 'A', id, 'signal'));
  g.appendChild(SvgUtil.pinDot(66, 15, 'B', id, 'signal'));
  this.element = g;
  return g;
};
Resistor.prototype.getConnectionPoints = function() {
  return [{ name:'A', x:4, y:15, type:'signal' }, { name:'B', x:66, y:15, type:'signal' }];
};
Resistor.prototype.getBoundingBox = function() { return { x:4, y:8, width:62, height:24 }; };
ComponentRegistry.register('Resistor', Resistor);


// ─────────────────────────────────────────────────────────────────────────────
// 4. Capacitor
// ─────────────────────────────────────────────────────────────────────────────
function Capacitor(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Capacitor', config);
  this.value = config.value || 100;
  this.unit = config.unit || 'µF';
}
Capacitor.prototype = Object.create(ComponentBase.prototype);
Capacitor.prototype.constructor = Capacitor;

Capacitor.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-capacitor' });
  // 원통형 몸체
  g.appendChild(SvgUtil.el('rect', { x:12, y:6, width:20, height:30, rx:3, fill:'#37474F', stroke:'#546E7A', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('rect', { x:12, y:6, width:20, height:8, rx:3, fill:'#455A64' }));
  // + 표시
  g.appendChild(SvgUtil.text('+', { x:22, y:16, 'text-anchor':'middle', 'font-size':'10', fill:'#fff' }));
  g.appendChild(SvgUtil.text(this.value + this.unit, { x:22, y:46, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(22, 4,  '+', id, 'power'));
  g.appendChild(SvgUtil.pinDot(22, 38, '-', id, 'gnd'));
  _pinLabel(28, 7, '+');
  this.element = g;
  return g;
};
Capacitor.prototype.getConnectionPoints = function() {
  return [{ name:'+', x:22, y:4, type:'power' }, { name:'-', x:22, y:38, type:'gnd' }];
};
Capacitor.prototype.getBoundingBox = function() { return { x:12, y:4, width:20, height:42 }; };
ComponentRegistry.register('Capacitor', Capacitor);


// ─────────────────────────────────────────────────────────────────────────────
// 5. Buzzer (Web Audio API)
// ─────────────────────────────────────────────────────────────────────────────
function Buzzer(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Buzzer', config);
  this._audioCtx = null;
  this._oscillator = null;
  this._gainNode = null;
  this._playing = false;
  this._freq = 1000;
  this._body = null;
}
Buzzer.prototype = Object.create(ComponentBase.prototype);
Buzzer.prototype.constructor = Buzzer;

Buzzer.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-buzzer' });
  g.appendChild(SvgUtil.el('ellipse', { cx:22, cy:20, rx:18, ry:18, fill:'#1A237E', stroke:'#3949AB', 'stroke-width':'2' }));
  // 음파 표시
  for (var i = 0; i < 3; i++) {
    g.appendChild(SvgUtil.el('circle', { cx:22, cy:20, r:6+(i*4), fill:'none', stroke:'rgba(100,181,246,0.4)', 'stroke-width':'1.5' }));
  }
  g.appendChild(SvgUtil.el('circle', { cx:22, cy:20, r:5, fill:'#5C6BC0' }));
  g.appendChild(SvgUtil.text('BZZ', { x:22, y:48, 'text-anchor':'middle', 'font-size':'8', fill:'#aaa', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(22, 4,  'VCC', id, 'power')); g.appendChild(_pinLabel(28, 7, 'VCC'));
  g.appendChild(SvgUtil.pinDot(22, 38, 'GND', id, 'gnd'));  g.appendChild(_pinLabel(28, 41, 'GND'));
  g.appendChild(SvgUtil.pinDot(4,  20, 'IN',  id, 'digital')); g.appendChild(_pinLabel(10, 19, 'IN'));
  this.element = g;
  this._body = g.querySelector('ellipse');
  return g;
};
Buzzer.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC', x:22, y:4,  type:'power' },
    { name:'GND', x:22, y:38, type:'gnd' },
    { name:'IN',  x:4,  y:20, type:'digital' }
  ];
};
Buzzer.prototype.getBoundingBox = function() { return { x:4, y:4, width:40, height:44 }; };
Buzzer.prototype._initAudio = function() {
  if (!this._audioCtx) {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    this._audioCtx = new Ctx();
    this._gainNode = this._audioCtx.createGain();
    this._gainNode.connect(this._audioCtx.destination);
    this._gainNode.gain.value = 0;
  }
  return true;
};
Buzzer.prototype._startTone = function(freq) {
  if (!this._initAudio()) return;
  if (!this._oscillator) {
    this._oscillator = this._audioCtx.createOscillator();
    this._oscillator.connect(this._gainNode);
    this._oscillator.start();
  }
  this._oscillator.frequency.value = freq || this._freq;
  this._gainNode.gain.linearRampToValueAtTime(0.3, this._audioCtx.currentTime + 0.01);
  this._playing = true;
  if (this.element) this.element.style.filter = 'brightness(1.5)';
};
Buzzer.prototype._stopTone = function() {
  if (this._gainNode) this._gainNode.gain.linearRampToValueAtTime(0, this._audioCtx.currentTime + 0.05);
  this._playing = false;
  if (this.element) this.element.style.filter = '';
};
Buzzer.prototype.onGpioChange = function(pin, value) {
  if (value === 1) this._startTone(this._freq);
  else this._stopTone();
};
Buzzer.prototype.onPwmChange = function(pin, duty, freq) {
  this._freq = freq || 1000;
  if (duty > 0) this._startTone(this._freq);
  else this._stopTone();
};
ComponentRegistry.register('Buzzer', Buzzer);


// ─────────────────────────────────────────────────────────────────────────────
// 6. Speaker (복잡한 파형 지원)
// ─────────────────────────────────────────────────────────────────────────────
function Speaker(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Speaker', config);
  this._audioCtx = null;
  this._oscillator = null;
  this._gainNode = null;
  this._waveType = config.waveType || 'sine';
  this._freq = 440;
}
Speaker.prototype = Object.create(ComponentBase.prototype);
Speaker.prototype.constructor = Speaker;

Speaker.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-speaker' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:50, height:44, rx:4, fill:'#263238', stroke:'#546E7A', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:29, cy:26, rx:17, ry:17, fill:'#37474F', stroke:'#607D8B', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:29, cy:26, rx:11, ry:11, fill:'#455A64' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:29, cy:26, rx:5,  ry:5,  fill:'#546E7A' }));
  g.appendChild(SvgUtil.text('SPK', { x:29, y:57, 'text-anchor':'middle', 'font-size':'8', fill:'#aaa', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(4,  15, '+', id, 'signal')); g.appendChild(_pinLabel(10, 14, '+'));
  g.appendChild(SvgUtil.pinDot(4,  37, '-', id, 'gnd'));   g.appendChild(_pinLabel(10, 36, '-'));
  this.element = g;
  return g;
};
Speaker.prototype.getConnectionPoints = function() {
  return [{ name:'+', x:4, y:15, type:'signal' }, { name:'-', x:4, y:37, type:'gnd' }];
};
Speaker.prototype.getBoundingBox = function() { return { x:4, y:4, width:54, height:54 }; };
Speaker.prototype._initAudio = function() {
  if (!this._audioCtx) {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    this._audioCtx = new Ctx();
    this._gainNode = this._audioCtx.createGain();
    this._gainNode.gain.value = 0;
    this._gainNode.connect(this._audioCtx.destination);
  }
  return true;
};
Speaker.prototype.onGpioChange = function(pin, value) {
  if (!this._initAudio()) return;
  if (value === 1) {
    if (!this._oscillator) {
      this._oscillator = this._audioCtx.createOscillator();
      this._oscillator.type = this._waveType;
      this._oscillator.connect(this._gainNode);
      this._oscillator.frequency.value = this._freq;
      this._oscillator.start();
    }
    this._gainNode.gain.linearRampToValueAtTime(0.4, this._audioCtx.currentTime + 0.01);
  } else {
    if (this._gainNode) this._gainNode.gain.linearRampToValueAtTime(0, this._audioCtx.currentTime + 0.05);
  }
};
Speaker.prototype.onPwmChange = function(pin, duty, freq) {
  this._freq = freq || 440;
  if (!this._initAudio()) return;
  if (duty > 0) {
    if (!this._oscillator) {
      this._oscillator = this._audioCtx.createOscillator();
      this._oscillator.connect(this._gainNode);
      this._oscillator.start();
    }
    this._oscillator.type = this._waveType;
    this._oscillator.frequency.value = this._freq;
    this._gainNode.gain.linearRampToValueAtTime(0.4 * (duty/255), this._audioCtx.currentTime + 0.01);
  } else {
    if (this._gainNode) this._gainNode.gain.linearRampToValueAtTime(0, this._audioCtx.currentTime + 0.05);
  }
};
ComponentRegistry.register('Speaker', Speaker);


// ─────────────────────────────────────────────────────────────────────────────
// 7. Button (누름 버튼)
// ─────────────────────────────────────────────────────────────────────────────
function Button(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Button', config);
  this.label = config.label || 'BTN';
  this._pressed = false;
}
Button.prototype = Object.create(ComponentBase.prototype);
Button.prototype.constructor = Button;

Button.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-button' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:10, width:46, height:30, rx:3, fill:'#455A64', stroke:'#78909C', 'stroke-width':'1' }));
  var btnBody = SvgUtil.el('rect', { x:10, y:14, width:30, height:22, rx:4, fill:'#607D8B', stroke:'#90A4AE', 'stroke-width':'1.5', style:'cursor:pointer;' });
  var btnDot  = SvgUtil.el('circle', { cx:25, cy:25, r:7, fill:'#B0BEC5', stroke:'#90A4AE', 'stroke-width':'1', style:'cursor:pointer;' });
  g.appendChild(btnBody);
  g.appendChild(btnDot);
  g.appendChild(SvgUtil.text(this.label, { x:25, y:52, 'text-anchor':'middle', 'font-size':'8', fill:'#ccc', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(4,  25, 'PIN1', id, 'digital'));
  g.appendChild(SvgUtil.pinDot(46, 25, 'PIN2', id, 'digital'));

  function setPressed(p) {
    self._pressed = p;
    btnBody.setAttribute('fill', p ? '#B0BEC5' : '#607D8B');
    btnDot.setAttribute('fill',  p ? '#90A4AE' : '#B0BEC5');
    self._firePressCallback('PIN1', p ? 0 : 1);
    self._firePressCallback('PIN2', p ? 0 : 1);
  }
  g.addEventListener('mousedown', function(e) { e.preventDefault(); setPressed(true); });
  g.addEventListener('mouseup',   function() { setPressed(false); });
  g.addEventListener('mouseleave',function() { if (self._pressed) setPressed(false); });
  g.addEventListener('touchstart',function(e) { e.preventDefault(); setPressed(true); }, { passive:false });
  g.addEventListener('touchend',  function() { setPressed(false); });

  this.element = g;
  this._btnBody = btnBody;
  this._btnDot = btnDot;
  return g;
};
Button.prototype.getConnectionPoints = function() {
  return [{ name:'PIN1', x:4, y:25, type:'digital' }, { name:'PIN2', x:46, y:25, type:'digital' }];
};
Button.prototype.getBoundingBox = function() { return { x:2, y:10, width:46, height:30 }; };
Button.prototype.getDigitalValue = function(pin) { return this._pressed ? 0 : 1; };
ComponentRegistry.register('Button', Button);


// ─────────────────────────────────────────────────────────────────────────────
// 8. Switch (슬라이드 스위치)
// ─────────────────────────────────────────────────────────────────────────────
function Switch(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Switch', config);
  this._on = config.defaultOn || false;
  this._knob = null;
}
Switch.prototype = Object.create(ComponentBase.prototype);
Switch.prototype.constructor = Switch;

Switch.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-switch', style:'cursor:pointer' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:12, width:46, height:22, rx:11, fill:'#37474F', stroke:'#607D8B', 'stroke-width':'1.5' }));
  var track = SvgUtil.el('rect', { x:6, y:14, width:42, height:18, rx:9, fill:'#263238' });
  g.appendChild(track);
  var knob = SvgUtil.el('circle', { cx: self._on ? 37 : 17, cy:23, r:8, fill: self._on ? '#4CAF50' : '#78909C', stroke:'#fff', 'stroke-width':'1.5' });
  g.appendChild(knob);
  g.appendChild(SvgUtil.text(self._on ? 'ON' : 'OFF', { x:27, y:46, 'text-anchor':'middle', 'font-size':'8', fill:'#ccc', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(4,  23, 'COM', id, 'signal'));
  g.appendChild(SvgUtil.pinDot(50, 23, 'NO',  id, 'digital'));
  g.addEventListener('click', function() {
    self._on = !self._on;
    knob.setAttribute('cx', self._on ? 37 : 17);
    knob.setAttribute('fill', self._on ? '#4CAF50' : '#78909C');
    var lbl = g.querySelector('text:last-of-type');
    if (lbl) lbl.textContent = self._on ? 'ON' : 'OFF';
    self._firePressCallback('NO', self._on ? 1 : 0);
  });
  this.element = g;
  this._knob = knob;
  return g;
};
Switch.prototype.getConnectionPoints = function() {
  return [{ name:'COM', x:4, y:23, type:'signal' }, { name:'NO', x:50, y:23, type:'digital' }];
};
Switch.prototype.getBoundingBox = function() { return { x:4, y:12, width:46, height:22 }; };
Switch.prototype.getDigitalValue = function(pin) { return this._on ? 1 : 0; };
ComponentRegistry.register('Switch', Switch);


// ─────────────────────────────────────────────────────────────────────────────
// 9. Potentiometer (가변저항)
// ─────────────────────────────────────────────────────────────────────────────
function Potentiometer(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Potentiometer', config);
  this._value = config.defaultValue || 512;
  this._slider = null;
  this._label = null;
}
Potentiometer.prototype = Object.create(ComponentBase.prototype);
Potentiometer.prototype.constructor = Potentiometer;

Potentiometer.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-potentiometer' });
  g.appendChild(SvgUtil.el('circle', { cx:30, cy:24, r:20, fill:'#2C3E50', stroke:'#546E7A', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('circle', { cx:30, cy:24, r:12, fill:'#37474F', stroke:'#607D8B', 'stroke-width':'1' }));
  // 화살표 (회전 손잡이)
  var needle = SvgUtil.el('line', { x1:30, y1:24, x2:30, y2:14, stroke:'#90A4AE', 'stroke-width':'2.5', 'stroke-linecap':'round' });
  g.appendChild(needle);
  g.appendChild(SvgUtil.el('circle', { cx:30, cy:24, r:4, fill:'#546E7A' }));
  var valLabel = SvgUtil.text('512', { x:30, y:54, 'text-anchor':'middle', 'font-size':'8', fill:'#4FC3F7', 'font-family':'monospace' });
  g.appendChild(valLabel);
  g.appendChild(SvgUtil.text('POT', { x:30, y:63, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(4,  24, 'VCC', id, 'power')); g.appendChild(_pinLabel(10, 23, 'VCC'));
  g.appendChild(SvgUtil.pinDot(56, 24, 'GND', id, 'gnd'));   g.appendChild(_pinLabel(48, 37, 'GND'));
  g.appendChild(SvgUtil.pinDot(30, 4,  'SIG', id, 'analog')); g.appendChild(_pinLabel(36, 7, 'SIG'));

  // HTML input range 오버레이 (SVG foreignObject)
  var fo = SvgUtil.el('foreignObject', { x:2, y:44, width:56, height:18 });
  var input = document.createElement('input');
  input.type = 'range'; input.min = 0; input.max = 4095; input.value = self._value;
  input.style.cssText = 'width:56px;height:12px;cursor:pointer;accent-color:#4FC3F7;';
  input.addEventListener('input', function() {
    self._value = parseInt(this.value);
    valLabel.textContent = self._value;
    var angle = (self._value / 4095) * 270 - 135;
    var rad = angle * Math.PI / 180;
    var nx = 30 + 10 * Math.sin(rad);
    var ny = 24 - 10 * Math.cos(rad);
    needle.setAttribute('x2', nx.toFixed(1));
    needle.setAttribute('y2', ny.toFixed(1));
  });
  fo.appendChild(input);
  g.appendChild(fo);

  this.element = g;
  this._slider = input;
  this._valLabel = valLabel;
  return g;
};
Potentiometer.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC', x:4,  y:24, type:'power' },
    { name:'GND', x:56, y:24, type:'gnd' },
    { name:'SIG', x:30, y:4,  type:'analog' }
  ];
};
Potentiometer.prototype.getBoundingBox = function() { return { x:4, y:4, width:56, height:62 }; };
Potentiometer.prototype.getAdcValue = function(pin) { return this._value; };
ComponentRegistry.register('Potentiometer', Potentiometer);


// ─────────────────────────────────────────────────────────────────────────────
// 10. PhotoResistor_CDS (CDS 조도 센서)
// ─────────────────────────────────────────────────────────────────────────────
function PhotoResistor_CDS(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'PhotoResistor_CDS', config);
  this._value = config.defaultValue || 2000; // 어두울수록 높음
}
PhotoResistor_CDS.prototype = Object.create(ComponentBase.prototype);
PhotoResistor_CDS.prototype.constructor = PhotoResistor_CDS;

PhotoResistor_CDS.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-cds' });
  g.appendChild(SvgUtil.el('circle', { cx:22, cy:22, r:18, fill:'#FFF9C4', stroke:'#F9A825', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('path', { d:'M15,14 Q22,8 29,14 Q36,20 22,22 Q8,24 15,30 Q22,36 29,30', fill:'none', stroke:'#F57F17', 'stroke-width':'2' }));
  // 화살표 (빛 입사)
  g.appendChild(SvgUtil.el('line', { x1:34, y1:8,  x2:28, y2:14, stroke:'#FFD600', 'stroke-width':'1.5', 'marker-end':'url(#arrow)' }));
  g.appendChild(SvgUtil.el('line', { x1:38, y1:12, x2:32, y2:18, stroke:'#FFD600', 'stroke-width':'1.5' }));
  var valLabel = SvgUtil.text(self._value, { x:22, y:50, 'text-anchor':'middle', 'font-size':'8', fill:'#F9A825', 'font-family':'monospace' });
  g.appendChild(valLabel);
  g.appendChild(SvgUtil.text('CDS', { x:22, y:60, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(22, 4,  'VCC', id, 'power'));
  g.appendChild(SvgUtil.pinDot(22, 40, 'SIG', id, 'analog'));
  var fo = SvgUtil.el('foreignObject', { x:2, y:50, width:42, height:16 });
  var input = document.createElement('input');
  input.type='range'; input.min=0; input.max=4095; input.value=self._value;
  input.title='밝기 (낮을수록 밝음)';
  input.style.cssText='width:42px;height:12px;cursor:pointer;accent-color:#F9A825;';
  input.addEventListener('input', function() { self._value = parseInt(this.value); valLabel.textContent = self._value; });
  fo.appendChild(input);
  g.appendChild(fo);
  this.element = g;
  return g;
};
PhotoResistor_CDS.prototype.getConnectionPoints = function() {
  return [{ name:'VCC', x:22, y:4, type:'power' }, { name:'SIG', x:22, y:40, type:'analog' }];
};
PhotoResistor_CDS.prototype.getBoundingBox = function() { return { x:4, y:4, width:40, height:64 }; };
PhotoResistor_CDS.prototype.getAdcValue = function(pin) { return this._value; };
ComponentRegistry.register('PhotoResistor_CDS', PhotoResistor_CDS);


// ─────────────────────────────────────────────────────────────────────────────
// 11. Thermistor_NTC (서미스터)
// ─────────────────────────────────────────────────────────────────────────────
function Thermistor_NTC(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Thermistor_NTC', config);
  this._tempC = config.defaultTemp || 25;
}
Thermistor_NTC.prototype = Object.create(ComponentBase.prototype);
Thermistor_NTC.prototype.constructor = Thermistor_NTC;

Thermistor_NTC.prototype._tempToAdc = function(t) {
  // NTC: 25°C = ~2048, 0°C = ~3000, 100°C = ~500
  var R25 = 10000, B = 3950, T25 = 298.15;
  var R = R25 * Math.exp(B * (1/(t+273.15) - 1/T25));
  var Vout = 3.3 * R / (10000 + R);
  return Math.round((Vout / 3.3) * 4095);
};
Thermistor_NTC.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-thermistor' });
  g.appendChild(SvgUtil.el('rect', { x:10, y:8, width:26, height:30, rx:13, fill:'#E53935', stroke:'#B71C1C', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('rect', { x:16, y:8, width:14, height:18, rx:2, fill:'rgba(255,255,255,0.15)' }));
  g.appendChild(SvgUtil.el('rect', { x:20, y:38, width:6, height:10, rx:1, fill:'#aaa' }));
  var tempLabel = SvgUtil.text(self._tempC+'°C', { x:23, y:58, 'text-anchor':'middle', 'font-size':'8', fill:'#EF9A9A', 'font-family':'monospace' });
  g.appendChild(tempLabel);
  g.appendChild(SvgUtil.text('NTC', { x:23, y:68, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(23, 4,  'VCC', id, 'power'));
  g.appendChild(SvgUtil.pinDot(23, 50, 'SIG', id, 'analog'));
  var fo = SvgUtil.el('foreignObject', { x:2, y:58, width:46, height:16 });
  var input = document.createElement('input');
  input.type='range'; input.min=-20; input.max=120; input.value=self._tempC;
  input.style.cssText='width:46px;height:12px;cursor:pointer;accent-color:#E53935;';
  input.addEventListener('input', function() { self._tempC = parseInt(this.value); tempLabel.textContent = self._tempC+'°C'; });
  fo.appendChild(input);
  g.appendChild(fo);
  this.element = g;
  return g;
};
Thermistor_NTC.prototype.getConnectionPoints = function() {
  return [{ name:'VCC', x:23, y:4, type:'power' }, { name:'SIG', x:23, y:50, type:'analog' }];
};
Thermistor_NTC.prototype.getBoundingBox = function() { return { x:10, y:4, width:26, height:72 }; };
Thermistor_NTC.prototype.getAdcValue = function(pin) { return this._tempToAdc(this._tempC); };
ComponentRegistry.register('Thermistor_NTC', Thermistor_NTC);


// ─────────────────────────────────────────────────────────────────────────────
// 12. Joystick
// ─────────────────────────────────────────────────────────────────────────────
function Joystick(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Joystick', config);
  this._x = 2048; this._y = 2048; this._sw = false;
}
Joystick.prototype = Object.create(ComponentBase.prototype);
Joystick.prototype.constructor = Joystick;

Joystick.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-joystick' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:2, width:72, height:76, rx:6, fill:'#263238', stroke:'#546E7A', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('circle', { cx:38, cy:32, r:22, fill:'#37474F', stroke:'#607D8B', 'stroke-width':'1.5' }));
  var stick = SvgUtil.el('circle', { cx:38, cy:32, r:12, fill:'#607D8B', stroke:'#90A4AE', 'stroke-width':'2', style:'cursor:pointer' });
  g.appendChild(stick);
  g.appendChild(SvgUtil.el('circle', { cx:38, cy:32, r:5, fill:'#90A4AE' }));

  var xLabel = SvgUtil.text('X:2048', { x:38, y:62, 'text-anchor':'middle', 'font-size':'8', fill:'#4FC3F7', 'font-family':'monospace' });
  var yLabel = SvgUtil.text('Y:2048', { x:38, y:72, 'text-anchor':'middle', 'font-size':'8', fill:'#AED581', 'font-family':'monospace' });
  g.appendChild(xLabel);
  g.appendChild(yLabel);
  g.appendChild(SvgUtil.text('JOY', { x:38, y:84, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));

  // X, Y 슬라이더
  var foX = SvgUtil.el('foreignObject', { x:4, y:55, width:70, height:12 });
  var inputX = document.createElement('input');
  inputX.type='range'; inputX.min=0; inputX.max=4095; inputX.value=2048;
  inputX.style.cssText='width:70px;height:10px;cursor:pointer;accent-color:#4FC3F7;';
  inputX.addEventListener('input', function() {
    self._x = parseInt(this.value);
    xLabel.textContent = 'X:'+self._x;
    var dx = ((self._x-2048)/2048)*10;
    stick.setAttribute('cx', 38 + dx);
  });
  foX.appendChild(inputX);

  var foY = SvgUtil.el('foreignObject', { x:4, y:67, width:70, height:12 });
  var inputY = document.createElement('input');
  inputY.type='range'; inputY.min=0; inputY.max=4095; inputY.value=2048;
  inputY.style.cssText='width:70px;height:10px;cursor:pointer;accent-color:#AED581;';
  inputY.addEventListener('input', function() {
    self._y = parseInt(this.value);
    yLabel.textContent = 'Y:'+self._y;
    var dy = ((self._y-2048)/2048)*10;
    stick.setAttribute('cy', 32 + dy);
  });
  foY.appendChild(inputY);

  g.appendChild(foX);
  g.appendChild(foY);

  // SW 버튼 (스틱 클릭)
  stick.addEventListener('mousedown', function(e) { e.preventDefault(); self._sw = true; stick.setAttribute('fill','#B0BEC5'); self._firePressCallback('SW',0); });
  stick.addEventListener('mouseup',   function() { self._sw = false; stick.setAttribute('fill','#607D8B'); self._firePressCallback('SW',1); });

  g.appendChild(SvgUtil.pinDot(2,  10, 'VCC', id, 'power'));
  g.appendChild(SvgUtil.pinDot(2,  22, 'GND', id, 'gnd'));
  g.appendChild(SvgUtil.pinDot(2,  34, 'SW',  id, 'digital'));
  g.appendChild(SvgUtil.pinDot(2,  46, 'VRX', id, 'analog'));
  g.appendChild(SvgUtil.pinDot(2,  58, 'VRY', id, 'analog'));
  _pinLabel(8, 9, 'VCC'); _pinLabel(8, 21, 'GND');
  _pinLabel(8, 33, 'SW');  _pinLabel(8, 45, 'VRX'); _pinLabel(8, 57, 'VRY');

  this.element = g;
  return g;
};
Joystick.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC', x:2, y:10, type:'power' },
    { name:'GND', x:2, y:22, type:'gnd' },
    { name:'SW',  x:2, y:34, type:'digital' },
    { name:'VRX', x:2, y:46, type:'analog' },
    { name:'VRY', x:2, y:58, type:'analog' }
  ];
};
Joystick.prototype.getBoundingBox = function() { return { x:2, y:2, width:72, height:84 }; };
Joystick.prototype.getAdcValue = function(pin) {
  var bpMap = this.connections;
  for (var p in bpMap) {
    if (bpMap[p] === pin) {
      if (p === 'VRX') return this._x;
      if (p === 'VRY') return this._y;
    }
  }
  return 2048;
};
Joystick.prototype.getDigitalValue = function(pin) { return this._sw ? 0 : 1; };
ComponentRegistry.register('Joystick', Joystick);


// ─────────────────────────────────────────────────────────────────────────────
// 13. Keypad_4x4
// ─────────────────────────────────────────────────────────────────────────────
function Keypad_4x4(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Keypad_4x4', config);
  this._keys = [['1','2','3','A'],['4','5','6','B'],['7','8','9','C'],['*','0','#','D']];
  this._pressedRow = -1;
  this._pressedCol = -1;
}
Keypad_4x4.prototype = Object.create(ComponentBase.prototype);
Keypad_4x4.prototype.constructor = Keypad_4x4;

Keypad_4x4.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-keypad' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:2, width:86, height:100, rx:4, fill:'#1A237E', stroke:'#3949AB', 'stroke-width':'1.5' }));
  for (var r=0; r<4; r++) {
    for (var c=0; c<4; c++) {
      var kx = 8 + c*20, ky = 14 + r*22;
      var key = self._keys[r][c];
      (function(row, col, kkey, bx, by) {
        var btn = SvgUtil.el('rect', { x:bx, y:by, width:16, height:16, rx:2, fill:'#3949AB', stroke:'#5C6BC0', 'stroke-width':'1', style:'cursor:pointer' });
        g.appendChild(btn);
        g.appendChild(SvgUtil.text(kkey, { x:bx+8, y:by+11, 'text-anchor':'middle', 'font-size':'8', fill:'#fff', 'font-family':'monospace', 'pointer-events':'none' }));
        btn.addEventListener('mousedown', function(e) {
          e.preventDefault();
          self._pressedRow = row; self._pressedCol = col;
          btn.setAttribute('fill','#7986CB');
          self._firePressCallback('R'+(row+1), 0);
        });
        btn.addEventListener('mouseup', function() {
          btn.setAttribute('fill','#3949AB');
          self._pressedRow = -1; self._pressedCol = -1;
          self._firePressCallback('R'+(row+1), 1);
        });
        btn.addEventListener('mouseleave', function() {
          if (self._pressedRow === row) {
            btn.setAttribute('fill','#3949AB');
            self._pressedRow = -1; self._pressedCol = -1;
          }
        });
      })(r, c, key, kx, ky);
    }
  }
  g.appendChild(SvgUtil.text('4x4 KEYPAD', { x:45, y:108, 'text-anchor':'middle', 'font-size':'7', fill:'#9FA8DA', 'font-family':'monospace' }));
  // 핀 R1-R4, C1-C4
  for (var ri=0; ri<4; ri++) {
    g.appendChild(SvgUtil.pinDot(88, 18+ri*22, 'R'+(ri+1), id, 'digital'));
    g.appendChild(_pinLabel(78, 17+ri*22, 'R'+(ri+1)));
  }
  for (var ci=0; ci<4; ci++) {
    g.appendChild(SvgUtil.pinDot(8+ci*20, 102, 'C'+(ci+1), id, 'digital'));
    g.appendChild(_pinLabel(5+ci*20, 112, 'C'+(ci+1)));
  }
  this.element = g;
  return g;
};
Keypad_4x4.prototype.getConnectionPoints = function() {
  var pts = [];
  for (var r=1; r<=4; r++) pts.push({ name:'R'+r, x:88, y:18+(r-1)*22, type:'digital' });
  for (var c=1; c<=4; c++) pts.push({ name:'C'+c, x:8+(c-1)*20, y:102, type:'digital' });
  return pts;
};
Keypad_4x4.prototype.getBoundingBox = function() { return { x:2, y:2, width:86, height:108 }; };
Keypad_4x4.prototype.getDigitalValue = function(pin) {
  if (this._pressedRow < 0) return 1;
  var pinRow = 'R' + (this._pressedRow+1);
  var pinCol = 'C' + (this._pressedCol+1);
  if (pin === pinRow || pin === pinCol) return 0;
  return 1;
};
ComponentRegistry.register('Keypad_4x4', Keypad_4x4);


// ─────────────────────────────────────────────────────────────────────────────
// 14. IRReceiver (적외선 수신기)
// ─────────────────────────────────────────────────────────────────────────────
function IRReceiver(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'IRReceiver', config);
  this._lastCode = 0;
  this._triggered = false;
}
IRReceiver.prototype = Object.create(ComponentBase.prototype);
IRReceiver.prototype.constructor = IRReceiver;

IRReceiver.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-ir-receiver' });
  g.appendChild(SvgUtil.el('rect', { x:6, y:4, width:36, height:28, rx:4, fill:'#1A237E', stroke:'#3949AB', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:24, cy:12, rx:10, ry:8, fill:'#0D47A1', stroke:'#42A5F5', 'stroke-width':'1' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:24, cy:12, rx:5,  ry:4,  fill:'#1565C0' }));
  g.appendChild(SvgUtil.text('IR RX', { x:24, y:38, 'text-anchor':'middle', 'font-size':'7', fill:'#90CAF9', 'font-family':'monospace' }));
  // 시뮬 버튼 (IR 코드 전송)
  var codes = [0xFF6897, 0xFF9867, 0xFFB04F, 0xFF30CF];
  var labels = ['CH-','CH','CH+','VOL-'];
  for (var i=0; i<4; i++) {
    (function(code, lbl, ix) {
      var bx = 6 + ix*10, by = 44;
      var btn = SvgUtil.el('rect', { x:bx, y:by, width:9, height:9, rx:1, fill:'#283593', stroke:'#5C6BC0', 'stroke-width':'0.5', style:'cursor:pointer' });
      g.appendChild(btn);
      g.appendChild(SvgUtil.text(lbl.slice(0,2), { x:bx+4.5, y:by+7, 'text-anchor':'middle', 'font-size':'5', fill:'#E8EAF6', 'pointer-events':'none' }));
      btn.addEventListener('click', function() {
        self._lastCode = code;
        self._triggered = true;
        self._firePressCallback('OUT', code);
        btn.setAttribute('fill','#5C6BC0');
        setTimeout(function() { btn.setAttribute('fill','#283593'); self._triggered = false; }, 200);
      });
    })(codes[i], labels[i], i);
  }
  g.appendChild(SvgUtil.pinDot(24, 56, 'OUT', id, 'signal'));
  g.appendChild(SvgUtil.pinDot(10, 56, 'VCC', id, 'power'));
  g.appendChild(SvgUtil.pinDot(38, 56, 'GND', id, 'gnd'));
  g.appendChild(_pinLabel(20, 65, 'OUT')); g.appendChild(_pinLabel(6, 65, 'VCC')); g.appendChild(_pinLabel(34, 65, 'GND'));
  this.element = g;
  return g;
};
IRReceiver.prototype.getConnectionPoints = function() {
  return [
    { name:'OUT', x:24, y:56, type:'signal' },
    { name:'VCC', x:10, y:56, type:'power' },
    { name:'GND', x:38, y:56, type:'gnd' }
  ];
};
IRReceiver.prototype.getBoundingBox = function() { return { x:6, y:4, width:36, height:60 }; };
IRReceiver.prototype.getDigitalValue = function(pin) { return this._triggered ? 0 : 1; };
ComponentRegistry.register('IRReceiver', IRReceiver);


// ─────────────────────────────────────────────────────────────────────────────
// 15. Servo (서보모터)
// ─────────────────────────────────────────────────────────────────────────────
function Servo(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Servo', config);
  this._angleDeg = 90;
  this._arm = null;
}
Servo.prototype = Object.create(ComponentBase.prototype);
Servo.prototype.constructor = Servo;

Servo.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-servo' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:16, width:52, height:36, rx:4, fill:'#1B5E20', stroke:'#388E3C', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('rect', { x:12, y:10, width:18, height:10, rx:2, fill:'#2E7D32', stroke:'#4CAF50', 'stroke-width':'1' }));
  // 기어 박스
  g.appendChild(SvgUtil.el('circle', { cx:60, cy:34, r:14, fill:'#263238', stroke:'#546E7A', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('circle', { cx:60, cy:34, r:6,  fill:'#37474F', stroke:'#607D8B', 'stroke-width':'1' }));
  // 회전 팔
  var arm = SvgUtil.el('line', { x1:60, y1:34, x2:60, y2:20, stroke:'#81C784', 'stroke-width':'4', 'stroke-linecap':'round' });
  g.appendChild(arm);
  g.appendChild(SvgUtil.el('circle', { cx:60, cy:34, r:3, fill:'#A5D6A7' }));
  var degLabel = SvgUtil.text('90°', { x:60, y:58, 'text-anchor':'middle', 'font-size':'8', fill:'#81C784', 'font-family':'monospace' });
  g.appendChild(degLabel);
  g.appendChild(SvgUtil.text('SERVO', { x:30, y:42, 'text-anchor':'middle', 'font-size':'8', fill:'#A5D6A7', 'font-family':'monospace' }));

  g.appendChild(SvgUtil.pinDot(4, 56, 'GND',  id, 'gnd'));
  g.appendChild(SvgUtil.pinDot(4, 64, 'VCC',  id, 'power'));
  g.appendChild(SvgUtil.pinDot(4, 72, 'SIG',  id, 'pwm'));
  g.appendChild(_pinLabel(10, 55, 'GND')); g.appendChild(_pinLabel(10, 63, 'VCC')); g.appendChild(_pinLabel(10, 71, 'SIG'));

  this.element = g;
  this._arm = arm;
  this._degLabel = degLabel;
  return g;
};
Servo.prototype.getConnectionPoints = function() {
  return [
    { name:'GND', x:4, y:56, type:'gnd' },
    { name:'VCC', x:4, y:64, type:'power' },
    { name:'SIG', x:4, y:72, type:'pwm' }
  ];
};
Servo.prototype.getBoundingBox = function() { return { x:4, y:10, width:72, height:64 }; };
Servo.prototype._setAngle = function(deg) {
  this._angleDeg = Math.max(0, Math.min(180, deg));
  if (this._arm) {
    var rad = (this._angleDeg - 90) * Math.PI / 180;
    var x2 = 60 + 14 * Math.sin(rad);
    var y2 = 34 - 14 * Math.cos(rad);
    this._arm.setAttribute('x2', x2.toFixed(1));
    this._arm.setAttribute('y2', y2.toFixed(1));
  }
  if (this._degLabel) this._degLabel.textContent = this._angleDeg + '°';
};
Servo.prototype.onPwmChange = function(pin, duty, freq) {
  // 표준 서보: 1ms(0°) ~ 2ms(180°), 주기 20ms(50Hz)
  // duty 0~255 → 각도 0~180
  var deg = Math.round((duty / 255) * 180);
  this._setAngle(deg);
};
Servo.prototype.onGpioChange = function(pin, value) { this._setAngle(value ? 180 : 0); };
ComponentRegistry.register('Servo', Servo);


// ─────────────────────────────────────────────────────────────────────────────
// 16. DC_Motor
// ─────────────────────────────────────────────────────────────────────────────
function DC_Motor(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'DC_Motor', config);
  this._speed = 0;
  this._dir = 0;
  this._rotAngle = 0;
  this._animFrame = null;
}
DC_Motor.prototype = Object.create(ComponentBase.prototype);
DC_Motor.prototype.constructor = DC_Motor;

DC_Motor.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-dc-motor' });
  g.appendChild(SvgUtil.el('ellipse', { cx:30, cy:30, rx:26, ry:26, fill:'#263238', stroke:'#546E7A', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:30, cy:30, rx:18, ry:18, fill:'#37474F', stroke:'#607D8B', 'stroke-width':'1.5' }));
  var blade1 = SvgUtil.el('ellipse', { cx:30, cy:18, rx:5, ry:11, fill:'#78909C', opacity:'0.85' });
  var blade2 = SvgUtil.el('ellipse', { cx:30, cy:42, rx:5, ry:11, fill:'#78909C', opacity:'0.85' });
  var blade3 = SvgUtil.el('ellipse', { cx:18, cy:30, rx:11, ry:5, fill:'#78909C', opacity:'0.85' });
  var blade4 = SvgUtil.el('ellipse', { cx:42, cy:30, rx:11, ry:5, fill:'#78909C', opacity:'0.85' });
  var bladeGroup = SvgUtil.el('g');
  bladeGroup.appendChild(blade1); bladeGroup.appendChild(blade2);
  bladeGroup.appendChild(blade3); bladeGroup.appendChild(blade4);
  g.appendChild(bladeGroup);
  g.appendChild(SvgUtil.el('circle', { cx:30, cy:30, r:5, fill:'#90A4AE' }));
  var speedLabel = SvgUtil.text('0%', { x:30, y:66, 'text-anchor':'middle', 'font-size':'9', fill:'#90CAF9', 'font-family':'monospace' });
  g.appendChild(speedLabel);
  g.appendChild(SvgUtil.text('DC MOTOR', { x:30, y:76, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(4,  30, 'A', id, 'signal'));
  g.appendChild(SvgUtil.pinDot(56, 30, 'B', id, 'signal'));
  this.element = g;
  this._bladeGroup = bladeGroup;
  this._speedLabel = speedLabel;
  return g;
};
DC_Motor.prototype.getConnectionPoints = function() {
  return [{ name:'A', x:4, y:30, type:'signal' }, { name:'B', x:56, y:30, type:'signal' }];
};
DC_Motor.prototype.getBoundingBox = function() { return { x:4, y:4, width:56, height:74 }; };
DC_Motor.prototype._spin = function() {
  var self = this;
  if (self._speed === 0) { if (self._animFrame) cancelAnimationFrame(self._animFrame); self._animFrame = null; return; }
  self._rotAngle = (self._rotAngle + self._speed * 0.5 * self._dir) % 360;
  if (self._bladeGroup) self._bladeGroup.setAttribute('transform', 'rotate('+self._rotAngle+',30,30)');
  self._animFrame = requestAnimationFrame(function() { self._spin(); });
};
DC_Motor.prototype.onGpioChange = function(pin, value) {
  this._speed = value ? 100 : 0;
  this._dir = value ? 1 : 0;
  if (this._speedLabel) this._speedLabel.textContent = this._speed + '%';
  if (this._speed > 0 && !this._animFrame) this._spin();
};
DC_Motor.prototype.onPwmChange = function(pin, duty, freq) {
  this._speed = Math.round((duty/255)*100);
  this._dir = duty > 0 ? 1 : 0;
  if (this._speedLabel) this._speedLabel.textContent = this._speed + '%';
  if (this._speed > 0 && !this._animFrame) this._spin();
  else if (this._speed === 0 && this._animFrame) { cancelAnimationFrame(this._animFrame); this._animFrame = null; }
};
ComponentRegistry.register('DC_Motor', DC_Motor);


// ─────────────────────────────────────────────────────────────────────────────
// 17. DC_Motor_L298N
// ─────────────────────────────────────────────────────────────────────────────
function DC_Motor_L298N(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'DC_Motor_L298N', config);
  this._in1 = 0; this._in2 = 0; this._ena = 0;
  this._in3 = 0; this._in4 = 0; this._enb = 0;
  this._dirLabel = null;
  this._speedLabel = null;
}
DC_Motor_L298N.prototype = Object.create(ComponentBase.prototype);
DC_Motor_L298N.prototype.constructor = DC_Motor_L298N;

DC_Motor_L298N.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-l298n' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:80, height:60, rx:4, fill:'#1A237E', stroke:'#3949AB', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('rect', { x:14, y:14, width:60, height:32, rx:3, fill:'#283593', stroke:'#5C6BC0', 'stroke-width':'1' }));
  g.appendChild(SvgUtil.text('L298N', { x:44, y:36, 'text-anchor':'middle', 'font-size':'10', fill:'#9FA8DA', 'font-family':'monospace', 'font-weight':'bold' }));
  var dirLabel  = SvgUtil.text('STOP', { x:44, y:52, 'text-anchor':'middle', 'font-size':'9', fill:'#FF8A65', 'font-family':'monospace' });
  g.appendChild(dirLabel);
  g.appendChild(SvgUtil.text('H-BRIDGE', { x:44, y:20, 'text-anchor':'middle', 'font-size':'7', fill:'#7986CB', 'font-family':'monospace' }));

  var pins = [
    { name:'IN1',  x:4,  y:10, type:'digital' },
    { name:'IN2',  x:4,  y:22, type:'digital' },
    { name:'ENA',  x:4,  y:34, type:'pwm' },
    { name:'IN3',  x:4,  y:46, type:'digital' },
    { name:'IN4',  x:4,  y:58, type:'digital' },
    { name:'ENB',  x:4,  y:70, type:'pwm' },
    { name:'VCC',  x:84, y:10, type:'power' },
    { name:'GND',  x:84, y:22, type:'gnd' },
    { name:'OUT1', x:84, y:46, type:'signal' },
    { name:'OUT2', x:84, y:58, type:'signal' }
  ];
  pins.forEach(function(p) {
    g.appendChild(SvgUtil.pinDot(p.x, p.y, p.name, id, p.type));
    g.appendChild(_pinLabel(p.x + (p.x < 10 ? 6 : -20), p.y+1, p.name));
  });

  this.element = g;
  this._dirLabel = dirLabel;
  return g;
};
DC_Motor_L298N.prototype.getConnectionPoints = function() {
  return [
    { name:'IN1',  x:4,  y:10, type:'digital' },
    { name:'IN2',  x:4,  y:22, type:'digital' },
    { name:'ENA',  x:4,  y:34, type:'pwm' },
    { name:'IN3',  x:4,  y:46, type:'digital' },
    { name:'IN4',  x:4,  y:58, type:'digital' },
    { name:'ENB',  x:4,  y:70, type:'pwm' },
    { name:'VCC',  x:84, y:10, type:'power' },
    { name:'GND',  x:84, y:22, type:'gnd' },
    { name:'OUT1', x:84, y:46, type:'signal' },
    { name:'OUT2', x:84, y:58, type:'signal' }
  ];
};
DC_Motor_L298N.prototype.getBoundingBox = function() { return { x:4, y:4, width:80, height:72 }; };
DC_Motor_L298N.prototype._updateLabel = function() {
  if (!this._dirLabel) return;
  var fwd = this._in1 && !this._in2;
  var rev = !this._in1 && this._in2;
  var s = fwd ? 'FWD' : rev ? 'REV' : 'STOP';
  this._dirLabel.textContent = s;
  this._dirLabel.setAttribute('fill', fwd ? '#69F0AE' : rev ? '#FF8A65' : '#90A4AE');
};
DC_Motor_L298N.prototype.onGpioChange = function(pin, value) {
  var bpMap = this.connections;
  for (var p in bpMap) {
    if (bpMap[p] === pin) {
      if (p === 'IN1') this._in1 = value;
      else if (p === 'IN2') this._in2 = value;
      else if (p === 'IN3') this._in3 = value;
      else if (p === 'IN4') this._in4 = value;
    }
  }
  this._updateLabel();
};
DC_Motor_L298N.prototype.onPwmChange = function(pin, duty, freq) {
  var bpMap = this.connections;
  for (var p in bpMap) {
    if (bpMap[p] === pin) {
      if (p === 'ENA') this._ena = duty;
      else if (p === 'ENB') this._enb = duty;
    }
  }
};
ComponentRegistry.register('DC_Motor_L298N', DC_Motor_L298N);


// ─────────────────────────────────────────────────────────────────────────────
// 18. Stepper_28BYJ48
// ─────────────────────────────────────────────────────────────────────────────
function Stepper_28BYJ48(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Stepper_28BYJ48', config);
  this._step = 0;
  this._angle = 0;
  this._animFrame = null;
  this._rotor = null;
}
Stepper_28BYJ48.prototype = Object.create(ComponentBase.prototype);
Stepper_28BYJ48.prototype.constructor = Stepper_28BYJ48;

Stepper_28BYJ48.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-stepper' });
  g.appendChild(SvgUtil.el('ellipse', { cx:36, cy:36, rx:32, ry:32, fill:'#3E2723', stroke:'#8D6E63', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:36, cy:36, rx:20, ry:20, fill:'#5D4037', stroke:'#A1887F', 'stroke-width':'1' }));
  // 코일 표시
  for (var i=0; i<4; i++) {
    var a = i * 90 * Math.PI/180;
    var cx = 36 + 26*Math.cos(a), cy = 36 + 26*Math.sin(a);
    g.appendChild(SvgUtil.el('ellipse', { cx:cx, cy:cy, rx:5, ry:8, fill:'#795548', stroke:'#BCAAA4', 'stroke-width':'0.5',
      transform:'rotate('+(i*90)+','+cx+','+cy+')' }));
  }
  var rotor = SvgUtil.el('g');
  rotor.appendChild(SvgUtil.el('ellipse', { cx:36, cy:36, rx:10, ry:10, fill:'#8D6E63' }));
  for (var j=0; j<8; j++) {
    var ja = j*45*Math.PI/180;
    rotor.appendChild(SvgUtil.el('line', { x1:36, y1:36, x2:(36+9*Math.cos(ja)).toFixed(1), y2:(36+9*Math.sin(ja)).toFixed(1), stroke:'#BCAAA4', 'stroke-width':'1.5' }));
  }
  g.appendChild(rotor);
  g.appendChild(SvgUtil.el('circle', { cx:36, cy:36, r:4, fill:'#BCAAA4' }));
  var angleLabel = SvgUtil.text('0°', { x:36, y:78, 'text-anchor':'middle', 'font-size':'9', fill:'#BCAAA4', 'font-family':'monospace' });
  g.appendChild(angleLabel);
  g.appendChild(SvgUtil.text('28BYJ-48', { x:36, y:87, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));

  ['IN1','IN2','IN3','IN4'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 10+i*14, n, id, 'digital'));
    g.appendChild(_pinLabel(10, 9+i*14, n));
  });
  g.appendChild(SvgUtil.pinDot(4, 66, 'VCC', id, 'power'));
  g.appendChild(_pinLabel(10, 65, 'VCC'));

  this.element = g;
  this._rotor = rotor;
  this._angleLabel = angleLabel;
  return g;
};
Stepper_28BYJ48.prototype.getConnectionPoints = function() {
  return [
    { name:'IN1', x:4, y:10, type:'digital' },
    { name:'IN2', x:4, y:24, type:'digital' },
    { name:'IN3', x:4, y:38, type:'digital' },
    { name:'IN4', x:4, y:52, type:'digital' },
    { name:'VCC', x:4, y:66, type:'power' }
  ];
};
Stepper_28BYJ48.prototype.getBoundingBox = function() { return { x:4, y:4, width:72, height:88 }; };
Stepper_28BYJ48.prototype.onGpioChange = function(pin, value) {
  // 매 IN 신호마다 7.5° 회전 (4096스텝/바퀴)
  if (value === 1) {
    this._angle = (this._angle + 7.5) % 360;
    if (this._rotor) this._rotor.setAttribute('transform', 'rotate('+this._angle+',36,36)');
    if (this._angleLabel) this._angleLabel.textContent = this._angle.toFixed(0) + '°';
  }
};
ComponentRegistry.register('Stepper_28BYJ48', Stepper_28BYJ48);


// ─────────────────────────────────────────────────────────────────────────────
// 19. Relay
// ─────────────────────────────────────────────────────────────────────────────
function Relay(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Relay', config);
  this._on = false;
  this._indicator = null;
  this._audioCtx = null;
}
Relay.prototype = Object.create(ComponentBase.prototype);
Relay.prototype.constructor = Relay;

Relay.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-relay' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:70, height:56, rx:4, fill:'#1B5E20', stroke:'#388E3C', 'stroke-width':'2' }));
  // 코일 표시
  g.appendChild(SvgUtil.el('rect', { x:10, y:12, width:30, height:24, rx:2, fill:'#2E7D32', stroke:'#4CAF50', 'stroke-width':'1' }));
  for (var i=0; i<5; i++) {
    g.appendChild(SvgUtil.el('line', { x1:12+i*5, y1:14, x2:12+i*5, y2:34, stroke:'#66BB6A', 'stroke-width':'1' }));
  }
  g.appendChild(SvgUtil.text('RELAY', { x:25, y:44, 'text-anchor':'middle', 'font-size':'7', fill:'#A5D6A7', 'font-family':'monospace' }));
  // 스위치 표시
  g.appendChild(SvgUtil.el('rect', { x:46, y:12, width:22, height:24, rx:2, fill:'#263238', stroke:'#546E7A', 'stroke-width':'1' }));
  var indicator = SvgUtil.el('circle', { cx:57, cy:24, r:7, fill:'#F44336' });
  g.appendChild(indicator);
  g.appendChild(SvgUtil.text('NC', { x:57, y:44, 'text-anchor':'middle', 'font-size':'7', fill:'#EF9A9A', 'font-family':'monospace' }));

  ['IN','VCC','GND'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 60+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':'digital'));
    g.appendChild(_pinLabel(10, 59+i*12, n));
  });
  ['NO','COM','NC'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(74, 12+i*14, n, id, 'signal'));
    g.appendChild(_pinLabel(64, 11+i*14, n));
  });

  this.element = g;
  this._indicator = indicator;
  return g;
};
Relay.prototype.getConnectionPoints = function() {
  return [
    { name:'IN',  x:4,  y:60, type:'digital' },
    { name:'VCC', x:4,  y:72, type:'power' },
    { name:'GND', x:4,  y:84, type:'gnd' },
    { name:'NO',  x:74, y:12, type:'signal' },
    { name:'COM', x:74, y:26, type:'signal' },
    { name:'NC',  x:74, y:40, type:'signal' }
  ];
};
Relay.prototype.getBoundingBox = function() { return { x:4, y:4, width:70, height:88 }; };
Relay.prototype._click = function() {
  // 릴레이 클릭 소리
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if (Ctx) {
    if (!this._audioCtx) this._audioCtx = new Ctx();
    var buf = this._audioCtx.createBuffer(1, 1024, this._audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i=0; i<1024; i++) data[i] = (Math.random()*2-1) * Math.exp(-i/80);
    var src = this._audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(this._audioCtx.destination);
    src.start();
  }
};
Relay.prototype.onGpioChange = function(pin, value) {
  this._on = (value === 1);
  if (this._indicator) this._indicator.setAttribute('fill', this._on ? '#4CAF50' : '#F44336');
  var lbl = this.element && this.element.querySelector('text[x="57"]');
  if (lbl) lbl.textContent = this._on ? 'NO' : 'NC';
  this._click();
};
ComponentRegistry.register('Relay', Relay);


// ─────────────────────────────────────────────────────────────────────────────
// 20. LCD_1602 (I2C 16x2)
// ─────────────────────────────────────────────────────────────────────────────
function LCD_1602(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'LCD_1602', config);
  this._rows = [Array(16).fill(' '), Array(16).fill(' ')];
  this._cursor = { row:0, col:0 };
  this._cells = null;
  this._address = config.address || 0x27;
}
LCD_1602.prototype = Object.create(ComponentBase.prototype);
LCD_1602.prototype.constructor = LCD_1602;

LCD_1602.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-lcd1602' });
  // 기판
  g.appendChild(SvgUtil.el('rect', { x:2, y:2, width:184, height:60, rx:4, fill:'#1A237E', stroke:'#3949AB', 'stroke-width':'2' }));
  // LCD 패널
  g.appendChild(SvgUtil.el('rect', { x:8, y:8, width:172, height:46, rx:2, fill:'#00695C', stroke:'#26A69A', 'stroke-width':'1.5' }));
  // 셀 그리기
  var cells = [];
  for (var r=0; r<2; r++) {
    cells.push([]);
    for (var c=0; c<16; c++) {
      var cellGroup = SvgUtil.el('g');
      var bg = SvgUtil.el('rect', { x:10+c*10, y:10+r*20, width:10, height:18, fill:'#00695C' });
      var ch = SvgUtil.text(' ', { x:15+c*10, y:24+r*20, 'text-anchor':'middle', 'font-size':'10', fill:'#80CBC4', 'font-family':'monospace' });
      cellGroup.appendChild(bg);
      cellGroup.appendChild(ch);
      g.appendChild(cellGroup);
      cells[r].push(ch);
    }
  }
  g.appendChild(SvgUtil.text('LCD 1602 I2C 0x'+this._address.toString(16).toUpperCase(), {
    x:95, y:64, 'text-anchor':'middle', 'font-size':'7', fill:'#7986CB', 'font-family':'monospace'
  }));
  ['SDA','SCL','VCC','GND'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 72+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':'i2c'));
    g.appendChild(_pinLabel(10, 71+i*12, n));
  });

  this.element = g;
  this._cells = cells;
  return g;
};
LCD_1602.prototype.getConnectionPoints = function() {
  return [
    { name:'SDA', x:4, y:72,  type:'i2c' },
    { name:'SCL', x:4, y:84,  type:'i2c' },
    { name:'VCC', x:4, y:96,  type:'power' },
    { name:'GND', x:4, y:108, type:'gnd' }
  ];
};
LCD_1602.prototype.getBoundingBox = function() { return { x:2, y:2, width:184, height:110 }; };
LCD_1602.prototype.setCursor = function(col, row) {
  this._cursor.col = Math.max(0, Math.min(15, col));
  this._cursor.row = Math.max(0, Math.min(1, row));
};
LCD_1602.prototype.print = function(str) {
  for (var i=0; i<str.length; i++) {
    if (this._cursor.col >= 16) { this._cursor.col = 0; this._cursor.row = (this._cursor.row+1)%2; }
    this._rows[this._cursor.row][this._cursor.col] = str[i];
    if (this._cells) this._cells[this._cursor.row][this._cursor.col].textContent = str[i];
    this._cursor.col++;
  }
};
LCD_1602.prototype.clear = function() {
  this._rows = [Array(16).fill(' '), Array(16).fill(' ')];
  this._cursor = { row:0, col:0 };
  if (this._cells) {
    for (var r=0; r<2; r++) for (var c=0; c<16; c++) this._cells[r][c].textContent = ' ';
  }
};
ComponentRegistry.register('LCD_1602', LCD_1602);


// ─────────────────────────────────────────────────────────────────────────────
// 21. LCD_2004 (20x4)
// ─────────────────────────────────────────────────────────────────────────────
function LCD_2004(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'LCD_2004', config);
  this._rows = [Array(20).fill(' '), Array(20).fill(' '), Array(20).fill(' '), Array(20).fill(' ')];
  this._cursor = { row:0, col:0 };
  this._cells = null;
  this._address = config.address || 0x27;
}
LCD_2004.prototype = Object.create(ComponentBase.prototype);
LCD_2004.prototype.constructor = LCD_2004;

LCD_2004.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-lcd2004' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:2, width:226, height:82, rx:4, fill:'#1A237E', stroke:'#3949AB', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('rect', { x:8, y:8, width:214, height:68, rx:2, fill:'#00695C', stroke:'#26A69A', 'stroke-width':'1.5' }));
  var cells = [];
  for (var r=0; r<4; r++) {
    cells.push([]);
    for (var c=0; c<20; c++) {
      var ch = SvgUtil.text(' ', { x:18+c*10, y:20+r*16, 'text-anchor':'middle', 'font-size':'10', fill:'#80CBC4', 'font-family':'monospace' });
      g.appendChild(ch);
      cells[r].push(ch);
    }
  }
  g.appendChild(SvgUtil.text('LCD 2004 I2C', { x:115, y:90, 'text-anchor':'middle', 'font-size':'7', fill:'#7986CB', 'font-family':'monospace' }));
  ['SDA','SCL','VCC','GND'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 98+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':'i2c'));
    g.appendChild(_pinLabel(10, 97+i*12, n));
  });
  this.element = g;
  this._cells = cells;
  return g;
};
LCD_2004.prototype.getConnectionPoints = function() {
  return [
    { name:'SDA', x:4, y:98,  type:'i2c' },
    { name:'SCL', x:4, y:110, type:'i2c' },
    { name:'VCC', x:4, y:122, type:'power' },
    { name:'GND', x:4, y:134, type:'gnd' }
  ];
};
LCD_2004.prototype.getBoundingBox = function() { return { x:2, y:2, width:226, height:136 }; };
LCD_2004.prototype.setCursor = function(col, row) {
  this._cursor.col = Math.max(0, Math.min(19, col));
  this._cursor.row = Math.max(0, Math.min(3, row));
};
LCD_2004.prototype.print = function(str) {
  for (var i=0; i<str.length; i++) {
    if (this._cursor.col >= 20) { this._cursor.col = 0; this._cursor.row = (this._cursor.row+1)%4; }
    this._rows[this._cursor.row][this._cursor.col] = str[i];
    if (this._cells) this._cells[this._cursor.row][this._cursor.col].textContent = str[i];
    this._cursor.col++;
  }
};
LCD_2004.prototype.clear = function() {
  this._rows = [Array(20).fill(' '),Array(20).fill(' '),Array(20).fill(' '),Array(20).fill(' ')];
  this._cursor = { row:0, col:0 };
  if (this._cells) for (var r=0; r<4; r++) for (var c=0; c<20; c++) this._cells[r][c].textContent = ' ';
};
ComponentRegistry.register('LCD_2004', LCD_2004);


// ─────────────────────────────────────────────────────────────────────────────
// 22. OLED_SSD1306 (128x64, Canvas2D)
// ─────────────────────────────────────────────────────────────────────────────
function OLED_SSD1306(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'OLED_SSD1306', config);
  this._canvas = null;
  this._ctx2d = null;
  this._width = 128; this._height = 64;
  this._cursorX = 0; this._cursorY = 0;
  this._textSize = 1;
  this._fgColor = '#FFFFFF'; this._bgColor = '#000000';
  this._pixels = new Uint8Array(128*64);
  this._address = config.address || 0x3C;
}
OLED_SSD1306.prototype = Object.create(ComponentBase.prototype);
OLED_SSD1306.prototype.constructor = OLED_SSD1306;

OLED_SSD1306.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-oled' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:2, width:144, height:88, rx:6, fill:'#212121', stroke:'#424242', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('rect', { x:8, y:8, width:132, height:70, rx:2, fill:'#000' }));
  var fo = SvgUtil.el('foreignObject', { x:8, y:8, width:132, height:70 });
  var canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 64;
  canvas.style.cssText = 'width:132px;height:70px;image-rendering:pixelated;background:#000;';
  fo.appendChild(canvas);
  g.appendChild(fo);
  g.appendChild(SvgUtil.text('SSD1306 OLED 0x'+this._address.toString(16).toUpperCase(), {
    x:76, y:92, 'text-anchor':'middle', 'font-size':'7', fill:'#616161', 'font-family':'monospace'
  }));
  ['SDA','SCL','VCC','GND'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 100+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':'i2c'));
    g.appendChild(_pinLabel(10, 99+i*12, n));
  });
  this.element = g;
  this._canvas = canvas;
  this._ctx2d = canvas.getContext('2d');
  this.clearDisplay();
  return g;
};
OLED_SSD1306.prototype.getConnectionPoints = function() {
  return [
    { name:'SDA', x:4, y:100, type:'i2c' },
    { name:'SCL', x:4, y:112, type:'i2c' },
    { name:'VCC', x:4, y:124, type:'power' },
    { name:'GND', x:4, y:136, type:'gnd' }
  ];
};
OLED_SSD1306.prototype.getBoundingBox = function() { return { x:2, y:2, width:144, height:138 }; };
OLED_SSD1306.prototype.clearDisplay = function() {
  if (!this._ctx2d) return;
  this._ctx2d.fillStyle = '#000';
  this._ctx2d.fillRect(0, 0, 128, 64);
  this._pixels.fill(0);
};
OLED_SSD1306.prototype.drawPixel = function(x, y, color) {
  if (x<0||x>=128||y<0||y>=64) return;
  if (!this._ctx2d) return;
  this._ctx2d.fillStyle = color ? '#FFF' : '#000';
  this._ctx2d.fillRect(x, y, 1, 1);
  this._pixels[y*128+x] = color ? 1 : 0;
};
OLED_SSD1306.prototype.drawString = function(str, x, y, size) {
  if (!this._ctx2d) return;
  size = size || 1;
  this._ctx2d.font = (size*8)+'px monospace';
  this._ctx2d.fillStyle = '#FFF';
  this._ctx2d.fillText(str, x, y + size*8);
};
OLED_SSD1306.prototype.setCursor = function(x, y) { this._cursorX = x; this._cursorY = y; };
OLED_SSD1306.prototype.print = function(str) {
  this.drawString(str, this._cursorX, this._cursorY, this._textSize);
  this._cursorX += str.length * 6 * this._textSize;
};
OLED_SSD1306.prototype.setTextSize = function(sz) { this._textSize = sz; };
OLED_SSD1306.prototype.drawRect = function(x, y, w, h, color) {
  if (!this._ctx2d) return;
  this._ctx2d.strokeStyle = color ? '#FFF' : '#000';
  this._ctx2d.strokeRect(x, y, w, h);
};
OLED_SSD1306.prototype.fillRect = function(x, y, w, h, color) {
  if (!this._ctx2d) return;
  this._ctx2d.fillStyle = color ? '#FFF' : '#000';
  this._ctx2d.fillRect(x, y, w, h);
};
OLED_SSD1306.prototype.drawLine = function(x0, y0, x1, y1, color) {
  if (!this._ctx2d) return;
  this._ctx2d.strokeStyle = color ? '#FFF' : '#000';
  this._ctx2d.beginPath(); this._ctx2d.moveTo(x0,y0); this._ctx2d.lineTo(x1,y1); this._ctx2d.stroke();
};
OLED_SSD1306.prototype.drawCircle = function(x, y, r, color) {
  if (!this._ctx2d) return;
  this._ctx2d.strokeStyle = color ? '#FFF' : '#000';
  this._ctx2d.beginPath(); this._ctx2d.arc(x,y,r,0,2*Math.PI); this._ctx2d.stroke();
};
ComponentRegistry.register('OLED_SSD1306', OLED_SSD1306);


// ─────────────────────────────────────────────────────────────────────────────
// 23. TM1637 (4자리 7세그먼트)
// ─────────────────────────────────────────────────────────────────────────────
function TM1637(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'TM1637', config);
  this._digits = [0, 0, 0, 0];
  this._segGroups = null;
  this._colon = false;
}
TM1637.prototype = Object.create(ComponentBase.prototype);
TM1637.prototype.constructor = TM1637;

TM1637._SEG = [
  0b0111111, // 0
  0b0000110, // 1
  0b1011011, // 2
  0b1001111, // 3
  0b1100110, // 4
  0b1101101, // 5
  0b1111101, // 6
  0b0000111, // 7
  0b1111111, // 8
  0b1101111  // 9
];

TM1637.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-tm1637' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:2, width:116, height:42, rx:4, fill:'#212121', stroke:'#424242', 'stroke-width':'1.5' }));
  var segGroups = [];
  for (var d=0; d<4; d++) {
    var ox = 8 + d*28;
    if (d === 2) ox += 4; // 콜론 공간
    var segs = [];
    var colors = { on:'#FF3D00', off:'#2E1A1A' };
    // 7세그먼트: a(상), b(우상), c(우하), d(하), e(좌하), f(좌상), g(중)
    var segDefs = [
      { points: ox+4+','+8 +' '+(ox+20)+','+8 +' '+(ox+18)+','+12 +' '+(ox+6)+','+12 },   // a
      { points: (ox+20)+','+10+' '+(ox+22)+','+24+' '+(ox+18)+','+24+' '+(ox+18)+','+12 }, // b
      { points: (ox+20)+','+26+' '+(ox+22)+','+40+' '+(ox+18)+','+38+' '+(ox+18)+','+26 }, // c
      { points: ox+4+','+38+' '+(ox+20)+','+38+' '+(ox+18)+','+42+' '+(ox+6)+','+42 },     // d
      { points: ox+2+','+26+' '+ox+6+','+26+' '+ox+6+','+38+' '+ox+2+','+40 },             // e
      { points: ox+2+','+10+' '+ox+6+','+12+' '+ox+6+','+24+' '+ox+2+','+24 },             // f
      { points: ox+4+','+24+' '+(ox+18)+','+24+' '+(ox+20)+','+26+' '+(ox+18)+','+28+' '+ox+4+','+28+' '+ox+2+','+26 } // g
    ];
    segDefs.forEach(function(sd) {
      var seg = SvgUtil.el('polygon', { points:sd.points, fill:colors.off, stroke:'#111', 'stroke-width':'0.5' });
      segs.push(seg);
      g.appendChild(seg);
    });
    segGroups.push(segs);
  }
  // 콜론
  var colon1 = SvgUtil.el('circle', { cx:62, cy:18, r:2, fill:'#2E1A1A' });
  var colon2 = SvgUtil.el('circle', { cx:62, cy:30, r:2, fill:'#2E1A1A' });
  g.appendChild(colon1); g.appendChild(colon2);

  g.appendChild(SvgUtil.text('TM1637', { x:60, y:54, 'text-anchor':'middle', 'font-size':'7', fill:'#616161', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(4,  58, 'CLK', id, 'digital')); g.appendChild(_pinLabel(10, 57, 'CLK'));
  g.appendChild(SvgUtil.pinDot(4,  68, 'DIO', id, 'digital')); g.appendChild(_pinLabel(10, 67, 'DIO'));
  g.appendChild(SvgUtil.pinDot(4,  78, 'VCC', id, 'power'));   g.appendChild(_pinLabel(10, 77, 'VCC'));
  g.appendChild(SvgUtil.pinDot(4,  88, 'GND', id, 'gnd'));     g.appendChild(_pinLabel(10, 87, 'GND'));

  this.element = g;
  this._segGroups = segGroups;
  this._colon1 = colon1; this._colon2 = colon2;
  this._showDigits();
  return g;
};
TM1637.prototype.getConnectionPoints = function() {
  return [
    { name:'CLK', x:4, y:58, type:'digital' },
    { name:'DIO', x:4, y:68, type:'digital' },
    { name:'VCC', x:4, y:78, type:'power' },
    { name:'GND', x:4, y:88, type:'gnd' }
  ];
};
TM1637.prototype.getBoundingBox = function() { return { x:2, y:2, width:116, height:90 }; };
TM1637.prototype._showDigits = function() {
  if (!this._segGroups) return;
  var colors = { on:'#FF3D00', off:'#2E1A1A' };
  for (var d=0; d<4; d++) {
    var seg = TM1637._SEG[this._digits[d]] || 0;
    for (var s=0; s<7; s++) {
      this._segGroups[d][s].setAttribute('fill', (seg >> s) & 1 ? colors.on : colors.off);
    }
  }
  if (this._colon1) {
    this._colon1.setAttribute('fill', this._colon ? '#FF3D00' : '#2E1A1A');
    this._colon2.setAttribute('fill', this._colon ? '#FF3D00' : '#2E1A1A');
  }
};
TM1637.prototype.showNumber = function(num, leading) {
  var n = Math.abs(Math.round(num)) % 10000;
  this._digits[3] = n % 10; n = Math.floor(n/10);
  this._digits[2] = n % 10; n = Math.floor(n/10);
  this._digits[1] = n % 10; n = Math.floor(n/10);
  this._digits[0] = n % 10;
  this._showDigits();
};
TM1637.prototype.showNumberDecEx = function(num, dots, leading) { this._colon = !!(dots & 0x40); this.showNumber(num, leading); };
ComponentRegistry.register('TM1637', TM1637);


// ─────────────────────────────────────────────────────────────────────────────
// 24. SevenSeg (단일 7세그먼트)
// ─────────────────────────────────────────────────────────────────────────────
function SevenSeg(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'SevenSeg', config);
  this._state = { a:0, b:0, c:0, d:0, e:0, f:0, g:0, dp:0 };
  this._segs = {};
}
SevenSeg.prototype = Object.create(ComponentBase.prototype);
SevenSeg.prototype.constructor = SevenSeg;

SevenSeg.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-sevenseg' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:2, width:44, height:54, rx:3, fill:'#212121', stroke:'#424242', 'stroke-width':'1.5' }));
  var segs = {};
  var ox = 6, oy = 4;
  var colors = { on:'#FF3D00', off:'#2E1A1A' };
  var defs2 = [
    { name:'a',  points: (ox+2)+','+(oy+2)+' '+(ox+20)+','+(oy+2)+' '+(ox+18)+','+(oy+6)+' '+(ox+4)+','+(oy+6) },
    { name:'b',  points: (ox+20)+','+(oy+4)+' '+(ox+22)+','+(oy+18)+' '+(ox+18)+','+(oy+18)+' '+(ox+18)+','+(oy+6) },
    { name:'c',  points: (ox+20)+','+(oy+22)+' '+(ox+22)+','+(oy+36)+' '+(ox+18)+','+(oy+36)+' '+(ox+18)+','+(oy+22) },
    { name:'d',  points: (ox+2)+','+(oy+36)+' '+(ox+20)+','+(oy+36)+' '+(ox+18)+','+(oy+40)+' '+(ox+4)+','+(oy+40) },
    { name:'e',  points: (ox)+','+(oy+22)+' '+(ox+4)+','+(oy+22)+' '+(ox+4)+','+(oy+36)+' '+(ox)+','+(oy+36) },
    { name:'f',  points: (ox)+','+(oy+4)+' '+(ox+4)+','+(oy+6)+' '+(ox+4)+','+(oy+18)+' '+(ox)+','+(oy+18) },
    { name:'g',  points: (ox+2)+','+(oy+19)+' '+(ox+18)+','+(oy+19)+' '+(ox+20)+','+(oy+21)+' '+(ox+18)+','+(oy+23)+' '+(ox+2)+','+(oy+23)+' '+(ox)+','+(oy+21) }
  ];
  defs2.forEach(function(sd) {
    var seg = SvgUtil.el('polygon', { points:sd.points, fill:colors.off, stroke:'#111', 'stroke-width':'0.5' });
    segs[sd.name] = seg;
    g.appendChild(seg);
  });
  var dp = SvgUtil.el('circle', { cx:ox+24, cy:oy+38, r:2, fill:colors.off });
  segs['dp'] = dp;
  g.appendChild(dp);

  var pinNames = ['a','b','c','d','e','f','g','dp','VCC','GND'];
  pinNames.forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 60+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':'digital'));
    g.appendChild(_pinLabel(10, 59+i*12, n));
  });

  this.element = g;
  this._segs = segs;
  return g;
};
SevenSeg.prototype.getConnectionPoints = function() {
  var pts = [];
  ['a','b','c','d','e','f','g','dp','VCC','GND'].forEach(function(n, i) {
    pts.push({ name:n, x:4, y:60+i*12, type: n==='VCC'?'power':n==='GND'?'gnd':'digital' });
  });
  return pts;
};
SevenSeg.prototype.getBoundingBox = function() { return { x:2, y:2, width:44, height:180 }; };
SevenSeg.prototype.onGpioChange = function(pin, value) {
  var bpMap = this.connections;
  for (var p in bpMap) {
    if (bpMap[p] === pin) {
      this._state[p] = value;
      if (this._segs[p]) this._segs[p].setAttribute('fill', value ? '#FF3D00' : '#2E1A1A');
    }
  }
};
ComponentRegistry.register('SevenSeg', SevenSeg);


// ─────────────────────────────────────────────────────────────────────────────
// 25. DHT11
// ─────────────────────────────────────────────────────────────────────────────
function DHT11(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'DHT11', config);
  this._temp = config.defaultTemp || 25;
  this._humi = config.defaultHumi || 60;
  this._tempLabel = null; this._humiLabel = null;
}
DHT11.prototype = Object.create(ComponentBase.prototype);
DHT11.prototype.constructor = DHT11;

DHT11.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-dht11' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:48, height:36, rx:4, fill:'#0D47A1', stroke:'#1976D2', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('rect', { x:10, y:8,  width:16, height:28, rx:8, fill:'#1565C0', stroke:'#42A5F5', 'stroke-width':'1' }));
  var tl = SvgUtil.text(self._temp+'°', { x:36, y:18, 'font-size':'9', fill:'#EF9A9A', 'font-family':'monospace' });
  var hl = SvgUtil.text(self._humi+'%', { x:36, y:30, 'font-size':'9', fill:'#90CAF9', 'font-family':'monospace' });
  g.appendChild(tl); g.appendChild(hl);
  g.appendChild(SvgUtil.text('DHT11', { x:28, y:50, 'text-anchor':'middle', 'font-size':'8', fill:'#90CAF9', 'font-family':'monospace' }));

  // 슬라이더
  var foT = SvgUtil.el('foreignObject', { x:4, y:52, width:50, height:14 });
  var inT = document.createElement('input');
  inT.type='range'; inT.min=-10; inT.max=60; inT.value=self._temp;
  inT.style.cssText='width:50px;height:10px;cursor:pointer;accent-color:#EF9A9A;';
  inT.title='온도 (°C)';
  inT.addEventListener('input', function() { self._temp=parseInt(this.value); tl.textContent=self._temp+'°'; });
  foT.appendChild(inT);

  var foH = SvgUtil.el('foreignObject', { x:4, y:66, width:50, height:14 });
  var inH = document.createElement('input');
  inH.type='range'; inH.min=0; inH.max=100; inH.value=self._humi;
  inH.style.cssText='width:50px;height:10px;cursor:pointer;accent-color:#90CAF9;';
  inH.title='습도 (%)';
  inH.addEventListener('input', function() { self._humi=parseInt(this.value); hl.textContent=self._humi+'%'; });
  foH.appendChild(inH);

  g.appendChild(foT); g.appendChild(foH);
  g.appendChild(SvgUtil.pinDot(4,  82, 'VCC',  id, 'power'));
  g.appendChild(SvgUtil.pinDot(4,  92, 'DATA', id, 'digital'));
  g.appendChild(SvgUtil.pinDot(4, 102, 'GND',  id, 'gnd'));
  g.appendChild(_pinLabel(10, 81, 'VCC')); g.appendChild(_pinLabel(10, 91, 'DATA')); g.appendChild(_pinLabel(10, 101, 'GND'));

  this.element = g;
  this._tempLabel = tl; this._humiLabel = hl;
  return g;
};
DHT11.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC',  x:4, y:82,  type:'power' },
    { name:'DATA', x:4, y:92,  type:'digital' },
    { name:'GND',  x:4, y:102, type:'gnd' }
  ];
};
DHT11.prototype.getBoundingBox = function() { return { x:4, y:4, width:52, height:104 }; };
DHT11.prototype.readTemperature = function() { return this._temp; };
DHT11.prototype.readHumidity = function() { return this._humi; };
ComponentRegistry.register('DHT11', DHT11);


// ─────────────────────────────────────────────────────────────────────────────
// 26. DHT22
// ─────────────────────────────────────────────────────────────────────────────
function DHT22(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'DHT22', config);
  this._temp = config.defaultTemp || 25.0;
  this._humi = config.defaultHumi || 55.0;
}
DHT22.prototype = Object.create(ComponentBase.prototype);
DHT22.prototype.constructor = DHT22;

DHT22.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-dht22' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:50, height:38, rx:4, fill:'#1A237E', stroke:'#3949AB', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('rect', { x:10, y:8, width:18, height:30, rx:9, fill:'#283593', stroke:'#5C6BC0', 'stroke-width':'1' }));
  var tl = SvgUtil.text(self._temp.toFixed(1)+'°', { x:36, y:22, 'font-size':'9', fill:'#FF8A65', 'font-family':'monospace' });
  var hl = SvgUtil.text(self._humi.toFixed(1)+'%', { x:36, y:34, 'font-size':'9', fill:'#80DEEA', 'font-family':'monospace' });
  g.appendChild(tl); g.appendChild(hl);
  g.appendChild(SvgUtil.text('DHT22', { x:29, y:52, 'text-anchor':'middle', 'font-size':'8', fill:'#9FA8DA', 'font-family':'monospace' }));

  var foT = SvgUtil.el('foreignObject', { x:4, y:54, width:52, height:14 });
  var inT = document.createElement('input');
  inT.type='range'; inT.min=-40; inT.max=80; inT.step='0.5'; inT.value=self._temp;
  inT.style.cssText='width:52px;height:10px;cursor:pointer;accent-color:#FF8A65;';
  inT.addEventListener('input', function() { self._temp=parseFloat(this.value); tl.textContent=self._temp.toFixed(1)+'°'; });
  foT.appendChild(inT);

  var foH = SvgUtil.el('foreignObject', { x:4, y:68, width:52, height:14 });
  var inH = document.createElement('input');
  inH.type='range'; inH.min=0; inH.max=100; inH.step='0.5'; inH.value=self._humi;
  inH.style.cssText='width:52px;height:10px;cursor:pointer;accent-color:#80DEEA;';
  inH.addEventListener('input', function() { self._humi=parseFloat(this.value); hl.textContent=self._humi.toFixed(1)+'%'; });
  foH.appendChild(inH);

  g.appendChild(foT); g.appendChild(foH);
  g.appendChild(SvgUtil.pinDot(4,  84, 'VCC',  id, 'power'));
  g.appendChild(SvgUtil.pinDot(4,  94, 'DATA', id, 'digital'));
  g.appendChild(SvgUtil.pinDot(4, 104, 'NC',   id, 'signal'));
  g.appendChild(SvgUtil.pinDot(4, 114, 'GND',  id, 'gnd'));
  this.element = g;
  return g;
};
DHT22.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC',  x:4, y:84,  type:'power' },
    { name:'DATA', x:4, y:94,  type:'digital' },
    { name:'NC',   x:4, y:104, type:'signal' },
    { name:'GND',  x:4, y:114, type:'gnd' }
  ];
};
DHT22.prototype.getBoundingBox = function() { return { x:4, y:4, width:54, height:116 }; };
DHT22.prototype.readTemperature = function() { return this._temp; };
DHT22.prototype.readHumidity = function() { return this._humi; };
ComponentRegistry.register('DHT22', DHT22);


// ─────────────────────────────────────────────────────────────────────────────
// 27. DS18B20 (원와이어 온도센서)
// ─────────────────────────────────────────────────────────────────────────────
function DS18B20(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'DS18B20', config);
  this._temp = config.defaultTemp || 25.0;
}
DS18B20.prototype = Object.create(ComponentBase.prototype);
DS18B20.prototype.constructor = DS18B20;

DS18B20.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-ds18b20' });
  g.appendChild(SvgUtil.el('rect', { x:6, y:4, width:36, height:28, rx:4, fill:'#37474F', stroke:'#607D8B', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('rect', { x:18, y:28, width:12, height:12, rx:1, fill:'#546E7A' }));
  var tl = SvgUtil.text(self._temp.toFixed(1)+'°C', { x:24, y:22, 'text-anchor':'middle', 'font-size':'8', fill:'#80DEEA', 'font-family':'monospace' });
  g.appendChild(tl);
  g.appendChild(SvgUtil.text('DS18B20', { x:24, y:48, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));
  var fo = SvgUtil.el('foreignObject', { x:4, y:52, width:44, height:14 });
  var inp = document.createElement('input');
  inp.type='range'; inp.min=-55; inp.max=125; inp.step='0.5'; inp.value=self._temp;
  inp.style.cssText='width:44px;height:10px;cursor:pointer;accent-color:#80DEEA;';
  inp.addEventListener('input', function() { self._temp=parseFloat(this.value); tl.textContent=self._temp.toFixed(1)+'°C'; });
  fo.appendChild(inp);
  g.appendChild(fo);
  g.appendChild(SvgUtil.pinDot(6,  68, 'GND',  id, 'gnd'));
  g.appendChild(SvgUtil.pinDot(6,  78, 'DATA', id, 'digital'));
  g.appendChild(SvgUtil.pinDot(6,  88, 'VDD',  id, 'power'));
  g.appendChild(_pinLabel(12, 67, 'GND')); g.appendChild(_pinLabel(12, 77, 'DATA')); g.appendChild(_pinLabel(12, 87, 'VDD'));
  this.element = g;
  return g;
};
DS18B20.prototype.getConnectionPoints = function() {
  return [
    { name:'GND',  x:6, y:68, type:'gnd' },
    { name:'DATA', x:6, y:78, type:'digital' },
    { name:'VDD',  x:6, y:88, type:'power' }
  ];
};
DS18B20.prototype.getBoundingBox = function() { return { x:6, y:4, width:36, height:90 }; };
DS18B20.prototype.readTemperature = function() { return this._temp; };
ComponentRegistry.register('DS18B20', DS18B20);


// ─────────────────────────────────────────────────────────────────────────────
// 28. Ultrasonic_HCSR04
// ─────────────────────────────────────────────────────────────────────────────
function Ultrasonic_HCSR04(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Ultrasonic_HCSR04', config);
  this._distCm = config.defaultDist || 30;
  this._triggered = false;
  this._distLabel = null;
}
Ultrasonic_HCSR04.prototype = Object.create(ComponentBase.prototype);
Ultrasonic_HCSR04.prototype.constructor = Ultrasonic_HCSR04;

Ultrasonic_HCSR04.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-hcsr04' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:4, width:60, height:38, rx:4, fill:'#1B5E20', stroke:'#388E3C', 'stroke-width':'1.5' }));
  // 두 원통형 초음파 소자
  g.appendChild(SvgUtil.el('ellipse', { cx:16, cy:23, rx:10, ry:12, fill:'#2E7D32', stroke:'#66BB6A', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:48, cy:23, rx:10, ry:12, fill:'#2E7D32', stroke:'#66BB6A', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:16, cy:23, rx:7, ry:8, fill:'#388E3C' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:48, cy:23, rx:7, ry:8, fill:'#388E3C' }));
  g.appendChild(SvgUtil.text('T',  { x:16, y:25, 'text-anchor':'middle', 'font-size':'9', fill:'#A5D6A7', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.text('R',  { x:48, y:25, 'text-anchor':'middle', 'font-size':'9', fill:'#A5D6A7', 'font-family':'monospace' }));
  var dl = SvgUtil.text(self._distCm+'cm', { x:32, y:52, 'text-anchor':'middle', 'font-size':'9', fill:'#69F0AE', 'font-family':'monospace' });
  g.appendChild(dl);
  g.appendChild(SvgUtil.text('HC-SR04', { x:32, y:62, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));
  var fo = SvgUtil.el('foreignObject', { x:4, y:64, width:58, height:14 });
  var inp = document.createElement('input');
  inp.type='range'; inp.min=2; inp.max=400; inp.value=self._distCm;
  inp.style.cssText='width:58px;height:10px;cursor:pointer;accent-color:#69F0AE;';
  inp.title='거리 (cm)';
  inp.addEventListener('input', function() { self._distCm=parseInt(this.value); dl.textContent=self._distCm+'cm'; });
  fo.appendChild(inp);
  g.appendChild(fo);
  g.appendChild(SvgUtil.pinDot(4,  80, 'VCC',  id, 'power')); g.appendChild(_pinLabel(10, 79, 'VCC'));
  g.appendChild(SvgUtil.pinDot(4,  90, 'TRIG', id, 'digital')); g.appendChild(_pinLabel(10, 89, 'TRIG'));
  g.appendChild(SvgUtil.pinDot(4, 100, 'ECHO', id, 'digital')); g.appendChild(_pinLabel(10, 99, 'ECHO'));
  g.appendChild(SvgUtil.pinDot(4, 110, 'GND',  id, 'gnd'));    g.appendChild(_pinLabel(10, 109, 'GND'));
  this.element = g;
  this._distLabel = dl;
  return g;
};
Ultrasonic_HCSR04.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC',  x:4, y:80,  type:'power' },
    { name:'TRIG', x:4, y:90,  type:'digital' },
    { name:'ECHO', x:4, y:100, type:'digital' },
    { name:'GND',  x:4, y:110, type:'gnd' }
  ];
};
Ultrasonic_HCSR04.prototype.getBoundingBox = function() { return { x:2, y:4, width:60, height:112 }; };
Ultrasonic_HCSR04.prototype.onGpioChange = function(pin, value) {
  // TRIG 핀이 HIGH → 측정 시작, ECHO로 응답 (시뮬: 즉시)
  var bpMap = this.connections;
  for (var p in bpMap) {
    if (bpMap[p] === pin && p === 'TRIG') {
      if (value === 1) { this._triggered = true; setTimeout(function() { if (this._triggered) this._triggered = false; }.bind(this), 10); }
    }
  }
};
// getAdcValue로 거리 반환 (µs 단위 pulse로 변환: cm * 58)
Ultrasonic_HCSR04.prototype.getPulseDuration = function() { return this._distCm * 58; };
Ultrasonic_HCSR04.prototype.getDistanceCm = function() { return this._distCm; };
ComponentRegistry.register('Ultrasonic_HCSR04', Ultrasonic_HCSR04);


// ─────────────────────────────────────────────────────────────────────────────
// 29. PIR_HC_SR501
// ─────────────────────────────────────────────────────────────────────────────
function PIR_HC_SR501(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'PIR_HC_SR501', config);
  this._detected = false;
  this._indicator = null;
}
PIR_HC_SR501.prototype = Object.create(ComponentBase.prototype);
PIR_HC_SR501.prototype.constructor = PIR_HC_SR501;

PIR_HC_SR501.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-pir', style:'cursor:pointer' });
  g.appendChild(SvgUtil.el('circle', { cx:28, cy:26, r:24, fill:'#37474F', stroke:'#607D8B', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('circle', { cx:28, cy:26, r:18, fill:'#FAFAFA', opacity:'0.85' }));
  g.appendChild(SvgUtil.el('circle', { cx:28, cy:26, r:12, fill:'#E0E0E0' }));
  var indicator = SvgUtil.el('circle', { cx:28, cy:26, r:6, fill:'#F44336' });
  g.appendChild(indicator);
  g.appendChild(SvgUtil.text('PIR', { x:28, y:58, 'text-anchor':'middle', 'font-size':'8', fill:'#aaa', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.text('클릭=감지', { x:28, y:67, 'text-anchor':'middle', 'font-size':'7', fill:'#666', 'font-family':'monospace' }));

  g.appendChild(SvgUtil.pinDot(4,  72, 'VCC', id, 'power'));
  g.appendChild(SvgUtil.pinDot(4,  82, 'OUT', id, 'digital'));
  g.appendChild(SvgUtil.pinDot(4,  92, 'GND', id, 'gnd'));
  g.appendChild(_pinLabel(10, 71, 'VCC')); g.appendChild(_pinLabel(10, 81, 'OUT')); g.appendChild(_pinLabel(10, 91, 'GND'));

  g.addEventListener('click', function() {
    self._detected = true;
    indicator.setAttribute('fill', '#4CAF50');
    self._firePressCallback('OUT', 1);
    setTimeout(function() {
      self._detected = false;
      indicator.setAttribute('fill', '#F44336');
      self._firePressCallback('OUT', 0);
    }, 2000);
  });
  this.element = g;
  this._indicator = indicator;
  return g;
};
PIR_HC_SR501.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC', x:4, y:72, type:'power' },
    { name:'OUT', x:4, y:82, type:'digital' },
    { name:'GND', x:4, y:92, type:'gnd' }
  ];
};
PIR_HC_SR501.prototype.getBoundingBox = function() { return { x:4, y:2, width:50, height:94 }; };
PIR_HC_SR501.prototype.getDigitalValue = function(pin) { return this._detected ? 1 : 0; };
ComponentRegistry.register('PIR_HC_SR501', PIR_HC_SR501);


// ─────────────────────────────────────────────────────────────────────────────
// 30. MQ2 (가스 센서)
// ─────────────────────────────────────────────────────────────────────────────
function MQ2(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'MQ2', config);
  this._gasLevel = config.defaultGas || 100; // ppm
  this._threshold = config.threshold || 500;
  this._label = null;
}
MQ2.prototype = Object.create(ComponentBase.prototype);
MQ2.prototype.constructor = MQ2;

MQ2.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-mq2' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:50, height:44, rx:4, fill:'#BF360C', stroke:'#E64A19', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('circle', { cx:29, cy:24, r:14, fill:'#D84315', stroke:'#FF7043', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('circle', { cx:29, cy:24, r:8,  fill:'#BF360C' }));
  for (var i=0; i<6; i++) {
    var a = i*60*Math.PI/180;
    g.appendChild(SvgUtil.el('line', { x1:29, y1:24, x2:(29+8*Math.cos(a)).toFixed(1), y2:(24+8*Math.sin(a)).toFixed(1), stroke:'#FFAB91', 'stroke-width':'1' }));
  }
  var lbl = SvgUtil.text(self._gasLevel+'ppm', { x:29, y:56, 'text-anchor':'middle', 'font-size':'8', fill:'#FF8A65', 'font-family':'monospace' });
  g.appendChild(lbl);
  g.appendChild(SvgUtil.text('MQ-2', { x:29, y:66, 'text-anchor':'middle', 'font-size':'8', fill:'#aaa', 'font-family':'monospace' }));
  var fo = SvgUtil.el('foreignObject', { x:4, y:68, width:52, height:14 });
  var inp = document.createElement('input');
  inp.type='range'; inp.min=0; inp.max=10000; inp.value=self._gasLevel;
  inp.style.cssText='width:52px;height:10px;cursor:pointer;accent-color:#FF5722;';
  inp.title='가스 농도 (ppm)';
  inp.addEventListener('input', function() { self._gasLevel=parseInt(this.value); lbl.textContent=self._gasLevel+'ppm'; });
  fo.appendChild(inp);
  g.appendChild(fo);
  ['VCC','GND','AO','DO'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 84+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':n==='AO'?'analog':'digital'));
    g.appendChild(_pinLabel(10, 83+i*12, n));
  });
  this.element = g;
  this._label = lbl;
  return g;
};
MQ2.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC', x:4, y:84,  type:'power' },
    { name:'GND', x:4, y:96,  type:'gnd' },
    { name:'AO',  x:4, y:108, type:'analog' },
    { name:'DO',  x:4, y:120, type:'digital' }
  ];
};
MQ2.prototype.getBoundingBox = function() { return { x:4, y:4, width:54, height:122 }; };
MQ2.prototype.getAdcValue = function(pin) {
  return Math.round((this._gasLevel / 10000) * 4095);
};
MQ2.prototype.getDigitalValue = function(pin) { return this._gasLevel >= this._threshold ? 1 : 0; };
ComponentRegistry.register('MQ2', MQ2);


// ─────────────────────────────────────────────────────────────────────────────
// 31. LM35 (아날로그 온도센서)
// ─────────────────────────────────────────────────────────────────────────────
function LM35(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'LM35', config);
  this._temp = config.defaultTemp || 25;
}
LM35.prototype = Object.create(ComponentBase.prototype);
LM35.prototype.constructor = LM35;

LM35.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-lm35' });
  g.appendChild(SvgUtil.el('rect', { x:8, y:4, width:30, height:30, rx:14, fill:'#546E7A', stroke:'#90A4AE', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('rect', { x:8, y:28, width:30, height:10, fill:'#546E7A' }));
  var tl = SvgUtil.text(self._temp+'°C', { x:23, y:22, 'text-anchor':'middle', 'font-size':'8', fill:'#80DEEA', 'font-family':'monospace' });
  g.appendChild(tl);
  g.appendChild(SvgUtil.text('LM35', { x:23, y:46, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));
  var fo = SvgUtil.el('foreignObject', { x:4, y:50, width:44, height:14 });
  var inp = document.createElement('input');
  inp.type='range'; inp.min=-55; inp.max=150; inp.value=self._temp;
  inp.style.cssText='width:44px;height:10px;cursor:pointer;accent-color:#80DEEA;';
  inp.addEventListener('input', function() { self._temp=parseInt(this.value); tl.textContent=self._temp+'°C'; });
  fo.appendChild(inp);
  g.appendChild(fo);
  // 3핀 (VS, VOUT, GND)
  ['VS','VOUT','GND'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(8+i*12, 38, n, id, n==='VS'?'power':n==='GND'?'gnd':'analog'));
    g.appendChild(_pinLabel(5+i*12, 48, n));
  });
  this.element = g;
  return g;
};
LM35.prototype.getConnectionPoints = function() {
  return [
    { name:'VS',   x:8,  y:38, type:'power' },
    { name:'VOUT', x:20, y:38, type:'analog' },
    { name:'GND',  x:32, y:38, type:'gnd' }
  ];
};
LM35.prototype.getBoundingBox = function() { return { x:8, y:4, width:32, height:64 }; };
// LM35: 10mV/°C, 0°C=0V, 100°C=1V → ADC: temp * 10mV / 3300mV * 4095
LM35.prototype.getAdcValue = function(pin) {
  return Math.round((this._temp * 0.01 / 3.3) * 4095);
};
ComponentRegistry.register('LM35', LM35);


// ─────────────────────────────────────────────────────────────────────────────
// 32. MPU6050 (가속도/자이로)
// ─────────────────────────────────────────────────────────────────────────────
function MPU6050(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'MPU6050', config);
  this._ax = 0; this._ay = 0; this._az = 1.0; // g 단위
  this._gx = 0; this._gy = 0; this._gz = 0;   // °/s
  this._temp = 25;
}
MPU6050.prototype = Object.create(ComponentBase.prototype);
MPU6050.prototype.constructor = MPU6050;

MPU6050.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-mpu6050' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:2, width:72, height:56, rx:4, fill:'#1A237E', stroke:'#3949AB', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('rect', { x:8, y:8, width:60, height:44, rx:2, fill:'#283593' }));
  g.appendChild(SvgUtil.text('MPU-6050', { x:38, y:22, 'text-anchor':'middle', 'font-size':'9', fill:'#9FA8DA', 'font-family':'monospace', 'font-weight':'bold' }));
  var axLbl = SvgUtil.text('Ax:0.0', { x:38, y:33, 'text-anchor':'middle', 'font-size':'7', fill:'#FF8A65', 'font-family':'monospace' });
  var gyLbl = SvgUtil.text('Gx:0.0', { x:38, y:43, 'text-anchor':'middle', 'font-size':'7', fill:'#80DEEA', 'font-family':'monospace' });
  g.appendChild(axLbl); g.appendChild(gyLbl);

  // 슬라이더들 (Ax, Ay, Az, Gx)
  var sliders = [
    { label:'Ax', min:-2, max:2, step:0.1, ref:'_ax', color:'#FF8A65' },
    { label:'Ay', min:-2, max:2, step:0.1, ref:'_ay', color:'#FFD180' },
    { label:'Az', min:-2, max:2, step:0.1, ref:'_az', color:'#A5D6A7', def:1 },
    { label:'Gx', min:-500, max:500, step:1, ref:'_gx', color:'#80DEEA' }
  ];
  sliders.forEach(function(s, i) {
    var fo = SvgUtil.el('foreignObject', { x:2, y:62+i*16, width:72, height:14 });
    var inp = document.createElement('input');
    inp.type='range'; inp.min=s.min; inp.max=s.max; inp.step=s.step; inp.value=s.def || 0;
    inp.style.cssText='width:72px;height:10px;cursor:pointer;accent-color:'+s.color+';';
    inp.title=s.label;
    inp.addEventListener('input', function() {
      self[s.ref] = parseFloat(this.value);
      axLbl.textContent = 'Ax:'+self._ax.toFixed(1)+' Ay:'+self._ay.toFixed(1);
      gyLbl.textContent = 'Gx:'+self._gx.toFixed(0)+' Gy:'+self._gy.toFixed(0);
    });
    fo.appendChild(inp);
    g.appendChild(fo);
  });

  ['VCC','GND','SDA','SCL','INT'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(74, 10+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':n==='INT'?'digital':'i2c'));
    g.appendChild(_pinLabel(64, 9+i*12, n));
  });
  this.element = g;
  return g;
};
MPU6050.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC', x:74, y:10, type:'power' },
    { name:'GND', x:74, y:22, type:'gnd' },
    { name:'SDA', x:74, y:34, type:'i2c' },
    { name:'SCL', x:74, y:46, type:'i2c' },
    { name:'INT', x:74, y:58, type:'digital' }
  ];
};
MPU6050.prototype.getBoundingBox = function() { return { x:2, y:2, width:76, height:130 }; };
MPU6050.prototype.getAccel = function() { return { x:this._ax, y:this._ay, z:this._az }; };
MPU6050.prototype.getGyro = function() { return { x:this._gx, y:this._gy, z:this._gz }; };
MPU6050.prototype.getTemperature = function() { return this._temp; };
ComponentRegistry.register('MPU6050', MPU6050);


// ─────────────────────────────────────────────────────────────────────────────
// 33. BMP280 (기압/온도)
// ─────────────────────────────────────────────────────────────────────────────
function BMP280(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'BMP280', config);
  this._temp = config.defaultTemp || 25.0;
  this._pressure = config.defaultPressure || 1013.25; // hPa
  this._altitude = 0;
  this._address = config.address || 0x76;
}
BMP280.prototype = Object.create(ComponentBase.prototype);
BMP280.prototype.constructor = BMP280;

BMP280.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-bmp280' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:60, height:46, rx:4, fill:'#1B5E20', stroke:'#388E3C', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('rect', { x:18, y:12, width:28, height:20, rx:3, fill:'#2E7D32', stroke:'#66BB6A', 'stroke-width':'1' }));
  g.appendChild(SvgUtil.text('BMP280', { x:32, y:26, 'text-anchor':'middle', 'font-size':'8', fill:'#A5D6A7', 'font-family':'monospace' }));
  var tl = SvgUtil.text(self._temp.toFixed(1)+'°', { x:18, y:40, 'font-size':'7', fill:'#EF9A9A', 'font-family':'monospace' });
  var pl = SvgUtil.text(self._pressure.toFixed(0)+'hPa', { x:34, y:40, 'font-size':'7', fill:'#B3E5FC', 'font-family':'monospace' });
  g.appendChild(tl); g.appendChild(pl);
  g.appendChild(SvgUtil.text('I2C 0x'+self._address.toString(16), { x:32, y:56, 'text-anchor':'middle', 'font-size':'7', fill:'#81C784', 'font-family':'monospace' }));

  var foT = SvgUtil.el('foreignObject', { x:4, y:58, width:62, height:14 });
  var inT = document.createElement('input');
  inT.type='range'; inT.min=-40; inT.max=85; inT.step='0.5'; inT.value=self._temp;
  inT.style.cssText='width:62px;height:10px;cursor:pointer;accent-color:#EF9A9A;';
  inT.addEventListener('input', function() { self._temp=parseFloat(this.value); tl.textContent=self._temp.toFixed(1)+'°'; });
  foT.appendChild(inT);

  var foP = SvgUtil.el('foreignObject', { x:4, y:72, width:62, height:14 });
  var inP = document.createElement('input');
  inP.type='range'; inP.min=800; inP.max=1200; inP.step='0.5'; inP.value=self._pressure;
  inP.style.cssText='width:62px;height:10px;cursor:pointer;accent-color:#B3E5FC;';
  inP.addEventListener('input', function() { self._pressure=parseFloat(this.value); pl.textContent=self._pressure.toFixed(0)+'hPa'; self._altitude = 44330*(1-Math.pow(self._pressure/1013.25,0.1903)); });
  foP.appendChild(inP);

  g.appendChild(foT); g.appendChild(foP);
  ['VCC','GND','SDA','SCL'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 90+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':'i2c'));
    g.appendChild(_pinLabel(10, 89+i*12, n));
  });
  this.element = g;
  return g;
};
BMP280.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC', x:4, y:90,  type:'power' },
    { name:'GND', x:4, y:102, type:'gnd' },
    { name:'SDA', x:4, y:114, type:'i2c' },
    { name:'SCL', x:4, y:126, type:'i2c' }
  ];
};
BMP280.prototype.getBoundingBox = function() { return { x:4, y:4, width:64, height:128 }; };
BMP280.prototype.readTemperature = function() { return this._temp; };
BMP280.prototype.readPressure = function() { return this._pressure * 100; }; // Pa
BMP280.prototype.readAltitude = function(seaLevel) {
  var sl = seaLevel || 1013.25;
  return 44330 * (1 - Math.pow(this._pressure/sl, 0.1903));
};
ComponentRegistry.register('BMP280', BMP280);


// ─────────────────────────────────────────────────────────────────────────────
// 34. Soil_Moisture (토양습도 센서)
// ─────────────────────────────────────────────────────────────────────────────
function Soil_Moisture(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Soil_Moisture', config);
  this._moisture = config.defaultMoisture || 50; // 0~100%
  this._threshold = 40;
}
Soil_Moisture.prototype = Object.create(ComponentBase.prototype);
Soil_Moisture.prototype.constructor = Soil_Moisture;

Soil_Moisture.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-soil' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:50, height:42, rx:4, fill:'#4E342E', stroke:'#8D6E63', 'stroke-width':'1.5' }));
  // 포크 모양 프로브
  g.appendChild(SvgUtil.el('rect', { x:14, y:38, width:8, height:20, rx:1, fill:'#BCAAA4' }));
  g.appendChild(SvgUtil.el('rect', { x:36, y:38, width:8, height:20, rx:1, fill:'#BCAAA4' }));
  var mlbl = SvgUtil.text(self._moisture+'%', { x:29, y:26, 'text-anchor':'middle', 'font-size':'10', fill:'#80DEEA', 'font-family':'monospace' });
  g.appendChild(mlbl);
  g.appendChild(SvgUtil.text('SOIL', { x:29, y:38, 'text-anchor':'middle', 'font-size':'7', fill:'#BCAAA4', 'font-family':'monospace' }));
  var fo = SvgUtil.el('foreignObject', { x:4, y:62, width:52, height:14 });
  var inp = document.createElement('input');
  inp.type='range'; inp.min=0; inp.max=100; inp.value=self._moisture;
  inp.style.cssText='width:52px;height:10px;cursor:pointer;accent-color:#4E342E;';
  inp.title='토양습도 (%)';
  inp.addEventListener('input', function() { self._moisture=parseInt(this.value); mlbl.textContent=self._moisture+'%'; });
  fo.appendChild(inp);
  g.appendChild(fo);
  ['VCC','GND','AO','DO'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 78+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':n==='AO'?'analog':'digital'));
    g.appendChild(_pinLabel(10, 77+i*12, n));
  });
  this.element = g;
  return g;
};
Soil_Moisture.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC', x:4, y:78,  type:'power' },
    { name:'GND', x:4, y:90,  type:'gnd' },
    { name:'AO',  x:4, y:102, type:'analog' },
    { name:'DO',  x:4, y:114, type:'digital' }
  ];
};
Soil_Moisture.prototype.getBoundingBox = function() { return { x:4, y:4, width:54, height:116 }; };
// 습도 높으면 저항 낮음 → ADC 낮음 (역비례)
Soil_Moisture.prototype.getAdcValue = function(pin) { return Math.round((1 - this._moisture/100) * 4095); };
Soil_Moisture.prototype.getDigitalValue = function(pin) { return this._moisture < this._threshold ? 1 : 0; };
ComponentRegistry.register('Soil_Moisture', Soil_Moisture);


// ─────────────────────────────────────────────────────────────────────────────
// 35. Rain_Sensor (빗물 감지)
// ─────────────────────────────────────────────────────────────────────────────
function Rain_Sensor(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Rain_Sensor', config);
  this._rain = config.defaultRain || 0; // 0~100%
  this._threshold = 30;
}
Rain_Sensor.prototype = Object.create(ComponentBase.prototype);
Rain_Sensor.prototype.constructor = Rain_Sensor;

Rain_Sensor.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-rain' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:52, height:36, rx:4, fill:'#0D47A1', stroke:'#1976D2', 'stroke-width':'1.5' }));
  // 빗물 패턴
  for (var i=0; i<5; i++) {
    var xi = 10+i*9;
    g.appendChild(SvgUtil.el('line', { x1:xi, y1:8, x2:xi-3, y2:36, stroke:'rgba(100,181,246,0.4)', 'stroke-width':'2' }));
  }
  var rl = SvgUtil.text(self._rain+'%', { x:30, y:28, 'text-anchor':'middle', 'font-size':'10', fill:'#90CAF9', 'font-family':'monospace' });
  g.appendChild(rl);
  g.appendChild(SvgUtil.text('RAIN', { x:30, y:46, 'text-anchor':'middle', 'font-size':'8', fill:'#aaa', 'font-family':'monospace' }));
  var fo = SvgUtil.el('foreignObject', { x:4, y:50, width:52, height:14 });
  var inp = document.createElement('input');
  inp.type='range'; inp.min=0; inp.max=100; inp.value=self._rain;
  inp.style.cssText='width:52px;height:10px;cursor:pointer;accent-color:#1976D2;';
  inp.title='빗물 (%)';
  inp.addEventListener('input', function() { self._rain=parseInt(this.value); rl.textContent=self._rain+'%'; });
  fo.appendChild(inp);
  g.appendChild(fo);
  ['VCC','GND','AO','DO'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 66+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':n==='AO'?'analog':'digital'));
    g.appendChild(_pinLabel(10, 65+i*12, n));
  });
  this.element = g;
  return g;
};
Rain_Sensor.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC', x:4, y:66, type:'power' },
    { name:'GND', x:4, y:78, type:'gnd' },
    { name:'AO',  x:4, y:90, type:'analog' },
    { name:'DO',  x:4, y:102, type:'digital' }
  ];
};
Rain_Sensor.prototype.getBoundingBox = function() { return { x:4, y:4, width:54, height:104 }; };
Rain_Sensor.prototype.getAdcValue = function(pin) { return Math.round((this._rain/100) * 4095); };
Rain_Sensor.prototype.getDigitalValue = function(pin) { return this._rain >= this._threshold ? 0 : 1; };
ComponentRegistry.register('Rain_Sensor', Rain_Sensor);


// ─────────────────────────────────────────────────────────────────────────────
// 36. Sound_Sensor (소리 감지)
// ─────────────────────────────────────────────────────────────────────────────
function Sound_Sensor(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Sound_Sensor', config);
  this._level = config.defaultLevel || 0;
  this._threshold = 500;
}
Sound_Sensor.prototype = Object.create(ComponentBase.prototype);
Sound_Sensor.prototype.constructor = Sound_Sensor;

Sound_Sensor.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-sound' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:52, height:38, rx:4, fill:'#212121', stroke:'#424242', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('circle', { cx:30, cy:18, r:10, fill:'#37474F', stroke:'#90A4AE', 'stroke-width':'2' }));
  // 음파 호
  for (var i=1; i<=2; i++) {
    g.appendChild(SvgUtil.el('path', { d:'M '+(30-12-i*4)+','+(18-i*6)+' A '+(12+i*4)+','+(12+i*4)+' 0 0 1 '+(30+12+i*4)+','+(18-i*6), fill:'none', stroke:'rgba(144,164,174,0.4)', 'stroke-width':'1.5' }));
  }
  var ll = SvgUtil.text(self._level, { x:30, y:34, 'text-anchor':'middle', 'font-size':'7', fill:'#90A4AE', 'font-family':'monospace' });
  g.appendChild(ll);
  g.appendChild(SvgUtil.text('SOUND', { x:30, y:48, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));
  var fo = SvgUtil.el('foreignObject', { x:4, y:52, width:52, height:14 });
  var inp = document.createElement('input');
  inp.type='range'; inp.min=0; inp.max=4095; inp.value=self._level;
  inp.style.cssText='width:52px;height:10px;cursor:pointer;accent-color:#607D8B;';
  inp.title='소리 크기';
  inp.addEventListener('input', function() { self._level=parseInt(this.value); ll.textContent=self._level; });
  fo.appendChild(inp);
  g.appendChild(fo);
  ['VCC','GND','AO','DO'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 68+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':n==='AO'?'analog':'digital'));
    g.appendChild(_pinLabel(10, 67+i*12, n));
  });
  this.element = g;
  return g;
};
Sound_Sensor.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC', x:4, y:68, type:'power' },
    { name:'GND', x:4, y:80, type:'gnd' },
    { name:'AO',  x:4, y:92, type:'analog' },
    { name:'DO',  x:4, y:104, type:'digital' }
  ];
};
Sound_Sensor.prototype.getBoundingBox = function() { return { x:4, y:4, width:54, height:106 }; };
Sound_Sensor.prototype.getAdcValue = function(pin) { return this._level; };
Sound_Sensor.prototype.getDigitalValue = function(pin) { return this._level >= this._threshold ? 1 : 0; };
ComponentRegistry.register('Sound_Sensor', Sound_Sensor);


// ─────────────────────────────────────────────────────────────────────────────
// 37. Bluetooth_HC05
// ─────────────────────────────────────────────────────────────────────────────
function Bluetooth_HC05(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Bluetooth_HC05', config);
  this._paired = false;
  this._rxBuffer = '';
  this._txBuffer = '';
}
Bluetooth_HC05.prototype = Object.create(ComponentBase.prototype);
Bluetooth_HC05.prototype.constructor = Bluetooth_HC05;

Bluetooth_HC05.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-hc05' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:60, height:44, rx:4, fill:'#0D47A1', stroke:'#1565C0', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('rect', { x:10, y:10, width:48, height:32, rx:2, fill:'#1A237E' }));
  // 블루투스 심볼
  g.appendChild(SvgUtil.text('Ƀ', { x:34, y:32, 'text-anchor':'middle', 'font-size':'20', fill:'#90CAF9', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.text('HC-05', { x:34, y:56, 'text-anchor':'middle', 'font-size':'8', fill:'#64B5F6', 'font-family':'monospace' }));

  // 시리얼 입력 (TX 시뮬레이션)
  var fo = SvgUtil.el('foreignObject', { x:4, y:60, width:62, height:20 });
  var inp = document.createElement('input');
  inp.type='text'; inp.placeholder='TX 메시지...';
  inp.style.cssText='width:62px;height:16px;font-size:9px;background:#0D47A1;color:#90CAF9;border:1px solid #1976D2;padding:1px 2px;';
  inp.addEventListener('keydown', function(e) {
    if (e.key==='Enter') {
      self._txBuffer = inp.value;
      self._firePressCallback('TX', inp.value);
      inp.value = '';
    }
  });
  fo.appendChild(inp);
  g.appendChild(fo);

  ['VCC','GND','TX','RX','EN','STATE'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 84+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':'signal'));
    g.appendChild(_pinLabel(10, 83+i*12, n));
  });
  this.element = g;
  return g;
};
Bluetooth_HC05.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC',   x:4, y:84,  type:'power' },
    { name:'GND',   x:4, y:96,  type:'gnd' },
    { name:'TX',    x:4, y:108, type:'signal' },
    { name:'RX',    x:4, y:120, type:'signal' },
    { name:'EN',    x:4, y:132, type:'digital' },
    { name:'STATE', x:4, y:144, type:'digital' }
  ];
};
Bluetooth_HC05.prototype.getBoundingBox = function() { return { x:4, y:4, width:64, height:146 }; };
Bluetooth_HC05.prototype.sendData = function(str) { this._txBuffer = str; this._firePressCallback('TX', str); };
Bluetooth_HC05.prototype.readData = function() { var d = this._rxBuffer; this._rxBuffer = ''; return d; };
ComponentRegistry.register('Bluetooth_HC05', Bluetooth_HC05);


// ─────────────────────────────────────────────────────────────────────────────
// 38. WiFi_ESP8266
// ─────────────────────────────────────────────────────────────────────────────
function WiFi_ESP8266(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'WiFi_ESP8266', config);
  this._connected = false;
  this._response = 'OK';
  this._rxBuffer = '';
}
WiFi_ESP8266.prototype = Object.create(ComponentBase.prototype);
WiFi_ESP8266.prototype.constructor = WiFi_ESP8266;

WiFi_ESP8266.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-esp8266' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:64, height:46, rx:4, fill:'#004D40', stroke:'#00796B', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('rect', { x:10, y:10, width:52, height:34, rx:2, fill:'#00695C' }));
  // Wi-Fi 심볼
  for (var i=1; i<=3; i++) {
    g.appendChild(SvgUtil.el('path', { d:'M '+(36-i*7)+','+(30-i*3)+' A '+(i*7)+','+(i*7)+' 0 0 1 '+(36+i*7)+','+(30-i*3), fill:'none', stroke:'rgba(128,203,196,0.7)', 'stroke-width':'1.5' }));
  }
  g.appendChild(SvgUtil.el('circle', { cx:36, cy:30, r:2.5, fill:'#80CBC4' }));
  g.appendChild(SvgUtil.text('ESP8266', { x:36, y:58, 'text-anchor':'middle', 'font-size':'8', fill:'#80CBC4', 'font-family':'monospace' }));

  var fo = SvgUtil.el('foreignObject', { x:4, y:62, width:66, height:20 });
  var inp = document.createElement('input');
  inp.type='text'; inp.placeholder='AT 명령...';
  inp.style.cssText='width:66px;height:16px;font-size:9px;background:#004D40;color:#80CBC4;border:1px solid #00796B;padding:1px 2px;';
  inp.addEventListener('keydown', function(e) {
    if (e.key==='Enter') {
      var cmd = inp.value.trim().toUpperCase();
      if (cmd === 'AT') self._response = 'OK';
      else if (cmd === 'AT+RST') self._response = 'ready';
      else if (cmd.startsWith('AT+CWJAP')) { self._connected = true; self._response = 'WIFI CONNECTED\nOK'; }
      else self._response = 'ERROR';
      self._firePressCallback('RX', self._response);
      inp.value = '';
    }
  });
  fo.appendChild(inp);
  g.appendChild(fo);

  ['VCC','GND','TX','RX','RST','CH_PD'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, 86+i*12, n, id, n==='VCC'?'power':n==='GND'?'gnd':'signal'));
    g.appendChild(_pinLabel(10, 85+i*12, n));
  });
  this.element = g;
  return g;
};
WiFi_ESP8266.prototype.getConnectionPoints = function() {
  return [
    { name:'VCC',   x:4, y:86,  type:'power' },
    { name:'GND',   x:4, y:98,  type:'gnd' },
    { name:'TX',    x:4, y:110, type:'signal' },
    { name:'RX',    x:4, y:122, type:'signal' },
    { name:'RST',   x:4, y:134, type:'digital' },
    { name:'CH_PD', x:4, y:146, type:'digital' }
  ];
};
WiFi_ESP8266.prototype.getBoundingBox = function() { return { x:4, y:4, width:68, height:148 }; };
ComponentRegistry.register('WiFi_ESP8266', WiFi_ESP8266);


// ─────────────────────────────────────────────────────────────────────────────
// 39. RFID_RC522
// ─────────────────────────────────────────────────────────────────────────────
function RFID_RC522(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'RFID_RC522', config);
  this._cards = config.cards || ['AA BB CC DD', '11 22 33 44', 'DE AD BE EF'];
  this._lastUID = '';
  this._cardPresent = false;
}
RFID_RC522.prototype = Object.create(ComponentBase.prototype);
RFID_RC522.prototype.constructor = RFID_RC522;

RFID_RC522.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-rfid' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:62, height:52, rx:4, fill:'#1A237E', stroke:'#3949AB', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:35, cy:30, rx:24, ry:18, fill:'none', stroke:'rgba(63,81,181,0.6)', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('ellipse', { cx:35, cy:30, rx:14, ry:10, fill:'none', stroke:'rgba(63,81,181,0.8)', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.text('RC522', { x:35, y:34, 'text-anchor':'middle', 'font-size':'9', fill:'#9FA8DA', 'font-family':'monospace', 'font-weight':'bold' }));
  g.appendChild(SvgUtil.text('RFID', { x:35, y:62, 'text-anchor':'middle', 'font-size':'8', fill:'#7986CB', 'font-family':'monospace' }));

  // 카드 버튼들
  self._cards.forEach(function(uid, i) {
    var by = 68 + i*14;
    var btn = SvgUtil.el('rect', { x:4, y:by, width:64, height:12, rx:2, fill:'#283593', stroke:'#3F51B5', 'stroke-width':'0.5', style:'cursor:pointer' });
    g.appendChild(btn);
    g.appendChild(SvgUtil.text(uid, { x:36, y:by+9, 'text-anchor':'middle', 'font-size':'7', fill:'#C5CAE9', 'font-family':'monospace', 'pointer-events':'none' }));
    btn.addEventListener('click', function() {
      self._lastUID = uid;
      self._cardPresent = true;
      self._firePressCallback('SDA', uid);
      btn.setAttribute('fill','#5C6BC0');
      setTimeout(function() { self._cardPresent = false; btn.setAttribute('fill','#283593'); }, 500);
    });
  });

  var pinY = 68 + self._cards.length*14 + 4;
  ['SDA','SCK','MOSI','MISO','GND','RST','3.3V'].forEach(function(n, i) {
    g.appendChild(SvgUtil.pinDot(4, pinY+i*12, n, id, n==='3.3V'?'power':n==='GND'?'gnd':'spi'));
    g.appendChild(_pinLabel(10, pinY-1+i*12, n));
  });
  this.element = g;
  return g;
};
RFID_RC522.prototype.getConnectionPoints = function() {
  var base = 68 + this._cards.length*14 + 4;
  return ['SDA','SCK','MOSI','MISO','GND','RST','3.3V'].map(function(n, i) {
    return { name:n, x:4, y:base+i*12, type: n==='3.3V'?'power':n==='GND'?'gnd':'spi' };
  });
};
RFID_RC522.prototype.getBoundingBox = function() {
  var h = 68 + this._cards.length*14 + 4 + 7*12;
  return { x:4, y:4, width:66, height:h };
};
RFID_RC522.prototype.isCardPresent = function() { return this._cardPresent; };
RFID_RC522.prototype.getUID = function() { return this._lastUID; };
ComponentRegistry.register('RFID_RC522', RFID_RC522);


// ─────────────────────────────────────────────────────────────────────────────
// 40. NRF24L01
// ─────────────────────────────────────────────────────────────────────────────
function NRF24L01(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'NRF24L01', config);
  this._channel = config.channel || 76;
  this._rxBuffer = [];
  this._txBuffer = [];
}
NRF24L01.prototype = Object.create(ComponentBase.prototype);
NRF24L01.prototype.constructor = NRF24L01;

NRF24L01.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-nrf24' });
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:58, height:46, rx:4, fill:'#004D40', stroke:'#00796B', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:20, height:46, rx:0, fill:'#00695C' }));  // 안테나 베이스
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:6, height:54, rx:2, fill:'#26A69A' }));   // 안테나
  g.appendChild(SvgUtil.text('nRF', { x:38, y:24, 'text-anchor':'middle', 'font-size':'9', fill:'#80CBC4', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.text('24L01', { x:38, y:36, 'text-anchor':'middle', 'font-size':'8', fill:'#80CBC4', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.text('2.4GHz', { x:38, y:46, 'text-anchor':'middle', 'font-size':'7', fill:'#4DB6AC', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.text('CH:'+this._channel, { x:38, y:60, 'text-anchor':'middle', 'font-size':'7', fill:'#4DB6AC', 'font-family':'monospace' }));

  ['GND','VCC','CE','CSN','SCK','MOSI','MISO','IRQ'].forEach(function(n, i) {
    var px = i < 4 ? 4 : 62;
    var py = 68 + (i%4)*14;
    g.appendChild(SvgUtil.pinDot(px, py, n, id, n==='VCC'?'power':n==='GND'?'gnd':n==='IRQ'?'digital':'spi'));
    g.appendChild(_pinLabel(px+(px<10?6:-18), py+1, n));
  });
  this.element = g;
  return g;
};
NRF24L01.prototype.getConnectionPoints = function() {
  return ['GND','VCC','CE','CSN','SCK','MOSI','MISO','IRQ'].map(function(n, i) {
    return { name:n, x:i<4?4:62, y:68+(i%4)*14, type: n==='VCC'?'power':n==='GND'?'gnd':n==='IRQ'?'digital':'spi' };
  });
};
NRF24L01.prototype.getBoundingBox = function() { return { x:4, y:4, width:62, height:128 }; };
NRF24L01.prototype.send = function(data) { this._txBuffer.push(data); this._firePressCallback('MOSI', data); };
NRF24L01.prototype.receive = function() { return this._rxBuffer.shift() || null; };
ComponentRegistry.register('NRF24L01', NRF24L01);


// ─────────────────────────────────────────────────────────────────────────────
// 41. PowerRail (3.3V/5V 전원레일)
// ─────────────────────────────────────────────────────────────────────────────
function PowerRail(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'PowerRail', config);
  this.voltage = config.voltage || '3.3V';
}
PowerRail.prototype = Object.create(ComponentBase.prototype);
PowerRail.prototype.constructor = PowerRail;

PowerRail.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-power-rail' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:4, width:60, height:22, rx:3, fill:'#B71C1C', stroke:'#F44336', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('line', { x1:6, y1:15, x2:58, y2:15, stroke:'#FF8A80', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.text(this.voltage, { x:31, y:20, 'text-anchor':'middle', 'font-size':'9', fill:'#fff', 'font-family':'monospace', 'font-weight':'bold' }));
  for (var i=0; i<5; i++) {
    var px = 8 + i*12;
    g.appendChild(SvgUtil.pinDot(px, 4, 'P'+(i+1), id, 'power'));
  }
  this.element = g;
  return g;
};
PowerRail.prototype.getConnectionPoints = function() {
  var pts = [];
  for (var i=0; i<5; i++) pts.push({ name:'P'+(i+1), x:8+i*12, y:4, type:'power' });
  return pts;
};
PowerRail.prototype.getBoundingBox = function() { return { x:2, y:4, width:60, height:22 }; };
ComponentRegistry.register('PowerRail', PowerRail);


// ─────────────────────────────────────────────────────────────────────────────
// 42. GndRail
// ─────────────────────────────────────────────────────────────────────────────
function GndRail(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'GndRail', config);
}
GndRail.prototype = Object.create(ComponentBase.prototype);
GndRail.prototype.constructor = GndRail;

GndRail.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-gnd-rail' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:4, width:60, height:22, rx:3, fill:'#212121', stroke:'#424242', 'stroke-width':'1.5' }));
  g.appendChild(SvgUtil.el('line', { x1:6, y1:15, x2:58, y2:15, stroke:'#616161', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.text('GND', { x:31, y:20, 'text-anchor':'middle', 'font-size':'9', fill:'#aaa', 'font-family':'monospace', 'font-weight':'bold' }));
  for (var i=0; i<5; i++) {
    g.appendChild(SvgUtil.pinDot(8+i*12, 4, 'G'+(i+1), id, 'gnd'));
  }
  this.element = g;
  return g;
};
GndRail.prototype.getConnectionPoints = function() {
  var pts = [];
  for (var i=0; i<5; i++) pts.push({ name:'G'+(i+1), x:8+i*12, y:4, type:'gnd' });
  return pts;
};
GndRail.prototype.getBoundingBox = function() { return { x:2, y:4, width:60, height:22 }; };
ComponentRegistry.register('GndRail', GndRail);


// ─────────────────────────────────────────────────────────────────────────────
// 43. BreadboardSection (미니 브레드보드)
// ─────────────────────────────────────────────────────────────────────────────
function BreadboardSection(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'BreadboardSection', config);
  this.cols = config.cols || 5;
  this.rows = config.rows || 4;
}
BreadboardSection.prototype = Object.create(ComponentBase.prototype);
BreadboardSection.prototype.constructor = BreadboardSection;

BreadboardSection.prototype.createSvg = function() {
  var id = this.id;
  var cols = this.cols, rows = this.rows;
  var w = cols*16 + 8, h = rows*16 + 8;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-breadboard' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:2, width:w, height:h, rx:4, fill:'#F5F5F5', stroke:'#BDBDBD', 'stroke-width':'1.5' }));
  for (var r=0; r<rows; r++) {
    for (var c=0; c<cols; c++) {
      var hx = 10 + c*16, hy = 10 + r*16;
      g.appendChild(SvgUtil.el('rect', { x:hx-3, y:hy-3, width:6, height:6, rx:1, fill:'#9E9E9E' }));
      var pname = 'R'+(r+1)+'C'+(c+1);
      g.appendChild(SvgUtil.pinDot(hx, hy, pname, id, 'signal'));
    }
  }
  g.appendChild(SvgUtil.text('BB', { x:w/2+2, y:h+12, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));
  this.element = g;
  return g;
};
BreadboardSection.prototype.getConnectionPoints = function() {
  var pts = [];
  for (var r=0; r<this.rows; r++) {
    for (var c=0; c<this.cols; c++) {
      pts.push({ name:'R'+(r+1)+'C'+(c+1), x:10+c*16, y:10+r*16, type:'signal' });
    }
  }
  return pts;
};
BreadboardSection.prototype.getBoundingBox = function() {
  return { x:2, y:2, width:this.cols*16+8, height:this.rows*16+8 };
};
ComponentRegistry.register('BreadboardSection', BreadboardSection);


// ─────────────────────────────────────────────────────────────────────────────
// 44. LED_Bar (10개 LED 바)
// ─────────────────────────────────────────────────────────────────────────────
function LED_Bar(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'LED_Bar', config);
  this._states = new Array(10).fill(0);
  this._leds = [];
}
LED_Bar.prototype = Object.create(ComponentBase.prototype);
LED_Bar.prototype.constructor = LED_Bar;

LED_Bar.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-led-bar' });
  g.appendChild(SvgUtil.el('rect', { x:2, y:2, width:108, height:28, rx:4, fill:'#212121', stroke:'#424242', 'stroke-width':'1.5' }));
  var ledEls = [];
  var colors = ['#F44336','#FF7043','#FF9800','#FFC107','#FFEB3B','#CDDC39','#8BC34A','#4CAF50','#26C6DA','#29B6F6'];
  for (var i=0; i<10; i++) {
    var lx = 8 + i*10;
    var led = SvgUtil.el('ellipse', { cx:lx, cy:15, rx:4, ry:10, fill:colors[i], opacity:'0.2' });
    g.appendChild(led);
    ledEls.push(led);
    g.appendChild(SvgUtil.pinDot(lx, 2,  'LED'+i, id, 'digital'));
    g.appendChild(SvgUtil.pinDot(lx, 28, 'GND'+i, id, 'gnd'));
  }
  this.element = g;
  this._leds = ledEls;
  return g;
};
LED_Bar.prototype.getConnectionPoints = function() {
  var pts = [];
  for (var i=0; i<10; i++) {
    pts.push({ name:'LED'+i, x:8+i*10, y:2,  type:'digital' });
    pts.push({ name:'GND'+i, x:8+i*10, y:28, type:'gnd' });
  }
  return pts;
};
LED_Bar.prototype.getBoundingBox = function() { return { x:2, y:2, width:108, height:28 }; };
LED_Bar.prototype.onGpioChange = function(pin, value) {
  var bpMap = this.connections;
  for (var p in bpMap) {
    if (bpMap[p] === pin && p.startsWith('LED')) {
      var idx = parseInt(p.replace('LED',''));
      if (idx >= 0 && idx < 10) {
        this._states[idx] = value;
        if (this._leds[idx]) this._leds[idx].setAttribute('opacity', value ? '1' : '0.2');
      }
    }
  }
};
LED_Bar.prototype.onPwmChange = function(pin, duty, freq) {
  var bpMap = this.connections;
  for (var p in bpMap) {
    if (bpMap[p] === pin && p.startsWith('LED')) {
      var idx = parseInt(p.replace('LED',''));
      if (idx >= 0 && idx < 10) {
        if (this._leds[idx]) this._leds[idx].setAttribute('opacity', (0.1 + duty/255*0.9).toFixed(2));
      }
    }
  }
};
ComponentRegistry.register('LED_Bar', LED_Bar);


// ─────────────────────────────────────────────────────────────────────────────
// 45. RGB_WS2812B (단일 WS2812B)
// ─────────────────────────────────────────────────────────────────────────────
function RGB_WS2812B(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'RGB_WS2812B', config);
  this._r = 0; this._g = 0; this._b = 0;
  this._circle = null;
}
RGB_WS2812B.prototype = Object.create(ComponentBase.prototype);
RGB_WS2812B.prototype.constructor = RGB_WS2812B;

RGB_WS2812B.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-ws2812b' });
  g.appendChild(SvgUtil.glow(id+'_glow', '#fff', 6));
  g.appendChild(SvgUtil.el('rect', { x:4, y:4, width:30, height:30, rx:3, fill:'#111', stroke:'#333', 'stroke-width':'1.5' }));
  var circle = SvgUtil.el('circle', { cx:19, cy:19, r:12, fill:'#111', filter:'url(#'+id+'_glow)', opacity:'0.9' });
  g.appendChild(circle);
  g.appendChild(SvgUtil.el('circle', { cx:14, cy:14, r:3, fill:'rgba(255,255,255,0.15)' }));
  g.appendChild(SvgUtil.text('NP', { x:19, y:42, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));

  // 색상 조절
  var fo = SvgUtil.el('foreignObject', { x:4, y:44, width:32, height:44 });
  var div = document.createElement('div');
  div.style.cssText='display:flex;flex-direction:column;gap:2px;';
  ['R','G','B'].forEach(function(ch) {
    var inp = document.createElement('input');
    inp.type='range'; inp.min=0; inp.max=255; inp.value=0;
    inp.style.cssText='width:32px;height:8px;cursor:pointer;accent-color:'+(ch==='R'?'#F44336':ch==='G'?'#4CAF50':'#2196F3')+';';
    inp.addEventListener('input', function() {
      if (ch==='R') self._r=parseInt(this.value);
      else if (ch==='G') self._g=parseInt(this.value);
      else self._b=parseInt(this.value);
      self._updateColor();
    });
    div.appendChild(inp);
  });
  fo.appendChild(div);
  g.appendChild(fo);

  g.appendChild(SvgUtil.pinDot(4,  94, 'DIN',  id, 'digital'));
  g.appendChild(SvgUtil.pinDot(4, 104, 'VCC',  id, 'power'));
  g.appendChild(SvgUtil.pinDot(4, 114, 'GND',  id, 'gnd'));
  g.appendChild(SvgUtil.pinDot(4, 124, 'DOUT', id, 'digital'));
  this.element = g;
  this._circle = circle;
  return g;
};
RGB_WS2812B.prototype._updateColor = function() {
  var hex = '#' + ('0'+this._r.toString(16)).slice(-2) + ('0'+this._g.toString(16)).slice(-2) + ('0'+this._b.toString(16)).slice(-2);
  if (this._circle) this._circle.setAttribute('fill', hex);
};
RGB_WS2812B.prototype.getConnectionPoints = function() {
  return [
    { name:'DIN',  x:4, y:94,  type:'digital' },
    { name:'VCC',  x:4, y:104, type:'power' },
    { name:'GND',  x:4, y:114, type:'gnd' },
    { name:'DOUT', x:4, y:124, type:'digital' }
  ];
};
RGB_WS2812B.prototype.getBoundingBox = function() { return { x:4, y:4, width:34, height:126 }; };
RGB_WS2812B.prototype.setColor = function(r, g, b) { this._r=r; this._g=g; this._b=b; this._updateColor(); };
ComponentRegistry.register('RGB_WS2812B', RGB_WS2812B);


// ─────────────────────────────────────────────────────────────────────────────
// 46. RGB_WS2812B_Strip (8개 스트립)
// ─────────────────────────────────────────────────────────────────────────────
function RGB_WS2812B_Strip(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'RGB_WS2812B_Strip', config);
  this.count = config.count || 8;
  this._pixels = [];
  this._circles = [];
}
RGB_WS2812B_Strip.prototype = Object.create(ComponentBase.prototype);
RGB_WS2812B_Strip.prototype.constructor = RGB_WS2812B_Strip;

RGB_WS2812B_Strip.prototype.createSvg = function() {
  var self = this;
  var id = this.id;
  var count = this.count;
  var w = count*18 + 8;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-ws2812b-strip' });
  g.appendChild(SvgUtil.glow(id+'_glow', '#fff', 4));
  g.appendChild(SvgUtil.el('rect', { x:2, y:2, width:w, height:26, rx:3, fill:'#1A1A1A', stroke:'#333', 'stroke-width':'1.5' }));
  var circles = [];
  for (var i=0; i<count; i++) {
    var cx = 10 + i*18;
    var bg = SvgUtil.el('rect', { x:cx-8, y:3, width:16, height:24, rx:2, fill:'#111' });
    var circle = SvgUtil.el('circle', { cx:cx, cy:15, r:7, fill:'#111', filter:'url(#'+id+'_glow)' });
    g.appendChild(bg);
    g.appendChild(circle);
    circles.push(circle);
    self._pixels.push({ r:0, g:0, b:0 });
  }
  g.appendChild(SvgUtil.text('WS2812B x'+count, { x:w/2+2, y:36, 'text-anchor':'middle', 'font-size':'8', fill:'#aaa', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(4,  40, 'DIN', id, 'digital'));
  g.appendChild(SvgUtil.pinDot(4,  50, 'VCC', id, 'power'));
  g.appendChild(SvgUtil.pinDot(4,  60, 'GND', id, 'gnd'));
  g.appendChild(_pinLabel(10, 39, 'DIN')); g.appendChild(_pinLabel(10, 49, 'VCC')); g.appendChild(_pinLabel(10, 59, 'GND'));
  this.element = g;
  this._circles = circles;
  return g;
};
RGB_WS2812B_Strip.prototype.getConnectionPoints = function() {
  return [
    { name:'DIN', x:4, y:40, type:'digital' },
    { name:'VCC', x:4, y:50, type:'power' },
    { name:'GND', x:4, y:60, type:'gnd' }
  ];
};
RGB_WS2812B_Strip.prototype.getBoundingBox = function() { return { x:2, y:2, width:this.count*18+8, height:62 }; };
RGB_WS2812B_Strip.prototype.setPixelColor = function(idx, r, g, b) {
  if (idx < 0 || idx >= this.count) return;
  this._pixels[idx] = { r:r, g:g, b:b };
  var hex = '#' + ('0'+r.toString(16)).slice(-2) + ('0'+g.toString(16)).slice(-2) + ('0'+b.toString(16)).slice(-2);
  if (this._circles[idx]) this._circles[idx].setAttribute('fill', hex);
};
RGB_WS2812B_Strip.prototype.show = function() {};
RGB_WS2812B_Strip.prototype.clear = function() {
  for (var i=0; i<this.count; i++) this.setPixelColor(i, 0, 0, 0);
};
ComponentRegistry.register('RGB_WS2812B_Strip', RGB_WS2812B_Strip);


// ─────────────────────────────────────────────────────────────────────────────
// 47. NPN_Transistor
// ─────────────────────────────────────────────────────────────────────────────
function NPN_Transistor(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'NPN_Transistor', config);
  this._base = 0;
}
NPN_Transistor.prototype = Object.create(ComponentBase.prototype);
NPN_Transistor.prototype.constructor = NPN_Transistor;

NPN_Transistor.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-npn' });
  g.appendChild(SvgUtil.el('circle', { cx:26, cy:28, r:22, fill:'#37474F', stroke:'#607D8B', 'stroke-width':'1.5' }));
  // 베이스 라인
  g.appendChild(SvgUtil.el('line', { x1:4,  y1:28, x2:18, y2:28, stroke:'#90A4AE', 'stroke-width':'2' }));
  // 베이스 막대
  g.appendChild(SvgUtil.el('line', { x1:18, y1:16, x2:18, y2:40, stroke:'#90A4AE', 'stroke-width':'3' }));
  // 컬렉터 (위)
  g.appendChild(SvgUtil.el('line', { x1:18, y1:20, x2:36, y2:8,  stroke:'#90A4AE', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('line', { x1:36, y1:4,  x2:36, y2:8,  stroke:'#90A4AE', 'stroke-width':'2' }));
  // 에미터 (아래) + 화살표
  g.appendChild(SvgUtil.el('line', { x1:18, y1:36, x2:36, y2:48, stroke:'#90A4AE', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('line', { x1:36, y1:48, x2:36, y2:52, stroke:'#90A4AE', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('polygon', { points:'36,48 30,44 34,41', fill:'#90A4AE' }));
  g.appendChild(SvgUtil.text('NPN', { x:26, y:62, 'text-anchor':'middle', 'font-size':'8', fill:'#aaa', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(4,  28, 'B', id, 'digital')); g.appendChild(_pinLabel(10, 27, 'B'));
  g.appendChild(SvgUtil.pinDot(36, 4,  'C', id, 'signal'));  g.appendChild(_pinLabel(38, 7, 'C'));
  g.appendChild(SvgUtil.pinDot(36, 52, 'E', id, 'gnd'));     g.appendChild(_pinLabel(38, 55, 'E'));
  this.element = g;
  return g;
};
NPN_Transistor.prototype.getConnectionPoints = function() {
  return [
    { name:'B', x:4,  y:28, type:'digital' },
    { name:'C', x:36, y:4,  type:'signal' },
    { name:'E', x:36, y:52, type:'gnd' }
  ];
};
NPN_Transistor.prototype.getBoundingBox = function() { return { x:4, y:4, width:48, height:60 }; };
NPN_Transistor.prototype.onGpioChange = function(pin, value) { this._base = value; };
NPN_Transistor.prototype.isOn = function() { return this._base > 0; };
ComponentRegistry.register('NPN_Transistor', NPN_Transistor);


// ─────────────────────────────────────────────────────────────────────────────
// 48. Diode
// ─────────────────────────────────────────────────────────────────────────────
function Diode(id, config) {
  config = config || {};
  ComponentBase.call(this, id, 'Diode', config);
}
Diode.prototype = Object.create(ComponentBase.prototype);
Diode.prototype.constructor = Diode;

Diode.prototype.createSvg = function() {
  var id = this.id;
  var g = SvgUtil.el('g', { id:id, 'class':'component component-diode' });
  g.appendChild(SvgUtil.el('line', { x1:4,  y1:15, x2:22, y2:15, stroke:'#aaa', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('line', { x1:38, y1:15, x2:56, y2:15, stroke:'#aaa', 'stroke-width':'2' }));
  g.appendChild(SvgUtil.el('polygon', { points:'22,7 22,23 38,15', fill:'#E57373', stroke:'#E57373', 'stroke-width':'1' }));
  g.appendChild(SvgUtil.el('line', { x1:38, y1:7, x2:38, y2:23, stroke:'#E57373', 'stroke-width':'2.5' }));
  g.appendChild(SvgUtil.text('1N4007', { x:30, y:32, 'text-anchor':'middle', 'font-size':'7', fill:'#aaa', 'font-family':'monospace' }));
  g.appendChild(SvgUtil.pinDot(4,  15, 'A', id, 'signal')); g.appendChild(_pinLabel(8, 10, 'A'));
  g.appendChild(SvgUtil.pinDot(56, 15, 'K', id, 'signal')); g.appendChild(_pinLabel(48, 10, 'K'));
  this.element = g;
  return g;
};
Diode.prototype.getConnectionPoints = function() {
  return [{ name:'A', x:4, y:15, type:'signal' }, { name:'K', x:56, y:15, type:'signal' }];
};
Diode.prototype.getBoundingBox = function() { return { x:4, y:7, width:52, height:25 }; };
ComponentRegistry.register('Diode', Diode);


// ─────────────────────────────────────────────────────────────────────────────
// 전역 노출
// ─────────────────────────────────────────────────────────────────────────────
window.ComponentRegistry = ComponentRegistry;
window.SvgUtil = SvgUtil;
