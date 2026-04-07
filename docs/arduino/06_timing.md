# 타이밍 (delay vs millis)

---

## delay() — 단순 대기

```cpp
delay(1000);   // 1000ms = 1초 완전 정지
delay(500);    // 500ms = 0.5초
```

**문제점:** delay() 중에는 아두이노가 아무것도 하지 못합니다.
버튼 입력, 시리얼 수신, 다른 LED 제어 — 전부 무시됩니다.

```cpp
// 나쁜 예: delay 중에 버튼을 눌러도 감지 못함
void loop() {
    digitalWrite(LED, HIGH);
    delay(2000);             // 2초 동안 완전 블로킹
    digitalWrite(LED, LOW);
    delay(2000);
}
```

---

## millis() — 논블로킹 타이머

`millis()`는 아두이노가 켜진 후 경과한 시간(ms)을 반환합니다.
이것으로 "시간이 얼마나 지났는지"를 체크하면 delay 없이 주기적 실행이 가능합니다.

```cpp
unsigned long 이전시간 = 0;

void loop() {
    unsigned long 지금 = millis();

    if (지금 - 이전시간 >= 1000) {  // 1초 경과 여부 확인
        이전시간 = 지금;
        // 1초마다 실행할 코드
        digitalWrite(LED, !digitalRead(LED));
    }

    // 여기는 항상 실행됨 — 버튼, 센서 등 처리 가능
    if (digitalRead(버튼) == LOW) { /* 즉시 감지 */ }
}
```

### 여러 타이머 동시에

```cpp
unsigned long 타이머A = 0, 타이머B = 0;

void loop() {
    unsigned long 지금 = millis();

    if (지금 - 타이머A >= 500) {    // 0.5초마다
        타이머A = 지금;
        LED토글();
    }

    if (지금 - 타이머B >= 5000) {   // 5초마다
        타이머B = 지금;
        센서데이터전송();
    }
}
```

---

## millis() 오버플로우

`millis()`는 `unsigned long` (약 42억)이 최대입니다.
약 49일 후 0으로 초기화(오버플로우)됩니다.

`unsigned long`으로 저장하면 오버플로우 이후에도 계산이 **자동으로 정상 동작**합니다.

```cpp
unsigned long 이전 = 0;  // ✅ unsigned long 필수

// int나 long 으로 받으면 49일 후 버그 발생
int 이전 = 0;            // ❌ 절대 이렇게 쓰지 말 것
```

---

## micros() — 마이크로초

더 짧은 시간 간격이 필요할 때 씁니다. (1ms = 1000μs)

```cpp
unsigned long 시작 = micros();
// 짧은 작업
unsigned long 경과 = micros() - 시작;
Serial.print(경과); Serial.println(" μs");
```

---

## delay() 언제 써도 되나?

- `setup()` 초기화 중 짧은 대기 (OK)
- 디버깅용 (OK)
- loop()에서 다른 입력을 전혀 처리하지 않아도 되는 단순한 코드 (OK)
- loop()에서 버튼, 센서, 통신과 함께 쓸 때 (❌ millis 사용)
