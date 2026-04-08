# 스텝 모터 (Stepper Motor)

## 개요

스텝 모터(스테퍼 모터)는 코일에 공급되는 전류 순서를 바꿔가며 정해진 각도(스텝)씩 회전하는 모터입니다. 서보모터와 달리 오픈루프(피드백 없이)로도 정밀한 위치 제어가 가능하며, 3D 프린터, CNC, 카메라 슬라이더, 디스크 드라이브 등 정밀 위치 제어가 필요한 장치에 널리 사용됩니다.

**스텝 모터 분류:**
- **유니폴라(Unipolar)**: 코일당 중간 탭 있음. 구동 쉬움. 28BYJ-48.
- **바이폴라(Bipolar)**: 코일당 2선. 동일 크기 대비 토크 큼. NEMA 17.

---

## 모델 비교 표

| 항목 | 28BYJ-48 | NEMA 17 (17HS4401) |
|------|----------|-------------------|
| 타입 | 유니폴라 (4상) | 바이폴라 (2상) |
| 동작 전압 | 5 V | 12 V (또는 24V) |
| 상 저항 | 50~60 Ω/상 | 1.5~2 Ω/상 |
| 스텝 각도 (내부) | 5.625° / step | 1.8° / step |
| 감속비 | 1/64 (실측 약 63.68) | 없음 (직접 구동) |
| 스텝 각도 (출력) | 약 5.625°/64 ≈ 0.088° | 1.8° |
| 출력 1회전 스텝 수 | 64 × (512/8) = 4096 | 200 steps/rev |
| 무부하 전류 | 150 ~ 160 mA/상 | 1.7 A/상 (상수) |
| 스톨 토크 | 34.3 mN·m | 40 N·cm (4.1 kg·cm) |
| 무게 | ~30 g | ~280 g |
| 크기 | Φ28 mm | 42.3×42.3×40 mm |
| 커넥터 | 5핀 JST XH 2.54mm | 4핀 (커넥터 없음) |
| 드라이버 | ULN2003 | A4988, DRV8825, TMC2208 |
| 용도 | 소형·저속·저토크 | 3D 프린터, CNC |

---

## 핀/단자 구성

### 28BYJ-48 (5핀 커넥터)

| 핀 번호 | 색상 | 기능 |
|--------|------|------|
| 1 | 빨강 | VCC (+5V) — 코일 공통 (+) |
| 2 | 주황 | 코일 A1 |
| 3 | 노랑 | 코일 B1 |
| 4 | 분홍 | 코일 A2 |
| 5 | 파랑 | 코일 B2 |

내부 구조: 빨강이 4개 코일의 공통 양극, 나머지 4선이 각 코일의 음극(드레인).

### NEMA 17 (4선 바이폴라)

| 선 색상 | 코일 | 기능 |
|---------|------|------|
| 빨강 | A+ | 코일 A 양극 |
| 파랑 | A- | 코일 A 음극 |
| 녹색 | B+ | 코일 B 양극 |
| 검정 | B- | 코일 B 음극 |

> 제조사마다 색상 배열이 다름. 테스터로 코일 쌍 확인 필요 (같은 쌍끼리 저항 측정 시 수 Ω).

---

## 전기적 스펙 표

### 28BYJ-48

| 항목 | 값 |
|------|----|
| 정격 전압 | 5 V DC |
| 상 수 | 4상 |
| 상 저항 | 50 Ω (±7%) |
| 인덕턴스 | 42 mH ±20% |
| 견인 토크 | ≥ 34.3 mN·m (3.5 g·cm) |
| 자중 보유 토크 | ≥ 29.4 mN·m |
| 부하 저항 | ≥ 600 mN·m |
| 내부 스텝 각도 | 5.625° / step |
| 감속비 | 약 1/64 |
| 출력 스텝 각도 | 약 0.088° |
| 동작 온도 | -10 ~ +50 °C |
| 보관 온도 | -20 ~ +60 °C |
| 소비 전류 | 약 160 mA/상 |
| 절연 저항 | >10 MΩ, 500VDC |
| 절연 내압 | 600 VAC, 1s |

### NEMA 17 — 17HS4401

| 항목 | 값 |
|------|----|
| 정격 전압 | 12 V |
| 정격 전류 | 1.7 A/상 |
| 상 저항 | 1.5 Ω ±10% |
| 상 인덕턴스 | 2.8 mH ±20% |
| 유지 토크 | 40 N·cm (4.08 kg·cm) |
| 디텐트 토크 | 2.2 N·cm |
| 스텝 각도 | 1.8° ±5% |
| 스텝 각도 허용 오차 | ±5% (전체 범위) |
| 무게 | 280 g |
| 축 직경 | 5 mm (D컷) |
| 동작 온도 | -20 ~ +50 °C |
| 절연 등급 | Class B |

---

## 동작 원리

스텝 모터는 내부에 4개(또는 6개)의 전자석(코일)이 원형으로 배열된 고정자(Stator)와, 영구 자석 또는 연자성체로 이루어진 회전자(Rotor)로 구성됩니다.

**구동 순서(28BYJ-48 풀 스텝):**

```
스텝  IN1  IN2  IN3  IN4   활성 코일
  1     1    0    0    0   A
  2     0    1    0    0   B
  3     0    0    1    0   C
  4     0    0    0    1   D
```

코일에 전류를 순서대로 공급 → 회전자가 활성 코일 쪽으로 당겨지며 스텝 단위로 회전.

**구동 모드:**
- **풀 스텝(Full Step)**: 1코일씩 순차 활성. 토크 보통, 스텝 크기 큼.
- **하프 스텝(Half Step)**: 1코일 + 2코일 교대 활성. 스텝 수 2배, 소음·진동 감소.
- **마이크로스텝(Microstep)**: 전류를 분할해 스텝 사이 위치 제어. 매우 부드러운 동작.

---

## 아두이노 연결 방법

### 28BYJ-48 + ULN2003

```
ESP32-C3                ULN2003 모듈
────────────           ───────────────
G4 ──────────────────→ IN1
G5 ──────────────────→ IN2
G6 ──────────────────→ IN3
G7 ──────────────────→ IN4
GND ─────────────────→ GND
(전원 별도)            VCC ← 5V 외부 전원

ULN2003 출력
OUT1 ~OUT4 ──────────→ 28BYJ-48 5핀 커넥터 (JST)
```

> ESP32-C3는 3.3V GPIO이므로 ULN2003의 3.3V 입력 호환 확인 필요.  
> ULN2003은 입력 임계값 ~1.0V → 3.3V 입력 동작 가능.

### NEMA 17 + A4988

```
ESP32-C3                A4988 드라이버
────────────           ──────────────
G4 ──────────────────→ STEP (스텝 펄스)
G5 ──────────────────→ DIR  (방향)
3.3V ────────────────→ RESET, SLEEP (풀업)
GND ─────────────────→ GND (로직)
GND ─────────────────→ GND (파워)

외부 12V ────────────→ VMOT
5V ──────────────────→ VDD (로직)

A4988 코일 출력
1A, 1B ──────────────→ NEMA17 코일 A (빨강, 파랑)
2A, 2B ──────────────→ NEMA17 코일 B (녹색, 검정)
```

**A4988 전류 제한 설정**: Vref 조정 나사로 전류 세팅 필수.  
`Vref = I_max × 8 × R_sense` (R_sense = 0.1Ω → I=1.7A: Vref = 1.36V)

---

## 제어 방법

### 28BYJ-48 — Stepper 라이브러리

```cpp
#include <Stepper.h>

const int STEPS_PER_REV = 2048;  // 28BYJ-48 출력축 1회전 = 2048 half-step

// 핀 순서 주의: IN1, IN3, IN2, IN4 (라이브러리 내부 시퀀스)
Stepper stepper(STEPS_PER_REV, 4, 6, 5, 7);

void setup() {
  stepper.setSpeed(15);  // RPM (28BYJ-48 최대 ~17 RPM 권장)
}

void loop() {
  stepper.step(2048);    // 1바퀴 정방향
  delay(500);
  stepper.step(-2048);   // 1바퀴 역방향
  delay(500);
}
```

### 28BYJ-48 — 하프 스텝 직접 제어

```cpp
const int motorPins[] = {4, 5, 6, 7};
// 하프 스텝 시퀀스
const bool halfStep[8][4] = {
  {1, 0, 0, 0},
  {1, 1, 0, 0},
  {0, 1, 0, 0},
  {0, 1, 1, 0},
  {0, 0, 1, 0},
  {0, 0, 1, 1},
  {0, 0, 0, 1},
  {1, 0, 0, 1}
};

int stepIdx = 0;

void stepOnce(int dir) {  // dir: +1 or -1
  for (int i = 0; i < 4; i++) {
    digitalWrite(motorPins[i], halfStep[stepIdx][i]);
  }
  stepIdx = (stepIdx + dir + 8) % 8;
}

void stepMotor(int steps, int delayMs) {
  int dir = (steps > 0) ? 1 : -1;
  steps = abs(steps);
  for (int i = 0; i < steps; i++) {
    stepOnce(dir);
    delay(delayMs);
  }
}
```

### NEMA 17 + A4988 — 마이크로스텝 제어

```cpp
const int STEP_PIN = 4;
const int DIR_PIN  = 5;

// A4988 마이크로스텝 설정 (MS1/MS2/MS3 핀)
// 000 = Full step, 100 = Half, 010 = 1/4, 110 = 1/8, 111 = 1/16

void stepPulse() {
  digitalWrite(STEP_PIN, HIGH);
  delayMicroseconds(2);   // 최소 1µs HIGH 유지
  digitalWrite(STEP_PIN, LOW);
  delayMicroseconds(2);
}

void moveDegrees(float degrees, int stepsPerRev, int microStep) {
  int totalSteps = (int)(degrees / 360.0 * stepsPerRev * microStep);
  for (int i = 0; i < totalSteps; i++) {
    stepPulse();
    delayMicroseconds(1000);  // 속도 조정 (µs 간격)
  }
}

void setup() {
  pinMode(STEP_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);
  digitalWrite(DIR_PIN, HIGH);  // 정방향
}

void loop() {
  moveDegrees(360, 200, 16);  // 1/16 마이크로스텝으로 1바퀴
  delay(1000);
  digitalWrite(DIR_PIN, LOW);
  moveDegrees(360, 200, 16);
  delay(1000);
  digitalWrite(DIR_PIN, HIGH);
}
```

---

## 주의사항

1. **코일 비활성화**: 위치 유지 불필요 시 모든 코일을 LOW로 설정 → 발열 방지.
2. **속도 한계**: 28BYJ-48은 과속 시 탈조(step loss). 최대 15~17 RPM 이하 권장.
3. **탈조(Step Loss)**: 부하가 너무 크거나 속도가 너무 빠르면 실제 회전이 명령보다 뒤처짐. 인코더 추가로 확인 가능.
4. **A4988 발열**: NEMA17 구동 시 방열판 필수. Vref는 모터 정격 전류의 ~70%로 설정 권장.
5. **전원 분리**: NEMA17용 12V 전원과 ESP32-C3 3.3V 로직 전원은 반드시 분리. GND만 공통.
6. **VMOT 커패시터**: A4988 VMOT와 GND 사이에 100µF 전해 커패시터 필수 (전원 차단 시 서지 보호).

---

## 자주 쓰이는 회로 패턴

### 패턴 1: AccelStepper로 가감속 제어 (NEMA17)

```cpp
#include <AccelStepper.h>

// AccelStepper::DRIVER = STEP/DIR 방식
AccelStepper stepper(AccelStepper::DRIVER, 4, 5);

void setup() {
  stepper.setMaxSpeed(2000);     // steps/sec
  stepper.setAcceleration(500);  // steps/sec^2
  stepper.moveTo(3200);          // 16 마이크로스텝 × 200 = 1바퀴
}

void loop() {
  stepper.run();  // 논블로킹 — loop에서 계속 호출
  if (stepper.distanceToGo() == 0) {
    stepper.moveTo(-stepper.currentPosition());
  }
}
```

### 패턴 2: 홈 센서(리밋 스위치) 활용

```cpp
void goHome() {
  stepper.setSpeed(-500);
  while (digitalRead(HOME_SWITCH) == HIGH) {
    stepper.runSpeed();
  }
  stepper.stop();
  stepper.setCurrentPosition(0);
}
```

### 패턴 3: 각도 변환 헬퍼

```cpp
// NEMA17, 1/16 마이크로스텝 기준
long degreesToSteps(float deg) {
  return (long)(deg / 360.0 * 200 * 16);
}

float stepsToDegrees(long steps) {
  return (float)steps / (200 * 16) * 360.0;
}
```
