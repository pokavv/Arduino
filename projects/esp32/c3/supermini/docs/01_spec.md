# ESP32-C3 Super Mini — 스펙 & 핀맵

## 아두이노 우노와 비교

| 항목 | 아두이노 우노 | ESP32-C3 Super Mini |
|------|--------------|---------------------|
| CPU | 8비트 AVR | 32비트 RISC-V |
| 클럭 | 16 MHz | 160 MHz |
| RAM | 2 KB | 400 KB |
| 플래시 | 32 KB | 4 MB |
| Wi-Fi | 없음 | 802.11 b/g/n |
| Bluetooth | 없음 | BLE 5.0 |
| 가격 | 약 5달러 | 약 2~4달러 |

---

## 하드웨어 스펙

| 항목 | 상세 |
|------|------|
| 칩 | ESP32-C3FN4 |
| 아키텍처 | 32비트 RISC-V 단일 코어 |
| 클럭 | 최대 160 MHz |
| SRAM | 400 KB |
| 플래시 | 4 MB 내장 |
| Wi-Fi | 802.11 b/g/n (2.4GHz) |
| Bluetooth | BLE 5.0 |
| GPIO | 13개 |
| ADC | 12비트, 6채널 (G0~G5) |
| USB | USB-C (내장 USB Serial) |
| 동작 전압 | 3.3V |
| 입력 전압 | 5V (USB) 또는 3.3V |
| GPIO 최대 전류 | 40mA |
| 크기 | 약 22.5 × 18mm |

> ⚠️ GPIO는 3.3V 기준입니다. 5V 신호 직접 연결 시 보드 손상됩니다.

---

## 핀맵

```
        USB-C
    ┌────────────┐
    │  [LED G8]  │
 5V ┤            ├ GND
3V3 ┤            ├ 3V3
GND ┤            ├ GND
 G2 ┤            ├ G10  (I2C SCL)
 G3 ┤            ├ G9   (I2C SDA / 부팅핀)
 G4 ┤            ├ G8   (내장 LED, Active LOW)
 G5 ┤            ├ G7   (SPI MOSI)
 G6 ┤            ├ G1   (TX)
    │            ├ G0   (RX / 부팅핀)
    └────────────┘
```

## 핀 기능 요약

| GPIO | 기능 | 비고 |
|------|------|------|
| G0 | RX / ADC | 부팅핀 — 부팅 시 LOW면 다운로드 모드 |
| G1 | TX / ADC | |
| G2 | ADC / SPI MISO | |
| G3 | ADC / SPI CS | |
| G4 | ADC | |
| G5 | ADC | |
| G6 | SPI SCK | |
| G7 | SPI MOSI | |
| G8 | **내장 LED** | LOW = 켜짐, HIGH = 꺼짐 |
| G9 | I2C SDA / 부팅핀 | 부팅 시 풀업 필요 |
| G10 | I2C SCL | |
