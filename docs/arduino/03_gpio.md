# GPIO 디지털 입출력 (공통)

> ESP32-C3 전용 내용(INPUT_PULLDOWN, IRAM_ATTR, 내장 LED 반전 로직)은
> [esp32c3/03_gpio.md](../esp32c3/03_gpio.md) 참고

---

## 핀 모드 설정

```cpp
pinMode(핀번호, 모드);
```

| 모드 | 설명 |
|------|------|
| `OUTPUT` | 출력 — HIGH/LOW 신호를 내보냄 |
| `INPUT` | 입력 — 핀 상태 읽기 (플로팅 주의) |
| `INPUT_PULLUP` | 입력 + 내부 풀업 저항 — 모든 보드 지원 |

### INPUT vs INPUT_PULLUP

버튼을 `INPUT`으로 연결하면 안 눌렸을 때 핀이 플로팅(불안정) 상태가 됩니다.
`INPUT_PULLUP`은 내부 저항으로 핀을 HIGH로 잡아두어 안정적입니다.

```
INPUT_PULLUP 사용 시:
  버튼 안 눌림 → HIGH
  버튼 눌림   → LOW  (버튼이 GND와 연결)
```

---

## 디지털 출력

```cpp
digitalWrite(핀번호, HIGH);  // 3.3V (또는 5V) 출력
digitalWrite(핀번호, LOW);   // 0V 출력
```

---

## 디지털 입력

```cpp
int 상태 = digitalRead(핀번호);  // HIGH(1) 또는 LOW(0) 반환
```

---

## 기본 예제

### LED 켜기/끄기

```cpp
const int LED = 13;  // 우노 내장 LED

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    digitalWrite(LED, HIGH);  // 켜기
    delay(500);
    digitalWrite(LED, LOW);   // 끄기
    delay(500);
}
```

### 버튼으로 LED 제어

```cpp
const int 버튼 = 2;
const int LED = 13;

void setup() {
    pinMode(버튼, INPUT_PULLUP);
    pinMode(LED, OUTPUT);
}

void loop() {
    if (digitalRead(버튼) == LOW) {  // 눌리면 LOW
        digitalWrite(LED, HIGH);
    } else {
        digitalWrite(LED, LOW);
    }
}
```

---

## 핀 번호 주의사항

| 보드 | 디지털 핀 | 내장 LED |
|------|-----------|---------|
| 아두이노 우노 | 0 ~ 13 | 13번 (HIGH = 켜짐) |
| ESP32-C3 Super Mini | G0 ~ G10 | G8 (LOW = 켜짐, **반전**) |

> ⚠️ 0번, 1번 핀(우노)은 USB 시리얼과 공유되어 업로드 중 충돌 가능
