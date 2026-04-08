# 소리 감지 센서 (KY-038) — Sound Detection Sensor

## 개요

KY-038은 마이크(전기 콘덴서 마이크)와 LM393 비교기(Comparator) IC를 조합한 소리 감지 모듈입니다.
주변 소리의 음압(Sound Pressure Level)을 감지하여 아날로그 전압과 디지털 트리거 신호를 동시에 출력합니다.

**측정 원리**
콘덴서 마이크(ECM: Electret Condenser Microphone)는 음압에 따라 진동하는 다이어프램의
정전용량 변화를 전압으로 변환합니다. 내장 FET로 임피던스 변환 후 신호를 출력합니다.
LM393 비교기가 마이크 출력 전압과 가변저항으로 설정한 임계값을 비교하여 디지털 출력을 결정합니다.

**아두이노에서의 활용**
소리 감지 트리거(박수로 조명 켜기), 소음 레벨 모니터링, 음성 명령 트리거,
간단한 VU 미터, 진동 감지 등에 활용됩니다.

---

## 모델 비교

| 항목 | KY-038 | KY-037 | MAX4466 모듈 | MAX9814 모듈 |
|------|--------|--------|-------------|-------------|
| 출력 | AO + DO | AO + DO | AO만 | AO만 |
| 비교기 | LM393 | LM393 | 없음 | 없음 |
| AGC (자동 이득) | 없음 | 없음 | 없음 | 있음 |
| 게인 조절 | 가변저항 | 가변저항 | 고정/조절 가능 | 자동 |
| SNR | 낮음 | 낮음 | 중간 | 높음 |
| 용도 | 트리거 감지 | 트리거 감지 | 파형 측정 | 정밀 측정 |
| 전압 | 3.3 ~ 5V | 3.3 ~ 5V | 2.4 ~ 5V | 2.7 ~ 5.5V |

---

## 핀 구성

### KY-038 모듈

```
  ┌─────────────────────┐
  │  (마이크)   (가변저항) │
  │                     │
  │  VCC GND  DO   AO   │
  └─────────────────────┘
```

| 핀 이름 | 역할 |
|---------|------|
| VCC | 전원 (+3.3V ~ 5V) |
| GND | 접지 |
| DO (D0) | 디지털 출력 (소리 감지 시 HIGH 또는 LOW, 가변저항 임계값 기준) |
| AO (A0) | 아날로그 출력 (마이크 신호 전압, 소리 크기에 비례) |

---

## 전기적 스펙

| 파라미터 | 값 | 단위 |
|----------|-----|------|
| 동작 전압 | 3.3 ~ 5 | V |
| 동작 전류 | 약 5 | mA |
| AO 출력 범위 | 0 ~ VCC | V |
| DO 출력 HIGH | VCC에 근접 | V |
| DO 출력 LOW | 0 (GND 근접) | V |
| 마이크 감도 범위 | 약 50 ~ 80 | dB |
| 마이크 지향성 | 무지향성 | — |
| 마이크 주파수 응답 | 20 ~ 20000 | Hz |
| LM393 응답 시간 | 1.3 | µs |
| 모듈 크기 | 36 × 15 | mm |

---

## 통신 프로토콜

### 아날로그 출력 (AO)

```
무음 상태: 출력 전압 ≈ VCC/2 (바이어스 포인트, 약 1.65V at 3.3V)
소리 발생: 교류 성분이 겹쳐져 전압이 VCC/2 기준으로 진동
소리 클수록: 진폭이 커지고 ADC 피크-투-피크 차이가 증가
```

### 디지털 출력 (DO)

```
소리 레벨 < 임계값: DO = HIGH (조용)
소리 레벨 > 임계값: DO = LOW  (소리 감지됨)

※ KY-038의 DO는 소리 감지 시 LOW로 반전되는 경우가 많습니다.
  실제 동작은 모듈마다 다를 수 있으므로 테스트 필요.
```

---

## 아두이노 연결 방법

### ESP32-C3 연결

```
ESP32-C3          KY-038 모듈
  3.3V ──────────── VCC
  GND  ──────────── GND
  G1   ──────────── AO (아날로그)
  G4   ──────────── DO (디지털)
```

### 가변저항 설정

```
KY-038 상단의 파란 가변저항을 조절합니다:
  CW (시계 방향): 임계값 높아짐 → 더 큰 소리만 감지
  CCW (반시계): 임계값 낮아짐 → 더 작은 소리도 감지

설정 방법:
  1. 가변저항을 중간 위치로 설정
  2. 아무 소리도 없을 때 DO LED가 OFF 확인
  3. 박수나 목표 소리를 냈을 때 DO LED가 ON 확인
  4. 적절히 조절
```

### 디지털 감지 코드 (박수 감지 예시)

```cpp
#define SOUND_DO_PIN  4

void setup() {
  Serial.begin(115200);
  pinMode(SOUND_DO_PIN, INPUT);
}

void loop() {
  // KY-038: 소리 감지 시 DO = LOW (반전 주의)
  if (digitalRead(SOUND_DO_PIN) == LOW) {
    Serial.println("소리 감지!");
    delay(200); // 채터링 방지
  }
}
```

### 아날로그 소리 크기 측정 코드

```cpp
#define SOUND_AO_PIN  1
#define SAMPLE_WINDOW 50  // 측정 윈도우 (ms)

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
}

int getSoundLevel() {
  unsigned long startMs = millis();
  int peakHigh = 0, peakLow = 4095;

  // SAMPLE_WINDOW ms 동안 최대/최소 ADC 값 수집
  while (millis() - startMs < SAMPLE_WINDOW) {
    int raw = analogRead(SOUND_AO_PIN);
    if (raw > peakHigh) peakHigh = raw;
    if (raw < peakLow)  peakLow  = raw;
  }

  return peakHigh - peakLow; // 피크-투-피크 차이 (0~4095)
}

void loop() {
  int level = getSoundLevel();
  int percent = map(level, 0, 1000, 0, 100);
  percent = constrain(percent, 0, 100);

  Serial.printf("소리 레벨: %d  (%d%%)\n", level, percent);

  // 간단한 VU 미터 출력
  String bar = "";
  for (int i = 0; i < percent / 5; i++) bar += "#";
  Serial.println(bar);

  delay(100);
}
```

### 박수 두 번 감지 (Double Clap 패턴)

```cpp
#define SOUND_DO_PIN      4
#define CLAP_TIMEOUT_MS   500  // 두 번째 박수 대기 시간
#define CLAP_DEBOUNCE_MS  100  // 채터링 방지

unsigned long lastClapTime = 0;
int           clapCount    = 0;

void loop() {
  if (digitalRead(SOUND_DO_PIN) == LOW) { // 소리 감지 (LOW=감지)
    unsigned long now = millis();

    if (now - lastClapTime > CLAP_DEBOUNCE_MS) {
      lastClapTime = now;
      clapCount++;
      Serial.printf("박수 %d번\n", clapCount);
    }
  }

  // 첫 번째 박수 후 CLAP_TIMEOUT_MS 이내에 두 번째가 없으면 리셋
  if (clapCount >= 1 && millis() - lastClapTime > CLAP_TIMEOUT_MS) {
    if (clapCount >= 2) {
      Serial.println("박수 두 번! 조명 전환!");
      // 조명 토글 등 동작
    }
    clapCount = 0;
  }
}
```

---

## 측정값 계산 공식

### 피크-투-피크 전압 → 음압 레벨 (근사)

```
V_pp = (ADC_max - ADC_min) × V_REF / (2^비트 - 1)

V_rms = V_pp / (2 × √2)  // 정현파 가정

dBu = 20 × log10(V_rms / 0.7746)  // 0 dBu = 0.7746 Vrms

※ 이 계산은 매우 근사적입니다. KY-038은 정밀 음압 측정 목적이 아닙니다.
```

### 주파수 분석 (FFT, 선택적)

ESP32에서 FFT를 적용하면 소리의 주파수 성분을 분석할 수 있습니다:

```cpp
// ArduinoFFT 라이브러리 사용
#include <arduinoFFT.h>

const uint16_t SAMPLES    = 512;
const float    SAMPLE_FREQ = 5000; // Hz

float vReal[SAMPLES], vImag[SAMPLES];
ArduinoFFT<float> FFT;

// samples 수집 후:
FFT.windowing(vReal, SAMPLES, FFT_WIN_TYP_HAMMING, FFT_FORWARD);
FFT.compute(vReal, vImag, SAMPLES, FFT_FORWARD);
FFT.complexToMagnitude(vReal, vImag, SAMPLES);
float peakFreq = FFT.majorPeak(vReal, SAMPLES, SAMPLE_FREQ);
```

---

## 주의사항

1. **DO 극성 확인 필수**
   - 일부 KY-038은 소리 감지 시 DO = LOW, 조용할 때 DO = HIGH
   - 반대로 동작하는 모듈도 있으므로 반드시 실제 동작 테스트

2. **AO는 AC 신호**
   - 마이크 출력은 AC(교류) 성분 — 순간 ADC 값이 아닌 피크-투-피크 차이를 측정해야 의미 있음
   - 단순히 `analogRead()` 한 번 호출하면 임의의 순간 전압이 읽힘

3. **SNR(신호 대 잡음비) 낮음**
   - KY-038은 저가 마이크를 사용하여 SNR이 낮아 배경 잡음 영향을 받음
   - 정밀한 음향 측정에는 MAX4466 또는 MAX9814 모듈 권장

4. **전원 노이즈**
   - MCU 동작 및 Wi-Fi 송수신 시 발생하는 전원 노이즈가 마이크 신호에 영향 가능
   - VCC-GND 사이에 100nF 바이패스 커패시터 추가 권장

5. **진동 간섭**
   - 마이크가 기계적 진동에도 반응하므로 진동이 심한 환경에서는 방진 마운트 필요

6. **ADC 샘플링 속도**
   - 20kHz 음성 신호를 제대로 포착하려면 최소 40kHz 샘플링 필요 (나이퀴스트)
   - ESP32-C3의 ADC 최대 샘플링 속도: 약 50~100kSPS (실질 한계)

---

## 캘리브레이션 방법

### 무음 기준선 설정

```cpp
// 조용한 환경에서 여러 차례 측정하여 기준 소음 레벨 측정
int NOISE_FLOOR = 0;

void calibrateNoise() {
  long sum = 0;
  for (int i = 0; i < 100; i++) {
    sum += analogRead(SOUND_AO_PIN);
    delay(10);
  }
  NOISE_FLOOR = sum / 100;
  Serial.printf("기준 소음 레벨 설정: %d\n", NOISE_FLOOR);
}

// 이후 측정에서 NOISE_FLOOR와의 차이로 상대 레벨 계산
```

### 임계값 자동 설정

```cpp
// 조용한 환경에서 측정한 피크 레벨의 2~3배를 임계값으로 설정
void autoSetThreshold() {
  int quietLevel = getSoundLevel(); // 무음 상태 피크 레벨
  int threshold = quietLevel * 2.5;
  Serial.printf("자동 임계값: %d (무음 %d의 2.5배)\n", threshold, quietLevel);
}
```

---

## 실사용 팁

- **피크-투-피크 측정**: 50ms 이상의 윈도우에서 최대/최소 ADC 값의 차이를 소리 크기로 사용
- **채터링 방지**: 디지털 트리거 후 100~200ms debounce 적용
- **마이크 방향**: KY-038의 마이크 구멍이 소리 방향을 향하도록 배치
- **박수 감지 대신 중간 임계값**: 가변저항을 너무 민감하게 설정하면 오감지 빈발 — 약간 덜 민감하게 설정하고 소프트웨어로 처리
- **정밀 소리 분석**: KY-038 대신 I2S 마이크 (INMP441, SPH0645 등)를 사용하면 품질이 훨씬 높음
- **배경 잡음 적응**: 실내 환경에서 에어컨, 환풍기 등 배경 잡음을 기준선으로 빼고 상대적 크기 계산
