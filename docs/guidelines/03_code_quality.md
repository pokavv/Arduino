# 코드 품질 가이드

---

## 함수 설계

### 함수는 하나의 일만

```cpp
// ❌ 너무 많은 일을 하는 함수
void handleEverything() {
    // 센서 읽기
    float temp = analogRead(A0) * 0.1;
    // Wi-Fi 확인
    if (WiFi.status() != WL_CONNECTED) WiFi.begin(ssid, pass);
    // MQTT 전송
    client.publish("home/temp", String(temp).c_str());
    // LED 업데이트
    digitalWrite(LED_PIN, temp > 30 ? LOW : HIGH);
    // OLED 출력
    display.clearDisplay();
    display.println(temp);
    display.display();
}

// ✅ 역할 분리
float    readTemperature();
bool     ensureWiFi();
bool     publishMqtt(const char* topic, float value);
void     updateLED(float temp);
void     updateDisplay(float temp);

void loop() {
    float temp = readTemperature();
    if (ensureWiFi()) publishMqtt("home/temp", temp);
    updateLED(temp);
    updateDisplay(temp);
}
```

### 함수 길이

함수는 **화면 한 페이지(약 30~40줄)** 안에 들어오는 것이 이상적입니다.
그보다 길면 분리를 고려합니다.

---

## 전역 변수 관리

전역 변수는 어디서든 수정 가능해서 버그 원인을 찾기 어렵게 만듭니다.
꼭 필요한 경우만 씁니다.

### 전역 변수가 필요한 경우
- `setup()`과 `loop()` 양쪽에서 접근해야 할 때
- 인터럽트 핸들러와 공유할 때 (`volatile` 필수)
- `millis()` 타이머 기준 시간 저장

```cpp
// ✅ 전역 변수가 정당한 경우들
volatile bool buttonPressed = false;  // 인터럽트 공유
unsigned long lastSendMs    = 0;      // millis 타이머
WebServer     server(80);             // 라이브러리 객체

// ❌ 전역으로 쓸 필요 없는 경우 (함수 내 지역 변수로 충분)
int tempRaw;       // loop에서만 쓰는데 전역으로 선언
String response;   // handleRoot에서만 쓰는 HTML 문자열
```

---

## 매직 넘버 금지

코드 안에 의미 없이 쓰인 숫자를 매직 넘버라고 합니다.
반드시 이름 있는 상수로 대체합니다.

```cpp
// ❌ 매직 넘버
if (analogRead(A0) > 2048) { }
delay(30000);
ledcSetup(0, 5000, 8);
esp_sleep_enable_timer_wakeup(600 * 1000000ULL);

// ✅ 이름 있는 상수
const int   MOISTURE_THRESHOLD = 2048;    // 수분 센서 임계값 (절반)
const int   SEND_INTERVAL_MS   = 30000;   // 30초마다 전송
const int   PWM_CHANNEL        = 0;
const int   PWM_FREQ           = 5000;    // Hz
const int   PWM_RESOLUTION     = 8;       // 비트
const int   SLEEP_SECONDS      = 600;     // 10분 딥슬립

if (analogRead(A0) > MOISTURE_THRESHOLD) { }
delay(SEND_INTERVAL_MS);
ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
esp_sleep_enable_timer_wakeup((uint64_t)SLEEP_SECONDS * 1000000ULL);
```

---

## delay() 사용 규칙

`delay()`는 CPU를 완전히 멈춥니다. 아래 기준으로 사용합니다.

| 상황 | 허용 여부 |
|------|-----------|
| `setup()` 초기화 대기 | ✅ 허용 |
| 디버깅/테스트 | ✅ 허용 |
| 센서 읽기 전 안정화 대기 (짧게) | ✅ 허용 (10~50ms) |
| `loop()` 내 반복 주기 제어 | ❌ millis() 사용 |
| 버튼/센서와 함께 사용 | ❌ millis() 사용 |
| 500ms 이상 대기 | ❌ millis() 사용 |

```cpp
// ❌ loop에서 delay로 주기 제어
void loop() {
    float temp = readTemp();
    sendData(temp);
    delay(10000);  // 버튼 입력, 웹 요청 전부 무시됨
}

// ✅ millis로 논블로킹
unsigned long lastSendMs = 0;

void loop() {
    server.handleClient();      // 항상 처리
    checkButton();              // 항상 처리

    if (millis() - lastSendMs >= 10000) {
        lastSendMs = millis();
        sendData(readTemp());
    }
}
```

---

## 에러 처리

실패 가능한 작업은 반드시 결과를 확인합니다.

```cpp
// ❌ 결과 무시
WiFi.begin(ssid, password);
client.connect("ESP32");
bme.begin(0x76);

// ✅ 결과 확인 + 처리
// Wi-Fi 연결
int retry = 0;
WiFi.begin(ssid, password);
while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500);
    retry++;
}
if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] Wi-Fi 연결 실패");
    // 오프라인 모드로 전환 또는 재시작
    return;
}

// 센서 초기화
if (!bme.begin(0x76)) {
    Serial.println("[ERROR] BME280 초기화 실패 — 주소 확인 (0x76 or 0x77)");
    while (true) delay(1000);  // 센서 없으면 진행 불가능한 경우
}
```

---

## 민감 정보 분리

Wi-Fi 비밀번호, API 키 등은 코드에 직접 쓰지 않습니다.

```cpp
// ❌ 코드에 직접 하드코딩 (GitHub에 올라가면 노출!)
WiFi.begin("MyHomeWiFi", "password1234");
client.connect("broker.io", "user", "secretkey");

// ✅ secrets.h 로 분리 (.gitignore에 포함)
#include "secrets.h"
WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
```

```cpp
// secrets.h (이 파일은 Git에 포함되지 않음)
#pragma once
const char* WIFI_SSID     = "MyHomeWiFi";
const char* WIFI_PASSWORD = "password1234";
const char* MQTT_USER     = "user";
const char* MQTT_PASS     = "secretkey";
```

---

## String 사용 주의

`String` 클래스는 heap을 사용해서 장시간 운용 시 메모리 단편화가 생길 수 있습니다.

```cpp
// ❌ loop에서 String 계속 생성 (장시간 운용 시 불안정)
void loop() {
    String msg = "온도: " + String(temp) + "°C";
    Serial.println(msg);
    delay(1000);
}

// ✅ char 버퍼 + snprintf 사용
void loop() {
    char buf[32];
    snprintf(buf, sizeof(buf), "온도: %.1f°C", temp);
    Serial.println(buf);
    delay(1000);
}

// ✅ 또는 Serial.printf 직접 사용 (ESP32에서 지원)
void loop() {
    Serial.printf("온도: %.1f°C, 습도: %.1f%%\n", temp, hum);
    delay(1000);
}
```

---

## 메모리 모니터링

장시간 운용 프로젝트에서는 메모리 누수를 주기적으로 확인합니다.

```cpp
void printMemoryInfo() {
    Serial.printf("[MEM] 여유 힙: %d bytes\n", ESP.getFreeHeap());
    Serial.printf("[MEM] 최소 힙: %d bytes\n", ESP.getMinFreeHeap());
}

void loop() {
    // 10분마다 메모리 출력
    static unsigned long lastMemCheck = 0;
    if (millis() - lastMemCheck >= 600000) {
        lastMemCheck = millis();
        printMemoryInfo();
    }
}
```

여유 힙이 계속 줄어든다면 → `String` 사용 줄이기, 동적 할당 확인
