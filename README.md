# Arduino 개발 저장소

ESP32-C3 Super Mini 보드 기반 개발 문서, 예제, 구현 프로젝트, 웹 시뮬레이터 통합 저장소입니다.

---

## 보드 소개 — ESP32-C3 Super Mini

| 항목 | 사양 |
|------|------|
| 칩 | ESP32-C3FN4 (32비트 RISC-V) |
| 클럭 | 최대 160 MHz |
| RAM | 400 KB SRAM |
| 플래시 | 4 MB 내장 |
| Wi-Fi | 802.11 b/g/n (2.4GHz) |
| Bluetooth | BLE 5.0 |
| USB | USB-C (내장 USB Serial) |
| 크기 | 약 22.5 × 18mm |

---

## 디렉토리 구조

```
Arduino/
├── docs/                          # 개발 문서
│   ├── index.md                   # 전체 목차
│   ├── cpp/                       # C/C++ 언어 문법 (10개 가이드)
│   ├── arduino/                   # 아두이노 공통 기초 (8개 가이드)
│   ├── guidelines/                # 개발 가이드라인 (6개 규칙)
│   └── esp32/c3/supermini/        # ESP32-C3 Super Mini 전용 (12개 가이드)
├── projects/
│   ├── esp32/c3/supermini/test/   # 기능별 구현 프로젝트 (162개)
│   ├── web-simulator/             # Arduino 웹 시뮬레이터 (pnpm monorepo)
│   └── _web-simulator-archive/    # 구버전 단일 HTML 시뮬레이터 보관
├── SKILLS.md                      # 기술 스택 및 구현 현황
├── CLAUDE.md                      # AI 개발 보조 설정
└── README.md                      # 이 파일
```

---

## 문서 목록

### C/C++ 문법 → `docs/cpp/`
C/C++를 처음 접하는 사람을 위한 기초 문법 가이드

| 파일 | 내용 |
|------|------|
| 01_variables.md | 변수, 자료형, const, static |
| 02_operators.md | 산술, 비교, 논리, 비트 연산자 |
| 03_conditions.md | if/else, switch/case |
| 04_loops.md | for, while, do-while |
| 05_functions.md | 함수 정의, 매개변수, 프로토타입 |
| 06_arrays.md | 배열, 문자열 |
| 07_pointers.md | 포인터, 참조 |
| 08_struct_class.md | 구조체, 클래스 |
| 09_preprocessor.md | #define, 조건부 컴파일 |
| 10_memory.md | SRAM 구조, volatile, 메모리 절약 |

### 아두이노 공통 → `docs/arduino/`
보드 무관하게 적용되는 아두이노 개발 기초

| 파일 | 내용 |
|------|------|
| 01_ide_setup.md | Arduino IDE 설치 및 설정 |
| 02_structure.md | setup()/loop() 구조 |
| 03_gpio.md | pinMode, digitalWrite, digitalRead |
| 04_analog_pwm.md | analogRead, PWM 개념 |
| 05_serial_i2c_spi.md | UART / I2C / SPI 기초 |
| 06_timing.md | millis(), micros(), 논블로킹 |
| 07_libraries.md | 라이브러리 설치 및 활용 |
| 08_patterns.md | 논블로킹, 상태머신 등 실전 패턴 9가지 |

### 개발 가이드라인 → `docs/guidelines/`
코딩 규칙 및 프로젝트 구성 기준

| 파일 | 내용 |
|------|------|
| 01_comments.md | 주석 작성 규칙 (한국어, 하드웨어 필수 정보) |
| 02_code_style.md | 네이밍 컨벤션 (camelCase, UPPER_SNAKE) |
| 03_code_quality.md | 매직 넘버 금지, millis() 우선, secrets.h |
| 04_verification.md | 단계별 테스트, 시리얼 디버그 매크로 |
| 05_principles.md | 단순함, 논블로킹, 실패 가정 등 8원칙 |
| 06_project_structure.md | 폴더명, config.h, README 형식 |

### ESP32-C3 전용 → `docs/esp32/c3/supermini/`
Wi-Fi, BLE, PWM, 딥슬립, OTA, MQTT 등 ESP32-C3 기능 구현 가이드

| 파일 | 내용 |
|------|------|
| 01_spec.md | 스펙 비교, 핀맵, GPIO 기능 요약 |
| 02_setup.md | Arduino IDE 보드 패키지 및 설정 |
| 03_gpio.md | INPUT_PULLDOWN, 내장 LED, 인터럽트 |
| 04_analog_pwm.md | 12비트 ADC, ledcWrite() PWM |
| 05_communication.md | UART / I2C / SPI 핀 번호 |
| 06_wifi.md | STA / AP / 웹서버 / HTTP |
| 07_bluetooth.md | BLE 서버, Service/Characteristic |
| 08_storage.md | Preferences (NVS) |
| 09_deepsleep.md | 딥슬립, 타이머·GPIO 웨이크업 |
| 10_ota_mqtt.md | OTA 무선 업로드, MQTT |
| 11_troubleshooting.md | 업로드/시리얼/Wi-Fi 문제 해결 |
| 12_features.md | 부품 카테고리별 쇼핑 가이드 |

---

## 구현 프로젝트 — `projects/esp32/c3/supermini/test/`

162개 기능을 카테고리별 독립 프로젝트로 구현 (전체 완료)

| 카테고리 | 수 | 폴더 |
|---------|-----|------|
| GPIO | 11 | `gpio/` |
| ADC | 9 | `adc/` |
| PWM | 10 | `pwm/` |
| 타이밍 | 5 | `timing/` |
| UART | 5 | `uart/` |
| I2C | 10 | `i2c/` |
| SPI | 5 | `spi/` |
| 1-Wire | 2 | `onewire/` |
| 센서 | 10 | `sensor/` |
| RGB LED | 5 | `led/` |
| Wi-Fi | 19 | `wifi/` |
| BLE | 9 | `ble/` |
| MQTT | 8 | `mqtt/` |
| 파일시스템 | 6 | `storage/` |
| 저전력 | 7 | `power/` |
| OTA | 4 | `ota/` |
| 시스템 | 9 | `system/` |
| FreeRTOS | 6 | `rtos/` |
| JSON | 4 | `json/` |
| 스텝 모터 | 3 | `motor/` |
| 복합 프로젝트 | 10 | `combo/` |

전체 목록: [`FEATURES.md`](projects/esp32/c3/supermini/test/FEATURES.md)

---

## 웹 시뮬레이터 — `projects/web-simulator/`

Wokwi / TinkerCAD 수준의 Arduino 웹 시뮬레이터. 브라우저에서 회로를 구성하고 Arduino C++ 코드를 실행합니다.

### 기능
- 무한 캔버스 — 부품 드래그&드롭, 핀치 줌, 패닝
- 와이어 라우팅 — 곡선(Bezier) / 직선 / 직각(Orthogonal), 경유점 드래그
- 핀 객체화 — 우클릭 시 GPIO 번호·연결 상태·핀 타입 표시
- Arduino C++ 시뮬레이션 — Web Worker에서 실행 (UI 블로킹 없음)
- 시리얼 모니터 — Serial.println() 출력 실시간 표시
- 지원 부품 — 전용 SVG 30종 (LED·버튼·저항·커패시터·다이오드·트랜지스터·릴레이·DHT·초음파·IR·홀·LM35·PIR·소리·서보·DC모터·스텝모터·NeoPixel·LCD·OLED·7세그·조이스틱·74HC595·L298N 등) + sim-generic 15종
- 지원 보드 — Arduino Uno R3, Arduino Nano, ESP32-C3 Super Mini, ESP32 DevKit V1 (각 전용 Web Component)
- Undo/Redo (Ctrl+Z/Y), 회로 저장/불러오기 (JSON)

### 기술 스택
| 레이어 | 기술 |
|--------|------|
| UI | Vite 5 + TypeScript |
| 컴포넌트 | Lit 3 (Web Components) |
| 시뮬레이션 | Web Worker + Custom C++→JS Transpiler |
| 서버 | Express 4 + TypeScript |
| 패키지 관리 | pnpm monorepo |

### 실행 방법
```bash
cd projects/web-simulator
pnpm install
pnpm dev        # 프론트엔드(5173) + 백엔드(3001) 동시 실행
```

자세한 내용: [`projects/web-simulator/CLAUDE.md`](projects/web-simulator/CLAUDE.md)

---

## 개발 환경

- **IDE**: Arduino IDE 2.x
- **보드 패키지**: Espressif ESP32 (arduino-esp32)
- **언어**: C/C++ (Arduino Framework)
- **보드 설정**: `ESP32C3 Dev Module`, USB CDC On Boot: Enabled

---

## 라이선스

MIT License
