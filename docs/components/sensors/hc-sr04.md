# HC-SR04 — 초음파 거리 센서

## 개요

HC-SR04는 40kHz 초음파를 이용하여 비접촉 방식으로 거리를 측정하는 모듈입니다.
초음파 송신기(Trigger)와 수신기(Echo)를 내장하며, 펄스 폭(Time-of-Flight)으로 거리를 계산합니다.

**측정 원리**
1. TRIG 핀에 10µs 이상의 HIGH 펄스를 주면 40kHz 초음파를 8회 연속 발사합니다.
2. 초음파가 장애물에 반사되어 돌아오면 ECHO 핀이 HIGH 상태가 됩니다.
3. ECHO 핀이 HIGH를 유지하는 시간(왕복 시간)으로 거리를 계산합니다.

**아두이노에서의 활용**
장애물 감지 로봇, 주차 보조, 수위 측정, 근접 센서 등에 폭넓게 사용됩니다.
`NewPing` 라이브러리 또는 `pulseIn()` 함수로 간편하게 구현합니다.

---

## 모델 비교

| 항목 | HC-SR04 | HC-SR04P | JSN-SR04T |
|------|---------|----------|-----------|
| 전원 전압 | 5V | 3.3 ~ 5V | 5V |
| 측정 거리 | 2 ~ 400cm | 2 ~ 400cm | 20 ~ 600cm |
| 방수 | 없음 | 없음 | 방수 프로브 |
| ESP32 직결 | 레벨 변환 권장 | 직결 가능 | 레벨 변환 필요 |
| 용도 | 일반 실내 | 3.3V MCU | 액체 수위 측정 |

---

## 핀 구성

```
HC-SR04 정면

  ┌────────────────────┐
  │  (O)          (O)  │  ← 초음파 송수신기
  │  TRIG  ECHO       │
  │   VCC GND TRIG ECHO│  ← 핀 순서 (모듈마다 다를 수 있음)
  └────────────────────┘
```

| 핀 이름 | 역할 |
|---------|------|
| VCC | 전원 (+5V) |
| GND | 접지 (0V) |
| TRIG | 트리거 입력 (MCU → 센서) — 10µs HIGH 펄스로 측정 시작 |
| ECHO | 에코 출력 (센서 → MCU) — 반사 시간만큼 HIGH 유지 |

---

## 전기적 스펙

| 파라미터 | 값 | 단위 |
|----------|-----|------|
| 동작 전압 | 5 | V |
| 동작 전류 | 15 | mA |
| 초음파 주파수 | 40 | kHz |
| 측정 범위 | 2 ~ 400 | cm |
| 최소 측정 거리 | 2 | cm |
| 최대 측정 거리 | 400 | cm |
| 측정 정확도 | ±3 | mm |
| 측정 각도 | ±15 | ° |
| TRIG 펄스 폭 | 최소 10 | µs |
| ECHO 출력 전압 HIGH | 5 | V |
| ECHO 출력 전압 LOW | 0 | V |
| 최소 측정 주기 | 60 | ms (16Hz) |
| 크기 | 45 × 20 × 15 | mm |

---

## 통신 프로토콜 — 펄스 폭 측정 (PWM/Time-of-Flight)

### 동작 타이밍 다이어그램

```
TRIG: ─┐10µs├──────────────────────────────────────
       └────┘

ECHO: ──────────┐←────────── t_echo ─────────────→┐
                └──────────────────────────────────┘

거리 = (t_echo µs) × 음속(34300 cm/s) / 2 (왕복)
     = t_echo / 58 (cm)
     = t_echo / 148 (inch)
```

### 단계별 동작

```
1. TRIG를 최소 10µs HIGH 후 LOW
2. 모듈 내부에서 40kHz 버스트 8회 발사
3. 반사파 수신 또는 타임아웃까지 대기
4. ECHO 핀이 HIGH → pulseIn()으로 시간 측정
5. 거리 계산
```

### 측정 주기 제한

```
연속 측정 시 초음파 잔향 방지를 위해 최소 60ms 간격 필요.
(HC-SR04 규격서 권장: 60ms 이상)
```

---

## 아두이노 연결 방법

### ESP32-C3 직접 연결 (주의 필요)

```
ESP32-C3          HC-SR04
  5V   ──────────── VCC
  GND  ──────────── GND
  G5   ──────────── TRIG
  G6   ──┬───────── ECHO  ← 5V 출력! 레벨 변환 필요
         │
        1kΩ
         │
        2kΩ
         │
  GND  ──┘
  G6   ─← (1kΩ-2kΩ 분압 후 연결, ~3.3V로 낮춤)
```

> **중요**: HC-SR04의 ECHO 출력은 5V입니다. ESP32-C3는 3.3V GPIO이므로
> **레벨 변환**이 필요합니다. 방법:
> 1. 저항 분압기 (1kΩ + 2kΩ): 5V → 3.33V
> 2. 양방향 레벨 쉬프터 모듈 사용
> 3. HC-SR04P (3.3V 호환 버전) 사용

### HC-SR04P (3.3V 버전) 연결 — 권장

```
ESP32-C3          HC-SR04P
  3.3V ──────────── VCC
  GND  ──────────── GND
  G5   ──────────── TRIG
  G6   ──────────── ECHO  (3.3V 출력, 직결 가능)
```

### 라이브러리 없이 구현 (pulseIn 사용)

```cpp
#define TRIG_PIN  5
#define ECHO_PIN  6

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
}

float measureDistance() {
  // 트리거 펄스 발생
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // 에코 시간 측정 (타임아웃: 30ms = 약 515cm)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) return -1; // 타임아웃 (측정 범위 초과)

  // 거리 계산 (cm)
  float distance = duration / 58.0;
  return distance;
}

void loop() {
  float dist = measureDistance();
  if (dist < 0) {
    Serial.println("범위 초과!");
  } else {
    Serial.printf("거리: %.1f cm\n", dist);
  }
  delay(100); // 최소 60ms
}
```

### NewPing 라이브러리 사용 (권장)

```cpp
#include <NewPing.h>

#define TRIG_PIN      5
#define ECHO_PIN      6
#define MAX_DISTANCE  400 // 최대 측정 거리 (cm)

NewPing sonar(TRIG_PIN, ECHO_PIN, MAX_DISTANCE);

void loop() {
  unsigned int dist = sonar.ping_cm();
  Serial.printf("거리: %u cm\n", dist == 0 ? MAX_DISTANCE : dist);
  delay(100);
}
```

---

## 측정값 계산 공식

### 기본 거리 공식

```
음속(20°C 공기) = 343 m/s = 34300 cm/s

거리(cm) = (ECHO 시간(µs) × 34300 cm/s) / 2 / 1,000,000
         = ECHO 시간(µs) / 58.31
         ≈ ECHO 시간(µs) / 58  (근사값)

거리(mm) = ECHO 시간(µs) / 5.831

거리(inch) = ECHO 시간(µs) / 148.1
           ≈ ECHO 시간(µs) / 148
```

### 온도 보정 (정밀 측정용)

음속은 온도에 따라 변합니다:

```
음속(m/s) = 331.5 + 0.6 × T(°C)

보정 거리(cm) = ECHO_us × (331.5 + 0.6 × T) / 2 / 10000

예: 0°C  → 음속 331.5 m/s
   20°C → 음속 343.5 m/s (4.8 m/s 차이, ~1.4%)
   35°C → 음속 352.5 m/s (약 2.6% 차이)
```

### 이동 평균 필터

```cpp
const int FILTER_SIZE = 5;
float samples[FILTER_SIZE] = {0};
int   idx = 0;

float filteredDistance() {
  samples[idx] = sonar.ping_cm();
  idx = (idx + 1) % FILTER_SIZE;

  float sum = 0;
  for (int i = 0; i < FILTER_SIZE; i++) sum += samples[i];
  return sum / FILTER_SIZE;
}
```

---

## 주의사항

1. **레벨 변환 필수 (ESP32-C3)**
   - ECHO 출력이 5V이므로 3.3V MCU 연결 시 반드시 레벨 변환
   - 직결 시 GPIO 손상 또는 MCU 수명 단축 가능

2. **최소 측정 거리 2cm**
   - 2cm 미만의 물체는 감지 불가 (버스트 신호 잔향 시간 때문)
   - 근접 감지 애플리케이션에는 IR 센서 조합 권장

3. **측정 주기 60ms 이상**
   - 너무 빠른 측정은 잔향 간섭으로 오측정 발생
   - `delay(100)` 또는 millis() 기반 100ms 간격 권장

4. **측정 각도 ±15°**
   - 수평/수직 정렬이 중요하며, 비스듬한 표면은 반사가 약해 오측정 가능
   - 흡음 소재(스펀지, 패브릭)는 반사가 약하거나 없을 수 있음

5. **온도/습도 영향**
   - 고온/저온 환경에서 음속이 달라져 오차 발생
   - 정밀 측정 시 온도 보정 코드 추가 권장

6. **다중 센서 간섭**
   - 여러 HC-SR04를 동시에 사용하면 초음파 간섭 발생
   - 시분할(Time-multiplexing)로 하나씩 순서대로 측정

7. **pulseIn() 블로킹**
   - `pulseIn()`은 블로킹 함수로 다른 작업을 멈춤
   - 비동기 처리가 필요하면 인터럽트 기반 구현 또는 NewPing 라이브러리 사용

---

## 캘리브레이션 방법

### 알려진 거리로 보정

```cpp
// 알려진 거리로 측정 후 보정 계수 계산
const float KNOWN_DISTANCE = 50.0; // 실제 거리 (cm)
float measured = measureDistance();
float correctionFactor = KNOWN_DISTANCE / measured;

float calibratedDistance() {
  return measureDistance() * correctionFactor;
}
```

### 온도 보정 (DHT22 조합)

```cpp
#include <DHT.h>
DHT dht(4, DHT22);

float measureDistanceWithTempComp() {
  float temp = dht.readTemperature();
  float soundSpeed = 331.5 + 0.6 * temp; // m/s

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  // 거리(cm) = 시간(µs) × 음속(m/s) / 2 / 10000
  return duration * soundSpeed / 2.0 / 10000.0;
}
```

---

## 실사용 팁

- **측정 각도 활용**: 15° 이내의 좁은 빔은 정밀 거리 측정에 유리하지만, 넓은 면적 감지에는 IR 센서가 더 적합
- **수직 벽 측정**: 초음파가 수직 표면에 잘 반사되므로 벽 거리 측정에 최적
- **수위 측정 활용**: 통 내부에 아래를 향해 설치하면 수위 측정 가능 (2cm 이상)
- **밀리미터 단위 불가**: HC-SR04의 공식 정확도는 ±3mm이므로 mm 단위 정밀 측정은 부적합
- **배선 최소화**: TRIG/ECHO 선이 길면 노이즈로 오측정 가능 — 가급적 짧게 배선
- **3D 프린트 마운트**: 센서 정렬이 중요하므로 고정 마운트 제작 권장
