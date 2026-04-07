# 기술 스택 및 구현 스킬

ESP32-C3 Super Mini로 구현 가능한 기술과 현재 습득 상태를 정리합니다.

---

## 하드웨어

### 보드
| 보드 | 상태 |
|------|------|
| ESP32-C3 Super Mini | 사용 중 |

### 연결 가능 부품
| 부품 | 인터페이스 | 관련 문서 |
|------|------------|----------|
| LED (단색) | GPIO | [arduino/03_gpio.md](docs/arduino/03_gpio.md) |
| LED (RGB, WS2812) | GPIO (FastLED) | |
| 버튼 / 스위치 | GPIO | [arduino/03_gpio.md](docs/arduino/03_gpio.md) |
| 가변저항 | ADC | [esp32c3/04_analog_pwm.md](docs/esp32c3/04_analog_pwm.md) |
| 서보모터 | PWM | [arduino/04_analog_pwm.md](docs/arduino/04_analog_pwm.md) |
| DC 모터 (L298N) | PWM + GPIO | |
| 부저 | GPIO / PWM | |
| OLED (SSD1306) | I2C | [esp32c3/05_communication.md](docs/esp32c3/05_communication.md) |
| TFT LCD (ST7789) | SPI | |
| DHT11 / DHT22 | GPIO (1-Wire) | |
| BME280 | I2C / SPI | [esp32c3/05_communication.md](docs/esp32c3/05_communication.md) |
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

### 통신
| 기능 | 상태 | 문서 |
|------|------|------|
| Wi-Fi STA 모드 | 구현 | [esp32c3/06_wifi.md](docs/esp32c3/06_wifi.md) |
| Wi-Fi AP 모드 | 문서화 | [esp32c3/06_wifi.md](docs/esp32c3/06_wifi.md) |
| HTTP GET/POST | 문서화 | [esp32c3/06_wifi.md](docs/esp32c3/06_wifi.md) |
| 웹서버 (WebServer) | 구현 | [projects/wifi-led-control](projects/) |
| BLE 서버 | 문서화 | [esp32c3/07_bluetooth.md](docs/esp32c3/07_bluetooth.md) |
| MQTT | 문서화 | [esp32c3/10_ota_mqtt.md](docs/esp32c3/10_ota_mqtt.md) |
| I2C | 문서화 | [esp32c3/05_communication.md](docs/esp32c3/05_communication.md) |
| SPI | 문서화 | [esp32c3/05_communication.md](docs/esp32c3/05_communication.md) |
| UART | 문서화 | [esp32c3/05_communication.md](docs/esp32c3/05_communication.md) |
| OTA 업데이트 | 문서화 | [esp32c3/10_ota_mqtt.md](docs/esp32c3/10_ota_mqtt.md) |

### 시스템
| 기능 | 상태 | 문서 |
|------|------|------|
| GPIO 제어 | 구현 | [esp32c3/03_gpio.md](docs/esp32c3/03_gpio.md) |
| ADC (12비트) | 문서화 | [esp32c3/04_analog_pwm.md](docs/esp32c3/04_analog_pwm.md) |
| PWM (ledcWrite) | 문서화 | [esp32c3/04_analog_pwm.md](docs/esp32c3/04_analog_pwm.md) |
| 인터럽트 | 문서화 | [esp32c3/03_gpio.md](docs/esp32c3/03_gpio.md) |
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
| millis 논블로킹 | 문서화 | [arduino/06_timing.md](docs/arduino/06_timing.md) |

---

## 구현 예정 프로젝트

| 프로젝트 | 사용 기능 | 상태 |
|---------|---------|------|
| Wi-Fi LED 웹 제어 | Wi-Fi, 웹서버, GPIO | 구현 완료 |
| 온습도 모니터 (OLED) | I2C, DHT22/BME280, OLED | 예정 |
| BLE 스마트폰 제어 | BLE | 예정 |
| MQTT 센서 노드 | Wi-Fi, MQTT, 딥슬립 | 구현 완료 (power/07) |
| OTA 업데이트 기본 | Wi-Fi, OTA | 구현 완료 (ota/01~04) |
| RGB LED 컨트롤러 | PWM, FastLED | 예정 |
| 서보 웹 제어 | Wi-Fi, 웹서버, PWM | 예정 |

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
