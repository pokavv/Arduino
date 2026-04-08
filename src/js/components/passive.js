/**
 * passive.js
 * 수동 소자 (저항, 커패시터, 트랜지스터, 다이오드)
 *
 * 전역 의존성: ComponentBase, ComponentRegistry, SvgUtil, _pinLabel
 * 포함 컴포넌트: Resistor, Capacitor, NPN_Transistor, Diode
 */

// ─────────────────────────────────────────────────────────────────────────────
// 3. Resistor
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
