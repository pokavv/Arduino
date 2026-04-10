# CLAUDE.md — Arduino Web Simulator (v2)

Wokwi / TinkerCAD Circuits / Proteus 수준의 Arduino 웹 시뮬레이터.
**pnpm monorepo** 구조로 전면 재설계됨.

---

## Claude 작업 규칙

> **CRITICAL**: `codex:codex-rescue` 에이전트(Codex)를 절대 사용하지 않는다. **Claude Code 도구만** 사용한다.
> **주의**: 서브에이전트를 쓸 경우 반드시 `general-purpose`, `Explore`, `Plan` 등 Claude 기반 에이전트만 사용한다.

---

## 실행 방법

> **주의**: 서버 기동/종료는 사용자가 직접 한다. Claude는 `pnpm dev` 등 서버 실행 명령을 대신 실행하지 않는다.

```bash
cd /c/Users/park1024/Documents/Arduino/projects/web-simulator
pnpm dev
```

브라우저: `http://localhost:5173`

개별 실행이 필요한 경우:

```bash
# 백엔드만 (포트 3001)
pnpm --filter server dev

# 프론트엔드만 (포트 5173)
pnpm --filter @sim/app dev
```

---

## 디렉토리 구조

```
web-simulator/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── packages/
│   ├── elements/                    # @sim/elements — Lit Web Components
│   │   └── src/
│   │       ├── components/          # sim-led, sim-button, sim-board-uno, ...
│   │       ├── utils/               # pin-match.ts
│   │       └── index.ts
│   ├── sim-engine/                  # @sim/engine — 시뮬레이션 엔진
│   │   └── src/
│   │       ├── runtime/
│   │       │   ├── transpiler.ts    # C++ → async JS 변환
│   │       │   ├── gpio.ts          # GpioController
│   │       │   ├── scheduler.ts     # millis/micros/delay
│   │       │   ├── preamble.ts      # Arduino API 바인딩 (조합)
│   │       │   ├── pin-utils.ts     # normalizePin, resolveBoardPin (공용)
│   │       │   └── mocks/           # 라이브러리 mock 코드 문자열
│   │       │       ├── dht-mock.ts
│   │       │       ├── lcd-mock.ts
│   │       │       ├── oled-mock.ts
│   │       │       ├── servo-mock.ts
│   │       │       ├── neopixel-mock.ts
│   │       │       ├── wire-mock.ts
│   │       │       └── index.ts
│   │       ├── libraries/
│   │       ├── worker/
│   │       │   └── sim-worker.ts    # Web Worker 진입점
│   │       └── index.ts
│   └── app/                         # @sim/app — 프론트엔드 SPA (Vite)
│       ├── index.html
│       └── src/
│           ├── api/
│           │   └── api-client.ts    # fetch 래퍼, 타입 정의 (단일 소스)
│           ├── canvas/
│           │   ├── circuit-canvas.ts    # 파사드 (조합만)
│           │   ├── wire-renderer.ts     # 와이어 SVG 렌더링
│           │   ├── pin-renderer.ts      # 핀 포인트 렌더링
│           │   ├── canvas-interaction.ts # 팬/줌/드래그 이벤트
│           │   ├── element-builder.ts   # Lit Element 생성
│           │   ├── context-menus.ts     # 컨텍스트 메뉴
│           │   ├── sim-element-types.ts # SimElementLike 인터페이스
│           │   └── pin-colors.ts        # PIN_COLOR_MAP, WIRE_AUTO_COLORS
│           ├── editor/              # CodeEditor (Monaco)
│           ├── panels/              # property-panel.ts
│           ├── stores/
│           │   ├── circuit-store.ts     # 회로 상태, Undo/Redo
│           │   ├── sim-controller.ts    # Worker 생명주기
│           │   ├── circuit-validator.ts # 전기적 규칙 검증
│           │   └── comp-def-cache.ts    # 컴포넌트 정의 캐시
│           ├── ui/
│           │   ├── theme-manager.ts     # 다크/라이트 테마
│           │   ├── toolbar.ts           # 상단 툴바 버튼
│           │   ├── status-bar.ts        # 하단 상태바
│           │   ├── palette.ts           # 좌측 부품 팔레트
│           │   └── serial-monitor.ts    # 시리얼 모니터
│           ├── worker/
│           └── app.ts               # 메인 진입점 (파사드)
└── server/                          # Express REST API
    └── src/
        ├── data/
        │   ├── components.ts        # SEED_COMPONENTS (30종 SVG + 15종 generic)
        │   ├── templates.ts         # 예제 회로 템플릿 (20종+)
        │   └── boards.ts
        ├── routes/
        └── index.ts
```

---

## 핵심 아키텍처

### 컴포넌트 시스템 (@sim/elements)
- 각 부품은 `<sim-led>`, `<sim-button>` 등 **Lit Custom Element**
- `SimElement` 베이스 클래스 상속
- `setPinState(pin, value)` — 엔진 → 컴포넌트 업데이트
- `connections: Map<pin, gpio>` — 핀 연결 상태
- `SimElementLike` 인터페이스 (`sim-element-types.ts`) — canvas에서 타입 안전하게 사용

### 시뮬레이션 엔진 (@sim/engine)
- **Web Worker**에서 실행 (UI 블로킹 없음)
- `ArduinoTranspiler` — C++ → async JavaScript
  - 함수형 매크로 `#define F(x)` → JS arrow function
  - `static` 변수 → 모듈 스코프 (`__static_` 접두사)
  - `struct` → JS 생성자 함수
  - `String` 타입, 배열 초기화 `{1,2,3}` 지원
- `GpioController` — digitalWrite/Read/analogWrite/Read
- `SimScheduler` — millis/micros/delay
- `pin-utils.ts` — `normalizePin()`, `resolveBoardPin()` 공용 (gpio.ts, circuit-store.ts에서 공유)

### 라이브러리 Mock (preamble)
`runtime/mocks/` 에 각각 분리된 JS 코드 문자열 반환 함수:
- `dhtMock()` — DHT11/DHT22
- `lcdMock()` — LiquidCrystal_I2C
- `oledMock()` — Adafruit_SSD1306
- `servoMock()` — Servo
- `neopixelMock()` — Adafruit_NeoPixel
- `wireMock()` — Wire (I2C)

### API 클라이언트 (api-client.ts)
`packages/app/src/api/api-client.ts` 가 **유일한** API 호출 진입점:
- `API_BASE = '/api'` 단일 정의
- `apiFetch<T>()` 공통 래퍼 (에러 시 `ApiError` throw)
- `CompDef`, `BoardInfo`, `TemplateInfo` 등 타입 정의 단일 소스
- `fetchBoards`, `fetchComponents`, `fetchComponentDef`, `fetchTemplates`, `fetchTemplateDetail`, `validateConnection`

> **주의**: 다른 파일에서 직접 `fetch('/api/...')` 하지 말 것. 반드시 api-client.ts 함수 사용.

### SENSOR_UPDATE 등록 방식
`sim-worker.ts` 상단의 `SENSOR_DATA_MAP`에 타입별 데이터 키 → 컨텍스트 키 매핑 등록:
```ts
const SENSOR_DATA_MAP: Record<string, Record<string, string>> = {
  dht:       { temperature: '__dht_temp', humidity: '__dht_hum' },
  ultrasonic:{ distanceCm: '__ultrasonic_dist' },
  servo:     { angle: '__servo_angle' },
  // 새 센서 추가 시 여기에만 추가
};
```

### 통신 프로토콜 (Main ↔ Worker)
```
INIT { circuit, code } → 엔진 초기화 및 실행
STOP → 엔진 정지
PIN_EVENT { pin, value } → 버튼 등 외부 입력
SENSOR_UPDATE { id, data } → 센서 값 업데이트
────────────────────────────────────────
PIN_STATE { pin, value } ← GPIO 상태 변경
COMPONENT_UPDATE { id, pin, value } ← 부품별 업데이트
SERIAL_OUTPUT { text } ← 시리얼 출력
RUNTIME_ERROR { message } ← 오류
COMPILE_ERROR { message, line? } ← 컴파일 오류 (줄 번호 포함)
```

### 핀 번호 매칭
`packages/elements/src/utils/pin-match.ts`의 `pinMatch()` 사용
- `'G9' === 9`, `'D9' === 9`, `9 === 9` 모두 매칭
- ESP32(G 접두사), Arduino Uno(D 접두사), 숫자 모두 지원
- 공용 파싱: `packages/sim-engine/src/runtime/pin-utils.ts`

### 캔버스 모듈 구조
`circuit-canvas.ts`는 파사드 역할만 하며 실제 로직은 분리:
- `wire-renderer.ts` — 와이어 경로/색상/끝점 렌더링
- `pin-renderer.ts` — 핀 포인트 위치/색상 렌더링
- `canvas-interaction.ts` — 팬/줌/드래그 (`CANVAS_GRID_SIZE = 8` 상수)
- `element-builder.ts` — Lit Element DOM 생성
- `context-menus.ts` — 우클릭 컨텍스트 메뉴
- `pin-colors.ts` — `PIN_DOT_COLORS`, `WIRE_AUTO_COLORS` 매핑 테이블

---

## 지원 보드

| ID | 이름 | MCU | ADC | 전용 Element |
|----|------|-----|-----|-------------|
| arduino-uno | Arduino Uno R3 | ATmega328P | 10비트 | `<sim-board-uno>` |
| arduino-nano | Arduino Nano | ATmega328P | 10비트 | `<sim-board-nano>` |
| esp32-c3-supermini | ESP32-C3 Super Mini | ESP32-C3 (RISC-V) | 12비트 | `<sim-board-esp32c3>` |
| esp32-devkit | ESP32 DevKit V1 | ESP32 (Xtensa LX6) | 12비트 | `<sim-board-esp32>` |

---

## 지원 컴포넌트

### 전용 SVG 컴포넌트 (30종)

**수동 소자**
| 태그 | 설명 |
|------|------|
| `<sim-led>` | LED (빨강/초록/파랑/노랑/흰/주황/보라) |
| `<sim-rgb-led>` | RGB LED (공통 양극/음극) |
| `<sim-button>` | 6mm 택트 스위치 |
| `<sim-resistor>` | 저항 (컬러 밴드 자동 계산) |
| `<sim-capacitor>` | 전해 커패시터 |
| `<sim-diode>` | 정류 다이오드 1N4007 |

**반도체 / 드라이버**
| 태그 | 설명 |
|------|------|
| `<sim-transistor-npn>` | NPN 트랜지스터 TO-92 (2N2222) — BASE 핀 setPinState 구현 |
| `<sim-relay>` | 5V 릴레이 모듈 (COM/NO/NC) |

**센서**
| 태그 | 설명 |
|------|------|
| `<sim-dht>` | DHT11 / DHT22 온습도 센서 |
| `<sim-ultrasonic>` | HC-SR04 초음파 거리 센서 |
| `<sim-ir-led>` | IR 발광 다이오드 |
| `<sim-ir-receiver>` | TSOP38238 IR 수신기 |
| `<sim-hall-sensor>` | A3144 홀 효과 센서 (토글 버튼) |
| `<sim-lm35>` | LM35 온도 센서 (10mV/°C) |
| `<sim-pir-sensor>` | HC-SR501 PIR 모션 센서 (토글 버튼) |
| `<sim-sound-sensor>` | KY-037 소리 감지 모듈 |

**액추에이터**
| 태그 | 설명 |
|------|------|
| `<sim-servo>` | SG90 마이크로 서보 (0~180°) |
| `<sim-buzzer>` | 부저 (WebAudio API) |
| `<sim-potentiometer>` | 가변저항 |
| `<sim-dc-motor>` | DC 모터 (±255 속도/방향) |
| `<sim-stepper>` | 28BYJ-48 스텝 모터 |
| `<sim-neopixel>` | WS2812B NeoPixel RGB — LED0~LEDn/SHOW/CLEAR 지원 |

**디스플레이**
| 태그 | 설명 |
|------|------|
| `<sim-seven-segment>` | 7-세그먼트 디스플레이 |
| `<sim-lcd>` | I2C LCD 1602 / 2004 |
| `<sim-oled>` | SSD1306 OLED 128×64 |

**복합 모듈 / IC**
| 태그 | 설명 |
|------|------|
| `<sim-joystick>` | KY-023 아날로그 조이스틱 |
| `<sim-74hc595>` | 74HC595 8비트 시프트 레지스터 |
| `<sim-l298n>` | L298N 듀얼 모터 드라이버 |

**보드**
| 태그 | 설명 |
|------|------|
| `<sim-board-uno>` | Arduino Uno R3 |
| `<sim-board-nano>` | Arduino Nano |
| `<sim-board-esp32c3>` | ESP32-C3 Super Mini |
| `<sim-board-esp32>` | ESP32 DevKit V1 |

### sim-generic 컴포넌트 (15종, 서버 데이터만 정의)

MPU-6050, BMP280, MQ-2, 토양수분, 빗물감지, 로터리인코더, 4×4 키패드, HC-05 블루투스, RFID RC522, TM1637, MAX7219, SD카드 모듈, Arduino Nano(서버), ESP32 DevKit(서버), AMS1117

---

## 템플릿 목록 (server/src/data/templates.ts)

| ID | 이름 | 보드 | 주요 컴포넌트 |
|----|------|------|-------------|
| blink | LED 깜빡이기 | arduino-uno | led |
| button-led | 버튼으로 LED 제어 | arduino-uno | button, led |
| potentiometer-led | 가변저항 밝기 제어 | arduino-uno | potentiometer, led |
| dht22 | 온습도 모니터링 | arduino-uno | dht |
| ultrasonic | 초음파 거리 측정 | arduino-uno | ultrasonic |
| servo-sweep | 서보 모터 스윕 | arduino-uno | servo |
| lcd-hello | LCD Hello World | arduino-uno | lcd |
| neopixel-rainbow | NeoPixel 무지개 | arduino-uno | neopixel |
| pwm-fade | PWM LED 페이드 | arduino-uno | led |
| joystick-read | 조이스틱 값 읽기 | arduino-uno | joystick |
| pir-motion | PIR 모션 감지 | arduino-uno | pir-sensor, led |
| hall-magnet | 홀 센서 자석 감지 | arduino-uno | hall-sensor, led |
| ir-remote | IR 리모컨 수신 | arduino-uno | ir-receiver, led |
| seven-segment-count | 7-세그먼트 카운터 | arduino-uno | seven-segment |
| oled-hello | OLED Hello World | esp32-c3-supermini | oled |
| l298n-motor | L298N 모터 드라이버 | arduino-uno | l298n, dc-motor |
| stepper-motor | 스텝 모터 제어 | arduino-uno | stepper-motor |
| mpu6050-accel | MPU-6050 가속도계 | arduino-uno | mpu6050 |

---

## API 엔드포인트 (server, 포트 3001)

```
GET /api/health
GET /api/boards
GET /api/boards/:id
GET /api/components
GET /api/components/:id
GET /api/components/connections/validate?from=<type>&to=<type>
GET /api/templates[?category=&boardId=]
GET /api/templates/:id
```

응답 필드: `valid` (boolean), `severity`, `message` — 프론트엔드에서 `valid` 로 체크.

---

## 개발 시 주의사항

### 새 센서/액추에이터 추가 체크리스트
1. `packages/elements/src/components/sim-XXX.ts` — Lit Element 구현 (setPinState 포함)
2. `packages/elements/src/index.ts` — customElements.define 등록
3. `server/src/data/components.ts` SEED_COMPONENTS — element 필드에 실제 태그명
4. `sim-worker.ts` SENSOR_DATA_MAP — 센서면 데이터 키 매핑 추가
5. `server/src/data/templates.ts` — 예제 템플릿 추가

### 보드 변경 동작
- 시뮬레이션 실행 중 보드 변경 → `simController.stop()` 자동 호출
- 회로에 컴포넌트 있으면 confirm 후 `clearCircuit()` — **취소 가능**
- 새 보드와 호환 안 되는 와이어 자동 제거 (Undo 가능)

### loadFromJson 검증
- `version` 필드 없으면 `console.warn` (throw 아님)
- `components`, `wires`가 배열 아니면 빈 배열로 대체

### 연결 도출 시스템 (`_buildDerivedConnections`)
3단계 알고리즘으로 동작:
1. **베이스라인**: 컴포넌트 `connections` 필드의 숫자 값 (템플릿 호환 — 와이어 없이도 동작)
2. **와이어 오버라이드**: `PlacedWire`에서 Board→컴포넌트 GPIO 번호 도출 (항상 우선)
3. **Net 해소**: 부품-부품 체인(Board→저항→LED) 에서 GPIO 번호 전파 (최대 20 이터레이션)

**템플릿 호환**:
- `toSnapshotForBoard`: 보드가 1개일 때 wires 없어도 `connections`에 숫자가 있는 컴포넌트 / `i2cAddress` props가 있는 컴포넌트 포함
- `findParentBoardForComp`: 보드가 1개일 때 wires 없어도 직접 GPIO/i2cAddress 연결된 컴포넌트의 부모 보드 반환

### 글로벌 노출 (테스트/디버깅용)
```typescript
window.__circuitStore  // circuitStore 인스턴스 (app.ts 에서 노출)
window.__monacoEditor  // Monaco 에디터 인스턴스 (code-editor.ts 에서 노출)
```

### Lit Element 속성 접근
Lit `@property()` 는 기본적으로 `reflect: false` → `getAttribute()` 로 읽을 수 없음.
```javascript
el.angle        // ✅ JS property 직접 접근
el.getAttribute('angle')  // ❌ null 반환
```

---

## E2E 테스트

Playwright 기반 헤드리스 브라우저 테스트. 실서버(`http://localhost:5173`)가 기동된 상태에서 실행.

```bash
# 의존성 (최초 1회)
pnpm add -Dw playwright
pnpm exec playwright install chromium

# 실행 (서버 기동 후)
node test-e2e.mjs
```

**테스트 파일**: `test-e2e.mjs` — 26개 섹션, 76개 assertion, 100% 통과

**주요 헬퍼**:
- `waitForStore(page)` — `window.__circuitStore` 노출 대기
- `loadTemplate(page, template)` — `loadFromJson` 으로 회로 로드
- `clickStop(page)` — 정지 버튼이 보일 때만 클릭

**주의사항**:
- 탭 버튼은 ID가 없음 → `.right-tab-btn[data-tab="serial"]` 셀렉터 사용
- 탭 클릭은 `page.evaluate(() => btn.click())` 방식 사용 (Playwright locator 문제 회피)
- `releasePointerCapture` 콘솔 에러는 무시 (합성 pointer 이벤트 부작용)

---

## Git 커밋 규칙

작업마다 즉시 커밋합니다.

```
형식: <타입>(<범위>): <설명>
타입: feat / fix / refactor / docs / chore
범위: elements / engine / app / server / canvas / editor / ui / api

예시:
  feat(elements): sim-servo Web Component 추가
  fix(engine): for 루프 변수 선언 트랜스파일 수정
  refactor(canvas): wire-renderer 모듈 분리
  refactor(api): API_BASE 하드코딩 제거
```
