/**
 * ESP32-C3 Arduino Web Simulator — 메인 앱
 * Scheduler + ArduinoRuntime + Transpiler + CircuitEditor 통합
 */

/* ═══════════════════════════════════════════════════════
   SimulatorEngine — 시뮬레이션 핵심 로직
═══════════════════════════════════════════════════════ */
class SimulatorEngine {
  constructor(circuitEditor, onSerial, onError, onStop) {
    this.circuit  = circuitEditor;
    this.onSerial = onSerial;   // (text, type) => void
    this.onError  = onError;    // (msg) => void
    this.onStop   = onStop;     // () => void

    this.transpiler = new Transpiler();
    this.scheduler  = null;
    this.runtime    = null;
    this._running   = false;
  }

  /** 코드 실행 */
  run(cppCode) {
    if (this._running) this.stop();

    // 1. 트랜스파일
    let jsCode;
    try {
      jsCode = this.transpiler.transpile(cppCode);
    } catch (e) {
      throw new Error('[트랜스파일 오류] ' + e.message);
    }

    // 2. 런타임 생성
    const self = this;
    const simProxy = {
      onGpioChange(pin, value) {
        self.circuit?.onGpioChange?.(pin, value);
        // 내장 LED (G8 Active LOW)
        if (pin === 8) {
          const el = document.getElementById('builtin-led-svg');
          if (el) el.style.opacity = (value === 0) ? '1' : '0.15';
        }
      },
      onPwmChange(pin, duty, freq) {
        self.circuit?.onPwmChange?.(pin, duty, freq);
      },
      serialMonitor: {
        print(text) { self.onSerial(text, 'received'); },
        clear()     { /* 지우기 */ }
      },
      readAdc(pin)     { return self.circuit?.getAdcValue?.(pin)    ?? 2048; },
      readDigital(pin) { return self.circuit?.getDigitalInput?.(pin) ?? 1;   },
    };

    this.runtime = new ArduinoRuntime(simProxy);

    // runtime이 ADC/디지털 읽기를 회로에 위임
    const origAnalogRead  = this.runtime.analogRead.bind(this.runtime);
    const origDigitalRead = this.runtime.digitalRead.bind(this.runtime);

    this.runtime.analogRead = (pin) => {
      const injected = this.runtime.adcValues.get(pin);
      if (injected !== undefined) return injected;
      return simProxy.readAdc(pin);
    };
    this.runtime.digitalRead = (pin) => {
      const state = this.runtime.gpioState.get(pin);
      if (state && state.mode === 1 /* OUTPUT */) return state.value;
      return simProxy.readDigital(pin);
    };

    // 3. Scheduler 생성
    this.scheduler = new Scheduler(this.runtime);

    // 4. 전역 바인딩 구성
    const globals = this._buildGlobals();

    // 5. 사용자 코드 컴파일
    let userFns;
    try {
      const fnBody = `
        "use strict";
        ${jsCode}
        return { setup: (typeof setup !== "undefined" ? setup : null),
                 loop:  (typeof loop  !== "undefined" ? loop  : null) };
      `;
      const fn = new Function(...Object.keys(globals), fnBody);
      userFns = fn(...Object.values(globals));
    } catch (e) {
      throw new Error('[코드 파싱 오류] ' + e.message + '\n\n--- 변환된 코드 ---\n' + jsCode.slice(0, 800));
    }

    if (!userFns.setup) throw new Error('setup() 함수가 없습니다.');
    if (!userFns.loop)  throw new Error('loop() 함수가 없습니다.');

    // 6. 버튼 컴포넌트 → runtime 인터럽트 자동 연결
    this._wireButtonInterrupts();

    // 7. 실행
    this._running = true;
    this.scheduler.on('error', (e) => {
      this.onError('[런타임 오류] ' + (e?.message || String(e)));
    });
    this.scheduler.start();
    this._runAsync(userFns.setup, userFns.loop);
  }

  async _runAsync(setupFn, loopFn) {
    try {
      await this.scheduler.runSetup(setupFn);
      await this.scheduler.runLoop(loopFn);
    } catch (e) {
      if (e && e.name !== 'AbortError' && !String(e.message).includes('stopped')) {
        this.onError('[런타임 오류] ' + (e.message || e));
      }
    } finally {
      this._running = false;
      this.onStop();
    }
  }

  /** 버튼 컴포넌트 → runtime.setDigitalValue 인터럽트 자동 연결 */
  _wireButtonInterrupts() {
    const r = this.runtime;
    const comps = this.circuit?.getAllComponents?.() || [];
    comps.forEach(comp => {
      if (comp.type !== 'Button') return;
      // PIN1 또는 PIN2 중 GPIO에 연결된 핀 찾기
      ['PIN1', 'PIN2'].forEach(pinName => {
        const boardPin = comp.connections?.[pinName]; // e.g. 'G9'
        if (!boardPin || !boardPin.startsWith('G')) return;
        const gpioNum = parseInt(boardPin.slice(1), 10);
        if (isNaN(gpioNum)) return;
        comp.onPressCallback((pressed) => {
          // INPUT_PULLUP 기준: 눌림=LOW(0), 뗌=HIGH(1)
          r.setDigitalValue(gpioNum, pressed ? 0 : 1);
        });
      });
    });
  }

  stop() {
    this.scheduler?.stop();
    this._running = false;
  }

  reset() {
    this.stop();
    this.runtime?.reset?.();
    this.scheduler = null;
    this.runtime   = null;
  }

  getElapsedMs() {
    return this.scheduler?.millis() ?? 0;
  }

  getPinStates() {
    if (!this.runtime) return {};
    const result = {};
    this.runtime.gpioState.forEach((info, pin) => {
      const pwmCh = info.pwmChannel;
      if (pwmCh !== null && pwmCh !== undefined) {
        const ch = this.runtime.pwmChannels.get(pwmCh);
        result[pin] = { mode: 'pwm', duty: ch?.duty ?? 0, freq: ch?.freq ?? 0 };
      } else {
        result[pin] = { mode: info.mode === 0 ? 'in' : 'out', value: info.value };
      }
    });
    // ADC 핀
    this.runtime.adcValues.forEach((val, pin) => {
      if (!result[pin]) result[pin] = { mode: 'adc', value: val };
    });
    return result;
  }

  sendSerial(text) {
    this.runtime?._serialObj?.inject(text);
  }

  /** Arduino C++ 전역 상수 + API 함수를 JS 함수 스코프에 주입 */
  _buildGlobals() {
    const r = this.runtime;
    const s = this.scheduler;
    const bind = (fn) => fn ? fn.bind(r) : () => {};

    return {
      // 상수
      OUTPUT: 1, INPUT: 0, INPUT_PULLUP: 2, INPUT_PULLDOWN: 3,
      HIGH: 1, LOW: 0,
      RISING: 1, FALLING: 2, CHANGE: 3,
      LED_BUILTIN: 8, BUILTIN_LED: 8,
      ADC_0db: 0, ADC_2_5db: 1, ADC_6db: 2, ADC_11db: 3,
      true: true, false: false,
      PI: Math.PI, TWO_PI: Math.PI * 2, HALF_PI: Math.PI / 2,
      // GPIO
      pinMode:        bind(r.pinMode),
      digitalWrite:   bind(r.digitalWrite),
      digitalRead:    (pin) => r.digitalRead(pin),
      // ADC
      analogRead:         (pin) => r.analogRead(pin),
      analogReadResolution: bind(r.analogReadResolution),
      analogSetAttenuation: () => {},
      // PWM
      ledcSetup:      bind(r.ledcSetup),
      ledcAttachPin:  bind(r.ledcAttachPin),
      ledcWrite:      bind(r.ledcWrite),
      ledcWriteTone:  bind(r.ledcWriteTone),
      ledcDetachPin:  bind(r.ledcDetachPin),
      // 타이밍
      millis:            () => s.millis(),
      micros:            () => s.micros(),
      _delay:            (ms) => s.delay(ms),
      _delayMicros:      (us) => s.delay(us / 1000),
      delay:             (ms) => s.delay(ms),
      delayMicroseconds: (us) => s.delay(us / 1000),
      // 인터럽트
      attachInterrupt:      bind(r.attachInterrupt),
      detachInterrupt:      bind(r.detachInterrupt),
      digitalPinToInterrupt: (pin) => pin,  // ESP32: 핀번호 = 인터럽트번호
      noInterrupts:          () => {},
      interrupts:            () => {},
      // 수학
      map:        bind(r.map),
      constrain:  bind(r.constrain),
      abs:        (x) => Math.abs(x),
      min:        (a, b) => Math.min(a, b),
      max:        (a, b) => Math.max(a, b),
      pow:        (b, e) => Math.pow(b, e),
      sqrt:       (x) => Math.sqrt(x),
      floor:      (x) => Math.floor(x),
      ceil:       (x) => Math.ceil(x),
      round:      (x) => Math.round(x),
      random:     bind(r.random),
      randomSeed: bind(r.randomSeed),
      sin: Math.sin, cos: Math.cos, tan: Math.tan,
      asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
      log: Math.log, exp: Math.exp,
      // 타입 변환 (String은 내장 전역 사용 - String.fromCharCode 보존)
      parseInt:   (s, base) => parseInt(s, base || 10),
      parseFloat: (s) => parseFloat(s),
      isnan:      (x) => isNaN(x),
      isNaN:      (x) => isNaN(x),
      // Serial
      Serial: r._serialObj,
      _Serial: r._serialObj,
      // ESP32/Arduino 무시 키워드 (undefined = 에러 방지)
      IRAM_ATTR:   undefined,
      DRAM_ATTR:   undefined,
      PROGMEM:     undefined,
      F:           (s) => s,
      pgm_read_word:  (x) => x,
      pgm_read_byte:  (x) => x,
      // 추가 유틸
      bitRead:   (val, bit) => (val >> bit) & 1,
      bitSet:    (val, bit) => val | (1 << bit),
      bitClear:  (val, bit) => val & ~(1 << bit),
      bitWrite:  (val, bit, v) => v ? (val | (1 << bit)) : (val & ~(1 << bit)),
      bit:       (b) => (1 << b),
      lowByte:   (x) => x & 0xFF,
      highByte:  (x) => (x >> 8) & 0xFF,
    };
  }
}

/* ═══════════════════════════════════════════════════════
   App — UI 통합
═══════════════════════════════════════════════════════ */
class App {
  constructor() {
    this.engine       = null;
    this.circuit      = null;
    this.editor       = null;
    this._simTimer    = null;
    this._pinTimer    = null;
    this._dragging    = null;

    this._init();
  }

  async _init() {
    // Monaco 에디터
    await this._initMonaco();

    // CircuitEditor 초기화
    const svg = document.getElementById('circuit-svg');
    this.circuit = new CircuitEditor(svg);
    this.circuit.renderBoard();

    // ComponentFactory → ComponentRegistry 브릿지
    window.ComponentFactory = {
      create(type, id, config) {
        if (window.ComponentRegistry) {
          return ComponentRegistry.create(type, id, config, config.x, config.y, {});
        }
        return null;
      }
    };

    // SimulatorEngine
    this.engine = new SimulatorEngine(
      this.circuit,
      (text, type) => this._serialLog(text, type),
      (msg)        => this._showError(msg),
      ()           => this._onStop(),
    );

    // 핀 그리드
    this._initPinGrid();
    this._bindEvents();
    this._loadDefaultCode();
  }

  /* ── Monaco ── */
  async _initMonaco() {
    return new Promise(resolve => {
      require.config({
        paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }
      });
      require(['vs/editor/editor.main'], () => {
        this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
          language: 'cpp', theme: 'vs-dark', fontSize: 13,
          minimap: { enabled: false }, lineNumbers: 'on',
          wordWrap: 'on', scrollBeyondLastLine: false,
          automaticLayout: true, tabSize: 2,
          fontFamily: 'Consolas,"Courier New",monospace',
        });
        resolve();
      });
    });
  }

  /* ── 이벤트 ── */
  _bindEvents() {
    document.getElementById('btn-run').addEventListener('click',   () => this._run());
    document.getElementById('btn-stop').addEventListener('click',  () => this._stop());
    document.getElementById('btn-reset').addEventListener('click', () => this._reset());

    document.addEventListener('keydown', e => {
      const inEditor = document.activeElement?.closest?.('#monaco-editor');
      if (e.key === 'F5') { e.preventDefault(); this._run(); }
      if (e.key === 'F6') { e.preventDefault(); this._stop(); }
      if (e.key === 'F7') { e.preventDefault(); this._reset(); }
      if (!inEditor) {
        if (e.key === 'Delete') this.circuit.deleteSelected();
        if (e.key === 'w')      this._setMode('wire');
        if (e.key === 's' && !e.ctrlKey) this._setMode('select');
      }
    });

    // 모드 버튼
    document.getElementById('btn-wire-mode').addEventListener('click',   () => this._setMode('wire'));
    document.getElementById('btn-select-mode').addEventListener('click', () => this._setMode('select'));
    document.getElementById('btn-delete-selected').addEventListener('click', () => this.circuit.deleteSelected());

    // 팔레트 드래그 & 클릭
    document.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        this._dragging = this._itemConfig(item);
        e.dataTransfer.effectAllowed = 'copy';
      });
      item.addEventListener('click', () => {
        const cfg = this._itemConfig(item);
        this.circuit.addComponent(cfg.type, 420, 280, cfg);
      });
    });

    const svgEl = document.getElementById('circuit-svg');
    svgEl.addEventListener('dragover',  e => { e.preventDefault(); svgEl.classList.add('drag-over'); });
    svgEl.addEventListener('dragleave', () => svgEl.classList.remove('drag-over'));
    svgEl.addEventListener('drop', e => {
      e.preventDefault();
      svgEl.classList.remove('drag-over');
      if (!this._dragging) return;
      const rect = svgEl.getBoundingClientRect();
      this.circuit.addComponent(this._dragging.type, e.clientX - rect.left, e.clientY - rect.top, this._dragging);
      this._dragging = null;
    });

    // 템플릿
    document.getElementById('btn-load-template').addEventListener('click', () => {
      const id = document.getElementById('template-select').value;
      if (id) this._loadTemplate(id);
    });

    // 시리얼
    document.getElementById('btn-serial-send').addEventListener('click', () => this._serialSend());
    document.getElementById('serial-input').addEventListener('keypress', e => {
      if (e.key === 'Enter') this._serialSend();
    });
    document.getElementById('btn-serial-clear').addEventListener('click', () => {
      document.getElementById('serial-output').innerHTML = '';
    });

    // 탭
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
      });
    });

    // 내보내기/가져오기
    document.getElementById('btn-export').addEventListener('click', () => this._export());
    document.getElementById('btn-import').addEventListener('click', () =>
      document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = ev => this._import(ev.target.result);
      fr.readAsText(f);
    });

    document.getElementById('btn-clear-circuit').addEventListener('click', () => {
      if (confirm('회로를 초기화하시겠습니까?')) {
        this.circuit.clearAll();
        this.circuit.renderBoard();
      }
    });

    document.getElementById('btn-close-error').addEventListener('click', () => {
      document.getElementById('error-panel').style.display = 'none';
    });

    document.getElementById('btn-example').addEventListener('click', () => this._loadDefaultCode());

    this._initPanelResize();
  }

  _itemConfig(item) {
    return {
      type:  item.dataset.type,
      color: item.dataset.color || undefined,
      value: item.dataset.value ? parseInt(item.dataset.value) : undefined,
    };
  }

  /* ── 시뮬레이션 ── */
  _run() {
    const code = this.editor?.getValue() || '';
    if (!code.trim()) { this._showError('코드를 입력하세요.'); return; }
    document.getElementById('error-panel').style.display = 'none';
    this._serialLog('=== 시뮬레이션 시작 ===', 'info');
    try {
      this.engine.run(code);
      this._setRunState(true);
      this._simTimer = setInterval(() => {
        const ms = this.engine.getElapsedMs();
        document.getElementById('sim-time').textContent = (ms / 1000).toFixed(3) + 's';
      }, 100);
      this._pinTimer = setInterval(() => this._updatePins(), 250);
    } catch (e) {
      this._showError(e.message || String(e));
    }
  }

  _stop() {
    this.engine?.stop();
    this._onStop();
    this._serialLog('=== 중지 ===', 'info');
  }

  _reset() {
    this._stop();
    this.engine?.reset();
    this.circuit?.resetComponents?.();
    document.getElementById('sim-time').textContent = '0.000s';
    this._serialLog('=== 리셋 ===', 'info');
    this._updatePins();
  }

  _onStop() {
    this._setRunState(false);
    clearInterval(this._simTimer);
    clearInterval(this._pinTimer);
  }

  _setRunState(running) {
    document.getElementById('btn-run').disabled  = running;
    document.getElementById('btn-stop').disabled = !running;
    const s = document.getElementById('sim-status');
    s.textContent = running ? '실행 중' : '정지됨';
    s.className   = 'sim-status ' + (running ? 'running' : 'stopped');
  }

  _setMode(mode) {
    this.circuit.setMode(mode);
    document.getElementById('btn-wire-mode').classList.toggle('active',   mode === 'wire');
    document.getElementById('btn-select-mode').classList.toggle('active', mode === 'select');
    const hints = { wire: '핀 클릭으로 와이어 연결 (ESC 취소)', select: '클릭 선택 / 드래그 이동' };
    document.getElementById('circuit-hint').textContent = hints[mode] || '';
  }

  /* ── 시리얼 ── */
  _serialLog(text, type = 'received') {
    const out = document.getElementById('serial-output');
    // text가 이미 \n을 포함할 수 있으므로 줄 단위로 분리
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (i === lines.length - 1 && line === '') return; // 마지막 빈 줄 건너뜀
      const span = document.createElement('span');
      span.className = `line ${type}`;
      span.textContent = line;
      out.appendChild(span);
      out.appendChild(document.createElement('br'));
    });
    if (out.scrollTop + out.clientHeight >= out.scrollHeight - 50) out.scrollTop = out.scrollHeight;
    while (out.children.length > 2000) out.removeChild(out.firstChild);
  }

  _serialSend() {
    const input  = document.getElementById('serial-input');
    const ending = document.getElementById('serial-line-ending').value;
    const text   = input.value;
    if (!text.trim()) return;
    this.engine.sendSerial(text + ending);
    this._serialLog('> ' + text, 'sent');
    input.value = '';
  }

  /* ── 핀 상태 그리드 ── */
  _initPinGrid() {
    const grid = document.getElementById('pin-state-grid');
    grid.innerHTML = '';
    [0,1,2,3,4,5,6,7,8,9,10,20,21].forEach(pin => {
      const div = document.createElement('div');
      div.className = 'pin-state-item';
      div.id = `pin-item-${pin}`;
      div.innerHTML = `<div class="pin-state-dot"></div>
        <span class="pin-state-name">G${pin}</span>
        <span class="pin-state-val" id="pin-val-${pin}">—</span>`;
      grid.appendChild(div);
    });
  }

  _updatePins() {
    const states = this.engine?.getPinStates() || {};
    Object.entries(states).forEach(([pin, info]) => {
      const item = document.getElementById(`pin-item-${pin}`);
      const val  = document.getElementById(`pin-val-${pin}`);
      if (!item || !val) return;
      item.className = 'pin-state-item';
      if (info.mode === 'pwm') {
        item.classList.add('pwm');
        val.textContent = Math.round(info.duty / 255 * 100) + '%';
      } else if (info.mode === 'adc') {
        item.classList.add('adc');
        val.textContent = info.value;
      } else if (info.value === 1) {
        item.classList.add('high');
        val.textContent = 'HIGH';
      } else {
        item.classList.add('low');
        val.textContent = info.mode ? 'LOW' : '—';
      }
    });
  }

  /* ── 템플릿 ── */
  _loadTemplate(id) {
    const tmpl = window.TEMPLATES?.[id];
    if (!tmpl) { this._showError(`템플릿 '${id}'를 찾을 수 없습니다.`); return; }
    this._stop();
    this.circuit.clearAll();
    this.circuit.renderBoard();
    // 컴포넌트 형식 정규화: { type, color, value, x, y } → { id, type, x, y, config }
    const normalized = Object.assign({}, tmpl);
    if (normalized.components) {
      let idx = 0;
      normalized.components = normalized.components.map(c => {
        const { type, x, y, id: cid, config, ...rest } = c;
        return {
          id:     cid || `comp_${idx++}`,
          type:   type,
          x:      x || 400,
          y:      y || 200,
          config: config || rest,
        };
      });
    }
    this.circuit.loadTemplate(normalized);
    if (tmpl.defaultCode) this.editor?.setValue(tmpl.defaultCode.trim());
    this._serialLog(`템플릿: ${tmpl.name}`, 'info');
  }

  /* ── 내보내기/가져오기 ── */
  _export() {
    const data = { version: '1.0', code: this.editor?.getValue() || '', circuit: this.circuit?.toJSON() || {} };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'arduino-sim.json';
    a.click();
  }

  _import(json) {
    try {
      const d = JSON.parse(json);
      if (d.code)    this.editor?.setValue(d.code);
      if (d.circuit) { this.circuit.clearAll(); this.circuit.loadFromJSON(d.circuit); }
      this._serialLog('프로젝트 로드됨', 'info');
    } catch (e) { this._showError('파일 오류: ' + e.message); }
  }

  /* ── 에러 ── */
  _showError(msg) {
    document.getElementById('error-panel').style.display = 'block';
    document.getElementById('error-message').textContent = msg;
    const s = document.getElementById('sim-status');
    s.textContent = '오류'; s.className = 'sim-status error';
    this._serialLog('⚠ ' + msg.split('\n')[0], 'error');
    this._onStop();
  }

  /* ── 패널 리사이즈 ── */
  _initPanelResize() {
    const div = document.getElementById('panel-divider');
    const ep  = document.getElementById('editor-panel');
    const bp  = document.getElementById('bottom-panel');
    let sy, se, sb;
    div.addEventListener('mousedown', e => {
      sy = e.clientY; se = ep.offsetHeight; sb = bp.offsetHeight;
      const onMove = me => {
        const dy = me.clientY - sy;
        ep.style.flex = 'none'; ep.style.height = Math.max(80, se + dy) + 'px';
        bp.style.height = Math.max(80, sb - dy) + 'px';
      };
      const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
      e.preventDefault();
    });
  }

  /* ── 기본 코드 ── */
  _loadDefaultCode() {
    this.editor?.setValue(`/*
 * ESP32-C3 Super Mini 시뮬레이터에 오신 것을 환영합니다!
 *
 * 사용 방법:
 *   1. 왼쪽 팔레트에서 부품을 캔버스로 드래그하세요
 *   2. 템플릿 선택 → 불러오기로 회로+코드를 한번에 로드할 수 있습니다
 *   3. F5 또는 ▶ 실행 버튼으로 시뮬레이션을 시작하세요
 */

#define LED_PIN   8    // 내장 LED (G8, Active LOW)
#define INTERVAL  500  // 깜빡임 간격 (ms)

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("ESP32-C3 시뮬레이터 시작!");
  Serial.println("내장 LED(G8) 깜빡임 — LOW=켜짐, HIGH=꺼짐");
}

void loop() {
  digitalWrite(LED_PIN, LOW);    // 켜기
  Serial.println("LED ON");
  delay(INTERVAL);

  digitalWrite(LED_PIN, HIGH);   // 끄기
  Serial.println("LED OFF");
  delay(INTERVAL);
}`);
  }
}

/* ── 앱 시작 ── */
window.addEventListener('load', () => { window.app = new App(); });
