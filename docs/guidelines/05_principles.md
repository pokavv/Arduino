# 구현 원칙

ESP32-C3 Super Mini 개발에서 지키는 핵심 원칙들입니다.

---

## 1. 단순함 우선 (KISS)

*Keep It Simple and Stupid*

필요한 기능만 구현합니다. 나중에 필요할 것 같아서 미리 만들지 않습니다.

```cpp
// ❌ 과도한 설계 — 지금 당장 필요하지 않은 것
class SensorManager {
    Sensor* sensors[MAX_SENSORS];
    int     sensorCount;
    bool    autoRetry;
    int     retryLimit;
    void    (*onError)(int);
    ...
};

// ✅ 지금 필요한 것만
float readTemperature() {
    return bme.readTemperature();
}
```

---

## 2. 논블로킹 원칙

`loop()` 는 최대한 빠르게 돌아야 합니다.
어떤 작업도 `loop()` 를 수백 ms 이상 멈추게 해서는 안 됩니다.

```
loop() 한 번 실행 시간 목표: < 10ms
허용 최대: < 50ms (사용자가 체감 못하는 수준)
```

```cpp
// ❌ loop를 멈추는 패턴들
void loop() {
    while (!client.connected()) { reconnect(); }  // 블로킹 재연결
    delay(5000);                                   // 긴 delay
    http.GET();                                    // 동기 HTTP (수 초 걸림)
}

// ✅ 논블로킹 패턴
void loop() {
    maintainMqtt();       // 연결 안 됐으면 시도, 아님 즉시 리턴
    handleWebServer();    // 요청 있으면 처리, 없으면 즉시 리턴
    checkSensors();       // 주기 안 됐으면 즉시 리턴
}
```

---

## 3. 하드웨어 값은 상단에서 한 번만 정의

핀 번호, 주파수, 임계값 등은 코드 상단에서 한 번만 정의합니다.
나중에 핀이 바뀌어도 한 곳만 수정하면 됩니다.

```cpp
// ✅ 파일 상단에 한 곳에서 정의
#define LED_PIN          8
#define BUTTON_PIN       9
#define SDA_PIN          8
#define SCL_PIN          9
#define TEMP_THRESHOLD   30.0f  // °C — 팬 켜는 온도
#define SEND_INTERVAL    10000  // ms — 데이터 전송 주기

// ❌ 여러 곳에 흩어진 숫자
if (analogRead(4) > 2048) ...    // A4? G4? 어디서 쓰는 핀?
if (millis() - t > 10000) ...    // 10초가 맞나? 다른 곳엔 9000 있던데
```

---

## 4. 안전한 GPIO 사용

```
규칙:
1. 모든 GPIO는 3.3V 기준 — 5V 신호 직접 연결 금지
2. 출력 핀에 부하 연결 시 전류 확인 (최대 40mA)
3. 고전류 부하(모터, LED 스트립)는 반드시 외부 전원 + 트랜지스터/모스펫
4. G0, G9는 부팅핀 — 부팅 시 로직 주의
5. 내장 LED(G8)는 Active LOW
```

```cpp
// 출력 전류 계산
// LED 1개: 약 20mA → GPIO 직접 연결 가능 (저항 필수)
// LED 여러 개: 합산 전류 주의 → 트랜지스터 사용
// 모터: 수백 mA ~ 수 A → 반드시 외부 전원 + 드라이버
```

---

## 5. 실패를 가정하고 설계

네트워크, 센서, 외부 서비스는 **항상 실패할 수 있다**고 가정합니다.

```cpp
// ✅ 실패 시 동작 정의
bool sendData(float temp) {
    if (WiFi.status() != WL_CONNECTED) {
        LOG_WARN("Wi-Fi 없음 — 로컬 저장");
        saveToFlash(temp);      // 오프라인 대응
        return false;
    }
    // 전송 시도...
}

// ✅ 타임아웃 설정
http.setTimeout(5000);  // 5초 후 포기
```

---

## 6. 전력 고려

배터리 사용 여부와 무관하게 불필요한 전력 낭비를 줄입니다.

```cpp
// Wi-Fi 사용 안 할 때는 끄기
WiFi.disconnect(true);
WiFi.mode(WIFI_OFF);

// 딥슬립 활용 (배터리 프로젝트)
// 10분마다 측정 → 나머지 9분 58초는 딥슬립
// 소비전류: 150mA → 10μA로 감소

// OLED 등 디스플레이: 표시 후 일정 시간 뒤 끄기
```

---

## 7. 재시작보다 복구

가능하면 재시작(ESP.restart())보다 오류에서 복구를 시도합니다.
재시작은 최후 수단입니다.

```cpp
// ❌ 문제 생기면 바로 재시작
if (!client.connected()) {
    ESP.restart();
}

// ✅ 재연결 먼저 시도
void maintainMqtt() {
    if (client.connected()) return;

    static int retries = 0;
    static unsigned long lastAttempt = 0;

    if (millis() - lastAttempt < 5000) return;  // 5초 쿨다운
    lastAttempt = millis();

    if (client.connect("ESP32C3")) {
        retries = 0;
        client.subscribe("home/#");
    } else {
        retries++;
        if (retries >= 10) {
            LOG_ERR("MQTT 10회 실패 — 재시작");
            ESP.restart();  // 정말 안 되면 재시작
        }
    }
}
```

---

## 8. 코드보다 주석이 먼저

구현 전에 주석으로 흐름을 먼저 작성합니다. 논리가 명확해집니다.

```cpp
void loop() {
    // 1. Wi-Fi/MQTT 연결 유지
    // 2. 웹서버 요청 처리
    // 3. 버튼 입력 확인
    // 4. 5초마다 센서 읽기
    // 5. 임계값 초과 시 알림 전송
    // 6. 30초마다 MQTT 데이터 발행

    maintainConnections();
    server.handleClient();
    checkButton();

    static unsigned long sensorMs = 0, mqttMs = 0;

    if (millis() - sensorMs >= 5000) {
        sensorMs = millis();
        float temp = readTemperature();
        if (temp > TEMP_THRESHOLD) sendAlert(temp);

        if (millis() - mqttMs >= 30000) {
            mqttMs = millis();
            publishSensorData(temp);
        }
    }
}
```

---

## 원칙 요약

| 원칙 | 한 줄 요약 |
|------|-----------|
| 단순함 우선 | 지금 필요한 것만 만든다 |
| 논블로킹 | loop()를 절대 멈추지 않는다 |
| 상수 중앙화 | 숫자는 상단에서 이름으로 한 번만 |
| 안전한 GPIO | 3.3V 기준, 전류 계산 필수 |
| 실패를 가정 | 네트워크/센서는 언제든 실패한다 |
| 전력 고려 | 불필요한 소비는 줄인다 |
| 복구 우선 | 재시작은 최후 수단 |
| 주석 먼저 | 구현 전에 흐름을 글로 쓴다 |
