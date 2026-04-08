/**
 * output.js
 * 출력 컴포넌트 (LED, Buzzer, Speaker, Relay 등)
 *
 * 전역 의존성: ComponentBase, ComponentRegistry, SvgUtil, _pinLabel
 * 포함 컴포넌트: LED, LED_RGB, LED_Bar, Buzzer, Speaker, Relay
 */

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
// 2. LED_RGB
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
// 5. Buzzer
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
// 44. LED_Bar
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
