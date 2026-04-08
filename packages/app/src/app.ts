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
  addComponent(type, e.clientX - rect.left - 30, e.clientY - rect.top - 30);
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
      item.addEventListener('dblclick', () =>
        addComponent(comp.id, 200 + Math.random() * 80, 150 + Math.random() * 80)
      );
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
    const selComp = circuitStore.selectedId;
    const selWire = circuitStore.selectedWireId;
    if (selComp) circuitStore.removeComponent(selComp);
    if (selWire) circuitStore.removeWire(selWire);
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

// ⑥ 기본 예제 로드 (Arduino Uno + Blink)
loadDefaultExample();

// ⑦ 보드/템플릿 서버 데이터 비동기 로드
loadServerData();

// ⑧ 유효성 검사 바
const canvasEl2 = document.getElementById('canvas')!;
const validationBar = document.createElement('div');
validationBar.id = 'validation-bar';
canvasEl2.appendChild(validationBar);

circuitStore.subscribe(() => {
  const results = circuitValidator.validate();
  const errors = results.filter(r => r.severity === 'error');
  const warnings = results.filter(r => r.severity === 'warning');

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

  // 클릭 시 해당 컴포넌트 선택
  validationBar.querySelectorAll('[data-comp]').forEach(el => {
    const compId = (el as HTMLElement).dataset.comp;
    if (compId) {
      el.addEventListener('click', () => circuitStore.selectComponent(compId));
    }
  });

  // 상태 표시에 오류 수 반영
  const _ = errors.length + warnings.length;
});

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

function loadDefaultExample() {
  // Arduino Uno 보드 + LED + 저항 기본 배치
  circuitStore.addComponent({
    id: 'board-default', type: 'board-uno',
    x: 80, y: 80, rotation: 0, props: {}, connections: {},
  });
  circuitStore.addComponent({
    id: 'r1', type: 'resistor',
    x: 420, y: 100, rotation: 0,
    props: { ohms: 220 },
    connections: { PIN1: 13, PIN2: 'r1-led' },
  });
  circuitStore.addComponent({
    id: 'led1', type: 'led',
    x: 500, y: 80, rotation: 0,
    props: { color: 'red' },
    connections: { ANODE: 13, CATHODE: 'GND' },
  });
  circuitStore.setCode(`// Blink — LED 깜빡이기
// D13번 핀의 LED를 1초 간격으로 켜고 끕니다

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
      // 캔버스 힌트 숨기기
      const hint = document.getElementById('canvas-hint');
      if (hint) hint.style.display = 'none';
    } catch { /* 서버 없으면 조용히 실패 */ }
    tplSelect.value = '';
  });
}
