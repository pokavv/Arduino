# 딥슬립 (Deep Sleep) / 저전력

## 딥슬립이 뭔가요?

ESP32가 거의 모든 기능을 끄고 대기하는 초저전력 모드입니다.

| 상태 | 소비 전류 |
|------|-----------|
| 일반 동작 (Wi-Fi 포함) | ~150mA |
| 일반 동작 (Wi-Fi 없음) | ~20~80mA |
| 딥슬립 | **~5~10μA** |

쉽게 말해 **딥슬립 중에는 배터리를 거의 안 씁니다.**

딥슬립 후에는 `loop()`가 이어서 실행되는 게 아니라 **`setup()`부터 다시 실행**됩니다.

### 활용 예시

| 용도 | 동작 방식 |
|------|-----------|
| 배터리 온도 센서 | 10분마다 깨어나서 온도 측정 후 전송 → 다시 슬립 |
| 토양 수분 모니터링 | 30분마다 측정, 배터리로 수개월 운용 |
| 도어벨 | 버튼 눌릴 때만 깨어나서 알림 전송 |
| 야생동물 트랩 센서 | 적외선 감지 시 깨어나서 사진 촬영 |
| 스마트 전력계 | 매 시간 측정값 서버에 전송 |

---

## 슬립 모드 비교

| 모드 | 전류 | CPU | Wi-Fi/BT | 복귀 속도 |
|------|------|-----|----------|-----------|
| 활성 | ~80mA+ | 동작 | 동작 | — |
| 모뎀 슬립 | ~15mA | 동작 | 꺼짐 | 빠름 |
| 라이트 슬립 | ~0.8mA | 일시정지 | 꺼짐 | 빠름 |
| **딥 슬립** | **~10μA** | **꺼짐** | **꺼짐** | 수백ms |

---

## 타이머로 깨우기 (가장 많이 씀)

```cpp
#include <esp_sleep.h>

#define 슬립_초 30  // 30초마다 깨어남

void setup() {
    Serial.begin(115200);
    delay(100);

    // 깨어난 원인 확인
    esp_sleep_wakeup_cause_t 원인 = esp_sleep_get_wakeup_cause();
    if (원인 == ESP_SLEEP_WAKEUP_TIMER) {
        Serial.println("타이머로 깨어남 — 센서 측정 시작");
    } else {
        Serial.println("최초 부팅");
    }

    // ──── 할 일 처리 ────
    float 온도 = 25.3;  // 센서 읽기
    Serial.print("온도: ");
    Serial.println(온도);
    // Wi-Fi 연결 → 데이터 전송 → Wi-Fi 끊기
    // ────────────────────

    // 딥슬립 진입
    Serial.println("딥슬립 진입...");
    Serial.flush();  // 시리얼 버퍼 비우기
    esp_sleep_enable_timer_wakeup((uint64_t)슬립_초 * 1000000ULL);  // 마이크로초 단위
    esp_deep_sleep_start();
}

void loop() {}  // 딥슬립 후 setup()이 재실행되므로 사용 안 함
```

---

## 외부 GPIO로 깨우기

버튼이 눌리거나 센서가 신호를 보낼 때 깨어납니다.

```cpp
#include <esp_sleep.h>

void setup() {
    Serial.begin(115200);
    delay(100);

    esp_sleep_wakeup_cause_t 원인 = esp_sleep_get_wakeup_cause();
    if (원인 == ESP_SLEEP_WAKEUP_EXT0) {
        Serial.println("버튼으로 깨어남!");
        // 알림 전송, 동작 수행 등
    }

    // G9 핀이 LOW가 되면 깨어남 (0 = LOW, 1 = HIGH)
    esp_sleep_enable_ext0_wakeup(GPIO_NUM_9, 0);
    Serial.println("딥슬립 진입 — 버튼 누르면 깨어납니다");
    Serial.flush();
    esp_deep_sleep_start();
}

void loop() {}
```

---

## 실용 패턴: 배터리 센서 노드

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <esp_sleep.h>

#define 측정_간격_초 600  // 10분마다 측정

void setup() {
    Serial.begin(115200);

    // 센서 읽기
    float 온도 = 25.3;
    float 습도 = 60.0;

    // Wi-Fi 연결
    WiFi.begin("ssid", "password");
    int 시도 = 0;
    while (WiFi.status() != WL_CONNECTED && 시도++ < 20) delay(500);

    if (WiFi.status() == WL_CONNECTED) {
        // 데이터 전송
        HTTPClient http;
        http.begin("http://server.com/api");
        http.addHeader("Content-Type", "application/json");
        http.POST("{\"temp\":" + String(온도) + ",\"hum\":" + String(습도) + "}");
        http.end();
        WiFi.disconnect();
    }

    // 딥슬립 진입
    esp_sleep_enable_timer_wakeup((uint64_t)측정_간격_초 * 1000000ULL);
    esp_deep_sleep_start();
}

void loop() {}
```
