# 아두이노 실전 패턴

자주 반복되는 코딩 패턴들을 모아놨습니다.

---

## 1. 논블로킹 타이머 (millis 패턴)

가장 중요한 패턴. → 자세한 설명은 [06_timing.md](06_timing.md)

```cpp
unsigned long 타이머 = 0;

void loop() {
    if (millis() - 타이머 >= 1000) {
        타이머 = millis();
        // 1초마다 실행
    }
}
```

---

## 2. 버튼 디바운싱

버튼의 물리적 떨림(바운싱)으로 인한 오입력을 소프트웨어로 제거합니다.

```cpp
const int 버튼핀 = 9;
int 이전상태 = HIGH;
int 확정상태 = HIGH;
unsigned long 마지막변화 = 0;
const int 디바운스 = 50;  // ms

void loop() {
    int 읽은값 = digitalRead(버튼핀);

    if (읽은값 != 이전상태) 마지막변화 = millis();

    if (millis() - 마지막변화 >= 디바운스) {
        if (읽은값 != 확정상태) {
            확정상태 = 읽은값;
            if (확정상태 == LOW) {
                Serial.println("버튼 확정 눌림");
            }
        }
    }
    이전상태 = 읽은값;
}
```

---

## 3. 상태 머신 (State Machine)

동작을 "상태"로 나눠 관리합니다. 복잡한 흐름 제어에 필수입니다.

```cpp
enum 상태타입 { 대기, 측정중, 전송중, 오류 };
상태타입 상태 = 대기;

void loop() {
    switch (상태) {
        case 대기:
            if (버튼눌림()) 상태 = 측정중;
            break;

        case 측정중:
            float 값 = 센서읽기();
            상태 = (값 > 0) ? 전송중 : 오류;
            break;

        case 전송중:
            상태 = 전송(값) ? 대기 : 오류;
            break;

        case 오류:
            LED빠르게깜빡();
            delay(3000);
            상태 = 대기;
            break;
    }
}
```

---

## 4. 시리얼 명령어 처리

```cpp
void setup() {
    Serial.begin(115200);
    Serial.println("명령어: on, off, status");
}

void loop() {
    if (Serial.available()) {
        String 명령 = Serial.readStringUntil('\n');
        명령.trim();  // 앞뒤 공백/개행 제거

        if      (명령 == "on")     { digitalWrite(8, LOW);  Serial.println("ON"); }
        else if (명령 == "off")    { digitalWrite(8, HIGH); Serial.println("OFF"); }
        else if (명령 == "status") { Serial.println(digitalRead(8) == LOW ? "ON" : "OFF"); }
        else                       { Serial.println("모르는 명령: " + 명령); }
    }
}
```

---

## 5. Wi-Fi 자동 재연결

```cpp
unsigned long 마지막재연결 = 0;

void WiFi재연결확인() {
    if (WiFi.status() == WL_CONNECTED) return;
    if (millis() - 마지막재연결 < 30000) return;  // 30초에 한 번만 시도

    마지막재연결 = millis();
    Serial.println("Wi-Fi 재연결...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
}

void loop() {
    WiFi재연결확인();
    // 나머지 코드
}
```

---

## 6. 센서 평균값 (노이즈 제거)

```cpp
float 평균읽기(int 핀, int 횟수 = 10) {
    long 합 = 0;
    for (int i = 0; i < 횟수; i++) {
        합 += analogRead(핀);
        delay(2);
    }
    return (float)합 / 횟수;
}

void loop() {
    float 값 = 평균읽기(A0, 20);  // 20번 읽어서 평균
}
```

---

## 7. 초기 설정 복원 패턴

```cpp
#include <Preferences.h>
Preferences prefs;

void setup() {
    prefs.begin("cfg", false);

    if (!prefs.getBool("init", false)) {
        // 첫 부팅: 기본값 저장
        prefs.putFloat("threshold", 30.0);
        prefs.putInt("brightness", 128);
        prefs.putBool("init", true);
        Serial.println("초기화 완료");
    } else {
        // 이후 부팅: 저장값 복원
        float 임계값 = prefs.getFloat("threshold", 30.0);
        int 밝기 = prefs.getInt("brightness", 128);
        Serial.println("설정 복원 완료");
    }
    prefs.end();
}
```

---

## 8. 조기 반환으로 중첩 줄이기

```cpp
// ❌ 중첩이 깊어지는 방식
void 전송() {
    if (WiFi연결됨) {
        if (센서값 > 0) {
            if (시간이됐음) {
                // 실제 코드
            }
        }
    }
}

// ✅ 조기 반환으로 깔끔하게
void 전송() {
    if (!WiFi연결됨) return;
    if (센서값 <= 0)  return;
    if (!시간이됐음)  return;

    // 실제 코드 (모든 조건 통과 후)
}
```

---

## 9. 값 변화 감지 (엣지 감지)

```cpp
int 이전값 = -1;

void loop() {
    int 현재값 = digitalRead(핀);

    if (현재값 != 이전값) {
        // 값이 바뀌었을 때만 실행
        Serial.println("변화 감지: " + String(현재값));
        이전값 = 현재값;
    }
}
```
