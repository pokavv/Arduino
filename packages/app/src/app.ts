// 모든 sim elements 등록
import '@sim/elements';

import { CircuitCanvas } from './canvas/circuit-canvas.js';
import { CodeEditor } from './editor/code-editor.js';
import { circuitStore } from './stores/circuit-store.js';
import { simController } from './stores/sim-controller.js';

const API_BASE = '/api';

interface BoardInfo {
  id: string;
  name: string;
  vendor: string;
  mcu: string;
}

interface TemplateInfo {
  id: string;
  name: string;
  category: string;
  boardId: string;
  description: string;
}

interface TemplateDetail extends TemplateInfo {
  components: object[];
  code: string;
}

/**
 * 메인 앱 — UI 레이아웃 초기화 및 이벤트 바인딩
 */
async function initApp() {
  // DOM 구조 생성
  document.body.innerHTML = APP_HTML;
  document.body.style.cssText = 'margin:0;padding:0;background:#0a0a0e;color:#ccc;font-family:system-ui;';

  // 보드/템플릿 로드
  const [boards, templates] = await Promise.all([
    fetch(`${API_BASE}/boards`).then(r => r.json()).catch(() => []) as Promise<BoardInfo[]>,
    fetch(`${API_BASE}/templates`).then(r => r.json()).catch(() => []) as Promise<TemplateInfo[]>,
  ]);

  // 보드 선택
  const boardSelect = document.getElementById('board-select') as HTMLSelectElement;
  for (const b of boards) {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = `${b.name}`;
    if (b.id === 'arduino-uno') opt.selected = true;
    boardSelect.appendChild(opt);
  }
  boardSelect.addEventListener('change', () => {
    circuitStore.setBoard(boardSelect.value);
  });

  // 템플릿 선택
  const tplSelect = document.getElementById('template-select') as HTMLSelectElement;
  const categories = [...new Set(templates.map(t => t.category))];
  for (const cat of categories) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = cat;
    for (const t of templates.filter(t => t.category === cat)) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      optgroup.appendChild(opt);
    }
    tplSelect.appendChild(optgroup);
  }
  tplSelect.addEventListener('change', async () => {
    const id = tplSelect.value;
    if (!id) return;
    const detail = await fetch(`${API_BASE}/templates/${id}`).then(r => r.json()) as TemplateDetail;
    circuitStore.loadTemplate(detail);
    tplSelect.value = '';
  });

  // 컴포넌트 팔레트 (드래그&드롭 추가용)
  const palette = document.getElementById('palette')!;
  const COMPONENTS = [
    { type: 'led', label: 'LED', icon: '💡' },
    { type: 'rgb-led', label: 'RGB LED', icon: '🌈' },
    { type: 'button', label: 'Button', icon: '🔘' },
    { type: 'resistor', label: 'Resistor', icon: '〰️' },
    { type: 'buzzer', label: 'Buzzer', icon: '🔊' },
    { type: 'potentiometer', label: 'Pot.', icon: '🔄' },
    { type: 'servo', label: 'Servo', icon: '⚙️' },
    { type: 'dht', label: 'DHT22', icon: '🌡️' },
    { type: 'ultrasonic', label: 'HCSR04', icon: '📡' },
    { type: 'lcd', label: 'LCD', icon: '🖥️' },
    { type: 'oled', label: 'OLED', icon: '📺' },
    { type: 'seven-segment', label: '7-Seg', icon: '7️⃣' },
    { type: 'neopixel', label: 'NeoPixel', icon: '✨' },
  ];

  for (const comp of COMPONENTS) {
    const item = document.createElement('div');
    item.className = 'palette-item';
    item.innerHTML = `<span class="palette-icon">${comp.icon}</span><span>${comp.label}</span>`;
    item.title = `드래그하여 추가: ${comp.label}`;
    item.draggable = true;
    item.dataset.type = comp.type;

    item.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('component-type', comp.type);
    });

    // 더블클릭으로도 추가
    item.addEventListener('dblclick', () => {
      addComponent(comp.type, 200, 200);
    });

    palette.appendChild(item);
  }

  // 캔버스 설정
  const canvasEl = document.getElementById('canvas')!;
  const canvas = new CircuitCanvas(canvasEl);

  // 캔버스에 드롭
  canvasEl.addEventListener('dragover', (e) => e.preventDefault());
  canvasEl.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer?.getData('component-type');
    if (!type) return;
    const rect = canvasEl.getBoundingClientRect();
    addComponent(type, e.clientX - rect.left - 30, e.clientY - rect.top - 30);
  });

  // 코드 에디터
  const editorEl = document.getElementById('editor')!;
  const _editor = new CodeEditor(editorEl);

  // 시리얼 모니터
  const serialOutput = document.getElementById('serial-output')!;
  circuitStore.subscribe(() => {
    serialOutput.textContent = circuitStore.serialOutput;
    serialOutput.scrollTop = serialOutput.scrollHeight;
  });

  // 실행 버튼들
  document.getElementById('btn-run')!.addEventListener('click', () => {
    if (circuitStore.simState === 'running') {
      simController.stop();
      (document.getElementById('btn-run') as HTMLButtonElement).textContent = '▶ 실행';
    } else {
      circuitStore.clearSerial();
      simController.start();
      (document.getElementById('btn-run') as HTMLButtonElement).textContent = '⏹ 정지';
    }
  });

  document.getElementById('btn-clear-serial')!.addEventListener('click', () => {
    circuitStore.clearSerial();
  });

  document.getElementById('btn-zoom-in')!.addEventListener('click', () => canvas.zoomIn());
  document.getElementById('btn-zoom-out')!.addEventListener('click', () => canvas.zoomOut());
  document.getElementById('btn-fit')!.addEventListener('click', () => canvas.fitView());

  // Delete key로 선택 컴포넌트 삭제
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const sel = circuitStore.selectedId;
      if (sel && document.activeElement?.tagName !== 'INPUT') {
        circuitStore.removeComponent(sel);
      }
    }
  });

  // 상태 구독 → UI 업데이트
  circuitStore.subscribe(() => {
    const state = circuitStore.simState;
    const runBtn = document.getElementById('btn-run') as HTMLButtonElement;
    runBtn.textContent = state === 'running' ? '⏹ 정지' : '▶ 실행';
    runBtn.className = `btn-run ${state}`;

    const statusEl = document.getElementById('status-indicator')!;
    statusEl.className = `status ${state}`;
    statusEl.title = state;
  });

  // 기본 템플릿 로드 (서버에서 못 받으면 기본값)
  if (boards.length === 0) {
    circuitStore.setBoard('arduino-uno');
  }

  console.log('Arduino Web Simulator 시작');
}

function addComponent(type: string, x: number, y: number) {
  const id = `${type}-${Date.now()}`;
  const DEFAULTS: Record<string, Record<string, unknown>> = {
    'led': { color: 'red' },
    'rgb-led': {},
    'button': {},
    'resistor': { ohms: 220 },
    'buzzer': {},
    'potentiometer': {},
    'servo': { angle: 90 },
    'dht': { model: 'DHT22', temperature: 25, humidity: 60 },
    'ultrasonic': { distanceCm: 20 },
    'lcd': { rows: 2, cols: 16, i2cAddress: 0x27 },
    'oled': { i2cAddress: 0x3C },
    'seven-segment': {},
    'neopixel': { count: 8 },
  };

  circuitStore.addComponent({
    id, type, x, y, rotation: 0,
    props: DEFAULTS[type] ?? {},
    connections: {},
  });
}

// ─── 앱 HTML 템플릿 ────────────────────────────────────────────

const APP_HTML = `
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #0a0a0e; color: #ccc; }

  #app {
    display: grid;
    grid-template-rows: 44px 1fr;
    grid-template-columns: 180px 1fr 320px;
    grid-template-areas:
      "toolbar toolbar toolbar"
      "palette canvas editor";
    height: 100vh;
    gap: 0;
  }

  /* 툴바 */
  #toolbar {
    grid-area: toolbar;
    background: #141418;
    border-bottom: 1px solid #282830;
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
  }
  .toolbar-logo {
    font-weight: 700;
    font-size: 15px;
    color: #4a9eff;
    margin-right: 8px;
    letter-spacing: -0.3px;
  }
  .toolbar-sep { width: 1px; height: 24px; background: #333; margin: 0 4px; }
  select.toolbar-select {
    background: #1e1e26;
    border: 1px solid #333;
    border-radius: 4px;
    color: #ccc;
    padding: 3px 6px;
    font-size: 12px;
    cursor: pointer;
  }
  .toolbar-btn {
    background: #1e1e26;
    border: 1px solid #333;
    border-radius: 4px;
    color: #aaa;
    padding: 3px 8px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
  }
  .toolbar-btn:hover { background: #2a2a36; color: #eee; }
  .btn-run {
    background: #1a4a1a;
    border-color: #2a7a2a;
    color: #4af44a;
    font-weight: 600;
    padding: 3px 12px;
  }
  .btn-run.running { background: #4a1a1a; border-color: #8a2a2a; color: #f44a4a; }
  .btn-run.error { background: #4a2a0a; border-color: #8a5a0a; color: #fa8; }
  .status {
    width: 8px; height: 8px; border-radius: 50%;
    background: #444;
    margin-left: auto;
  }
  .status.running { background: #4af44a; box-shadow: 0 0 6px #4af44a; }
  .status.error { background: #fa4; box-shadow: 0 0 6px #fa4; }

  /* 컴포넌트 팔레트 */
  #palette {
    grid-area: palette;
    background: #121216;
    border-right: 1px solid #222;
    overflow-y: auto;
    padding: 8px 4px;
  }
  .palette-title {
    font-size: 10px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 4px 8px 2px;
  }
  .palette-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 4px;
    cursor: grab;
    font-size: 11px;
    color: #aaa;
    transition: background 0.1s;
  }
  .palette-item:hover { background: #1e1e26; color: #eee; }
  .palette-item:active { cursor: grabbing; }
  .palette-icon { font-size: 14px; min-width: 18px; }

  /* 캔버스 */
  #canvas {
    grid-area: canvas;
    position: relative;
    overflow: hidden;
  }

  /* 오른쪽 패널 */
  #right-panel {
    grid-area: editor;
    background: #121216;
    border-left: 1px solid #222;
    display: grid;
    grid-template-rows: 1fr 180px;
    overflow: hidden;
  }

  #editor {
    min-height: 0;
    overflow: hidden;
  }

  #serial-panel {
    border-top: 1px solid #222;
    display: flex;
    flex-direction: column;
  }
  .serial-header {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    background: #0e0e14;
    border-bottom: 1px solid #222;
    font-size: 11px;
    color: #666;
    gap: 6px;
  }
  .serial-header span { font-weight: 600; color: #888; }
  #serial-output {
    flex: 1;
    overflow-y: auto;
    padding: 6px 10px;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 11px;
    color: #4af44a;
    background: #0a0a0e;
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>

<div id="app">
  <!-- 툴바 -->
  <div id="toolbar">
    <span class="toolbar-logo">⚡ Arduino Sim</span>
    <div class="toolbar-sep"></div>
    <select id="board-select" class="toolbar-select" title="보드 선택">
      <option value="">보드 선택...</option>
    </select>
    <select id="template-select" class="toolbar-select" title="예제 템플릿">
      <option value="">예제 불러오기...</option>
    </select>
    <div class="toolbar-sep"></div>
    <button id="btn-run" class="toolbar-btn btn-run">▶ 실행</button>
    <div class="toolbar-sep"></div>
    <button id="btn-zoom-in" class="toolbar-btn" title="확대">+</button>
    <button id="btn-zoom-out" class="toolbar-btn" title="축소">−</button>
    <button id="btn-fit" class="toolbar-btn" title="전체 보기">⊡</button>
    <div id="status-indicator" class="status" title="정지"></div>
  </div>

  <!-- 팔레트 -->
  <div id="palette">
    <div class="palette-title">부품 라이브러리</div>
  </div>

  <!-- 회로 캔버스 -->
  <div id="canvas"></div>

  <!-- 오른쪽 패널 -->
  <div id="right-panel">
    <div id="editor"></div>
    <div id="serial-panel">
      <div class="serial-header">
        <span>시리얼 모니터</span>
        <button id="btn-clear-serial" class="toolbar-btn" style="margin-left:auto;padding:1px 6px;font-size:10px">지우기</button>
      </div>
      <div id="serial-output"></div>
    </div>
  </div>
</div>
`;

// 앱 시작
initApp();
