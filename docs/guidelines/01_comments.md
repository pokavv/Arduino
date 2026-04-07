# 주석 가이드

좋은 주석은 코드가 **무엇을 하는지(what)** 가 아니라 **왜 하는지(why)** 를 설명합니다.
코드를 읽으면 무엇을 하는지는 알 수 있지만, 왜 그렇게 했는지는 알 수 없기 때문입니다.

---

## 주석의 원칙

### 좋은 주석 vs 나쁜 주석

```cpp
// ❌ 나쁜 주석 — 코드를 그대로 설명 (읽으면 아는 것)
i++;  // i를 1 증가시킨다

// ✅ 좋은 주석 — 이유를 설명
i++;  // 다음 센서 채널로 이동 (채널은 0부터 시작)
```

```cpp
// ❌ 나쁜 주석 — 명백한 내용
digitalWrite(8, LOW);  // 8번 핀에 LOW 출력

// ✅ 좋은 주석 — 하드웨어 특성 설명
digitalWrite(8, LOW);  // 내장 LED 켜기 (Active LOW: LOW = ON)
```

```cpp
// ❌ 나쁜 주석 — 오래되어 코드와 불일치 (주석이 거짓말)
// 온도가 30도 이상이면 팬 켜기
if (temp > 40) { ... }

// ✅ 최신 상태 유지
// 40도 이상에서 팬 켜기 (30→40으로 변경: 너무 잦은 켜짐 방지)
if (temp > 40) { ... }
```

---

## 파일 헤더 주석

모든 `.ino` 파일 최상단에 작성합니다.

```cpp
/**
 * @file    wifi_led_control.ino
 * @brief   Wi-Fi 웹서버로 내장 LED를 ON/OFF 제어
 *
 * @board   ESP32-C3 Super Mini
 * @author  pokavv
 * @date    2025-04-07
 *
 * 연결:
 *   - 내장 LED: GPIO 8 (Active LOW)
 *
 * 사용 라이브러리:
 *   - WiFi.h (ESP32 내장)
 *   - WebServer.h (ESP32 내장)
 *
 * 동작:
 *   1. Wi-Fi 연결
 *   2. 웹서버 시작 (포트 80)
 *   3. 브라우저에서 IP 접속 → LED 제어 페이지
 */
```

---

## 함수 주석

함수 정의 바로 위에 작성합니다.

```cpp
/**
 * @brief  ADC 값을 여러 번 읽어 평균을 반환 (노이즈 제거)
 *
 * @param  pin    읽을 ADC 핀 번호 (A0~A5)
 * @param  count  읽기 횟수 (기본값: 10)
 * @return 0.0 ~ 3.3V 범위의 전압값
 *
 * @note   Wi-Fi 활성화 중에는 ADC 값이 불안정할 수 있음
 */
float readVoltage(int pin, int count = 10) {
    long sum = 0;
    for (int i = 0; i < count; i++) {
        sum += analogRead(pin);
        delay(2);
    }
    return (sum / count) * (3.3f / 4095.0f);
}
```

짧고 자명한 함수는 한 줄 주석으로도 충분합니다.

```cpp
// 내장 LED 토글 (LOW=ON, HIGH=OFF 반전 로직)
void toggleLED() {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
}
```

---

## 섹션 구분 주석

긴 파일에서 영역을 나눌 때 씁니다.

```cpp
// ===================================================
// 핀 정의
// ===================================================
#define LED_PIN     8
#define BUTTON_PIN  9

// ===================================================
// 전역 변수
// ===================================================
bool ledState = false;
unsigned long lastDebounce = 0;

// ===================================================
// Wi-Fi / 서버
// ===================================================
WebServer server(80);
```

---

## 인라인 주석

코드 오른쪽에 짧게 씁니다. 하드웨어 특성, 단위, 범위를 명시할 때 유용합니다.

```cpp
const int BUTTON_PIN    = 9;     // Active LOW (INPUT_PULLUP)
const int PWM_CHANNEL   = 0;     // ledcSetup 채널 (0~7)
const int PWM_FREQ      = 5000;  // Hz
const int PWM_RESOLUTION = 8;    // 비트 (0~255)

float temp = readTemp();         // °C 단위
int   raw  = analogRead(A0);     // 0 ~ 4095 (12비트 ADC)
int   duty = map(raw, 0, 4095, 0, 255);  // ADC → PWM 범위 변환
```

---

## TODO / FIXME / HACK 주석

임시 코드나 할 일을 표시합니다.

```cpp
// TODO: 딥슬립 추가 — 배터리 사용 시 필요
// TODO: OTA 업데이트 적용

// FIXME: Wi-Fi 재연결 시 간헐적으로 멈추는 문제 있음
// FIXME: ADC 값이 Wi-Fi 켜면 튀는 문제 미해결

// HACK: 라이브러리 버그로 인해 delay(10) 없으면 크래시
//       라이브러리 업데이트 후 제거 예정
Wire.begin(8, 9);
delay(10);  // HACK
```

---

## 주석 금지 패턴

```cpp
// ❌ 주석으로 코드 비활성화 — 그냥 삭제할 것 (git이 기억함)
// digitalWrite(LED_PIN, HIGH);
// delay(500);

// ❌ 당연한 내용
// setup 함수
void setup() { }

// ❌ 번역 주석 (영어 코드를 한국어로 그대로 번역)
// 만약 x가 5보다 크다면
if (x > 5) { }

// ❌ 오래된 주석 방치
// 예전에는 GPIO 13이었음 → 지금은 8로 바뀌었는데 주석 방치
#define LED_PIN 8  // GPIO 13
```

---

## 하드웨어 연결 주석

회로 연결 정보는 파일 상단이나 핀 정의 근처에 명시합니다.

```cpp
/**
 * 회로 연결
 * ┌─────────────────────────────────────┐
 * │ ESP32-C3     │ 부품                 │
 * ├─────────────────────────────────────┤
 * │ G8 (내장 LED)│ —                   │
 * │ G9           │ 버튼 → GND          │
 * │ G8 (SDA)     │ OLED SDA            │
 * │ G9 (SCL)     │ OLED SCL            │
 * │ 3.3V         │ OLED VCC            │
 * │ GND          │ OLED GND, 버튼 GND  │
 * └─────────────────────────────────────┘
 */
```
