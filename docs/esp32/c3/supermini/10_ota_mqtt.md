# OTA 무선 업로드 & MQTT

---

## OTA (Over-The-Air)

### OTA가 뭔가요?

USB 케이블 없이 **Wi-Fi로 코드를 업로드**하는 기능입니다.
보드가 벽 속에 설치되어 있거나 꺼내기 어려운 곳에 있을 때 유용합니다.

### 활용 예시
- 천장에 설치된 센서 펌웨어 업데이트
- 여러 대의 ESP32를 동시에 업데이트
- 원격지에 설치된 장치 유지보수
- 운영 중에 버그 수정

### OTA 동작 방식

```
1. ESP32가 Wi-Fi에 연결되어 OTA 대기 상태
2. Arduino IDE에서 도구 → 포트 → 네트워크 포트 선택
3. 업로드 버튼 클릭 → Wi-Fi로 새 코드 전송
4. ESP32가 새 코드로 재시작
```

```cpp
#include <WiFi.h>
#include <ArduinoOTA.h>

const char* ssid = "공유기이름";
const char* password = "비밀번호";

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) delay(500);
    Serial.println(WiFi.localIP());

    ArduinoOTA.setHostname("esp32c3-living-room");  // 네트워크에서 보이는 이름
    ArduinoOTA.setPassword("ota1234");              // OTA 업로드 비밀번호

    ArduinoOTA.onStart([]() {
        Serial.println("OTA 업로드 시작...");
    });
    ArduinoOTA.onEnd([]() {
        Serial.println("OTA 완료, 재시작");
    });
    ArduinoOTA.onProgress([](unsigned int 진행, unsigned int 전체) {
        Serial.printf("진행: %u%%\n", (진행 / (전체 / 100)));
    });
    ArduinoOTA.onError([](ota_error_t e) {
        Serial.print("OTA 오류: "); Serial.println(e);
    });

    ArduinoOTA.begin();
    Serial.println("OTA 준비 완료");
}

void loop() {
    ArduinoOTA.handle();  // OTA 요청 처리 — 반드시 loop에서 호출
    // 실제 동작 코드...
}
```

> ⚠️ **보안 주의:** OTA 비밀번호를 꼭 설정하세요. 없으면 같은 네트워크 누구든 코드를 올릴 수 있습니다.

---

## MQTT

### MQTT가 뭔가요?

IoT에서 가장 많이 쓰는 **경량 메시지 전송 프로토콜**입니다.
**발행(Publish) / 구독(Subscribe)** 구조로 동작합니다.

중간에 **브로커(서버)** 가 있고, 여러 장치가 브로커를 통해 메시지를 주고받습니다.

```
[ESP32 온도센서] → publish "집/거실/온도" → [브로커] → subscribe → [스마트폰 앱]
[스마트폰 앱]   → publish "집/거실/에어컨" → [브로커] → subscribe → [ESP32 에어컨]
```

### HTTP vs MQTT 비교

| 항목 | HTTP | MQTT |
|------|------|------|
| 방식 | 요청-응답 (1:1) | 발행-구독 (1:N) |
| 연결 | 매번 새로 연결 | 상시 연결 유지 |
| 데이터 크기 | 헤더가 큼 | 헤더가 매우 작음 |
| 실시간성 | 낮음 | 높음 |
| 주 용도 | REST API | IoT, 실시간 제어 |

### 활용 예시
- 집 안 여러 센서 데이터 중앙 수집
- Node-RED, Home Assistant와 연동
- 스마트폰 앱에서 ESP32 실시간 제어
- 여러 ESP32 장치 간 통신

### 라이브러리 설치

라이브러리 관리자에서 `PubSubClient` 검색 후 설치

### 기본 예제

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "공유기이름";
const char* password = "비밀번호";
const char* mqtt_server = "broker.hivemq.com";  // 무료 공개 브로커

WiFiClient espClient;
PubSubClient mqtt(espClient);

// 메시지 수신 콜백 — 구독한 토픽에 메시지 오면 자동 실행
void 메시지수신(char* topic, byte* payload, unsigned int length) {
    String 메시지 = "";
    for (int i = 0; i < length; i++) 메시지 += (char)payload[i];

    Serial.print("토픽: "); Serial.println(topic);
    Serial.print("메시지: "); Serial.println(메시지);

    // 명령에 따라 동작
    if (String(topic) == "집/거실/LED") {
        if (메시지 == "ON")  digitalWrite(8, LOW);
        if (메시지 == "OFF") digitalWrite(8, HIGH);
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(8, OUTPUT);

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) delay(500);

    mqtt.setServer(mqtt_server, 1883);
    mqtt.setCallback(메시지수신);
}

void loop() {
    // 연결 끊기면 재연결
    if (!mqtt.connected()) {
        if (mqtt.connect("ESP32C3-Client")) {
            Serial.println("MQTT 연결됨");
            mqtt.subscribe("집/거실/LED");  // 이 토픽 구독
        }
    }

    mqtt.loop();  // 메시지 수신 처리 — 반드시 호출

    // 10초마다 온도 발행
    static unsigned long 마지막발행 = 0;
    if (millis() - 마지막발행 > 10000) {
        마지막발행 = millis();
        float 온도 = 25.3;
        mqtt.publish("집/거실/온도", String(온도).c_str());
    }
}
```

### 무료 공개 MQTT 브로커

| 브로커 | 주소 | 포트 | 비고 |
|--------|------|------|------|
| HiveMQ | `broker.hivemq.com` | 1883 | 테스트용 |
| EMQX | `broker.emqx.io` | 1883 | 테스트용 |
| Mosquitto (로컬) | 직접 설치 | 1883 | 개인 서버 |

> 실제 서비스에서는 공개 브로커 대신 **비밀번호가 설정된 개인 브로커**를 사용하세요.
