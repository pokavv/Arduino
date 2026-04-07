# 전처리기 (#define, #include, #ifdef)

## 전처리기가 뭔가요?

컴파일(코드를 기계어로 변환) 전에 실행되는 특수 명령어입니다.
`#` 으로 시작하며, 코드를 문자 단위로 치환하거나 파일을 포함시킵니다.

---

## #include — 파일/라이브러리 포함

다른 파일의 코드를 현재 파일에 삽입합니다.

```cpp
#include <WiFi.h>           // 꺾쇠: 시스템 라이브러리 (설치된 라이브러리)
#include "내파일.h"          // 따옴표: 프로젝트 내 직접 만든 파일
#include <Arduino.h>        // 아두이노 기본 함수들 (보통 자동 포함)
```

---

## #define — 매크로 상수 / 매크로 함수

### 상수 정의

```cpp
#define LED_PIN 8
#define MAX_BRIGHTNESS 255
#define WIFI_SSID "MyNetwork"

// 사용하면 컴파일 전에 텍스트 치환됨
// digitalWrite(LED_PIN, LOW);
// → digitalWrite(8, LOW);  로 변환됨
```

### const vs #define

```cpp
const int LED_PIN = 8;   // 타입 있음, 디버거에서 보임 → 권장
#define LED_PIN 8        // 타입 없음, 단순 텍스트 치환 → 구식

// #define은 타입이 없어서 실수하기 쉬움
#define 값 10 + 5
int x = 값 * 2;    // 기대: 30 — 실제: 10 + 5 * 2 = 20 (괄호 없어서!)
```

### 매크로 함수 (간단한 연산)

```cpp
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define ABS(x)    ((x) >= 0 ? (x) : -(x))
#define CLAMP(x, lo, hi) (MAX(lo, MIN(x, hi)))

int 큰값 = MAX(3, 7);    // 7
int 작은값 = MIN(3, 7);  // 3
```

> 매크로 함수는 인자를 항상 괄호로 감싸야 합니다. 그렇지 않으면 우선순위 버그가 생깁니다.

---

## #ifdef / #ifndef / #endif — 조건부 컴파일

조건에 따라 코드를 포함하거나 제외합니다.

### 헤더 가드 (중복 포함 방지)

```cpp
// 내파일.h
#ifndef 내파일_H      // 이 매크로가 정의 안 됐으면
#define 내파일_H      // 정의하고

// 헤더 내용...

#endif               // 끝
```

### 디버그 모드 전환

```cpp
#define DEBUG   // 이 줄을 주석처리하면 디버그 출력이 전부 사라짐

#ifdef DEBUG
    #define LOG(msg) Serial.println(msg)
    #define LOGF(fmt, ...) Serial.printf(fmt, __VA_ARGS__)
#else
    #define LOG(msg)          // 아무것도 안 함
    #define LOGF(fmt, ...)    // 아무것도 안 함
#endif

void loop() {
    float 온도 = 25.3;
    LOG("센서 읽기 완료");
    LOGF("온도: %.1f\n", 온도);
    // DEBUG 정의 삭제 시 위 두 줄은 컴파일에서 제거됨 → 성능 향상
}
```

### 보드별 코드 분기

```cpp
#ifdef ESP32
    // ESP32 전용 코드
    #include <WiFi.h>
#elif defined(ARDUINO_AVR_UNO)
    // 아두이노 우노 전용 코드
    #include <SoftwareSerial.h>
#endif
```

---

## 자주 쓰는 내장 매크로

```cpp
__FILE__        // 현재 파일명
__LINE__        // 현재 줄 번호
__FUNCTION__    // 현재 함수명
__DATE__        // 컴파일 날짜
__TIME__        // 컴파일 시각

// 디버그 출력에 활용
Serial.printf("[%s:%d] 오류 발생\n", __FILE__, __LINE__);
```

---

## pgmspace — 플래시 메모리에 상수 저장 (우노 한정)

아두이노 우노는 RAM이 2KB뿐입니다.
긴 문자열을 RAM 대신 플래시 메모리(32KB)에 저장할 수 있습니다.

```cpp
#include <avr/pgmspace.h>

// PROGMEM: 플래시에 저장
const char 긴문자열[] PROGMEM = "이것은 플래시에 저장된 긴 문자열입니다";

void setup() {
    Serial.println(F("F() 매크로로 플래시에 저장"));  // F() 매크로가 간편함
    Serial.println(F("RAM 절약 가능"));
}
```

> ESP32는 RAM이 400KB라 PROGMEM/F() 매크로를 쓸 필요가 없습니다.
