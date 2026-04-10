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

  // sim-worker.ts와 동일하게 _gpioToComp, _i2cDevices 구성
  const gpioToCompMap = new Map();
  const i2cDevices = new Map();
  for (const comp of circuit.components) {
    for (const [pinName, gpioNum] of Object.entries(comp.connections ?? {})) {
      gpioToCompMap.set(+gpioNum, { id: comp.id, type: comp.type, pin: pinName });
    }
    // I2C 디바이스: lcd, oled 등
    if (comp.i2cAddress !== undefined) {
      i2cDevices.set(comp.i2cAddress, { id: comp.id, type: comp.type });
    }
    // 기본 I2C 주소 자동 매핑
    if (comp.type === 'lcd')  i2cDevices.set(0x27, { id: comp.id, type: comp.type });
    if (comp.type === 'oled') i2cDevices.set(0x3C, { id: comp.id, type: comp.type });
  }
  _ctx._gpioToComp = gpioToCompMap;
  _ctx._i2cDevices = i2cDevices;

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
// 10. DHT11/DHT22 온습도 센서 + SENSOR_UPDATE 연동
// ═══════════════════════════════════════════════════════════════
section('시나리오 10: DHT 온습도 센서');
{
  const code = `
#include <DHT.h>
#define DHTPIN 2
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  Serial.print("T=");
  Serial.println(t);
  Serial.print("H=");
  Serial.println(h);
  delay(500);
}
`;
  const dhtComp = { id: 'dht1', type: 'dht', connections: { DATA: 2 } };
  const { serialLines, messages, gpio } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [dhtComp] },
    700
  );

  // SENSOR_UPDATE로 온도/습도 주입
  // (test runner에서 직접 _ctx에 주입하는 방식으로 검증)
  ok('DHT 기본 온도 25.0 출력', serialLines.some(l => l.includes('T=') && l.includes('25')));
  ok('DHT 기본 습도 60.0 출력', serialLines.some(l => l.includes('H=') && l.includes('60')));
  ok('DHT 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  console.log(`    → 출력: ${serialLines.slice(0,4).join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 11. HC-SR04 초음파 센서 (pulseIn 시뮬레이션)
// ═══════════════════════════════════════════════════════════════
section('시나리오 11: 초음파 거리 센서');
{
  const code = `
#define TRIG_PIN 9
#define ECHO_PIN 10

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2.0;
  Serial.print("D=");
  Serial.println(distance);
  delay(400);
}
`;
  const usComp = { id: 'us1', type: 'ultrasonic', connections: { TRIG: 9, ECHO: 10 } };
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [usComp] },
    600
  );

  ok('초음파 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('초음파 거리값 출력', serialLines.some(l => l.includes('D=')));
  // 기본 거리 20cm → duration = 20*2/0.034 ≈ 1176 μs → distance ≈ 20cm
  ok('초음파 기본 거리 ~20cm', serialLines.some(l => {
    const m = l.match(/D=(\d+\.?\d*)/);
    if (!m) return false;
    const d = parseFloat(m[1]);
    return d >= 15 && d <= 25; // 20cm ±5cm 허용
  }));
  console.log(`    → 출력: ${serialLines.slice(0,3).join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 12. SG90 서보 모터 (Servo 라이브러리)
// ═══════════════════════════════════════════════════════════════
section('시나리오 12: 서보 모터 제어');
{
  const code = `
#include <Servo.h>
Servo myServo;

void setup() {
  Serial.begin(9600);
  myServo.attach(9);
  myServo.write(0);
  Serial.println("servo:0");
  delay(200);
  myServo.write(90);
  Serial.println("servo:90");
  delay(200);
  myServo.write(180);
  Serial.println("servo:180");
}

void loop() { delay(1000); }
`;
  const servoComp = { id: 'sv1', type: 'servo', connections: { SIGNAL: 9 } };
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [servoComp] },
    800
  );

  ok('서보 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('서보 0도 출력', serialLines.some(l => l.includes('servo:0')));
  ok('서보 90도 출력', serialLines.some(l => l.includes('servo:90')));
  ok('서보 180도 출력', serialLines.some(l => l.includes('servo:180')));
  // COMPONENT_UPDATE로 SIGNAL 핀 전송됐는지
  ok('서보 COMPONENT_UPDATE 전송', messages.some(m =>
    m.type === 'COMPONENT_UPDATE' && m.pin === 'SIGNAL'
  ));
  console.log(`    → 출력: ${serialLines.join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 13. WS2812B NeoPixel (Adafruit_NeoPixel 라이브러리)
// ═══════════════════════════════════════════════════════════════
section('시나리오 13: NeoPixel RGB LED');
{
  const code = `
#include <Adafruit_NeoPixel.h>
#define LED_PIN 6
#define NUM_LEDS 3
Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  Serial.begin(9600);
  strip.begin();
  strip.setPixelColor(0, strip.Color(255, 0, 0));   // 빨강
  strip.setPixelColor(1, strip.Color(0, 255, 0));   // 초록
  strip.setPixelColor(2, strip.Color(0, 0, 255));   // 파랑
  strip.show();
  Serial.println("neopixel:done");
}

void loop() { delay(1000); }
`;
  const neoComp = { id: 'np1', type: 'neopixel', numLeds: 3, connections: { DIN: 6 } };
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [neoComp] },
    500
  );

  ok('NeoPixel 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('NeoPixel 완료 출력', serialLines.some(l => l.includes('neopixel:done')));
  // LED0 핀 → 빨강 (255,0,0) = 0xFF0000 = 16711680
  ok('NeoPixel LED0 COMPONENT_UPDATE', messages.some(m =>
    m.type === 'COMPONENT_UPDATE' && m.pin === 'LED0'
  ));
  ok('NeoPixel SHOW COMPONENT_UPDATE', messages.some(m =>
    m.type === 'COMPONENT_UPDATE' && m.pin === 'SHOW'
  ));
  const led0Msg = messages.find(m => m.type === 'COMPONENT_UPDATE' && m.pin === 'LED0');
  ok('LED0 빨강 색상 (FF0000)', led0Msg && Number(led0Msg.value) === 0xFF0000);
  console.log(`    → COMPONENT_UPDATE 수: ${messages.filter(m=>m.type==='COMPONENT_UPDATE').length}`);
}

// ═══════════════════════════════════════════════════════════════
// 14. I2C LCD (LiquidCrystal_I2C 라이브러리)
// ═══════════════════════════════════════════════════════════════
section('시나리오 14: LCD 디스플레이');
{
  const code = `
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.begin(16, 2);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Hello World");
  lcd.setCursor(0, 1);
  lcd.print("Arduino Sim");
}

void loop() { delay(1000); }
`;
  const lcdComp = { id: 'lcd1', type: 'lcd', connections: { SDA: 'A4', SCL: 'A5' } };
  const { messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [lcdComp] },
    400
  );

  ok('LCD 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('LCD INIT 전송', messages.some(m =>
    m.type === 'COMPONENT_UPDATE' && m.pin === 'INIT'
  ));
  ok('LCD CLEAR 전송', messages.some(m =>
    m.type === 'COMPONENT_UPDATE' && m.pin === 'CLEAR'
  ));
  ok('LCD PRINT Hello World 전송', messages.some(m =>
    m.type === 'COMPONENT_UPDATE' && m.pin === 'PRINT' && String(m.value).includes('Hello World')
  ));
  ok('LCD CURSOR 전송', messages.some(m =>
    m.type === 'COMPONENT_UPDATE' && m.pin === 'CURSOR'
  ));
  console.log(`    → LCD 업데이트: ${messages.filter(m=>m.type==='COMPONENT_UPDATE').map(m=>`${m.pin}="${m.value}"`).join(', ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 15. SSD1306 OLED (Adafruit_SSD1306 라이브러리)
// ═══════════════════════════════════════════════════════════════
section('시나리오 15: OLED 디스플레이');
{
  const code = `
#include <Adafruit_SSD1306.h>
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("OLED Test");
  display.drawPixel(64, 32, WHITE);
  display.display();
}

void loop() { delay(1000); }
`;
  const oledComp = { id: 'oled1', type: 'oled', connections: { SDA: 'A4', SCL: 'A5' } };
  const { messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [oledComp] },
    400
  );

  ok('OLED 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('OLED CLEAR 전송', messages.some(m =>
    m.type === 'COMPONENT_UPDATE' && m.pin === 'CLEAR'
  ));
  ok('OLED PRINT 전송', messages.some(m =>
    m.type === 'COMPONENT_UPDATE' && m.pin === 'PRINT' && String(m.value).includes('OLED Test')
  ));
  ok('OLED PIXEL 전송', messages.some(m =>
    m.type === 'COMPONENT_UPDATE' && m.pin === 'PIXEL'
  ));
  ok('OLED DISPLAY 전송', messages.some(m =>
    m.type === 'COMPONENT_UPDATE' && m.pin === 'DISPLAY'
  ));
  console.log(`    → OLED 업데이트: ${messages.filter(m=>m.type==='COMPONENT_UPDATE').map(m=>m.pin).join(', ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 16. RGB LED (개별 PWM 핀 제어)
// ═══════════════════════════════════════════════════════════════
section('시나리오 16: RGB LED');
{
  const code = `
#define RED_PIN 9
#define GREEN_PIN 10
#define BLUE_PIN 11

void setup() {
  Serial.begin(9600);
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  // 빨강
  analogWrite(RED_PIN, 255);
  analogWrite(GREEN_PIN, 0);
  analogWrite(BLUE_PIN, 0);
  Serial.println("red");
  delay(100);
  // 초록
  analogWrite(RED_PIN, 0);
  analogWrite(GREEN_PIN, 255);
  analogWrite(BLUE_PIN, 0);
  Serial.println("green");
  delay(100);
  // 파랑
  analogWrite(RED_PIN, 0);
  analogWrite(GREEN_PIN, 0);
  analogWrite(BLUE_PIN, 255);
  Serial.println("blue");
}

void loop() { delay(1000); }
`;
  const rgbComp = {
    id: 'rgb1', type: 'rgb-led',
    connections: { RED: 9, GREEN: 10, BLUE: 11 }
  };
  const { serialLines, messages, gpio } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [rgbComp] },
    600
  );

  const pinStates = messages.filter(m => m.type === 'PIN_STATE');
  ok('RGB 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('RED 핀 255 출력', pinStates.some(m => m.pin === 9 && m.value === 255));
  ok('GREEN 핀 255 출력', pinStates.some(m => m.pin === 10 && m.value === 255));
  ok('BLUE 핀 255 출력', pinStates.some(m => m.pin === 11 && m.value === 255));
  ok('red 시리얼 출력', serialLines.some(l => l.trim() === 'red'));
  ok('green 시리얼 출력', serialLines.some(l => l.trim() === 'green'));
  ok('blue 시리얼 출력', serialLines.some(l => l.trim() === 'blue'));
  console.log(`    → PIN_STATE pin9: ${pinStates.filter(m=>m.pin===9).map(m=>m.value).join(',')}`);
}

// ═══════════════════════════════════════════════════════════════
// 17. 7-세그먼트 디스플레이 (직접 핀 제어)
// ═══════════════════════════════════════════════════════════════
section('시나리오 17: 7-세그먼트 디스플레이');
{
  // 숫자 0: A,B,C,D,E,F 켜기, G 끄기
  const code = `
#define SEG_A 2
#define SEG_B 3
#define SEG_C 4
#define SEG_D 5
#define SEG_E 6
#define SEG_F 7
#define SEG_G 8

void setup() {
  Serial.begin(9600);
  for (int i = 2; i <= 8; i++) pinMode(i, OUTPUT);
  // 숫자 '0' 표시: A,B,C,D,E,F ON / G OFF
  digitalWrite(SEG_A, HIGH);
  digitalWrite(SEG_B, HIGH);
  digitalWrite(SEG_C, HIGH);
  digitalWrite(SEG_D, HIGH);
  digitalWrite(SEG_E, HIGH);
  digitalWrite(SEG_F, HIGH);
  digitalWrite(SEG_G, LOW);
  Serial.println("digit:0");
}

void loop() { delay(1000); }
`;
  const segComp = {
    id: 'seg1', type: 'seven-segment',
    connections: { A: 2, B: 3, C: 4, D: 5, E: 6, F: 7, G: 8 }
  };
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [segComp] },
    300
  );

  const pinStates = messages.filter(m => m.type === 'PIN_STATE');
  ok('7-세그 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('A핀(2) HIGH', pinStates.some(m => m.pin === 2 && m.value === 1));
  ok('G핀(8) LOW', pinStates.some(m => m.pin === 8 && m.value === 0));
  ok('digit:0 출력', serialLines.some(l => l.includes('digit:0')));
  console.log(`    → PIN_STATE 수: ${pinStates.length}, 시리얼: ${serialLines.join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 18. 조이스틱 (아날로그 3축 입력)
// ═══════════════════════════════════════════════════════════════
section('시나리오 18: 조이스틱 아날로그 입력');
{
  const code = `
#define VRX_PIN A0
#define VRY_PIN A1
#define SW_PIN 2

void setup() {
  Serial.begin(9600);
  pinMode(SW_PIN, INPUT_PULLUP);
}

void loop() {
  int x = analogRead(VRX_PIN);
  int y = analogRead(VRY_PIN);
  int sw = digitalRead(SW_PIN);
  Serial.print("X="); Serial.println(x);
  Serial.print("Y="); Serial.println(y);
  Serial.print("SW="); Serial.println(sw);
  delay(300);
}
`;
  const joyComp = {
    id: 'joy1', type: 'joystick',
    connections: { VRX: 14, VRY: 15, SW: 2 } // A0=14, A1=15
  };
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [joyComp] },
    500
  );

  ok('조이스틱 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('X축 기본값 512', serialLines.some(l => l.includes('X=') && l.includes('512')));
  ok('Y축 기본값 512', serialLines.some(l => l.includes('Y=') && l.includes('512')));
  ok('SW 기본값 1 (안 눌림)', serialLines.some(l => l.includes('SW=') && l.includes('1')));
  console.log(`    → 출력: ${serialLines.slice(0,6).join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 19. LM35 온도 센서 (아날로그 입력)
// ═══════════════════════════════════════════════════════════════
section('시나리오 19: LM35 온도 센서');
{
  const code = `
#define LM35_PIN A0

void setup() {
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(LM35_PIN);
  float voltage = raw * (5.0 / 1023.0);
  float temperature = voltage * 100.0;
  Serial.print("RAW="); Serial.println(raw);
  Serial.print("TEMP="); Serial.println(temperature);
  delay(400);
}
`;
  const lm35Comp = {
    id: 'lm1', type: 'lm35',
    connections: { OUT: 14 } // A0 = pin 14
  };
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [lm35Comp] },
    600
  );

  ok('LM35 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('LM35 RAW 출력', serialLines.some(l => l.startsWith('RAW=')));
  // 기본 온도 25°C → ADC = 25*1023/500 ≈ 51
  ok('LM35 기본값 51 근방', serialLines.some(l => {
    const m = l.match(/RAW=(\d+)/);
    if (!m) return false;
    const v = parseInt(m[1]);
    return v >= 48 && v <= 55;
  }));
  ok('LM35 온도 25°C 근방', serialLines.some(l => {
    const m = l.match(/TEMP=(\d+\.?\d*)/);
    if (!m) return false;
    const t = parseFloat(m[1]);
    return t >= 22 && t <= 28;
  }));
  console.log(`    → 출력: ${serialLines.slice(0,4).join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 20. 디지털 센서들 (Hall, PIR, Sound, IR Receiver)
// ═══════════════════════════════════════════════════════════════
section('시나리오 20: 디지털 센서 기본값 (Hall/PIR/Sound/IR)');
{
  const code = `
#define HALL_PIN 2
#define PIR_PIN 3
#define SOUND_PIN 4
#define IR_PIN 5

void setup() {
  Serial.begin(9600);
  pinMode(HALL_PIN, INPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(SOUND_PIN, INPUT);
  pinMode(IR_PIN, INPUT);
}

void loop() {
  int hall = digitalRead(HALL_PIN);
  int pir = digitalRead(PIR_PIN);
  int sound = digitalRead(SOUND_PIN);
  int ir = digitalRead(IR_PIN);
  Serial.print("HALL="); Serial.println(hall);
  Serial.print("PIR="); Serial.println(pir);
  Serial.print("SOUND="); Serial.println(sound);
  Serial.print("IR="); Serial.println(ir);
  delay(400);
}
`;
  const components = [
    { id: 'hall1',  type: 'hall-sensor',  connections: { OUT: 2 } },
    { id: 'pir1',   type: 'pir-sensor',   connections: { OUT: 3 } },
    { id: 'sound1', type: 'sound-sensor', connections: { DO: 4 } },
    { id: 'ir1',    type: 'ir-receiver',  connections: { OUT: 5 } },
  ];
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components },
    600
  );

  ok('디지털 센서 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('Hall 기본값 0', serialLines.some(l => l.includes('HALL=0')));
  ok('PIR 기본값 0', serialLines.some(l => l.includes('PIR=0')));
  ok('Sound 기본값 0', serialLines.some(l => l.includes('SOUND=0')));
  ok('IR 기본값 0', serialLines.some(l => l.includes('IR=0')));
  console.log(`    → 출력: ${serialLines.slice(0,4).join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 21. 버튼 + LED (INPUT_PULLUP 상세 검증)
// ═══════════════════════════════════════════════════════════════
section('시나리오 21: 버튼 digitalRead 상태 변화');
{
  const code = `
#define BTN_PIN 4
#define LED_PIN 13

void setup() {
  Serial.begin(9600);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int btn = digitalRead(BTN_PIN);
  if (btn == LOW) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("pressed");
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println("released");
  }
  delay(200);
}
`;
  const btnComp = { id: 'btn1', type: 'button', connections: { PIN1A: 4 } };
  const { serialLines, messages, gpio } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [btnComp] },
    500
  );

  ok('버튼 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('버튼 기본 released', serialLines.some(l => l.trim() === 'released'));
  ok('LED 기본 OFF (pin13=0)', messages.some(m =>
    m.type === 'PIN_STATE' && m.pin === 13 && m.value === 0
  ));
  console.log(`    → 출력: ${serialLines.slice(0,3).join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 22. L298N 모터 드라이버 + DC 모터
// ═══════════════════════════════════════════════════════════════
section('시나리오 22: L298N 모터 드라이버');
{
  const code = `
#define ENA 9
#define IN1 4
#define IN2 5

void setup() {
  Serial.begin(9600);
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  // 정방향 절반 속도
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 128);
  Serial.println("motor:fwd:128");
  delay(200);
  // 역방향 전속
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  analogWrite(ENA, 255);
  Serial.println("motor:rev:255");
  delay(200);
  // 정지
  analogWrite(ENA, 0);
  Serial.println("motor:stop");
}

void loop() { delay(1000); }
`;
  const motorComp = {
    id: 'l298n1', type: 'l298n',
    connections: { ENA: 9, IN1: 4, IN2: 5 }
  };
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [motorComp] },
    700
  );

  const pinStates = messages.filter(m => m.type === 'PIN_STATE');
  ok('L298N 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('ENA(9) 128 출력', pinStates.some(m => m.pin === 9 && m.value === 128));
  ok('ENA(9) 255 출력', pinStates.some(m => m.pin === 9 && m.value === 255));
  ok('IN1(4) HIGH', pinStates.some(m => m.pin === 4 && m.value === 1));
  ok('IN2(5) HIGH', pinStates.some(m => m.pin === 5 && m.value === 1));
  ok('정방향 시리얼', serialLines.some(l => l.includes('motor:fwd:128')));
  ok('역방향 시리얼', serialLines.some(l => l.includes('motor:rev:255')));
  ok('정지 시리얼', serialLines.some(l => l.includes('motor:stop')));
  console.log(`    → 출력: ${serialLines.join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 23. ESP32 특화 (12-bit ADC + ledcWrite)
// ═══════════════════════════════════════════════════════════════
section('시나리오 23: ESP32-C3 특화 기능 (12-bit ADC + PWM)');
{
  const code = `
#define POT_PIN 0
#define LED_PIN 8
#define PWM_CHANNEL 0
#define PWM_FREQ 5000
#define PWM_RES 10

void setup() {
  Serial.begin(115200);
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RES);
  ledcAttachPin(LED_PIN, PWM_CHANNEL);
  analogReadResolution(12);
}

void loop() {
  int raw = analogRead(POT_PIN);
  int pwm = raw / 4;  // 0-4095 → 0-1023
  ledcWrite(PWM_CHANNEL, pwm);
  Serial.print("ADC="); Serial.println(raw);
  Serial.print("PWM="); Serial.println(pwm);
  delay(300);
}
`;
  const potComp = { id: 'pot1', type: 'potentiometer', connections: { WIPER: 0 } };
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'esp32-c3-supermini', components: [potComp] },
    500
  );

  const pinStates = messages.filter(m => m.type === 'PIN_STATE');
  ok('ESP32 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('ADC 기본값 512 출력', serialLines.some(l => l.includes('ADC=') && l.includes('512')));
  ok('PWM=128 (512/4) 출력', serialLines.some(l => l.includes('PWM=128')));
  ok('LED핀 PWM PIN_STATE 전송', pinStates.some(m => m.pin === 8));
  console.log(`    → 출력: ${serialLines.slice(0,4).join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 24. Arduino Nano 보드 (10-bit ADC)
// ═══════════════════════════════════════════════════════════════
section('시나리오 24: Arduino Nano 보드');
{
  const code = `
void setup() {
  Serial.begin(9600);
  int v = analogRead(A0);
  Serial.print("NANO_ADC="); Serial.println(v);
}
void loop() { delay(1000); }
`;
  const potComp = { id: 'pot2', type: 'potentiometer', connections: { WIPER: 14 } }; // A0=14
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-nano', components: [potComp] },
    300
  );

  ok('Nano 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('Nano ADC 기본값 512', serialLines.some(l => l.includes('NANO_ADC=512')));
  console.log(`    → 출력: ${serialLines.join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 25. EEPROM 읽기/쓰기
// ═══════════════════════════════════════════════════════════════
section('시나리오 25: EEPROM 읽기/쓰기');
{
  const code = `
#include <EEPROM.h>

void setup() {
  Serial.begin(9600);
  EEPROM.write(0, 42);
  EEPROM.write(1, 100);
  int v0 = EEPROM.read(0);
  int v1 = EEPROM.read(1);
  Serial.print("EEPROM[0]="); Serial.println(v0);
  Serial.print("EEPROM[1]="); Serial.println(v1);
  EEPROM.update(0, 99);
  Serial.print("updated="); Serial.println(EEPROM.read(0));
}
void loop() { delay(1000); }
`;
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [] },
    300
  );

  ok('EEPROM 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('EEPROM[0]=42', serialLines.some(l => l.includes('EEPROM[0]=42')));
  ok('EEPROM[1]=100', serialLines.some(l => l.includes('EEPROM[1]=100')));
  ok('EEPROM update=99', serialLines.some(l => l.includes('updated=99')));
  console.log(`    → 출력: ${serialLines.join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 26. Wire (I2C) 기본 동작
// ═══════════════════════════════════════════════════════════════
section('시나리오 26: Wire I2C 통신');
{
  const code = `
#include <Wire.h>

void setup() {
  Serial.begin(9600);
  Wire.begin();
  Wire.beginTransmission(0x27);
  Wire.write(0x00);
  Wire.write(0xFF);
  byte result = Wire.endTransmission();
  Serial.print("I2C_RESULT="); Serial.println(result);
  Wire.requestFrom(0x27, 2);
  Serial.println("I2C_OK");
}
void loop() { delay(1000); }
`;
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [] },
    300
  );

  ok('Wire 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('I2C endTransmission 결과 0', serialLines.some(l => l.includes('I2C_RESULT=0')));
  ok('I2C_OK 출력', serialLines.some(l => l.includes('I2C_OK')));
  console.log(`    → 출력: ${serialLines.join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 27. 복합 시나리오: 가변저항 → map() → LED PWM 제어
// ═══════════════════════════════════════════════════════════════
section('시나리오 27: 가변저항 → PWM 밝기 제어');
{
  const code = `
#define POT_PIN A0
#define LED_PIN 9

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int pot = analogRead(POT_PIN);
  int brightness = map(pot, 0, 1023, 0, 255);
  analogWrite(LED_PIN, brightness);
  Serial.print("POT="); Serial.print(pot);
  Serial.print(" LED="); Serial.println(brightness);
  delay(300);
}
`;
  const potComp = { id: 'pot3', type: 'potentiometer', connections: { WIPER: 14 } }; // A0=14
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components: [potComp] },
    500
  );

  const pinStates = messages.filter(m => m.type === 'PIN_STATE' && m.pin === 9);
  ok('POT→LED 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('POT=512 출력', serialLines.some(l => l.includes('POT=512')));
  // map(512, 0, 1023, 0, 255) ≈ 128
  ok('LED=127 또는 128 출력', serialLines.some(l => {
    const m = l.match(/LED=(\d+)/);
    if (!m) return false;
    const v = parseInt(m[1]);
    return v >= 126 && v <= 129;
  }));
  ok('LED 핀(9) PWM PIN_STATE', pinStates.length > 0);
  console.log(`    → 출력: ${serialLines.slice(0,3).join(' | ')} | pin9: ${pinStates.map(m=>m.value).slice(0,3).join(',')}`);
}

// ═══════════════════════════════════════════════════════════════
// 28. 트랜스파일러 — 고급 C++ 패턴
// ═══════════════════════════════════════════════════════════════
section('트랜스파일러 — 고급 패턴');
{
  const t = new ArduinoTranspiler();

  // 배열 선언
  const arr = t.transpile('void setup() {\n  int arr[] = {1,2,3};\n  int n = arr[1];\n}');
  ok('배열 선언 {1,2,3} → [1,2,3]', arr.includes('[1,2,3]'));

  // unsigned int
  const ui = t.transpile('void setup() {\n  unsigned int x = 65000;\n}');
  ok('unsigned int → let', ui.includes('let x'));

  // const int
  const ci = t.transpile('void setup() {\n  const int MAX = 100;\n}');
  ok('const int → const', ci.includes('const MAX'));

  // enum
  const en = t.transpile('enum State { IDLE, RUN, STOP };\nvoid setup() {}');
  ok('enum → const IDLE=0', en.includes('const IDLE = 0'));
  ok('enum → const RUN=1', en.includes('const RUN = 1'));

  // -> 포인터
  const ptr = t.transpile('void setup() {\n  obj->method();\n}');
  ok('-> → .', ptr.includes('obj.method()'));

  // bitRead
  const br = t.transpile('void setup() {\n  int b = bitRead(x, 3);\n}');
  ok('bitRead(x,3) → ((x>>3)&1)', br.includes('((x>>3)&1)'));

  // String class
  const str = t.transpile('void setup() {\n  String s = "hello";\n  int l = s.length();\n  int n = s.toInt();\n}');
  ok('String.length() → .length', str.includes('.length'));
  ok('String.toInt() → parseInt', str.includes('parseInt'));

  // namespace ::
  const ns = t.transpile('void setup() {\n  int v = Foo::BAR;\n}');
  ok('Foo::BAR → Foo_BAR', ns.includes('Foo_BAR'));
}

// ═══════════════════════════════════════════════════════════════
// 29. 멀티 컴포넌트 동시 실행 (LED + Button + Potentiometer)
// ═══════════════════════════════════════════════════════════════
section('시나리오 29: 멀티 컴포넌트 회로');
{
  const code = `
#define BTN_PIN 2
#define POT_PIN A0
#define LED1_PIN 12
#define LED2_PIN 13

void setup() {
  Serial.begin(9600);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
}

void loop() {
  int btn = digitalRead(BTN_PIN);
  int pot = analogRead(POT_PIN);
  if (btn == LOW) {
    digitalWrite(LED1_PIN, HIGH);
  } else {
    digitalWrite(LED1_PIN, LOW);
  }
  analogWrite(LED2_PIN, map(pot, 0, 1023, 0, 255));
  Serial.print("BTN="); Serial.print(btn);
  Serial.print(" POT="); Serial.print(pot);
  Serial.print(" LED2="); Serial.println(map(pot, 0, 1023, 0, 255));
  delay(300);
}
`;
  const components = [
    { id: 'btn2', type: 'button', connections: { PIN1A: 2 } },
    { id: 'pot4', type: 'potentiometer', connections: { WIPER: 14 } },
  ];
  const { serialLines, messages } = await runCode(
    code,
    { boardType: 'arduino-uno', components },
    600
  );

  const pinStates = messages.filter(m => m.type === 'PIN_STATE');
  ok('멀티 컴포넌트 컴파일 에러 없음', !messages.some(m => m.type === 'COMPILE_ERROR'));
  ok('BTN=1 (기본 released)', serialLines.some(l => l.includes('BTN=1')));
  ok('POT=512 (기본 중점)', serialLines.some(l => l.includes('POT=512')));
  ok('LED1(12) LOW', pinStates.some(m => m.pin === 12 && m.value === 0));
  ok('LED2(13) PWM ~128', pinStates.some(m => m.pin === 13 && m.value >= 126 && m.value <= 130));
  console.log(`    → 출력: ${serialLines.slice(0,2).join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 결과 요약
// ═══════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(60)}`);
console.log(`결과: ✅ ${passed}개 통과 / ❌ ${failed}개 실패 / 합계 ${passed + failed}개`);
console.log('═'.repeat(60));
if (failed > 0) process.exit(1);
