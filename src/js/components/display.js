/**
 * display.js
 * 디스플레이 컴포넌트 (LCD, OLED, 7세그먼트 등)
 *
 * 전역 의존성: ComponentBase, ComponentRegistry, SvgUtil, _pinLabel
 * 포함 컴포넌트: LCD_1602, LCD_2004, OLED_SSD1306, TM1637, SevenSeg
 */

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
// 21. LCD_2004 (I2C 20x4)
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
