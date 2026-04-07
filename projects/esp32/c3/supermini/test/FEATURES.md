# ESP32-C3 Super Mini — 구현 가능 기능 전체 목록

각 기능은 독립적인 테스트 프로젝트로 구현합니다.
구현 완료 시 `[ ]` → `[x]` 로 변경합니다.

---

## 1. GPIO

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 1-01 | 디지털 출력 — LED ON/OFF | `gpio/01-digital-output` | [x] |
| 1-02 | 내장 LED 제어 (Active LOW 반전 로직) | `gpio/02-builtin-led` | [x] |
| 1-03 | 디지털 입력 — 버튼 (INPUT_PULLUP) | `gpio/03-digital-input-pullup` | [x] |
| 1-04 | 디지털 입력 — 버튼 (INPUT_PULLDOWN) | `gpio/04-digital-input-pulldown` | [x] |
| 1-05 | 버튼으로 LED 토글 | `gpio/05-button-led-toggle` | [x] |
| 1-06 | 외부 인터럽트 — FALLING | `gpio/06-interrupt-falling` | [x] |
| 1-07 | 외부 인터럽트 — RISING | `gpio/07-interrupt-rising` | [x] |
| 1-08 | 외부 인터럽트 — CHANGE | `gpio/08-interrupt-change` | [x] |
| 1-09 | 버튼 디바운싱 (소프트웨어) | `gpio/09-debounce` | [x] |
| 1-10 | 다중 GPIO 동시 제어 | `gpio/10-multi-gpio` | [x] |
| 1-11 | 릴레이 모듈 제어 | `gpio/11-relay` | [x] |

---

## 2. ADC (아날로그 입력)

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 2-01 | 기본 ADC 읽기 (0~4095) | `adc/01-basic-read` | [x] |
| 2-02 | ADC → 전압 변환 (0~3.3V) | `adc/02-voltage-read` | [x] |
| 2-03 | 다중 채널 ADC (A0~A5) | `adc/03-multi-channel` | [x] |
| 2-04 | 평균값 필터 (노이즈 제거) | `adc/04-averaging-filter` | [x] |
| 2-05 | 가변저항 읽기 | `adc/05-potentiometer` | [x] |
| 2-06 | CDS 조도 센서 읽기 | `adc/06-cds-light-sensor` | [x] |
| 2-07 | 토양 수분 센서 | `adc/07-soil-moisture` | [x] |
| 2-08 | LM35 아날로그 온도 센서 | `adc/08-lm35-temp` | [x] |
| 2-09 | 배터리 전압 모니터링 (분압) | `adc/09-battery-voltage` | [x] |

---

## 3. PWM 출력

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 3-01 | LED 밝기 조절 (ledcWrite) | `pwm/led-brightness` | [ ] |
| 3-02 | LED 페이드 인/아웃 | `pwm/led-fade` | [ ] |
| 3-03 | 가변저항으로 LED 밝기 조절 | `pwm/pot-led-brightness` | [ ] |
| 3-04 | 서보모터 각도 제어 | `pwm/servo-basic` | [ ] |
| 3-05 | 서보모터 스윕 (0°~180°) | `pwm/servo-sweep` | [ ] |
| 3-06 | DC 모터 속도 제어 (L298N) | `pwm/dc-motor-l298n` | [ ] |
| 3-07 | DC 모터 정/역 + 속도 제어 | `pwm/dc-motor-direction` | [ ] |
| 3-08 | 수동 부저 — 단음 | `pwm/buzzer-tone` | [ ] |
| 3-09 | 수동 부저 — 멜로디 | `pwm/buzzer-melody` | [ ] |
| 3-10 | 다중 PWM 채널 (독립 제어) | `pwm/multi-channel` | [ ] |

---

## 4. 타이밍

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 4-01 | millis() 논블로킹 타이머 | `timing/millis-timer` | [ ] |
| 4-02 | 다중 millis 타이머 동시 실행 | `timing/multi-timer` | [ ] |
| 4-03 | micros() 고정밀 타이밍 | `timing/micros-timing` | [ ] |
| 4-04 | 하드웨어 타이머 인터럽트 | `timing/hw-timer-interrupt` | [ ] |
| 4-05 | millis 오버플로우 안전 처리 | `timing/millis-overflow` | [ ] |

---

## 5. 시리얼 통신 (UART)

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 5-01 | UART0 기본 송수신 | `uart/basic-serial` | [ ] |
| 5-02 | 시리얼 명령어 파서 | `uart/command-parser` | [ ] |
| 5-03 | UART1 — 추가 포트 (핀 지정) | `uart/serial1-extra` | [ ] |
| 5-04 | 두 장치 간 UART 통신 | `uart/two-device` | [ ] |
| 5-05 | GPS 모듈 (NMEA 파싱) | `uart/gps-nmea` | [ ] |

---

## 6. I2C 통신

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 6-01 | I2C 장치 주소 스캔 | `i2c/scanner` | [ ] |
| 6-02 | OLED 디스플레이 (SSD1306) | `i2c/oled-ssd1306` | [ ] |
| 6-03 | OLED — 그래픽 (선, 원, 사각형) | `i2c/oled-graphics` | [ ] |
| 6-04 | BME280 온도/습도/기압 | `i2c/bme280` | [ ] |
| 6-05 | MPU6050 가속도/자이로 | `i2c/mpu6050` | [ ] |
| 6-06 | DS3231 RTC 실시간 시계 | `i2c/ds3231-rtc` | [ ] |
| 6-07 | ADS1115 외부 16비트 ADC | `i2c/ads1115-adc` | [ ] |
| 6-08 | BH1750 조도 센서 | `i2c/bh1750-light` | [ ] |
| 6-09 | LCD 1602 (I2C 변환 모듈) | `i2c/lcd1602` | [ ] |
| 6-10 | INA219 전류/전압 모니터 | `i2c/ina219-power` | [ ] |

---

## 7. SPI 통신

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 7-01 | TFT LCD (ST7789) 기본 출력 | `spi/tft-st7789-basic` | [ ] |
| 7-02 | TFT LCD — 텍스트/그래픽 | `spi/tft-st7789-graphics` | [ ] |
| 7-03 | TFT LCD — 센서값 실시간 표시 | `spi/tft-sensor-display` | [ ] |
| 7-04 | SD 카드 — 파일 읽기/쓰기 | `spi/sd-card-rw` | [ ] |
| 7-05 | SD 카드 — 센서 로그 저장 | `spi/sd-sensor-logger` | [ ] |

---

## 8. 1-Wire 통신

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 8-01 | DS18B20 온도 센서 (단일) | `onewire/ds18b20-single` | [ ] |
| 8-02 | DS18B20 온도 센서 (다중) | `onewire/ds18b20-multi` | [ ] |

---

## 9. 센서

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 9-01 | DHT11 온습도 | `sensor/dht11` | [ ] |
| 9-02 | DHT22 온습도 | `sensor/dht22` | [ ] |
| 9-03 | HC-SR04 초음파 거리 센서 | `sensor/hcsr04-ultrasonic` | [ ] |
| 9-04 | VL53L0X ToF 레이저 거리 | `sensor/vl53l0x-tof` | [ ] |
| 9-05 | PIR HC-SR501 모션 감지 | `sensor/pir-motion` | [ ] |
| 9-06 | MQ-2 가스/연기 센서 | `sensor/mq2-gas` | [ ] |
| 9-07 | 적외선 수신 (IR Remote) | `sensor/ir-receiver` | [ ] |
| 9-08 | 적외선 송신 (IR Remote) | `sensor/ir-transmitter` | [ ] |
| 9-09 | 홀 효과 센서 (자기장) | `sensor/hall-effect` | [ ] |
| 9-10 | 진동 센서 | `sensor/vibration` | [ ] |

---

## 10. RGB LED / LED 스트립

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 10-01 | RGB LED (공통 캐소드) | `led/rgb-common-cathode` | [ ] |
| 10-02 | WS2812B 단일 LED (FastLED) | `led/ws2812b-single` | [ ] |
| 10-03 | WS2812B 스트립 — 색상 제어 | `led/ws2812b-strip-color` | [ ] |
| 10-04 | WS2812B 스트립 — 애니메이션 | `led/ws2812b-animation` | [ ] |
| 10-05 | WS2812B 스트립 — 밝기 조절 | `led/ws2812b-brightness` | [ ] |

---

## 11. Wi-Fi

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 11-01 | Wi-Fi STA 연결 기본 | `wifi/sta-basic` | [ ] |
| 11-02 | Wi-Fi AP 모드 | `wifi/ap-mode` | [ ] |
| 11-03 | Wi-Fi STA+AP 동시 모드 | `wifi/sta-ap-dual` | [ ] |
| 11-04 | 주변 Wi-Fi 네트워크 스캔 | `wifi/scan-networks` | [ ] |
| 11-05 | Wi-Fi 자동 재연결 | `wifi/auto-reconnect` | [ ] |
| 11-06 | 고정 IP 설정 (Static IP) | `wifi/static-ip` | [ ] |
| 11-07 | HTTP GET 요청 | `wifi/http-get` | [ ] |
| 11-08 | HTTP POST JSON 전송 | `wifi/http-post-json` | [ ] |
| 11-09 | HTTPS GET (TLS/SSL) | `wifi/https-get` | [ ] |
| 11-10 | 웹서버 기본 (WebServer) | `wifi/webserver-basic` | [ ] |
| 11-11 | 웹서버 — GPIO 제어 페이지 | `wifi/webserver-gpio` | [ ] |
| 11-12 | 웹서버 — 센서값 JSON API | `wifi/webserver-json-api` | [ ] |
| 11-13 | 웹서버 — 파일 서빙 (SPIFFS) | `wifi/webserver-spiffs` | [ ] |
| 11-14 | 비동기 웹서버 (ESPAsyncWebServer) | `wifi/async-webserver` | [ ] |
| 11-15 | WebSocket 서버 | `wifi/websocket-server` | [ ] |
| 11-16 | mDNS (esp32.local 호스트명) | `wifi/mdns-hostname` | [ ] |
| 11-17 | Captive Portal (AP + DNS) | `wifi/captive-portal` | [ ] |
| 11-18 | NTP 시간 동기화 | `wifi/ntp-time-sync` | [ ] |
| 11-19 | WiFiManager (웹으로 Wi-Fi 설정) | `wifi/wifi-manager` | [ ] |

---

## 12. Bluetooth BLE

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 12-01 | BLE 서버 — Notify | `ble/server-notify` | [ ] |
| 12-02 | BLE 서버 — Read | `ble/server-read` | [ ] |
| 12-03 | BLE 서버 — Write (명령 수신) | `ble/server-write` | [ ] |
| 12-04 | BLE UART (NUS 프로토콜) | `ble/uart-nus` | [ ] |
| 12-05 | BLE 비콘 (iBeacon) | `ble/beacon-ibeacon` | [ ] |
| 12-06 | BLE 클라이언트 — 스캔 | `ble/client-scan` | [ ] |
| 12-07 | BLE 클라이언트 — 연결 및 읽기 | `ble/client-connect-read` | [ ] |
| 12-08 | BLE HID 키보드 | `ble/hid-keyboard` | [ ] |
| 12-09 | BLE HID 마우스 | `ble/hid-mouse` | [ ] |

---

## 13. MQTT

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 13-01 | MQTT 기본 발행 (Publish) | `mqtt/basic-publish` | [ ] |
| 13-02 | MQTT 기본 구독 (Subscribe) | `mqtt/basic-subscribe` | [ ] |
| 13-03 | MQTT 발행 + 구독 동시 | `mqtt/pub-sub` | [ ] |
| 13-04 | MQTT JSON 데이터 발행 | `mqtt/json-publish` | [ ] |
| 13-05 | MQTT 자동 재연결 | `mqtt/auto-reconnect` | [ ] |
| 13-06 | MQTT + TLS (암호화) | `mqtt/tls-secure` | [ ] |
| 13-07 | MQTT Last Will & Testament | `mqtt/last-will` | [ ] |
| 13-08 | MQTT → Home Assistant 연동 | `mqtt/home-assistant` | [ ] |

---

## 14. 파일 시스템 & 저장소

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 14-01 | NVS 기본 (Preferences) 읽기/쓰기 | `storage/nvs-preferences` | [ ] |
| 14-02 | NVS — 설정값 저장/복원 | `storage/nvs-config-restore` | [ ] |
| 14-03 | SPIFFS 파일 읽기/쓰기 | `storage/spiffs-rw` | [ ] |
| 14-04 | SPIFFS — HTML 파일 서빙 | `storage/spiffs-web-serve` | [ ] |
| 14-05 | LittleFS 파일 읽기/쓰기 | `storage/littlefs-rw` | [ ] |
| 14-06 | LittleFS — 센서 로그 저장 | `storage/littlefs-logger` | [ ] |

---

## 15. 딥슬립 & 저전력

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 15-01 | 딥슬립 — 타이머 웨이크업 | `power/deepsleep-timer` | [ ] |
| 15-02 | 딥슬립 — GPIO 웨이크업 | `power/deepsleep-gpio` | [ ] |
| 15-03 | 딥슬립 — 웨이크업 원인 판별 | `power/deepsleep-wakeup-reason` | [ ] |
| 15-04 | 딥슬립 + NVS 데이터 유지 | `power/deepsleep-nvs` | [ ] |
| 15-05 | 라이트슬립 | `power/lightsleep` | [ ] |
| 15-06 | 모뎀슬립 (Wi-Fi 끄기) | `power/modem-sleep` | [ ] |
| 15-07 | 딥슬립 배터리 센서 노드 (실전) | `power/battery-sensor-node` | [ ] |

---

## 16. OTA 업데이트

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 16-01 | ArduinoOTA 기본 | `ota/arduino-ota-basic` | [ ] |
| 16-02 | ArduinoOTA + 비밀번호 | `ota/arduino-ota-password` | [ ] |
| 16-03 | HTTP URL로 OTA 업데이트 | `ota/http-ota` | [ ] |
| 16-04 | OTA + 딥슬립 조합 | `ota/ota-with-deepsleep` | [ ] |

---

## 17. 시스템 & 하드웨어 정보

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 17-01 | 칩 정보 (MAC, 칩ID, 리비전) | `system/chip-info` | [ ] |
| 17-02 | 플래시 / 메모리 정보 | `system/memory-info` | [ ] |
| 17-03 | 부팅 원인 판별 | `system/boot-reason` | [ ] |
| 17-04 | 소프트웨어 재시작 (ESP.restart) | `system/soft-restart` | [ ] |
| 17-05 | 워치독 타이머 (WDT) | `system/watchdog-timer` | [ ] |
| 17-06 | 난수 생성 (하드웨어 RNG) | `system/hardware-rng` | [ ] |
| 17-07 | AES 하드웨어 암호화 | `system/aes-encrypt` | [ ] |
| 17-08 | SHA256 해시 | `system/sha256-hash` | [ ] |
| 17-09 | CPU 주파수 동적 변경 | `system/cpu-freq-change` | [ ] |

---

## 18. FreeRTOS (멀티태스킹)

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 18-01 | 태스크 생성 및 실행 | `rtos/task-basic` | [ ] |
| 18-02 | 태스크 간 Queue 통신 | `rtos/task-queue` | [ ] |
| 18-03 | Semaphore (동기화) | `rtos/semaphore` | [ ] |
| 18-04 | Mutex (공유 자원 보호) | `rtos/mutex` | [ ] |
| 18-05 | 태스크 우선순위 제어 | `rtos/task-priority` | [ ] |
| 18-06 | 소프트웨어 타이머 (xTimer) | `rtos/software-timer` | [ ] |

---

## 19. JSON 처리

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 19-01 | JSON 직렬화 (ArduinoJson) | `json/serialize` | [ ] |
| 19-02 | JSON 역직렬화 (파싱) | `json/deserialize` | [ ] |
| 19-03 | JSON API 서버 (웹서버 + JSON) | `json/api-server` | [ ] |
| 19-04 | JSON API 클라이언트 (HTTP GET 파싱) | `json/api-client` | [ ] |

---

## 20. 스텝 모터

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 20-01 | 스텝 모터 기본 (AccelStepper) | `motor/stepper-basic` | [ ] |
| 20-02 | 스텝 모터 가속/감속 | `motor/stepper-accel` | [ ] |
| 20-03 | 스텝 모터 원점 복귀 | `motor/stepper-homing` | [ ] |

---

## 21. 복합 실전 프로젝트 (기능 조합)

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 21-01 | 온습도 모니터 (OLED + DHT22) | `combo/temp-monitor-oled` | [ ] |
| 21-02 | Wi-Fi 온습도 대시보드 | `combo/temp-dashboard-wifi` | [ ] |
| 21-03 | BLE 스마트폰 LED 제어 | `combo/ble-led-control` | [ ] |
| 21-04 | MQTT 스마트홈 센서 노드 | `combo/mqtt-smarthome-node` | [ ] |
| 21-05 | 배터리 딥슬립 센서 (MQTT 전송) | `combo/battery-mqtt-sensor` | [ ] |
| 21-06 | OTA 지원 웹서버 | `combo/ota-webserver` | [ ] |
| 21-07 | SD카드 센서 데이터 로거 | `combo/sd-data-logger` | [ ] |
| 21-08 | IR 리모컨 → LED 제어 | `combo/ir-led-control` | [ ] |
| 21-09 | 서보 + 초음파 거리 스캐너 | `combo/servo-ultrasonic-scanner` | [ ] |
| 21-10 | Captive Portal Wi-Fi 설정기 | `combo/captive-portal-wifi-config` | [ ] |

---

## 통계

| 카테고리 | 항목 수 |
|---------|--------|
| GPIO | 11 |
| ADC | 9 |
| PWM | 10 |
| 타이밍 | 5 |
| UART | 5 |
| I2C | 10 |
| SPI | 5 |
| 1-Wire | 2 |
| 센서 | 10 |
| RGB LED | 5 |
| Wi-Fi | 19 |
| BLE | 9 |
| MQTT | 8 |
| 파일시스템 | 6 |
| 저전력 | 7 |
| OTA | 4 |
| 시스템 | 9 |
| FreeRTOS | 6 |
| JSON | 4 |
| 스텝 모터 | 3 |
| 복합 프로젝트 | 10 |
| **합계** | **162** |
