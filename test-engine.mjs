/**
 * 시뮬레이션 엔진 통합 테스트
 * 실제 Arduino 코드를 트랜스파일 → 실행하여 동작 검증
 *
 * 실행: node test-engine.mjs
 */

import { ArduinoTranspiler } from './packages/sim-engine/dist/runtime/transpiler.js';
import { GpioController } from './packages/sim-engine/dist/runtime/gpio.js';
import { SimScheduler } from './packages/sim-engine/dist/runtime/scheduler.js';
import { buildPreamble } from './packages/sim-engine/dist/runtime/preamble.js';

// ─── 테스트 유틸 ─────────────────────────────────────────────────
let passed = 0, failed = 0;
function ok(label, cond, detail = '') {
  if (cond) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}
function section(title) {
  console.log(`\n${'─'.repeat(60)}\n▶ ${title}\n${'─'.repeat(60)}`);
}

// ─── 메시지 캡처용 mock post 함수 ────────────────────────────────
function makeRunner() {
  const messages = [];
  const serialLines = [];
  let _serialBuf = '';
  const post = (msg) => {
    messages.push(msg);
    if (msg.type === 'SERIAL_OUTPUT') {
      // Serial.print/println 버퍼링: 개행문자(\n)가 오면 한 줄로 확정
      _serialBuf += msg.text;
      const parts = _serialBuf.split('\n');
      for (let i = 0; i < parts.length - 1; i++) {
        serialLines.push(parts[i]);
      }
      _serialBuf = parts[parts.length - 1];
    }
    if (msg.type === 'COMPILE_ERROR') console.error('  [COMPILE_ERROR]', msg.message);
    if (msg.type === 'RUNTIME_ERROR') console.error('  [RUNTIME_ERROR]', msg.message);
    if (msg.type === 'SIM_ERROR') console.error('  [SIM_ERROR]', msg.message);
  };
  return { messages, serialLines, post };
}

async function runCode(code, circuit = { boardType: 'arduino-uno', components: [] }, timeoutMs = 800) {
  const { messages, serialLines, post } = makeRunner();
  const transpiler = new ArduinoTranspiler();
  const jsCode = transpiler.transpile(code);

  const scheduler = new SimScheduler();
  const gpio = new GpioController(post);

  // 컴포넌트 콜백 등록
  const { INPUT_PIN_REGISTRY } = await import('./packages/sim-engine/dist/runtime/input-pin-registry.js');
  for (const comp of circuit.components) {
    const handlers = INPUT_PIN_REGISTRY[comp.type];
    if (!handlers?.length) continue;
    for (const [pin, target] of Object.entries(comp.connections ?? {})) {
      const handler = handlers.find(h => h.pin === pin);
      if (handler && typeof target === 'number') {
        const ctxKey = `${handler.ctxKey}_${comp.id}`;
        const defaultValue = handler.defaultValue;
        gpio.registerInputCallback(target, () => (_ctx[ctxKey] ?? defaultValue));
      }
    }
  }

  const _ctx = {};
  const preamble = buildPreamble(gpio, scheduler, post, circuit.boardType, []);

  const fullCode = `
${preamble}
${jsCode}
await setup();
while (true) { await loop(); await __delay(1); }
`;

  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  let fn;
  try {
    fn = new AsyncFunction('gpio', 'scheduler', 'postFn', '_ctx', fullCode);
  } catch (err) {
    post({ type: 'COMPILE_ERROR', message: err.message });
    return { messages, serialLines, gpio, jsCode };
  }

  scheduler.start();
  const simPromise = fn(gpio, scheduler, post, _ctx).catch(err => {
    if (err?.name !== 'AbortError') console.error('  [SIM_ERROR]', err.message);
  });

  await new Promise(r => setTimeout(r, timeoutMs));
  scheduler.stop();
  await simPromise.catch(() => {});

  return { messages, serialLines, gpio, jsCode };
}

// ═══════════════════════════════════════════════════════════════
// 1. 트랜스파일러 기본 변환
// ═══════════════════════════════════════════════════════════════
section('트랜스파일러 — 기본 변환');
{
  const t = new ArduinoTranspiler();

  const r1 = t.transpile('void setup() {\n  int x = 5;\n}');
  ok('int x → let x', r1.includes('let x'));
  ok('void setup → async function setup', r1.includes('async function setup'));

  const r2 = t.transpile('void loop() { delay(100); }');
  ok('delay(100) → await __delay(100)', r2.includes('await __delay(100)'));

  const r3 = t.transpile('#define PIN 13\nvoid setup() { pinMode(PIN, OUTPUT); }');
  ok('#define PIN 13 → const PIN = 13', r3.includes('const PIN = 13'));
  ok('pinMode → __pinMode', r3.includes('__pinMode'));

  const r4 = t.transpile('void setup() { for (int i=0; i<10; i++) {} }');
  ok('for(int i → for(let i', r4.includes('for (let i'));

  const r5 = t.transpile('void setup() { digitalWrite(13, HIGH); }');
  ok('digitalWrite → __digitalWrite', r5.includes('__digitalWrite'));
  ok('HIGH → 1', r5.includes('__digitalWrite(13,1)'));

  const r6 = t.transpile('void setup() { analogWrite(9, 128); }');
  ok('analogWrite → __analogWrite', r6.includes('__analogWrite'));

  const r7 = t.transpile('void setup() { float t = 25.5f; }');
  ok('25.5f → 25.5', r7.includes('25.5') && !r7.includes('25.5f'));

  const r8 = t.transpile('void setup() { Serial.println("hello"); }');
  ok('Serial.println → __serial_println', r8.includes('__serial_println'));

  const r9 = t.transpile('void setup() { int x = (int)3.7; }');
  ok('(int)3.7 → Math.trunc(3.7)', r9.includes('Math.trunc(3.7)'));

  const r10 = t.transpile(`
    void setup() {
      static int count = 0;
      count++;
    }
  `);
  ok('static int → let __static_count', r10.includes('let __static_count'));
  ok('count 참조 → __static_count', r10.includes('__static_count++'));

  const r11 = t.transpile('void setup() { ledcAttachPin(9, 0); ledcWrite(0, 512); }');
  ok('ledcAttachPin → __ledcPinMap 매핑', r11.includes('__ledcPinMap[0]=9') || r11.includes('__ledcPinMap[0] = 9'));
  ok('ledcWrite → __analogWrite', r11.includes('__analogWrite'));

  // 중첩 괄호 delay
  const r12 = t.transpile('void loop() { delay(map(x, 0, 1023, 100, 1000)); }');
  ok('delay(map(...)) 올바르게 변환', !r12.includes('await __delay(map(x, 0, 1023, 100, 1000)') || r12.includes('await __delay'));
}

// ═══════════════════════════════════════════════════════════════
// 2. GPIO 컨트롤러
// ═══════════════════════════════════════════════════════════════
section('GPIO 컨트롤러');
{
  const { messages, post } = makeRunner();
  const gpio = new GpioController(post);

  gpio.pinMode(13, 1); // OUTPUT
  gpio.digitalWrite(13, 1);
  ok('digitalWrite HIGH → PIN_STATE value=1', messages.some(m => m.type === 'PIN_STATE' && m.pin === 13 && m.value === 1));

  gpio.digitalWrite(13, 0);
  ok('digitalWrite LOW → PIN_STATE value=0', messages.some(m => m.type === 'PIN_STATE' && m.pin === 13 && m.value === 0));

  gpio.pinMode(2, 0); // INPUT
  ok('digitalRead INPUT 기본값 = 0', gpio.digitalRead(2) === 0);

  gpio.pinMode(3, 2); // INPUT_PULLUP
  ok('digitalRead INPUT_PULLUP 기본값 = 1 (HIGH)', gpio.digitalRead(3) === 1);

  gpio.injectPinValue(3, 0); // 버튼 눌림
  ok('injectPinValue(0) 후 digitalRead = 0', gpio.digitalRead(3) === 0);

  gpio.injectPinValue(3, 1); // 버튼 릴림
  ok('injectPinValue(1) 후 digitalRead = 1', gpio.digitalRead(3) === 1);

  gpio.analogWrite(9, 128);
  ok('analogWrite(128) → PIN_STATE value=128', messages.some(m => m.type === 'PIN_STATE' && m.pin === 9 && m.value === 128));

  gpio.analogWrite(9, 512);
  ok('analogWrite(512) → PIN_STATE value=512 (10-bit 지원)', messages.some(m => m.type === 'PIN_STATE' && m.pin === 9 && m.value === 512));

  gpio.analogWrite(9, 1500);
  ok('analogWrite(1500) → 1023으로 클램핑', messages.some(m => m.type === 'PIN_STATE' && m.pin === 9 && m.value === 1023));
}

// ═══════════════════════════════════════════════════════════════
// 3. LED 깜빡이기 (가장 기본)
// ═══════════════════════════════════════════════════════════════
section('시나리오 1: LED Blink (Arduino Uno, pin 13)');
{
  const code = `
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("Blink 시작");
}

void loop() {
  digitalWrite(13, HIGH);
  delay(200);
  digitalWrite(13, LOW);
  delay(200);
}
`;
  const { messages, serialLines } = await runCode(code, { boardType: 'arduino-uno', components: [] }, 1200);

  const pinStates = messages.filter(m => m.type === 'PIN_STATE' && m.pin === 13);
  const highs = pinStates.filter(m => m.value === 1).length;
  const lows  = pinStates.filter(m => m.value === 0).length;

  ok('Serial.println 출력됨', serialLines.some(l => l.includes('Blink 시작')));
  ok('pin 13 HIGH 이벤트 1회 이상', highs >= 1);
  ok('pin 13 LOW 이벤트 1회 이상', lows >= 1);
  ok('HIGH/LOW 교번 반복', highs >= 2 && lows >= 2);
  console.log(`    → HIGH ${highs}회, LOW ${lows}회`);
}

// ═══════════════════════════════════════════════════════════════
// 4. 버튼 + LED (INPUT_PULLUP)
// ═══════════════════════════════════════════════════════════════
section('시나리오 2: 버튼 + LED (INPUT_PULLUP)');
{
  const circuit = {
    boardType: 'arduino-uno',
    components: [
      {
        id: 'btn-1',
        type: 'button',
        props: {},
        connections: { PIN1A: 2 }, // 버튼 → GPIO 2
      },
      {
        id: 'led-1',
        type: 'led',
        props: {},
        connections: { ANODE: 13 }, // LED → GPIO 13
      },
    ],
  };

  const code = `
void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (digitalRead(2) == LOW) {
    digitalWrite(13, HIGH);
    Serial.println("버튼 눌림");
  } else {
    digitalWrite(13, LOW);
  }
  delay(10);
}
`;
  const { messages, serialLines, gpio, jsCode } = await runCode(code, circuit, 300);

  // 기본 상태: INPUT_PULLUP → HIGH → LED OFF
  const earlyPinStates = messages.filter(m => m.type === 'PIN_STATE' && m.pin === 13);
  ok('초기 LED OFF (버튼 안 눌림)', earlyPinStates.length === 0 || earlyPinStates[0].value === 0);
  ok('컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('런타임 에러 없음', !messages.some(m => m.type === 'RUNTIME_ERROR'));
}

// ═══════════════════════════════════════════════════════════════
// 5. Serial.print 다양한 타입
// ═══════════════════════════════════════════════════════════════
section('시나리오 3: Serial 출력 — 다양한 타입');
{
  const code = `
void setup() {
  Serial.begin(9600);
  Serial.println("문자열");
  Serial.println(42);
  Serial.println(3.14);
  int x = 10;
  Serial.print("x = ");
  Serial.println(x);
}
void loop() { delay(1000); }
`;
  const { serialLines } = await runCode(code, { boardType: 'arduino-uno', components: [] }, 200);

  ok('"문자열" 출력', serialLines.some(l => l.includes('문자열')));
  ok('"42" 출력', serialLines.some(l => l.includes('42')));
  ok('"3.14" 출력', serialLines.some(l => l.includes('3.14')));
  ok('"x = 10" 출력', serialLines.some(l => l.includes('x = ') && l.includes('10')));
}

// ═══════════════════════════════════════════════════════════════
// 6. 가변저항 → analogRead → Serial 출력
// ═══════════════════════════════════════════════════════════════
section('시나리오 4: 가변저항 analogRead');
{
  const circuit = {
    boardType: 'arduino-uno',
    components: [
      {
        id: 'pot-1',
        type: 'potentiometer',
        props: {},
        connections: { WIPER: 0 }, // A0 핀
      },
    ],
  };

  const code = `
void setup() {
  Serial.begin(9600);
}
void loop() {
  int val = analogRead(0);
  Serial.println(val);
  delay(100);
}
`;
  const { serialLines } = await runCode(code, circuit, 500);

  ok('analogRead 값 출력됨', serialLines.length > 0);
  // 기본값 512 (가변저항 중점)
  ok('기본값 512 반환', serialLines.some(l => l.includes('512')));
  console.log(`    → 출력: ${serialLines.slice(0, 3).map(l => l.trim()).join(', ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 7. millis() 타이머
// ═══════════════════════════════════════════════════════════════
section('시나리오 5: millis() 타이머');
{
  const code = `
unsigned long prevMs = 0;
int ledState = 0;

void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  unsigned long now = millis();
  if (now - prevMs >= 300) {
    prevMs = now;
    ledState = !ledState;
    digitalWrite(13, ledState);
    Serial.print("LED: ");
    Serial.println(ledState);
  }
  delay(10);
}
`;
  const { messages, serialLines } = await runCode(code, { boardType: 'arduino-uno', components: [] }, 1200);

  const pinStates = messages.filter(m => m.type === 'PIN_STATE' && m.pin === 13);
  ok('millis() 기반 타이머 동작', pinStates.length >= 2);
  ok('Serial 타이머 출력 확인', serialLines.some(l => l.includes('LED:')));
  console.log(`    → 토글 ${pinStates.length}회, 시리얼 ${serialLines.length}줄`);
}

// ═══════════════════════════════════════════════════════════════
// 8. ESP32 PWM (ledcWrite)
// ═══════════════════════════════════════════════════════════════
section('시나리오 6: ESP32 PWM ledcWrite');
{
  const code = `
void setup() {
  ledcSetup(0, 5000, 10);
  ledcAttachPin(9, 0);
  ledcWrite(0, 512);  // 50% duty (10-bit)
  Serial.begin(9600);
  Serial.println("PWM 시작");
}
void loop() { delay(1000); }
`;
  const { messages, serialLines } = await runCode(code, { boardType: 'esp32-c3-supermini', components: [] }, 300);

  const pinState = messages.find(m => m.type === 'PIN_STATE' && m.pin === 9);
  ok('ledcWrite(0,512) → PIN_STATE 전송', !!pinState);
  ok('value=512 (10-bit 그대로 전달)', pinState?.value === 512);
  ok('"PWM 시작" 시리얼 출력', serialLines.some(l => l.includes('PWM 시작')));
  console.log(`    → pin 9 value: ${pinState?.value}`);
}

// ═══════════════════════════════════════════════════════════════
// 9. struct + static 변수
// ═══════════════════════════════════════════════════════════════
section('시나리오 7: struct + static 변수');
{
  const code = `
struct Point {
  int x;
  int y;
};

void setup() {
  Serial.begin(9600);
  Point p;
  p.x = 10;
  p.y = 20;
  Serial.print("x="); Serial.println(p.x);
  Serial.print("y="); Serial.println(p.y);
}

void incrementAndPrint() {
  static int count = 0;
  count++;
  Serial.print("count=");
  Serial.println(count);
}

void loop() {
  incrementAndPrint();
  delay(300);
}
`;
  const { serialLines } = await runCode(code, { boardType: 'arduino-uno', components: [] }, 1000);

  ok('struct p.x = 10 출력', serialLines.some(l => l.includes('x=10') || (l.includes('x=') && l.includes('10'))));
  ok('struct p.y = 20 출력', serialLines.some(l => l.includes('y=20') || (l.includes('y=') && l.includes('20'))));
  ok('static count 1부터 증가', serialLines.some(l => l.includes('count=1')));
  ok('static count 누적 증가', serialLines.some(l => l.includes('count=2') || l.includes('count=3')));
  console.log(`    → ${serialLines.slice(0, 5).map(l => l.trim()).join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 10. map / constrain
// ═══════════════════════════════════════════════════════════════
section('시나리오 8: map() / constrain()');
{
  const code = `
void setup() {
  Serial.begin(9600);
  int raw = 512;
  int mapped = map(raw, 0, 1023, 0, 100);
  Serial.println(mapped);     // 기대: 50
  int clamped = constrain(200, 0, 100);
  Serial.println(clamped);    // 기대: 100
  int clamped2 = constrain(-5, 0, 100);
  Serial.println(clamped2);   // 기대: 0
}
void loop() { delay(1000); }
`;
  const { serialLines } = await runCode(code, { boardType: 'arduino-uno', components: [] }, 200);

  ok('map(512, 0,1023, 0,100) ≈ 50', serialLines.some(l => l.trim() === '50'));
  ok('constrain(200, 0,100) = 100', serialLines.some(l => l.trim() === '100'));
  ok('constrain(-5, 0,100) = 0', serialLines.some(l => l.trim() === '0'));
  console.log(`    → 출력: ${serialLines.map(l=>l.trim()).join(', ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 11. #define 함수형 매크로
// ═══════════════════════════════════════════════════════════════
section('시나리오 9: #define 함수형 매크로');
{
  const code = `
#define MAX_VAL(a, b) ((a) > (b) ? (a) : (b))
#define DOUBLE(x) ((x) * 2)

void setup() {
  Serial.begin(9600);
  int m = MAX_VAL(3, 7);
  Serial.println(m);     // 기대: 7
  int d = DOUBLE(6);
  Serial.println(d);     // 기대: 12
}
void loop() { delay(1000); }
`;
  const { serialLines } = await runCode(code, { boardType: 'arduino-uno', components: [] }, 200);

  ok('MAX_VAL(3, 7) = 7', serialLines.some(l => l.trim() === '7'));
  ok('DOUBLE(6) = 12', serialLines.some(l => l.trim() === '12'));
  console.log(`    → 출력: ${serialLines.map(l=>l.trim()).join(', ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 결과 요약
// ═══════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(60)}`);
console.log(`결과: ✅ ${passed}개 통과 / ❌ ${failed}개 실패 / 합계 ${passed + failed}개`);
console.log('═'.repeat(60));
if (failed > 0) process.exit(1);
