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
  // 마우스 위치를 캔버스 좌표계로 변환
  const pos = canvas.clientToCanvas(e.clientX - rect.left, e.clientY - rect.top);
  addComponent(type, pos.x - 30, pos.y - 30);
});

// ② 코드 에디터 (Monaco CDN 로드 후 비동기로 마운트)
const editorEl = document.getElementById('editor')!;
new CodeEditor(editorEl);

// ② 속성 패널
const propPanelEl = document.getElementById('property-panel')!;
new PropertyPanel(propPanelEl);

// ③ 팔레트 — 서버에서 동적 로드
const palette = document.getElementById('palette')!;

async function loadPalette() {
  try {
    const data = await fetch(`${API_BASE}/components`).then(r => r.json()) as { components: CompSummary[] };
    renderPalette(data.components);
  } catch {
    // 서버 없을 때 기본 목록 폴백
    renderPalette(FALLBACK_PALETTE.map(p => ({
      id: p.type, name: p.label, category: 'passive', description: '', _builtIn: true,
    })));
  }
}

function renderPalette(comps: CompSummary[]) {
  // 카테고리별 그룹화
  const groups: Record<string, CompSummary[]> = {};
  for (const c of comps) {
    (groups[c.category] ??= []).push(c);
  }

  palette.innerHTML = '';

  // 부품 추가 버튼
  const addBtn = document.createElement('button');
  addBtn.className = 'palette-add-btn';
  addBtn.textContent = '+ 새 부품 등록';
  addBtn.addEventListener('click', () => componentEditor.openNew(() => loadPalette()));
  palette.appendChild(addBtn);

  const CAT_LABELS: Record<string, string> = {
    mcu: '보드', passive: '수동 소자', active: '능동 소자',
    sensor: '센서', display: '디스플레이', actuator: '액추에이터', power: '전원',
  };
  const CAT_ORDER = ['mcu','passive','active','sensor','display','actuator','power'];

  for (const cat of CAT_ORDER) {
    if (!groups[cat]?.length) continue;

    const title = document.createElement('div');
    title.className = 'palette-title';
    title.textContent = CAT_LABELS[cat] ?? cat;
    palette.appendChild(title);

    for (const comp of groups[cat]) {
      const item = document.createElement('div');
      item.className = 'palette-item';
      item.dataset.compId = comp.id;

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

      palette.appendChild(item);
    }
  }
}

// 서버 없을 때 폴백 목록
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
  oled:'📺', 'seven-segment':'7️⃣', neopixel:'✨', 'board-uno':'🟢', 'board-esp32c3':'🔵',
};

loadPalette();

// ④ 시리얼 모니터
const serialOutput = document.getElementById('serial-output')!;
circuitStore.subscribe(() => {
  if (serialOutput.textContent !== circuitStore.serialOutput) {
    serialOutput.textContent = circuitStore.serialOutput;
    serialOutput.scrollTop = serialOutput.scrollHeight;
  }
});

// ⑤ 버튼 이벤트
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
  }
});

document.getElementById('btn-clear-serial')!.addEventListener('click', () => circuitStore.clearSerial());

// 시리얼 입력 전송
const serialInputEl = document.getElementById('serial-input') as HTMLInputElement;
document.getElementById('btn-serial-send')!.addEventListener('click', () => {
  const text = serialInputEl.value;
  if (text) { simController.sendSerial(text + '\n'); serialInputEl.value = ''; }
});
serialInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const text = serialInputEl.value;
    if (text) { simController.sendSerial(text + '\n'); serialInputEl.value = ''; }
  }
});
document.getElementById('btn-zoom-in')!.addEventListener('click',  () => canvas.zoomIn());
document.getElementById('btn-zoom-out')!.addEventListener('click', () => canvas.zoomOut());
document.getElementById('btn-fit')!.addEventListener('click',      () => canvas.fitView());

// Undo / Redo
document.getElementById('btn-undo')!.addEventListener('click', () => circuitStore.undo());
document.getElementById('btn-redo')!.addEventListener('click', () => circuitStore.redo());

// 저장 — JSON 파일 다운로드
document.getElementById('btn-save')!.addEventListener('click', () => {
  const json = circuitStore.saveToJson();
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `circuit-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// 불러오기 — 파일 선택 후 JSON 파싱
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

document.addEventListener('keydown', (e) => {
  const active = document.activeElement?.tagName;
  const isEditing = active === 'INPUT' || active === 'TEXTAREA';

  // Ctrl+Z / Ctrl+Y — 에디터 외부에서만
  if ((e.ctrlKey || e.metaKey) && !isEditing) {
    if (e.key === 'z') { e.preventDefault(); circuitStore.undo(); return; }
    if (e.key === 'y') { e.preventDefault(); circuitStore.redo(); return; }
  }

  if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditing) {
    const selComp = circuitStore.selectedId;
    const selWire = circuitStore.selectedWireId;
    if (selComp) circuitStore.removeComponent(selComp);
    if (selWire) circuitStore.removeWire(selWire);
  }
});

// Undo/Redo 버튼 활성화 상태 업데이트
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

// ⑥ 기본 예제 로드 (Arduino Uno + Blink) — 로드 후 fitView
loadDefaultExample();
setTimeout(() => canvas.fitView(), 150);

// ⑦ 보드/템플릿 서버 데이터 비동기 로드
loadServerData();

// ⑧ 유효성 검사 바
const canvasEl2 = document.getElementById('canvas')!;
const validationBar = document.createElement('div');
validationBar.id = 'validation-bar';
canvasEl2.appendChild(validationBar);

function renderValidation(results: import('./stores/circuit-validator.js').ValidationResult[]) {
  if (results.length === 0) {
    validationBar.style.display = 'none';
    return;
  }
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

// 동기 검사 (즉시 표시)
circuitStore.subscribe(() => renderValidation(circuitValidator.validate()));

// 비동기 검사: 서버 def 로드 후 더 정밀하게 재검사
circuitStore.subscribe(() => {
  circuitValidator.validateAsync().then(results => renderValidation(results));
});

console.log('%c⚡ Arduino Web Simulator 준비 완료', 'color:#4a9eff;font-size:14px;font-weight:bold');

// ─────────────────────────────────────────────────────────────────

// 로컬 폴백 defaultProps (서버 응답 없을 때)
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

  // 서버에서 defaultProps 가져오기 (실패 시 로컬 폴백)
  let serverDefaults: Record<string, unknown> = {};
  try {
    const r = await fetch(`${API_BASE}/components/${type}`);
    if (r.ok) {
      const def = await r.json() as { defaultProps?: Record<string, unknown> };
      serverDefaults = def.defaultProps ?? {};
    }
  } catch { /* 서버 없으면 조용히 무시 */ }

  circuitStore.addComponent({
    id, type, x, y, rotation: 0,
    props: { ...(LOCAL_DEFAULTS[type] ?? {}), ...serverDefaults },
    connections: {},
  });
}

function loadDefaultExample() {
  // ── 기본 회로: Arduino Uno + 저항 + LED (Blink 예제) ──────────
  // 모든 connections는 빈 객체 — 연결 정보는 와이어에서 도출됨

  circuitStore.addComponent({
    id: 'board-default', type: 'board-uno',
    x: 60, y: 60, rotation: 0, props: {}, connections: {},
  });
  circuitStore.addComponent({
    id: 'r1', type: 'resistor',
    x: 420, y: 120, rotation: 0,
    props: { ohms: 220 }, connections: {},
  });
  circuitStore.addComponent({
    id: 'led1', type: 'led',
    x: 510, y: 90, rotation: 0,
    props: { color: 'red' }, connections: {},
  });

  // 와이어로 연결 (보드 D13 → 저항 PIN1, 저항 PIN2 → LED ANODE, LED CATHODE → 보드 GND)
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
      const hint = document.getElementById('canvas-hint');
      if (hint) hint.style.display = 'none';
      setTimeout(() => canvas.fitView(), 100);
    } catch { /* 서버 없으면 조용히 실패 */ }
    tplSelect.value = '';
  });
}
