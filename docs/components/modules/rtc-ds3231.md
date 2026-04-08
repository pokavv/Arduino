# DS3231 고정밀 RTC 모듈 (I2C)

## 개요

DS3231은 Maxim Integrated(현 Analog Devices)에서 제조한 고정밀 실시간 클럭(RTC, Real-Time Clock) IC입니다.
내부에 온도 보정 수정 발진기(TCXO, Temperature-Compensated Crystal Oscillator)가 내장되어
온도 변화에도 시간 정확도를 유지합니다.

DS3231의 가장 큰 특징:
- 온도 보정 발진기 내장 → 연간 오차 약 ±2분 이내
- CR2032 배터리로 주 전원 차단 시에도 수년간 시간 유지
- I2C 인터페이스 (주소 0x68) → 배선 최소화
- 내장 온도 센서 (정확도 ±3°C)

Arduino 프로젝트에서의 활용:
- 데이터 로거 타임스탬프 (SD 카드 + DS3231 조합)
- 예약 작업 스케줄러 (특정 시각에 릴레이 on/off)
- 디지털 시계, 알람 시계 제작
- 정확한 시간 기반 IoT 이벤트 처리

---

## 모델 비교 표

| 모델 | 발진기 | 정확도 | 외부 수정 | 특징 |
|------|--------|--------|---------|------|
| DS3231 | TCXO 내장 | ±2ppm (0~40°C) | 불필요 | 고정밀, 비싸짐 |
| DS3232 | TCXO 내장 | ±2ppm | 불필요 | DS3231 + 236바이트 SRAM |
| DS1307 | 외부 수정 필요 | ±20ppm | 32.768kHz 필요 | 저렴, 정확도 낮음, 브레이크아웃에 수정 포함 |
| DS1337 | 외부 수정 필요 | ±20ppm | 필요 | DS1307 개량, SQW 출력 |
| PCF8523 | 외부 수정 필요 | ±2ppm | 필요 | 저전력, 용량성 로드 설정 |

> DS3231이 DS1307보다 10배 이상 정확합니다. 정확한 시간이 중요한 프로젝트에는 DS3231을 사용하세요.

---

## 핀 구성

### DS3231 모듈 (브레이크아웃 보드 기준, 표준 6핀)

```
[ 32K ] [ SQW ] [ SCL ] [ SDA ] [ VCC ] [ GND ]
  핀1     핀2     핀3     핀4     핀5     핀6
```

| 핀 | 이름 | 방향 | 기능 |
|----|------|------|------|
| 1 | 32K | 출력 | 32.768kHz 클럭 출력. 외부 클럭 소스로 사용 가능 |
| 2 | SQW | 출력/입력 | 구형파 출력 (1Hz, 1kHz, 4kHz, 8kHz 선택) 또는 알람 인터럽트 출력 (액티브 LOW) |
| 3 | SCL | 입력 | I2C 클럭 |
| 4 | SDA | 입출력 | I2C 데이터 |
| 5 | VCC | 전원 | 전원 입력 (3.3V ~ 5.5V) |
| 6 | GND | 전원 | 공통 접지 |

### 뒷면 배터리 홀더

- CR2032 코인 배터리 슬롯
- 주 전원 차단 시 배터리로 자동 전환 (내부 Schottky 다이오드로 자동 전환)
- 배터리만으로 약 8~10년 시간 유지 가능 (무부하 기준)

---

## 전기적 / 물리적 스펙 표

| 항목 | 값 | 단위 |
|------|-----|------|
| 전원 전압 (VCC) | 3.3 ~ 5.5 | V |
| 배터리 전압 (VBAT) | 2.3 ~ 5.5 | V |
| 배터리 전환 전압 | VCC < 배터리 전압 + 0.2 시 전환 | V |
| 동작 전류 (VCC=5V) | 약 0.2 ~ 0.3 | mA |
| 배터리 동작 전류 | 약 3 | μA |
| I2C 주소 | 0x68 (고정) | — |
| I2C 속도 | 400 | kHz (Fast Mode) |
| 시간 정확도 | ±2 | ppm (0~40°C) |
| 시간 오차 (연간) | 약 ±1 | 분/년 (최대 조건) |
| 온도 측정 범위 | −40 ~ 85 | °C |
| 온도 측정 정확도 | ±3 | °C |
| 온도 측정 해상도 | 0.25 | °C |
| 알람 수 | 2 | 개 |
| 출력 주파수 (SQW) | 1, 1024, 4096, 8192 | Hz 선택 |
| 32K 출력 | 32.768 | kHz |
| 동작 온도 | −40 ~ 85 | °C |
| 크기 (브레이크아웃) | 약 38 × 22 | mm |

---

## 동작 원리

### 내부 TCXO (온도 보정 수정 발진기)

DS3231 내부에는 32.768kHz 수정 발진기와 온도 센서가 있습니다.
온도가 변화하면 발진 주파수가 미세하게 변하는데, DS3231은 온도를 측정하여
내부 캐패시터 배열을 조정함으로써 주파수 편차를 보정합니다.

```
온도 측정 (64초마다) → 보정값 계산 → 캐패시터 어레이 조정 → 정확한 32.768kHz 유지
```

### I2C 레지스터 구조

| 레지스터 주소 | 내용 |
|------------|------|
| 0x00 | 초 (BCD) |
| 0x01 | 분 (BCD) |
| 0x02 | 시 (BCD, 12/24시간) |
| 0x03 | 요일 (1~7) |
| 0x04 | 일 (BCD) |
| 0x05 | 월/세기 (BCD) |
| 0x06 | 연도 (BCD, 00~99, 2000년 기준) |
| 0x07~0x0B | 알람 1 |
| 0x0C~0x0F | 알람 2 |
| 0x0E | 제어 레지스터 |
| 0x0F | 상태 레지스터 |
| 0x10 | 노화 오프셋 |
| 0x11 | 온도 상위 바이트 |
| 0x12 | 온도 하위 바이트 |

BCD(Binary-Coded Decimal): 각 10진수 숫자를 4비트로 별도 인코딩
예) 59분 = 0x59 (5는 0101, 9는 1001)

### 전원 전환 메커니즘

```
VCC > VBAT + 0.2V: 주 전원(VCC) 사용, 배터리 충전 회로 동작
VCC < VBAT:        배터리(VBAT)로 자동 전환, 시간 카운팅만 유지
```

---

## 아두이노 연결 방법

### Arduino Uno와 연결

```
DS3231 VCC ──── Arduino 5V
DS3231 GND ──── Arduino GND
DS3231 SCL ──── Arduino A5 (I2C SCL)
DS3231 SDA ──── Arduino A4 (I2C SDA)
DS3231 SQW ──── Arduino 핀 2 (인터럽트, 옵션)
DS3231 32K ──── 연결 안 함 (필요 시 외부 클럭 소스로 사용)
```

### ESP32-C3 Super Mini와 연결

```
DS3231 VCC ──── ESP32-C3 3V3
DS3231 GND ──── GND
DS3231 SCL ──── GPIO5 (I2C SCL, 기본 또는 Wire.begin(SDA,SCL) 지정)
DS3231 SDA ──── GPIO4 (I2C SDA)
DS3231 SQW ──── GPIO3 (인터럽트, 옵션)
```

### I2C 풀업 저항

```
SCL ──[4.7kΩ]──── 3.3V 또는 5V
SDA ──[4.7kΩ]──── 3.3V 또는 5V
```

DS3231 모듈 보드에 풀업 저항이 이미 내장된 경우가 많습니다. 확인 후 중복 사용 주의.

---

## 설정 방법 (RTClib 라이브러리)

### 라이브러리 설치

```
Arduino IDE → 라이브러리 관리자 → "RTClib" 검색
→ Adafruit의 "RTClib" 설치
```

### 시간 설정 및 읽기

```cpp
#include <Wire.h>
#include "RTClib.h"

RTC_DS3231 rtc;

// 요일 이름 배열
const char* DAYS[] = {"일", "월", "화", "수", "목", "금", "토"};

void setup() {
    Serial.begin(115200);
    Wire.begin();

    if (!rtc.begin()) {
        Serial.println("DS3231을 찾을 수 없습니다!");
        Serial.println("배선 확인: SDA, SCL 핀");
        while (true);
    }

    // 시간이 초기화되지 않았거나 전원이 끊겼던 경우
    if (rtc.lostPower()) {
        Serial.println("RTC 전원이 끊겼습니다. 시간을 설정합니다.");
        // 컴파일 시각으로 설정 (업로드 시각과 동일)
        rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
        // 수동으로 특정 시각 설정:
        // rtc.adjust(DateTime(2025, 1, 15, 10, 30, 0));
        // → 2025년 1월 15일 10시 30분 00초
    }
    Serial.println("DS3231 초기화 완료");
}

void loop() {
    DateTime now = rtc.now();

    // 시간 출력
    Serial.print(now.year());   Serial.print("/");
    Serial.print(now.month());  Serial.print("/");
    Serial.print(now.day());    Serial.print(" (");
    Serial.print(DAYS[now.dayOfTheWeek()]); Serial.print(") ");
    Serial.print(now.hour());   Serial.print(":");
    if (now.minute() < 10) Serial.print("0");
    Serial.print(now.minute()); Serial.print(":");
    if (now.second() < 10) Serial.print("0");
    Serial.println(now.second());

    delay(1000);
}
```

### 알람 설정 (SQW 핀 인터럽트 활용)

```cpp
#include <Wire.h>
#include "RTClib.h"

RTC_DS3231 rtc;
volatile bool alarmTriggered = false;
const int SQW_PIN = 2;

void alarmISR() {
    alarmTriggered = true;
}

void setup() {
    Serial.begin(115200);
    Wire.begin();
    rtc.begin();

    // 알람 1 설정: 매일 09:00:00에 발생
    rtc.setAlarm1(DateTime(0, 0, 0, 9, 0, 0), DS3231_A1_Hour);

    // 알람 2 설정: 매 1분마다 발생
    rtc.setAlarm2(DateTime(0, 0, 0, 0, 0, 0), DS3231_A2_PerMinute);

    // 알람 플래그 초기화
    rtc.clearAlarm(1);
    rtc.clearAlarm(2);

    // 알람 인터럽트 활성화
    rtc.writeSqwPinMode(DS3231_OFF);  // SQW를 알람 출력으로 설정

    pinMode(SQW_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(SQW_PIN), alarmISR, FALLING);
}

void loop() {
    if (alarmTriggered) {
        alarmTriggered = false;

        if (rtc.alarmFired(1)) {
            Serial.println("알람 1 발생! (09:00)");
            rtc.clearAlarm(1);
        }
        if (rtc.alarmFired(2)) {
            Serial.println("알람 2 발생! (1분 경과)");
            rtc.clearAlarm(2);
        }
    }
}
```

### 온도 읽기

```cpp
float readTemperature() {
    return rtc.getTemperature();
    // 반환값: float, 예) 25.25°C
}

void loop() {
    Serial.print("RTC 온도: ");
    Serial.print(readTemperature());
    Serial.println("°C");
    delay(5000);
}
```

### SD 카드 연동 타임스탬프 로깅

```cpp
#include <SPI.h>
#include <SD.h>
#include <Wire.h>
#include "RTClib.h"

RTC_DS3231 rtc;
const int SD_CS = 4;

void logData(float temp, float hum) {
    DateTime now = rtc.now();

    File f = SD.open("log.csv", FILE_WRITE);
    if (f) {
        // ISO 8601 형식 타임스탬프
        char timestamp[20];
        sprintf(timestamp, "%04d-%02d-%02d %02d:%02d:%02d",
            now.year(), now.month(), now.day(),
            now.hour(), now.minute(), now.second());

        f.print(timestamp);
        f.print(",");
        f.print(temp, 2);
        f.print(",");
        f.println(hum, 2);
        f.close();
    }
}
```

---

## 주의사항

1. **배터리 방향**: CR2032 배터리의 + 극이 위(보드 바깥쪽)를 향하도록 삽입. 반대로 넣으면 배터리 불필요하게 방전되거나 모듈 손상.
2. **충전 회로 주의**: 일부 DS3231 모듈에는 충전 회로(200Ω 저항 + 다이오드)가 달려 있어 CR2032를 충전하려 합니다. CR2032는 충전 불가형이므로 해당 저항을 제거하거나 모듈 선택 시 확인.
3. **lostPower() 확인 필수**: 처음 사용하거나 배터리 없이 전원이 끊겼다면 lostPower()가 true. 반드시 시간을 재설정해야 합니다.
4. **I2C 주소 충돌**: DS3231의 주소는 0x68로 고정. DS1307도 0x68을 사용하므로 동일 I2C 버스에 혼용 불가.
5. **Wire.begin() 먼저**: I2C 통신 전에 반드시 `Wire.begin()` 호출. ESP32에서는 `Wire.begin(SDA_PIN, SCL_PIN)` 형식으로 핀 지정.
6. **알람 플래그 수동 초기화**: 알람이 발생하면 플래그(Alarm Flag 비트)가 자동으로 세트되며, `rtc.clearAlarm(n)` 으로 수동 초기화해야 다음 알람이 발생합니다.

---

## 실사용 팁 및 회로 패턴

### NTP 시간으로 DS3231 동기화 (Wi-Fi 있는 경우)

```cpp
// ESP32에서 NTP 서버로 시간을 받아 DS3231에 저장
#include <WiFi.h>
#include <time.h>
#include "RTClib.h"

const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 9 * 3600;  // 한국 UTC+9
const int DAYLIGHT_OFFSET_SEC = 0;

void syncTimeFromNTP() {
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);

    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("NTP 동기화 실패");
        return;
    }

    // DS3231에 NTP 시간 저장
    DateTime ntpTime(
        timeinfo.tm_year + 1900,
        timeinfo.tm_mon + 1,
        timeinfo.tm_mday,
        timeinfo.tm_hour,
        timeinfo.tm_min,
        timeinfo.tm_sec
    );
    rtc.adjust(ntpTime);
    Serial.println("DS3231 NTP 동기화 완료");
}
```

### 저전력 슬립 + RTC 알람 웨이크업

```cpp
// ESP32 딥슬립, RTC 알람으로 깨우기
void setup() {
    if (alarmTriggered) {
        // 알람으로 깨어났을 때 처리
        doMeasurement();
        rtc.clearAlarm(1);
    }

    // 다음 알람 설정 (10분 후)
    DateTime now = rtc.now();
    DateTime nextAlarm = now + TimeSpan(0, 0, 10, 0);
    rtc.setAlarm1(nextAlarm, DS3231_A1_Minute);

    // ESP32 딥슬립 진입 (SQW 핀의 FALLING 엣지로 깨움)
    esp_sleep_enable_ext0_wakeup(GPIO_NUM_3, 0);  // SQW → GPIO3
    esp_deep_sleep_start();
}
```

### 한국 시간 형식 출력

```cpp
String formatDateTime(DateTime dt) {
    char buf[25];
    sprintf(buf, "%04d년 %02d월 %02d일 %02d시 %02d분 %02d초",
        dt.year(), dt.month(), dt.day(),
        dt.hour(), dt.minute(), dt.second());
    return String(buf);
}
```
