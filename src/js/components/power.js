/**
 * power.js
 * 전원 / 브레드보드 컴포넌트
 *
 * 전역 의존성: ComponentBase, ComponentRegistry, SvgUtil, _pinLabel
 * 포함 컴포넌트: PowerRail, GndRail, BreadboardSection
 */

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
