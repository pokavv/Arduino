# Arduino 부품 레퍼런스

Arduino 및 ESP32-C3 프로젝트에서 사용하는 모든 부품의 공식 스펙·회로 연결·주의사항을 정리한 레퍼런스입니다.  
데이터시트 기준으로 작성되었으며 ESP32-C3 Super Mini (3.3V 시스템) 환경 기준으로 주의사항이 기술되어 있습니다.

---

## 디렉토리 구조

```
docs/components/
├── passive/          수동 소자 (6종)
├── active/           능동 소자 · 디스플레이 (9종)
├── sensors/          센서 (11종)
├── actuators/        액추에이터 (6종)
├── drivers/          드라이버 IC (5종)
├── power/            전원 부품 (4종)
├── connectivity/     연결 부품 (3종)
└── modules/          통신·기능 모듈 (5종)
```

---

## passive/ — 수동 소자

전기 에너지를 소모하거나 저장하는 소자. 능동 소자와 달리 이득(Gain)이 없습니다.

| 파일 | 부품 | 핵심 파라미터 |
|------|------|--------------|
| [resistor.md](passive/resistor.md) | 저항 (Resistor) | 저항값(Ω), 허용 오차, 전력 정격, 색상 코드 |
| [capacitor.md](passive/capacitor.md) | 커패시터 (Capacitor) | 정전 용량(F), 내압(V), 극성, ESR |
| [inductor.md](passive/inductor.md) | 인덕터 (Inductor) | 인덕턴스(H), 포화 전류, DCR, Q 값 |
| [diode.md](passive/diode.md) | 다이오드 (1N400x 등) | 순방향 전압(Vf), 역방향 전압(VRRM), 정류 전류 |
| [zener-diode.md](passive/zener-diode.md) | 제너 다이오드 | 제너 전압(Vz), 최대 전력, 제너 임피던스 |
| [crystal.md](passive/crystal.md) | 크리스탈 발진자 | 주파수, 부하 커패시턴스(CL), ESR, 주파수 공차 |

---

## active/ — 능동 소자 · 디스플레이

전력을 사용해 신호를 증폭·스위칭하거나 빛을 발생하는 소자입니다.

| 파일 | 부품 | 핵심 파라미터 |
|------|------|--------------|
| [led.md](active/led.md) | LED (단색 3mm/5mm) | 순방향 전압(Vf), 최대 전류(If), 파장(nm), 광도(mcd) |
| [rgb-led.md](active/rgb-led.md) | RGB LED (공통 음극/양극) | 각 채널 Vf, 전류, 공통 핀 구조 |
| [neopixel.md](active/neopixel.md) | NeoPixel / WS2812B | 5V 입력, 800kbps 1-Wire 프로토콜, 채널당 최대 60mA |
| [seven-segment.md](active/seven-segment.md) | 7-세그먼트 디스플레이 | 공통 음극/양극, 세그먼트 코드 표, 전류 제한 |
| [lcd-i2c.md](active/lcd-i2c.md) | 16×2 LCD + I2C 백팩 | HD44780, PCF8574, I2C 주소(0x27/0x3F), 5V 전원 |
| [oled-ssd1306.md](active/oled-ssd1306.md) | OLED 0.96″ SSD1306 | 128×64 픽셀, I2C(0x3C/0x3D)/SPI, 3.3V~5V |
| [transistor-npn.md](active/transistor-npn.md) | NPN 트랜지스터 (2N2222, BC547, S8050) | hFE, Ic(max), VCE(sat), VBE |
| [transistor-pnp.md](active/transistor-pnp.md) | PNP 트랜지스터 (2N2907, BC557, S8550) | hFE, Ic(max), VCE(sat), VEB |
| [mosfet.md](active/mosfet.md) | N채널 MOSFET (IRLZ44N, IRF540N, 2N7000) | Vgs(th), Id(max), RDS(on), Vgs(max) |

---

## sensors/ — 센서

물리적 현상을 전기 신호로 변환하는 소자·모듈입니다.

| 파일 | 부품 | 측정 대상 | 인터페이스 |
|------|------|----------|-----------|
| [dht11-dht22.md](sensors/dht11-dht22.md) | DHT11 / DHT22 | 온도·습도 | 단선 직렬 (1-Wire 유사) |
| [ds18b20.md](sensors/ds18b20.md) | DS18B20 | 온도 (-55~+125°C) | 1-Wire |
| [lm35.md](sensors/lm35.md) | LM35 | 온도 (0~+150°C) | 아날로그 (10mV/°C) |
| [hc-sr04.md](sensors/hc-sr04.md) | HC-SR04 | 거리 (2cm~4m) | GPIO (Trigger/Echo) |
| [pir-hcsr501.md](sensors/pir-hcsr501.md) | PIR HC-SR501 | 움직임 감지 | GPIO (디지털 출력) |
| [bme280.md](sensors/bme280.md) | BME280 | 온도·습도·기압 | I2C / SPI |
| [mpu6050.md](sensors/mpu6050.md) | MPU-6050 | 3축 가속도·3축 자이로 | I2C |
| [photoresistor.md](sensors/photoresistor.md) | 광센서 CDS / LDR | 조도 | 아날로그 (분압 회로) |
| [soil-moisture.md](sensors/soil-moisture.md) | 토양 수분 센서 | 수분 함량 | 아날로그 + 디지털 |
| [sound-sensor.md](sensors/sound-sensor.md) | 소리 센서 KY-038 | 소리 크기 | 아날로그 + 디지털 |
| [ir-sensor.md](sensors/ir-sensor.md) | 적외선 센서 (장애물/수신) | 물체 감지 / IR 리모컨 | GPIO / 38kHz 복조 |

---

## actuators/ — 액추에이터

전기 신호를 기계적·물리적 동작으로 변환하는 부품입니다.

| 파일 | 부품 | 제어 방식 | 외부 전원 |
|------|------|----------|----------|
| [servo.md](actuators/servo.md) | 서보모터 (SG90, MG90S, MG996R) | PWM 50Hz (500~2500μs) | 5V 별도 권장 |
| [dc-motor.md](actuators/dc-motor.md) | DC 모터 (TT, N20, 130) | PWM (H-브리지) | 드라이버 통해 |
| [stepper-motor.md](actuators/stepper-motor.md) | 스텝 모터 (28BYJ-48, NEMA17) | 풀스텝/하프스텝 4상 | 5V~12V 별도 |
| [buzzer-active.md](actuators/buzzer-active.md) | 능동 부저 | GPIO ON/OFF | 3.3V/5V |
| [buzzer-passive.md](actuators/buzzer-passive.md) | 수동 부저 | PWM 주파수 | 3.3V/5V |
| [relay.md](actuators/relay.md) | 릴레이 모듈 (1/2/4채널) | GPIO (Active LOW) | 5V + 고전압 분리 |

---

## drivers/ — 드라이버 IC

부족한 GPIO 출력 전류를 보완하거나 모터·디스플레이를 구동하는 IC입니다.

| 파일 | IC | 역할 | 인터페이스 |
|------|----|------|-----------|
| [l298n.md](drivers/l298n.md) | L298N | DC/스텝 모터 H-브리지 드라이버 (2A×2) | GPIO + PWM |
| [uln2003.md](drivers/uln2003.md) | ULN2003A | 달링턴 어레이 (500mA×7) | GPIO |
| [74hc595.md](drivers/74hc595.md) | 74HC595 | 8비트 직렬→병렬 시프트 레지스터 | SPI (3-wire) |
| [pcf8574.md](drivers/pcf8574.md) | PCF8574 | I2C GPIO 확장 (8핀 추가) | I2C |
| [tm1637.md](drivers/tm1637.md) | TM1637 | 4자리 7-세그먼트 디스플레이 드라이버 | 전용 2-wire |

---

## power/ — 전원 부품

회로에 안정된 전압을 공급하거나 에너지를 저장하는 부품입니다.

| 파일 | 부품 | 입력 | 출력 | 특징 |
|------|------|------|------|------|
| [ams1117.md](power/ams1117.md) | AMS1117 | 최대 15V | 3.3V / 5V 고정 또는 가변 | LDO, 800mA, SOT-223 |
| [lm7805.md](power/lm7805.md) | LM7805 (78xx) | 7~35V | 5V 고정 | 1A, TO-220, 발열 큼 |
| [buck-converter.md](power/buck-converter.md) | 벅 컨버터 (MP1584, LM2596) | 최대 28~40V | 가변 | 3A, 90% 효율 |
| [battery.md](power/battery.md) | 배터리 전 종류 | — | 1.5V~4.2V/셀 | 18650/LiPo/AA/AAA/9V/CR2032 비교 |

---

## connectivity/ — 연결 부품

회로 구성을 위한 물리적 연결 부품입니다.

| 파일 | 부품 | 핵심 스펙 |
|------|------|----------|
| [jumper-wire.md](connectivity/jumper-wire.md) | 점퍼 와이어 | AWG22~28, M-M/M-F/F-F, 최대 전류 |
| [breadboard.md](connectivity/breadboard.md) | 브레드보드 | 내부 연결 구조, 피치 2.54mm, 1A/열 |
| [header-pin.md](connectivity/header-pin.md) | 핀 헤더 / 소켓 헤더 | 2.54mm/2.00mm/1.27mm 피치, 1×n/2×n 열 |

---

## modules/ — 통신 · 기능 모듈

여러 부품이 통합된 완성 모듈입니다.

| 파일 | 모듈 | 통신 | 전원 |
|------|------|------|------|
| [hc-05.md](modules/hc-05.md) | HC-05 블루투스 2.0 | UART (AT 명령어), SPP | 3.3V (5V 톨러런트) |
| [hc-06.md](modules/hc-06.md) | HC-06 블루투스 2.0 슬레이브 | UART (AT 명령어 간소화) | 3.3V (5V 톨러런트) |
| [nrf24l01.md](modules/nrf24l01.md) | nRF24L01+ 2.4GHz 무선 | SPI + ShockBurst | 1.9~3.6V (반드시 3.3V) |
| [sd-card.md](modules/sd-card.md) | SD/MicroSD 카드 모듈 | SPI | 3.3V/5V (레벨 변환 내장) |
| [rtc-ds3231.md](modules/rtc-ds3231.md) | DS3231 RTC 모듈 | I2C | 3.3V~5.5V + CR2032 백업 |

---

## 공통 주의사항 — ESP32-C3 Super Mini

| 항목 | 내용 |
|------|------|
| 동작 전압 | **3.3V** GPIO — 5V 직접 연결 시 즉시 파손 위험 |
| 5V 부품 연결 | 레벨 시프터 또는 분압 저항 회로 필수 |
| ADC | Wi-Fi 동작 중 ADC1 노이즈 발생 → 필터링 또는 분리 측정 |
| PWM | `analogWrite()` 미지원 → `ledcAttach()` / `ledcWrite()` 사용 |
| NeoPixel | 데이터 라인 3.3V → 5V 레벨 시프터 또는 74HCT245 권장 |
| 전류 | GPIO 핀당 최대 40mA, 전체 3.3V 핀 합산 최대 300mA |
| 부팅 | G0 (BOOT), G9 (JTAG TCK) — 부팅 시 LOW/HIGH 유지 필요 |

---

## 색인 (부품명 → 파일)

| 부품명 | 파일 |
|--------|------|
| 1N4001~1N4007 | [passive/diode.md](passive/diode.md) |
| 1N47xx, 1N52xx | [passive/zener-diode.md](passive/zener-diode.md) |
| 2N2222, BC547, S8050 | [active/transistor-npn.md](active/transistor-npn.md) |
| 2N2907, BC557, S8550 | [active/transistor-pnp.md](active/transistor-pnp.md) |
| 28BYJ-48, NEMA17 | [actuators/stepper-motor.md](actuators/stepper-motor.md) |
| 74HC595 | [drivers/74hc595.md](drivers/74hc595.md) |
| AMS1117 | [power/ams1117.md](power/ams1117.md) |
| BME280 | [sensors/bme280.md](sensors/bme280.md) |
| Buck Converter, LM2596, MP1584 | [power/buck-converter.md](power/buck-converter.md) |
| 브레드보드 | [connectivity/breadboard.md](connectivity/breadboard.md) |
| 부저 (능동) | [actuators/buzzer-active.md](actuators/buzzer-active.md) |
| 부저 (수동) | [actuators/buzzer-passive.md](actuators/buzzer-passive.md) |
| CDS, LDR, 광센서 | [sensors/photoresistor.md](sensors/photoresistor.md) |
| 크리스탈 | [passive/crystal.md](passive/crystal.md) |
| DC 모터 | [actuators/dc-motor.md](actuators/dc-motor.md) |
| DHT11, DHT22 | [sensors/dht11-dht22.md](sensors/dht11-dht22.md) |
| DS18B20 | [sensors/ds18b20.md](sensors/ds18b20.md) |
| DS3231 RTC | [modules/rtc-ds3231.md](modules/rtc-ds3231.md) |
| HC-05 | [modules/hc-05.md](modules/hc-05.md) |
| HC-06 | [modules/hc-06.md](modules/hc-06.md) |
| HC-SR04 | [sensors/hc-sr04.md](sensors/hc-sr04.md) |
| HC-SR501, PIR | [sensors/pir-hcsr501.md](sensors/pir-hcsr501.md) |
| 핀 헤더 | [connectivity/header-pin.md](connectivity/header-pin.md) |
| 인덕터 | [passive/inductor.md](passive/inductor.md) |
| IRF540N, IRLZ44N, 2N7000 | [active/mosfet.md](active/mosfet.md) |
| 적외선 센서 | [sensors/ir-sensor.md](sensors/ir-sensor.md) |
| 점퍼 와이어 | [connectivity/jumper-wire.md](connectivity/jumper-wire.md) |
| KY-038, 소리 센서 | [sensors/sound-sensor.md](sensors/sound-sensor.md) |
| L298N | [drivers/l298n.md](drivers/l298n.md) |
| LCD 16×2 I2C | [active/lcd-i2c.md](active/lcd-i2c.md) |
| LED (단색) | [active/led.md](active/led.md) |
| LM35 | [sensors/lm35.md](sensors/lm35.md) |
| LM7805, 78xx | [power/lm7805.md](power/lm7805.md) |
| MPU-6050 | [sensors/mpu6050.md](sensors/mpu6050.md) |
| NeoPixel, WS2812B | [active/neopixel.md](active/neopixel.md) |
| nRF24L01+ | [modules/nrf24l01.md](modules/nrf24l01.md) |
| OLED SSD1306 | [active/oled-ssd1306.md](active/oled-ssd1306.md) |
| PCF8574 | [drivers/pcf8574.md](drivers/pcf8574.md) |
| 릴레이 모듈 | [actuators/relay.md](actuators/relay.md) |
| 저항 | [passive/resistor.md](passive/resistor.md) |
| RGB LED | [active/rgb-led.md](active/rgb-led.md) |
| SD 카드 모듈 | [modules/sd-card.md](modules/sd-card.md) |
| 서보모터 (SG90, MG90S, MG996R) | [actuators/servo.md](actuators/servo.md) |
| 7-세그먼트 디스플레이 | [active/seven-segment.md](active/seven-segment.md) |
| 토양 수분 센서 | [sensors/soil-moisture.md](sensors/soil-moisture.md) |
| TM1637 | [drivers/tm1637.md](drivers/tm1637.md) |
| ULN2003 | [drivers/uln2003.md](drivers/uln2003.md) |
| 배터리 (18650/LiPo/AA) | [power/battery.md](power/battery.md) |
| 커패시터 | [passive/capacitor.md](passive/capacitor.md) |
| 제너 다이오드 | [passive/zener-diode.md](passive/zener-diode.md) |
