# 릴레이 모듈 (Relay Module)

## 개요

릴레이(Relay)는 저전압/저전류 신호로 고전압/고전류 회로를 ON/OFF하는 전기적 스위치입니다. 내부의 전자석(코일)에 전류를 흘리면 자기력으로 기계적 스위치(접점)를 개폐합니다. 아두이노 3.3V/5V 신호로 220V AC 가전제품, DC 12V 모터, 조명 등을 제어할 수 있습니다.

**주요 특징:**
- 전기적 절연: 제어 회로와 부하 회로 완전 분리
- 고전압/고전류 스위칭 가능
- AC/DC 모두 스위칭 가능

**용도**: 가전 제어(조명, 팬, 히터), 솔레노이드 밸브, 고전류 모터 ON/OFF, 자동화 시스템.

---

## 모델 비교 표

| 항목 | 1채널 5V | 2채널 5V | 4채널 5V | 8채널 5V |
|------|---------|---------|---------|---------|
| 채널 수 | 1 | 2 | 4 | 8 |
| 코일 전압 | 5 V | 5 V | 5 V | 5 V |
| 코일 전류 | ~70 mA | ~140 mA | ~280 mA | ~560 mA |
| 접점 정격 전류 | 10 A | 10 A | 10 A | 10 A |
| 접점 정격 전압 (AC) | 250 V | 250 V | 250 V | 250 V |
| 접점 정격 전압 (DC) | 30 V | 30 V | 30 V | 30 V |
| 트리거 레벨 | 저레벨 (LOW) 또는 선택 | 저레벨 | 저레벨 | 저레벨 |
| 광커플러 절연 | 있음 (모듈에 따라) | 있음 | 있음 | 있음 |
| 크기 | 약 50×25 mm | 약 55×50 mm | 약 75×55 mm | 약 140×55 mm |

---

## 핀/단자 구성

### 제어 측 (아두이노 연결)

| 핀 라벨 | 기능 | 설명 |
|--------|------|------|
| VCC | 코일 전원 (+) | 5V 입력 (모듈 전원) |
| GND | 코일 전원 (-) | 공통 접지 |
| IN (또는 IN1/IN2...) | 제어 신호 입력 | LOW 또는 HIGH로 릴레이 ON |

### 부하 측 (릴레이 접점)

| 단자 | 명칭 | 기능 |
|------|------|------|
| COM | Common | 공통 단자 (부하 전원 한쪽 연결) |
| NO | Normally Open | 평상시 열림 (릴레이 OFF 시 개방, ON 시 단락) |
| NC | Normally Closed | 평상시 닫힘 (릴레이 OFF 시 단락, ON 시 개방) |

```
릴레이 동작 상태:
  OFF 상태: COM ─── NC (단락),  COM ─┤├─ NO (개방)
  ON 상태:  COM ─┤├─ NC (개방), COM ─── NO (단락)
```

---

## 전기적 스펙 표

| 항목 | 값 |
|------|----|
| 코일 동작 전압 | 5 V DC |
| 코일 동작 전류 | 60 ~ 75 mA |
| 코일 저항 | 약 70 ~ 90 Ω |
| 픽업 전압 (동작 최소) | ~3.5 V |
| 릴리즈 전압 (복귀 최대) | ~0.5 V |
| 최대 접점 전류 (저항 부하) | 10 A |
| 최대 접점 전압 AC | 250 V AC |
| 최대 접점 전압 DC | 30 V DC |
| 최대 스위칭 전력 | 2500 VA / 300 W |
| 최소 접점 전류 | 100 mA |
| 접촉 저항 | ≤ 100 mΩ |
| 동작 시간 | ~7 ms |
| 복귀 시간 | ~3 ms |
| 기계적 수명 | ≥ 10,000,000회 |
| 전기적 수명 | ≥ 100,000회 |
| 동작 온도 | -40 ~ +85 °C |
| 절연 저항 | ≥ 100 MΩ, 500VDC |
| 절연 내압 | 1000 VAC, 1분 |

---

## 동작 원리

**전자기 릴레이(Electromagnetic Relay) 작동 과정:**

1. **OFF 상태**: 코일에 전류 없음 → 전자석 비활성 → 스프링이 접점을 NC에 유지
2. **ON 신호 인가**: 아두이노 → 트랜지스터(또는 ULN2003) → 코일에 전류 흐름
3. **전자석 활성화**: 코일 자기장이 철제 아마추어(armature) 흡인
4. **접점 전환**: 아마추어가 당겨지며 COM-NC 단락 → COM-NO 단락으로 전환
5. **OFF 신호**: 코일 전류 차단 → 스프링 복원력으로 원래 위치 복귀

**플라이백 다이오드**: 코일 전류 차단 시 역기전력(inductance 특성) 발생 → 모듈에 내장된 다이오드(1N4007)가 흡수.

---

## 아두이노 연결 방법

### ESP32-C3와 5V 릴레이 모듈

```
외부 5V 전원 (또는 아두이노 5V 핀)
├── (+) ─────────────────────→ 릴레이 모듈 VCC
└── (─) ─────────────────────→ 릴레이 모듈 GND

ESP32-C3
├── G4 ──────────────────────→ 릴레이 모듈 IN
└── GND ─────────────────────→ 릴레이 모듈 GND (공통 GND)

릴레이 접점 (부하 측 — 예: AC 조명)
  COM ─────→ 전원 한쪽 (L 또는 N)
  NO  ─────→ 부하 한쪽
  부하 반대쪽 → 전원 반대쪽
```

> **중요**: ESP32-C3 GPIO는 3.3V. 대부분 5V 릴레이 모듈은 광커플러 내장으로 3.3V 입력 동작 가능 (5V VCC, 3.3V 신호 허용).  
> 단, 모듈에 따라 동작 안 할 수 있음 → 3.3V 릴레이 모듈 사용 권장.

### 트리거 레벨 확인

| 모듈 종류 | 릴레이 ON 조건 |
|----------|---------------|
| 저레벨 트리거 (Active LOW) | IN = LOW → 릴레이 ON |
| 고레벨 트리거 (Active HIGH) | IN = HIGH → 릴레이 ON |
| 선택형 (점퍼 있음) | 점퍼로 HIGH/LOW 선택 |

---

## 제어 방법

### 기본 ON/OFF (저레벨 트리거 모듈 기준)

```cpp
const int RELAY_PIN = 4;

void setup() {
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);  // 초기화: OFF (저레벨 트리거)
}

void loop() {
  // 릴레이 ON (NO 단락)
  digitalWrite(RELAY_PIN, LOW);
  delay(2000);

  // 릴레이 OFF
  digitalWrite(RELAY_PIN, HIGH);
  delay(2000);
}
```

### 2채널 릴레이 개별 제어

```cpp
const int RELAY1_PIN = 4;
const int RELAY2_PIN = 5;

#define RELAY_ON  LOW   // 저레벨 트리거
#define RELAY_OFF HIGH

void setup() {
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  // 초기 상태: 모두 OFF
  digitalWrite(RELAY1_PIN, RELAY_OFF);
  digitalWrite(RELAY2_PIN, RELAY_OFF);
}

void setRelay(int pin, bool state) {
  digitalWrite(pin, state ? RELAY_ON : RELAY_OFF);
}
```

### 타이머 기반 자동 제어

```cpp
// 오전 8시 ON, 오후 10시 OFF (RTC 모듈 연동)
void checkSchedule(int hour) {
  if (hour == 8)  setRelay(RELAY1_PIN, true);
  if (hour == 22) setRelay(RELAY1_PIN, false);
}
```

### 4채널 릴레이 순차 제어

```cpp
const int RELAY_PINS[] = {4, 5, 6, 7};
const int RELAY_COUNT = 4;

void sequentialOn(int delayMs) {
  for (int i = 0; i < RELAY_COUNT; i++) {
    digitalWrite(RELAY_PINS[i], LOW);  // 저레벨 트리거
    delay(delayMs);
  }
}

void allOff() {
  for (int i = 0; i < RELAY_COUNT; i++) {
    digitalWrite(RELAY_PINS[i], HIGH);
  }
}
```

---

## 주의사항

1. **감전 위험**: 릴레이 부하 측에 AC 220V를 연결할 경우 반드시 전원 차단 후 배선. 고압 회로 작업은 전문 지식 필요.
2. **5V 코일 전력**: 채널당 ~70mA. 아두이노 5V 핀의 최대 공급 전류(500mA) 초과 시 외부 5V 전원 사용.
3. **초기 출력 상태**: 아두이노 부팅 시 GPIO는 INPUT(하이 임피던스) → 릴레이가 순간 ON될 수 있음. `setup()`에서 즉시 HIGH(저레벨 트리거) 설정.
4. **Arc(아크) 손상**: 고전류 부하 스위칭 시 접점에서 아크 발생 → 접점 수명 단축. 최대 정격의 80% 이내에서 사용.
5. **유도 부하**: 모터, 솔레노이드 등 유도성 부하는 순간 역기전력으로 접점 손상 가능 → 스너버 회로(RC 직렬) 추가 권장.
6. **기계적 소음**: 릴레이 ON/OFF 시 딸깍 소리 발생. 고주파 스위칭에 부적합 (1~2 Hz 이하 권장).
7. **3.3V 트리거**: ESP32-C3는 3.3V GPIO → 광커플러 내장 모듈은 동작 가능, 아닌 경우 레벨 시프터 필요.
8. **배선 분리**: 고전압 부하 배선과 저전압 신호 배선을 물리적으로 분리.

---

## 자주 쓰이는 회로 패턴

### 패턴 1: PIR 센서 → 릴레이 → 조명 자동화

```cpp
const int PIR_PIN   = 3;
const int RELAY_PIN = 4;

void loop() {
  bool motion = digitalRead(PIR_PIN);
  digitalWrite(RELAY_PIN, motion ? LOW : HIGH);  // 저레벨 트리거
}
```

### 패턴 2: 온도 초과 시 팬 자동 가동

```cpp
float temp = readTemperature();
if (temp > 30.0) {
  digitalWrite(RELAY_PIN, LOW);   // 팬 ON
} else if (temp < 27.0) {
  digitalWrite(RELAY_PIN, HIGH);  // 팬 OFF (히스테리시스)
}
```

### 패턴 3: 웹 서버로 원격 제어 (ESP32 Wi-Fi)

```cpp
// /relay/on  → 릴레이 ON
// /relay/off → 릴레이 OFF
server.on("/relay/on",  []() {
  digitalWrite(RELAY_PIN, LOW);
  server.send(200, "text/plain", "Relay ON");
});
server.on("/relay/off", []() {
  digitalWrite(RELAY_PIN, HIGH);
  server.send(200, "text/plain", "Relay OFF");
});
```

### 패턴 4: 타임아웃 자동 OFF (안전 장치)

```cpp
unsigned long relayOnTime = 0;
const unsigned long MAX_ON_TIME = 30000;  // 30초

void turnRelayOn() {
  digitalWrite(RELAY_PIN, LOW);
  relayOnTime = millis();
}

void loop() {
  // 30초 후 자동 OFF
  if (digitalRead(RELAY_PIN) == LOW &&
      millis() - relayOnTime > MAX_ON_TIME) {
    digitalWrite(RELAY_PIN, HIGH);
  }
}
```

### NO vs NC 선택 기준

| 상황 | 사용 접점 | 이유 |
|------|----------|------|
| 평소 OFF, 제어 시 ON | NO (Normally Open) | 안전, 기본 차단 |
| 평소 ON, 장애 시 OFF | NC (Normally Closed) | 장애 안전(Fail-safe) |
| 전원 절약 | NO | 코일 전류 = 0 시 부하 차단 |
