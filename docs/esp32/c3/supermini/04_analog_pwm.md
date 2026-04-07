# ADC & PWM — ESP32-C3 전용

> 기본 개념은 [arduino/04_analog_pwm.md](../arduino/04_analog_pwm.md) 참고

---

## ADC — 12비트 (0 ~ 4095)

아두이노 우노(10비트, 0~1023)보다 4배 세밀합니다.
사용 가능 핀: **G0 ~ G5**

```cpp
int 원시값 = analogRead(A0);            // 0 ~ 4095
float 전압 = 원시값 * (3.3 / 4095.0);  // 3.3V 기준 전압으로 변환
```

### Wi-Fi 사용 중 ADC 주의

Wi-Fi가 활성화되면 ADC 채널 2(G4~G5)의 값이 불안정해질 수 있습니다.
Wi-Fi와 함께 정밀한 아날로그 측정이 필요하면 **외부 ADC(ADS1115)** 사용을 권장합니다.

---

## PWM — ledcWrite()

ESP32는 `analogWrite()` 대신 `ledcWrite()`를 사용합니다.
모든 GPIO 핀에서 PWM이 가능하고, 독립적인 채널을 8개까지 쓸 수 있습니다.

```cpp
// 설정
ledcSetup(채널, 주파수Hz, 해상도비트);
ledcAttachPin(핀번호, 채널);

// 출력
ledcWrite(채널, 듀티값);  // 해상도에 따라 최대값 다름
```

### 채널/해상도 설정

| 매개변수 | 설명 | 일반적인 값 |
|---------|------|------------|
| 채널 | 0 ~ 7 (독립적으로 8개) | 0부터 순서대로 |
| 주파수 | Hz | LED: 5000, 서보: 50 |
| 해상도 | 비트 | 8비트(0~255), 10비트(0~1023) |

```cpp
// LED 밝기 조절 예제
const int LED핀 = 3;
const int 채널 = 0;

void setup() {
    ledcSetup(채널, 5000, 8);    // 채널0, 5kHz, 8비트
    ledcAttachPin(LED핀, 채널);
}

void loop() {
    for (int i = 0; i <= 255; i++) {
        ledcWrite(채널, i);
        delay(5);
    }
    for (int i = 255; i >= 0; i--) {
        ledcWrite(채널, i);
        delay(5);
    }
}
```

### 가변저항으로 LED 밝기 조절

```cpp
void loop() {
    int 센서값 = analogRead(A0);                    // 0 ~ 4095
    int 밝기 = map(센서값, 0, 4095, 0, 255);
    ledcWrite(채널, 밝기);
    delay(10);
}
```

### Arduino ESP32 코어 3.x 이상

최신 버전에서는 `analogWrite(핀, 값)`도 사용 가능합니다.
내부적으로 `ledcWrite`로 변환됩니다.
