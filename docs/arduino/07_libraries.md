# 라이브러리 사용법

## 라이브러리란?

다른 사람이 만들어 놓은 코드 묶음입니다.
복잡한 센서/통신 코드를 직접 짜는 대신 라이브러리를 가져다 씁니다.

---

## 설치 방법

### 방법 1 — 라이브러리 관리자 (가장 쉬움)
**스케치 → 라이브러리 포함하기 → 라이브러리 관리**
→ 검색 후 설치

### 방법 2 — ZIP 파일
**스케치 → 라이브러리 포함하기 → .ZIP 라이브러리 추가**
→ 다운로드한 `.zip` 파일 선택

### 방법 3 — 수동 설치
다운로드한 폴더를 `Documents/Arduino/libraries/` 에 복사

---

## 라이브러리 사용

```cpp
#include <라이브러리이름.h>   // 파일 맨 위에 선언
```

---

## 자주 쓰는 라이브러리

### 센서

| 라이브러리 | 용도 | 설치 검색어 |
|-----------|------|------------|
| `DHT sensor library` | DHT11/22 온습도 | `DHT sensor library` |
| `Adafruit BME280` | 온도/습도/기압 | `Adafruit BME280` |
| `VL53L0X` | ToF 거리 센서 | `VL53L0X` |
| `MPU6050` | 자이로/가속도 | `MPU6050` |

### 디스플레이

| 라이브러리 | 용도 | 설치 검색어 |
|-----------|------|------------|
| `Adafruit SSD1306` | OLED 128x64 | `Adafruit SSD1306` |
| `Adafruit GFX` | 그래픽 기초 (SSD1306 의존) | `Adafruit GFX` |
| `TFT_eSPI` | TFT LCD | `TFT_eSPI` |

### 통신

| 라이브러리 | 용도 | 설치 검색어 |
|-----------|------|------------|
| `PubSubClient` | MQTT | `PubSubClient` |
| `ArduinoJson` | JSON 파싱/생성 | `ArduinoJson` |
| `ESPAsyncWebServer` | 비동기 웹서버 | `ESPAsyncWebServer` |

### 모터/액추에이터

| 라이브러리 | 용도 | 설치 검색어 |
|-----------|------|------------|
| `Servo` | 서보모터 | (기본 내장) |
| `FastLED` | RGB LED 스트립 | `FastLED` |
| `AccelStepper` | 스텝 모터 | `AccelStepper` |

---

## 라이브러리 기본 사용 패턴

대부분의 라이브러리는 아래 패턴을 따릅니다.

```cpp
#include <라이브러리.h>

// 1. 객체 생성 (전역)
라이브러리클래스 객체이름(설정값);

void setup() {
    // 2. 초기화
    객체이름.begin();
}

void loop() {
    // 3. 사용
    객체이름.어떤함수();
}
```

### 예: DHT22 온습도 센서

```cpp
#include <DHT.h>

DHT dht(4, DHT22);   // 4번 핀, DHT22 타입

void setup() {
    Serial.begin(115200);
    dht.begin();
}

void loop() {
    float 온도 = dht.readTemperature();
    float 습도 = dht.readHumidity();

    if (isnan(온도) || isnan(습도)) {
        Serial.println("읽기 실패");
        return;
    }

    Serial.print("온도: "); Serial.print(온도); Serial.println("°C");
    Serial.print("습도: "); Serial.print(습도); Serial.println("%");
    delay(2000);
}
```

### 예: 서보모터

```cpp
#include <Servo.h>

Servo 서보;

void setup() {
    서보.attach(9);    // 9번 핀에 서보 연결
}

void loop() {
    서보.write(0);     // 0도
    delay(1000);
    서보.write(90);    // 90도
    delay(1000);
    서보.write(180);   // 180도
    delay(1000);
}
```
