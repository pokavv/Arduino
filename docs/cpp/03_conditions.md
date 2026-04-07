# 조건문

조건문은 특정 조건이 맞을 때만 코드를 실행하게 합니다.

---

## if / else if / else

```cpp
if (조건1) {
    // 조건1이 true일 때 실행
} else if (조건2) {
    // 조건1은 false고 조건2가 true일 때 실행
} else {
    // 위 조건이 모두 false일 때 실행
}
```

### 예제: 온도에 따라 팬 제어

```cpp
float 온도 = 센서.읽기();

if (온도 >= 40) {
    analogWrite(팬핀, 255);    // 최대 속도
    Serial.println("고속");
} else if (온도 >= 30) {
    analogWrite(팬핀, 150);    // 중간 속도
    Serial.println("중속");
} else if (온도 >= 20) {
    analogWrite(팬핀, 80);     // 저속
    Serial.println("저속");
} else {
    analogWrite(팬핀, 0);      // 정지
    Serial.println("정지");
}
```

### 중괄호 생략 (한 줄짜리 조건)

실행할 코드가 딱 한 줄이면 중괄호 생략 가능합니다.
하지만 **버그가 생기기 쉬우므로 항상 중괄호를 쓰는 것을 권장**합니다.

```cpp
// 생략 가능하지만
if (x > 5) digitalWrite(LED, HIGH);

// 이게 더 안전
if (x > 5) {
    digitalWrite(LED, HIGH);
}
```

---

## switch / case

하나의 변수가 여러 값 중 어느 것인지 비교할 때 씁니다.
`if-else if`를 여러 번 쓰는 것보다 깔끔합니다.

```cpp
switch (변수) {
    case 값1:
        // 변수 == 값1 일 때
        break;  // ← 반드시 break! 없으면 다음 case도 실행됨
    case 값2:
        // 변수 == 값2 일 때
        break;
    default:
        // 어느 case도 해당 안 될 때
        break;
}
```

### 예제: 모드 선택

```cpp
int 모드 = 2;

switch (모드) {
    case 1:
        Serial.println("모드 1: 온도 측정");
        break;
    case 2:
        Serial.println("모드 2: 습도 측정");
        break;
    case 3:
        Serial.println("모드 3: 대기");
        break;
    default:
        Serial.println("알 수 없는 모드");
        break;
}
```

### break 빠트리면?

```cpp
switch (x) {
    case 1:
        Serial.println("1");   // x==1 이면 여기 실행되고
        // break 없음!
    case 2:
        Serial.println("2");   // 여기도 실행됨! (fall-through)
        break;
    case 3:
        Serial.println("3");
        break;
}
// x가 1이면 "1"과 "2" 모두 출력됨 — 의도한 게 아니라면 버그!
```

### 여러 case를 같이 처리할 때 (의도적 fall-through)

```cpp
switch (요일) {
    case 1:  // 월
    case 2:  // 화
    case 3:  // 수
    case 4:  // 목
    case 5:  // 금
        Serial.println("평일");
        break;
    case 6:  // 토
    case 7:  // 일
        Serial.println("주말");
        break;
}
```

---

## 중첩 조건문

조건문 안에 조건문을 넣을 수 있습니다.

```cpp
if (WiFi.status() == WL_CONNECTED) {
    if (온도 > 30) {
        // Wi-Fi 연결됨 AND 온도 30 초과
        mqtt.publish("알림", "온도 높음!");
    } else {
        mqtt.publish("온도", String(온도).c_str());
    }
} else {
    Serial.println("Wi-Fi 연결 안 됨");
}
```

> 중첩이 너무 깊어지면 (3단계 이상) 함수로 분리하는 것이 좋습니다.

---

## 조건문 축약 패턴

### 불필요한 비교 제거

```cpp
// 나쁜 예 — bool을 true와 비교하는 건 중복
if (켜짐 == true) { }
if (켜짐 == false) { }

// 좋은 예
if (켜짐) { }
if (!켜짐) { }
```

### 조기 반환 패턴

함수에서 조건이 안 맞으면 일찍 return 해서 중첩을 줄입니다.

```cpp
// 중첩이 깊어지는 방식
void 데이터전송() {
    if (WiFi연결됨) {
        if (센서값 > 0) {
            if (마지막전송후_1분경과) {
                // 전송 코드
            }
        }
    }
}

// 조기 반환으로 깔끔하게
void 데이터전송() {
    if (!WiFi연결됨) return;
    if (센서값 <= 0) return;
    if (!마지막전송후_1분경과) return;

    // 여기까지 오면 모든 조건 통과
    // 전송 코드
}
```
