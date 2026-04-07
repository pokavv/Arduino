# 반복문

반복문은 같은 코드를 여러 번 실행할 때 씁니다.

---

## for 반복문

횟수가 정해진 반복에 씁니다.

```cpp
for (초기화; 조건; 증감) {
    // 반복 실행할 코드
}
```

```cpp
// 0부터 9까지 10번 반복
for (int i = 0; i < 10; i++) {
    Serial.println(i);   // 0, 1, 2 ... 9 출력
}
```

### 동작 순서

```
1. 초기화: int i = 0
2. 조건 확인: i < 10  → true면 실행, false면 종료
3. 코드 실행
4. 증감: i++
5. 2번으로 돌아감
```

### 다양한 for 패턴

```cpp
// 2씩 증가
for (int i = 0; i <= 10; i += 2) { }   // 0, 2, 4, 6, 8, 10

// 거꾸로 감소
for (int i = 10; i >= 0; i--) { }      // 10, 9, 8 ... 0

// 특정 범위
for (int i = 5; i < 15; i++) { }       // 5 ~ 14

// float 증가 (주의: float 비교는 오차 있음)
for (float f = 0.0; f < 1.0; f += 0.1) { }
```

### 실용 예제: LED 점점 밝아지기

```cpp
for (int 밝기 = 0; 밝기 <= 255; 밝기++) {
    ledcWrite(0, 밝기);
    delay(5);
}
```

### 배열 순회 (가장 많이 쓰는 패턴)

```cpp
int 센서핀들[] = {A0, A1, A2, A3};
int 핀개수 = 4;

for (int i = 0; i < 핀개수; i++) {
    int 값 = analogRead(센서핀들[i]);
    Serial.print("센서");
    Serial.print(i);
    Serial.print(": ");
    Serial.println(값);
}
```

---

## while 반복문

조건이 참인 동안 계속 반복합니다. 횟수가 정해지지 않은 반복에 씁니다.

```cpp
while (조건) {
    // 조건이 true인 동안 계속 실행
}
```

### Wi-Fi 연결 대기 (가장 흔한 사용 예)

```cpp
WiFi.begin(ssid, password);

while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
}
// 여기 오면 연결 완료
```

### 카운터 예제

```cpp
int 카운터 = 0;
while (카운터 < 5) {
    Serial.println(카운터);
    카운터++;   // 이걸 빠트리면 무한루프!
}
```

### 무한루프

```cpp
while (true) {
    // 영원히 실행 (break로만 탈출 가능)
}

// 아두이노의 loop() 함수 자체가 while(true)와 같음
```

---

## do-while 반복문

while과 비슷하지만 **조건 확인 전에 무조건 한 번은 실행**합니다.

```cpp
do {
    // 최소 1번은 실행
} while (조건);
```

```cpp
int 입력;
do {
    Serial.println("1~10 사이 숫자를 입력하세요");
    입력 = Serial.parseInt();
} while (입력 < 1 || 입력 > 10);
// 올바른 값이 입력될 때까지 반복
```

---

## break와 continue

### break — 반복문 즉시 탈출

```cpp
for (int i = 0; i < 100; i++) {
    if (digitalRead(버튼) == LOW) {
        Serial.println("버튼 눌림, 중단!");
        break;   // for 루프 종료
    }
    delay(100);
}
```

### continue — 이번 회차만 건너뜀

```cpp
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        continue;   // i==5 일 때는 아래 코드 건너뜀
    }
    Serial.println(i);   // 0,1,2,3,4, 6,7,8,9 출력 (5 빠짐)
}
```

---

## 반복문 선택 기준

| 상황 | 추천 |
|------|------|
| 횟수가 정해진 반복 | `for` |
| 조건이 맞는 동안 반복 | `while` |
| 최소 1번은 실행해야 할 때 | `do-while` |
| 특정 이벤트까지 대기 | `while` |

---

## 아두이노에서 주의: loop() 안에서 긴 대기

`loop()`는 아두이노가 계속 호출하는 함수입니다.
`loop()` 안에 긴 `while`이나 `delay`를 넣으면 다른 처리를 못 합니다.

```cpp
// 나쁜 예 — loop가 10초 동안 블로킹됨
void loop() {
    while (millis() < 10000) { }  // 이 동안 버튼, 시리얼 등 아무것도 못 함
}

// 좋은 예 — millis()로 논블로킹 처리
unsigned long 시작시간 = 0;

void loop() {
    if (millis() - 시작시간 >= 10000) {
        시작시간 = millis();
        // 10초마다 실행할 코드
    }
    // 다른 코드도 계속 실행 가능
}
```
