# 수동 부저 (Passive Buzzer)

## 개요

수동 부저(Passive Buzzer)는 내부 발진 회로가 없는 단순한 압전 소자 또는 전자기 진동 소자입니다. 외부에서 PWM(교류) 신호를 공급해야 소리가 나며, 입력 신호의 주파수에 따라 음높이(Pitch)가 결정됩니다. "수동(Passive)"이라는 이름은 외부 신호에 수동적으로 반응한다는 의미입니다.

**능동 부저와 차이**: 수동 부저는 다양한 주파수로 구동 가능 → 음계 연주, 멜로디 구현 가능.

**용도**: 음악/멜로디 재생, 음계별 경고음, 버튼 피드백, 간단한 신호음.

---

## 모델 비교 표

| 항목 | 소형 압전형 (3V) | 표준형 (5V) | 전자기형 |
|------|----------------|------------|---------|
| 동작 전압 | 1.5 ~ 5 V | 3.5 ~ 5 V | 5 ~ 12 V |
| 소비 전류 | < 5 mA | ~10 mA | 25 ~ 100 mA |
| 주파수 응답 | 1 ~ 20 kHz | 100 Hz ~ 10 kHz | 100 Hz ~ 3 kHz |
| 음압 | 60 ~ 80 dB | 75 ~ 85 dB | 85 ~ 95 dB |
| 직경 | 9 ~ 12 mm | 12 ~ 23 mm | 23 ~ 36 mm |
| 극성 | 있음 (압전형) | 있음 | 없음 |
| 특징 | ESP32 직결 가능 | 범용 | 저음, 고음압 |

---

## 핀/단자 구성

| 단자 | 식별 | 기능 |
|------|------|------|
| + (양극) | 긴 핀 / 빨강 선 | VCC 또는 PWM 신호 입력 |
| - (음극) | 짧은 핀 / 검정 선 | GND 연결 |

> 압전형 수동 부저는 극성이 있음. 전자기형은 극성 없이 사용 가능.  
> (+)에 PWM 신호를 직접 연결하고 (-)를 GND에 연결하는 방식이 일반적.

---

## 전기적 스펙 표

| 항목 | 값 |
|------|----|
| 동작 전압 | 1.5 ~ 5 V (압전형), 3.5 ~ 5 V (전자기형) |
| 정격 전류 | < 10 mA (압전형), < 30 mA (전자기형) |
| 최적 구동 주파수 | 2 kHz ~ 4 kHz (공명 주파수 근처) |
| 주파수 응답 범위 | 100 Hz ~ 10 kHz |
| 음압 레벨 | 70 ~ 85 dB at 10 cm (5V, 2kHz) |
| 입력 신호 | 사각파 PWM (50% 듀티) |
| 동작 온도 | -20 ~ +70 °C |
| 보관 온도 | -30 ~ +80 °C |
| 임피던스 | 16 ~ 50 Ω (전자기형) |
| 커패시턴스 | 수십 nF (압전형) |

### 옥타브별 음계 주파수 표

| 음계 | 4옥타브 | 5옥타브 | 6옥타브 |
|------|---------|---------|---------|
| Do (C) | 261.6 Hz | 523.3 Hz | 1046.5 Hz |
| Re (D) | 293.7 Hz | 587.3 Hz | 1174.7 Hz |
| Mi (E) | 329.6 Hz | 659.3 Hz | 1318.5 Hz |
| Fa (F) | 349.2 Hz | 698.5 Hz | 1396.9 Hz |
| Sol (G) | 392.0 Hz | 784.0 Hz | 1568.0 Hz |
| La (A) | 440.0 Hz | 880.0 Hz | 1760.0 Hz |
| Si (B) | 493.9 Hz | 987.8 Hz | 1975.5 Hz |

---

## 동작 원리

수동 부저는 **압전 효과(Piezoelectric Effect)** 또는 **전자기 효과**를 이용합니다.

**압전형:**
1. 압전 세라믹(PZT) 소자에 교류 전압 인가
2. 전기장 변화 → 압전 소자 기계적 변형 (신축)
3. 기계적 진동 → 공기를 흔들어 음파 발생
4. 입력 주파수 = 음파 주파수 = 음높이

**소리 크기 결정 요인:**
- 구동 전압이 클수록 진폭 증가 → 음량 증가
- 공명 주파수(보통 2~4 kHz) 근처에서 음량 최대
- 50% 듀티 사이클일 때 최대 음량

---

## 아두이노 연결 방법

### 직접 GPIO 연결

```
ESP32-C3 Super Mini       수동 부저
───────────────────       ─────────
G4 (PWM 핀) ──────────→ + (양극)
GND ─────────────────→ - (음극)
```

ESP32-C3의 3.3V PWM으로 직접 구동 가능 (압전형 소형 부저).  
전류 소비가 적어 GPIO 직결 안전.

### 전자기형 수동 부저 — 트랜지스터 구동

```
ESP32-C3 G4 ──[1kΩ]──→ NPN 트랜지스터 베이스
                          콜렉터 ──→ 부저 (+)
                          에미터 ──→ GND
5V ──────────────────→ 부저 (+)를 통해 콜렉터로
```

---

## 제어 방법

### tone() 함수 사용 (Arduino 호환)

```cpp
const int BUZZER_PIN = 4;

void setup() {
  // 아무것도 없음
}

void loop() {
  tone(BUZZER_PIN, 440);    // 440 Hz (라 음) 지속 출력
  delay(500);
  tone(BUZZER_PIN, 880);    // 880 Hz (1옥타브 위 라)
  delay(500);
  noTone(BUZZER_PIN);       // 소리 끄기
  delay(500);
}
```

### ESP32 ledc를 이용한 PWM 직접 제어 (더 안정적)

```cpp
const int BUZZER_PIN  = 4;
const int LEDC_CH     = 0;
const int LEDC_RES    = 8;  // 8비트

void playTone(int freq, int durationMs) {
  if (freq == 0) {
    ledcWrite(LEDC_CH, 0);  // 묵음
    delay(durationMs);
    return;
  }
  ledcSetup(LEDC_CH, freq, LEDC_RES);
  ledcAttachPin(BUZZER_PIN, LEDC_CH);
  ledcWrite(LEDC_CH, 128);  // 50% 듀티 = 최대 음량
  delay(durationMs);
  ledcWrite(LEDC_CH, 0);    // 끄기
}

void stopTone() {
  ledcWrite(LEDC_CH, 0);
  ledcDetachPin(BUZZER_PIN);
}
```

### 음계 상수 정의 및 멜로디 재생

```cpp
// 음계 주파수 정의 (4옥타브)
#define NOTE_C4  262
#define NOTE_D4  294
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_G4  392
#define NOTE_A4  440
#define NOTE_B4  494
#define NOTE_C5  523
#define NOTE_REST 0

// 노래: 도레미파솔
const int melody[] = {
  NOTE_C4, NOTE_D4, NOTE_E4, NOTE_F4,
  NOTE_G4, NOTE_A4, NOTE_B4, NOTE_C5
};

// 음 길이: 4 = 4분음표, 8 = 8분음표
const int noteDurations[] = {4, 4, 4, 4, 4, 4, 4, 4};

const int BPM     = 120;
const int QUARTER = 60000 / BPM;  // 4분음표 시간(ms)

void playMelody() {
  for (int i = 0; i < 8; i++) {
    int duration = QUARTER * 4 / noteDurations[i];
    playTone(melody[i], duration * 0.9);  // 10% 쉬기
    delay(duration * 0.1);
  }
}
```

### 논블로킹 멜로디 재생

```cpp
unsigned long noteStart = 0;
int noteIndex = 0;
bool playing = false;

void startMelody() {
  noteIndex = 0;
  playing = true;
  noteStart = millis();
  playTone(melody[0], 0);  // 첫 음 시작 (delay 없이)
  ledcWrite(LEDC_CH, 128);
}

void updateMelody() {
  if (!playing) return;

  int duration = QUARTER * 4 / noteDurations[noteIndex];
  if (millis() - noteStart >= duration) {
    noteIndex++;
    if (noteIndex >= 8) {
      playing = false;
      stopTone();
      return;
    }
    noteStart = millis();
    int freq = melody[noteIndex];
    if (freq == NOTE_REST) {
      ledcWrite(LEDC_CH, 0);
    } else {
      ledcSetup(LEDC_CH, freq, LEDC_RES);
      ledcWrite(LEDC_CH, 128);
    }
  }
}
```

---

## 주의사항

1. **능동 부저와 혼동 금지**: 외관 거의 동일. 식별법: DC 전원만 인가 시 소리 나면 능동, 소리 안 나면 수동.
2. **50% 듀티 사용**: 부저 음량 최대화를 위해 PWM 듀티는 128/255 (50%)로 설정.
3. **tone() vs ledc**: ESP32에서 `tone()`은 내부적으로 ledc 채널을 사용. 다른 ledc 기능과 채널 충돌 주의.
4. **공명 주파수 활용**: 부저마다 공명 주파수가 다름. 2~4 kHz에서 가장 큰 소리. 낮은 주파수는 음량 작음.
5. **전압에 따른 음량**: 3.3V 구동 시 5V 대비 음량 약 30~40% 감소. 소리가 작으면 전압 확인.
6. **고주파 노이즈**: PWM 스위칭이 다른 아날로그 신호에 간섭 가능. 부저와 센서 배선 분리.
7. **지연 없이 연속 음**: `noTone()` 또는 묵음 구간 없이 주파수 변경 시 클릭 소음 발생 → 짧은 묵음 구간 추가.

---

## 자주 쓰이는 회로 패턴

### 패턴 1: 버튼으로 피아노

```cpp
const int keys[] = {NOTE_C4, NOTE_D4, NOTE_E4, NOTE_F4, NOTE_G4};
const int btns[] = {2, 3, 4, 5, 6};

void loop() {
  bool anyPressed = false;
  for (int i = 0; i < 5; i++) {
    if (digitalRead(btns[i]) == LOW) {
      playTone(keys[i], 0);  // duration 0 → ledc 설정만
      ledcWrite(LEDC_CH, 128);
      anyPressed = true;
      break;
    }
  }
  if (!anyPressed) stopTone();
}
```

### 패턴 2: 거리 센서 연동 경고음

```cpp
// 거리가 가까울수록 비프 빠르게
int distance = getUltrasonicDistance();
int beepInterval = map(distance, 5, 50, 100, 1000);
beepInterval = constrain(beepInterval, 100, 1000);

static unsigned long lastBeep = 0;
if (millis() - lastBeep > beepInterval) {
  lastBeep = millis();
  playTone(2000, 50);
}
```

### 패턴 3: 시작/완료/오류 음 구분

```cpp
void soundStart()    { playTone(880, 100); delay(50); playTone(1100, 200); }
void soundComplete() { playTone(523, 100); playTone(659, 100); playTone(784, 300); }
void soundError()    { playTone(220, 500); delay(100); playTone(220, 500); }
```

### 패턴 4: 해리포터 테마 일부

```cpp
const int HP_MELODY[] = {
  NOTE_B4, NOTE_E5, NOTE_G5, NOTE_F5, NOTE_E5,
  NOTE_B5, NOTE_A5, NOTE_F5, NOTE_E5, NOTE_G5,
  NOTE_F5, NOTE_D5, NOTE_E5
};
const int HP_BEATS[] = {2, 4, 1, 2, 1, 4, 4, 2, 1, 2, 1, 3, 4};
```
