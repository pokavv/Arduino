// 모든 sim elements 등록 (side-effect import — custom elements 정의)
import '@sim/elements';

import { CircuitCanvas } from './canvas/circuit-canvas.js';
import { CodeEditor } from './editor/code-editor.js';
import { PropertyPanel } from './panels/property-panel.js';
import { componentEditor } from './panels/component-editor.js';
import { circuitStore } from './stores/circuit-store.js';
import { simController } from './stores/sim-controller.js';
import { circuitValidator } from './stores/circuit-validator.js';

const API_BASE = '/api';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco: any;
  }
}

// ── 테마 (라이트/다크) ──────────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem('sim-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved ?? (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') ?? 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('sim-theme', next);
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
  // Monaco 테마 동기화
  if (window.monaco) {
    window.monaco.editor.setTheme(next === 'dark' ? 'vs-dark' : 'vs');
  }
}

document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);

// 초기 버튼 아이콘 반영
{
  const initialTheme = document.documentElement.getAttribute('data-theme') ?? 'dark';
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = initialTheme === 'dark' ? '🌙' : '☀️';
}

interface BoardInfo  { id: string; name: string; vendor: string; mcu: string; }
interface TemplateInfo { id: string; name: string; category: string; boardId: string; description: string; }
interface TemplateDetail extends TemplateInfo { components: object[]; code: string; }

interface CompSummary {
  id: string; name: string; category: string;
  description: string; _builtIn: boolean;
}

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
  const pos = canvas.clientToCanvas(e.clientX - rect.left, e.clientY - rect.top);
  addComponent(type, pos.x - 30, pos.y - 30);
});

// ② 코드 에디터
const editorEl = document.getElementById('editor')!;
const codeEditor = new CodeEditor(editorEl);

// ③ 속성 패널
const propPanelEl = document.getElementById('property-panel')!;
new PropertyPanel(propPanelEl);

// ④ 팔레트 — 서버에서 동적 로드
const paletteList = document.getElementById('palette-list')!;

async function loadPalette() {
  try {
    const data = await fetch(`${API_BASE}/components`).then(r => r.json()) as { components: CompSummary[] };
    renderPalette(data.components);
  } catch {
    renderPalette(FALLBACK_PALETTE.map(p => ({
      id: p.type, name: p.label, category: 'passive', description: '', _builtIn: true,
    })));
  }
}

function renderPalette(comps: CompSummary[]) {
  const groups: Record<string, CompSummary[]> = {};
  for (const c of comps) {
    (groups[c.category] ??= []).push(c);
  }

  paletteList.innerHTML = '';

  const addBtn = document.createElement('button');
  addBtn.className = 'palette-add-btn';
  addBtn.textContent = '+ 새 부품 등록';
  addBtn.addEventListener('click', () => componentEditor.openNew(() => loadPalette()));
  paletteList.appendChild(addBtn);

  const CAT_LABELS: Record<string, string> = {
    mcu: '보드', passive: '수동 소자', active: '능동 소자',
    sensor: '센서', display: '디스플레이', actuator: '액추에이터', power: '전원',
  };
  const CAT_ORDER = ['mcu','passive','active','sensor','display','actuator','power'];

  for (const cat of CAT_ORDER) {
    if (!groups[cat]?.length) continue;

    const title = document.createElement('div');
    title.className = 'palette-category';
    title.textContent = CAT_LABELS[cat] ?? cat;
    paletteList.appendChild(title);

    for (const comp of groups[cat]) {
      const item = document.createElement('div');
      item.className = 'palette-item';
      item.dataset.compId = comp.id;
      item.dataset.label  = comp.name.toLowerCase();

      const icon = COMP_ICONS[comp.id] ?? '📦';
      item.innerHTML = `
        <span class="palette-icon">${icon}</span>
        <span class="palette-label">${comp.name}</span>
        <button class="palette-edit-btn" title="편집">✏️</button>
      `;
      item.title = comp.description || comp.name;
      item.draggable = true;

      item.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('component-type', comp.id);
      });
      item.addEventListener('dblclick', () => {
        const cx = canvas.viewCenterX + (Math.random() - 0.5) * 60;
        const cy = canvas.viewCenterY + (Math.random() - 0.5) * 60;
        addComponent(comp.id, cx, cy);
      });
      item.querySelector('.palette-edit-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        componentEditor.openEdit(comp.id, () => loadPalette());
      });

      paletteList.appendChild(item);
    }
  }

  // 검색 필터 초기화
  applyPaletteSearch();
}

// ── 팔레트 검색 ───────────────────────────────────────────────────
const paletteSearchEl = document.getElementById('palette-search') as HTMLInputElement;
paletteSearchEl.addEventListener('input', applyPaletteSearch);

function applyPaletteSearch() {
  const q = paletteSearchEl.value.toLowerCase().trim();
  let lastCategory: HTMLElement | null = null;
  let lastCategoryVisible = false;

  for (const el of paletteList.children) {
    const div = el as HTMLElement;
    if (div.classList.contains('palette-category')) {
      if (lastCategory) lastCategory.style.display = lastCategoryVisible ? '' : 'none';
      lastCategory = div;
      lastCategoryVisible = false;
      continue;
    }
    if (div.classList.contains('palette-item')) {
      const label = div.dataset.label ?? '';
      const visible = !q || label.includes(q);
      div.style.display = visible ? '' : 'none';
      if (visible) lastCategoryVisible = true;
    }
  }
  if (lastCategory) lastCategory.style.display = lastCategoryVisible ? '' : 'none';
}

const FALLBACK_PALETTE = [
  { type: 'board-uno',     label: 'Uno 보드' },
  { type: 'board-esp32c3', label: 'ESP32-C3' },
  { type: 'led',           label: 'LED' },
  { type: 'rgb-led',       label: 'RGB LED' },
  { type: 'button',        label: 'Button' },
  { type: 'resistor',      label: 'Resistor' },
  { type: 'buzzer',        label: 'Buzzer' },
  { type: 'potentiometer', label: 'Pot.' },
  { type: 'servo',         label: 'Servo' },
  { type: 'dht',           label: 'DHT22' },
  { type: 'ultrasonic',    label: 'HC-SR04' },
  { type: 'lcd',           label: 'LCD' },
  { type: 'oled',          label: 'OLED' },
  { type: 'seven-segment', label: '7-Seg' },
  { type: 'neopixel',      label: 'NeoPixel' },
];

const COMP_ICONS: Record<string, string> = {
  led:'💡', 'rgb-led':'🌈', button:'🔘', resistor:'〰️', buzzer:'🔊',
  potentiometer:'🔄', servo:'⚙️', dht:'🌡️', ultrasonic:'📡', lcd:'🖥️',
  oled:'📺', 'seven-segment':'7️⃣', neopixel:'✨',
  'board-uno':'🟢', 'board-esp32c3':'🔵',
  capacitor:'⚡', diode:'→', 'transistor-npn':'🔺',
  relay:'🔌', 'dc-motor':'🌀', 'ir-led':'💫', 'ir-receiver':'👁️',
  'hall-sensor':'🧲', lm35:'🌡️', joystick:'🕹️',
  '74hc595':'🔢', l298n:'⚙️', 'pir-sensor':'👤',
  'sound-sensor':'🔈', 'stepper-motor':'⚙️',
};

loadPalette();

// ── 시리얼 모니터 ─────────────────────────────────────────────────
const serialOutput = document.getElementById('serial-output')!;
circuitStore.subscribe(() => {
  if (serialOutput.textContent !== circuitStore.serialOutput) {
    serialOutput.textContent = circuitStore.serialOutput;
    serialOutput.scrollTop = serialOutput.scrollHeight;
  }
});

// ── 탭 전환 ──────────────────────────────────────────────────────
document.querySelectorAll<HTMLButtonElement>('.right-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab!;
    document.querySelectorAll('.right-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.right-tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`)!.classList.add('active');
    if (tab === 'editor') codeEditor.relayout();
  });
});

// 에러/경고 시 시리얼 탭으로 자동 전환
circuitStore.subscribe(() => {
  if (circuitStore.simState === 'error') {
    switchTab('serial');
  }
});

function switchTab(tab: string) {
  const btn = document.querySelector<HTMLButtonElement>(`.right-tab-btn[data-tab="${tab}"]`);
  btn?.click();
}

// ── 패널 리사이즈 ──────────────────────────────────────────────────
setupPanelResize(
  document.getElementById('divider-left')!,
  document.getElementById('palette-panel')!,
  'left'
);
setupPanelResize(
  document.getElementById('divider-right')!,
  document.getElementById('right-panel')!,
  'right'
);

function setupPanelResize(handle: HTMLElement, panel: HTMLElement, side: 'left' | 'right') {
  let startX = 0, startW = 0;

  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startW = panel.getBoundingClientRect().width;
    handle.classList.add('dragging');
    handle.setPointerCapture(e.pointerId);

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp, { once: true });
  });

  function onMove(e: PointerEvent) {
    const delta = side === 'left'
      ? e.clientX - startX
      : startX - e.clientX;
    const newW = Math.max(140, Math.min(600, startW + delta));
    panel.style.width = `${newW}px`;
    if (side === 'right') codeEditor.relayout();
  }

  function onUp() {
    handle.classList.remove('dragging');
    handle.removeEventListener('pointermove', onMove);
    codeEditor.relayout();
  }
}

// ── 버튼 이벤트 ─────────────────────────────────────────────────
document.getElementById('btn-new')!.addEventListener('click', () => {
  if (!confirm('현재 회로를 지우고 새로 시작할까요?')) return;
  simController.stop();
  circuitStore.clearCircuit();
});

document.getElementById('btn-run')!.addEventListener('click', () => {
  if (circuitStore.simState === 'running') {
    simController.stop();
  } else {
    circuitStore.clearSerial();
    simController.start();
    switchTab('serial'); // 실행 시 시리얼 탭으로
  }
});

document.getElementById('btn-clear-serial')!.addEventListener('click', () => circuitStore.clearSerial());

// 시리얼 입력 전송
const serialInputEl = document.getElementById('serial-input') as HTMLInputElement;
function sendSerialInput() {
  const text = serialInputEl.value;
  if (text) { simController.sendSerial(text + '\n'); serialInputEl.value = ''; }
}
document.getElementById('btn-serial-send')!.addEventListener('click', sendSerialInput);
serialInputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendSerialInput(); });

document.getElementById('btn-zoom-in')!.addEventListener('click',  () => canvas.zoomIn());
document.getElementById('btn-zoom-out')!.addEventListener('click', () => canvas.zoomOut());
document.getElementById('btn-fit')!.addEventListener('click',      () => canvas.fitView());

// Undo / Redo
document.getElementById('btn-undo')!.addEventListener('click', () => circuitStore.undo());
document.getElementById('btn-redo')!.addEventListener('click', () => circuitStore.redo());

// 저장
document.getElementById('btn-save')!.addEventListener('click', () => {
  const json = circuitStore.saveToJson();
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `circuit-${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
});

// 불러오기
const fileInput = document.getElementById('file-input') as HTMLInputElement;
document.getElementById('btn-load')!.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      circuitStore.loadFromJson(reader.result as string);
      const hint = document.getElementById('canvas-hint');
      if (hint) hint.style.display = 'none';
      setTimeout(() => canvas.fitView(), 100);
    } catch {
      alert('파일 형식이 올바르지 않습니다.');
    }
  };
  reader.readAsText(file);
  fileInput.value = '';
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
  const active = document.activeElement?.tagName;
  const isEditing = active === 'INPUT' || active === 'TEXTAREA';

  if ((e.ctrlKey || e.metaKey) && !isEditing) {
    if (e.key === 'z') { e.preventDefault(); circuitStore.undo(); return; }
    if (e.key === 'y') { e.preventDefault(); circuitStore.redo(); return; }
    if (e.key === 's') { e.preventDefault(); document.getElementById('btn-save')!.click(); return; }
  }

  if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditing) {
    const selComp = circuitStore.selectedId;
    const selWire = circuitStore.selectedWireId;
    if (selComp) circuitStore.removeComponent(selComp);
    if (selWire) circuitStore.removeWire(selWire);
  }
});

// Undo/Redo 버튼 상태
circuitStore.subscribe(() => {
  const undoBtn = document.getElementById('btn-undo') as HTMLButtonElement | null;
  const redoBtn = document.getElementById('btn-redo') as HTMLButtonElement | null;
  if (undoBtn) undoBtn.style.opacity = circuitStore.canUndo ? '1' : '0.3';
  if (redoBtn) redoBtn.style.opacity = circuitStore.canRedo ? '1' : '0.3';
});

// 실행 상태 → 버튼/인디케이터 업데이트
circuitStore.subscribe(() => {
  const state = circuitStore.simState;
  const runBtn = document.getElementById('btn-run') as HTMLButtonElement | null;
  const statusEl = document.getElementById('status-indicator');
  if (runBtn) {
    runBtn.textContent = state === 'running' ? '⏹ 정지' : '▶ 실행';
    runBtn.className = `toolbar-btn${state === 'running' ? ' running' : state === 'error' ? ' error' : ''}`;
  }
  if (statusEl) {
    statusEl.className = state === 'running' ? 'running' : state === 'error' ? 'error' : '';
    statusEl.title = state === 'running' ? '실행 중' : state === 'error' ? '오류' : '정지';
  }
});

// ── 기본 예제 로드 ────────────────────────────────────────────────
loadDefaultExample();
setTimeout(() => canvas.fitView(), 150);

// ── 서버 데이터 로드 (보드/템플릿) ───────────────────────────────
loadServerData();

// ── 유효성 검사 바 ─────────────────────────────────────────────────
const validationBar = document.getElementById('validation-bar')!;

function renderValidation(results: import('./stores/circuit-validator.js').ValidationResult[]) {
  if (results.length === 0) { validationBar.style.display = 'none'; return; }
  validationBar.style.display = 'block';
  validationBar.innerHTML = results.slice(0, 3).map(r => `
    <div class="validation-item ${r.severity}" title="${r.detail ?? ''}" data-comp="${r.compId ?? ''}">
      <span class="validation-icon">${r.severity === 'error' ? '⛔' : '⚠️'}</span>
      ${r.message}
    </div>
  `).join('') + (results.length > 3 ? `<div class="validation-item info">+ ${results.length - 3}개 더...</div>` : '');

  validationBar.querySelectorAll('[data-comp]').forEach(el => {
    const compId = (el as HTMLElement).dataset.comp;
    if (compId) el.addEventListener('click', () => circuitStore.selectComponent(compId));
  });
}

circuitStore.subscribe(() => renderValidation(circuitValidator.validate()));
circuitStore.subscribe(() => {
  circuitValidator.validateAsync().then(results => renderValidation(results));
});

console.log('%c⚡ Arduino Web Simulator 준비 완료', 'color:#4a9eff;font-size:14px;font-weight:bold');

// ─────────────────────────────────────────────────────────────────

const LOCAL_DEFAULTS: Record<string, Record<string, unknown>> = {
  'led':           { color: 'red' },
  'resistor':      { ohms: 220 },
  'servo':         { angle: 90 },
  'dht':           { model: 'DHT22', temperature: 25, humidity: 60 },
  'ultrasonic':    { distanceCm: 20 },
  'lcd':           { rows: 2, cols: 16, i2cAddress: 0x27 },
  'oled':          { i2cAddress: 0x3C },
  'neopixel':      { count: 8 },
};

async function addComponent(type: string, x: number, y: number) {
  const id = `${type}-${Date.now()}`;
  let serverDefaults: Record<string, unknown> = {};
  try {
    const r = await fetch(`${API_BASE}/components/${type}`);
    if (r.ok) {
      const def = await r.json() as { defaultProps?: Record<string, unknown> };
      serverDefaults = def.defaultProps ?? {};
    }
  } catch { /* 서버 없으면 무시 */ }

  circuitStore.addComponent({
    id, type, x, y, rotation: 0,
    props: { ...(LOCAL_DEFAULTS[type] ?? {}), ...serverDefaults },
    connections: {},
  });
}

function loadDefaultExample() {
  circuitStore.addComponent({ id: 'board-default', type: 'board-uno', x: 60, y: 60, rotation: 0, props: {}, connections: {} });
  circuitStore.addComponent({ id: 'r1', type: 'resistor', x: 420, y: 120, rotation: 0, props: { ohms: 220 }, connections: {} });
  circuitStore.addComponent({ id: 'led1', type: 'led', x: 510, y: 90, rotation: 0, props: { color: 'red' }, connections: {} });

  circuitStore.addWire({ id: 'w1', fromCompId: 'board-default', fromPin: 'D13',     toCompId: 'r1',    toPin: 'PIN1',    color: '#4af' });
  circuitStore.addWire({ id: 'w2', fromCompId: 'r1',            fromPin: 'PIN2',    toCompId: 'led1',  toPin: 'ANODE',   color: '#4af' });
  circuitStore.addWire({ id: 'w3', fromCompId: 'led1',          fromPin: 'CATHODE', toCompId: 'board-default', toPin: 'GND', color: '#666' });

  circuitStore.setCode(`// Blink — LED 깜빡이기
// D13번 핀에 연결된 LED를 1초 간격으로 켜고 끕니다
// 회로: D13 → 220Ω 저항 → LED → GND

const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("시뮬레이터 시작!");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED ON");
  delay(1000);

  digitalWrite(LED_PIN, LOW);
  Serial.println("LED OFF");
  delay(1000);
}
`);
}

async function loadServerData() {
  const boardSelect = document.getElementById('board-select') as HTMLSelectElement | null;
  if (!boardSelect) return;

  try {
    const [boards, templates] = await Promise.all([
      fetch(`${API_BASE}/boards`).then(r => r.ok ? r.json() : []).catch(() => []) as Promise<BoardInfo[]>,
      fetch(`${API_BASE}/templates`).then(r => r.ok ? r.json() : []).catch(() => []) as Promise<TemplateInfo[]>,
    ]);

    if (boards.length > 0) {
      boardSelect.innerHTML = '';
      for (const b of boards) {
        const opt = document.createElement('option');
        opt.value = b.id; opt.textContent = b.name;
        if (b.id === 'arduino-uno') opt.selected = true;
        boardSelect.appendChild(opt);
      }
    }
    boardSelect.addEventListener('change', () => circuitStore.setBoard(boardSelect.value));

    // 템플릿 — 팔레트 아래에 로드 버튼으로 추가
    if (templates.length > 0) {
      appendTemplateSection(templates);
    }
  } catch { /* 서버 없으면 무시 */ }
}

function appendTemplateSection(templates: TemplateInfo[]) {
  const div = document.createElement('div');
  div.innerHTML = `<div class="palette-category">예제 템플릿</div>`;

  const categories = [...new Set(templates.map(t => t.category))];
  for (const cat of categories) {
    const catDiv = document.createElement('div');
    catDiv.innerHTML = `<div class="palette-category" style="color:#555;padding-left:16px">${cat}</div>`;
    div.appendChild(catDiv);

    for (const t of templates.filter(tpl => tpl.category === cat)) {
      const item = document.createElement('div');
      item.className = 'palette-item';
      item.dataset.label = t.name.toLowerCase();
      item.innerHTML = `<span class="palette-icon">📋</span><span class="palette-label">${t.name}</span>`;
      item.title = t.description ?? t.name;
      item.style.cursor = 'pointer';
      item.addEventListener('click', async () => {
        try {
          const detail = await fetch(`${API_BASE}/templates/${t.id}`).then(r => r.json()) as TemplateDetail;
          circuitStore.loadTemplate(detail);
          const hint = document.getElementById('canvas-hint');
          if (hint) hint.style.display = 'none';
          setTimeout(() => canvas.fitView(), 100);
        } catch { /* 무시 */ }
      });
      div.appendChild(item);
    }
  }

  paletteList.appendChild(div);
}
