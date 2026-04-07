# 코드 스타일 가이드

일관된 스타일은 코드를 읽기 쉽게 만들고 버그를 줄입니다.

---

## 네이밍 컨벤션

### 규칙 요약

| 종류 | 스타일 | 예시 |
|------|--------|------|
| 변수 | camelCase | `ledState`, `lastDebounce` |
| 함수 | camelCase | `readTemperature()`, `sendData()` |
| 상수 / #define | UPPER_SNAKE_CASE | `LED_PIN`, `MAX_RETRY` |
| 클래스 / 구조체 | PascalCase | `SensorData`, `WifiManager` |
| 전역변수 | camelCase (접두사 `g_` 선택) | `g_wifiConnected` |
| 인터럽트 핸들러 | camelCase + ISR 접미사 | `buttonISR()` |

```cpp
// 상수 — UPPER_SNAKE_CASE
#define LED_PIN       8
#define BUTTON_PIN    9
const int PWM_CHANNEL = 0;
const int MAX_RETRY   = 5;

// 변수 — camelCase
bool  ledState       = false;
float temperature    = 0.0f;
int   retryCount     = 0;
unsigned long lastMs = 0;

// 함수 — camelCase 동사로 시작
void  toggleLED();
float readTemperature();
bool  connectWiFi();
void  sendMqttData(float temp, float hum);

// 구조체 — PascalCase
struct SensorData {
    float temperature;
    float humidity;
    bool  valid;
};
```

### 의미 있는 이름

```cpp
// ❌ 나쁜 이름
int x, y, z;
float t, h;
bool f;
void doIt();

// ✅ 좋은 이름
int sensorRaw, pwmDuty, retryCount;
float temperature, humidity;
bool isConnected;
void sendSensorData();
```

### 약어 사용 기준

자주 쓰이는 약어만 허용합니다.

```cpp
// 허용
int   btn  = digitalRead(BUTTON_PIN);  // button
float temp = readTemp();               // temperature
int   hum  = readHum();                // humidity
int   ms   = millis();                 // milliseconds

// 비허용 — 줄이면 의미 불명확
int   t2  = ...;   // ??? (temp2? timer2?)
bool  flg = ...;   // ??? (flag?)
```

---

## 파일 구조 순서

모든 `.ino` 파일은 아래 순서를 따릅니다.

```cpp
// 1. 파일 헤더 주석
/**
 * @file  프로젝트명.ino
 * @brief 간단한 설명
 */

// 2. 라이브러리 include
#include <WiFi.h>
#include <WebServer.h>
#include "secrets.h"  // 민감 정보 (Wi-Fi 등)

// 3. 상수 / 핀 정의
#define LED_PIN     8
#define BUTTON_PIN  9
const int PWM_FREQ = 5000;

// 4. 전역 변수
bool  ledState    = false;
float temperature = 0.0f;
unsigned long lastSendMs = 0;

// 5. 객체 생성
WebServer server(80);

// 6. 함수 선언 (프로토타입)
void  handleRoot();
float readTemperature();

// 7. setup()
void setup() { ... }

// 8. loop()
void loop() { ... }

// 9. 함수 구현 (역할별 그룹화)
// --- Wi-Fi ---
bool connectWiFi() { ... }

// --- 센서 ---
float readTemperature() { ... }

// --- 웹서버 핸들러 ---
void handleRoot() { ... }
```

---

## 들여쓰기와 중괄호

```cpp
// 들여쓰기: 스페이스 4칸 (탭 대신)
void setup() {
    Serial.begin(115200);
    pinMode(LED_PIN, OUTPUT);
}

// 중괄호: 같은 줄에 여는 중괄호
if (condition) {
    doSomething();
} else {
    doOther();
}

// 한 줄짜리도 중괄호 생략하지 않음
// ❌
if (x > 5) doSomething();

// ✅
if (x > 5) {
    doSomething();
}
```

---

## 줄 길이와 공백

```cpp
// 한 줄은 80자 이하 권장 (길면 줄 나눔)
// ❌
if (temperature > HIGH_TEMP_THRESHOLD && humidity > HIGH_HUM_THRESHOLD && isWifiConnected) {

// ✅
bool tempHigh  = temperature > HIGH_TEMP_THRESHOLD;
bool humHigh   = humidity    > HIGH_HUM_THRESHOLD;
if (tempHigh && humHigh && isWifiConnected) {

// 연산자 앞뒤 공백
int result = a + b * c;       // ✅
int result = a+b*c;           // ❌

// 쉼표 뒤 공백
sendData(temp, hum, pressure);  // ✅
sendData(temp,hum,pressure);    // ❌

// 정렬 (관련 선언은 = 맞춤)
const int LED_PIN    = 8;
const int BUTTON_PIN = 9;
const int SDA_PIN    = 8;
const int SCL_PIN    = 9;
```

---

## 숫자 리터럴

```cpp
// 자료형 명시
float temp = 25.0f;        // f 접미사로 float 명시 (double 아님)
long  big  = 1000000L;     // L 접미사
unsigned long t = 5000UL;  // UL 접미사

// 가독성을 위한 구분 (C++14 이상)
// Arduino ESP32는 지원함
const long BAUD = 115'200;
const int  MASK = 0b1111'0000;

// 16진수 — 레지스터, 색상, I2C 주소
const byte I2C_ADDR   = 0x3C;
const long COLOR_RED  = 0xFF0000;

// 2진수 — 비트 마스크
const byte CONFIG_REG = 0b00110101;
```

---

## include 순서

```cpp
// 1. 아두이노/시스템 헤더 (꺾쇠)
#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>

// 2. ESP32 전용 헤더
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <esp_sleep.h>

// 3. 외부 라이브러리
#include <Adafruit_SSD1306.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// 4. 프로젝트 내 헤더 (따옴표)
#include "secrets.h"
#include "config.h"
```
