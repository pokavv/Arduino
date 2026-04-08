/**
 * sensor.js
 * 센서 컴포넌트 (온습도, 거리, 가스, 조도 등)
 *
 * 전역 의존성: ComponentBase, ComponentRegistry, SvgUtil, _pinLabel
 * 포함 컴포넌트: PhotoResistor_CDS, Thermistor_NTC, DHT11, DHT22, DS18B20,
 *               Ultrasonic_HCSR04, PIR_HC_SR501, MQ2, LM35, MPU6050,
 *               BMP280, Soil_Moisture, Rain_Sensor, Sound_Sensor
 */

// ─────────────────────────────────────────────────────────────────────────────
// 10. PhotoResistor_CDS (조도 센서)
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
