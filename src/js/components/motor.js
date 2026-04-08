/**
 * motor.js
 * 모터 컴포넌트 (서보, DC모터, 스텝모터)
 *
 * 전역 의존성: ComponentBase, ComponentRegistry, SvgUtil, _pinLabel
 * 포함 컴포넌트: Servo, DC_Motor, DC_Motor_L298N, Stepper_28BYJ48
 */

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
