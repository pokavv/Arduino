# 아두이노 개발 가이드 — 전체 목차

---

## 디렉토리 구조

```
docs/
├── cpp/        C/C++ 언어 문법
├── arduino/    아두이노 공통 기초 (보드 무관)
└── esp32c3/    ESP32-C3 Super Mini 전용
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

## esp32c3/ — ESP32-C3 Super Mini

→ [esp32c3/index.md](esp32c3/index.md)

| 파일 | 내용 |
|------|------|
| [01_spec.md](esp32c3/01_spec.md) | 스펙, 핀맵 |
| [02_setup.md](esp32c3/02_setup.md) | IDE 설정 |
| [03_gpio.md](esp32c3/03_gpio.md) | GPIO 전용 (INPUT_PULLDOWN, 인터럽트) |
| [04_analog_pwm.md](esp32c3/04_analog_pwm.md) | 12비트 ADC, ledcWrite |
| [05_communication.md](esp32c3/05_communication.md) | UART/I2C/SPI + 핀 번호 |
| [06_wifi.md](esp32c3/06_wifi.md) | Wi-Fi, HTTP, 웹서버 |
| [07_bluetooth.md](esp32c3/07_bluetooth.md) | BLE 5.0 |
| [08_storage.md](esp32c3/08_storage.md) | NVS 플래시 저장 |
| [09_deepsleep.md](esp32c3/09_deepsleep.md) | 딥슬립, 저전력 |
| [10_ota_mqtt.md](esp32c3/10_ota_mqtt.md) | OTA, MQTT |
| [11_troubleshooting.md](esp32c3/11_troubleshooting.md) | 문제 해결 |
