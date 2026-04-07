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
| 3-01 | LED 밝기 조절 (ledcWrite) | `pwm/01-led-brightness` | [x] |
| 3-02 | LED 페이드 인/아웃 | `pwm/02-led-fade` | [x] |
| 3-03 | 가변저항으로 LED 밝기 조절 | `pwm/03-pot-led-brightness` | [x] |
| 3-04 | 서보모터 각도 제어 | `pwm/04-servo-basic` | [x] |
| 3-05 | 서보모터 스윕 (0°~180°) | `pwm/05-servo-sweep` | [x] |
| 3-06 | DC 모터 속도 제어 (L298N) | `pwm/06-dc-motor-l298n` | [x] |
| 3-07 | DC 모터 정/역 + 속도 제어 | `pwm/07-dc-motor-direction` | [x] |
| 3-08 | 수동 부저 — 단음 | `pwm/08-buzzer-tone` | [x] |
| 3-09 | 수동 부저 — 멜로디 | `pwm/09-buzzer-melody` | [x] |
| 3-10 | 다중 PWM 채널 (독립 제어) | `pwm/10-multi-channel` | [x] |

---

## 4. 타이밍

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 4-01 | millis() 논블로킹 타이머 | `timing/01-millis-timer` | [x] |
| 4-02 | 다중 millis 타이머 동시 실행 | `timing/02-multi-timer` | [x] |
| 4-03 | micros() 고정밀 타이밍 | `timing/03-micros-timing` | [x] |
| 4-04 | 하드웨어 타이머 인터럽트 | `timing/04-hw-timer-interrupt` | [x] |
| 4-05 | millis 오버플로우 안전 처리 | `timing/05-millis-overflow` | [x] |

---

## 5. 시리얼 통신 (UART)

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 5-01 | UART0 기본 송수신 | `uart/01-basic-serial` | [x] |
| 5-02 | 시리얼 명령어 파서 | `uart/02-command-parser` | [x] |
| 5-03 | UART1 — 추가 포트 (핀 지정) | `uart/03-serial1-extra` | [x] |
| 5-04 | 두 장치 간 UART 통신 | `uart/04-two-device` | [x] |
| 5-05 | GPS 모듈 (NMEA 파싱) | `uart/05-gps-nmea` | [x] |

---

## 6. I2C 통신

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 6-01 | I2C 장치 주소 스캔 | `i2c/01-scanner` | [x] |
| 6-02 | OLED 디스플레이 (SSD1306) | `i2c/02-oled-ssd1306` | [x] |
| 6-03 | OLED — 그래픽 (선, 원, 사각형) | `i2c/03-oled-graphics` | [x] |
| 6-04 | BME280 온도/습도/기압 | `i2c/04-bme280` | [x] |
| 6-05 | MPU6050 가속도/자이로 | `i2c/05-mpu6050` | [x] |
| 6-06 | DS3231 RTC 실시간 시계 | `i2c/06-ds3231-rtc` | [x] |
| 6-07 | ADS1115 외부 16비트 ADC | `i2c/07-ads1115-adc` | [x] |
| 6-08 | BH1750 조도 센서 | `i2c/08-bh1750-light` | [x] |
| 6-09 | LCD 1602 (I2C 변환 모듈) | `i2c/09-lcd1602` | [x] |
| 6-10 | INA219 전류/전압 모니터 | `i2c/10-ina219-power` | [x] |

---

## 7. SPI 통신

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 7-01 | TFT LCD (ST7789) 기본 출력 | `spi/01-tft-st7789-basic` | [x] |
| 7-02 | TFT LCD — 텍스트/그래픽 | `spi/02-tft-st7789-graphics` | [x] |
| 7-03 | TFT LCD — 센서값 실시간 표시 | `spi/03-tft-sensor-display` | [x] |
| 7-04 | SD 카드 — 파일 읽기/쓰기 | `spi/04-sd-card-rw` | [x] |
| 7-05 | SD 카드 — 센서 로그 저장 | `spi/05-sd-sensor-logger` | [x] |

---

## 8. 1-Wire 통신

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 8-01 | DS18B20 온도 센서 (단일) | `onewire/01-ds18b20-single` | [x] |
| 8-02 | DS18B20 온도 센서 (다중) | `onewire/02-ds18b20-multi` | [x] |

---

## 9. 센서

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 9-01 | DHT11 온습도 | `sensor/01-dht11` | [x] |
| 9-02 | DHT22 온습도 | `sensor/02-dht22` | [x] |
| 9-03 | HC-SR04 초음파 거리 센서 | `sensor/03-hcsr04-ultrasonic` | [x] |
| 9-04 | VL53L0X ToF 레이저 거리 | `sensor/04-vl53l0x-tof` | [x] |
| 9-05 | PIR HC-SR501 모션 감지 | `sensor/05-pir-motion` | [x] |
| 9-06 | MQ-2 가스/연기 센서 | `sensor/06-mq2-gas` | [x] |
| 9-07 | 적외선 수신 (IR Remote) | `sensor/07-ir-receiver` | [x] |
| 9-08 | 적외선 송신 (IR Remote) | `sensor/08-ir-transmitter` | [x] |
| 9-09 | 홀 효과 센서 (자기장) | `sensor/09-hall-effect` | [x] |
| 9-10 | 진동 센서 | `sensor/10-vibration` | [x] |

---

## 10. RGB LED / LED 스트립

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 10-01 | RGB LED (공통 캐소드) | `led/01-rgb-common-cathode` | [x] |
| 10-02 | WS2812B 단일 LED (FastLED) | `led/02-ws2812b-single` | [x] |
| 10-03 | WS2812B 스트립 — 색상 제어 | `led/03-ws2812b-strip-color` | [x] |
| 10-04 | WS2812B 스트립 — 애니메이션 | `led/04-ws2812b-animation` | [x] |
| 10-05 | WS2812B 스트립 — 밝기 조절 | `led/05-ws2812b-brightness` | [x] |

---

## 11. Wi-Fi

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 11-01 | Wi-Fi STA 연결 기본 | `wifi/01-sta-basic` | [x] |
| 11-02 | Wi-Fi AP 모드 | `wifi/02-ap-mode` | [x] |
| 11-03 | Wi-Fi STA+AP 동시 모드 | `wifi/03-sta-ap-dual` | [x] |
| 11-04 | 주변 Wi-Fi 네트워크 스캔 | `wifi/04-scan-networks` | [x] |
| 11-05 | Wi-Fi 자동 재연결 | `wifi/05-auto-reconnect` | [x] |
| 11-06 | 고정 IP 설정 (Static IP) | `wifi/06-static-ip` | [x] |
| 11-07 | HTTP GET 요청 | `wifi/07-http-get` | [x] |
| 11-08 | HTTP POST JSON 전송 | `wifi/08-http-post-json` | [x] |
| 11-09 | HTTPS GET (TLS/SSL) | `wifi/09-https-get` | [x] |
| 11-10 | 웹서버 기본 (WebServer) | `wifi/10-webserver-basic` | [x] |
| 11-11 | 웹서버 — GPIO 제어 페이지 | `wifi/11-webserver-gpio` | [x] |
| 11-12 | 웹서버 — 센서값 JSON API | `wifi/12-webserver-json-api` | [x] |
| 11-13 | 웹서버 — 파일 서빙 (SPIFFS) | `wifi/13-webserver-spiffs` | [x] |
| 11-14 | 비동기 웹서버 (ESPAsyncWebServer) | `wifi/14-async-webserver` | [x] |
| 11-15 | WebSocket 서버 | `wifi/15-websocket-server` | [x] |
| 11-16 | mDNS (esp32.local 호스트명) | `wifi/16-mdns-hostname` | [x] |
| 11-17 | Captive Portal (AP + DNS) | `wifi/17-captive-portal` | [x] |
| 11-18 | NTP 시간 동기화 | `wifi/18-ntp-time-sync` | [x] |
| 11-19 | WiFiManager (웹으로 Wi-Fi 설정) | `wifi/19-wifi-manager` | [x] |

---

## 12. Bluetooth BLE

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 12-01 | BLE 서버 — Notify | `ble/01-server-notify` | [x] |
| 12-02 | BLE 서버 — Read | `ble/02-server-read` | [x] |
| 12-03 | BLE 서버 — Write (명령 수신) | `ble/03-server-write` | [x] |
| 12-04 | BLE UART (NUS 프로토콜) | `ble/04-uart-nus` | [x] |
| 12-05 | BLE 비콘 (iBeacon) | `ble/05-beacon-ibeacon` | [x] |
| 12-06 | BLE 클라이언트 — 스캔 | `ble/06-client-scan` | [x] |
| 12-07 | BLE 클라이언트 — 연결 및 읽기 | `ble/07-client-connect-read` | [x] |
| 12-08 | BLE HID 키보드 | `ble/08-hid-keyboard` | [x] |
| 12-09 | BLE HID 마우스 | `ble/09-hid-mouse` | [x] |

---

## 13. MQTT

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 13-01 | MQTT 기본 발행 (Publish) | `mqtt/01-basic-publish` | [x] |
| 13-02 | MQTT 기본 구독 (Subscribe) | `mqtt/02-basic-subscribe` | [x] |
| 13-03 | MQTT 발행 + 구독 동시 | `mqtt/03-pub-sub` | [x] |
| 13-04 | MQTT JSON 데이터 발행 | `mqtt/04-json-publish` | [x] |
| 13-05 | MQTT 자동 재연결 | `mqtt/05-auto-reconnect` | [x] |
| 13-06 | MQTT + TLS (암호화) | `mqtt/06-tls-secure` | [x] |
| 13-07 | MQTT Last Will & Testament | `mqtt/07-last-will` | [x] |
| 13-08 | MQTT → Home Assistant 연동 | `mqtt/08-home-assistant` | [x] |

---

## 14. 파일 시스템 & 저장소

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 14-01 | NVS 기본 (Preferences) 읽기/쓰기 | `storage/01-nvs-preferences` | [x] |
| 14-02 | NVS — 설정값 저장/복원 | `storage/02-nvs-config-restore` | [x] |
| 14-03 | SPIFFS 파일 읽기/쓰기 | `storage/03-spiffs-rw` | [x] |
| 14-04 | SPIFFS — HTML 파일 서빙 | `storage/04-spiffs-web-serve` | [x] |
| 14-05 | LittleFS 파일 읽기/쓰기 | `storage/05-littlefs-rw` | [x] |
| 14-06 | LittleFS — 센서 로그 저장 | `storage/06-littlefs-logger` | [x] |

---

## 15. 딥슬립 & 저전력

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 15-01 | 딥슬립 — 타이머 웨이크업 | `power/01-deepsleep-timer` | [x] |
| 15-02 | 딥슬립 — GPIO 웨이크업 | `power/02-deepsleep-gpio` | [x] |
| 15-03 | 딥슬립 — 웨이크업 원인 판별 | `power/03-deepsleep-wakeup-reason` | [x] |
| 15-04 | 딥슬립 + NVS 데이터 유지 | `power/04-deepsleep-nvs` | [x] |
| 15-05 | 라이트슬립 | `power/05-lightsleep` | [x] |
| 15-06 | 모뎀슬립 (Wi-Fi 끄기) | `power/06-modem-sleep` | [x] |
| 15-07 | 딥슬립 배터리 센서 노드 (실전) | `power/07-battery-sensor-node` | [x] |

---

## 16. OTA 업데이트

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 16-01 | ArduinoOTA 기본 | `ota/01-arduino-ota-basic` | [x] |
| 16-02 | ArduinoOTA + 비밀번호 | `ota/02-arduino-ota-password` | [x] |
| 16-03 | HTTP URL로 OTA 업데이트 | `ota/03-http-ota` | [x] |
| 16-04 | OTA + 딥슬립 조합 | `ota/04-ota-with-deepsleep` | [x] |

---

## 17. 시스템 & 하드웨어 정보

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 17-01 | 칩 정보 (MAC, 칩ID, 리비전) | `system/01-chip-info` | [x] |
| 17-02 | 플래시 / 메모리 정보 | `system/02-memory-info` | [x] |
| 17-03 | 부팅 원인 판별 | `system/03-boot-reason` | [x] |
| 17-04 | 소프트웨어 재시작 (ESP.restart) | `system/04-soft-restart` | [x] |
| 17-05 | 워치독 타이머 (WDT) | `system/05-watchdog-timer` | [x] |
| 17-06 | 난수 생성 (하드웨어 RNG) | `system/06-hardware-rng` | [x] |
| 17-07 | AES 하드웨어 암호화 | `system/07-aes-encrypt` | [x] |
| 17-08 | SHA256 해시 | `system/08-sha256-hash` | [x] |
| 17-09 | CPU 주파수 동적 변경 | `system/09-cpu-freq-change` | [x] |

---

## 18. FreeRTOS (멀티태스킹)

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 18-01 | 태스크 생성 및 실행 | `rtos/01-task-basic` | [x] |
| 18-02 | 태스크 간 Queue 통신 | `rtos/02-task-queue` | [x] |
| 18-03 | Semaphore (동기화) | `rtos/03-semaphore` | [x] |
| 18-04 | Mutex (공유 자원 보호) | `rtos/04-mutex` | [x] |
| 18-05 | 태스크 우선순위 제어 | `rtos/05-task-priority` | [x] |
| 18-06 | 소프트웨어 타이머 (xTimer) | `rtos/06-software-timer` | [x] |

---

## 19. JSON 처리

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 19-01 | JSON 직렬화 (ArduinoJson) | `json/01-serialize` | [x] |
| 19-02 | JSON 역직렬화 (파싱) | `json/02-deserialize` | [x] |
| 19-03 | JSON API 서버 (웹서버 + JSON) | `json/03-api-server` | [x] |
| 19-04 | JSON API 클라이언트 (HTTP GET 파싱) | `json/04-api-client` | [x] |

---

## 20. 스텝 모터

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 20-01 | 스텝 모터 기본 (AccelStepper) | `motor/01-stepper-basic` | [x] |
| 20-02 | 스텝 모터 가속/감속 | `motor/02-stepper-accel` | [x] |
| 20-03 | 스텝 모터 원점 복귀 | `motor/03-stepper-homing` | [x] |

---

## 21. 복합 실전 프로젝트 (기능 조합)

| # | 기능 | 폴더명 | 상태 |
|---|------|--------|------|
| 21-01 | 온습도 모니터 (OLED + DHT22) | `combo/01-temp-monitor-oled` | [x] |
| 21-02 | Wi-Fi 온습도 대시보드 | `combo/02-temp-dashboard-wifi` | [x] |
| 21-03 | BLE 스마트폰 LED 제어 | `combo/03-ble-led-control` | [x] |
| 21-04 | MQTT 스마트홈 센서 노드 | `combo/04-mqtt-smarthome-node` | [x] |
| 21-05 | 배터리 딥슬립 센서 (MQTT 전송) | `combo/05-battery-mqtt-sensor` | [x] |
| 21-06 | OTA 지원 웹서버 | `combo/06-ota-webserver` | [x] |
| 21-07 | SD카드 센서 데이터 로거 | `combo/07-sd-data-logger` | [x] |
| 21-08 | IR 리모컨 → LED 제어 | `combo/08-ir-led-control` | [x] |
| 21-09 | 서보 + 초음파 거리 스캐너 | `combo/09-servo-ultrasonic-scanner` | [x] |
| 21-10 | Captive Portal Wi-Fi 설정기 | `combo/10-captive-portal-wifi-config` | [x] |

---

## 통계

| 카테고리 | 항목 수 | 상태 |
|---------|--------|------|
| GPIO | 11 | ✅ 완료 |
| ADC | 9 | ✅ 완료 |
| PWM | 10 | ✅ 완료 |
| 타이밍 | 5 | ✅ 완료 |
| UART | 5 | ✅ 완료 |
| I2C | 10 | ✅ 완료 |
| SPI | 5 | ✅ 완료 |
| 1-Wire | 2 | ✅ 완료 |
| 센서 | 10 | ✅ 완료 |
| RGB LED | 5 | ✅ 완료 |
| Wi-Fi | 19 | ✅ 완료 |
| BLE | 9 | ✅ 완료 |
| MQTT | 8 | ✅ 완료 |
| 파일시스템 | 6 | ✅ 완료 |
| 저전력 | 7 | ✅ 완료 |
| OTA | 4 | ✅ 완료 |
| 시스템 | 9 | ✅ 완료 |
| FreeRTOS | 6 | ✅ 완료 |
| JSON | 4 | ✅ 완료 |
| 스텝 모터 | 3 | ✅ 완료 |
| 복합 프로젝트 | 10 | ✅ 완료 |
| **합계** | **162** | **✅ 전체 완료** |
