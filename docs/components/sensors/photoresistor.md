# 광센서 (CdS 광저항 / LDR) — 조도 감지

## 개요

광저항(Photoresistor, LDR: Light Dependent Resistor, CdS: Cadmium Sulfide)은
빛의 밝기에 따라 저항값이 변하는 수동 소자입니다.
빛이 강할수록 저항이 낮아지고, 어두울수록 저항이 높아집니다.
아두이노의 ADC와 분압 회로를 이용하여 조도(밝기)를 측정합니다.

**측정 원리**
광전도 효과(Photoconductive Effect): 황화카드뮴(CdS) 반도체에 빛이 입사하면
광자 에너지에 의해 전자-정공 쌍이 생성되어 전기 전도도가 증가합니다.
즉, 빛이 강할수록 더 많은 캐리어가 생성되어 저항이 낮아집니다.

**아두이노에서의 활용**
자동 조명 제어, 야간 모드 전환, 일출/일몰 감지, 그림자 감지, 라인 팔로워 로봇 등에 사용됩니다.
아날로그 출력 또는 디지털 비교기 출력(모듈 형태)으로 활용할 수 있습니다.

---

## 모델 비교

| 항목 | GL5516 | GL5528 | GL5537 | GL5549 |
|------|--------|--------|--------|--------|
| 밝은 상태 저항 (10 lux) | 5 ~ 10 kΩ | 10 ~ 20 kΩ | 20 ~ 30 kΩ | 45 ~ 140 kΩ |
| 어두운 상태 저항 | > 0.5 MΩ | > 1 MΩ | > 2 MΩ | > 2 MΩ |
| 최대 전압 | 150 V | 150 V | 150 V | 150 V |
| 최대 전력 | 90 mW | 100 mW | 100 mW | 100 mW |
| 피크 파장 | 540 nm | 540 nm | 540 nm | 560 nm |
| 크기 (지름) | 5 mm | 5 mm | 5 mm | 5 mm |

---

## 핀 구성

### 광저항 (2단자 소자)

```
  ──┤  LDR  ├──

   극성 없음 (방향 무관)
   두 단자 중 어느 쪽이든 VCC 또는 GND에 연결 가능
```

### 광센서 모듈 (KY-018 등 3핀/4핀 보드)

| 핀 이름 | 역할 |
|---------|------|
| VCC | 전원 (+3.3V ~ 5V) |
| GND | 접지 |
| AO (A0) | 아날로그 출력 (밝기에 비례한 전압) |
| DO (D0) | 디지털 출력 (임계값 이상/이하 HIGH/LOW, 비교기 내장) |

---

## 전기적 스펙 (GL5528 기준)

| 파라미터 | 값 | 단위 |
|----------|-----|------|
| 최대 전압 | 150 | V |
| 최대 전력 | 100 | mW |
| 밝은 저항 (10 lux, 주광) | 10 ~ 20 | kΩ |
| 어두운 저항 (0 lux) | > 1 | MΩ |
| 감도 피크 파장 | 540 | nm (녹색 가시광) |
| 스펙트럼 응답 | 400 ~ 700 | nm (가시광 범위) |
| 응답 시간 (상승) | 30 | ms |
| 응답 시간 (하강) | 20 | ms |
| 동작 온도 | -30 ~ +70 | °C |

---

## 통신 프로토콜 — 아날로그 전압 출력

광저항 자체는 저항값이 변하는 수동 소자입니다.
ADC로 읽기 위해 **전압 분배기(Voltage Divider)** 회로가 필요합니다.

### 분압 회로

```
    VCC (3.3V)
      │
     10kΩ (고정 저항 R1)
      │
      ├──────── ADC 입력 (Vout)
      │
    LDR (가변 저항 R2, 밝기에 따라 변함)
      │
    GND

Vout = VCC × R2 / (R1 + R2)

밝을 때: R2(LDR) 낮아짐 → Vout 낮아짐 (ADC 값 낮음)
어두울 때: R2(LDR) 높아짐 → Vout 높아짐 (ADC 값 높음)
```

> **R1 선택**: 일반적으로 R1 = LDR의 밝은 상태 저항과 비슷한 값으로 설정합니다.
> GL5528의 경우 10lux에서 10~20kΩ이므로 R1 = 10kΩ 권장.

---

## 아두이노 연결 방법

### 기본 분압 회로 (ADC 직접 읽기)

```
ESP32-C3          LDR (GL5528)
  3.3V ──────────── 한쪽 단자
                    다른 단자 ──┬── ADC 입력 (G1)
                               │
                             10kΩ (R1)
                               │
  GND ────────────────────────┘
```

### 모듈 형태 (KY-018) 연결

```
ESP32-C3          KY-018 모듈
  3.3V ──────────── VCC
  GND  ──────────── GND
  G1   ──────────── AO  (아날로그)
  G4   ──────────── DO  (디지털, 임계값 감지)
```

### 기본 코드 예시 (ADC 직접)

```cpp
#define LDR_PIN   1      // ADC 핀
#define R1        10000  // 분압 저항 (Ω)

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // 12비트 ADC
}

float readLDR_ohm() {
  int raw = analogRead(LDR_PIN);
  // Vout = raw × 3.3 / 4095
  // R_LDR = R1 × Vout / (VCC - Vout)
  float voltage = raw * 3.3 / 4095.0;
  if (voltage >= 3.3) return 0; // 단락 방지
  float resistance = R1 * voltage / (3.3 - voltage);
  return resistance;
}

void loop() {
  int   raw        = analogRead(LDR_PIN);
  float resistance = readLDR_ohm();

  // 밝기 레벨 (0~100%, 직관적 표현)
  int brightness = map(raw, 0, 4095, 100, 0); // 반전 (밝을수록 ADC 낮음)
  brightness = constrain(brightness, 0, 100);

  Serial.printf("ADC: %d  저항: %.0f Ω  밝기: %d%%\n",
                raw, resistance, brightness);
  delay(500);
}
```

### 디지털 임계값 감지 (모듈 가변저항 조절)

```cpp
#define LDR_DO_PIN  4

void setup() {
  Serial.begin(115200);
  pinMode(LDR_DO_PIN, INPUT);
}

void loop() {
  bool isDark = (digitalRead(LDR_DO_PIN) == HIGH); // 어두우면 HIGH (모듈에 따라 반전)
  Serial.println(isDark ? "어두움 감지!" : "밝음");
  delay(200);
}
```

---

## 측정값 계산 공식

### 저항값 계산 (분압 회로에서)

```
V_ADC = ADC_raw × V_REF / (2^비트 - 1)

R_LDR = R1 × V_ADC / (V_REF - V_ADC)

예: R1=10kΩ, V_REF=3.3V, ADC_raw=1024 (12비트)
  V_ADC = 1024 × 3.3 / 4095 ≈ 0.825 V
  R_LDR = 10000 × 0.825 / (3.3 - 0.825) ≈ 3333 Ω
```

### 조도 (lux) 근사값 (GL5528 경험식)

GL5528은 저항-조도 관계가 로그 스케일에서 선형에 가깝습니다:

```
lux ≈ 500 / R_LDR(kΩ)

예: R_LDR = 10kΩ → lux ≈ 50 lux (실내 조명 수준)
   R_LDR = 1kΩ  → lux ≈ 500 lux (밝은 실내)
   R_LDR = 50Ω  → lux ≈ 10000 lux (직사광선 근접)
```

> 이 공식은 근사값이며 정밀 조도 측정은 TSL2561, BH1750 등 전용 조도계 IC 사용 권장.

### 비율 밝기 (상대값)

```cpp
// 밝기를 0~100 % 상대값으로 표현
// 어두울 때 ADC 값이 높으므로 반전 처리
int rawMin = 100;    // 완전 밝을 때 ADC 예상값 (실측 필요)
int rawMax = 4000;   // 완전 어두울 때 ADC 예상값
int brightness = map(analogRead(LDR_PIN), rawMin, rawMax, 100, 0);
brightness = constrain(brightness, 0, 100);
```

---

## 주의사항

1. **분압 저항 필수**
   - LDR 단독으로 ADC에 연결하면 전압 기준이 없어 측정 불가
   - 반드시 분압 저항(R1)을 사용해야 합니다.

2. **광원 파장**
   - CdS LDR은 가시광(400~700nm)에만 반응하며 적외선에는 거의 반응하지 않습니다.
   - IR 리모컨, 야간 카메라 감지에는 광트랜지스터 또는 포토다이오드 사용.

3. **응답 속도 한계**
   - 상승 시간 약 30ms, 하강 시간 약 20ms — 빠른 점멸 광원(PWM)은 정확히 추적 불가

4. **ADC 노이즈**
   - ESP32 ADC의 비선형성으로 인해 실제 저항값 계산에 오차 발생
   - 다중 샘플 평균 및 esp_adc_cal 보정 권장

5. **Wi-Fi 간섭 (ESP32)**
   - Wi-Fi 활성화 시 ADC2 핀은 사용 불가 → ADC1 핀(G0~G4) 사용

6. **극성 없음**
   - LDR은 극성이 없으므로 방향 무관 — 편의대로 연결

7. **습기·오염**
   - CdS 소자가 습기에 노출되면 저항값이 변할 수 있음 — 야외 사용 시 방수 처리 권장

8. **RoHS 규제**
   - CdS(황화카드뮴)는 유해 물질 제한(RoHS)에 해당할 수 있으므로
     상업 제품에는 TEPT5700 등 포토트랜지스터 또는 BH1750 IC 사용 권장

---

## 캘리브레이션 방법

### 조도 범위 보정 (현장 캘리브레이션)

```cpp
// 최대 밝기(직사광선)와 최어두운 상태에서 ADC 값을 기록
int ADC_DARK  = 3900; // 완전 어두운 상태에서 측정값 (실측)
int ADC_LIGHT = 150;  // 가장 밝은 상태에서 측정값 (실측)

int getBrightness() {
  int raw = analogRead(LDR_PIN);
  return map(raw, ADC_DARK, ADC_LIGHT, 0, 100); // 0%(어두움) ~ 100%(밝음)
}
```

### 기준 조도계와 비교 보정

```cpp
// 기준 조도계(lux 측정 가능 기기)와 함께 여러 조도 환경에서 측정하여
// 룩업 테이블 또는 다항식 보정 계수 결정
const float LUX_COEFF_A = -1.5;
const float LUX_COEFF_B = 2000.0;

float estimateLux(int raw) {
  float r_kohm = readLDR_ohm() / 1000.0;
  return LUX_COEFF_B / pow(r_kohm, -LUX_COEFF_A);
}
```

---

## 실사용 팁

- **히스테리시스 적용**: 조명 ON/OFF 제어 시 임계값 상하에 히스테리시스 ±5% 적용하여 채터링 방지
- **이동 평균**: 16~32회 평균으로 ADC 노이즈 감소
- **야간 모드 자동 전환**: LDR과 릴레이(또는 MOSFET)를 조합하여 자동 야간 조명 구현
- **정밀 조도가 필요하면 BH1750**: ±20%의 LDR 대신 I2C 디지털 조도 센서(BH1750)가 더 정확함
- **R1 값 선택**: 사용 환경 조도 범위의 중간값에서 LDR 저항과 R1이 비슷한 값이 되도록 선택하면 ADC 분해능이 최대화됨
- **커버 박스**: 특정 방향의 빛만 측정하려면 원통형 커버를 씌워 지향성을 높임
