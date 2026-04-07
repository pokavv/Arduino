# Wi-Fi

ESP32-C3에는 Wi-Fi가 내장되어 있어서 별도 모듈 없이 인터넷 연결이 가능합니다.
**2.4GHz 전용** (5GHz 불가)

---

## 동작 모드 3가지

| 모드 | 설명 | 활용 |
|------|------|------|
| Station (STA) | 공유기에 연결하는 일반 클라이언트 모드 | 인터넷 연결, 서버에 데이터 전송 |
| Access Point (AP) | ESP32 자체가 공유기처럼 동작 | 스마트폰과 직접 연결, 설정 페이지 |
| STA + AP | 두 가지 동시 사용 | 공유기에 연결하면서 AP도 유지 |

---

## Station 모드 (공유기에 연결)

### 활용 예시
- 센서 데이터를 서버로 전송
- API 호출 (날씨, 주식 등 데이터 수신)
- MQTT 브로커에 연결
- NTP로 현재 시간 동기화

```cpp
#include <WiFi.h>

const char* ssid = "공유기이름";
const char* password = "비밀번호";

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);

    Serial.print("연결 중");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\n연결 완료!");
    Serial.print("IP 주소: ");
    Serial.println(WiFi.localIP());
    Serial.print("신호 강도: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
}
```

---

## AP 모드 (공유기처럼 동작)

### 활용 예시
- 스마트폰으로 ESP32 설정 페이지 접속
- Wi-Fi 비밀번호를 코드에 하드코딩 하지 않고 웹으로 입력
- 인터넷 없는 환경에서 로컬 제어

```cpp
#include <WiFi.h>

void setup() {
    Serial.begin(115200);
    WiFi.softAP("ESP32-AP", "12345678");  // 비밀번호 최소 8자

    Serial.print("AP IP: ");
    Serial.println(WiFi.softAPIP());      // 기본: 192.168.4.1
    // 스마트폰에서 "ESP32-AP" 에 연결 후 192.168.4.1 접속
}
```

---

## HTTP GET 요청 (외부 API 호출)

### 활용 예시
- OpenWeatherMap으로 날씨 데이터 받기
- ThingSpeak, Firebase 등에 센서 데이터 전송
- 서버에서 명령 받기

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// WiFi 연결 후...

void getData() {
    HTTPClient http;
    http.begin("http://api.example.com/sensor");
    int httpCode = http.GET();

    if (httpCode == 200) {
        String 응답 = http.getString();
        Serial.println(응답);
    } else {
        Serial.print("오류 코드: ");
        Serial.println(httpCode);
    }
    http.end();
}
```

---

## HTTP POST 요청 (데이터 전송)

```cpp
HTTPClient http;
http.begin("http://api.example.com/data");
http.addHeader("Content-Type", "application/json");

String 데이터 = "{\"temperature\":25.3,\"humidity\":60}";
int httpCode = http.POST(데이터);

Serial.println(httpCode);  // 200이면 성공
http.end();
```

---

## 웹서버 (스마트폰/PC로 제어)

### 활용 예시
- 스마트폰 브라우저로 GPIO 켜기/끄기
- 센서값을 웹페이지에 실시간 표시
- 간단한 스마트홈 컨트롤러

```cpp
#include <WiFi.h>
#include <WebServer.h>

WebServer server(80);  // 80번 포트 = HTTP 기본 포트

void handleRoot() {
    String html = "<h1>ESP32 웹서버</h1>";
    html += "<p><a href='/on'>켜기</a></p>";
    html += "<p><a href='/off'>끄기</a></p>";
    server.send(200, "text/html", html);
}

void handleOn() {
    digitalWrite(8, LOW);   // 내장 LED 켜기
    server.send(200, "text/plain", "LED ON");
}

void handleOff() {
    digitalWrite(8, HIGH);  // 내장 LED 끄기
    server.send(200, "text/plain", "LED OFF");
}

void setup() {
    pinMode(8, OUTPUT);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) delay(500);

    Serial.println(WiFi.localIP());  // 이 IP를 브라우저에 입력

    server.on("/", handleRoot);
    server.on("/on", handleOn);
    server.on("/off", handleOff);
    server.begin();
}

void loop() {
    server.handleClient();  // 클라이언트 요청 처리 (반드시 호출)
}
```

> 현재 `test/wifi-test/wifi-test.ino` 가 이 방식으로 구현되어 있습니다.

---

## Wi-Fi 관련 주요 함수

```cpp
WiFi.begin(ssid, password);     // 연결 시작
WiFi.status();                  // WL_CONNECTED = 연결됨
WiFi.localIP();                 // 할당된 IP 주소
WiFi.RSSI();                    // 신호 강도 (dBm, -30 ~ -90, 클수록 강함)
WiFi.macAddress();              // MAC 주소
WiFi.disconnect();              // 연결 끊기
WiFi.reconnect();               // 재연결
```
