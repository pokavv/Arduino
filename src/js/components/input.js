/**
 * input.js
 * 입력 컴포넌트 (버튼, 스위치, 가변저항, 조이스틱 등)
 *
 * 전역 의존성: ComponentBase, ComponentRegistry, SvgUtil, _pinLabel
 * 포함 컴포넌트: Button, Switch, Potentiometer, Joystick, Keypad_4x4, IRReceiver
 */

// ─────────────────────────────────────────────────────────────────────────────
// 7. Button
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
// 14. IRReceiver
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
