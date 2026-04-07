# 아날로그 입력 & PWM 출력 (공통)

> ESP32-C3 전용 내용(12-bit ADC, ledcWrite)은
> [esp32c3/04_analog_pwm.md](../esp32c3/04_analog_pwm.md) 참고

---

## 아날로그 입력 (ADC)

디지털이 0 또는 1만 읽는다면, ADC는 **연속적인 전압값을 숫자로 변환**합니다.

| 보드 | 해상도 | 반환값 | 기준전압 |
|------|--------|--------|---------|
| 아두이노 우노 | 10비트 | 0 ~ 1023 | 5V |
| ESP32-C3 | 12비트 | 0 ~ 4095 | 3.3V |

```cpp
int 값 = analogRead(A0);            // 핀에서 읽기
float 전압 = 값 * (5.0 / 1023.0);  // 우노 기준 전압 변환
```

### 자주 쓰는 센서

| 센서 | 용도 |
|------|------|
| 가변저항 | 볼륨, 밝기 조절 |
| CDS(조도센서) | 밝기에 따른 자동 제어 |
| 토양수분 센서 | 자동 화분 물주기 |
| LM35 | 아날로그 온도 센서 |
| 조이스틱 | X/Y 축 기울기 읽기 |

---

## map() — 범위 변환

```cpp
// map(값, 입력최소, 입력최대, 출력최소, 출력최대)
int 밝기 = map(analogRead(A0), 0, 1023, 0, 255);  // 우노
int 밝기 = map(analogRead(A0), 0, 4095, 0, 255);  // ESP32

int 각도 = map(analogRead(A0), 0, 1023, 0, 180);  // 서보 각도로 변환
```

---

## PWM 출력

HIGH와 LOW를 매우 빠르게 반복하여 **마치 아날로그처럼** 동작시킵니다.
LED 밝기, 모터 속도, 서보 제어에 사용합니다.

### 아두이노 우노 — analogWrite()

`~` 표시 핀만 PWM 가능 (3, 5, 6, 9, 10, 11번)

```cpp
analogWrite(9, 0);    // 꺼짐
analogWrite(9, 128);  // 약 50% 밝기
analogWrite(9, 255);  // 최대 밝기
```

### ESP32-C3 — ledcWrite()

모든 핀에서 PWM 가능. 별도 채널 설정 필요.

```cpp
ledcSetup(채널, 주파수, 해상도);
ledcAttachPin(핀, 채널);
ledcWrite(채널, 0~255);
```

→ 자세한 내용은 [esp32c3/04_analog_pwm.md](../esp32c3/04_analog_pwm.md)

---

## 예제: 가변저항으로 LED 밝기 조절 (우노)

```cpp
void setup() {
    // 우노: PWM 핀은 별도 설정 불필요
}

void loop() {
    int 센서 = analogRead(A0);              // 0 ~ 1023
    int 밝기 = map(센서, 0, 1023, 0, 255);  // 0 ~ 255 변환
    analogWrite(9, 밝기);
    delay(10);
}
```
