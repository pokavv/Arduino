# 통신 (UART / I2C / SPI) — ESP32-C3

> 프로토콜 기본 개념은 [arduino/05_serial_i2c_spi.md](../arduino/05_serial_i2c_spi.md) 참고

---

## UART

### USB 시리얼 (기본)

```cpp
void setup() {
    Serial.begin(115200);  // USB-C로 PC와 통신
}
```

### 추가 UART (외부 장치 연결)

```cpp
// RX핀, TX핀 직접 지정
Serial1.begin(9600, SERIAL_8N1, 4, 5);  // (속도, 설정, RX=G4, TX=G5)

void loop() {
    if (Serial1.available()) {
        String 데이터 = Serial1.readStringUntil('\n');
        Serial.println(데이터);
    }
}
```

---

## I2C

기본 핀: **SDA = G8, SCL = G9**
`Wire.begin(SDA, SCL)`으로 다른 핀 지정 가능합니다.

```cpp
#include <Wire.h>

Wire.begin(8, 9);  // SDA=G8, SCL=G9
```

### 연결된 장치 주소 스캔

```cpp
#include <Wire.h>

void setup() {
    Serial.begin(115200);
    Wire.begin(8, 9);

    for (byte addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            Serial.printf("장치 발견: 0x%02X\n", addr);
        }
    }
}
```

### OLED 디스플레이 (SSD1306)

라이브러리 관리자에서 `Adafruit SSD1306` + `Adafruit GFX` 설치

```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
    Wire.begin(8, 9);
    display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Hello ESP32-C3!");
    display.display();
}
```

### BME280 온도/습도/기압

```cpp
#include <Wire.h>
#include <Adafruit_BME280.h>

Adafruit_BME280 bme;

void setup() {
    Wire.begin(8, 9);
    bme.begin(0x76);  // 또는 0x77
}

void loop() {
    Serial.println(bme.readTemperature());   // 온도 °C
    Serial.println(bme.readHumidity());      // 습도 %
    Serial.println(bme.readPressure() / 100.0); // 기압 hPa
    delay(2000);
}
```

---

## SPI

기본 핀:

| 기능 | GPIO |
|------|------|
| SCK (클럭) | G6 |
| MOSI (출력) | G7 |
| MISO (입력) | G2 |
| CS (선택) | G3 (사용자 지정) |

```cpp
#include <SPI.h>

void setup() {
    SPI.begin(6, 2, 7, 3);  // (SCK, MISO, MOSI, CS)
}
```

### TFT LCD (ST7789) 예시

```cpp
#include <TFT_eSPI.h>  // User_Setup.h에서 핀 설정 필요

TFT_eSPI tft;

void setup() {
    tft.init();
    tft.fillScreen(TFT_BLACK);
    tft.setTextColor(TFT_WHITE);
    tft.drawString("Hello!", 10, 10, 2);
}
```

---

## 핀 정리

| 프로토콜 | 핀 |
|---------|-----|
| I2C SDA | G8 (변경 가능) |
| I2C SCL | G9 (변경 가능) |
| SPI SCK | G6 |
| SPI MOSI | G7 |
| SPI MISO | G2 |
| UART0 TX | G1 |
| UART0 RX | G0 |
