# 토양 수분 센서 — Soil Moisture Sensor

## 개요

토양 수분 센서는 두 전극 사이의 토양 저항(전기 전도도)을 측정하여 토양의 수분 함유량을 감지합니다.
수분이 많을수록 전기 전도도가 높아져 전극 사이의 저항이 낮아지는 원리를 이용합니다.
아날로그 출력(AO)과 디지털 출력(DO)을 모두 제공하는 모듈 형태로 많이 사용됩니다.

**측정 원리**
두 금속(또는 도금) 전극에 전류를 흘리면, 토양의 수분 함유량에 따라 전기 저항이 달라집니다.
물은 이온(미네랄)이 녹아 있을 때 전기를 잘 전도하므로, 수분이 많을수록 저항이 낮고 출력 전압이 낮아집니다.

**아두이노에서의 활용**
자동 식물 급수 시스템, 스마트 화분, 온실 자동화, 토양 건강 모니터링 등에 활용됩니다.

---

## 모델 비교

| 항목 | 저항식 (기본형) | 용량식 (Capacitive) |
|------|----------------|---------------------|
| 측정 방식 | 두 전극 간 저항 측정 | 유전율(정전용량) 측정 |
| 전극 재질 | 도금 구리 또는 니켈 | 코팅 없는 FR4 PCB |
| 전해 부식 | 있음 (수명 1~3개월) | 없음 (장기 사용 가능) |
| 정확도 | 중간 | 높음 |
| 전압 | 3.3 ~ 5V | 3.3 ~ 5V |
| 가격 | 저렴 (세트 구성) | 중간 |
| 추천 용도 | 단기 테스트, 학습 | 영구 설치, 상시 모니터링 |

---

## 핀 구성

### 기본 저항식 모듈 (3핀 또는 4핀)

| 핀 이름 | 역할 |
|---------|------|
| VCC | 전원 (+3.3V ~ 5V) |
| GND | 접지 |
| AO (A0) | 아날로그 출력 (수분 비율에 반비례, 건조할수록 높은 전압) |
| DO (D0) | 디지털 출력 (임계값 초과 시 HIGH, 가변저항으로 임계값 설정) |

### 탐침 (프로브) 핀

| 핀 이름 | 역할 |
|---------|------|
| + | 플러스 전극 |
| - | 마이너스 전극 |

---

## 전기적 스펙

| 파라미터 | 값 | 단위 |
|----------|-----|------|
| 동작 전압 | 3.3 ~ 5 | V |
| 동작 전류 | 35 (최대) | mA |
| AO 출력 범위 | 0 ~ VCC | V |
| DO 출력 HIGH | VCC에 근접 | V |
| DO 출력 LOW | 0 | V |
| 모듈 크기 (컨트롤러) | 30 × 16 | mm |
| 프로브 크기 | 60 × 20 | mm |

---

## 통신 프로토콜

토양 수분 센서는 별도 프로토콜 없이 아날로그 전압 출력을 ADC로 읽습니다.

### 아날로그 출력 특성

```
건조한 토양:
  저항 높음 → 출력 전압 높음 → ADC 값 높음 (약 2800~4095)

촉촉한 토양:
  저항 중간 → 출력 전압 중간 → ADC 값 중간 (약 1500~2800)

물에 잠긴 상태:
  저항 낮음 → 출력 전압 낮음 → ADC 값 낮음 (약 0~1500)

※ 위 ADC 값은 3.3V 기준 12비트 ADC 기준 대략적인 예시입니다.
  실제 값은 센서, 토양 종류, 전해질 농도에 따라 다릅니다.
```

---

## 아두이노 연결 방법

### 기본 연결

```
ESP32-C3          토양 수분 센서 모듈
  3.3V ──────────── VCC
  GND  ──────────── GND
  G1   ──────────── AO (아날로그 출력)
  G4   ──────────── DO (디지털 출력, 선택)
```

> **전원 절약 팁**: VCC를 항상 연결하면 전극 부식이 빠르게 진행됩니다.
> 측정 직전에 GPIO로 전원을 공급하고 측정 후 끄는 방식을 권장합니다.

### 전원 절약 연결 (GPIO 전원 제어)

```
ESP32-C3          토양 수분 센서 모듈
  G2   ──────────── VCC  ← 측정 전에 HIGH, 측정 후 LOW
  GND  ──────────── GND
  G1   ──────────── AO
```

### 기본 코드 예시

```cpp
#define SOIL_AO_PIN    1   // ADC 입력 핀
#define SOIL_VCC_PIN   2   // 전원 제어 핀 (전원 절약)
#define ADC_DRY        3200 // 건조 상태 ADC 값 (실측 보정 필요)
#define ADC_WET        800  // 물에 잠긴 상태 ADC 값 (실측 보정 필요)

void setup() {
  Serial.begin(115200);
  pinMode(SOIL_VCC_PIN, OUTPUT);
  digitalWrite(SOIL_VCC_PIN, LOW); // 초기 전원 OFF
  analogReadResolution(12);
}

int readSoilMoisture() {
  // 전원 켜기 → 안정화 → 측정 → 전원 끄기
  digitalWrite(SOIL_VCC_PIN, HIGH);
  delay(100); // 안정화 대기 (센서에 따라 100~500ms)

  int samples = 0;
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(SOIL_AO_PIN);
    delay(10);
  }
  int raw = sum / 10;

  digitalWrite(SOIL_VCC_PIN, LOW); // 전원 끄기

  // 수분율 퍼센트 변환 (ADC 높음 = 건조, ADC 낮음 = 습함)
  int moisture = map(raw, ADC_DRY, ADC_WET, 0, 100);
  return constrain(moisture, 0, 100);
}

void loop() {
  int moisture = readSoilMoisture();
  Serial.printf("토양 수분: %d%%\n", moisture);

  if (moisture < 30) {
    Serial.println("물주기가 필요합니다!");
  }

  delay(30000); // 30초마다 측정
}
```

### 자동 급수 시스템 코드

```cpp
#define SOIL_AO_PIN    1
#define SOIL_VCC_PIN   2
#define PUMP_PIN       3   // 워터 펌프 또는 릴레이 핀
#define MOISTURE_LOW   30  // 이 이하면 급수
#define MOISTURE_HIGH  70  // 이 이상이면 급수 중단

bool isPumping = false;

void loop() {
  int moisture = readSoilMoisture();
  Serial.printf("수분: %d%%  펌프: %s\n", moisture, isPumping ? "ON" : "OFF");

  // 히스테리시스 제어
  if (!isPumping && moisture < MOISTURE_LOW) {
    digitalWrite(PUMP_PIN, HIGH);
    isPumping = true;
    Serial.println("급수 시작");
  } else if (isPumping && moisture >= MOISTURE_HIGH) {
    digitalWrite(PUMP_PIN, LOW);
    isPumping = false;
    Serial.println("급수 완료");
  }

  delay(5000); // 5초마다 확인
}
```

---

## 측정값 계산 공식

### ADC → 수분율 변환

```
수분율(%) = (ADC_DRY - ADC_raw) × 100 / (ADC_DRY - ADC_WET)

ADC_DRY: 완전 건조 상태에서의 ADC 값 (실측 필요)
ADC_WET: 물에 완전히 잠긴 상태에서의 ADC 값 (실측 필요)

예: ADC_DRY=3200, ADC_WET=800, ADC_raw=2000
  수분율 = (3200 - 2000) × 100 / (3200 - 800)
        = 120000 / 2400 = 50%
```

### 부피 수분 함량 (VWC) 근사 (용량식 센서 기준)

```
VWC(%) ≈ (ADC 원시값 → 전압으로 변환 후)
  선형 근사: VWC = (V_reading - V_dry) / (V_wet - V_dry) × 100

Topp 방정식 (정밀 측정):
  VWC = -5.3×10⁻² + 2.92×10⁻² × ε - 5.5×10⁻⁴ × ε² + 4.3×10⁻⁶ × ε³
  (ε = 토양 유전상수, 임피던스 측정 장비 필요)
```

---

## 주의사항

1. **전극 부식 (저항식 센서의 주요 단점)**
   - 항상 전원이 공급되면 전기분해로 전극이 부식됩니다.
   - 측정이 필요할 때만 전원 공급 → 수명 대폭 연장
   - 장기 설치에는 용량식(Capacitive) 센서 사용 권장

2. **토양 종류 영향**
   - 점토, 모래, 부엽토 등 토양 종류에 따라 측정값이 크게 다릅니다.
   - 반드시 실제 사용할 토양에서 ADC_DRY / ADC_WET 보정값을 측정해야 합니다.

3. **비료/염분 영향**
   - 토양에 비료나 염분이 많으면 전도도가 높아져 실제보다 높은 수분값이 측정됩니다.

4. **삽입 깊이**
   - 프로브 삽입 깊이가 일정해야 재현성 있는 측정이 가능합니다.
   - 뿌리 깊이에 맞춰 배치 권장.

5. **온도 영향**
   - 토양 온도에 따라 전도도가 변합니다 (+2~3%/°C).
   - 정밀 측정에는 온도 보정이 필요합니다.

6. **ADC 핀 선택 (ESP32)**
   - Wi-Fi 사용 시 ADC1 핀(G0~G4)만 사용 가능

---

## 캘리브레이션 방법

### 건조/습윤 기준점 측정

```cpp
// 1단계: 센서를 공기 중에 두고 ADC 값 기록 (완전 건조 기준)
// 2단계: 센서를 물 컵에 담그고 ADC 값 기록 (완전 습윤 기준)
// 3단계: 실제 사용할 토양(건조)에서 ADC 값 기록
// 4단계: 같은 토양에 물을 충분히 준 후 ADC 값 기록

// 예시 출력으로 기준점 확인
void calibrate() {
  Serial.println("=== 캘리브레이션 모드 ===");
  Serial.println("10초 후 측정 시작...");
  delay(10000);

  long sum = 0;
  for (int i = 0; i < 50; i++) {
    sum += analogRead(SOIL_AO_PIN);
    delay(50);
  }
  Serial.printf("현재 ADC 평균값: %ld\n", sum / 50);
  Serial.println("이 값을 ADC_DRY 또는 ADC_WET에 설정하세요.");
}
```

### 다점 보정 (비선형 보정)

```cpp
// 여러 수분 함량에서 측정하여 룩업 테이블 작성
const int CALIB_POINTS = 5;
int adcValues[CALIB_POINTS]  = {3200, 2800, 2200, 1500, 800};
int moistureValues[CALIB_POINTS] = {0,   20,   50,  80, 100};

int getMoistureInterp(int raw) {
  for (int i = 0; i < CALIB_POINTS - 1; i++) {
    if (raw <= adcValues[i] && raw >= adcValues[i+1]) {
      return map(raw, adcValues[i], adcValues[i+1],
                 moistureValues[i], moistureValues[i+1]);
    }
  }
  return (raw > adcValues[0]) ? 0 : 100;
}
```

---

## 실사용 팁

- **용량식 센서 추천**: 장기 운용에는 저항식 대신 용량식(Capacitive Soil Moisture Sensor v1.2) 사용
- **딥슬립과 조합**: ESP32 딥슬립으로 배터리 절약 — 측정 시에만 깨어나 센서 전원 켜고 측정 후 다시 슬립
- **화분 자동 급수**: 소형 수중 펌프(5V DC) + 릴레이 또는 MOSFET 조합으로 자동 급수 시스템 구현
- **방수 처리**: 전자 회로 부분(컨트롤러 보드)은 물에 닿지 않도록 방수 처리 필수
- **위치 선택**: 센서는 식물 뿌리 근처에 삽입해야 의미 있는 값을 얻을 수 있음
- **기준값 주기적 갱신**: 계절 변화, 비료 추가 등으로 토양 특성이 변하면 재캘리브레이션 필요
