# 기술 스택 및 구현 스킬

ESP32-C3 Super Mini로 구현 가능한 기술과 현재 습득 상태를 정리합니다.

---

## 하드웨어

### 보드
| 보드 | 상태 |
|------|------|
| ESP32-C3 Super Mini | 사용 중 |
| Arduino Uno R3 | 웹 시뮬레이터 지원 |
| Arduino Nano | 웹 시뮬레이터 지원 |
| ESP32 DevKit V1 | 웹 시뮬레이터 지원 |

### 연결 가능 부품
| 부품 | 인터페이스 | 관련 문서 |
|------|------------|----------|
| LED (단색) | GPIO | [arduino/03_gpio.md](docs/arduino/03_gpio.md) |
| LED (RGB, WS2812) | GPIO (FastLED) | |
| 버튼 / 스위치 | GPIO | [arduino/03_gpio.md](docs/arduino/03_gpio.md) |
| 가변저항 | ADC | [esp32/c3/supermini/04_analog_pwm.md](docs/esp32/c3/supermini/04_analog_pwm.md) |
| 서보모터 | PWM | [arduino/04_analog_pwm.md](docs/arduino/04_analog_pwm.md) |
| DC 모터 (L298N) | PWM + GPIO | |
| 부저 | GPIO / PWM | |
| OLED (SSD1306) | I2C | [esp32/c3/supermini/05_communication.md](docs/esp32/c3/supermini/05_communication.md) |
| TFT LCD (ST7789) | SPI | |
| DHT11 / DHT22 | GPIO (1-Wire) | |
| BME280 | I2C / SPI | [esp32/c3/supermini/05_communication.md](docs/esp32/c3/supermini/05_communication.md) |
| DS18B20 | 1-Wire | |
| MPU6050 (가속도) | I2C | |
| HC-SR04 (초음파) | GPIO | |
| SD 카드 모듈 | SPI | |
| 릴레이 모듈 | GPIO | |

---

## 소프트웨어 / 기능

### 언어 & 프레임워크
| 항목 | 상태 |
|------|------|
| C/C++ (Arduino Framework) | 학습 중 ([docs/cpp/](docs/cpp/index.md)) |
| Arduino IDE 2.x | 사용 중 |
| TypeScript | 웹 시뮬레이터 |
| Lit 3 (Web Components) | 웹 시뮬레이터 |
| Vite 5 | 웹 시뮬레이터 |
| Express 4 | 웹 시뮬레이터 서버 |

### 통신
| 기능 | 상태 | 문서 |
|------|------|------|
| Wi-Fi STA 모드 | 구현 | [esp32/c3/supermini/06_wifi.md](docs/esp32/c3/supermini/06_wifi.md) |
| Wi-Fi AP 모드 | 구현 | [esp32/c3/supermini/06_wifi.md](docs/esp32/c3/supermini/06_wifi.md) |
| HTTP GET/POST | 구현 | [esp32/c3/supermini/06_wifi.md](docs/esp32/c3/supermini/06_wifi.md) |
| 웹서버 (WebServer) | 구현 | test/wifi/ |
| BLE 서버 | 구현 | [esp32/c3/supermini/07_bluetooth.md](docs/esp32/c3/supermini/07_bluetooth.md) |
| MQTT | 구현 | [esp32/c3/supermini/10_ota_mqtt.md](docs/esp32/c3/supermini/10_ota_mqtt.md) |
| I2C | 구현 | [esp32/c3/supermini/05_communication.md](docs/esp32/c3/supermini/05_communication.md) |
| SPI | 구현 | [esp32/c3/supermini/05_communication.md](docs/esp32/c3/supermini/05_communication.md) |
| UART | 구현 | [esp32/c3/supermini/05_communication.md](docs/esp32/c3/supermini/05_communication.md) |
| OTA 업데이트 | 구현 | [esp32/c3/supermini/10_ota_mqtt.md](docs/esp32/c3/supermini/10_ota_mqtt.md) |

### 시스템
| 기능 | 상태 | 위치 |
|------|------|------|
| GPIO 제어 | 구현 | test/gpio/ (11개) |
| ADC (12비트) | 구현 | test/adc/ (9개) |
| PWM (ledcWrite) | 구현 | test/pwm/ (10개) |
| 타이밍 (millis) | 구현 | test/timing/ (5개) |
| 인터럽트 | 구현 | test/gpio/06~08 |
| I2C 부품 | 구현 | test/i2c/ (10개) |
| SPI 부품 | 구현 | test/spi/ (5개) |
| 1-Wire (DS18B20) | 구현 | test/onewire/ (2개) |
| 각종 센서 | 구현 | test/sensor/ (10개) |
| RGB LED / NeoPixel | 구현 | test/led/ (5개) |
| FreeRTOS | 구현 | test/rtos/ (6개) |
| JSON (ArduinoJson) | 구현 | test/json/ (4개) |
| 스텝 모터 | 구현 | test/motor/ (3개) |
| 딥슬립 (타이머) | 구현 | test/power/01-deepsleep-timer |
| 딥슬립 (GPIO 웨이크업) | 구현 | test/power/02-deepsleep-gpio |
| 딥슬립 (웨이크업 원인) | 구현 | test/power/03-deepsleep-wakeup-reason |
| 딥슬립 + NVS 데이터 보존 | 구현 | test/power/04-deepsleep-nvs |
| 라이트슬립 | 구현 | test/power/05-lightsleep |
| 모뎀 슬립 (Wi-Fi 절전) | 구현 | test/power/06-modem-sleep |
| 배터리 센서 노드 (딥슬립+MQTT) | 구현 | test/power/07-battery-sensor-node |
| NVS 플래시 저장 (Preferences) | 구현 | test/storage/01-nvs-preferences |
| NVS 설정 저장·복원 | 구현 | test/storage/02-nvs-config-restore |
| SPIFFS 파일 읽기/쓰기 | 구현 | test/storage/03-spiffs-rw |
| SPIFFS 웹서버 파일 서빙 | 구현 | test/storage/04-spiffs-web-serve |
| LittleFS 파일 읽기/쓰기 | 구현 | test/storage/05-littlefs-rw |
| LittleFS 데이터 로거 (CSV) | 구현 | test/storage/06-littlefs-logger |
| OTA (ArduinoOTA 기본) | 구현 | test/ota/01-arduino-ota-basic |
| OTA (ArduinoOTA 비밀번호) | 구현 | test/ota/02-arduino-ota-password |
| OTA (HTTP Pull OTA) | 구현 | test/ota/03-http-ota |
| OTA + 딥슬립 대기창 | 구현 | test/ota/04-ota-with-deepsleep |
| 복합 프로젝트 | 구현 | test/combo/ (10개) |

---

## 웹 시뮬레이터 (`projects/web-simulator/`)

Wokwi / TinkerCAD 수준의 Arduino 웹 시뮬레이터

| 기능 | 상태 |
|------|------|
| 무한 캔버스 (줌/패닝) | 구현 |
| 부품 드래그&드롭 | 구현 |
| 와이어 연결 (핀→핀) | 구현 |
| 와이어 라우팅 커스텀 (Bezier/직선/직각) | 구현 |
| 와이어 경유점(waypoint) 드래그 | 구현 |
| 핀 객체화 (우클릭 → 속성 표시) | 구현 |
| z-index 3단 레이어 (와이어<부품<핀 점) | 구현 |
| Arduino C++ → JS 트랜스파일러 | 구현 |
| Web Worker 시뮬레이션 | 구현 |
| 시리얼 모니터 | 구현 |
| Monaco 코드 에디터 | 구현 |
| 속성 패널 (부품/와이어/핀) | 구현 |
| 회로 유효성 검사 | 구현 |
| Undo/Redo (Ctrl+Z/Y) | 구현 |
| 회로 저장/불러오기 (JSON) | 구현 |
| 예제 템플릿 | 구현 |
| 부품 팔레트 (서버 API 연동) | 구현 |
| 전용 SVG 부품 30종 | 구현 |
| sim-generic 부품 15종 (서버 데이터) | 구현 |
| 지원 보드 4종 (각 전용 Element) | 구현 |

---

## 유용한 라이브러리

| 라이브러리 | 용도 |
|-----------|------|
| `Adafruit SSD1306` | OLED 디스플레이 |
| `Adafruit GFX` | 그래픽 기반 |
| `Adafruit BME280` | 온도/습도/기압 |
| `DHT sensor library` | DHT11/22 |
| `PubSubClient` | MQTT |
| `ArduinoJson` | JSON 파싱/생성 |
| `FastLED` | RGB LED 스트립 |
| `ESPAsyncWebServer` | 비동기 웹서버 |
| `ArduinoOTA` | OTA 업데이트 |
