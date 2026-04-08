/**
 * base.js
 * 컴포넌트 레지스트리, SVG 유틸리티, 공통 헬퍼
 *
 * 전역 의존성: 없음 (이 파일이 가장 먼저 로드되어야 함)
 * 전역 제공: ComponentRegistry, SvgUtil, _pinLabel
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
// 핀 번호 매칭 유틸리티 (라이브러리 → 컴포넌트 연결에서 사용)
//
// connections 딕셔너리에는 보드 핀 이름(문자열)이 저장됩니다:
//   ESP32: 'G9', Arduino Uno: 'D9', 아날로그: 'A0'
// 라이브러리는 GPIO 정수 번호(예: 9)로 비교하므로, 이 함수로 매칭합니다.
// ─────────────────────────────────────────────────────────────────────────────
function _pinNumMatch(connValue, gpioNum) {
  // 정수 직접 비교
  if (connValue === gpioNum) return true;
  // 문자열에서 숫자 부분 추출: 'G9' → 9, 'D9' → 9, 'A0' → 0
  if (typeof connValue === 'string') {
    var n = parseInt(connValue.replace(/^[A-Za-z]+/, ''), 10);
    if (!isNaN(n) && n === gpioNum) return true;
  }
  return false;
}
window._pinNumMatch = _pinNumMatch;
