// 모든 sim elements 등록 (side-effect import — custom elements 정의)
import '@sim/elements';

import { CircuitCanvas } from './canvas/circuit-canvas.js';
import { CodeEditor } from './editor/code-editor.js';
import { circuitStore } from './stores/circuit-store.js';
import { simController } from './stores/sim-controller.js';

const API_BASE = '/api';

interface BoardInfo  { id: string; name: string; vendor: string; mcu: string; }
interface TemplateInfo { id: string; name: string; category: string; boardId: string; description: string; }
interface TemplateDetail extends TemplateInfo { components: object[]; code: string; }

// ─────────────────────────────────────────────────────────────────
// 앱 초기화 — index.html의 DOM이 이미 있으므로 즉시 실행
// ─────────────────────────────────────────────────────────────────

// ① 캔버스
const canvasEl = document.getElementById('canvas')!;
const canvas = new CircuitCanvas(canvasEl);

canvasEl.addEventListener('dragover', (e) => e.preventDefault());
canvasEl.addEventListener('drop', (e) => {
  e.preventDefault();
  const type = e.dataTransfer?.getData('component-type');
  if (!type) return;
  const rect = canvasEl.getBoundingClientRect();
  addComponent(type, e.clientX - rect.left - 30, e.clientY - rect.top - 30);
});

// ② 코드 에디터 (Monaco CDN 로드 후 비동기로 마운트)
const editorEl = document.getElementById('editor')!;
new CodeEditor(editorEl);

// ③ 팔레트 아이템
const PALETTE_COMPONENTS = [
  { type: 'led',           label: 'LED',       icon: '💡' },
  { type: 'rgb-led',       label: 'RGB LED',   icon: '🌈' },
  { type: 'button',        label: 'Button',    icon: '🔘' },
  { type: 'resistor',      label: 'Resistor',  icon: '〰️' },
  { type: 'buzzer',        label: 'Buzzer',    icon: '🔊' },
  { type: 'potentiometer', label: 'Pot.',      icon: '🔄' },
  { type: 'servo',         label: 'Servo',     icon: '⚙️' },
  { type: 'dht',           label: 'DHT22',     icon: '🌡️' },
  { type: 'ultrasonic',    label: 'HC-SR04',   icon: '📡' },
  { type: 'lcd',           label: 'LCD',       icon: '🖥️' },
  { type: 'oled',          label: 'OLED',      icon: '📺' },
  { type: 'seven-segment', label: '7-Seg',     icon: '7️⃣' },
  { type: 'neopixel',      label: 'NeoPixel',  icon: '✨' },
  { type: 'board-uno',     label: 'Uno 보드',  icon: '🟢' },
  { type: 'board-esp32c3', label: 'ESP32-C3',  icon: '🔵' },
];

const palette = document.getElementById('palette')!;
for (const comp of PALETTE_COMPONENTS) {
  const item = document.createElement('div');
  item.className = 'palette-item';
  item.innerHTML = `<span class="palette-icon">${comp.icon}</span><span>${comp.label}</span>`;
  item.title = `클릭/드래그: ${comp.label}`;
  item.draggable = true;
  item.addEventListener('dragstart', (e) => e.dataTransfer?.setData('component-type', comp.type));
  item.addEventListener('dblclick', () => addComponent(comp.type, 200 + Math.random() * 80, 150 + Math.random() * 80));
  palette.appendChild(item);
}

// ④ 시리얼 모니터
const serialOutput = document.getElementById('serial-output')!;
circuitStore.subscribe(() => {
  if (serialOutput.textContent !== circuitStore.serialOutput) {
    serialOutput.textContent = circuitStore.serialOutput;
    serialOutput.scrollTop = serialOutput.scrollHeight;
  }
});

// ⑤ 버튼 이벤트
document.getElementById('btn-run')!.addEventListener('click', () => {
  if (circuitStore.simState === 'running') {
    simController.stop();
  } else {
    circuitStore.clearSerial();
    simController.start();
  }
});

document.getElementById('btn-clear-serial')!.addEventListener('click', () => circuitStore.clearSerial());
document.getElementById('btn-zoom-in')!.addEventListener('click', () => canvas.zoomIn());
document.getElementById('btn-zoom-out')!.addEventListener('click', () => canvas.zoomOut());
document.getElementById('btn-fit')!.addEventListener('click', () => canvas.fitView());

document.addEventListener('keydown', (e) => {
  if ((e.key === 'Delete' || e.key === 'Backspace') &&
      (document.activeElement?.tagName !== 'INPUT') &&
      (document.activeElement?.tagName !== 'TEXTAREA')) {
    const sel = circuitStore.selectedId;
    if (sel) circuitStore.removeComponent(sel);
  }
});

// 실행 상태 → 버튼/인디케이터 업데이트
circuitStore.subscribe(() => {
  const state = circuitStore.simState;
  const runBtn = document.getElementById('btn-run') as HTMLButtonElement | null;
  const statusEl = document.getElementById('status-indicator');
  if (runBtn) {
    runBtn.textContent = state === 'running' ? '⏹ 정지' : '▶ 실행';
    runBtn.id = 'btn-run';
    runBtn.className = `toolbar-btn${state === 'running' ? ' running' : state === 'error' ? ' error' : ''}`;
  }
  if (statusEl) {
    statusEl.className = `${state === 'running' ? 'running' : state === 'error' ? 'error' : ''}`;
    statusEl.style.cssText = `
      width:8px;height:8px;border-radius:50%;margin-left:auto;
      background:${state === 'running' ? '#4af44a' : state === 'error' ? '#fa4' : '#444'};
      ${state === 'running' ? 'box-shadow:0 0 6px #4af44a' : state === 'error' ? 'box-shadow:0 0 6px #fa4' : ''}
    `;
  }
});

// ⑥ 보드/템플릿 서버 데이터 비동기 로드
loadServerData();

console.log('%c⚡ Arduino Web Simulator 준비 완료', 'color:#4a9eff;font-size:14px;font-weight:bold');

// ─────────────────────────────────────────────────────────────────

function addComponent(type: string, x: number, y: number) {
  const id = `${type}-${Date.now()}`;
  const DEFAULTS: Record<string, Record<string, unknown>> = {
    'led':           { color: 'red' },
    'rgb-led':       {},
    'button':        {},
    'resistor':      { ohms: 220 },
    'buzzer':        {},
    'potentiometer': {},
    'servo':         { angle: 90 },
    'dht':           { model: 'DHT22', temperature: 25, humidity: 60 },
    'ultrasonic':    { distanceCm: 20 },
    'lcd':           { rows: 2, cols: 16, i2cAddress: 0x27 },
    'oled':          { i2cAddress: 0x3C },
    'seven-segment': {},
    'neopixel':      { count: 8 },
    'board-uno':     {},
    'board-esp32c3': {},
  };
  circuitStore.addComponent({
    id, type, x, y, rotation: 0,
    props: DEFAULTS[type] ?? {},
    connections: {},
  });
}

async function loadServerData() {
  const boardSelect = document.getElementById('board-select') as HTMLSelectElement | null;
  const tplSelect   = document.getElementById('template-select') as HTMLSelectElement | null;
  if (!boardSelect || !tplSelect) return;

  const [boards, templates] = await Promise.all([
    fetch(`${API_BASE}/boards`).then(r => r.ok ? r.json() : []).catch(() => []) as Promise<BoardInfo[]>,
    fetch(`${API_BASE}/templates`).then(r => r.ok ? r.json() : []).catch(() => []) as Promise<TemplateInfo[]>,
  ]);

  if (boards.length > 0) {
    // 서버 보드 목록으로 교체
    boardSelect.innerHTML = '';
    for (const b of boards) {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name;
      if (b.id === 'arduino-uno') opt.selected = true;
      boardSelect.appendChild(opt);
    }
  }
  boardSelect.addEventListener('change', () => circuitStore.setBoard(boardSelect.value));

  const categories = [...new Set(templates.map((t: TemplateInfo) => t.category))];
  for (const cat of categories) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = cat;
    for (const t of templates.filter((t: TemplateInfo) => t.category === cat)) {
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
    try {
      const detail = await fetch(`${API_BASE}/templates/${id}`).then(r => r.json()) as TemplateDetail;
      circuitStore.loadTemplate(detail);
      // 캔버스 힌트 숨기기
      const hint = document.getElementById('canvas-hint');
      if (hint) hint.style.display = 'none';
    } catch { /* 서버 없으면 조용히 실패 */ }
    tplSelect.value = '';
  });
}
