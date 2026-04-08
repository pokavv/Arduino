/**
 * circuit.js
 * Arduino 웹 시뮬레이터 — SVG 기반 회로 편집기
 *
 * 기능:
 *   - 무한 캔버스 (휠 줌, 미들클릭/스페이스+드래그 패닝)
 *   - BoardBase 및 레거시 보드 SVG 렌더링
 *   - 컴포넌트 배치/이동 (드래그앤드롭, 그리드 스냅)
 *   - 와이어 연결 (핀 클릭 → 직각 경로 SVG path)
 *   - 회로 직렬화 / 불러오기
 *   - 템플릿 로드
 */

// ─────────────────────────────────────────────────────────────────────────────
// 레거시 ESP32-C3 보드 핀 정의 (하위 호환)
// ─────────────────────────────────────────────────────────────────────────────
var ESP32C3_BOARD_DEF = {
  name: 'ESP32-C3 Super Mini',
  width:  90,
  height: 200,
  pins: [
    { name: '5V',   x: 8,  y: 20,  type: 'power',   gpio: null },
    { name: 'GND',  x: 8,  y: 36,  type: 'gnd',     gpio: null },
    { name: '3V3',  x: 8,  y: 52,  type: 'power',   gpio: null },
    { name: 'G4',   x: 8,  y: 68,  type: 'digital', gpio: 4    },
    { name: 'G5',   x: 8,  y: 84,  type: 'digital', gpio: 5    },
    { name: 'G6',   x: 8,  y: 100, type: 'digital', gpio: 6    },
    { name: 'G7',   x: 8,  y: 116, type: 'digital', gpio: 7    },
    { name: 'G8',   x: 8,  y: 132, type: 'digital', gpio: 8    },
    { name: 'G9',   x: 8,  y: 148, type: 'digital', gpio: 9    },
    { name: 'G10',  x: 8,  y: 164, type: 'digital', gpio: 10   },
    { name: 'G0',   x: 82, y: 20,  type: 'digital', gpio: 0    },
    { name: 'G1',   x: 82, y: 36,  type: 'digital', gpio: 1    },
    { name: 'G2',   x: 82, y: 52,  type: 'digital', gpio: 2    },
    { name: 'G3',   x: 82, y: 68,  type: 'digital', gpio: 3    },
    { name: 'G20',  x: 82, y: 84,  type: 'digital', gpio: 20   },
    { name: 'G21',  x: 82, y: 100, type: 'digital', gpio: 21   },
    { name: 'SDA',  x: 82, y: 116, type: 'i2c',     gpio: 8    },
    { name: 'SCL',  x: 82, y: 132, type: 'i2c',     gpio: 9    },
    { name: 'RXD',  x: 82, y: 148, type: 'digital', gpio: 20   },
    { name: 'TXD',  x: 82, y: 164, type: 'digital', gpio: 21   }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// 와이어 색상
// ─────────────────────────────────────────────────────────────────────────────
var WIRE_COLORS = [
  '#FF5722', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
  '#00BCD4', '#FFEB3B', '#E91E63', '#8BC34A', '#03A9F4'
];
var _wireColorIdx = 0;
function nextWireColor() {
  return WIRE_COLORS[(_wireColorIdx++) % WIRE_COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// CircuitEditor
// ─────────────────────────────────────────────────────────────────────────────
/**
 * SVG 기반 회로 편집기 (무한 캔버스)
 * @param {SVGElement} svgElement
 * @param {Object} [options] - { gridSize }
 */
function CircuitEditor(svgElement, options) {
  options = options || {};

  this.svg      = svgElement;
  this.gridSize = options.gridSize || 10;

  // 레이어
  this._contentGroup    = null;  // 줌/패닝 대상 루트 그룹
  this._layerBoard      = null;
  this._layerWires      = null;
  this._layerComponents = null;
  this._layerOverlay    = null;
  this._gridPattern     = null;  // 무한 그리드 패턴

  // 컴포넌트 맵
  this._components = {};

  // 와이어
  this._wires         = [];
  this._wireStart     = null;
  this._tempWire      = null;
  this._wireIdCounter = 0;

  // 드래그
  this._drag = null;

  // 선택
  this._selected = null;

  // 모드: 'select' | 'wire'
  this._mode = 'select';

  // ── 뷰 변환 ──────────────────────────────────────────────
  this._panX       = 80;    // 초기 패닝 (내용이 왼쪽에 붙지 않도록)
  this._panY       = 80;
  this._zoom       = 1.0;

  // 패닝 상태
  this._panning    = false;
  this._panStart   = null;  // { sx, sy, px, py }
  this._spaceDown  = false;

  // 보드
  this._boardX   = 0;
  this._boardY   = 0;
  this._boardDef = null;

  this._init();
}

// ─────────────────────────────────────────────────────────────────────────────
// 초기화
// ─────────────────────────────────────────────────────────────────────────────
CircuitEditor.prototype._init = function() {
  var svg  = this.svg;
  var self = this;

  // SVG는 CSS로 크기 결정 — viewBox 없음
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.removeAttribute('viewBox');
  svg.style.display = 'block';
  svg.style.width   = '100%';
  svg.style.height  = '100%';

  var NS = 'http://www.w3.org/2000/svg';

  // ── defs: 그리드 패턴 ──────────────────────────────────
  var defs = document.createElementNS(NS, 'defs');

  var pattern = document.createElementNS(NS, 'pattern');
  pattern.setAttribute('id',           'grid-pattern');
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  pattern.setAttribute('width',        String(this.gridSize));
  pattern.setAttribute('height',       String(this.gridSize));
  this._gridPattern = pattern;

  var dot = document.createElementNS(NS, 'circle');
  dot.setAttribute('cx', '0'); dot.setAttribute('cy', '0');
  dot.setAttribute('r',  '0.8');
  dot.setAttribute('fill', 'rgba(255,255,255,0.18)');
  pattern.appendChild(dot);
  defs.appendChild(pattern);
  svg.appendChild(defs);

  // ── 배경 rect ─────────────────────────────────────────
  var bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#1A1A2E');
  svg.appendChild(bg);

  // ── 그리드 rect (배경 위) ────────────────────────────
  var gridRect = document.createElementNS(NS, 'rect');
  gridRect.setAttribute('width', '100%'); gridRect.setAttribute('height', '100%');
  gridRect.setAttribute('fill', 'url(#grid-pattern)');
  gridRect.setAttribute('pointer-events', 'none');
  svg.appendChild(gridRect);

  // ── content group (pan/zoom 변환 대상) ──────────────
  var cg = document.createElementNS(NS, 'g');
  cg.setAttribute('id', 'content-group');
  this._contentGroup = cg;
  svg.appendChild(cg);

  // ── 레이어 (content group 안) ──────────────────────
  this._layerBoard      = this._createLayerIn(cg, 'layer-board');
  this._layerWires      = this._createLayerIn(cg, 'layer-wires');
  this._layerComponents = this._createLayerIn(cg, 'layer-components');
  this._layerOverlay    = this._createLayerIn(cg, 'layer-overlay');

  this._applyTransform();

  // ── 이벤트 ───────────────────────────────────────────
  svg.addEventListener('wheel',       function(e) { self._onWheel(e); },      { passive: false });
  svg.addEventListener('mousedown',   function(e) { self._onSvgMouseDown(e); });
  svg.addEventListener('mousemove',   function(e) { self._onMouseMove(e); });
  svg.addEventListener('mouseup',     function(e) { self._onMouseUp(e); });
  svg.addEventListener('mouseleave',  function(e) { self._onMouseUp(e); });
  svg.addEventListener('click',       function(e) { self._onSvgClick(e); });
  svg.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    self._cancelWire();
    self._deselect();
  });

  document.addEventListener('keydown', function(e) { self._onKeyDown(e); });
  document.addEventListener('keyup',   function(e) { self._onKeyUp(e); });
};

CircuitEditor.prototype._createLayerIn = function(parent, id) {
  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', id);
  parent.appendChild(g);
  return g;
};

// ─────────────────────────────────────────────────────────────────────────────
// 뷰 변환
// ─────────────────────────────────────────────────────────────────────────────

/**
 * content-group과 grid-pattern에 현재 pan/zoom 반영
 */
CircuitEditor.prototype._applyTransform = function() {
  var px = this._panX, py = this._panY, z = this._zoom;

  this._contentGroup.setAttribute('transform',
    'translate(' + px + ',' + py + ') scale(' + z + ')');

  // 그리드 패턴도 pan/zoom을 따라가야 "무한" 효과
  var gs = this.gridSize * z;
  if (gs < 4) gs = 4;  // 너무 작으면 생략
  this._gridPattern.setAttribute('width',  String(gs));
  this._gridPattern.setAttribute('height', String(gs));
  this._gridPattern.setAttribute('patternTransform',
    'translate(' + (px % gs) + ',' + (py % gs) + ')');
};

/**
 * 이벤트 좌표 → 월드 좌표 (content-group 내부 기준)
 * getScreenCTM().inverse() 사용 — pan/zoom 자동 반영
 */
CircuitEditor.prototype._svgPoint = function(e) {
  try {
    var pt = this.svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    var ctm = this._contentGroup.getScreenCTM();
    if (ctm) return ctm.inverse().transformPoint(pt);
  } catch (err) { /* fallback */ }
  var r = this.svg.getBoundingClientRect();
  return {
    x: (e.clientX - r.left - this._panX) / this._zoom,
    y: (e.clientY - r.top  - this._panY) / this._zoom
  };
};

/**
 * 이벤트 좌표 → SVG 루트 좌표 (content-group 변환 미적용)
 */
CircuitEditor.prototype._svgPointRaw = function(e) {
  var r = this.svg.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
};

/**
 * SVG 루트 좌표 → 월드 좌표
 */
CircuitEditor.prototype.screenToWorld = function(sx, sy) {
  return {
    x: (sx - this._panX) / this._zoom,
    y: (sy - this._panY) / this._zoom
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 줌 / 패닝 이벤트
// ─────────────────────────────────────────────────────────────────────────────

CircuitEditor.prototype._onWheel = function(e) {
  e.preventDefault();
  var factor  = e.deltaY < 0 ? 1.12 : (1.0 / 1.12);
  var newZoom = Math.max(0.08, Math.min(8, this._zoom * factor));
  var raw     = this._svgPointRaw(e);
  // 커서 아래 월드 포인트가 고정되도록 pan 조정
  this._panX  = raw.x - (raw.x - this._panX) * (newZoom / this._zoom);
  this._panY  = raw.y - (raw.y - this._panY) * (newZoom / this._zoom);
  this._zoom  = newZoom;
  this._applyTransform();
};

/**
 * SVG 배경 mousedown — 패닝 시작 or 아무것도 없음
 */
CircuitEditor.prototype._onSvgMouseDown = function(e) {
  // 미들클릭 OR 스페이스+좌클릭 = 패닝
  if (e.button === 1 || (e.button === 0 && this._spaceDown)) {
    e.preventDefault();
    this._panning  = true;
    var raw = this._svgPointRaw(e);
    this._panStart = { sx: raw.x, sy: raw.y, px: this._panX, py: this._panY };
    this.svg.style.cursor = 'grabbing';
  }
};

CircuitEditor.prototype._onMouseMove = function(e) {
  // 패닝 중
  if (this._panning && this._panStart) {
    var raw = this._svgPointRaw(e);
    this._panX = this._panStart.px + (raw.x - this._panStart.sx);
    this._panY = this._panStart.py + (raw.y - this._panStart.sy);
    this._applyTransform();
    return;
  }

  var pt = this._svgPoint(e);

  // 컴포넌트 드래그
  if (this._drag) {
    var comp = this._components[this._drag.compId];
    if (comp) {
      var nx = Math.round((pt.x - this._drag.offsetX) / this.gridSize) * this.gridSize;
      var ny = Math.round((pt.y - this._drag.offsetY) / this.gridSize) * this.gridSize;
      comp.move(nx, ny);
      this._updateWiresForComponent(comp.id);
    }
  }

  // 임시 와이어 업데이트
  if (this._wireStart && this._tempWire) {
    var d = this._buildOrthogonalPath(this._wireStart.x, this._wireStart.y, pt.x, pt.y);
    this._tempWire.setAttribute('d', d);
  }
};

CircuitEditor.prototype._onMouseUp = function(e) {
  if (this._panning) {
    this._panning  = false;
    this._panStart = null;
    this.svg.style.cursor = this._spaceDown ? 'grab' : '';
  }
  if (this._drag) {
    this._drag = null;
  }
};

CircuitEditor.prototype._onSvgClick = function(e) {
  if (this._panning) return;
  // 배경 클릭 = 선택 해제
  if (e.target === this.svg ||
      e.target.id === 'bg-rect' ||
      e.target.id === 'grid-rect' ||
      e.target === this._contentGroup) {
    this._deselect();
    this._cancelWire();
  }
};

CircuitEditor.prototype._onKeyDown = function(e) {
  // 스페이스 = 패닝 모드
  if ((e.key === ' ' || e.code === 'Space') &&
       !e.target.matches('input, textarea, select')) {
    e.preventDefault();
    this._spaceDown = true;
    if (!this._panning) this.svg.style.cursor = 'grab';
    return;
  }

  if ((e.key === 'Delete' || e.key === 'Backspace') && this._selected) {
    if (!e.target.matches('input, textarea, select')) {
      if (this._selected.type === 'component') {
        this.removeComponent(this._selected.id);
      } else if (this._selected.type === 'wire') {
        this.removeWire(this._selected.id);
      }
      this._selected = null;
    }
  }

  if (e.key === 'Escape') {
    this._cancelWire();
    this._deselect();
  }

  // 줌 단축키
  if ((e.key === '=' || e.key === '+') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    this._zoomTo(this._zoom * 1.2);
  }
  if ((e.key === '-') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    this._zoomTo(this._zoom / 1.2);
  }
  if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    this._zoomTo(1.0);
  }
};

CircuitEditor.prototype._onKeyUp = function(e) {
  if (e.key === ' ' || e.code === 'Space') {
    this._spaceDown = false;
    if (!this._panning) this.svg.style.cursor = '';
  }
};

/**
 * 캔버스 중앙 기준으로 줌
 * @param {number} newZoom
 */
CircuitEditor.prototype._zoomTo = function(newZoom) {
  newZoom = Math.max(0.08, Math.min(8, newZoom));
  var r  = this.svg.getBoundingClientRect();
  var cx = r.width  / 2;
  var cy = r.height / 2;
  this._panX = cx - (cx - this._panX) * (newZoom / this._zoom);
  this._panY = cy - (cy - this._panY) * (newZoom / this._zoom);
  this._zoom = newZoom;
  this._applyTransform();
};

CircuitEditor.prototype._deselect = function() {
  if (this._selected && this._selected.type === 'component') {
    var comp = this._components[this._selected.id];
    if (comp) comp.deselect();
  }
  this._selected = null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 보드 렌더링
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 보드를 SVG로 렌더링합니다.
 * BoardBase 인스턴스(render 메서드) 또는 레거시 객체 모두 지원.
 */
CircuitEditor.prototype.renderBoard = function(boardDef, x, y) {
  x = (x !== undefined) ? x : 50;
  y = (y !== undefined) ? y : 50;

  var self  = this;
  var layer = this._layerBoard;

  // 기존 보드 클리어
  while (layer.firstChild) layer.removeChild(layer.firstChild);

  // ── 신규: BoardBase 인스턴스 ──────────────────────────────
  if (boardDef && typeof boardDef.render === 'function') {
    boardDef.render(layer, x, y);

    // 핀 원에 클릭 이벤트 연결
    layer.querySelectorAll('circle[data-pin-name]').forEach(function(c) {
      var pinName = c.getAttribute('data-pin-name');
      var px = parseFloat(c.getAttribute('cx'));
      var py = parseFloat(c.getAttribute('cy'));
      c.style.cursor = 'crosshair';
      c.addEventListener('click', function(e) {
        e.stopPropagation();
        self._onPinClick({ boardPin: pinName, x: px, y: py });
      });
    });

    this._boardX   = x;
    this._boardY   = y;
    this._boardDef = boardDef;
    return;
  }

  // ── 레거시: 구형 ESP32C3_BOARD_DEF 포맷 ────────────────────
  boardDef = boardDef || ESP32C3_BOARD_DEF;

  var NS = 'http://www.w3.org/2000/svg';
  var bw = boardDef.width  || 90;
  var bh = boardDef.height || 200;

  var g = document.createElementNS(NS, 'g');
  g.setAttribute('id', 'board-legacy');
  g.setAttribute('transform', 'translate(' + x + ',' + y + ')');

  // PCB 기판
  var pcb = document.createElementNS(NS, 'rect');
  pcb.setAttribute('x', 0); pcb.setAttribute('y', 0);
  pcb.setAttribute('width', bw); pcb.setAttribute('height', bh);
  pcb.setAttribute('rx', 6);
  pcb.setAttribute('fill', '#1a2b1a');
  pcb.setAttribute('stroke', '#2d4a2d');
  pcb.setAttribute('stroke-width', '1.5');
  g.appendChild(pcb);

  // USB-C 커넥터
  var usb = document.createElementNS(NS, 'rect');
  usb.setAttribute('x', bw / 2 - 8); usb.setAttribute('y', -6);
  usb.setAttribute('width', 16); usb.setAttribute('height', 10);
  usb.setAttribute('rx', 3);
  usb.setAttribute('fill', '#888'); usb.setAttribute('stroke', '#aaa');
  g.appendChild(usb);

  // 칩
  var chip = document.createElementNS(NS, 'rect');
  chip.setAttribute('x', 20); chip.setAttribute('y', 60);
  chip.setAttribute('width', 50); chip.setAttribute('height', 50);
  chip.setAttribute('rx', 3);
  chip.setAttribute('fill', '#111'); chip.setAttribute('stroke', '#333');
  g.appendChild(chip);

  var chipLabel = document.createElementNS(NS, 'text');
  chipLabel.setAttribute('x', 45); chipLabel.setAttribute('y', 90);
  chipLabel.setAttribute('text-anchor', 'middle');
  chipLabel.setAttribute('font-size', '6');
  chipLabel.setAttribute('fill', '#888');
  chipLabel.setAttribute('font-family', 'monospace');
  chipLabel.textContent = boardDef.name || 'MCU';
  g.appendChild(chipLabel);

  // 핀 렌더링
  boardDef.pins.forEach(function(pin) {
    var isLeft = (pin.x < bw / 2);

    var pColors = { power: '#F44336', gnd: '#aaa', digital: '#4CAF50', i2c: '#9C27B0', analog: '#FF9800' };
    var pinColor = pColors[pin.type] || '#9E9E9E';

    var pinCircle = document.createElementNS(NS, 'circle');
    pinCircle.setAttribute('cx', pin.x);
    pinCircle.setAttribute('cy', pin.y);
    pinCircle.setAttribute('r',  4.5);
    pinCircle.setAttribute('fill',         pinColor);
    pinCircle.setAttribute('fill-opacity', '0.6');
    pinCircle.setAttribute('stroke',       '#fff');
    pinCircle.setAttribute('stroke-width', '0.8');
    pinCircle.setAttribute('class',        'board-pin');
    pinCircle.setAttribute('data-pin',     pin.name);
    pinCircle.setAttribute('data-gpio',    pin.gpio !== null ? pin.gpio : '');
    pinCircle.style.cursor = 'crosshair';

    pinCircle.addEventListener('click', (function(p) {
      return function(e) {
        e.stopPropagation();
        self._onPinClick({ boardPin: p.name, x: x + p.x, y: y + p.y });
      };
    })(pin));
    g.appendChild(pinCircle);

    var label = document.createElementNS(NS, 'text');
    label.setAttribute('y', pin.y + 3);
    label.setAttribute('font-size', '6');
    label.setAttribute('fill', '#ccc');
    label.setAttribute('font-family', 'monospace');
    if (isLeft) {
      label.setAttribute('x', pin.x + 8);
      label.setAttribute('text-anchor', 'start');
    } else {
      label.setAttribute('x', pin.x - 8);
      label.setAttribute('text-anchor', 'end');
    }
    label.textContent = pin.name;
    g.appendChild(label);
  });

  var boardNameEl = document.createElementNS(NS, 'text');
  boardNameEl.setAttribute('x', bw / 2);
  boardNameEl.setAttribute('y', bh - 5);
  boardNameEl.setAttribute('text-anchor', 'middle');
  boardNameEl.setAttribute('font-size', '6');
  boardNameEl.setAttribute('fill', '#666');
  boardNameEl.setAttribute('font-family', 'monospace');
  boardNameEl.textContent = boardDef.name || '';
  g.appendChild(boardNameEl);

  layer.appendChild(g);
  this._boardX   = x;
  this._boardY   = y;
  this._boardDef = boardDef;
};

/**
 * 보드 핀의 월드 좌표 반환
 */
CircuitEditor.prototype.getBoardPinPos = function(pinName) {
  if (!this._boardDef) return null;
  var pins = this._boardDef.pins;
  for (var i = 0; i < pins.length; i++) {
    if (pins[i].name === pinName) {
      return { x: this._boardX + pins[i].x, y: this._boardY + pins[i].y };
    }
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 컴포넌트 관리
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 컴포넌트 추가
 * @param {string} type
 * @param {number} x - 월드 좌표
 * @param {number} y - 월드 좌표
 * @param {Object} config
 */
CircuitEditor.prototype.addComponent = function(type, x, y, config) {
  var comp = ComponentRegistry.create(type, null, config, x, y);
  if (!comp) {
    console.error('CircuitEditor.addComponent: 알 수 없는 타입 -', type);
    return null;
  }

  var el = comp.createSvg();
  comp.move(x, y);

  this.enableDrag(comp);
  this._bindPinEvents(comp);

  this._layerComponents.appendChild(el);
  this._components[comp.id] = comp;
  comp.mounted = true;

  return comp;
};

CircuitEditor.prototype.removeComponent = function(id) {
  var comp = this._components[id];
  if (!comp) return;

  var self = this;
  this._wires
    .filter(function(w) { return w.from.compId === id || w.to.compId === id; })
    .map(function(w) { return w.id; })
    .forEach(function(wid) { self.removeWire(wid); });

  if (comp.element && comp.element.parentNode) {
    comp.element.parentNode.removeChild(comp.element);
  }
  delete this._components[id];
};

CircuitEditor.prototype.getComponent = function(id) {
  return this._components[id] || null;
};

CircuitEditor.prototype.getAllComponents = function() {
  return Object.values(this._components);
};

// ─────────────────────────────────────────────────────────────────────────────
// 드래그앤드롭 (컴포넌트)
// ─────────────────────────────────────────────────────────────────────────────

CircuitEditor.prototype.enableDrag = function(comp) {
  var self = this;
  var el   = comp.element;
  if (!el) return;

  el.addEventListener('mousedown', function(e) {
    if (self._mode === 'wire') return;
    if (e.button !== 0) return;
    if (e.target.closest && e.target.closest('.pin-point')) return;
    e.stopPropagation();

    var pt = self._svgPoint(e);
    self._drag = {
      compId:  comp.id,
      offsetX: pt.x - comp.x,
      offsetY: pt.y - comp.y
    };
    comp.select();
    self._selected = { type: 'component', id: comp.id };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 핀 이벤트 & 와이어
// ─────────────────────────────────────────────────────────────────────────────

CircuitEditor.prototype._bindPinEvents = function(comp) {
  var self = this;
  var el   = comp.element;
  if (!el) return;

  el.querySelectorAll('.pin-point').forEach(function(pinEl) {
    pinEl.addEventListener('click', function(e) {
      e.stopPropagation();
      var pinName = pinEl.getAttribute('data-pin');
      var pos     = self._getPinAbsPos(comp, pinName);
      self._onPinClick({ compId: comp.id, pinName: pinName, x: pos.x, y: pos.y });
    });
  });
};

CircuitEditor.prototype._getPinAbsPos = function(comp, pinName) {
  var pts = comp.getConnectionPoints();
  for (var i = 0; i < pts.length; i++) {
    if (pts[i].name === pinName) {
      return { x: comp.x + pts[i].x, y: comp.y + pts[i].y };
    }
  }
  return { x: comp.x, y: comp.y };
};

CircuitEditor.prototype._onPinClick = function(pinInfo) {
  if (!this._wireStart) {
    this._wireStart = pinInfo;
    this._startTempWire(pinInfo.x, pinInfo.y);
  } else {
    var same = (
      this._wireStart.compId   === pinInfo.compId   &&
      this._wireStart.pinName  === pinInfo.pinName  &&
      this._wireStart.boardPin === pinInfo.boardPin
    );
    if (same) {
      this._cancelWire();
    } else {
      this._finishWire(pinInfo);
    }
  }
};

CircuitEditor.prototype._startTempWire = function(x, y) {
  var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d',                'M' + x + ',' + y);
  line.setAttribute('fill',            'none');
  line.setAttribute('stroke',          '#FFFF00');
  line.setAttribute('stroke-width',    '2');
  line.setAttribute('stroke-dasharray','5,3');
  line.setAttribute('pointer-events',  'none');
  this._layerOverlay.appendChild(line);
  this._tempWire = line;
};

CircuitEditor.prototype._cancelWire = function() {
  if (this._tempWire && this._tempWire.parentNode) {
    this._tempWire.parentNode.removeChild(this._tempWire);
  }
  this._tempWire  = null;
  this._wireStart = null;
};

CircuitEditor.prototype._finishWire = function(endPin) {
  var startPin = this._wireStart;
  var color    = nextWireColor();
  var sx = startPin.x, sy = startPin.y;
  var ex = endPin.x,   ey = endPin.y;
  var wireId = 'wire_' + (++this._wireIdCounter);

  var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('id',               wireId);
  path.setAttribute('d',                this._buildOrthogonalPath(sx, sy, ex, ey));
  path.setAttribute('fill',             'none');
  path.setAttribute('stroke',           color);
  path.setAttribute('stroke-width',     '2');
  path.setAttribute('stroke-linecap',   'round');
  path.setAttribute('stroke-linejoin',  'round');

  var wireGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  wireGroup.setAttribute('id',    wireId + '_g');
  wireGroup.setAttribute('class', 'wire-group');
  wireGroup.appendChild(path);
  wireGroup.appendChild(this._makeWireDot(sx, sy, color));
  wireGroup.appendChild(this._makeWireDot(ex, ey, color));

  var self = this;
  wireGroup.addEventListener('click', (function(wid) {
    return function(e) { e.stopPropagation(); self._selectWire(wid); };
  })(wireId));

  this._layerWires.appendChild(wireGroup);
  this._wires.push({ id: wireId, from: startPin, to: endPin, color: color, element: wireGroup });
  this._applyWireConnection(startPin, endPin);
  this._cancelWire();
};

CircuitEditor.prototype._makeWireDot = function(x, y) {
  var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', x); c.setAttribute('cy', y);
  c.setAttribute('r',  3.5);
  c.setAttribute('fill',         '#4CAF50');
  c.setAttribute('stroke',       '#fff');
  c.setAttribute('stroke-width', '1');
  c.setAttribute('pointer-events', 'none');
  return c;
};

CircuitEditor.prototype._applyWireConnection = function(fromPin, toPin) {
  var comp, pinName, boardPin;

  if (fromPin.compId && toPin.boardPin) {
    comp = this._components[fromPin.compId];
    pinName = fromPin.pinName; boardPin = toPin.boardPin;
  } else if (toPin.compId && fromPin.boardPin) {
    comp = this._components[toPin.compId];
    pinName = toPin.pinName; boardPin = fromPin.boardPin;
  } else if (fromPin.compId && toPin.compId) {
    var ca = this._components[fromPin.compId];
    var cb = this._components[toPin.compId];
    if (ca) ca.setConnection(fromPin.pinName, toPin.compId + ':' + toPin.pinName);
    if (cb) cb.setConnection(toPin.pinName, fromPin.compId + ':' + fromPin.pinName);
    return;
  }

  if (comp && pinName && boardPin) comp.setConnection(pinName, boardPin);
};

CircuitEditor.prototype._buildOrthogonalPath = function(x1, y1, x2, y2) {
  var mx = x1 + (x2 - x1) / 2;
  return 'M' + x1 + ',' + y1 +
         ' L' + mx + ',' + y1 +
         ' L' + mx + ',' + y2 +
         ' L' + x2 + ',' + y2;
};

CircuitEditor.prototype.removeWire = function(wireId) {
  var idx = -1;
  for (var i = 0; i < this._wires.length; i++) {
    if (this._wires[i].id === wireId) { idx = i; break; }
  }
  if (idx === -1) return;

  var wire = this._wires[idx];

  if (wire.from.compId) {
    var cf = this._components[wire.from.compId];
    if (cf) cf.removeConnection(wire.from.pinName);
  }
  if (wire.to.compId) {
    var ct = this._components[wire.to.compId];
    if (ct) ct.removeConnection(wire.to.pinName);
  }

  if (wire.element && wire.element.parentNode) {
    wire.element.parentNode.removeChild(wire.element);
  }
  this._wires.splice(idx, 1);
};

CircuitEditor.prototype._selectWire = function(wireId) {
  this._deselect();
  var wire = null;
  for (var i = 0; i < this._wires.length; i++) {
    if (this._wires[i].id === wireId) { wire = this._wires[i]; break; }
  }
  if (!wire) return;
  var path = wire.element.querySelector('path');
  if (path) {
    path.setAttribute('stroke',       '#2196F3');
    path.setAttribute('stroke-width', '3');
  }
  this._selected = { type: 'wire', id: wireId };
};

CircuitEditor.prototype._updateWiresForComponent = function(compId) {
  var self = this;
  this._wires.forEach(function(wire) {
    var fromComp = wire.from.compId === compId;
    var toComp   = wire.to.compId   === compId;
    if (!fromComp && !toComp) return;

    var sx = wire.from.x || 0, sy = wire.from.y || 0;
    var ex = wire.to.x   || 0, ey = wire.to.y   || 0;

    if (fromComp) {
      var c1 = self._components[compId];
      if (c1) { var p1 = self._getPinAbsPos(c1, wire.from.pinName); sx = p1.x; sy = p1.y; wire.from.x = sx; wire.from.y = sy; }
    }
    if (toComp) {
      var c2 = self._components[compId];
      if (c2) { var p2 = self._getPinAbsPos(c2, wire.to.pinName); ex = p2.x; ey = p2.y; wire.to.x = ex; wire.to.y = ey; }
    }
    if (!fromComp && wire.from.boardPin) {
      var bp1 = self.getBoardPinPos(wire.from.boardPin);
      if (bp1) { sx = bp1.x; sy = bp1.y; }
    }
    if (!toComp && wire.to.boardPin) {
      var bp2 = self.getBoardPinPos(wire.to.boardPin);
      if (bp2) { ex = bp2.x; ey = bp2.y; }
    }

    var p = wire.element.querySelector('path');
    if (p) p.setAttribute('d', self._buildOrthogonalPath(sx, sy, ex, ey));

    var dots = wire.element.querySelectorAll('circle');
    if (dots[0]) { dots[0].setAttribute('cx', sx); dots[0].setAttribute('cy', sy); }
    if (dots[1]) { dots[1].setAttribute('cx', ex); dots[1].setAttribute('cy', ey); }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 전기적 연결 분석
// ─────────────────────────────────────────────────────────────────────────────

CircuitEditor.prototype.getConnectedPins = function(pin) {
  var visited = {};
  var result  = [];
  var self    = this;

  function key(p) {
    if (p.boardPin) return 'board:' + p.boardPin;
    return 'comp:' + p.compId + ':' + p.pinName;
  }

  function traverse(p) {
    var k = key(p);
    if (visited[k]) return;
    visited[k] = true;
    result.push(p);
    self._wires.forEach(function(w) {
      if (key(w.from) === k) traverse(w.to);
      if (key(w.to)   === k) traverse(w.from);
    });
  }

  traverse(pin);
  return result;
};

CircuitEditor.prototype.getComponentsOnPin = function(boardPinName) {
  var result    = [];
  var connected = this.getConnectedPins({ boardPin: boardPinName });
  var self      = this;
  connected.forEach(function(p) {
    if (p.compId && self._components[p.compId]) {
      result.push({ comp: self._components[p.compId], pinName: p.pinName });
    }
  });
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// 직렬화 / 불러오기
// ─────────────────────────────────────────────────────────────────────────────

CircuitEditor.prototype.toJSON = function() {
  var self = this;
  var components = Object.keys(this._components).map(function(id) {
    return self._components[id].toJSON();
  });
  var wires = this._wires.map(function(w) {
    return {
      id:    w.id,
      from:  { compId: w.from.compId, pinName: w.from.pinName, boardPin: w.from.boardPin },
      to:    { compId: w.to.compId,   pinName: w.to.pinName,   boardPin: w.to.boardPin },
      color: w.color
    };
  });
  var boardId = (this._boardDef && this._boardDef.id) ? this._boardDef.id : 'unknown';
  return { version: '1.0', board: boardId, components: components, wires: wires };
};

CircuitEditor.prototype.loadFromJSON = function(data) {
  this.clearAll();
  var self = this;

  if (data.components) {
    data.components.forEach(function(cData) {
      var comp = ComponentBase.fromJSON(cData);
      if (!comp) return;
      var el = comp.createSvg();
      comp.move(cData.x, cData.y);
      self.enableDrag(comp);
      self._bindPinEvents(comp);
      self._layerComponents.appendChild(el);
      self._components[comp.id] = comp;
      comp.mounted = true;
    });
  }

  if (data.wires) {
    data.wires.forEach(function(wData) {
      var from = Object.assign({}, wData.from);
      var to   = Object.assign({}, wData.to);

      var fx = 0, fy = 0, tx = 0, ty = 0;
      if (from.boardPin) {
        var bp1 = self.getBoardPinPos(from.boardPin);
        if (bp1) { fx = bp1.x; fy = bp1.y; }
      } else if (from.compId) {
        var c1 = self._components[from.compId];
        if (c1) { var p1 = self._getPinAbsPos(c1, from.pinName); fx = p1.x; fy = p1.y; }
      }
      if (to.boardPin) {
        var bp2 = self.getBoardPinPos(to.boardPin);
        if (bp2) { tx = bp2.x; ty = bp2.y; }
      } else if (to.compId) {
        var c2 = self._components[to.compId];
        if (c2) { var p2 = self._getPinAbsPos(c2, to.pinName); tx = p2.x; ty = p2.y; }
      }

      var color = wData.color || nextWireColor();
      var wireId = 'wire_' + (++self._wireIdCounter);

      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d',            self._buildOrthogonalPath(fx, fy, tx, ty));
      path.setAttribute('fill',         'none');
      path.setAttribute('stroke',       color);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-linecap', 'round');

      var wireGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wireGroup.setAttribute('id',    wireId + '_g');
      wireGroup.setAttribute('class', 'wire-group');
      wireGroup.appendChild(path);
      wireGroup.appendChild(self._makeWireDot(fx, fy));
      wireGroup.appendChild(self._makeWireDot(tx, ty));

      wireGroup.addEventListener('click', (function(wid) {
        return function(e) { e.stopPropagation(); self._selectWire(wid); };
      })(wireId));

      self._layerWires.appendChild(wireGroup);
      self._wires.push({ id: wireId, from: from, to: to, color: color, element: wireGroup });
      self._applyWireConnection(from, to);
    });
  }
};

CircuitEditor.prototype.loadTemplate = function(templateData) {
  if (!templateData) return;
  this.clearAll();

  var self    = this;
  var compMap = {};

  if (templateData.components) {
    templateData.components.forEach(function(cDef) {
      var comp = self.addComponent(cDef.type, cDef.x || 400, cDef.y || 200, cDef.config || {});
      if (comp) {
        compMap[cDef.id] = comp.id;
        if (cDef.connections) {
          Object.keys(cDef.connections).forEach(function(pname) {
            comp.setConnection(pname, cDef.connections[pname]);
          });
        }
      }
    });
  }

  if (templateData.wires) {
    templateData.wires.forEach(function(wDef) {
      var from = Object.assign({}, wDef.from);
      var to   = Object.assign({}, wDef.to);

      if (from.compId && compMap[from.compId]) from.compId = compMap[from.compId];
      if (to.compId   && compMap[to.compId])   to.compId   = compMap[to.compId];

      var fx = 0, fy = 0, tx = 0, ty = 0;
      if (from.boardPin) {
        var bp1 = self.getBoardPinPos(from.boardPin);
        if (bp1) { fx = bp1.x; fy = bp1.y; from.x = fx; from.y = fy; }
      } else if (from.compId) {
        var c1 = self._components[from.compId];
        if (c1) { var p1 = self._getPinAbsPos(c1, from.pinName); fx = p1.x; fy = p1.y; from.x = fx; from.y = fy; }
      }
      if (to.boardPin) {
        var bp2 = self.getBoardPinPos(to.boardPin);
        if (bp2) { tx = bp2.x; ty = bp2.y; to.x = tx; to.y = ty; }
      } else if (to.compId) {
        var c2 = self._components[to.compId];
        if (c2) { var p2 = self._getPinAbsPos(c2, to.pinName); tx = p2.x; ty = p2.y; to.x = tx; to.y = ty; }
      }

      var color  = wDef.color || nextWireColor();
      var wireId = 'wire_' + (++self._wireIdCounter);

      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d',            self._buildOrthogonalPath(fx, fy, tx, ty));
      path.setAttribute('fill',         'none');
      path.setAttribute('stroke',       color);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-linecap', 'round');

      var wireGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wireGroup.setAttribute('id',    wireId + '_g');
      wireGroup.setAttribute('class', 'wire-group');
      wireGroup.appendChild(path);
      wireGroup.appendChild(self._makeWireDot(fx, fy));
      wireGroup.appendChild(self._makeWireDot(tx, ty));

      wireGroup.addEventListener('click', (function(wid) {
        return function(e) { e.stopPropagation(); self._selectWire(wid); };
      })(wireId));

      self._layerWires.appendChild(wireGroup);
      self._wires.push({ id: wireId, from: from, to: to, color: color, element: wireGroup });
      self._applyWireConnection(from, to);
    });
  }
};

CircuitEditor.prototype.clearAll = function() {
  var self = this;
  Object.keys(this._components).forEach(function(id) {
    var c = self._components[id];
    if (c.element && c.element.parentNode) c.element.parentNode.removeChild(c.element);
  });
  this._components = {};

  this._wires.forEach(function(w) {
    if (w.element && w.element.parentNode) w.element.parentNode.removeChild(w.element);
  });
  this._wires = [];

  this._cancelWire();
  this._deselect();
};

// ─────────────────────────────────────────────────────────────────────────────
// 시뮬레이터 연동
// ─────────────────────────────────────────────────────────────────────────────

CircuitEditor.prototype.notifyGpioChange = function(boardPinName, value) {
  this.getComponentsOnPin(boardPinName).forEach(function(e) {
    if (e.comp && typeof e.comp.onGpioChange === 'function') {
      e.comp.onGpioChange(boardPinName, value);
    }
  });
};

CircuitEditor.prototype.notifyPwmChange = function(boardPinName, duty, freq) {
  this.getComponentsOnPin(boardPinName).forEach(function(e) {
    if (e.comp && typeof e.comp.onPwmChange === 'function') {
      e.comp.onPwmChange(boardPinName, duty, freq);
    }
  });
};

CircuitEditor.prototype.readAdc = function(boardPinName) {
  var entries = this.getComponentsOnPin(boardPinName);
  for (var i = 0; i < entries.length; i++) {
    if (typeof entries[i].comp.getAdcValue === 'function') {
      return entries[i].comp.getAdcValue(boardPinName);
    }
  }
  return 0;
};

CircuitEditor.prototype.readDigital = function(boardPinName) {
  var entries = this.getComponentsOnPin(boardPinName);
  for (var i = 0; i < entries.length; i++) {
    if (typeof entries[i].comp.getDigitalValue === 'function') {
      return entries[i].comp.getDigitalValue(boardPinName);
    }
  }
  return 1;
};

// ─────────────────────────────────────────────────────────────────────────────
// app.js 인터페이스
// ─────────────────────────────────────────────────────────────────────────────

CircuitEditor.prototype._gpioToPinName = function(gpioNum) {
  if (this._boardDef && typeof this._boardDef.getPinByNumber === 'function') {
    var p = this._boardDef.getPinByNumber(gpioNum);
    if (p) return p.name;
  }
  if (this._boardDef && Array.isArray(this._boardDef.pins)) {
    for (var i = 0; i < this._boardDef.pins.length; i++) {
      if (this._boardDef.pins[i].gpio === gpioNum) {
        return this._boardDef.pins[i].name;
      }
    }
  }
  return 'G' + gpioNum;
};

CircuitEditor.prototype.onGpioChange = function(pinNum, value) {
  this.notifyGpioChange(this._gpioToPinName(pinNum), value);
};

CircuitEditor.prototype.onPwmChange = function(pinNum, duty, freq) {
  this.notifyPwmChange(this._gpioToPinName(pinNum), duty, freq);
};

CircuitEditor.prototype.getAdcValue = function(pinNum) {
  return this.readAdc(this._gpioToPinName(pinNum));
};

CircuitEditor.prototype.getDigitalInput = function(pinNum) {
  return this.readDigital(this._gpioToPinName(pinNum));
};

CircuitEditor.prototype.setMode = function(mode) {
  this._mode = mode;
  this.svg.style.cursor = (mode === 'wire') ? 'crosshair' : '';
};

CircuitEditor.prototype.deleteSelected = function() {
  if (!this._selected) return;
  if (this._selected.type === 'component') {
    this.removeComponent(this._selected.id);
  } else if (this._selected.type === 'wire') {
    this.removeWire(this._selected.id);
  }
  this._selected = null;
};

CircuitEditor.prototype.resetComponents = function() {
  var comps = this._components;
  Object.keys(comps).forEach(function(id) {
    var c = comps[id];
    if (typeof c.onGpioChange === 'function') c.onGpioChange(null, 0);
  });
};
