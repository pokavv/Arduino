/**
 * communication.js
 * 통신 모듈 컴포넌트 (블루투스, Wi-Fi, RFID, NRF24L01)
 *
 * 전역 의존성: ComponentBase, ComponentRegistry, SvgUtil, _pinLabel
 * 포함 컴포넌트: Bluetooth_HC05, WiFi_ESP8266, RFID_RC522, NRF24L01
 */

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
