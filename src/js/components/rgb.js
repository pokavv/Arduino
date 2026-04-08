/**
 * rgb.js
 * RGB LED 컴포넌트 (WS2812B 단일 및 스트립)
 *
 * 전역 의존성: ComponentBase, ComponentRegistry, SvgUtil, _pinLabel
 * 포함 컴포넌트: RGB_WS2812B, RGB_WS2812B_Strip
 */

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
