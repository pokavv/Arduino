# 포인터와 참조 (C++ 핵심)

포인터는 C/C++에서 가장 어려운 개념 중 하나입니다.
처음엔 헷갈려도 괜찮습니다. 아두이노에서 꼭 직접 쓰지 않아도 되지만,
라이브러리 사용 시 자주 마주치므로 개념은 알아야 합니다.

---

## 메모리 주소란?

모든 변수는 메모리 어딘가에 저장됩니다.
각 저장 위치에는 **주소(번지)**가 있습니다.

```cpp
int x = 42;

// x의 값:   42
// x의 주소: 예를 들어 0x3FFC0010 (실제 주소는 매번 다름)
```

`&` 연산자로 변수의 주소를 가져올 수 있습니다.

```cpp
int x = 42;
Serial.println(&x, HEX);   // x의 메모리 주소 출력 (16진수)
```

---

## 포인터

**포인터는 메모리 주소를 저장하는 변수**입니다.

```cpp
int x = 42;
int* p = &x;    // p는 x의 주소를 저장 (포인터 선언: 타입* 이름)

Serial.println(x);    // 42       — x의 값
Serial.println(&x);   // 주소     — x의 메모리 주소
Serial.println(p);    // 주소     — p가 가리키는 주소 (x의 주소)
Serial.println(*p);   // 42       — p가 가리키는 곳의 값 (역참조)
```

### & 와 * 헷갈림 정리

```
선언할 때:  int* p       → p는 int를 가리키는 포인터
사용할 때:  &x           → x의 주소를 가져옴
사용할 때:  *p           → p가 가리키는 곳의 값 (역참조)
```

### 포인터로 값 변경

```cpp
int x = 42;
int* p = &x;

*p = 100;           // p가 가리키는 곳(x)에 100을 저장
Serial.println(x);  // 100 — x가 바뀜!
```

---

## 함수에서 포인터/참조 사용

### 값 전달 vs 포인터 전달

C에서는 함수에 변수를 넘기면 **복사본**이 전달됩니다.
함수 안에서 값을 바꿔도 원본은 바뀌지 않습니다.

```cpp
void 두배로(int x) {
    x = x * 2;   // 복사본만 바뀜
}

void setup() {
    int a = 5;
    두배로(a);
    Serial.println(a);  // 5 — 바뀌지 않음!
}
```

포인터를 쓰면 원본을 바꿀 수 있습니다.

```cpp
void 두배로(int* x) {
    *x = *x * 2;   // 포인터가 가리키는 원본을 바꿈
}

void setup() {
    int a = 5;
    두배로(&a);          // 주소를 넘김
    Serial.println(a);   // 10 — 원본이 바뀜!
}
```

---

## 참조 (C++ 전용)

참조는 포인터보다 쉬운 방법으로 같은 효과를 냅니다.
`*`, `&` 기호가 헷갈리는 포인터 대신 쓸 수 있습니다.

```cpp
void 두배로(int& x) {    // &를 붙이면 참조
    x = x * 2;           // 그냥 쓰면 됨, * 불필요
}

void setup() {
    int a = 5;
    두배로(a);           // 그냥 넘기면 됨, & 불필요
    Serial.println(a);   // 10
}
```

### 참조로 여러 값 반환

C에서 함수는 return으로 값을 하나만 반환할 수 있습니다.
참조 매개변수를 쓰면 여러 값을 "반환"할 수 있습니다.

```cpp
void 온습도읽기(float& 온도, float& 습도) {
    온도 = 25.3;  // 참조로 원본 변경
    습도 = 60.0;
}

void loop() {
    float t, h;
    온습도읽기(t, h);    // t=25.3, h=60.0 이 됨
    Serial.println(t);
    Serial.println(h);
}
```

---

## 배열과 포인터

배열 이름은 첫 번째 원소의 포인터와 같습니다.

```cpp
int 배열[] = {10, 20, 30};
int* p = 배열;     // 배열[0]의 주소

Serial.println(*p);       // 10 — 첫 번째 원소
Serial.println(*(p+1));   // 20 — 두 번째 원소
Serial.println(*(p+2));   // 30 — 세 번째 원소

// 포인터 증가로 배열 순회
for (int i = 0; i < 3; i++) {
    Serial.println(*(p + i));
}
```

---

## 아두이노 라이브러리에서 포인터 마주치는 경우

직접 포인터를 안 써도 라이브러리를 쓰다 보면 자주 만납니다.

```cpp
// MQTT 콜백: payload가 byte 포인터
void callback(char* topic, byte* payload, unsigned int length) {
    String 메시지 = "";
    for (int i = 0; i < length; i++) {
        메시지 += (char)payload[i];  // byte 포인터를 char로 변환
    }
}

// BLE Characteristic 값 설정
pChar->setValue(문자열.c_str());  // c_str()은 String을 const char* 포인터로 변환

// Wire.requestFrom 읽기
Wire.requestFrom(주소, 2);
byte 상위 = Wire.read();
byte 하위 = Wire.read();
```

---

## nullptr (널 포인터)

아무것도 가리키지 않는 포인터입니다. 포인터가 유효한지 확인할 때 씁니다.

```cpp
int* p = nullptr;   // 아무것도 가리키지 않음

if (p != nullptr) {
    Serial.println(*p);  // nullptr 역참조는 크래시!
}
```
