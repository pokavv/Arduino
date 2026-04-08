/**
 * templates.js
 * ESP32-C3 웹 시뮬레이터 - 회로 템플릿 라이브러리
 *
 * 각 템플릿 구조:
 * {
 *   id:          string          - 고유 ID (카테고리-번호-설명)
 *   name:        string          - 표시 이름 (한국어)
 *   category:    string          - 분류 (gpio|adc|pwm|timing|serial|i2c)
 *   difficulty:  string          - 난이도 (beginner|intermediate|advanced)
 *   description: string          - 상세 설명
 *   components:  Array           - 배치할 컴포넌트 목록
 *   wires:       Array           - 와이어 연결 목록
 *   defaultCode: string          - 기본 스케치 코드
 * }
 *
 * 컴포넌트 항목:
 * { id, type, x, y, config?, connections? }
 *
 * 와이어 항목:
 * { from: { compId?, boardPin?, pinName? }, to: { ... }, color? }
 */

// ─────────────────────────────────────────────────────────────────────────────
// 템플릿 레지스트리
// ─────────────────────────────────────────────────────────────────────────────
var CircuitTemplates = (function() {
  var _templates = [];

  return {
    /** 템플릿 등록 */
    add: function(tpl) { _templates.push(tpl); },

    /** ID로 템플릿 조회 */
    get: function(id) {
      for (var i = 0; i < _templates.length; i++) {
        if (_templates[i].id === id) return _templates[i];
      }
      return null;
    },

    /** 카테고리로 템플릿 목록 조회 */
    getByCategory: function(cat) {
      if (!cat) return _templates.slice();
      return _templates.filter(function(t) { return t.category === cat; });
    },

    /** 전체 목록 반환 */
    getAll: function() { return _templates.slice(); },

    /** 카테고리 목록 반환 */
    getCategories: function() {
      var cats = {};
      _templates.forEach(function(t) { cats[t.category] = true; });
      return Object.keys(cats);
    }
  };
})();


// =============================================================================
// GPIO 카테고리 (01~11)
// =============================================================================

// ── GPIO-01: LED 깜빡임 (기본 디지털 출력)
CircuitTemplates.add({
  id:          'gpio-01-led-blink',
  name:        'LED 깜빡임 (GPIO 출력)',
  category:    'gpio',
  difficulty:  'beginner',
  description: '외부 LED를 G2에 연결하여 1초 간격으로 깜빡입니다. ' +
               '저항(220Ω)으로 전류를 제한합니다. ' +
               'pinMode/digitalWrite/delay 기본 사용법을 익힙니다.',

  components: [
    { id: 'R1',   type: 'Resistor', x: 300, y: 200, config: { value: 220 } },
    { id: 'LED1', type: 'LED',      x: 300, y: 280, config: { color: 'red' } }
  ],

  wires: [
    // G2 → R1.A
    { from: { boardPin: 'G2' },            to: { compId: 'R1',   pinName: 'A' },  color: '#F44336' },
    // R1.B → LED1.A
    { from: { compId:  'R1',  pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' }, color: '#FF9800' },
    // LED1.K → GND
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' },             color: '#212121' }
  ],

  defaultCode: `// GPIO-01: LED 깜빡임
// 준비물: 빨간 LED 1개, 220Ω 저항 1개
// 연결: G2 → 저항(220Ω) → LED(+) → LED(-) → GND
// ESP32-C3: analogWrite 사용 불가, ledcWrite 사용

// ── 핀 설정 ──────────────────────────────
const int LED_PIN = 2;   // G2 핀에 연결

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("LED 깜빡임 시작!");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);  // LED 켜기
  Serial.println("LED ON");
  delay(500);                    // 0.5초 대기

  digitalWrite(LED_PIN, LOW);   // LED 끄기
  Serial.println("LED OFF");
  delay(500);
}`
});


// ── GPIO-02: 내장 LED (Active LOW)
CircuitTemplates.add({
  id:          'gpio-02-builtin-led',
  name:        '내장 LED (G8, Active LOW)',
  category:    'gpio',
  difficulty:  'beginner',
  description: 'ESP32-C3 Super Mini의 내장 LED(G8)를 제어합니다. ' +
               'Active LOW: LOW = 켜짐, HIGH = 꺼짐.',

  components: [],
  wires: [],

  defaultCode: `// GPIO-02: 내장 LED (Active LOW)
// ESP32-C3 Super Mini 내장 LED는 G8에 연결되어 있으며
// Active LOW 방식입니다 (LOW = 켜짐, HIGH = 꺼짐)

// ── 핀 설정 ──────────────────────────────
const int BUILTIN_LED = 8;  // G8 = 내장 LED (Active LOW)

void setup() {
  Serial.begin(115200);
  pinMode(BUILTIN_LED, OUTPUT);
  digitalWrite(BUILTIN_LED, HIGH);  // 초기: 꺼짐 (Active LOW)
  Serial.println("내장 LED 제어 시작");
}

void loop() {
  digitalWrite(BUILTIN_LED, LOW);   // 켜기 (Active LOW)
  Serial.println("내장 LED ON");
  delay(300);

  digitalWrite(BUILTIN_LED, HIGH);  // 끄기
  Serial.println("내장 LED OFF");
  delay(300);
}`
});


// ── GPIO-03: 버튼으로 LED 제어
CircuitTemplates.add({
  id:          'gpio-03-button-led',
  name:        '버튼 → LED 제어 (디지털 입력)',
  category:    'gpio',
  difficulty:  'beginner',
  description: '누름 버튼(G4)을 눌렀을 때 LED(G2)가 켜지는 회로입니다. ' +
               'INPUT_PULLUP 내부 풀업 저항을 사용합니다.',

  components: [
    { id: 'BTN1', type: 'Button',   x: 220, y: 180, config: { label: 'BTN' } },
    { id: 'R1',   type: 'Resistor', x: 350, y: 200, config: { value: 220 } },
    { id: 'LED1', type: 'LED',      x: 350, y: 280, config: { color: 'green' } }
  ],

  wires: [
    { from: { boardPin: 'G4' },             to: { compId: 'BTN1', pinName: 'PIN1' }, color: '#FF9800' },
    { from: { compId: 'BTN1', pinName: 'PIN2' }, to: { boardPin: 'GND' },            color: '#212121' },
    { from: { boardPin: 'G2' },             to: { compId: 'R1',   pinName: 'A' },   color: '#4CAF50' },
    { from: { compId: 'R1',  pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' },  color: '#FF9800' },
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' },              color: '#212121' }
  ],

  defaultCode: `// GPIO-03: 버튼으로 LED 제어
// 준비물: 누름 버튼 1개, 초록 LED 1개, 220Ω 저항 1개
// 연결:
//   G4 → 버튼 한쪽 → GND (INPUT_PULLUP 사용)
//   G2 → 220Ω → LED(+) → LED(-) → GND

const int BTN_PIN = 4;   // G4: 버튼 입력
const int LED_PIN = 2;   // G2: LED 출력

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);  // 내부 풀업 활성화
  pinMode(LED_PIN, OUTPUT);
  Serial.println("버튼 LED 제어 준비");
}

void loop() {
  // INPUT_PULLUP 기준: 버튼 누름 = LOW
  int btnState = digitalRead(BTN_PIN);

  if (btnState == LOW) {
    digitalWrite(LED_PIN, HIGH);  // 버튼 누르면 LED ON
    Serial.println("버튼 눌림 → LED ON");
  } else {
    digitalWrite(LED_PIN, LOW);   // 버튼 떼면 LED OFF
  }
}`
});


// ── GPIO-04: 버튼 토글 (상태 유지)
CircuitTemplates.add({
  id:          'gpio-04-button-toggle',
  name:        '버튼 토글 (LED 상태 전환)',
  category:    'gpio',
  difficulty:  'beginner',
  description: '버튼을 누를 때마다 LED가 ON/OFF 전환됩니다. ' +
               '이전 상태를 변수에 저장하는 토글 패턴을 익힙니다.',

  components: [
    { id: 'BTN1', type: 'Button', x: 220, y: 180, config: { label: 'TOGGLE' } },
    { id: 'R1',   type: 'Resistor', x: 350, y: 200, config: { value: 220 } },
    { id: 'LED1', type: 'LED',    x: 350, y: 280, config: { color: 'blue' } }
  ],

  wires: [
    { from: { boardPin: 'G4' },             to: { compId: 'BTN1', pinName: 'PIN1' }, color: '#FF9800' },
    { from: { compId: 'BTN1', pinName: 'PIN2' }, to: { boardPin: 'GND' },            color: '#212121' },
    { from: { boardPin: 'G2' },             to: { compId: 'R1',   pinName: 'A' },   color: '#2196F3' },
    { from: { compId: 'R1',  pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' },  color: '#FF9800' },
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' },              color: '#212121' }
  ],

  defaultCode: `// GPIO-04: 버튼 토글
// 버튼을 누를 때마다 LED ON/OFF 전환
// 채터링(노이즈) 방지를 위해 소프트웨어 디바운싱 적용

const int BTN_PIN  = 4;    // G4: 버튼
const int LED_PIN  = 2;    // G2: LED

bool ledState       = false;  // 현재 LED 상태
bool lastBtnState   = HIGH;   // 이전 버튼 상태 (INPUT_PULLUP)
unsigned long lastDebounceTime = 0;
const unsigned long DEBOUNCE_DELAY = 50; // 50ms 디바운싱

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  bool currentBtnState = digitalRead(BTN_PIN);

  // 버튼 상태 변화 감지
  if (currentBtnState != lastBtnState) {
    lastDebounceTime = millis();
  }

  // 디바운스 시간 경과 후 확정
  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
    if (currentBtnState == LOW && lastBtnState == HIGH) {
      // 버튼 눌림 순간에만 토글
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState ? HIGH : LOW);
      Serial.println(ledState ? "LED ON" : "LED OFF");
    }
  }
  lastBtnState = currentBtnState;
}`
});


// ── GPIO-05: 멀티 LED 순차 점등
CircuitTemplates.add({
  id:          'gpio-05-multi-led',
  name:        '멀티 LED 순차 점등 (배열 활용)',
  category:    'gpio',
  difficulty:  'beginner',
  description: '4개의 LED를 순서대로 점등/소등합니다. ' +
               '배열(array)로 핀을 관리하는 방법을 익힙니다.',

  components: [
    { id: 'R1',   type: 'Resistor', x: 250, y: 160, config: { value: 220 } },
    { id: 'LED1', type: 'LED',      x: 250, y: 240, config: { color: 'red' } },
    { id: 'R2',   type: 'Resistor', x: 340, y: 160, config: { value: 220 } },
    { id: 'LED2', type: 'LED',      x: 340, y: 240, config: { color: 'yellow' } },
    { id: 'R3',   type: 'Resistor', x: 430, y: 160, config: { value: 220 } },
    { id: 'LED3', type: 'LED',      x: 430, y: 240, config: { color: 'green' } },
    { id: 'R4',   type: 'Resistor', x: 520, y: 160, config: { value: 220 } },
    { id: 'LED4', type: 'LED',      x: 520, y: 240, config: { color: 'blue' } }
  ],

  wires: [
    { from: { boardPin: 'G2' }, to: { compId: 'R1', pinName: 'A' }, color: '#F44336' },
    { from: { compId: 'R1', pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' } },
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' },

    { from: { boardPin: 'G3' }, to: { compId: 'R2', pinName: 'A' }, color: '#FFEB3B' },
    { from: { compId: 'R2', pinName: 'B' }, to: { compId: 'LED2', pinName: 'A' } },
    { from: { compId: 'LED2', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' },

    { from: { boardPin: 'G4' }, to: { compId: 'R3', pinName: 'A' }, color: '#4CAF50' },
    { from: { compId: 'R3', pinName: 'B' }, to: { compId: 'LED3', pinName: 'A' } },
    { from: { compId: 'LED3', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' },

    { from: { boardPin: 'G5' }, to: { compId: 'R4', pinName: 'A' }, color: '#2196F3' },
    { from: { compId: 'R4', pinName: 'B' }, to: { compId: 'LED4', pinName: 'A' } },
    { from: { compId: 'LED4', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// GPIO-05: 멀티 LED 순차 점등
// 준비물: LED 4개(빨/노/초/파), 220Ω 저항 4개
// 연결: G2,G3,G4,G5 각각 → 저항 → LED → GND

// 핀 배열로 관리
const int LED_PINS[] = {2, 3, 4, 5};
const int LED_COUNT  = 4;
const int DELAY_MS   = 150;  // 각 LED 점등 시간 (ms)

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < LED_COUNT; i++) {
    pinMode(LED_PINS[i], OUTPUT);
    digitalWrite(LED_PINS[i], LOW);
  }
  Serial.println("멀티 LED 준비");
}

void loop() {
  // 앞으로 순차 점등
  for (int i = 0; i < LED_COUNT; i++) {
    digitalWrite(LED_PINS[i], HIGH);
    delay(DELAY_MS);
    digitalWrite(LED_PINS[i], LOW);
  }
  // 뒤로 순차 점등
  for (int i = LED_COUNT - 2; i >= 1; i--) {
    digitalWrite(LED_PINS[i], HIGH);
    delay(DELAY_MS);
    digitalWrite(LED_PINS[i], LOW);
  }
}`
});


// ── GPIO-06: 외부 인터럽트
CircuitTemplates.add({
  id:          'gpio-06-interrupt',
  name:        '외부 인터럽트 (attachInterrupt)',
  category:    'gpio',
  difficulty:  'intermediate',
  description: '버튼 누름을 인터럽트로 감지합니다. ' +
               'attachInterrupt()로 즉각적인 응답 구현.',

  components: [
    { id: 'BTN1', type: 'Button', x: 220, y: 180, config: { label: 'INT' } },
    { id: 'R1',   type: 'Resistor', x: 380, y: 200, config: { value: 220 } },
    { id: 'LED1', type: 'LED',    x: 380, y: 280, config: { color: 'yellow' } }
  ],

  wires: [
    { from: { boardPin: 'G4' }, to: { compId: 'BTN1', pinName: 'PIN1' }, color: '#FF9800' },
    { from: { compId: 'BTN1', pinName: 'PIN2' }, to: { boardPin: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G2' }, to: { compId: 'R1', pinName: 'A' }, color: '#FFEB3B' },
    { from: { compId: 'R1', pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' } },
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// GPIO-06: 외부 인터럽트
// G4 버튼 → FALLING 엣지(눌림 순간) 인터럽트
// ESP32는 모든 GPIO에서 인터럽트 지원

const int BTN_PIN = 4;   // G4: 인터럽트 핀
const int LED_PIN = 2;   // G2: LED 출력

volatile bool ledState = false;  // ISR에서 수정 → volatile 필수
volatile unsigned long lastIsr = 0;

// 인터럽트 서비스 루틴 (ISR)
// IRAM_ATTR: ISR을 RAM에 배치하여 빠른 실행 보장
void IRAM_ATTR onButtonPress() {
  // 소프트웨어 디바운싱
  unsigned long now = millis();
  if (now - lastIsr > 200) {
    ledState = !ledState;
    lastIsr  = now;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);

  // FALLING: HIGH → LOW (버튼 눌림)
  attachInterrupt(digitalPinToInterrupt(BTN_PIN), onButtonPress, FALLING);
  Serial.println("인터럽트 등록 완료");
}

void loop() {
  // 메인 루프: LED 상태 적용
  digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  // 다른 작업을 여기서 수행 (인터럽트가 독립적으로 동작)
  delay(10);
}`
});


// ── GPIO-07: 릴레이 제어
CircuitTemplates.add({
  id:          'gpio-07-relay',
  name:        '릴레이 모듈 제어',
  category:    'gpio',
  difficulty:  'intermediate',
  description: '릴레이 모듈을 제어합니다. ' +
               '3.3V GPIO로 5V 이상의 부하를 안전하게 제어합니다. ' +
               '보통 릴레이 모듈은 Active LOW (LOW=활성화).',

  components: [
    { id: 'RELAY1', type: 'Relay_Module', x: 280, y: 180, config: { activeHigh: false } }
  ],

  wires: [
    { from: { boardPin: '3V3' }, to: { compId: 'RELAY1', pinName: 'VCC' }, color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'RELAY1', pinName: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G2' },  to: { compId: 'RELAY1', pinName: 'IN' },  color: '#FF9800' }
  ],

  defaultCode: `// GPIO-07: 릴레이 모듈 제어
// 준비물: 5V 릴레이 모듈 (1채널)
// 연결: 3V3 → VCC, GND → GND, G2 → IN
// 주의: 릴레이 모듈은 보통 Active LOW (LOW = 코일 활성화)

const int RELAY_PIN = 2;   // G2: 릴레이 제어 핀
const int RELAY_ON  = LOW;  // 대부분의 릴레이 모듈: Active LOW
const int RELAY_OFF = HIGH;

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_OFF);  // 초기: 릴레이 OFF
  Serial.println("릴레이 제어 시작");
}

void loop() {
  Serial.println("릴레이 ON (코일 활성화)");
  digitalWrite(RELAY_PIN, RELAY_ON);
  delay(2000);

  Serial.println("릴레이 OFF (코일 비활성화)");
  digitalWrite(RELAY_PIN, RELAY_OFF);
  delay(2000);
}`
});


// ── GPIO-08: 버튼 카운터
CircuitTemplates.add({
  id:          'gpio-08-button-counter',
  name:        '버튼 카운터 (누름 횟수)',
  category:    'gpio',
  difficulty:  'beginner',
  description: '버튼을 누를 때마다 카운트를 증가시켜 시리얼 모니터에 출력합니다.',

  components: [
    { id: 'BTN1', type: 'Button', x: 250, y: 200, config: { label: 'COUNT' } }
  ],

  wires: [
    { from: { boardPin: 'G4' }, to: { compId: 'BTN1', pinName: 'PIN1' }, color: '#FF9800' },
    { from: { compId: 'BTN1', pinName: 'PIN2' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// GPIO-08: 버튼 카운터
// G4 버튼을 누를 때마다 카운트 증가

const int BTN_PIN = 4;

int  count        = 0;
bool lastBtnState = HIGH;
unsigned long lastDebounce = 0;
const unsigned long DEBOUNCE_MS = 50;

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);
  Serial.println("버튼 카운터 시작 - 버튼을 누르세요");
}

void loop() {
  bool btn = digitalRead(BTN_PIN);

  if (btn != lastBtnState) {
    lastDebounce = millis();
  }

  if ((millis() - lastDebounce) > DEBOUNCE_MS) {
    if (btn == LOW && lastBtnState == HIGH) {
      count++;
      Serial.print("버튼 횟수: ");
      Serial.println(count);
    }
  }
  lastBtnState = btn;
}`
});


// ── GPIO-09: 2버튼 UP/DOWN 카운터
CircuitTemplates.add({
  id:          'gpio-09-updown-counter',
  name:        '2버튼 UP/DOWN 카운터',
  category:    'gpio',
  difficulty:  'intermediate',
  description: '버튼 2개로 카운터를 증가/감소시킵니다.',

  components: [
    { id: 'BTN_UP',   type: 'Button', x: 220, y: 180, config: { label: 'UP' } },
    { id: 'BTN_DOWN', type: 'Button', x: 320, y: 180, config: { label: 'DOWN' } }
  ],

  wires: [
    { from: { boardPin: 'G4' }, to: { compId: 'BTN_UP',   pinName: 'PIN1' }, color: '#4CAF50' },
    { from: { compId: 'BTN_UP',   pinName: 'PIN2' }, to: { boardPin: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G5' }, to: { compId: 'BTN_DOWN', pinName: 'PIN1' }, color: '#F44336' },
    { from: { compId: 'BTN_DOWN', pinName: 'PIN2' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// GPIO-09: 2버튼 UP/DOWN 카운터
// G4: UP 버튼, G5: DOWN 버튼

const int BTN_UP   = 4;
const int BTN_DOWN = 5;

int  count = 0;
bool lastUp   = HIGH, lastDown = HIGH;
unsigned long lastDbUp = 0, lastDbDown = 0;
const unsigned long DB = 50;

void setup() {
  Serial.begin(115200);
  pinMode(BTN_UP,   INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  Serial.println("UP/DOWN 카운터 (초기값: 0)");
}

void checkBtn(int pin, bool &lastState, unsigned long &lastDb, int delta) {
  bool cur = digitalRead(pin);
  if (cur != lastState) lastDb = millis();
  if ((millis() - lastDb) > DB) {
    if (cur == LOW && lastState == HIGH) {
      count += delta;
      Serial.print("카운터: ");
      Serial.println(count);
    }
  }
  lastState = cur;
}

void loop() {
  checkBtn(BTN_UP,   lastUp,   lastDbUp,   +1);
  checkBtn(BTN_DOWN, lastDown, lastDbDown, -1);
}`
});


// ── GPIO-10: PIR 모션 감지
CircuitTemplates.add({
  id:          'gpio-10-pir-motion',
  name:        'PIR 모션 감지',
  category:    'gpio',
  difficulty:  'intermediate',
  description: 'HC-SR501 PIR 센서로 움직임을 감지하여 LED를 켭니다.',

  components: [
    { id: 'PIR1', type: 'PIR_Sensor', x: 220, y: 180, config: {} },
    { id: 'R1',   type: 'Resistor',   x: 380, y: 200, config: { value: 220 } },
    { id: 'LED1', type: 'LED',        x: 380, y: 280, config: { color: 'yellow' } }
  ],

  wires: [
    { from: { boardPin: '3V3' }, to: { compId: 'PIR1', pinName: 'VCC' }, color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'PIR1', pinName: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G4' },  to: { compId: 'PIR1', pinName: 'OUT' }, color: '#FF9800' },
    { from: { boardPin: 'G2' },  to: { compId: 'R1',   pinName: 'A' },  color: '#FFEB3B' },
    { from: { compId: 'R1', pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' } },
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// GPIO-10: PIR 모션 감지
// HC-SR501 PIR 센서: 움직임 감지 시 OUT = HIGH
// 준비물: HC-SR501, LED, 220Ω 저항

const int PIR_PIN = 4;   // G4: PIR 출력 신호
const int LED_PIN = 2;   // G2: 감지 표시 LED

unsigned long motionTime = 0;
const unsigned long HOLD_TIME = 3000;  // 감지 후 3초 유지

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  // PIR 센서 안정화 대기 (약 30초 필요, 시뮬에서는 생략)
  Serial.println("PIR 모션 감지 준비 완료");
}

void loop() {
  if (digitalRead(PIR_PIN) == HIGH) {
    motionTime = millis();
    digitalWrite(LED_PIN, HIGH);
    Serial.println("모션 감지!");
  }

  // 마지막 감지 후 HOLD_TIME 경과시 LED 끄기
  if (millis() - motionTime > HOLD_TIME) {
    digitalWrite(LED_PIN, LOW);
  }
  delay(50);
}`
});


// ── GPIO-11: 디지털 입력 읽기 (LOW/HIGH 표시)
CircuitTemplates.add({
  id:          'gpio-11-digital-read',
  name:        '디지털 입력 상태 읽기',
  category:    'gpio',
  difficulty:  'beginner',
  description: '버튼 핀의 상태를 주기적으로 읽어 시리얼 출력합니다.',

  components: [
    { id: 'BTN1', type: 'Button', x: 250, y: 200, config: { label: 'READ' } }
  ],

  wires: [
    { from: { boardPin: 'G4' }, to: { compId: 'BTN1', pinName: 'PIN1' }, color: '#FF9800' },
    { from: { compId: 'BTN1', pinName: 'PIN2' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// GPIO-11: 디지털 입력 읽기
// digitalRead()로 핀 상태를 주기적으로 확인

const int BTN_PIN = 4;

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);
  Serial.println("디지털 입력 읽기 시작");
  Serial.println("핀 상태 (INPUT_PULLUP): 뗌=HIGH(1), 누름=LOW(0)");
}

void loop() {
  int state = digitalRead(BTN_PIN);
  Serial.print("G4 상태: ");
  Serial.println(state == HIGH ? "HIGH (버튼 뗌)" : "LOW (버튼 눌림)");
  delay(200);
}`
});


// =============================================================================
// ADC 카테고리 (01~05)
// =============================================================================

// ── ADC-01: 가변저항 아날로그 읽기
CircuitTemplates.add({
  id:          'adc-01-potentiometer',
  name:        '가변저항 아날로그 읽기',
  category:    'adc',
  difficulty:  'beginner',
  description: '가변저항(포텐셔미터)의 값을 ADC로 읽어 시리얼 출력합니다. ' +
               'analogRead()는 0~4095 (12비트) 반환. Wi-Fi 사용 시 불안정.',

  components: [
    { id: 'POT1', type: 'Potentiometer', x: 280, y: 180, config: { value: 10000 } }
  ],

  wires: [
    { from: { boardPin: '3V3' }, to: { compId: 'POT1', pinName: 'VCC' }, color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'POT1', pinName: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G4' },  to: { compId: 'POT1', pinName: 'OUT' }, color: '#FF9800' }
  ],

  defaultCode: `// ADC-01: 가변저항 아날로그 읽기
// 준비물: 10kΩ 가변저항(포텐셔미터)
// 연결: VCC → 3V3, GND → GND, 중간단자(OUT) → G4
// ESP32-C3: 12비트 ADC (0~4095), 3.3V 기준
// 주의: Wi-Fi 활성화 시 ADC2 불안정 → ADC1 핀 사용 권장

const int POT_PIN  = 4;    // G4: ADC1 채널
const int ADC_MAX  = 4095; // 12비트 최대값
const float VCC    = 3.3;  // 기준 전압

void setup() {
  Serial.begin(115200);
  // analogReadResolution(12);  // 기본값 12비트 (0~4095)
  Serial.println("가변저항 ADC 읽기 시작");
  Serial.println("가변저항을 돌려보세요!");
}

void loop() {
  int   rawValue  = analogRead(POT_PIN);
  float voltage   = (float)rawValue / ADC_MAX * VCC;
  int   pct       = map(rawValue, 0, ADC_MAX, 0, 100);

  Serial.print("ADC raw: ");    Serial.print(rawValue);
  Serial.print(" | 전압: ");  Serial.print(voltage, 2);
  Serial.print("V | 비율: "); Serial.print(pct);
  Serial.println("%");

  delay(200);
}`
});


// ── ADC-02: ADC → LED 밝기 매핑
CircuitTemplates.add({
  id:          'adc-02-adc-led-brightness',
  name:        'ADC → LED 밝기 (가변저항 + PWM)',
  category:    'adc',
  difficulty:  'beginner',
  description: '가변저항 ADC 값을 LED PWM 밝기에 매핑합니다.',

  components: [
    { id: 'POT1', type: 'Potentiometer', x: 220, y: 180, config: { value: 10000 } },
    { id: 'R1',   type: 'Resistor',       x: 400, y: 200, config: { value: 220 } },
    { id: 'LED1', type: 'LED',            x: 400, y: 280, config: { color: 'white' } }
  ],

  wires: [
    { from: { boardPin: '3V3' }, to: { compId: 'POT1', pinName: 'VCC' }, color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'POT1', pinName: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G4' },  to: { compId: 'POT1', pinName: 'OUT' }, color: '#FF9800' },
    { from: { boardPin: 'G2' },  to: { compId: 'R1',   pinName: 'A' },  color: '#ECEFF1' },
    { from: { compId: 'R1', pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' } },
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// ADC-02: 가변저항으로 LED 밝기 조절
// G4 (ADC): 가변저항 OUT
// G2 (PWM): LED 밝기 제어
// ESP32-C3: analogWrite() 없음 → ledcWrite() 사용

const int POT_PIN  = 4;    // ADC 핀
const int LED_PIN  = 2;    // PWM 핀

// LEDC (PWM) 설정
const int LEDC_CH   = 0;     // LEDC 채널 0~7
const int LEDC_FREQ = 5000;  // 5kHz
const int LEDC_BITS = 8;     // 8비트 해상도 (0~255)

void setup() {
  Serial.begin(115200);
  // PWM 채널 설정
  ledcSetup(LEDC_CH, LEDC_FREQ, LEDC_BITS);
  ledcAttachPin(LED_PIN, LEDC_CH);
  Serial.println("가변저항 → LED 밝기 제어");
}

void loop() {
  int adcVal    = analogRead(POT_PIN);         // 0~4095
  int ledDuty   = map(adcVal, 0, 4095, 0, 255); // 0~255

  ledcWrite(LEDC_CH, ledDuty);

  Serial.print("ADC: "); Serial.print(adcVal);
  Serial.print(" → PWM duty: "); Serial.println(ledDuty);
  delay(50);
}`
});


// ── ADC-03: 다중 ADC 채널 읽기
CircuitTemplates.add({
  id:          'adc-03-multi-adc',
  name:        '다중 ADC 채널 읽기',
  category:    'adc',
  difficulty:  'intermediate',
  description: '여러 핀의 ADC 값을 동시에 읽어 비교합니다.',

  components: [
    { id: 'POT1', type: 'Potentiometer', x: 200, y: 180, config: { value: 10000 } },
    { id: 'POT2', type: 'Potentiometer', x: 340, y: 180, config: { value: 10000 } }
  ],

  wires: [
    { from: { boardPin: '3V3' }, to: { compId: 'POT1', pinName: 'VCC' }, color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'POT1', pinName: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G4' },  to: { compId: 'POT1', pinName: 'OUT' }, color: '#FF9800' },
    { from: { boardPin: '3V3' }, to: { compId: 'POT2', pinName: 'VCC' }, color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'POT2', pinName: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G5' },  to: { compId: 'POT2', pinName: 'OUT' }, color: '#2196F3' }
  ],

  defaultCode: `// ADC-03: 다중 ADC 채널 읽기
// G4, G5 두 채널의 ADC 값을 동시에 읽기

const int ADC_PINS[] = {4, 5};  // G4, G5
const int ADC_COUNT  = 2;

void setup() {
  Serial.begin(115200);
  Serial.println("다중 ADC 읽기 시작");
}

void loop() {
  for (int i = 0; i < ADC_COUNT; i++) {
    int val = analogRead(ADC_PINS[i]);
    float v = val / 4095.0 * 3.3;
    Serial.print("G"); Serial.print(ADC_PINS[i]);
    Serial.print(": "); Serial.print(val);
    Serial.print(" ("); Serial.print(v, 2); Serial.print("V)");
    if (i < ADC_COUNT - 1) Serial.print("  |  ");
  }
  Serial.println();
  delay(300);
}`
});


// ── ADC-04: ADC 평균 필터링
CircuitTemplates.add({
  id:          'adc-04-adc-filter',
  name:        'ADC 노이즈 필터링 (이동 평균)',
  category:    'adc',
  difficulty:  'intermediate',
  description: 'ADC 노이즈를 이동 평균으로 제거합니다. ' +
               'ESP32-C3 Wi-Fi ADC 불안정 문제 완화에 효과적.',

  components: [
    { id: 'POT1', type: 'Potentiometer', x: 280, y: 200, config: { value: 10000 } }
  ],

  wires: [
    { from: { boardPin: '3V3' }, to: { compId: 'POT1', pinName: 'VCC' }, color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'POT1', pinName: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G4' },  to: { compId: 'POT1', pinName: 'OUT' }, color: '#FF9800' }
  ],

  defaultCode: `// ADC-04: ADC 이동 평균 필터
// 노이즈 많은 ADC 값을 N개 평균으로 안정화

const int ADC_PIN    = 4;
const int SAMPLES    = 16;  // 평균 샘플 수 (많을수록 안정, 느림)
int sampleBuf[SAMPLES];
int bufIdx    = 0;
long bufSum   = 0;
bool bufFull  = false;

void setup() {
  Serial.begin(115200);
  memset(sampleBuf, 0, sizeof(sampleBuf));
  Serial.println("ADC 이동 평균 필터");
}

int readAdcFiltered() {
  int raw = analogRead(ADC_PIN);
  bufSum -= sampleBuf[bufIdx];
  sampleBuf[bufIdx] = raw;
  bufSum += raw;
  bufIdx = (bufIdx + 1) % SAMPLES;
  if (bufIdx == 0) bufFull = true;
  int count = bufFull ? SAMPLES : bufIdx;
  return (count > 0) ? (bufSum / count) : 0;
}

void loop() {
  int raw      = analogRead(ADC_PIN);
  int filtered = readAdcFiltered();

  Serial.print("raw: "); Serial.print(raw);
  Serial.print("  filtered: "); Serial.println(filtered);
  delay(50);
}`
});


// ── ADC-05: 전압 측정 (분압기)
CircuitTemplates.add({
  id:          'adc-05-voltage-divider',
  name:        '전압 분배기로 전압 측정',
  category:    'adc',
  difficulty:  'intermediate',
  description: '저항 분압기를 이용해 3.3V 이상의 전압을 측정합니다.',

  components: [
    { id: 'R1', type: 'Resistor', x: 280, y: 160, config: { value: 10000 } },
    { id: 'R2', type: 'Resistor', x: 280, y: 240, config: { value: 10000 } }
  ],

  wires: [
    { from: { boardPin: '5V' },  to: { compId: 'R1', pinName: 'A' }, color: '#F44336' },
    { from: { compId: 'R1', pinName: 'B' }, to: { compId: 'R2', pinName: 'A' }, color: '#FF9800' },
    { from: { boardPin: 'G4' },  to: { compId: 'R2', pinName: 'A' }, color: '#FF9800' },
    { from: { compId: 'R2', pinName: 'B' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// ADC-05: 분압기를 이용한 전압 측정
// R1=R2=10kΩ → 분압비 0.5 → 5V → ADC에는 2.5V 인가
// 측정 공식: Vin = Vadc × (R1+R2)/R2

const int ADC_PIN   = 4;
const float R1      = 10000.0;  // 위쪽 저항 (Ω)
const float R2      = 10000.0;  // 아래쪽 저항 (Ω)
const float VCC_REF = 3.3;      // ADC 기준 전압
const float RATIO   = (R1 + R2) / R2;  // 전압 비율

void setup() {
  Serial.begin(115200);
  Serial.println("분압기 전압 측정");
  Serial.print("전압 비율: "); Serial.println(RATIO);
}

void loop() {
  int   adcRaw = analogRead(ADC_PIN);
  float vadc   = (float)adcRaw / 4095.0 * VCC_REF;
  float vin    = vadc * RATIO;

  Serial.print("ADC raw: "); Serial.print(adcRaw);
  Serial.print(" | Vadc: "); Serial.print(vadc, 3); Serial.print("V");
  Serial.print(" | Vin: ");  Serial.print(vin, 3);  Serial.println("V");
  delay(500);
}`
});


// =============================================================================
// PWM 카테고리 (01~07)
// =============================================================================

// ── PWM-01: LED 페이드 인/아웃
CircuitTemplates.add({
  id:          'pwm-01-led-fade',
  name:        'LED 페이드 인/아웃 (PWM)',
  category:    'pwm',
  difficulty:  'beginner',
  description: 'ledcWrite()로 LED 밝기를 부드럽게 변화시킵니다. ' +
               'ESP32-C3는 analogWrite() 없음 → LEDC 사용 필수.',

  components: [
    { id: 'R1',   type: 'Resistor', x: 320, y: 200, config: { value: 220 } },
    { id: 'LED1', type: 'LED',      x: 320, y: 280, config: { color: 'blue' } }
  ],

  wires: [
    { from: { boardPin: 'G2' }, to: { compId: 'R1', pinName: 'A' }, color: '#2196F3' },
    { from: { compId: 'R1', pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' } },
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// PWM-01: LED 페이드 인/아웃
// ESP32-C3는 analogWrite() 미지원 → LEDC 사용
// LEDC: LED Control 주변기기 (16채널, 최대 40MHz)

const int LED_PIN   = 2;     // G2: PWM 출력
const int LEDC_CH   = 0;     // LEDC 채널 (0~7)
const int LEDC_FREQ = 5000;  // 5kHz PWM 주파수
const int LEDC_BITS = 8;     // 해상도: 8비트 (duty 0~255)

void setup() {
  Serial.begin(115200);
  ledcSetup(LEDC_CH, LEDC_FREQ, LEDC_BITS);
  ledcAttachPin(LED_PIN, LEDC_CH);
  Serial.println("LED 페이드 시작");
}

void loop() {
  // 페이드 인 (어둠 → 밝음)
  for (int duty = 0; duty <= 255; duty++) {
    ledcWrite(LEDC_CH, duty);
    delay(8);
  }
  // 페이드 아웃 (밝음 → 어둠)
  for (int duty = 255; duty >= 0; duty--) {
    ledcWrite(LEDC_CH, duty);
    delay(8);
  }
}`
});


// ── PWM-02: RGB LED 색상 변환
CircuitTemplates.add({
  id:          'pwm-02-rgb-led',
  name:        'RGB LED 색상 변환 (PWM 3채널)',
  category:    'pwm',
  difficulty:  'intermediate',
  description: 'RGB LED의 각 채널을 PWM으로 제어하여 다양한 색상을 표현합니다.',

  components: [
    { id: 'RLED', type: 'Resistor', x: 220, y: 180, config: { value: 100 } },
    { id: 'GLED', type: 'Resistor', x: 310, y: 180, config: { value: 100 } },
    { id: 'BLED', type: 'Resistor', x: 400, y: 180, config: { value: 100 } },
    { id: 'RGB1', type: 'LED_RGB',  x: 300, y: 280, config: {} }
  ],

  wires: [
    { from: { boardPin: 'G2' }, to: { compId: 'RLED', pinName: 'A' }, color: '#F44336' },
    { from: { compId: 'RLED', pinName: 'B' }, to: { compId: 'RGB1', pinName: 'R' }, color: '#F44336' },
    { from: { boardPin: 'G3' }, to: { compId: 'GLED', pinName: 'A' }, color: '#4CAF50' },
    { from: { compId: 'GLED', pinName: 'B' }, to: { compId: 'RGB1', pinName: 'G' }, color: '#4CAF50' },
    { from: { boardPin: 'G4' }, to: { compId: 'BLED', pinName: 'A' }, color: '#2196F3' },
    { from: { compId: 'BLED', pinName: 'B' }, to: { compId: 'RGB1', pinName: 'B' }, color: '#2196F3' },
    { from: { compId: 'RGB1', pinName: 'GND' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// PWM-02: RGB LED 색상 변환
// G2=R, G3=G, G4=B (공통 캐소드 RGB LED)
// 각 채널에 100Ω 저항 필요

const int PIN_R = 2, PIN_G = 3, PIN_B = 4;
const int CH_R  = 0, CH_G  = 1, CH_B  = 2;

void ledcSetupRGB() {
  ledcSetup(CH_R, 5000, 8); ledcAttachPin(PIN_R, CH_R);
  ledcSetup(CH_G, 5000, 8); ledcAttachPin(PIN_G, CH_G);
  ledcSetup(CH_B, 5000, 8); ledcAttachPin(PIN_B, CH_B);
}

void setRGB(uint8_t r, uint8_t g, uint8_t b) {
  ledcWrite(CH_R, r);
  ledcWrite(CH_G, g);
  ledcWrite(CH_B, b);
}

// HSV → RGB 변환 (무지개 색상 생성용)
void hsv2rgb(float h, float s, float v, uint8_t &r, uint8_t &g, uint8_t &b) {
  float c = v * s, x = c * (1 - fabs(fmod(h/60.0, 2) - 1)), m = v - c;
  float rr, gg, bb;
  if      (h < 60)  { rr=c; gg=x; bb=0; }
  else if (h < 120) { rr=x; gg=c; bb=0; }
  else if (h < 180) { rr=0; gg=c; bb=x; }
  else if (h < 240) { rr=0; gg=x; bb=c; }
  else if (h < 300) { rr=x; gg=0; bb=c; }
  else              { rr=c; gg=0; bb=x; }
  r = (rr+m)*255; g = (gg+m)*255; b = (bb+m)*255;
}

void setup() {
  Serial.begin(115200);
  ledcSetupRGB();
}

void loop() {
  // 무지개 색상 순환
  for (float h = 0; h < 360; h += 0.5) {
    uint8_t r, g, b;
    hsv2rgb(h, 1.0, 1.0, r, g, b);
    setRGB(r, g, b);
    delay(10);
  }
}`
});


// ── PWM-03: 부저 음 재생
CircuitTemplates.add({
  id:          'pwm-03-buzzer-tone',
  name:        '수동 부저로 소리 재생',
  category:    'pwm',
  difficulty:  'beginner',
  description: '수동 부저(passive buzzer)에 PWM으로 주파수를 입력하여 소리를 냅니다.',

  components: [
    { id: 'BUZ1', type: 'Buzzer', x: 280, y: 200, config: {} }
  ],

  wires: [
    { from: { boardPin: 'G2' },  to: { compId: 'BUZ1', pinName: '+' }, color: '#FF9800' },
    { from: { boardPin: 'GND' }, to: { compId: 'BUZ1', pinName: '-' }, color: '#212121' }
  ],

  defaultCode: `// PWM-03: 수동 부저 음 재생
// 수동 부저 (passive buzzer): PWM 주파수로 소리 생성
// 능동 부저 (active buzzer): DC 전원만 연결하면 소리 남

const int BUZZER_PIN = 2;   // G2: 부저 신호
const int LEDC_CH    = 0;

// 음표 주파수 (Hz) - 4옥타브 기준
#define DO  262
#define RE  294
#define MI  330
#define FA  349
#define SOL 392
#define LA  440
#define SI  494
#define DO2 523

void tone(int freq, int duration) {
  ledcSetup(LEDC_CH, freq, 8);
  ledcAttachPin(BUZZER_PIN, LEDC_CH);
  ledcWrite(LEDC_CH, 127);  // 50% duty (최대 음량)
  delay(duration);
  ledcWrite(LEDC_CH, 0);    // 소리 끄기
  delay(30);                 // 음표 사이 간격
}

void noTone() {
  ledcWrite(LEDC_CH, 0);
}

void setup() {
  Serial.begin(115200);
  Serial.println("도레미파솔라시도 재생");
}

void loop() {
  int notes[]    = {DO, RE, MI, FA, SOL, LA, SI, DO2};
  int durations[] = {400, 400, 400, 400, 400, 400, 400, 600};

  for (int i = 0; i < 8; i++) {
    tone(notes[i], durations[i]);
  }
  delay(1000);
}`
});


// ── PWM-04: 서보 모터 각도 제어
CircuitTemplates.add({
  id:          'pwm-04-servo',
  name:        '서보 모터 각도 제어',
  category:    'pwm',
  difficulty:  'intermediate',
  description: 'SG90 서보 모터를 0~180° 범위로 제어합니다. ' +
               'Servo 라이브러리 또는 LEDC 직접 제어.',

  components: [
    { id: 'SRV1', type: 'Servo', x: 280, y: 200, config: {} }
  ],

  wires: [
    { from: { boardPin: '5V' },  to: { compId: 'SRV1', pinName: 'VCC' },    color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'SRV1', pinName: 'GND' },    color: '#212121' },
    { from: { boardPin: 'G2' },  to: { compId: 'SRV1', pinName: 'SIGNAL' }, color: '#FF9800' }
  ],

  defaultCode: `// PWM-04: 서보 모터 각도 제어
// 준비물: SG90 서보 모터
// 연결: 빨강=5V, 갈색=GND, 주황=G2
// Servo 라이브러리 사용 (ESP32 지원)

#include <ESP32Servo.h>

const int SERVO_PIN = 2;  // G2: 서보 신호

Servo myServo;

void setup() {
  Serial.begin(115200);
  // ESP32Servo: 타이머 할당
  ESP32PWM::allocateTimer(0);
  myServo.setPeriodHertz(50);  // 서보 표준: 50Hz
  myServo.attach(SERVO_PIN, 500, 2400);  // 500~2400μs 펄스 범위
  Serial.println("서보 모터 제어 시작");
}

void loop() {
  // 0° → 90° → 180° → 90° → 0° 반복
  int angles[] = {0, 45, 90, 135, 180, 135, 90, 45};

  for (int i = 0; i < 8; i++) {
    myServo.write(angles[i]);
    Serial.print("각도: "); Serial.print(angles[i]); Serial.println("°");
    delay(500);
  }
}`
});


// ── PWM-05: DC 모터 속도/방향 제어
CircuitTemplates.add({
  id:          'pwm-05-dc-motor',
  name:        'DC 모터 L298N 속도/방향 제어',
  category:    'pwm',
  difficulty:  'intermediate',
  description: 'L298N 드라이버로 DC 모터의 속도와 방향을 제어합니다.',

  components: [
    { id: 'MTR1', type: 'DC_Motor_L298N', x: 280, y: 180, config: {} }
  ],

  wires: [
    { from: { boardPin: 'G2' },  to: { compId: 'MTR1', pinName: 'ENA' }, color: '#FF9800' },
    { from: { boardPin: 'G3' },  to: { compId: 'MTR1', pinName: 'IN1' }, color: '#4CAF50' },
    { from: { boardPin: 'G4' },  to: { compId: 'MTR1', pinName: 'IN2' }, color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'MTR1', pinName: 'GND' }, color: '#212121' },
    { from: { boardPin: '5V' },  to: { compId: 'MTR1', pinName: 'VCC' }, color: '#F44336' }
  ],

  defaultCode: `// PWM-05: L298N DC 모터 제어
// ENA=G2(PWM속도), IN1=G3, IN2=G4

const int ENA = 2, IN1 = 3, IN2 = 4;
const int LEDC_CH = 0;

void motorSetup() {
  ledcSetup(LEDC_CH, 1000, 8);  // 1kHz, 8비트
  ledcAttachPin(ENA, LEDC_CH);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
}

void motorForward(int speed) {
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  ledcWrite(LEDC_CH, speed);  // 속도 0~255
}

void motorBackward(int speed) {
  digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH);
  ledcWrite(LEDC_CH, speed);
}

void motorStop() {
  ledcWrite(LEDC_CH, 0);
}

void setup() {
  Serial.begin(115200);
  motorSetup();
}

void loop() {
  Serial.println("정방향 50%");
  motorForward(127);
  delay(2000);

  Serial.println("정지");
  motorStop();
  delay(500);

  Serial.println("역방향 75%");
  motorBackward(191);
  delay(2000);

  motorStop();
  delay(500);
}`
});


// ── PWM-06: 부저 멜로디 (도레미송)
CircuitTemplates.add({
  id:          'pwm-06-melody',
  name:        '부저 멜로디 (도레미송)',
  category:    'pwm',
  difficulty:  'intermediate',
  description: '수동 부저로 도레미송을 연주합니다. 배열로 악보를 정의하는 패턴.',

  components: [
    { id: 'BUZ1', type: 'Buzzer', x: 280, y: 200, config: {} }
  ],

  wires: [
    { from: { boardPin: 'G2' },  to: { compId: 'BUZ1', pinName: '+' }, color: '#FF9800' },
    { from: { boardPin: 'GND' }, to: { compId: 'BUZ1', pinName: '-' }, color: '#212121' }
  ],

  defaultCode: `// PWM-06: 도레미송 멜로디
// 배열로 악보(음표+박자) 정의

const int BUZZER_PIN = 2;
const int LEDC_CH    = 0;
const int TEMPO      = 400;  // 기본 박자 (ms)

// 음표 주파수 (C4 기준)
const int C4=262, D4=294, E4=330, F4=349, G4=392, A4=440, B4=494;
const int C5=523, D5=587, E5=659, F5=698, G5=784, A5=880;
const int REST=0;

// 도레미송 악보: {주파수, 박자(TEMPO 배수 × 100)}
int melody[][2] = {
  {C4,100},{D4,100},{E4,100},{C4,100},
  {C4,100},{D4,100},{E4,100},{C4,100},
  {E4,100},{F4,100},{G4,200},
  {E4,100},{F4,100},{G4,200},
  {G4, 75},{A4, 75},{G4, 75},{F4, 75},{E4,100},{C4,100},
  {G4, 75},{A4, 75},{G4, 75},{F4, 75},{E4,100},{C4,100},
  {C4,100},{G3_APPROX: D4-100,100},{C4,200},  // 주의: G3 대신 D4 조정
  {C4,100},{D4,100},{C4,200}
};
// 간단 버전
int notes[]     = {C4,D4,E4,F4,G4,A4,B4,C5};
int durations[] = {400,400,400,400,400,400,400,600};

void playTone(int freq, int dur) {
  if (freq == 0) { delay(dur); return; }
  ledcSetup(LEDC_CH, freq, 8);
  ledcAttachPin(BUZZER_PIN, LEDC_CH);
  ledcWrite(LEDC_CH, 127);
  delay(dur * 0.9);
  ledcWrite(LEDC_CH, 0);
  delay(dur * 0.1);
}

void setup() { Serial.begin(115200); }

void loop() {
  for (int i = 0; i < 8; i++) {
    playTone(notes[i], durations[i]);
  }
  delay(1000);
}`
});


// ── PWM-07: 서보 + 가변저항 (각도 조이스틱)
CircuitTemplates.add({
  id:          'pwm-07-servo-pot',
  name:        '가변저항으로 서보 각도 실시간 제어',
  category:    'pwm',
  difficulty:  'intermediate',
  description: '가변저항(ADC)으로 서보 모터 각도를 실시간으로 조정합니다.',

  components: [
    { id: 'POT1', type: 'Potentiometer', x: 200, y: 200, config: { value: 10000 } },
    { id: 'SRV1', type: 'Servo',         x: 380, y: 200, config: {} }
  ],

  wires: [
    { from: { boardPin: '3V3' }, to: { compId: 'POT1', pinName: 'VCC' },    color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'POT1', pinName: 'GND' },    color: '#212121' },
    { from: { boardPin: 'G4' },  to: { compId: 'POT1', pinName: 'OUT' },    color: '#FF9800' },
    { from: { boardPin: '5V' },  to: { compId: 'SRV1', pinName: 'VCC' },    color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'SRV1', pinName: 'GND' },    color: '#212121' },
    { from: { boardPin: 'G2' },  to: { compId: 'SRV1', pinName: 'SIGNAL' }, color: '#FF9800' }
  ],

  defaultCode: `// PWM-07: 가변저항 → 서보 각도 실시간 제어
#include <ESP32Servo.h>

const int POT_PIN   = 4;   // ADC
const int SERVO_PIN = 2;   // PWM

Servo myServo;

void setup() {
  Serial.begin(115200);
  ESP32PWM::allocateTimer(0);
  myServo.setPeriodHertz(50);
  myServo.attach(SERVO_PIN, 500, 2400);
}

void loop() {
  int adcVal = analogRead(POT_PIN);             // 0~4095
  int angle  = map(adcVal, 0, 4095, 0, 180);   // 0~180°
  myServo.write(angle);
  Serial.print("ADC: "); Serial.print(adcVal);
  Serial.print(" → "); Serial.print(angle); Serial.println("°");
  delay(20);
}`
});


// =============================================================================
// 타이밍 카테고리 (01~05)
// =============================================================================

// ── TIMING-01: millis() 논블로킹 타이머
CircuitTemplates.add({
  id:          'timing-01-millis-blink',
  name:        'millis() 논블로킹 LED 깜빡임',
  category:    'timing',
  difficulty:  'beginner',
  description: 'delay() 대신 millis()로 논블로킹 타이머를 구현합니다. ' +
               '여러 작업을 동시에 처리하는 기본 패턴.',

  components: [
    { id: 'R1',   type: 'Resistor', x: 320, y: 200, config: { value: 220 } },
    { id: 'LED1', type: 'LED',      x: 320, y: 280, config: { color: 'green' } }
  ],

  wires: [
    { from: { boardPin: 'G2' }, to: { compId: 'R1',   pinName: 'A' },  color: '#4CAF50' },
    { from: { compId: 'R1', pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' } },
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// TIMING-01: millis() 논블로킹 타이머
// delay() 사용 시 문제: 다른 코드가 완전히 멈춤
// millis() 사용: 타이머를 비교하여 논블로킹 동작

const int LED_PIN = 2;

// LED 제어 타이머
unsigned long ledPrevMs  = 0;
const unsigned long LED_INTERVAL = 500;  // 500ms 간격
bool ledState = false;

// 시리얼 출력 타이머 (독립적 동작)
unsigned long serialPrevMs  = 0;
const unsigned long SERIAL_INTERVAL = 1000;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("millis() 논블로킹 타이머 시작");
}

void loop() {
  unsigned long now = millis();

  // 500ms마다 LED 토글
  if (now - ledPrevMs >= LED_INTERVAL) {
    ledPrevMs = now;
    ledState  = !ledState;
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  }

  // 1000ms마다 시리얼 출력 (LED와 독립적)
  if (now - serialPrevMs >= SERIAL_INTERVAL) {
    serialPrevMs = now;
    Serial.print("업타임: "); Serial.print(now / 1000); Serial.println("초");
  }

  // 여기서 다른 작업 가능 (delay 없이)
}`
});


// ── TIMING-02: 멀티 타이머 (여러 주기 동시 관리)
CircuitTemplates.add({
  id:          'timing-02-multi-timer',
  name:        '멀티 타이머 (여러 주기 동시 처리)',
  category:    'timing',
  difficulty:  'intermediate',
  description: '서로 다른 주기를 가진 여러 이벤트를 millis()로 동시에 처리합니다.',

  components: [
    { id: 'R1',   type: 'Resistor', x: 250, y: 180, config: { value: 220 } },
    { id: 'LED1', type: 'LED',      x: 250, y: 260, config: { color: 'red' } },
    { id: 'R2',   type: 'Resistor', x: 380, y: 180, config: { value: 220 } },
    { id: 'LED2', type: 'LED',      x: 380, y: 260, config: { color: 'blue' } }
  ],

  wires: [
    { from: { boardPin: 'G2' }, to: { compId: 'R1', pinName: 'A' }, color: '#F44336' },
    { from: { compId: 'R1', pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' } },
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G3' }, to: { compId: 'R2', pinName: 'A' }, color: '#2196F3' },
    { from: { compId: 'R2', pinName: 'B' }, to: { compId: 'LED2', pinName: 'A' } },
    { from: { compId: 'LED2', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// TIMING-02: 멀티 타이머
// LED1(G2): 300ms 깜빡임
// LED2(G3): 700ms 깜빡임
// 두 LED가 서로 다른 주기로 독립 동작

struct Timer {
  unsigned long prevMs;
  unsigned long interval;
  bool state;
  int pin;
};

Timer timers[] = {
  {0, 300, false, 2},   // G2: 300ms
  {0, 700, false, 3}    // G3: 700ms
};
const int TIMER_COUNT = 2;

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < TIMER_COUNT; i++) {
    pinMode(timers[i].pin, OUTPUT);
  }
}

void loop() {
  unsigned long now = millis();
  for (int i = 0; i < TIMER_COUNT; i++) {
    if (now - timers[i].prevMs >= timers[i].interval) {
      timers[i].prevMs = now;
      timers[i].state  = !timers[i].state;
      digitalWrite(timers[i].pin, timers[i].state ? HIGH : LOW);
    }
  }
}`
});


// ── TIMING-03: 원샷 타이머 (한 번만 실행)
CircuitTemplates.add({
  id:          'timing-03-one-shot',
  name:        '원샷 타이머 (버튼 → N초 후 실행)',
  category:    'timing',
  difficulty:  'intermediate',
  description: '버튼을 누르면 지정 시간 후 LED가 꺼집니다. 원샷(one-shot) 타이머 패턴.',

  components: [
    { id: 'BTN1', type: 'Button',   x: 220, y: 180, config: { label: 'START' } },
    { id: 'R1',   type: 'Resistor', x: 380, y: 200, config: { value: 220 } },
    { id: 'LED1', type: 'LED',      x: 380, y: 280, config: { color: 'yellow' } }
  ],

  wires: [
    { from: { boardPin: 'G4' }, to: { compId: 'BTN1', pinName: 'PIN1' }, color: '#FF9800' },
    { from: { compId: 'BTN1', pinName: 'PIN2' }, to: { boardPin: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G2' }, to: { compId: 'R1', pinName: 'A' }, color: '#FFEB3B' },
    { from: { compId: 'R1', pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' } },
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// TIMING-03: 원샷 타이머
// 버튼(G4) 누르면 LED(G2) 켜고 3초 후 자동 꺼짐

const int BTN_PIN = 4;
const int LED_PIN = 2;
const unsigned long HOLD_MS = 3000;  // 3초 유지

bool ledOn = false;
unsigned long ledStartMs = 0;
bool lastBtn = HIGH;
unsigned long lastDb = 0;

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("버튼 누르면 LED 3초 켜짐");
}

void loop() {
  unsigned long now = millis();

  // 버튼 디바운싱
  bool btn = digitalRead(BTN_PIN);
  if (btn != lastBtn) lastDb = now;
  if ((now - lastDb) > 50 && btn == LOW && lastBtn == HIGH) {
    // 버튼 눌림 → LED 켜고 타이머 시작
    ledOn      = true;
    ledStartMs = now;
    digitalWrite(LED_PIN, HIGH);
    Serial.println("LED ON → 3초 후 OFF");
  }
  lastBtn = btn;

  // 타이머 만료 체크
  if (ledOn && (now - ledStartMs >= HOLD_MS)) {
    ledOn = false;
    digitalWrite(LED_PIN, LOW);
    Serial.println("LED OFF (타이머 만료)");
  }
}`
});


// ── TIMING-04: 주기적 센서 읽기
CircuitTemplates.add({
  id:          'timing-04-periodic-read',
  name:        '주기적 센서 읽기 (타이머 기반)',
  category:    'timing',
  difficulty:  'beginner',
  description: '500ms마다 ADC를 읽어 시리얼 출력하는 타이머 패턴입니다.',

  components: [
    { id: 'POT1', type: 'Potentiometer', x: 280, y: 200, config: { value: 10000 } }
  ],

  wires: [
    { from: { boardPin: '3V3' }, to: { compId: 'POT1', pinName: 'VCC' }, color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'POT1', pinName: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G4' },  to: { compId: 'POT1', pinName: 'OUT' }, color: '#FF9800' }
  ],

  defaultCode: `// TIMING-04: 주기적 센서 읽기
// millis() 기반 500ms 주기 ADC 읽기

const int ADC_PIN = 4;
unsigned long prevMs = 0;
const unsigned long INTERVAL = 500;  // 500ms

void setup() {
  Serial.begin(115200);
  Serial.println("주기적 ADC 읽기 (500ms)");
}

void loop() {
  unsigned long now = millis();
  if (now - prevMs >= INTERVAL) {
    prevMs = now;
    int raw   = analogRead(ADC_PIN);
    float vol = raw / 4095.0 * 3.3;
    Serial.print("["); Serial.print(now); Serial.print("ms] ");
    Serial.print("ADC: "); Serial.print(raw);
    Serial.print(" | "); Serial.print(vol, 2); Serial.println("V");
  }
  // 다른 작업 가능
}`
});


// ── TIMING-05: watchdog & 안전 패턴
CircuitTemplates.add({
  id:          'timing-05-watchdog',
  name:        '워치독 & 안전 타임아웃 패턴',
  category:    'timing',
  difficulty:  'advanced',
  description: '일정 시간 동안 응답이 없으면 안전 상태로 전환하는 워치독 패턴입니다.',

  components: [
    { id: 'BTN1', type: 'Button',   x: 220, y: 180, config: { label: 'RESET' } },
    { id: 'R1',   type: 'Resistor', x: 380, y: 200, config: { value: 220 } },
    { id: 'LED1', type: 'LED',      x: 380, y: 280, config: { color: 'red' } }
  ],

  wires: [
    { from: { boardPin: 'G4' }, to: { compId: 'BTN1', pinName: 'PIN1' }, color: '#FF9800' },
    { from: { compId: 'BTN1', pinName: 'PIN2' }, to: { boardPin: 'GND' }, color: '#212121' },
    { from: { boardPin: 'G2' }, to: { compId: 'R1', pinName: 'A' }, color: '#F44336' },
    { from: { compId: 'R1', pinName: 'B' }, to: { compId: 'LED1', pinName: 'A' } },
    { from: { compId: 'LED1', pinName: 'K' }, to: { boardPin: 'GND' }, color: '#212121' }
  ],

  defaultCode: `// TIMING-05: 워치독 패턴
// 5초 이내 버튼을 누르지 않으면 경고 LED 켜짐
// 버튼 누르면 타이머 리셋

const int BTN_PIN    = 4;
const int ALARM_PIN  = 2;
const unsigned long TIMEOUT_MS = 5000;  // 5초 타임아웃

unsigned long lastFeedMs = 0;  // 마지막 워치독 리셋 시간
bool alarmOn = false;
bool lastBtn = HIGH;

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN,   INPUT_PULLUP);
  pinMode(ALARM_PIN, OUTPUT);
  lastFeedMs = millis();
  Serial.println("워치독 시작 (5초 타임아웃)");
  Serial.println("→ 5초마다 버튼을 눌러 리셋하세요");
}

void loop() {
  unsigned long now = millis();
  bool btn = digitalRead(BTN_PIN);

  // 버튼 눌림 감지 (디바운싱 간략화)
  if (btn == LOW && lastBtn == HIGH) {
    lastFeedMs = now;  // 워치독 리셋
    alarmOn    = false;
    digitalWrite(ALARM_PIN, LOW);
    Serial.println("워치독 리셋!");
    delay(200);
  }
  lastBtn = btn;

  // 타임아웃 체크
  if (!alarmOn && (now - lastFeedMs >= TIMEOUT_MS)) {
    alarmOn = true;
    digitalWrite(ALARM_PIN, HIGH);
    Serial.println("경고! 워치독 타임아웃 → 안전 상태");
  }
}`
});


// =============================================================================
// I2C 카테고리 (OLED, LCD)
// =============================================================================

// ── I2C-01: OLED Hello World
CircuitTemplates.add({
  id:          'i2c-01-oled-hello',
  name:        'OLED SSD1306 Hello World',
  category:    'i2c',
  difficulty:  'intermediate',
  description: 'SSD1306 OLED 디스플레이에 텍스트를 표시합니다. ' +
               'I2C 통신, Adafruit SSD1306 라이브러리 사용.',

  components: [
    { id: 'OLED1', type: 'OLED_SSD1306', x: 280, y: 160, config: { width: 128, height: 64 } }
  ],

  wires: [
    { from: { boardPin: '3V3' }, to: { compId: 'OLED1', pinName: 'VCC' }, color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'OLED1', pinName: 'GND' }, color: '#212121' },
    { from: { boardPin: 'SCL' }, to: { compId: 'OLED1', pinName: 'SCL' }, color: '#9C27B0' },
    { from: { boardPin: 'SDA' }, to: { compId: 'OLED1', pinName: 'SDA' }, color: '#9C27B0' }
  ],

  defaultCode: `// I2C-01: OLED SSD1306 Hello World
// 라이브러리: Adafruit SSD1306, Adafruit GFX
// 연결: VCC→3V3, GND→GND, SCL→G9, SDA→G8

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_W  128
#define SCREEN_H   64
#define OLED_ADDR  0x3C  // I2C 주소 (보통 0x3C 또는 0x3D)
#define OLED_RESET  -1   // 리셋 핀 없음

Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, OLED_RESET);

void setup() {
  Serial.begin(115200);

  // OLED 초기화
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("SSD1306 초기화 실패!");
    while (true);
  }

  display.clearDisplay();

  // 텍스트 표시
  display.setTextSize(2);              // 2배 크기
  display.setTextColor(SSD1306_WHITE); // 흰색
  display.setCursor(10, 10);
  display.println("Hello!");

  display.setTextSize(1);
  display.setCursor(0, 35);
  display.println("ESP32-C3 OLED");
  display.setCursor(0, 45);
  display.print("I2C: 0x");
  display.println(OLED_ADDR, HEX);

  display.display();  // 버퍼 → 화면 반영
  Serial.println("OLED 표시 완료");
}

void loop() {
  // 업타임 표시
  unsigned long sec = millis() / 1000;
  display.fillRect(0, 55, 128, 9, SSD1306_BLACK);  // 아래 줄 지우기
  display.setCursor(0, 55);
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.print("Up: "); display.print(sec); display.print("s");
  display.display();
  delay(1000);
}`
});


// ── I2C-02: LCD 1602 기본 출력
CircuitTemplates.add({
  id:          'i2c-02-lcd1602',
  name:        'LCD 1602 I2C 텍스트 출력',
  category:    'i2c',
  difficulty:  'beginner',
  description: 'I2C 모듈이 달린 16×2 LCD에 텍스트를 표시합니다. ' +
               'LiquidCrystal_I2C 라이브러리 사용.',

  components: [
    { id: 'LCD1', type: 'LCD_1602', x: 280, y: 180, config: {} }
  ],

  wires: [
    { from: { boardPin: '5V' },  to: { compId: 'LCD1', pinName: 'VCC' }, color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'LCD1', pinName: 'GND' }, color: '#212121' },
    { from: { boardPin: 'SCL' }, to: { compId: 'LCD1', pinName: 'SCL' }, color: '#9C27B0' },
    { from: { boardPin: 'SDA' }, to: { compId: 'LCD1', pinName: 'SDA' }, color: '#9C27B0' }
  ],

  defaultCode: `// I2C-02: LCD 1602 I2C 텍스트 출력
// 라이브러리: LiquidCrystal_I2C
// I2C 주소 확인: i2c_scanner 스케치로 확인 (보통 0x27 또는 0x3F)

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// LCD I2C 주소, 열(16), 행(2)
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);
  lcd.init();         // LCD 초기화
  lcd.backlight();    // 백라이트 켜기

  // 1행 출력
  lcd.setCursor(0, 0);  // col=0, row=0 (첫 번째 행)
  lcd.print("Hello, World!");

  // 2행 출력
  lcd.setCursor(0, 1);  // col=0, row=1 (두 번째 행)
  lcd.print("ESP32-C3");

  Serial.println("LCD 출력 완료");
}

void loop() {
  // 시간 카운터 표시
  unsigned long sec = millis() / 1000;
  lcd.setCursor(9, 1);
  lcd.print("    ");    // 지우기
  lcd.setCursor(9, 1);
  lcd.print(sec);
  lcd.print("s");
  delay(1000);
}`
});


// =============================================================================
// 센서 카테고리 (온습도, 초음파)
// =============================================================================

// ── SENSOR-01: DHT11 온습도
CircuitTemplates.add({
  id:          'sensor-01-dht11',
  name:        'DHT11 온습도 측정',
  category:    'sensor',
  difficulty:  'beginner',
  description: 'DHT11 센서로 온도와 습도를 측정합니다. ' +
               'DHT 라이브러리 사용. 측정 간격 최소 2초.',

  components: [
    { id: 'DHT1', type: 'DHT11', x: 280, y: 180, config: { temp: 25, humidity: 55 } },
    { id: 'R1',   type: 'Resistor', x: 420, y: 200, config: { value: 4700 } }
  ],

  wires: [
    { from: { boardPin: '3V3' }, to: { compId: 'DHT1', pinName: 'VCC' },  color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'DHT1', pinName: 'GND' },  color: '#212121' },
    { from: { boardPin: 'G4' },  to: { compId: 'DHT1', pinName: 'DATA' }, color: '#4CAF50' },
    { from: { boardPin: '3V3' }, to: { compId: 'R1',   pinName: 'A' },    color: '#F44336' },
    { from: { compId: 'R1', pinName: 'B' }, to: { compId: 'DHT1', pinName: 'DATA' } }
  ],

  defaultCode: `// SENSOR-01: DHT11 온습도 측정
// 준비물: DHT11 센서, 4.7kΩ 풀업 저항
// 연결: VCC→3V3, GND→GND, DATA→G4 (풀업 저항 필요)
// 라이브러리: DHT sensor library by Adafruit

#include <DHT.h>

const int DHT_PIN  = 4;    // G4: DHT 데이터 핀
const int DHT_TYPE = DHT11; // DHT11 또는 DHT22

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  Serial.println("DHT11 온습도 측정 시작");
  Serial.println("온도(°C) | 습도(%) | 체감온도(°C)");
}

void loop() {
  // DHT11: 최소 2초 간격 필요
  delay(2000);

  float humidity = dht.readHumidity();
  float tempC    = dht.readTemperature();     // 섭씨
  float tempF    = dht.readTemperature(true); // 화씨

  // 읽기 실패 체크
  if (isnan(humidity) || isnan(tempC)) {
    Serial.println("DHT 읽기 실패! 연결을 확인하세요.");
    return;
  }

  // 체감 온도 (Heat Index)
  float heatIndex = dht.computeHeatIndex(tempC, humidity, false);

  Serial.print(tempC,    1); Serial.print("°C | ");
  Serial.print(humidity, 1); Serial.print("% | ");
  Serial.print(heatIndex,1); Serial.println("°C (체감)");
}`
});


// ── SENSOR-02: HC-SR04 초음파 거리
CircuitTemplates.add({
  id:          'sensor-02-ultrasonic',
  name:        'HC-SR04 초음파 거리 측정',
  category:    'sensor',
  difficulty:  'beginner',
  description: 'HC-SR04 초음파 센서로 거리를 측정합니다. ' +
               'TRIG 10μs 펄스 → ECHO 응답 시간 측정.',

  components: [
    { id: 'US1', type: 'Ultrasonic_HC_SR04', x: 260, y: 180, config: { distance: 25 } }
  ],

  wires: [
    { from: { boardPin: '5V' },  to: { compId: 'US1', pinName: 'VCC' },  color: '#F44336' },
    { from: { boardPin: 'GND' }, to: { compId: 'US1', pinName: 'GND' },  color: '#212121' },
    { from: { boardPin: 'G2' },  to: { compId: 'US1', pinName: 'TRIG' }, color: '#FF9800' },
    { from: { boardPin: 'G3' },  to: { compId: 'US1', pinName: 'ECHO' }, color: '#4CAF50' }
  ],

  defaultCode: `// SENSOR-02: HC-SR04 초음파 거리 측정
// 준비물: HC-SR04 모듈
// 연결: VCC→5V, GND→GND, TRIG→G2, ECHO→G3
// 측정 범위: 2~400cm

const int TRIG_PIN = 2;   // G2: 트리거 출력
const int ECHO_PIN = 3;   // G3: 에코 입력

long measureDistance() {
  // TRIG 10μs HIGH 펄스 전송
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // ECHO HIGH 시간 측정 (최대 30ms 대기)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  // 거리 계산: 음속 340m/s = 0.034cm/μs, 왕복이므로 /2
  long distance = duration * 0.034 / 2;
  return distance;
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.println("HC-SR04 거리 측정 시작");
}

void loop() {
  long dist = measureDistance();

  if (dist <= 0 || dist > 400) {
    Serial.println("범위 초과 (측정 불가)");
  } else {
    Serial.print("거리: "); Serial.print(dist); Serial.println(" cm");
  }
  delay(200);
}`
});

window.TEMPLATES = {

  /* ═══════════════════════════════════
     GPIO
  ═══════════════════════════════════ */

  'gpio-01': {
    id: 'gpio-01',
    name: '1-01. LED 깜빡임 (디지털 출력)',
    category: 'gpio',
    description: 'G2에 LED와 220Ω 저항을 연결하여 0.5초 간격으로 깜빡입니다.',
    components: [
      { type: 'LED',      color: 'red',  x: 400, y: 200 },
      { type: 'Resistor', value: 220,    x: 400, y: 310 },
    ],
    defaultCode: `/*
 * 1-01 디지털 출력 — LED 깜빡임
 * 준비물: LED 1개, 220Ω 저항 1개
 * 연결: G2 → 저항 → LED(+) → LED(-) → GND
 */

#define LED_PIN   2
#define INTERVAL  500

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("LED 깜빡임 시작!");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED ON");
  delay(INTERVAL);

  digitalWrite(LED_PIN, LOW);
  Serial.println("LED OFF");
  delay(INTERVAL);
}`
  },

  'gpio-02': {
    id: 'gpio-02',
    name: '1-02. 내장 LED (Active LOW)',
    category: 'gpio',
    description: 'G8 내장 LED — LOW가 켜짐, HIGH가 꺼짐입니다.',
    components: [],
    defaultCode: `/*
 * 1-02 내장 LED 제어 (Active LOW)
 * G8 핀에 내장 LED가 연결되어 있습니다.
 * LOW = 켜짐, HIGH = 꺼짐 (반전 로직)
 */

#define BUILTIN_LED  8

void setup() {
  Serial.begin(115200);
  pinMode(BUILTIN_LED, OUTPUT);
  Serial.println("내장 LED 제어 시작!");
  Serial.println("주의: LOW = 켜짐, HIGH = 꺼짐");
}

void loop() {
  digitalWrite(BUILTIN_LED, LOW);   // 켜기
  Serial.println("내장 LED ON (LOW)");
  delay(500);

  digitalWrite(BUILTIN_LED, HIGH);  // 끄기
  Serial.println("내장 LED OFF (HIGH)");
  delay(500);
}`
  },

  'gpio-03': {
    id: 'gpio-03',
    name: '1-03. 버튼 입력 (PULLUP)',
    category: 'gpio',
    description: 'BOOT 버튼(G9)으로 상태를 읽습니다.',
    components: [
      { type: 'Button', x: 420, y: 200 },
      { type: 'LED', color: 'green', x: 420, y: 320 },
    ],
    defaultCode: `/*
 * 1-03 디지털 입력 — 버튼 (INPUT_PULLUP)
 * 보드의 BOOT 버튼(G9)을 사용합니다.
 * 누르지 않으면 HIGH, 누르면 LOW
 */

#define BUTTON_PIN  9   // BOOT 버튼
#define LED_PIN     8   // 내장 LED

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("버튼을 눌러보세요! (BOOT 버튼)");
}

void loop() {
  int state = digitalRead(BUTTON_PIN);

  if (state == LOW) {
    // 버튼 눌림 (LOW)
    digitalWrite(LED_PIN, LOW);   // LED 켜기
    Serial.println("버튼 눌림!");
  } else {
    // 버튼 안 눌림 (HIGH)
    digitalWrite(LED_PIN, HIGH);  // LED 끄기
  }
  delay(50);
}`
  },

  'gpio-05': {
    id: 'gpio-05',
    name: '1-05. 버튼으로 LED 토글',
    category: 'gpio',
    description: '버튼을 누를 때마다 LED 상태가 반전됩니다.',
    components: [
      { type: 'Button', x: 380, y: 180 },
      { type: 'LED', color: 'red', x: 450, y: 180 },
      { type: 'Resistor', value: 220, x: 450, y: 290 },
    ],
    defaultCode: `/*
 * 1-05 버튼으로 LED 토글
 * 버튼을 한 번 누를 때마다 LED가 켜졌다 꺼집니다.
 */

#define BUTTON_PIN  9
#define LED_PIN     2

bool ledState = false;
bool lastButtonState = HIGH;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("버튼으로 LED 토글 — BOOT 버튼을 눌러보세요!");
}

void loop() {
  bool currentButton = digitalRead(BUTTON_PIN);

  // 누르는 순간 감지 (HIGH → LOW)
  if (lastButtonState == HIGH && currentButton == LOW) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);
    Serial.print("LED: ");
    Serial.println(ledState ? "ON" : "OFF");
  }

  lastButtonState = currentButton;
  delay(20);
}`
  },

  'gpio-06': {
    id: 'gpio-06',
    name: '1-06. 외부 인터럽트 (FALLING)',
    category: 'gpio',
    description: '버튼 누름을 인터럽트로 감지합니다.',
    components: [
      { type: 'Button', x: 400, y: 200 },
    ],
    defaultCode: `/*
 * 1-06 외부 인터럽트 — FALLING
 * BOOT 버튼(G9)을 누르면 인터럽트가 발생합니다.
 */

#define BUTTON_PIN  9

volatile int count = 0;   // volatile: 인터럽트에서 변경되는 변수

// IRAM_ATTR: 인터럽트 핸들러는 빠른 메모리에 위치
void IRAM_ATTR onButtonPress() {
  count++;
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // FALLING: HIGH→LOW 전환 시 (버튼 누를 때)
  attachInterrupt(BUTTON_PIN, onButtonPress, FALLING);

  Serial.println("인터럽트 설정 완료! BOOT 버튼을 눌러보세요.");
}

void loop() {
  if (count > 0) {
    Serial.print("버튼 눌린 횟수: ");
    Serial.println(count);
  }
  delay(100);
}`
  },

  'gpio-09': {
    id: 'gpio-09',
    name: '1-09. 버튼 디바운싱',
    category: 'gpio',
    description: '채터링 없이 정확한 버튼 감지.',
    components: [
      { type: 'Button', x: 400, y: 200 },
    ],
    defaultCode: `/*
 * 1-09 버튼 디바운싱 (소프트웨어)
 * 기계식 버튼은 눌릴 때 수십ms 동안 ON/OFF를 반복합니다.
 * millis()로 20ms 안정화 후 상태 확정
 */

#define BUTTON_PIN    9
#define DEBOUNCE_MS   20

bool lastStable     = HIGH;
bool lastRaw        = HIGH;
unsigned long changeTime = 0;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.println("디바운싱 테스트 — BOOT 버튼을 눌러보세요.");
}

void loop() {
  bool raw = digitalRead(BUTTON_PIN);
  unsigned long now = millis();

  if (raw != lastRaw) {
    lastRaw = raw;
    changeTime = now;         // 변화 시점 기록
  }

  // 마지막 변화 이후 20ms 유지되면 확정
  if ((now - changeTime) >= DEBOUNCE_MS && raw != lastStable) {
    lastStable = raw;
    if (lastStable == LOW) {
      Serial.println("버튼 눌림 (디바운싱 완료)");
    } else {
      Serial.println("버튼 뗌");
    }
  }
}`
  },

  'gpio-11': {
    id: 'gpio-11',
    name: '1-11. 릴레이 제어',
    category: 'gpio',
    description: '릴레이 모듈을 켜고 끕니다.',
    components: [
      { type: 'Relay', x: 400, y: 200 },
    ],
    defaultCode: `/*
 * 1-11 릴레이 모듈 제어
 * 릴레이: G2에 연결 (Active LOW — LOW가 켜짐)
 */

#define RELAY_PIN  2

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);  // 초기 OFF (Active LOW)
  Serial.println("릴레이 제어 시작!");
}

void loop() {
  digitalWrite(RELAY_PIN, LOW);   // 릴레이 ON
  Serial.println("릴레이 ON (전원 연결)");
  delay(2000);

  digitalWrite(RELAY_PIN, HIGH);  // 릴레이 OFF
  Serial.println("릴레이 OFF (전원 차단)");
  delay(2000);
}`
  },

  /* ═══════════════════════════════════
     ADC
  ═══════════════════════════════════ */

  'adc-01': {
    id: 'adc-01',
    name: '2-01. 기본 ADC 읽기 (0~4095)',
    category: 'adc',
    description: 'G0 핀의 아날로그 값을 읽습니다.',
    components: [
      { type: 'Potentiometer', x: 400, y: 220 },
    ],
    defaultCode: `/*
 * 2-01 기본 ADC 읽기
 * G0에 전위계를 연결합니다.
 * 읽기 범위: 0 ~ 4095 (12비트)
 */

#define ADC_PIN      0
#define READ_INTERVAL 500

unsigned long lastRead = 0;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);   // 12비트 (0~4095)
  Serial.println("ADC 읽기 시작!");
}

void loop() {
  if (millis() - lastRead >= READ_INTERVAL) {
    lastRead = millis();
    int raw = analogRead(ADC_PIN);
    Serial.print("ADC(G0) = ");
    Serial.println(raw);
  }
}`
  },

  'adc-02': {
    id: 'adc-02',
    name: '2-02. ADC → 전압 변환',
    category: 'adc',
    description: 'ADC 값을 실제 전압(V)으로 변환합니다.',
    components: [
      { type: 'Potentiometer', x: 400, y: 220 },
    ],
    defaultCode: `/*
 * 2-02 ADC → 전압 변환
 * raw 값을 실제 전압으로: voltage = raw * (3.3 / 4095)
 */

#define ADC_PIN  0
#define VCC      3.3f

unsigned long lastRead = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("전압 측정 시작 (0 ~ 3.3V)");
}

void loop() {
  if (millis() - lastRead >= 500) {
    lastRead = millis();
    int raw = analogRead(ADC_PIN);
    float voltage = raw * (VCC / 4095.0f);
    Serial.print("raw=");
    Serial.print(raw);
    Serial.print("  voltage=");
    Serial.print(voltage, 3);
    Serial.println(" V");
  }
}`
  },

  'adc-05': {
    id: 'adc-05',
    name: '2-05. 가변저항으로 값 읽기',
    category: 'adc',
    description: '가변저항 조절로 ADC 값 변화 확인.',
    components: [
      { type: 'Potentiometer', x: 380, y: 200 },
      { type: 'LED', color: 'yellow', x: 500, y: 200 },
      { type: 'Resistor', value: 220, x: 500, y: 310 },
    ],
    defaultCode: `/*
 * 2-05 가변저항 읽기 + LED 밝기 조절
 * 가변저항(G0)으로 LED(G2) 밝기를 조절합니다.
 */

#define POT_PIN  0
#define LED_PIN  2
#define PWM_CH   0

void setup() {
  Serial.begin(115200);
  ledcSetup(PWM_CH, 5000, 8);   // 채널0, 5kHz, 8비트
  ledcAttachPin(LED_PIN, PWM_CH);
  Serial.println("가변저항으로 LED 밝기 조절!");
}

void loop() {
  int raw = analogRead(POT_PIN);            // 0~4095
  int duty = map(raw, 0, 4095, 0, 255);    // 0~255로 변환
  ledcWrite(PWM_CH, duty);

  Serial.print("POT="); Serial.print(raw);
  Serial.print("  duty="); Serial.println(duty);
  delay(100);
}`
  },

  'adc-06': {
    id: 'adc-06',
    name: '2-06. CDS 조도 센서',
    category: 'adc',
    description: '조도에 따라 어두우면 LED를 켭니다.',
    components: [
      { type: 'CDS', x: 380, y: 200 },
      { type: 'LED', color: 'yellow', x: 500, y: 200 },
    ],
    defaultCode: `/*
 * 2-06 CDS 조도 센서
 * 밝으면 값이 낮고, 어두우면 값이 높습니다.
 * 전압 분배 회로: 3.3V → 10kΩ → G0 → CDS → GND
 */

#define CDS_PIN    0
#define LED_PIN    8   // 내장 LED
#define DARK_THRESHOLD  2000

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("CDS 조도 감지 시작!");
}

void loop() {
  int cds = analogRead(CDS_PIN);
  Serial.print("조도값: ");
  Serial.print(cds);

  if (cds > DARK_THRESHOLD) {
    digitalWrite(LED_PIN, LOW);   // 어두움 → LED 켜기
    Serial.println("  → 어두움 (LED ON)");
  } else {
    digitalWrite(LED_PIN, HIGH);  // 밝음 → LED 끄기
    Serial.println("  → 밝음 (LED OFF)");
  }
  delay(300);
}`
  },

  /* ═══════════════════════════════════
     PWM
  ═══════════════════════════════════ */

  'pwm-01': {
    id: 'pwm-01',
    name: '3-01. LED 밝기 조절',
    category: 'pwm',
    description: 'ledcWrite로 LED 밝기를 단계별 조절.',
    components: [
      { type: 'LED', color: 'blue', x: 400, y: 200 },
      { type: 'Resistor', value: 220, x: 400, y: 310 },
    ],
    defaultCode: `/*
 * 3-01 LED 밝기 조절 (ledcWrite)
 * ESP32는 analogWrite()가 없습니다.
 * ledcSetup → ledcAttachPin → ledcWrite 순서로 사용합니다.
 */

#define LED_PIN       2
#define PWM_CHANNEL   0
#define PWM_FREQ      5000
#define PWM_RESOLUTION 8

void setup() {
  Serial.begin(115200);
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(LED_PIN, PWM_CHANNEL);
  Serial.println("LED 밝기 조절 시작!");
}

void loop() {
  // 0 → 255 (점점 밝아짐)
  for (int duty = 0; duty <= 255; duty += 5) {
    ledcWrite(PWM_CHANNEL, duty);
    Serial.print("밝기: "); Serial.println(duty);
    delay(30);
  }
  // 255 → 0 (점점 어두워짐)
  for (int duty = 255; duty >= 0; duty -= 5) {
    ledcWrite(PWM_CHANNEL, duty);
    delay(30);
  }
}`
  },

  'pwm-02': {
    id: 'pwm-02',
    name: '3-02. LED 페이드 인/아웃',
    category: 'pwm',
    description: 'sin() 함수로 부드러운 페이드.',
    components: [
      { type: 'LED', color: 'blue', x: 400, y: 200 },
      { type: 'Resistor', value: 220, x: 400, y: 310 },
    ],
    defaultCode: `/*
 * 3-02 LED 페이드 인/아웃
 * sin() 함수로 자연스럽게 밝아졌다 어두워집니다.
 * delay() 없이 millis()로 부드럽게 동작합니다.
 */
#include <math.h>

#define LED_PIN       2
#define PWM_CHANNEL   0
#define PWM_FREQ      5000
#define PWM_RESOLUTION 8

void setup() {
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(LED_PIN, PWM_CHANNEL);
}

void loop() {
  float t = millis() / 1000.0f;
  // sin(): -1 ~ +1  →  (sin+1)/2 = 0~1  →  *255 = 0~255
  int duty = (int)((sin(t * 2.0f) + 1.0f) / 2.0f * 255);
  ledcWrite(PWM_CHANNEL, duty);
}`
  },

  'pwm-03': {
    id: 'pwm-03',
    name: '3-03. 가변저항으로 LED 밝기',
    category: 'pwm',
    description: '가변저항(ADC)으로 LED 밝기 실시간 조절.',
    components: [
      { type: 'Potentiometer', x: 350, y: 220 },
      { type: 'LED', color: 'blue', x: 480, y: 200 },
      { type: 'Resistor', value: 220, x: 480, y: 310 },
    ],
    defaultCode: `/*
 * 3-03 가변저항으로 LED 밝기 조절
 * G0 ADC 값(0~4095) → PWM 듀티(0~255)로 변환
 */

#define POT_PIN       0
#define LED_PIN       2
#define PWM_CHANNEL   0

void setup() {
  Serial.begin(115200);
  ledcSetup(PWM_CHANNEL, 5000, 8);
  ledcAttachPin(LED_PIN, PWM_CHANNEL);
}

void loop() {
  int raw  = analogRead(POT_PIN);
  int duty = map(raw, 0, 4095, 0, 255);
  ledcWrite(PWM_CHANNEL, duty);
  Serial.print("ADC="); Serial.print(raw);
  Serial.print(" duty="); Serial.println(duty);
  delay(50);
}`
  },

  'pwm-04': {
    id: 'pwm-04',
    name: '3-04. 서보모터 각도 제어',
    category: 'pwm',
    description: '0°, 90°, 180° 순서로 서보 회전.',
    components: [
      { type: 'Servo', x: 400, y: 200 },
    ],
    defaultCode: `/*
 * 3-04 서보모터 각도 제어
 * 서보 핀: G2, VCC: 5V, GND: GND
 * 50Hz / 16비트 해상도 사용
 */

#define SERVO_PIN        2
#define SERVO_CHANNEL    0
#define SERVO_FREQ       50
#define SERVO_RESOLUTION 16
#define SERVO_MIN_DUTY   1638   // 0도 (1ms / 20ms * 65535)
#define SERVO_MAX_DUTY   8192   // 180도 (2.5ms / 20ms * 65535)

// 각도를 duty값으로 변환
int angleToDuty(int angle) {
  return map(angle, 0, 180, SERVO_MIN_DUTY, SERVO_MAX_DUTY);
}

void setup() {
  Serial.begin(115200);
  ledcSetup(SERVO_CHANNEL, SERVO_FREQ, SERVO_RESOLUTION);
  ledcAttachPin(SERVO_PIN, SERVO_CHANNEL);
  Serial.println("서보모터 시작!");
}

void loop() {
  int angles[] = {0, 45, 90, 135, 180};
  for (int i = 0; i < 5; i++) {
    int duty = angleToDuty(angles[i]);
    ledcWrite(SERVO_CHANNEL, duty);
    Serial.print("각도: "); Serial.print(angles[i]); Serial.println("도");
    delay(1000);
  }
}`
  },

  'pwm-08': {
    id: 'pwm-08',
    name: '3-08. 수동 부저 단음',
    category: 'pwm',
    description: '도레미파솔라시도 음 재생.',
    components: [
      { type: 'Buzzer', x: 400, y: 200 },
    ],
    defaultCode: `/*
 * 3-08 수동 부저 — 단음 재생
 * 부저 +: G2, 부저 -: GND
 */

#define BUZZER_PIN     2
#define BUZZER_CHANNEL 0

// 음 주파수 (Hz)
#define NOTE_C4  262
#define NOTE_D4  294
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_G4  392
#define NOTE_A4  440
#define NOTE_B4  494
#define NOTE_C5  523

void playNote(int freq, int durationMs) {
  ledcWriteTone(BUZZER_CHANNEL, freq);
  ledcWrite(BUZZER_CHANNEL, 128);   // 50% 듀티 (소리 최대)
  delay(durationMs);
  ledcWrite(BUZZER_CHANNEL, 0);     // 무음
  delay(50);
}

void setup() {
  Serial.begin(115200);
  ledcSetup(BUZZER_CHANNEL, 2000, 8);
  ledcAttachPin(BUZZER_PIN, BUZZER_CHANNEL);
  Serial.println("부저 단음 재생!");
}

void loop() {
  int notes[]    = {NOTE_C4, NOTE_D4, NOTE_E4, NOTE_F4, NOTE_G4, NOTE_A4, NOTE_B4, NOTE_C5};
  int durations[] = {300, 300, 300, 300, 300, 300, 300, 600};

  for (int i = 0; i < 8; i++) {
    Serial.print("음: "); Serial.print(notes[i]); Serial.println("Hz");
    playNote(notes[i], durations[i]);
  }
  delay(1000);
}`
  },

  'pwm-09': {
    id: 'pwm-09',
    name: '3-09. 부저 멜로디 (학교종)',
    category: 'pwm',
    description: '학교종이 멜로디 재생.',
    components: [
      { type: 'Buzzer', x: 400, y: 200 },
    ],
    defaultCode: `/*
 * 3-09 수동 부저 — 학교종이 멜로디
 */

#define BUZZER_PIN     2
#define BUZZER_CHANNEL 0
#define NOTE_C4  262
#define NOTE_D4  294
#define NOTE_E4  330
#define NOTE_G4  392
#define NOTE_A4  440

struct Note { int freq; int duration; };

const Note melody[] = {
  {NOTE_G4, 300}, {NOTE_G4, 300}, {NOTE_A4, 300}, {NOTE_A4, 300},
  {NOTE_G4, 300}, {NOTE_G4, 300}, {NOTE_E4, 600},
  {NOTE_G4, 300}, {NOTE_G4, 300}, {NOTE_E4, 300}, {NOTE_E4, 300},
  {NOTE_D4, 900},
};

const int MELODY_LEN = sizeof(melody) / sizeof(melody[0]);

void playNote(int freq, int ms) {
  if (freq == 0) { ledcWrite(BUZZER_CHANNEL, 0); }
  else {
    ledcWriteTone(BUZZER_CHANNEL, freq);
    ledcWrite(BUZZER_CHANNEL, 128);
  }
  delay(ms);
  ledcWrite(BUZZER_CHANNEL, 0);
  delay(30);
}

void setup() {
  Serial.begin(115200);
  ledcSetup(BUZZER_CHANNEL, 2000, 8);
  ledcAttachPin(BUZZER_PIN, BUZZER_CHANNEL);
}

void loop() {
  Serial.println("학교종이 댕댕댕~");
  for (int i = 0; i < MELODY_LEN; i++) {
    playNote(melody[i].freq, melody[i].duration);
  }
  delay(2000);
}`
  },

  /* ═══════════════════════════════════
     타이밍
  ═══════════════════════════════════ */

  'timing-01': {
    id: 'timing-01',
    name: '4-01. millis() 논블로킹 타이머',
    category: 'timing',
    description: 'delay() 없이 주기적 작업.',
    components: [
      { type: 'LED', color: 'green', x: 420, y: 200 },
    ],
    defaultCode: `/*
 * 4-01 millis() 논블로킹 타이머
 * delay()는 모든 동작을 멈춥니다.
 * millis() 차이를 확인하면 다른 작업을 할 수 있습니다.
 */

#define LED_PIN     8
#define LED_INTERVAL  500
#define LOG_INTERVAL  2000

unsigned long lastLed = 0;
unsigned long lastLog = 0;
bool ledState = false;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("millis() 논블로킹 타이머 시작!");
}

void loop() {
  unsigned long now = millis();

  // 0.5초마다 LED 토글
  if (now - lastLed >= LED_INTERVAL) {
    lastLed = now;
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState ? LOW : HIGH);
  }

  // 2초마다 로그 출력
  if (now - lastLog >= LOG_INTERVAL) {
    lastLog = now;
    Serial.print("경과 시간: ");
    Serial.print(now / 1000);
    Serial.println("초");
  }
}`
  },

  'timing-02': {
    id: 'timing-02',
    name: '4-02. 다중 millis 타이머',
    category: 'timing',
    description: '여러 작업을 동시에 비동기 실행.',
    components: [
      { type: 'LED', color: 'red',   x: 360, y: 200 },
      { type: 'LED', color: 'green', x: 430, y: 200 },
      { type: 'LED', color: 'blue',  x: 500, y: 200 },
    ],
    defaultCode: `/*
 * 4-02 다중 millis() 타이머
 * 빨강 LED: 0.3초, 초록 LED: 0.7초, 파랑 LED: 1.5초 주기
 */

#define LED_R  2
#define LED_G  3
#define LED_B  4

unsigned long t1=0, t2=0, t3=0;
bool s1=false, s2=false, s3=false;

void setup() {
  Serial.begin(115200);
  pinMode(LED_R, OUTPUT);
  pinMode(LED_G, OUTPUT);
  pinMode(LED_B, OUTPUT);
  Serial.println("다중 타이머 시작!");
}

void loop() {
  unsigned long now = millis();

  if (now - t1 >= 300) { t1=now; s1=!s1; digitalWrite(LED_R, s1?HIGH:LOW); }
  if (now - t2 >= 700) { t2=now; s2=!s2; digitalWrite(LED_G, s2?HIGH:LOW); }
  if (now - t3 >= 1500){ t3=now; s3=!s3; digitalWrite(LED_B, s3?HIGH:LOW); }
}`
  },

  /* ═══════════════════════════════════
     UART
  ═══════════════════════════════════ */

  'uart-01': {
    id: 'uart-01',
    name: '5-01. 시리얼 에코',
    category: 'uart',
    description: '입력한 텍스트를 그대로 돌려보냅니다.',
    components: [],
    defaultCode: `/*
 * 5-01 UART0 기본 송수신
 * 시리얼 모니터에서 텍스트를 입력하면 그대로 출력됩니다.
 * 아래 '시리얼 모니터' 창에서 텍스트를 입력해보세요!
 */

#define BAUD_RATE    115200
#define ECHO_PREFIX  "[에코] "

void setup() {
  Serial.begin(BAUD_RATE);
  delay(100);
  Serial.println("=== 시리얼 에코 테스트 ===");
  Serial.println("텍스트를 입력하면 그대로 돌아옵니다.");
}

void loop() {
  if (Serial.available() > 0) {
    String received = Serial.readStringUntil('\\n');
    received.trim();
    if (received.length() > 0) {
      Serial.print(ECHO_PREFIX);
      Serial.println(received);
    }
  }
}`
  },

  'uart-02': {
    id: 'uart-02',
    name: '5-02. 시리얼 명령어 파서',
    category: 'uart',
    description: 'LED ON/OFF/STATUS 명령어로 제어.',
    components: [
      { type: 'LED', color: 'red', x: 400, y: 200 },
    ],
    defaultCode: `/*
 * 5-02 시리얼 명령어 파서
 * 명령어: LED ON, LED OFF, STATUS
 * 시리얼 모니터에서 입력하세요.
 */

#define LED_PIN  8
bool ledState = false;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);  // 초기 OFF
  Serial.println("명령어: LED ON / LED OFF / STATUS");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();

    if (cmd == "LED ON") {
      ledState = true;
      digitalWrite(LED_PIN, LOW);   // Active LOW
      Serial.println("OK: LED ON");
    } else if (cmd == "LED OFF") {
      ledState = false;
      digitalWrite(LED_PIN, HIGH);
      Serial.println("OK: LED OFF");
    } else if (cmd == "STATUS") {
      Serial.print("LED 상태: ");
      Serial.println(ledState ? "ON" : "OFF");
    } else {
      Serial.print("알 수 없는 명령: ");
      Serial.println(cmd);
    }
  }
}`
  },
};
