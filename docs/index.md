# 아두이노 개발 가이드 — 전체 목차

---

## 디렉토리 구조

```
docs/
├── cpp/                   C/C++ 언어 문법
├── arduino/               아두이노 공통 기초 (보드 무관)
├── guidelines/            개발 가이드라인
└── esp32/
    └── c3/
        └── supermini/     ESP32-C3 Super Mini 전용
```

---

## cpp/ — C/C++ 문법

→ [cpp/index.md](cpp/index.md)

| 파일 | 내용 |
|------|------|
| [01_variables.md](cpp/01_variables.md) | 변수, 자료형, 상수, 스코프 |
| [02_operators.md](cpp/02_operators.md) | 산술/비교/논리/비트 연산자 |
| [03_conditions.md](cpp/03_conditions.md) | if/else, switch/case |
| [04_loops.md](cpp/04_loops.md) | for, while, break/continue |
| [05_functions.md](cpp/05_functions.md) | 함수, 반환값, 기본값 매개변수 |
| [06_arrays.md](cpp/06_arrays.md) | 배열, String, char[] |
| [07_pointers.md](cpp/07_pointers.md) | 포인터, 참조 |
| [08_struct_class.md](cpp/08_struct_class.md) | 구조체, 클래스 |
| [09_preprocessor.md](cpp/09_preprocessor.md) | #define, #include, #ifdef |
| [10_memory.md](cpp/10_memory.md) | 메모리 구조, volatile |

---

## arduino/ — 아두이노 공통 기초

→ [arduino/index.md](arduino/index.md)

| 파일 | 내용 |
|------|------|
| [01_ide_setup.md](arduino/01_ide_setup.md) | IDE 설치, 라이브러리 관리 |
| [02_structure.md](arduino/02_structure.md) | setup/loop, 내장 함수 |
| [03_gpio.md](arduino/03_gpio.md) | 디지털 입출력, 버튼/LED |
| [04_analog_pwm.md](arduino/04_analog_pwm.md) | ADC, PWM |
| [05_serial_i2c_spi.md](arduino/05_serial_i2c_spi.md) | 시리얼/I2C/SPI 개념 |
| [06_timing.md](arduino/06_timing.md) | delay vs millis |
| [07_libraries.md](arduino/07_libraries.md) | 라이브러리 목록 및 사용법 |
| [08_patterns.md](arduino/08_patterns.md) | 실전 패턴 9가지 |

---

## guidelines/ — 개발 가이드라인

→ [guidelines/index.md](guidelines/index.md)

| 파일 | 내용 |
|------|------|
| [01_comments.md](guidelines/01_comments.md) | 주석 작성법 |
| [02_code_style.md](guidelines/02_code_style.md) | 네이밍, 파일 구조, 들여쓰기 |
| [03_code_quality.md](guidelines/03_code_quality.md) | 함수 설계, 에러 처리, 메모리 |
| [04_verification.md](guidelines/04_verification.md) | 검증 체크리스트, 디버깅 |
| [05_principles.md](guidelines/05_principles.md) | 구현 8원칙 |
| [06_project_structure.md](guidelines/06_project_structure.md) | 폴더/파일 명명, config.h, secrets.h |

---

## esp32/c3/supermini/ — ESP32-C3 Super Mini

→ [../projects/esp32/c3/supermini/docs/index.md](../projects/esp32/c3/supermini/docs/index.md)

| 파일 | 내용 |
|------|------|
| [01_spec.md](../projects/esp32/c3/supermini/docs/01_spec.md) | 스펙, 핀맵 |
| [02_setup.md](../projects/esp32/c3/supermini/docs/02_setup.md) | IDE 설정 |
| [03_gpio.md](../projects/esp32/c3/supermini/docs/03_gpio.md) | GPIO 전용 (INPUT_PULLDOWN, 인터럽트) |
| [04_analog_pwm.md](../projects/esp32/c3/supermini/docs/04_analog_pwm.md) | 12비트 ADC, ledcWrite |
| [05_communication.md](../projects/esp32/c3/supermini/docs/05_communication.md) | UART/I2C/SPI + 핀 번호 |
| [06_wifi.md](../projects/esp32/c3/supermini/docs/06_wifi.md) | Wi-Fi, HTTP, 웹서버 |
| [07_bluetooth.md](../projects/esp32/c3/supermini/docs/07_bluetooth.md) | BLE 5.0 |
| [08_storage.md](../projects/esp32/c3/supermini/docs/08_storage.md) | NVS 플래시 저장 |
| [09_deepsleep.md](../projects/esp32/c3/supermini/docs/09_deepsleep.md) | 딥슬립, 저전력 |
| [10_ota_mqtt.md](../projects/esp32/c3/supermini/docs/10_ota_mqtt.md) | OTA, MQTT |
| [11_troubleshooting.md](../projects/esp32/c3/supermini/docs/11_troubleshooting.md) | 문제 해결 |
| [12_features.md](../projects/esp32/c3/supermini/docs/12_features.md) | 부품 카테고리별 쇼핑 가이드 |

---

## components/ — 부품 레퍼런스

→ [components/index.md](components/index.md)

총 49종 부품을 카테고리별로 정리. 데이터시트 기준 스펙, 핀 구성, 연결 방법, 주의사항 포함.

| 카테고리 | 수 | 내용 |
|---------|-----|------|
| [passive/](components/passive/) | 6 | 저항, 커패시터, 인덕터, 다이오드, 제너 다이오드, 크리스탈 |
| [active/](components/active/) | 9 | LED, RGB LED, NeoPixel, 7-세그먼트, LCD, OLED, 트랜지스터 NPN/PNP, MOSFET |
| [sensors/](components/sensors/) | 11 | DHT, DS18B20, LM35, HC-SR04, PIR, BME280, MPU6050, 광/수분/소리/IR 센서 |
| [actuators/](components/actuators/) | 6 | 서보, DC모터, 스텝모터, 능동/수동 부저, 릴레이 |
| [drivers/](components/drivers/) | 5 | L298N, ULN2003, 74HC595, PCF8574, TM1637 |
| [power/](components/power/) | 4 | AMS1117, LM7805, 벅컨버터, 배터리 |
| [connectivity/](components/connectivity/) | 3 | 점퍼와이어, 브레드보드, 핀헤더 |
| [modules/](components/modules/) | 5 | HC-05, HC-06, nRF24L01, SD카드, DS3231 RTC |

---

## 웹 시뮬레이터 — `projects/web-simulator/`

→ [../projects/web-simulator/CLAUDE.md](../projects/web-simulator/CLAUDE.md)

Wokwi / TinkerCAD 수준의 Arduino 웹 시뮬레이터 (pnpm monorepo)

| 패키지 | 내용 |
|--------|------|
| `packages/elements` | Lit 3 Web Components (sim-led, sim-button 등 14종) |
| `packages/sim-engine` | Web Worker 기반 Arduino C++ 시뮬레이션 엔진 |
| `packages/app` | Vite 5 SPA (무한 캔버스, Monaco 에디터, 속성 패널) |
| `server` | Express 4 REST API (부품 정의, 보드, 템플릿) |
