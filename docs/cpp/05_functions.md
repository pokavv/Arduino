# 함수

## 함수가 뭔가요?

함수는 **특정 동작을 하는 코드 묶음에 이름을 붙인 것**입니다.
같은 코드를 여러 번 쓰는 대신 함수로 만들면 한 번만 작성하고 여러 번 호출할 수 있습니다.

```cpp
반환타입 함수이름(매개변수) {
    // 코드
    return 반환값;  // 반환타입이 void면 생략 가능
}
```

---

## 반환값 없는 함수 (void)

```cpp
void LED켜기() {
    digitalWrite(8, LOW);
}

void LED끄기() {
    digitalWrite(8, HIGH);
}

// 호출
void loop() {
    LED켜기();
    delay(500);
    LED끄기();
    delay(500);
}
```

---

## 매개변수 있는 함수

함수를 호출할 때 값을 넘겨줄 수 있습니다.

```cpp
void LED밝기설정(int 밝기) {
    ledcWrite(0, 밝기);
}

void loop() {
    LED밝기설정(100);   // 밝기 100
    delay(500);
    LED밝기설정(255);   // 밝기 255
    delay(500);
}
```

### 매개변수 여러 개

```cpp
void 핀출력(int 핀번호, int 값) {
    digitalWrite(핀번호, 값);
}

핀출력(4, HIGH);
핀출력(5, LOW);
```

---

## 반환값 있는 함수

```cpp
// int를 반환하는 함수
int 두수의합(int a, int b) {
    return a + b;   // return 뒤에 반환할 값
}

// float를 반환하는 함수
float 섭씨_화씨변환(float 섭씨) {
    return (섭씨 * 9.0 / 5.0) + 32.0;
}

// bool을 반환하는 함수
bool WiFi연결됨() {
    return WiFi.status() == WL_CONNECTED;
}

void loop() {
    int 합 = 두수의합(3, 5);             // 합 = 8
    float 화씨 = 섭씨_화씨변환(25.0);    // 화씨 = 77.0

    if (WiFi연결됨()) {
        Serial.println("연결됨");
    }
}
```

---

## 기본값 있는 매개변수 (C++ 기능)

매개변수에 기본값을 지정하면 호출할 때 생략 가능합니다.

```cpp
void 깜빡이기(int 횟수 = 3, int 간격 = 500) {
    for (int i = 0; i < 횟수; i++) {
        digitalWrite(8, LOW);
        delay(간격);
        digitalWrite(8, HIGH);
        delay(간격);
    }
}

깜빡이기();           // 3번, 500ms 간격
깜빡이기(5);          // 5번, 500ms 간격
깜빡이기(10, 100);    // 10번, 100ms 간격
```

---

## 함수 선언 (프로토타입)

C/C++는 위에서 아래로 읽기 때문에, 사용하기 전에 함수가 정의되어 있어야 합니다.
함수를 아래에 정의하고 위에서 쓰려면 **선언(프로토타입)** 을 먼저 해야 합니다.

```cpp
// 파일 맨 위에 선언 (세미콜론으로 끝남)
float 온도읽기();
void 경보울리기(int 횟수);

void setup() { }

void loop() {
    float 온도 = 온도읽기();   // 아래 정의된 함수를 위에서 호출 가능
    if (온도 > 40) {
        경보울리기(3);
    }
}

// 아래에 실제 정의
float 온도읽기() {
    return analogRead(A0) * 0.1;
}

void 경보울리기(int 횟수) {
    for (int i = 0; i < 횟수; i++) {
        tone(부저핀, 1000, 200);
        delay(300);
    }
}
```

> 아두이노 IDE는 `.ino` 파일에서 자동으로 프로토타입을 만들어줘서 생략해도 되는 경우가 많습니다.

---

## 재귀 함수

함수가 자기 자신을 호출하는 것입니다.
아두이노에서는 스택 메모리가 작아서 **깊은 재귀는 위험**합니다.

```cpp
int 팩토리얼(int n) {
    if (n <= 1) return 1;       // 탈출 조건 (반드시 있어야 함!)
    return n * 팩토리얼(n - 1); // 자기 자신 호출
}

// 팩토리얼(5) = 5 × 4 × 3 × 2 × 1 = 120
```

---

## 함수 잘 만드는 법

### 하나의 함수는 하나의 일만

```cpp
// 나쁜 예 — 너무 많은 일을 하나의 함수에서
void 모든것처리() {
    센서읽기();
    WiFi연결();
    데이터전송();
    LED제어();
    소리울리기();
}

// 좋은 예 — 역할 분리
float 온도측정() { return analogRead(A0) * 0.1; }
bool 서버에전송(float 온도) { /* HTTP 요청 */ }
void 상태LED업데이트(bool 성공) { /* LED 제어 */ }

void loop() {
    float 온도 = 온도측정();
    bool 성공 = 서버에전송(온도);
    상태LED업데이트(성공);
}
```

### 함수 이름은 동사로

```cpp
// 나쁜 이름
void data() { }
void led() { }

// 좋은 이름
void 센서데이터전송() { }
void LED켜기() { }
bool WiFi연결확인() { }
float 온도읽기() { }
```
