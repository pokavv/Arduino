# 아두이노 기본 구조

## 필수 두 함수

모든 아두이노 스케치에는 아래 두 함수가 반드시 있어야 합니다.

```cpp
void setup() {
    // 전원 켜지면 딱 한 번만 실행
    // 핀 설정, 시리얼 초기화, 라이브러리 초기화 등
}

void loop() {
    // setup() 이후 무한 반복 실행
    // 실제 동작 로직
}
```

### 실행 흐름

```
전원 ON
  ↓
setup() 한 번 실행
  ↓
loop() 실행
  ↓ (끝나면 다시 처음부터)
loop() 실행
  ↓
loop() 실행  ... (무한 반복)
```

---

## setup() 에서 하는 것들

```cpp
void setup() {
    Serial.begin(115200);       // 시리얼 통신 시작
    pinMode(8, OUTPUT);         // 핀 모드 설정
    pinMode(9, INPUT_PULLUP);   // 핀 모드 설정

    WiFi.begin(ssid, password); // 라이브러리 초기화
    display.begin();            // 외부 장치 초기화
}
```

## loop() 에서 하는 것들

```cpp
void loop() {
    // 센서 읽기
    int 값 = analogRead(A0);

    // 조건에 따른 동작
    if (값 > 500) {
        digitalWrite(8, HIGH);
    }

    // 주기적 실행 (millis 패턴 권장)
    delay(100);
}
```

---

## 자주 쓰는 내장 함수

### 시간

```cpp
delay(1000);              // 1000ms = 1초 멈춤 (블로킹)
unsigned long t = millis(); // 켜진 후 경과 시간 (ms)
unsigned long t = micros(); // 켜진 후 경과 시간 (μs)
```

### 수학

```cpp
map(값, in_min, in_max, out_min, out_max); // 범위 변환
constrain(값, 최소, 최대);                  // 범위 제한
abs(값);                                   // 절댓값
max(a, b);                                 // 더 큰 값
min(a, b);                                 // 더 작은 값
sqrt(값);                                  // 제곱근
pow(밑, 지수);                             // 거듭제곱
random(최대);                              // 0 ~ 최대-1 난수
random(최소, 최대);                         // 최소 ~ 최대-1 난수
```

### 비트 조작

```cpp
bitRead(값, 비트위치);         // 특정 비트 읽기
bitSet(값, 비트위치);          // 특정 비트 1로
bitClear(값, 비트위치);        // 특정 비트 0으로
bitWrite(값, 비트위치, 비트값); // 특정 비트 쓰기
highByte(값);                  // 상위 바이트
lowByte(값);                   // 하위 바이트
```

---

## .ino 파일 구조 팁

```cpp
// ① 라이브러리 포함 (맨 위)
#include <WiFi.h>
#include <Wire.h>

// ② 상수/핀 번호 정의
#define LED_PIN 8
const int 버튼핀 = 9;

// ③ 전역 변수
int 카운터 = 0;
bool 상태 = false;

// ④ 함수 선언 (선택)
void 데이터전송();

// ⑤ setup()
void setup() { }

// ⑥ loop()
void loop() { }

// ⑦ 보조 함수들
void 데이터전송() { }
```
