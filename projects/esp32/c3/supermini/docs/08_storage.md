# 플래시 저장 (Preferences)

## Preferences가 뭔가요?

ESP32는 4MB 플래시 메모리를 가지고 있습니다.
이 중 일부를 Key-Value 방식으로 데이터 저장에 쓸 수 있습니다.
**전원이 꺼져도 데이터가 유지**됩니다.

아두이노 우노의 EEPROM과 비슷한 개념이지만 더 사용하기 편합니다.

### 활용 예시

| 용도 | 설명 |
|------|------|
| Wi-Fi 비밀번호 저장 | 한 번 입력하면 다음 부팅에도 자동 연결 |
| 설정값 유지 | 밝기, 모드, 임계값 등 재부팅 후에도 유지 |
| 부팅 횟수 카운팅 | 몇 번 재시작했는지 추적 |
| 마지막 상태 기억 | 전원 끄기 전 LED 상태를 저장, 켜면 복원 |
| 캘리브레이션 값 | 센서 보정값 저장 |
| 사용자 설정 | 알람 시간, 목표 온도 등 |

---

## 기본 사용법

```cpp
#include <Preferences.h>

Preferences prefs;

void setup() {
    Serial.begin(115200);

    // 네임스페이스 열기 (같은 이름끼리 그룹화)
    // false = 읽기/쓰기 모드, true = 읽기 전용
    prefs.begin("my-app", false);

    // 읽기 (두 번째 인자: 키가 없을 때 반환할 기본값)
    int 카운터 = prefs.getInt("count", 0);
    Serial.print("부팅 횟수: ");
    Serial.println(카운터);

    // 쓰기
    prefs.putInt("count", 카운터 + 1);

    prefs.end();  // 반드시 닫기
}

void loop() {}
```

---

## 지원 데이터 타입

```cpp
// 쓰기
prefs.putInt("key", 123);
prefs.putFloat("key", 3.14);
prefs.putString("key", "hello");
prefs.putBool("key", true);
prefs.putUInt("key", 4294967295U);   // unsigned int
prefs.putLong("key", 123456789L);

// 읽기
int    a = prefs.getInt("key", 0);
float  b = prefs.getFloat("key", 0.0);
String c = prefs.getString("key", "기본값");
bool   d = prefs.getBool("key", false);

// 삭제
prefs.remove("key");   // 특정 키만 삭제
prefs.clear();         // 네임스페이스 전체 삭제
```

---

## 실용 예제: 마지막 LED 상태 기억

```cpp
#include <Preferences.h>

Preferences prefs;
const int LED = 8;

void setup() {
    Serial.begin(115200);
    pinMode(LED, OUTPUT);

    prefs.begin("settings", false);
    bool 마지막상태 = prefs.getBool("led", false);

    // 마지막 상태로 복원
    digitalWrite(LED, 마지막상태 ? LOW : HIGH);
    Serial.println(마지막상태 ? "LED 켜짐으로 복원" : "LED 꺼짐으로 복원");
    prefs.end();
}
```

---

## 주의사항

> ⚠️ 플래시 메모리는 **쓰기 횟수 한계**가 있습니다 (약 10만 회).
> `loop()` 에서 매번 쓰지 말고, **값이 바뀔 때만** 저장하세요.

```cpp
// 나쁜 예 — 매 루프마다 저장 (수명 단축)
void loop() {
    prefs.putInt("val", analogRead(A0));  // 금지!
    delay(100);
}

// 좋은 예 — 값이 바뀔 때만 저장
void loop() {
    int 새값 = analogRead(A0);
    if (새값 != 이전값) {
        prefs.putInt("val", 새값);
        이전값 = 새값;
    }
}
```
