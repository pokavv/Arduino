# GPIO — ESP32-C3 전용

> 기본 개념(pinMode, digitalWrite, digitalRead)은 [arduino/03_gpio.md](../arduino/03_gpio.md) 참고

---

## ESP32-C3 전용 핀 모드

아두이노와 달리 `INPUT_PULLDOWN`을 지원합니다.

```cpp
pinMode(핀, INPUT_PULLDOWN);  // 내부 풀다운 — 안 눌리면 LOW, 눌리면 HIGH
```

| 모드 | 미입력 상태 | 버튼 눌림 |
|------|------------|-----------|
| `INPUT_PULLUP` | HIGH | LOW |
| `INPUT_PULLDOWN` | LOW | HIGH |

---

## 내장 LED (G8)

GPIO 8에 연결, **반전 로직** — LOW가 켜짐입니다.

```cpp
#define LED_BUILTIN 8

void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
    digitalWrite(LED_BUILTIN, LOW);   // 켜기
    delay(500);
    digitalWrite(LED_BUILTIN, HIGH);  // 끄기
    delay(500);
}
```

---

## 인터럽트

`delay()` 중이어도 즉시 반응합니다.

```cpp
volatile bool 눌림 = false;  // 인터럽트와 공유 → volatile 필수

void IRAM_ATTR 버튼ISR() {   // IRAM_ATTR 필수 — 인터럽트 핸들러를 빠른 RAM에 올림
    눌림 = true;
}

void setup() {
    Serial.begin(115200);
    pinMode(9, INPUT_PULLUP);
    attachInterrupt(9, 버튼ISR, FALLING);  // G9 핀, 하강 엣지에서 트리거
}

void loop() {
    if (눌림) {
        Serial.println("버튼!");
        눌림 = false;
    }
    delay(500);  // delay 중에도 인터럽트 감지됨
}
```

| 트리거 | 설명 |
|--------|------|
| `FALLING` | HIGH → LOW (풀업 버튼 눌릴 때) |
| `RISING` | LOW → HIGH (풀다운 버튼 눌릴 때) |
| `CHANGE` | 어느 방향이든 변화 시 |

### 인터럽트 함수 작성 규칙
- 최대한 짧게 (플래그 세팅 정도만)
- `delay()` 사용 불가
- `Serial.print()` 사용 금지
- 공유 변수에 반드시 `volatile`

---

## 핀 주의사항

| 핀 | 주의 |
|----|------|
| G0 | 부팅핀 — 부팅 시 LOW면 다운로드 모드 진입 |
| G9 | 부팅핀 — 플래시 모드 선택 |
| G8 | 내장 LED 연결 (반전 로직) |
| 모든 핀 | **3.3V 기준. 5V 직접 연결 금지** |
