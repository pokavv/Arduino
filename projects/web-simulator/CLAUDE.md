# CLAUDE.md — Arduino Web Simulator (v2)

Wokwi / TinkerCAD Circuits / Proteus 수준의 Arduino 웹 시뮬레이터.
**pnpm monorepo** 구조로 전면 재설계됨.

---

## 실행 방법

```bash
# 의존성 설치
pnpm install

# 백엔드 서버 (포트 3001)
pnpm --filter server dev

# 프론트엔드 앱 (포트 5173)
pnpm --filter @sim/app dev

# 동시 실행
pnpm dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 디렉토리 구조

```
web-simulator/
├── pnpm-workspace.yaml        # monorepo 설정
├── package.json               # 루트 (스크립트만)
├── tsconfig.base.json         # 공통 TypeScript 설정
├── packages/
│   ├── elements/              # @sim/elements — Lit Web Components
│   │   └── src/
│   │       ├── components/    # sim-led, sim-button, sim-board-uno, ...
│   │       ├── utils/         # pin-match 등 유틸
│   │       └── index.ts       # 패키지 진입점
│   ├── sim-engine/            # @sim/engine — 시뮬레이션 엔진
│   │   └── src/
│   │       ├── runtime/       # transpiler, scheduler, gpio, preamble
│   │       ├── libraries/     # Wire, SPI, ...
│   │       ├── worker/        # Web Worker 진입점
│   │       └── index.ts
│   └── app/                   # @sim/app — 프론트엔드 SPA (Vite)
│       ├── index.html
│       └── src/
│           ├── canvas/        # CircuitCanvas (무한 캔버스)
│           ├── editor/        # CodeEditor (Monaco)
│           ├── panels/        # 프로퍼티 패널 등
│           ├── stores/        # CircuitStore, SimController
│           ├── worker/        # sim-worker-entry.ts
│           └── app.ts         # 메인 진입점
└── server/                    # Express REST API
    └── src/
        ├── data/              # boards.ts, templates.ts
        ├── routes/            # boards.ts, templates.ts
        └── index.ts
```

---

## 핵심 아키텍처

### 컴포넌트 시스템 (@sim/elements)
- 각 부품은 `<sim-led>`, `<sim-button>` 등 **Lit Custom Element**
- `SimElement` 베이스 클래스 상속
- `setPinState(pin, value)` — 엔진 → 컴포넌트 업데이트
- `connections: Map<pin, gpio>` — 핀 연결 상태

### 시뮬레이션 엔진 (@sim/engine)
- **Web Worker**에서 실행 (UI 블로킹 없음)
- `ArduinoTranspiler` — C++ → async JavaScript
- `GpioController` — digitalWrite/Read/analogWrite/Read
- `SimScheduler` — millis/micros/delay

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
```

### 핀 번호 매칭
`packages/elements/src/utils/pin-match.ts`의 `pinMatch()` 사용
- `'G9' === 9`, `'D9' === 9`, `9 === 9` 모두 매칭
- ESP32(G 접두사), Arduino Uno(D 접두사), 숫자 모두 지원

---

## 지원 보드

| ID | 이름 | MCU | ADC |
|----|------|-----|-----|
| arduino-uno | Arduino Uno R3 | ATmega328P | 10비트 |
| arduino-nano | Arduino Nano | ATmega328P | 10비트 |
| esp32-c3-supermini | ESP32-C3 Super Mini | ESP32-C3 | 12비트 |
| esp32-devkit | ESP32 DevKit V1 | ESP32 | 12비트 |

---

## 지원 컴포넌트

| 태그 | 설명 |
|------|------|
| `<sim-led>` | LED (빨강/초록/파랑/노랑/흰/주황/보라) |
| `<sim-rgb-led>` | RGB LED |
| `<sim-button>` | 푸시 버튼 |
| `<sim-resistor>` | 저항 (컬러 밴드 자동 계산) |
| `<sim-buzzer>` | 부저 (WebAudio API) |
| `<sim-potentiometer>` | 가변저항 |
| `<sim-seven-segment>` | 7-세그먼트 |
| `<sim-lcd>` | I2C LCD 1602/2004 |
| `<sim-oled>` | SSD1306 OLED 128x64 |
| `<sim-dht>` | DHT11/DHT22 |
| `<sim-ultrasonic>` | HC-SR04 |
| `<sim-servo>` | SG90 서보 |
| `<sim-neopixel>` | WS2812B NeoPixel |
| `<sim-board-uno>` | Arduino Uno R3 보드 |
| `<sim-board-esp32c3>` | ESP32-C3 Super Mini 보드 |

---

## API 엔드포인트 (server, 포트 3001)

```
GET /api/health
GET /api/boards
GET /api/boards/:id
GET /api/templates[?category=&boardId=]
GET /api/templates/:id
```

---

## Git 커밋 규칙

작업마다 즉시 커밋합니다.

```
형식: <타입>(<범위>): <설명>
타입: feat / fix / refactor / docs / chore
범위: elements / engine / app / server / canvas / editor

예시:
  feat(elements): sim-servo Web Component 추가
  fix(engine): for 루프 변수 선언 트랜스파일 수정
  refactor(app): CircuitCanvas pan/zoom 개선
```
