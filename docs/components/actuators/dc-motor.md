# DC 모터 (DC Motor)

## 개요

DC 모터(직류 모터)는 전류를 공급하면 연속 회전하는 가장 기본적인 전동 액추에이터입니다. 코일에 흐르는 전류와 영구 자석의 자기력 사이의 상호작용으로 회전력(토크)을 발생시킵니다. 아두이노 프로젝트에서는 바퀴 구동(로봇, RC카), 팬/펌프, 컨베이어 벨트 등에 사용됩니다.

**직접 구동 불가**: DC 모터는 수백 mA ~ 수 A의 전류를 소비하므로 아두이노 GPIO(최대 40mA)로 직접 구동하면 보드가 손상됩니다. **반드시 모터 드라이버(L298N, L9110, DRV8833 등)를 통해 구동**해야 합니다.

---

## 모델 비교 표

| 항목 | TT 모터 (황색) | N20 모터 | 130 DC 모터 | JGA25-370 |
|------|--------------|---------|------------|----------|
| 동작 전압 | 3 ~ 6 V | 3 ~ 12 V | 1.5 ~ 6 V | 6 ~ 12 V |
| 무부하 속도 | 200 ~ 250 RPM | 50 ~ 3000 RPM | 8000 ~ 15000 RPM | 6 ~ 200 RPM |
| 무부하 전류 | 150 ~ 200 mA | 30 ~ 60 mA | 200 ~ 400 mA | 100 ~ 300 mA |
| 스톨 전류 | ~1.5 A | 300 ~ 600 mA | ~3 A | ~3 A |
| 기어박스 | 내장 (48:1) | 내장 (다양) | 없음 | 내장 |
| 축 지름 | 5 mm (D형) | 3 mm | 2 mm | 6 mm |
| 용도 | 스마트카, 로봇 | 소형 로봇, 드론 | 팬, 모형 | 고토크 로봇 |
| 크기 | ~70×22×18 mm | 12×10 mm | 27×17 mm | 25×37 mm |
| 특징 | 바퀴 직결, 저가 | 초소형, 다양한 감속비 | 고속·저토크 | 인코더 내장 가능 |

---

## 핀/단자 구성

DC 모터는 극성이 있는 2-단자 소자입니다.

| 단자 | 명칭 | 기능 |
|------|------|------|
| + (빨강) | 양극 | 전원 양극 연결 |
| - (검정) | 음극 | 전원 음극 연결 |

> 두 단자를 바꾸면 회전 방향이 반대로 바뀝니다.  
> DC 모터는 극성 보호 회로가 없으므로 역방향 연결에 주의합니다.

---

## 전기적 스펙 표

### TT 기어드 모터 (황색 스마트카용)

| 항목 | 값 |
|------|----|
| 동작 전압 | 3 ~ 6 V (권장 5V) |
| 감속비 | 1:48 |
| 무부하 속도 @ 3V | ~90 RPM |
| 무부하 속도 @ 5V | ~200 RPM |
| 무부하 속도 @ 6V | ~250 RPM |
| 무부하 전류 @ 5V | 150 ~ 200 mA |
| 스톨 전류 @ 5V | ~1.2 A |
| 스톨 토크 @ 5V | ~0.8 kg·cm |
| 기어 재질 | 플라스틱 |
| 축 직경 | 5 mm (D컷) |
| 크기 | 70×22×18 mm |
| 전선 길이 | ~20 cm |

### N20 마이크로 기어드 모터

| 항목 | 값 |
|------|----|
| 동작 전압 | 3 ~ 6 V |
| 감속비 | 30:1 ~ 1000:1 (선택) |
| 무부하 속도 (100:1, 6V) | ~60 RPM |
| 무부하 전류 | 30 ~ 60 mA |
| 스톨 전류 | 300 ~ 600 mA |
| 스톨 토크 (100:1, 6V) | ~2.5 kg·cm |
| 무게 | ~10 g |
| 크기 | 12×10×26 mm |

### 130 타입 고속 모터

| 항목 | 값 |
|------|----|
| 동작 전압 | 1.5 ~ 6 V |
| 무부하 속도 @ 3V | ~8000 RPM |
| 무부하 속도 @ 5V | ~13000 RPM |
| 무부하 전류 @ 5V | 200 ~ 400 mA |
| 스톨 전류 @ 5V | ~2.5 A |
| 축 직경 | 2 mm |

---

## 동작 원리

DC 모터는 **플레밍의 왼손 법칙**을 기반으로 합니다.

1. 코일(전기자, Armature)에 직류 전류 공급
2. 영구 자석의 자기장 속에서 코일에 힘(로렌츠 힘) 발생
3. 정류자(Commutator)와 브러시가 코일의 전류 방향을 계속 바꿔 일방향 회전 유지
4. 전압이 높을수록 → 전류 증가 → 회전 속도 증가
5. 부하가 클수록 → 속도 감소, 전류 증가

**역기전력(Back-EMF)**: 모터가 회전하면 발전기처럼 전압을 역방향으로 생성. 회전 속도에 비례. 갑자기 전원 차단 시 고전압 스파이크 발생 → 회로 보호 다이오드(플라이백 다이오드) 필요.

---

## 아두이노 연결 방법

**DC 모터는 반드시 모터 드라이버를 경유해야 합니다.**

### L298N 드라이버를 통한 연결

```
외부 전원 (6~12V)
├── (+) ─────────────────→ L298N VS (모터 전원)
└── (─) ─────────────────→ L298N GND

5V 전원
└── (+) ─────────────────→ L298N VSS (로직 전원)

ESP32-C3
├── G4 ──────────────────→ L298N IN1
├── G5 ──────────────────→ L298N IN2
├── G6 (PWM) ────────────→ L298N ENA
└── GND ─────────────────→ L298N GND

L298N 출력
├── OUT1 ────────────────→ 모터 (+)
└── OUT2 ────────────────→ 모터 (-)
```

### L9110S / DRV8833 소형 드라이버 (TT 모터, N20)

```
ESP32-C3 G4 → L9110S A-IA
ESP32-C3 G5 → L9110S A-IB
VCC (2~12V) → L9110S VCC
GND         → L9110S GND
L9110S AOUT1 → 모터 (+)
L9110S AOUT2 → 모터 (-)
```

---

## 제어 방법

### 방향 및 속도 제어 (L298N 기준)

```cpp
const int IN1_PIN = 4;
const int IN2_PIN = 5;
const int ENA_PIN = 6;   // PWM 핀

const int LEDC_CH   = 0;
const int LEDC_FREQ = 1000;  // 1kHz
const int LEDC_RES  = 8;     // 8비트 (0~255)

void setup() {
  pinMode(IN1_PIN, OUTPUT);
  pinMode(IN2_PIN, OUTPUT);
  ledcSetup(LEDC_CH, LEDC_FREQ, LEDC_RES);
  ledcAttachPin(ENA_PIN, LEDC_CH);
}

// 정방향 회전
void motorForward(int speed) {  // speed: 0~255
  digitalWrite(IN1_PIN, HIGH);
  digitalWrite(IN2_PIN, LOW);
  ledcWrite(LEDC_CH, speed);
}

// 역방향 회전
void motorReverse(int speed) {
  digitalWrite(IN1_PIN, LOW);
  digitalWrite(IN2_PIN, HIGH);
  ledcWrite(LEDC_CH, speed);
}

// 정지 (관성)
void motorCoast() {
  digitalWrite(IN1_PIN, LOW);
  digitalWrite(IN2_PIN, LOW);
  ledcWrite(LEDC_CH, 0);
}

// 브레이크 (능동 제동)
void motorBrake() {
  digitalWrite(IN1_PIN, HIGH);
  digitalWrite(IN2_PIN, HIGH);
  ledcWrite(LEDC_CH, 255);
}
```

### 방향 제어 진리표 (L298N ENA = HIGH 고정)

| IN1 | IN2 | 동작 |
|-----|-----|------|
| HIGH | LOW | 정방향 |
| LOW | HIGH | 역방향 |
| LOW | LOW | 자유 회전 (Coast) |
| HIGH | HIGH | 제동 (Brake) |

### PWM 속도 제어

| PWM 듀티 | 속도 |
|---------|------|
| 0 (0%) | 정지 |
| 64 (25%) | 저속 |
| 128 (50%) | 중속 |
| 192 (75%) | 고속 |
| 255 (100%) | 최대 속도 |

---

## 주의사항

1. **직접 GPIO 구동 금지**: DC 모터의 기동 전류는 GPIO 최대 허용 전류(40mA)를 수십 배 초과. 반드시 드라이버 IC 사용.
2. **플라이백 다이오드**: 모터 양단에 역방향 다이오드(1N4007 등) 연결하여 전원 차단 시 스파이크 전압 흡수. L298N, DRV8833 등 대부분의 드라이버 IC에는 내장됨.
3. **공통 GND**: 외부 모터 전원과 아두이노 GND를 반드시 연결.
4. **디커플링 커패시터**: 모터 양단에 0.1µF 세라믹 커패시터 추가 → 전기 노이즈 억제 (특히 무선 통신과 병용 시 필수).
5. **stall(과부하) 주의**: 모터가 멈춘 상태에서 계속 전류 공급하면 과열. 타임아웃 처리 권장.
6. **최소 동작 PWM**: 저속에서는 모터가 회전하지 않고 소리만 나는 경우가 있음 (Dead-band). 최소 PWM 값 보정 필요.

---

## 자주 쓰이는 회로 패턴

### 패턴 1: 2WD 로봇 (TT 모터 2개)

```cpp
// L298N으로 좌·우 모터 동시 제어
// ENA → 좌모터 속도, ENB → 우모터 속도
void driveForward(int speed) {
  motorLeft(speed, FORWARD);
  motorRight(speed, FORWARD);
}

void turnLeft(int speed) {
  motorLeft(speed / 2, FORWARD);
  motorRight(speed, FORWARD);
}
```

### 패턴 2: PWM 소프트 스타트

```cpp
// 급격한 전류 돌입 방지 — 서서히 가속
void softStart(int targetSpeed) {
  for (int s = 0; s <= targetSpeed; s += 5) {
    ledcWrite(LEDC_CH, s);
    delay(20);
  }
}
```

### 패턴 3: 인코더 속도 피드백

```cpp
volatile int encoderCount = 0;

void IRAM_ATTR encoderISR() {
  encoderCount++;
}

void setup() {
  attachInterrupt(digitalPinToInterrupt(ENCODER_PIN), encoderISR, RISING);
}

// 1초마다 RPM 계산
int calcRPM(int pulsesPerRev) {
  int count = encoderCount;
  encoderCount = 0;
  return (count * 60) / pulsesPerRev;
}
```
