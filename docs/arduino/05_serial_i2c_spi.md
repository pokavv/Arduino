# 시리얼 통신 개념 (UART / I2C / SPI)

> ESP32-C3 핀 번호와 실제 예제는 [esp32c3/05_communication.md](../esp32c3/05_communication.md) 참고

---

## 세 가지 통신 프로토콜 비교

| 항목 | UART | I2C | SPI |
|------|------|-----|-----|
| 선 수 | TX, RX (2개) | SDA, SCL (2개) | SCK, MOSI, MISO, CS (4개+) |
| 속도 | 느림 | 중간 | 빠름 |
| 장치 수 | 1:1 | 최대 127개 | 여러 개 (CS 핀 추가) |
| 주소 방식 | 없음 | 7비트 주소 | CS 핀으로 구분 |
| 주요 용도 | GPS, 블루투스, 디버깅 | OLED, 센서 | 디스플레이, SD카드 |

---

## UART (시리얼)

가장 단순한 통신. TX(송신)와 RX(수신) 두 선으로 1:1 통신합니다.

```cpp
void setup() {
    Serial.begin(115200);   // 통신 속도 설정 (bps)
}

void loop() {
    Serial.print("값: ");    // 줄바꿈 없이 출력
    Serial.println(42);      // 출력 후 줄바꿈

    // PC에서 데이터 받기
    if (Serial.available()) {
        String 입력 = Serial.readStringUntil('\n');
        Serial.println("받음: " + 입력);
    }
}
```

### 주요 통신 속도 (bps)
`9600`, `57600`, `115200` (ESP32는 115200 권장)

---

## I2C

2선(SDA, SCL)으로 여러 장치를 연결합니다.
각 장치는 고유한 **7비트 주소**를 가집니다.

```cpp
#include <Wire.h>

Wire.begin();               // I2C 시작 (핀은 보드 기본값 사용)
Wire.begin(SDA핀, SCL핀);  // 핀 직접 지정 (ESP32 등)
```

### 연결된 장치 주소 모를 때 — 스캔

```cpp
#include <Wire.h>

void setup() {
    Serial.begin(115200);
    Wire.begin();
    for (byte addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            Serial.print("발견: 0x");
            Serial.println(addr, HEX);
        }
    }
}
```

### 자주 쓰는 I2C 장치

| 장치 | 주소 | 용도 |
|------|------|------|
| SSD1306 OLED | 0x3C | 작은 디스플레이 |
| BME280 | 0x76 / 0x77 | 온도/습도/기압 |
| MPU6050 | 0x68 | 가속도/자이로 |
| DS3231 | 0x68 | RTC 실시간 시계 |
| ADS1115 | 0x48 | 16비트 외부 ADC |

---

## SPI

4선으로 빠른 통신. 주로 디스플레이와 SD카드에 씁니다.

```cpp
#include <SPI.h>

SPI.begin();                          // 기본 핀 사용
SPI.begin(SCK핀, MISO핀, MOSI핀, CS핀); // 핀 직접 지정
```

| 핀 | 역할 |
|----|------|
| SCK | 클럭 (동기화 신호) |
| MOSI | 마스터 → 슬레이브 데이터 |
| MISO | 슬레이브 → 마스터 데이터 |
| CS | 어떤 장치를 선택할지 (장치마다 별도 핀) |
