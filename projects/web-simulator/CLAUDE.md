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
| `<sim-transistor-npn>` | NPN 트랜지스터 TO-92 (2N2222) |
| `<sim-relay>` | 5V 릴레이 모듈 (COM/NO/NC) |

**센서**
| 태그 | 설명 |
|------|------|
| `<sim-dht>` | DHT11 / DHT22 온습도 센서 |
| `<sim-ultrasonic>` | HC-SR04 초음파 거리 센서 |
| `<sim-ir-led>` | IR 발광 다이오드 |
| `<sim-ir-receiver>` | TSOP38238 IR 수신기 |
| `<sim-hall-sensor>` | A3144 홀 효과 센서 |
| `<sim-lm35>` | LM35 온도 센서 (10mV/°C) |
| `<sim-pir-sensor>` | HC-SR501 PIR 모션 센서 |
| `<sim-sound-sensor>` | KY-037 소리 감지 모듈 |

**액추에이터**
| 태그 | 설명 |
|------|------|
| `<sim-servo>` | SG90 마이크로 서보 (0~180°) |
| `<sim-buzzer>` | 부저 (WebAudio API) |
| `<sim-potentiometer>` | 가변저항 |
| `<sim-dc-motor>` | DC 모터 (±255 속도/방향) |
| `<sim-stepper>` | 28BYJ-48 스텝 모터 |
| `<sim-neopixel>` | WS2812B NeoPixel RGB |

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
