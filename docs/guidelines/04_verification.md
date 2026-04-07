# 소스코드 검증 가이드

업로드 전, 실행 중, 문제 발생 시 확인해야 할 체크리스트와 방법입니다.

---

## 업로드 전 체크리스트

```
□ 컴파일 오류 없음 (체크 버튼으로 확인)
□ 핀 번호가 상수로 정의되어 있음
□ secrets.h 파일이 있고 .gitignore에 포함됨
□ 사용하지 않는 #include 제거됨
□ delay() 가 loop() 주기 제어에 쓰이지 않음
□ unsigned long 으로 millis() 저장
□ 인터럽트 공유 변수에 volatile 선언
□ 5V 신호를 GPIO에 직접 연결하지 않음
□ 보드 설정: ESP32C3 Dev Module, USB CDC On Boot: Enabled
```

---

## 시리얼 디버깅

가장 기본적이고 강력한 디버깅 방법입니다.

### 디버그 매크로 패턴

```cpp
// 파일 상단에 정의
#define DEBUG  // 이 줄 주석처리 시 모든 디버그 출력 제거됨

#ifdef DEBUG
    #define LOG(msg)         Serial.println(msg)
    #define LOGF(fmt, ...)   Serial.printf(fmt "\n", __VA_ARGS__)
    #define LOG_ERR(msg)     Serial.println("[ERROR] " + String(msg))
    #define LOG_WARN(msg)    Serial.println("[WARN]  " + String(msg))
    #define LOG_INFO(msg)    Serial.println("[INFO]  " + String(msg))
#else
    #define LOG(msg)
    #define LOGF(fmt, ...)
    #define LOG_ERR(msg)
    #define LOG_WARN(msg)
    #define LOG_INFO(msg)
#endif

// 사용
LOG_INFO("Wi-Fi 연결 시도...");
LOGF("온도: %.1f°C, 습도: %.1f%%", temp, hum);
LOG_ERR("MQTT 연결 실패");
```

### 타임스탬프 포함 로그

```cpp
void log(const char* level, const char* msg) {
    Serial.printf("[%8lu] [%s] %s\n", millis(), level, msg);
}

// 출력 예시:
// [    1023] [INFO]  Wi-Fi 연결 완료
// [    1540] [INFO]  IP: 192.168.1.42
// [   12301] [WARN]  온도 임계값 초과: 41.2°C
```

---

## 단계별 검증 방법

### 1단계 — 하드웨어 연결 확인

새 부품 연결 시 먼저 단독으로 동작 확인합니다.

```cpp
// I2C 장치 스캔으로 연결 확인
#include <Wire.h>

void setup() {
    Serial.begin(115200);
    Wire.begin(8, 9);

    Serial.println("I2C 스캔...");
    int found = 0;
    for (byte addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            Serial.printf("  발견: 0x%02X\n", addr);
            found++;
        }
    }
    if (found == 0) Serial.println("  장치 없음 — 배선 확인");
}
```

### 2단계 — 센서 단독 테스트

```cpp
// 센서만 읽는 최소한의 코드로 먼저 확인
void loop() {
    float temp = bme.readTemperature();
    float hum  = bme.readHumidity();

    if (isnan(temp) || isnan(hum)) {
        Serial.println("[ERROR] 센서 읽기 실패");
    } else {
        Serial.printf("온도: %.1f°C, 습도: %.1f%%\n", temp, hum);
    }
    delay(2000);
}
```

### 3단계 — 통신 테스트

```cpp
// Wi-Fi 연결만 먼저 확인
void setup() {
    Serial.begin(115200);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry++ < 20) {
        delay(500);
        Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[OK] Wi-Fi 연결됨");
        Serial.println(WiFi.localIP());
        Serial.printf("신호강도: %d dBm\n", WiFi.RSSI());
    } else {
        Serial.println("\n[FAIL] 연결 실패");
        // 2.4GHz 인지 확인, SSID/비번 확인
    }
}
```

### 4단계 — 통합 테스트

개별 요소가 동작 확인되면 합칩니다.

---

## GPIO 검증

```cpp
// 모든 핀 순서대로 켰다 끄기 — 핀 번호 확인용
void setup() {
    Serial.begin(115200);
    int testPins[] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    for (int pin : testPins) {
        Serial.printf("핀 G%d 테스트...\n", pin);
        pinMode(pin, OUTPUT);
        digitalWrite(pin, HIGH);
        delay(300);
        digitalWrite(pin, LOW);
        delay(300);
    }
    Serial.println("GPIO 테스트 완료");
}
```

---

## 메모리 검증

```cpp
void setup() {
    Serial.begin(115200);
    Serial.printf("시작 시 여유 힙: %d bytes\n", ESP.getFreeHeap());
}

void loop() {
    static unsigned long lastCheck = 0;
    static int          loopCount  = 0;
    loopCount++;

    // 30초마다 메모리 확인
    if (millis() - lastCheck >= 30000) {
        lastCheck = millis();
        Serial.printf("[메모리] 루프: %d, 여유 힙: %d bytes\n",
                      loopCount, ESP.getFreeHeap());
    }
}
```

여유 힙이 지속적으로 감소하면 메모리 누수입니다.

---

## 타이밍 검증

millis 타이머가 정확한지 확인합니다.

```cpp
unsigned long timerA = 0;
int           count  = 0;

void loop() {
    if (millis() - timerA >= 1000) {
        timerA = millis();
        count++;
        Serial.printf("[%d초] millis: %lu\n", count, millis());
    }
}
// 출력값이 1000ms 간격인지 확인
```

---

## 장시간 안정성 검증

배포 전 **최소 1시간 이상** 연속 실행 테스트를 합니다.

```cpp
// 장시간 테스트용 상태 출력
void setup() {
    Serial.begin(115200);
    Serial.println("=== 장시간 안정성 테스트 시작 ===");
}

unsigned long startMs    = 0;
unsigned long loopCount  = 0;
int           wifiDrops  = 0;
bool          prevWifi   = false;

void loop() {
    loopCount++;
    bool currWifi = (WiFi.status() == WL_CONNECTED);

    if (prevWifi && !currWifi) {
        wifiDrops++;
        Serial.printf("[%lus] Wi-Fi 끊김 #%d\n", millis()/1000, wifiDrops);
    }
    prevWifi = currWifi;

    // 5분마다 상태 요약
    static unsigned long lastReport = 0;
    if (millis() - lastReport >= 300000) {
        lastReport = millis();
        Serial.printf("=== 상태 [%lu분 경과] ===\n", millis()/60000);
        Serial.printf("  루프 횟수: %lu\n",  loopCount);
        Serial.printf("  Wi-Fi 끊김: %d회\n", wifiDrops);
        Serial.printf("  여유 힙: %d bytes\n", ESP.getFreeHeap());
    }
}
```

---

## 자주 겪는 버그 패턴

| 증상 | 원인 | 확인 방법 |
|------|------|-----------|
| 업로드 후 바로 리셋 반복 | 스택 오버플로우 / 크래시 | 시리얼 출력 확인, Guru Meditation 메시지 |
| 수 시간 후 멈춤 | 메모리 누수 | 힙 모니터링 |
| 센서값이 계속 0 | 핀 번호 오류 / 배선 불량 | I2C 스캔, 핀 번호 재확인 |
| Wi-Fi 연결 후 ADC 튐 | Wi-Fi 전파 간섭 | 외부 ADC 사용 / 여러 번 읽어 평균 |
| delay 중 버튼 미감지 | 블로킹 delay | millis 패턴으로 교체 |
| 인터럽트 불안정 | volatile 누락 | 공유 변수에 volatile 추가 |
| 부팅 안 됨 | G9 핀 LOW 고정 | G9 핀 연결 확인 (부팅핀) |
