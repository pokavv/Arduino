# 능동 부저 (Active Buzzer)

## 개요

능동 부저(Active Buzzer)는 내부에 발진 회로(oscillator)가 내장되어 있어 DC 전원만 공급하면 자동으로 일정한 주파수(보통 2~4 kHz)의 소리를 냅니다. "능동(Active)"이라는 이름은 내부 회로가 능동적으로 발진한다는 의미입니다.

**수동 부저와 차이**: 능동 부저는 ON/OFF만 제어. 주파수 변경 불가. 수동 부저는 PWM 주파수를 바꿔 음계 연주 가능.

**용도**: 경고음, 알람, 동작 확인 비프(beep) 신호.

---

## 모델 비교 표

| 항목 | 소형 (5V) | 소형 (3.3V) | 대형 (12V) |
|------|-----------|------------|-----------|
| 동작 전압 | 4 ~ 8 V | 3 ~ 5 V | 9 ~ 15 V |
| 표준 전압 | 5 V | 3.3 V | 12 V |
| 소비 전류 | ~25 mA | ~10 mA | ~35 mA |
| 주파수 | 2.3 kHz ±300 Hz | 2.5 kHz | 2.3 kHz |
| 음압 레벨 | ≥ 85 dB @ 10 cm | ≥ 75 dB | ≥ 95 dB |
| 크기 (직경) | 12 mm | 9 mm | 23 mm |
| 기판 장착 | THT (핀 타입) | SMD / THT | THT |

---

## 핀/단자 구성

능동 부저는 2단자 극성 소자입니다.

| 단자 | 식별 방법 | 기능 |
|------|----------|------|
| + (양극, Anode) | 긴 핀 / 흰 스티커에 (+) 표시 / 핀 없는 쪽 | VCC 연결 |
| - (음극, Cathode) | 짧은 핀 / 케이스 하단 마이너스 기호 | GND 연결 |

> 극성을 반대로 연결하면 소리가 나지 않음. 부저 파손 위험은 낮으나 동작 안 함.

---

## 전기적 스펙 표

| 항목 | 값 |
|------|----|
| 정격 전압 | 5 V DC |
| 동작 전압 범위 | 4 ~ 8 V |
| 정격 전류 | ≤ 25 mA |
| 최대 전류 | 30 mA |
| 공명 주파수 | 2300 Hz ± 300 Hz |
| 음압 레벨 | ≥ 85 dB (at 10 cm) |
| 동작 온도 | -20 ~ +70 °C |
| 보관 온도 | -30 ~ +80 °C |
| 입력 신호 | DC (ON/OFF) |
| 내부 저항 | ~16 Ω |
| 케이스 직경 | 12 mm |
| 케이스 높이 | 9.5 mm |

---

## 동작 원리

능동 부저 내부 구조:
1. **발진 회로 (Oscillator)**: RC 발진기 또는 트랜지스터 기반 멀티바이브레이터가 2~4 kHz의 교류 신호 생성
2. **압전 소자 (Piezoelectric Element)** 또는 **전자기 진동판**: 교류 신호를 받아 기계적 진동 발생 → 소리 방출
3. 전원 공급 → 발진 → 진동 → 소리 (단순 ON/OFF 제어)

**전자기형 vs 압전형:**
- 전자기형(Magnetic): 낮고 강한 음, 전류 소비 많음, 저주파 적합
- 압전형(Piezo): 고주파, 낮은 전류, 더 날카로운 소리

---

## 아두이노 연결 방법

### 직접 GPIO 연결 (3.3V/5V 부저)

```
ESP32-C3 Super Mini       능동 부저
───────────────────       ─────────
G4 (또는 임의 GPIO) ────→ + (양극)
GND ─────────────────→ - (음극)
```

**주의**: 5V 능동 부저를 ESP32-C3 3.3V로 구동 시 음량이 작거나 동작하지 않을 수 있음.  
→ 3.3V 호환 부저 사용 권장, 또는 트랜지스터를 통해 5V 구동.

### 트랜지스터를 이용한 5V 능동 부저 구동

```
ESP32-C3 G4 ──[1kΩ]──→ NPN 트랜지스터 (2N2222, S8050) 베이스
                          콜렉터 ──→ 부저 (-) ──→ 5V
                          에미터 ──→ GND
5V 외부 전원 ──→ 부저 (+)
```

또는 간단히:
```
ESP32-C3 G4 ──→ 부저 모듈 I/O 핀
5V ──────────→ 부저 모듈 VCC
GND ─────────→ 부저 모듈 GND
```
> 대부분의 부저 모듈에는 트랜지스터가 내장되어 있어 3.3V GPIO로 5V 부저를 제어 가능.

---

## 제어 방법

### 기본 ON/OFF

```cpp
const int BUZZER_PIN = 4;

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  digitalWrite(BUZZER_PIN, HIGH);  // 부저 켜기
  delay(500);
  digitalWrite(BUZZER_PIN, LOW);   // 부저 끄기
  delay(500);
}
```

### 비프 패턴 (비블로킹 millis 방식)

```cpp
const int BUZZER_PIN = 4;

struct BuzzerState {
  bool on;
  unsigned long lastToggle;
  int onDuration;
  int offDuration;
  int beepCount;
  int maxBeeps;
};

BuzzerState bz = {false, 0, 100, 100, 0, 3};

void updateBuzzer() {
  if (bz.beepCount >= bz.maxBeeps * 2) return;  // 완료

  unsigned long now = millis();
  int duration = bz.on ? bz.onDuration : bz.offDuration;

  if (now - bz.lastToggle >= duration) {
    bz.on = !bz.on;
    digitalWrite(BUZZER_PIN, bz.on ? HIGH : LOW);
    bz.lastToggle = now;
    bz.beepCount++;
  }
}

void startBeep(int count, int onMs, int offMs) {
  bz.on = true;
  bz.lastToggle = millis();
  bz.onDuration = onMs;
  bz.offDuration = offMs;
  bz.beepCount = 0;
  bz.maxBeeps = count;
  digitalWrite(BUZZER_PIN, HIGH);
}

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
  startBeep(3, 100, 100);  // 3회 짧은 비프
}

void loop() {
  updateBuzzer();
  // 다른 코드 계속 실행 가능
}
```

### SOS 패턴 예시

```cpp
void beep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
  delay(100);
}

void sos() {
  // S: 짧게 3회
  for (int i = 0; i < 3; i++) beep(150);
  delay(200);
  // O: 길게 3회
  for (int i = 0; i < 3; i++) beep(400);
  delay(200);
  // S: 짧게 3회
  for (int i = 0; i < 3; i++) beep(150);
  delay(1000);
}
```

---

## 주의사항

1. **극성 확인**: 능동 부저는 반드시 극성을 맞춰 연결. 반대 연결 시 소리 안 남.
2. **3.3V 직접 구동**: ESP32-C3의 3.3V GPIO로 5V 부저 직접 구동 시 음량 저하. 트랜지스터 또는 모듈 사용.
3. **수동 부저 오인 주의**: 외관이 비슷한 수동 부저와 혼동 금지. 능동 부저는 DC 인가 시 즉시 소리, 수동은 PWM 없이 소리 안 남.
4. **PWM 사용 금지**: 능동 부저에 PWM 신호를 주면 불규칙한 소음 발생. 단순 HIGH/LOW만 사용.
5. **소음 주의**: 능동 부저의 소리는 매우 날카로움. 장시간 개발 중에는 직렬 저항(100Ω~470Ω)으로 음량 줄이기 가능.
6. **노이즈 차폐**: 부저는 스위칭 시 EMI 발생. 민감한 센서와 가까이 배치 금지.

---

## 자주 쓰이는 회로 패턴

### 패턴 1: 이벤트 알림 비프

```cpp
void alertBeep(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(50);
    digitalWrite(BUZZER_PIN, LOW);
    delay(50);
  }
}
// 사용 예: 버튼 누르면 1회 비프
if (digitalRead(BTN) == LOW) alertBeep(1);
```

### 패턴 2: 온도 경고 알람

```cpp
float temp = readTemperature();
if (temp > TEMP_THRESHOLD) {
  // 경고: 0.5초 간격 연속 비프
  static unsigned long lastToggle = 0;
  if (millis() - lastToggle > 500) {
    lastToggle = millis();
    digitalWrite(BUZZER_PIN, !digitalRead(BUZZER_PIN));
  }
} else {
  digitalWrite(BUZZER_PIN, LOW);
}
```

### 패턴 3: 카운트다운 비프

```cpp
// 3, 2, 1 카운트다운 후 긴 비프
for (int i = 3; i > 0; i--) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  delay(900);
}
// 최종 알람
digitalWrite(BUZZER_PIN, HIGH);
delay(1000);
digitalWrite(BUZZER_PIN, LOW);
```
