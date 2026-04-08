/**
 * circuit.js
 * ESP32-C3 웹 시뮬레이터 - SVG 기반 회로 편집기
 *
 * 기능:
 *   - ESP32-C3 Super Mini 보드 SVG 렌더링
 *   - 컴포넌트 배치/이동 (드래그앤드롭)
 *   - 와이어 연결 (핀 클릭 → 직각 경로 SVG path)
 *   - 회로 직렬화 / 불러오기
 *   - 템플릿 로드
 */

// ─────────────────────────────────────────────────────────────────────────────
// ESP32-C3 Super Mini 보드 핀 정의
// ─────────────────────────────────────────────────────────────────────────────
var ESP32C3_BOARD_DEF = {
  name: 'ESP32-C3 Super Mini',
  width:  90,   // 보드 SVG 너비 (px)
  height: 200,  // 보드 SVG 높이 (px)

  // 핀 목록: { name, x, y, type, gpioNum }
  pins: [
    // 왼쪽 열 (위→아래)
    { name: '5V',   x: 8,  y: 20,  type: 'power',   gpio: null },
    { name: 'GND',  x: 8,  y: 36,  type: 'gnd',     gpio: null },
    { name: '3V3',  x: 8,  y: 52,  type: 'power',   gpio: null },
    { name: 'G4',   x: 8,  y: 68,  type: 'digital', gpio: 4    },
    { name: 'G5',   x: 8,  y: 84,  type: 'digital', gpio: 5    },
    { name: 'G6',   x: 8,  y: 100, type: 'digital', gpio: 6    },
    { name: 'G7',   x: 8,  y: 116, type: 'digital', gpio: 7    },
    { name: 'G8',   x: 8,  y: 132, type: 'digital', gpio: 8    }, // 내장 LED (Active LOW)
    { name: 'G9',   x: 8,  y: 148, type: 'digital', gpio: 9    }, // 부팅핀 주의
    { name: 'G10',  x: 8,  y: 164, type: 'digital', gpio: 10   },
    // 오른쪽 열 (위→아래)
    { name: 'G0',   x: 82, y: 20,  type: 'digital', gpio: 0    }, // 부팅핀 주의
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
// 와이어 색상 팔레트
// ─────────────────────────────────────────────────────────────────────────────
var WIRE_COLORS = [
  '#FF5722', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
  '#00BCD4', '#FFEB3B', '#E91E63', '#8BC34A', '#03A9F4'
];
var _wireColorIdx = 0;

function nextWireColor() {
  var c = WIRE_COLORS[_wireColorIdx % WIRE_COLORS.length];
  _wireColorIdx++;
  return c;
}


// ─────────────────────────────────────────────────────────────────────────────
// CircuitEditor 클래스
// ─────────────────────────────────────────────────────────────────────────────
/**
 * SVG 기반 회로 편집기
 * @param {SVGElement} svgElement - 편집기가 렌더링될 SVG 루트 요소
 * @param {Object}     options    - { width, height, gridSize }
 */
function CircuitEditor(svgElement, options) {
  options = options || {};

  this.svg       = svgElement;
  this.width     = options.width    || 1200;
  this.height    = options.height   || 800;
  this.gridSize  = options.gridSize || 10;

  // 레이어 구조 (SVG 그룹)
  this._layerGrid       = null;
  this._layerBoard      = null;
  this._layerWires      = null;
  this._layerComponents = null;
  this._layerOverlay    = null;

  // 컴포넌트 맵: { id → ComponentBase 인스턴스 }
  this._components = {};

  // 와이어 목록
  this._wires = [];

  // 와이어 연결 진행 상태
  this._wireStart = null;
  this._tempWire  = null;

  // 드래그 상태
  this._drag = null;

  // 선택된 요소
  this._selected = null;

  // 줌
  this._zoom = 1.0;

  // 와이어 ID 카운터
  this._wireIdCounter = 0;

  // 보드 정보
  this._boardG   = null;
  this._boardX   = 0;
  this._boardY   = 0;
  this._boardDef = null;

  this._init();
}

/**
 * SVG 초기화
 */
CircuitEditor.prototype._init = function() {
  var svg = this.svg;
  var self = this;

  svg.setAttribute('width',   this.width);
  svg.setAttribute('height',  this.height);
  svg.setAttribute('viewBox', '0 0 ' + this.width + ' ' + this.height);

  // 배경
  var bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#1A1A2E');
  svg.appendChild(bg);

  // 레이어 생성
  this._layerGrid       = this._createLayer('layer-grid');
  this._layerBoard      = this._createLayer('layer-board');
  this._layerWires      = this._createLayer('layer-wires');
  this._layerComponents = this._createLayer('layer-components');
  this._layerOverlay    = this._createLayer('layer-overlay');

  this._drawGrid();

  svg.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
  svg.addEventListener('mouseup',   function(e) { self._onMouseUp(e);   });
  svg.addEventListener('click',     function(e) { self._onSvgClick(e);  });
  svg.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    self._cancelWire();
    self._deselect();
  });

  document.addEventListener('keydown', function(e) { self._onKeyDown(e); });
};

CircuitEditor.prototype._createLayer = function(id) {
  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', id);
  this.svg.appendChild(g);
  return g;
};

CircuitEditor.prototype._drawGrid = function() {
  var layer = this._layerGrid;
  var gs = this.gridSize;
  var w  = this.width;
  var h  = this.height;

  var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  var pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
  pattern.setAttribute('id', 'grid-pattern');
  pattern.setAttribute('width',  gs);
  pattern.setAttribute('height', gs);
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');

  var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('cx', 0); dot.setAttribute('cy', 0); dot.setAttribute('r', 0.5);
  dot.setAttribute('fill', 'rgba(255,255,255,0.15)');
  pattern.appendChild(dot);
  defs.appendChild(pattern);
  this.svg.insertBefore(defs, this.svg.firstChild);

  var gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  gridRect.setAttribute('width', w);
  gridRect.setAttribute('height', h);
  gridRect.setAttribute('fill', 'url(#grid-pattern)');
  layer.appendChild(gridRect);
};


// ─────────────────────────────────────────────────────────────────────────────
// 보드 렌더링
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ESP32-C3 Super Mini 보드를 SVG로 렌더링합니다.
 * @param {Object} boardDef - 보드 핀 정의 (ESP32C3_BOARD_DEF)
 * @param {number} x        - 배치 X 좌표
 * @param {number} y        - 배치 Y 좌표
 */
CircuitEditor.prototype.renderBoard = function(boardDef, x, y) {
  boardDef = boardDef || ESP32C3_BOARD_DEF;
  x = (x !== undefined) ? x : 50;
  y = (y !== undefined) ? y : 50;

  var self = this;
  var layer = this._layerBoard;
  var bw = boardDef.width;
  var bh = boardDef.height;
  var NS = 'http://www.w3.org/2000/svg';

  var g = document.createElementNS(NS, 'g');
  g.setAttribute('id', 'board-esp32c3');
  g.setAttribute('transform', 'translate(' + x + ',' + y + ')');

  // PCB 기판 본체
  var pcb = document.createElementNS(NS, 'rect');
  pcb.setAttribute('x', 0); pcb.setAttribute('y', 0);
  pcb.setAttribute('width', bw); pcb.setAttribute('height', bh);
  pcb.setAttribute('rx', 6);
  pcb.setAttribute('fill', '#1a2b1a');
  pcb.setAttribute('stroke', '#2d4a2d');
  pcb.setAttribute('stroke-width', '1.5');
  g.appendChild(pcb);

  // USB-C 커넥터 (상단)
  var usb = document.createElementNS(NS, 'rect');
  usb.setAttribute('x', bw / 2 - 8); usb.setAttribute('y', -6);
  usb.setAttribute('width', 16); usb.setAttribute('height', 10);
  usb.setAttribute('rx', 3);
  usb.setAttribute('fill', '#888'); usb.setAttribute('stroke', '#aaa');
  g.appendChild(usb);

  // Wi-Fi 안테나
  var ant = document.createElementNS(NS, 'rect');
  ant.setAttribute('x', bw - 12); ant.setAttribute('y', 0);
  ant.setAttribute('width', 10); ant.setAttribute('height', 30);
  ant.setAttribute('rx', 2);
  ant.setAttribute('fill', '#2a3f2a'); ant.setAttribute('stroke', '#3a5f3a');
  g.appendChild(ant);
  for (var ai = 0; ai < 5; ai++) {
    var aline = document.createElementNS(NS, 'rect');
    aline.setAttribute('x', bw - 11); aline.setAttribute('y', 4 + ai * 5);
    aline.setAttribute('width', 8); aline.setAttribute('height', 2);
    aline.setAttribute('fill', '#B8860B');
    g.appendChild(aline);
  }

  // ESP32-C3 칩
  var chip = document.createElementNS(NS, 'rect');
  chip.setAttribute('x', 20); chip.setAttribute('y', 60);
  chip.setAttribute('width', 50); chip.setAttribute('height', 50);
  chip.setAttribute('rx', 3);
  chip.setAttribute('fill', '#111'); chip.setAttribute('stroke', '#333');
  g.appendChild(chip);

  var chipLabel = document.createElementNS(NS, 'text');
  chipLabel.setAttribute('x', 45); chipLabel.setAttribute('y', 85);
  chipLabel.setAttribute('text-anchor', 'middle');
  chipLabel.setAttribute('font-size', '6'); chipLabel.setAttribute('fill', '#888');
  chipLabel.setAttribute('font-family', 'monospace');
  chipLabel.textContent = 'ESP32-C3';
  g.appendChild(chipLabel);

  var chipLabel2 = document.createElementNS(NS, 'text');
  chipLabel2.setAttribute('x', 45); chipLabel2.setAttribute('y', 95);
  chipLabel2.setAttribute('text-anchor', 'middle');
  chipLabel2.setAttribute('font-size', '5'); chipLabel2.setAttribute('fill', '#666');
  chipLabel2.setAttribute('font-family', 'monospace');
  chipLabel2.textContent = 'Super Mini';
  g.appendChild(chipLabel2);

  // BOOT / RST 버튼
  var btns = [['BOOT', 20, 130], ['RST', 50, 130]];
  btns.forEach(function(btn) {
    var br = document.createElementNS(NS, 'rect');
    br.setAttribute('x', btn[1]); br.setAttribute('y', btn[2]);
    br.setAttribute('width', 12); br.setAttribute('height', 8);
    br.setAttribute('rx', 2);
    br.setAttribute('fill', '#333'); br.setAttribute('stroke', '#555');
    g.appendChild(br);
    var bl = document.createElementNS(NS, 'text');
    bl.setAttribute('x', btn[1] + 6); bl.setAttribute('y', btn[2] + 16);
    bl.setAttribute('text-anchor', 'middle');
    bl.setAttribute('font-size', '5'); bl.setAttribute('fill', '#777');
    bl.setAttribute('font-family', 'monospace');
    bl.textContent = btn[0];
    g.appendChild(bl);
  });

  // 내장 LED (G8)
  var ledDot = document.createElementNS(NS, 'circle');
  ledDot.setAttribute('cx', 32); ledDot.setAttribute('cy', 150);
  ledDot.setAttribute('r', 3);
  ledDot.setAttribute('fill', '#00E5FF');
  ledDot.setAttribute('id', 'board-builtin-led');
  g.appendChild(ledDot);
  var ledLbl = document.createElementNS(NS, 'text');
  ledLbl.setAttribute('x', 38); ledLbl.setAttribute('y', 153);
  ledLbl.setAttribute('font-size', '5'); ledLbl.setAttribute('fill', '#aaa');
  ledLbl.textContent = 'LED(G8)';
  g.appendChild(ledLbl);

  // 핀 렌더링
  boardDef.pins.forEach(function(pin) {
    var isLeft = (pin.x < bw / 2);

    // 핀 패드 사각형
    var pad = document.createElementNS(NS, 'rect');
    var ps  = 6;
    pad.setAttribute('x', pin.x - ps / 2); pad.setAttribute('y', pin.y - ps / 2);
    pad.setAttribute('width', ps); pad.setAttribute('height', ps);
    pad.setAttribute('rx', 1);
    pad.setAttribute('fill', '#B8860B'); pad.setAttribute('stroke', '#8B6914');
    pad.setAttribute('stroke-width', '0.5');
    g.appendChild(pad);

    // 연결점 원
    var pColors = { power:'#F44336', gnd:'#aaa', digital:'#4CAF50', i2c:'#9C27B0', analog:'#FF9800' };
    var pinColor = pColors[pin.type] || '#9E9E9E';

    var pinCircle = document.createElementNS(NS, 'circle');
    pinCircle.setAttribute('cx', pin.x); pinCircle.setAttribute('cy', pin.y); pinCircle.setAttribute('r', 4.5);
    pinCircle.setAttribute('fill', pinColor); pinCircle.setAttribute('fill-opacity', '0.6');
    pinCircle.setAttribute('stroke', '#fff'); pinCircle.setAttribute('stroke-width', '0.8');
    pinCircle.setAttribute('class', 'board-pin');
    pinCircle.setAttribute('data-pin', pin.name);
    pinCircle.setAttribute('data-gpio', pin.gpio !== null ? pin.gpio : '');
    pinCircle.setAttribute('style', 'cursor: crosshair;');

    var title = document.createElementNS(NS, 'title');
    title.textContent = pin.name + (pin.gpio !== null ? ' (GPIO' + pin.gpio + ')' : '');
    pinCircle.appendChild(title);

    // 클릭 이벤트
    pinCircle.addEventListener('click', function(e) {
      e.stopPropagation();
      self._onPinClick({
        boardPin: pin.name,
        x: x + pin.x,
        y: y + pin.y
      });
    });
    g.appendChild(pinCircle);

    // 핀 이름 라벨
    var label = document.createElementNS(NS, 'text');
    label.setAttribute('y', pin.y + 3);
    label.setAttribute('font-size', '6'); label.setAttribute('fill', '#ccc');
    label.setAttribute('font-family', 'monospace');
    if (isLeft) {
      label.setAttribute('x', pin.x + 8); label.setAttribute('text-anchor', 'start');
    } else {
      label.setAttribute('x', pin.x - 8); label.setAttribute('text-anchor', 'end');
    }
    label.textContent = pin.name;
    if (pin.name === 'G8')             label.setAttribute('fill', '#00E5FF');
    if (pin.name === 'G0' || pin.name === 'G9') label.setAttribute('fill', '#FF9800');
    g.appendChild(label);
  });

  // 보드 이름
  var boardNameEl = document.createElementNS(NS, 'text');
  boardNameEl.setAttribute('x', bw / 2); boardNameEl.setAttribute('y', bh - 5);
  boardNameEl.setAttribute('text-anchor', 'middle');
  boardNameEl.setAttribute('font-size', '6'); boardNameEl.setAttribute('fill', '#666');
  boardNameEl.setAttribute('font-family', 'monospace');
  boardNameEl.textContent = 'ESP32-C3 Super Mini';
  g.appendChild(boardNameEl);

  layer.appendChild(g);
  this._boardG   = g;
  this._boardX   = x;
  this._boardY   = y;
  this._boardDef = boardDef;
};

/**
 * 보드 핀의 SVG 절대 좌표 반환
 * @param {string} pinName
 * @returns {{ x, y }|null}
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
 * 컴포넌트를 회로에 추가합니다.
 * @param {string} type   - 컴포넌트 타입 (예: "LED")
 * @param {number} x      - X 좌표
 * @param {number} y      - Y 좌표
 * @param {Object} config - 컴포넌트 설정
 * @returns {ComponentBase|null}
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

/**
 * 컴포넌트 제거 (연결된 와이어 포함)
 * @param {string} id
 */
CircuitEditor.prototype.removeComponent = function(id) {
  var comp = this._components[id];
  if (!comp) return;

  var self = this;
  var toRemove = this._wires
    .filter(function(w) { return w.from.compId === id || w.to.compId === id; })
    .map(function(w) { return w.id; });
  toRemove.forEach(function(wid) { self.removeWire(wid); });

  if (comp.element && comp.element.parentNode) {
    comp.element.parentNode.removeChild(comp.element);
  }
  delete this._components[id];
};

/**
 * ID로 컴포넌트 조회
 * @param {string} id
 * @returns {ComponentBase|null}
 */
CircuitEditor.prototype.getComponent = function(id) {
  return this._components[id] || null;
};

CircuitEditor.prototype.getAllComponents = function() {
  return Object.values(this._components);
};


// ─────────────────────────────────────────────────────────────────────────────
// 드래그앤드롭
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 컴포넌트에 드래그 기능을 활성화합니다.
 * @param {ComponentBase} comp
 */
CircuitEditor.prototype.enableDrag = function(comp) {
  var self = this;
  var el   = comp.element;
  if (!el) return;

  el.addEventListener('mousedown', function(e) {
    if (e.target.closest && e.target.closest('.pin-point')) return;
    if (e.button !== 0) return;
    e.stopPropagation();

    var svgPt = self._svgPoint(e);
    self._drag = {
      compId:  comp.id,
      offsetX: svgPt.x - comp.x,
      offsetY: svgPt.y - comp.y
    };
    comp.select();
    self._selected = { type: 'component', id: comp.id };
  });
};

CircuitEditor.prototype._svgPoint = function(e) {
  var rect = this.svg.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / this._zoom,
    y: (e.clientY - rect.top)  / this._zoom
  };
};

CircuitEditor.prototype._onMouseMove = function(e) {
  var pt = this._svgPoint(e);

  if (this._drag) {
    var comp = this._components[this._drag.compId];
    if (comp) {
      var nx = Math.round((pt.x - this._drag.offsetX) / this.gridSize) * this.gridSize;
      var ny = Math.round((pt.y - this._drag.offsetY) / this.gridSize) * this.gridSize;
      comp.move(nx, ny);
      this._updateWiresForComponent(comp.id);
    }
  }

  if (this._wireStart && this._tempWire) {
    var d = this._buildOrthogonalPath(this._wireStart.x, this._wireStart.y, pt.x, pt.y);
    this._tempWire.setAttribute('d', d);
  }
};

CircuitEditor.prototype._onMouseUp = function(e) {
  if (this._drag) this._drag = null;
};

CircuitEditor.prototype._onSvgClick = function(e) {
  if (e.target === this.svg) {
    this._deselect();
    this._cancelWire();
  }
};

CircuitEditor.prototype._onKeyDown = function(e) {
  if ((e.key === 'Delete' || e.key === 'Backspace') && this._selected) {
    if (this._selected.type === 'component') {
      this.removeComponent(this._selected.id);
    } else if (this._selected.type === 'wire') {
      this.removeWire(this._selected.id);
    }
    this._selected = null;
  }
  if (e.key === 'Escape') {
    this._cancelWire();
    this._deselect();
  }
};

CircuitEditor.prototype._deselect = function() {
  if (this._selected && this._selected.type === 'component') {
    var comp = this._components[this._selected.id];
    if (comp) comp.deselect();
  }
  this._selected = null;
};


// ─────────────────────────────────────────────────────────────────────────────
// 핀 이벤트 및 와이어 연결
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

/**
 * 핀 클릭 처리 (와이어 시작 또는 끝)
 * @param {{ compId?, boardPin?, pinName?, x, y }} pinInfo
 */
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
  line.setAttribute('d', 'M' + x + ',' + y);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', '#FFFF00');
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-dasharray', '5,3');
  line.setAttribute('pointer-events', 'none');
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
  var d  = this._buildOrthogonalPath(sx, sy, ex, ey);

  var wireId = 'wire_' + (++this._wireIdCounter);

  var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('id', wireId);
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  var wireGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  wireGroup.setAttribute('id', wireId + '_g');
  wireGroup.setAttribute('class', 'wire-group');
  wireGroup.appendChild(path);
  wireGroup.appendChild(this._makeWireDot(sx, sy, color));
  wireGroup.appendChild(this._makeWireDot(ex, ey, color));

  var self = this;
  wireGroup.addEventListener('click', function(e) {
    e.stopPropagation();
    self._selectWire(wireId);
  });

  this._layerWires.appendChild(wireGroup);

  var wire = { id: wireId, from: startPin, to: endPin, color: color, element: wireGroup };
  this._wires.push(wire);
  this._applyWireConnection(startPin, endPin);
  this._cancelWire();
};

CircuitEditor.prototype._makeWireDot = function(x, y, color) {
  var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 3.5);
  c.setAttribute('fill', '#4CAF50');
  c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', '1');
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

  if (comp && pinName && boardPin) {
    comp.setConnection(pinName, boardPin);
  }
};

/**
 * 직각(L자형) SVG 경로 문자열 생성
 * @param {number} x1 시작 X
 * @param {number} y1 시작 Y
 * @param {number} x2 끝 X
 * @param {number} y2 끝 Y
 * @returns {string}
 */
CircuitEditor.prototype._buildOrthogonalPath = function(x1, y1, x2, y2) {
  var mx = x1 + (x2 - x1) / 2;
  return 'M' + x1 + ',' + y1 +
         ' L' + mx + ',' + y1 +
         ' L' + mx + ',' + y2 +
         ' L' + x2 + ',' + y2;
};

/**
 * 와이어를 제거합니다.
 * @param {string} wireId
 */
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
    path.setAttribute('stroke', '#2196F3');
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

    var path = wire.element.querySelector('path');
    if (path) path.setAttribute('d', self._buildOrthogonalPath(sx, sy, ex, ey));

    var dots = wire.element.querySelectorAll('circle');
    if (dots[0]) { dots[0].setAttribute('cx', sx); dots[0].setAttribute('cy', sy); }
    if (dots[1]) { dots[1].setAttribute('cx', ex); dots[1].setAttribute('cy', ey); }
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// 전기적 연결 분석
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 특정 핀에 전기적으로 연결된 모든 핀을 반환합니다. (BFS)
 * @param {{ compId?, boardPin?, pinName? }} pin
 * @returns {Array}
 */
CircuitEditor.prototype.getConnectedPins = function(pin) {
  var visited = {};
  var result  = [];
  var self    = this;

  function pinKey(p) {
    if (p.boardPin) return 'board:' + p.boardPin;
    return 'comp:' + p.compId + ':' + p.pinName;
  }

  function traverse(p) {
    var key = pinKey(p);
    if (visited[key]) return;
    visited[key] = true;
    result.push(p);
    self._wires.forEach(function(wire) {
      if (pinKey(wire.from) === key) traverse(wire.to);
      if (pinKey(wire.to)   === key) traverse(wire.from);
    });
  }

  traverse(pin);
  return result;
};

/**
 * 특정 보드 핀에 연결된 컴포넌트 목록 반환
 * @param {string} boardPinName
 * @returns {Array<{ comp, pinName }>}
 */
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

/**
 * 현재 회로를 JSON으로 직렬화합니다.
 * @returns {Object}
 */
CircuitEditor.prototype.toJSON = function() {
  var components = [];
  var self = this;
  Object.keys(this._components).forEach(function(id) {
    components.push(self._components[id].toJSON());
  });

  var wires = this._wires.map(function(w) {
    return {
      id:    w.id,
      from:  { compId: w.from.compId, pinName: w.from.pinName, boardPin: w.from.boardPin },
      to:    { compId: w.to.compId,   pinName: w.to.pinName,   boardPin: w.to.boardPin },
      color: w.color
    };
  });

  return { version: '1.0', board: 'ESP32-C3-SuperMini', components: components, wires: wires };
};

/**
 * JSON에서 회로를 복원합니다.
 * @param {Object} data
 */
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
      if (from.boardPin) { var bp1 = self.getBoardPinPos(from.boardPin); if (bp1) { fx = bp1.x; fy = bp1.y; } }
      else if (from.compId) { var c1 = self._components[from.compId]; if (c1) { var p1 = self._getPinAbsPos(c1, from.pinName); fx = p1.x; fy = p1.y; } }
      if (to.boardPin)   { var bp2 = self.getBoardPinPos(to.boardPin);   if (bp2) { tx = bp2.x; ty = bp2.y; } }
      else if (to.compId) { var c2 = self._components[to.compId]; if (c2) { var p2 = self._getPinAbsPos(c2, to.pinName); tx = p2.x; ty = p2.y; } }

      var color = wData.color || nextWireColor();
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', self._buildOrthogonalPath(fx, fy, tx, ty));
      path.setAttribute('fill', 'none'); path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2'); path.setAttribute('stroke-linecap', 'round');

      var wireGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wireGroup.setAttribute('id', wData.id + '_g'); wireGroup.setAttribute('class', 'wire-group');
      wireGroup.appendChild(path);
      wireGroup.appendChild(self._makeWireDot(fx, fy, color));
      wireGroup.appendChild(self._makeWireDot(tx, ty, color));

      wireGroup.addEventListener('click', (function(wid) {
        return function(e) { e.stopPropagation(); self._selectWire(wid); };
      })(wData.id));

      self._layerWires.appendChild(wireGroup);
      self._wires.push({ id: wData.id, from: from, to: to, color: color, element: wireGroup });
      self._applyWireConnection(from, to);
    });
  }
};

/**
 * 회로 전체 초기화
 */
CircuitEditor.prototype.clearAll = function() {
  var self = this;
  Object.keys(this._components).forEach(function(id) {
    var comp = self._components[id];
    if (comp.element && comp.element.parentNode) comp.element.parentNode.removeChild(comp.element);
  });
  this._components = {};

  this._wires.forEach(function(w) {
    if (w.element && w.element.parentNode) w.element.parentNode.removeChild(w.element);
  });
  this._wires = [];

  this._cancelWire();
  this._deselect();
};

/**
 * 템플릿에서 회로를 로드합니다.
 * @param {Object} templateData - templates.js의 템플릿 객체
 */
CircuitEditor.prototype.loadTemplate = function(templateData) {
  if (!templateData) return;
  this.clearAll();

  var self    = this;
  var compMap = {};

  if (templateData.components) {
    templateData.components.forEach(function(cDef) {
      var comp = self.addComponent(cDef.type, cDef.x, cDef.y, cDef.config || {});
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
      if (from.boardPin) { var bp1 = self.getBoardPinPos(from.boardPin); if (bp1) { fx = bp1.x; fy = bp1.y; from.x = fx; from.y = fy; } }
      else if (from.compId) { var c1 = self._components[from.compId]; if (c1) { var p1 = self._getPinAbsPos(c1, from.pinName); fx = p1.x; fy = p1.y; from.x = fx; from.y = fy; } }
      if (to.boardPin)   { var bp2 = self.getBoardPinPos(to.boardPin);   if (bp2) { tx = bp2.x; ty = bp2.y; to.x = tx; to.y = ty; } }
      else if (to.compId) { var c2 = self._components[to.compId]; if (c2) { var p2 = self._getPinAbsPos(c2, to.pinName); tx = p2.x; ty = p2.y; to.x = tx; to.y = ty; } }

      var color  = wDef.color || nextWireColor();
      var d      = self._buildOrthogonalPath(fx, fy, tx, ty);
      var wireId = 'wire_' + (++self._wireIdCounter);

      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d); path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color); path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-linecap', 'round');

      var wireGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wireGroup.setAttribute('id', wireId + '_g'); wireGroup.setAttribute('class', 'wire-group');
      wireGroup.appendChild(path);
      wireGroup.appendChild(self._makeWireDot(fx, fy, color));
      wireGroup.appendChild(self._makeWireDot(tx, ty, color));

      wireGroup.addEventListener('click', (function(wid) {
        return function(e) { e.stopPropagation(); self._selectWire(wid); };
      })(wireId));

      self._layerWires.appendChild(wireGroup);
      self._wires.push({ id: wireId, from: from, to: to, color: color, element: wireGroup });
      self._applyWireConnection(from, to);
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// 시뮬레이터 연동 인터페이스
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GPIO 출력 변화를 연결된 컴포넌트에 전파합니다.
 * @param {string} boardPinName
 * @param {number} value - 0 또는 1
 */
CircuitEditor.prototype.notifyGpioChange = function(boardPinName, value) {
  this.getComponentsOnPin(boardPinName).forEach(function(e) {
    if (e.comp && typeof e.comp.onGpioChange === 'function') {
      e.comp.onGpioChange(boardPinName, value);
    }
  });
};

/**
 * PWM 변화를 연결된 컴포넌트에 전파합니다.
 * @param {string} boardPinName
 * @param {number} duty
 * @param {number} freq
 */
CircuitEditor.prototype.notifyPwmChange = function(boardPinName, duty, freq) {
  this.getComponentsOnPin(boardPinName).forEach(function(e) {
    if (e.comp && typeof e.comp.onPwmChange === 'function') {
      e.comp.onPwmChange(boardPinName, duty, freq);
    }
  });
};

/**
 * ADC 읽기
 * @param {string} boardPinName
 * @returns {number} 0~4095
 */
CircuitEditor.prototype.readAdc = function(boardPinName) {
  var entries = this.getComponentsOnPin(boardPinName);
  for (var i = 0; i < entries.length; i++) {
    if (typeof entries[i].comp.getAdcValue === 'function') {
      return entries[i].comp.getAdcValue(boardPinName);
    }
  }
  return 0;
};

/**
 * 디지털 입력 읽기
 * @param {string} boardPinName
 * @returns {number} 0 또는 1
 */
CircuitEditor.prototype.readDigital = function(boardPinName) {
  var entries = this.getComponentsOnPin(boardPinName);
  for (var i = 0; i < entries.length; i++) {
    if (typeof entries[i].comp.getDigitalValue === 'function') {
      return entries[i].comp.getDigitalValue(boardPinName);
    }
  }
  return 1; // INPUT_PULLUP 기준 기본값 HIGH
};

// ─────────────────────────────────────────────────────────────────────────────
// app.js 연동 인터페이스
// ─────────────────────────────────────────────────────────────────────────────

/** app.js simProxy.onGpioChange(pinNum, value) 인터페이스 */
CircuitEditor.prototype.onGpioChange = function(pinNum, value) {
  var pinName = 'G' + pinNum;
  this.notifyGpioChange(pinName, value);
};

/** app.js simProxy.onPwmChange(pinNum, duty, freq) 인터페이스 */
CircuitEditor.prototype.onPwmChange = function(pinNum, duty, freq) {
  var pinName = 'G' + pinNum;
  this.notifyPwmChange(pinName, duty, freq);
};

/** app.js simProxy.readAdc(pinNum) 인터페이스 */
CircuitEditor.prototype.getAdcValue = function(pinNum) {
  return this.readAdc('G' + pinNum);
};

/** app.js simProxy.readDigital(pinNum) 인터페이스 */
CircuitEditor.prototype.getDigitalInput = function(pinNum) {
  return this.readDigital('G' + pinNum);
};

/** 모드 설정 (wire | select) */
CircuitEditor.prototype.setMode = function(mode) {
  this._mode = mode;
};

/** 선택된 항목 삭제 */
CircuitEditor.prototype.deleteSelected = function() {
  if (!this._selected) return;
  if (this._selected.type === 'component') {
    this.removeComponent(this._selected.id);
  } else if (this._selected.type === 'wire') {
    this.removeWire(this._selected.id);
  }
  this._selected = null;
};

/** 모든 컴포넌트 시각 상태 초기화 */
CircuitEditor.prototype.resetComponents = function() {
  var comps = this._components;
  Object.keys(comps).forEach(function(id) {
    var c = comps[id];
    if (typeof c.onGpioChange === 'function') c.onGpioChange(null, 0);
  });
};
