# LED (발광 다이오드)

## 개요

LED(Light Emitting Diode)는 전류가 흐를 때 빛을 방출하는 반도체 소자입니다.  
p형 반도체와 n형 반도체의 접합부에서 전자와 정공이 재결합할 때 에너지가 광자(빛)로 방출됩니다.  
아두이노에서는 상태 표시, 경고등, 조명 제어, 디버깅 인디케이터 등 다양한 목적으로 사용됩니다.

---

## 종류 및 모델 비교

| 항목 | 3mm LED | 5mm LED | 고휘도 5mm LED | SMD LED (0805) |
|------|---------|---------|----------------|----------------|
| 직경 | 3mm | 5mm | 5mm | 2.0 × 1.25mm |
| 순방향 전압 (빨강) | 1.8~2.2V | 1.8~2.2V | 2.0~2.4V | 1.8~2.2V |
| 순방향 전압 (녹색/파랑) | 3.0~3.4V | 3.0~3.4V | 3.2~3.6V | 3.0~3.4V |
| 정격 전류 | 20mA | 20mA | 20~30mA | 20mA |
| 시야각 | 60° | 60° | 15~30° | 120° |
| 용도 | 소형 인디케이터 | 범용 표시 | 원거리 가시 | PCB 실장 |

### 색상별 순방향 전압 및 파장

| 색상 | 순방향 전압 (Vf) | 파장 (nm) | 재료 |
|------|-----------------|-----------|------|
| 적외선 (IR) | 1.2~1.8V | 850~940nm | AlGaAs |
| 빨강 | 1.8~2.2V | 620~625nm | AlGaInP |
| 주황 | 2.0~2.2V | 605~610nm | AlGaInP |
| 노랑 | 2.0~2.2V | 590~595nm | AlGaInP |
| 녹색 (일반) | 2.0~2.4V | 560~565nm | GaP |
| 녹색 (고휘도) | 3.0~3.4V | 520~525nm | InGaN |
| 파랑 | 3.0~3.6V | 460~470nm | InGaN |
| 흰색 | 3.0~3.4V | — | InGaN + 형광체 |
| UV (자외선) | 3.4~4.0V | 395~400nm | InGaN |

---

## 핀 구성

```
      긴 다리 → 애노드 (A, +극)
      짧은 다리 → 캐소드 (K, -극)

          ┌─────┐
          │ LED │
          └──┬──┘
      애노드 ─┘  └─ 캐소드
       (긴 다리)   (짧은 다리)
```

| 핀 이름 | 기호 | 설명 |
|---------|------|------|
| 애노드 (Anode) | A, + | 양극. 전류가 들어오는 쪽. 긴 다리. 전원(또는 GPIO)에 연결 |
| 캐소드 (Cathode) | K, − | 음극. 전류가 나가는 쪽. 짧은 다리. GND에 연결 |

**식별 방법:**
- 다리 길이: 긴 쪽 = 애노드, 짧은 쪽 = 캐소드
- LED 내부: 더 넓은 컵(플래그) 쪽 = 캐소드
- 렌즈 엣지에 평평한 부분 = 캐소드 쪽

---

## 핵심 전기적 스펙

| 파라미터 | 기호 | 일반 빨강 LED | 일반 녹색 LED | 파랑/흰색 LED | 단위 |
|---------|------|--------------|--------------|--------------|------|
| 순방향 전압 | Vf | 1.8~2.2 | 2.0~2.4 | 3.0~3.6 | V |
| 최대 순방향 전류 | If(max) | 20 | 20 | 20~30 | mA |
| 권장 동작 전류 | If(typ) | 10~20 | 10~20 | 10~20 | mA |
| 역방향 전압 최대 | Vr(max) | 5 | 5 | 5 | V |
| 최대 역방향 전류 | Ir(max) | 10 | 10 | 10 | µA |
| 펄스 전류 최대 | Ifp | 100 | 100 | 100 | mA |
| 동작 온도 | Topr | −40 ~ +85 | −40 ~ +85 | −40 ~ +85 | °C |
| 저장 온도 | Tstg | −40 ~ +100 | −40 ~ +100 | −40 ~ +100 | °C |
| 발광 세기 (10mA 기준) | Iv | 2~5 | 4~8 | 10~30 | mcd |

---

## 동작 원리

LED는 p-n 접합 다이오드입니다.  
순방향 바이어스(애노드 > 캐소드) 시 전자와 정공이 결합하며 에너지를 광자로 방출합니다.  
방출되는 빛의 파장(색상)은 반도체 재료의 밴드갭 에너지에 의해 결정됩니다.

- **전류 제어 소자**: 전압이 아닌 전류로 밝기가 결정됩니다.
- **비선형 특성**: 순방향 전압(Vf) 이상에서만 전류가 흐릅니다.
- **PWM 조광**: 디지털 신호의 듀티 사이클로 밝기를 조절합니다.

---

## 아두이노 연결 방법

### 저항 계산 공식

```
R = (Vcc - Vf) / If

R  : 직렬 저항값 (Ω)
Vcc: 전원 전압 (3.3V 또는 5V)
Vf : LED 순방향 전압 (색상별 상이)
If : 목표 동작 전류 (보통 10mA)
```

### 계산 예시

| 조건 | 계산 | 결과 |
|------|------|------|
| 5V 전원, 빨강 LED (Vf=2.0V), If=10mA | (5.0 − 2.0) / 0.010 | 300Ω → **330Ω 사용** |
| 3.3V 전원, 빨강 LED (Vf=2.0V), If=10mA | (3.3 − 2.0) / 0.010 | 130Ω → **150Ω 사용** |
| 5V 전원, 파랑 LED (Vf=3.2V), If=10mA | (5.0 − 3.2) / 0.010 | 180Ω → **180Ω 사용** |
| 3.3V 전원, 파랑 LED (Vf=3.2V), If=10mA | (3.3 − 3.2) / 0.010 | 10Ω → **33Ω 사용 (여유분)** |

> ESP32-C3는 3.3V 시스템입니다. 파랑/흰색 LED는 Vf가 높아 전류가 매우 적게 흐릅니다.  
> 최소 33Ω 이상 직렬 저항을 사용하여 보호합니다.

### 배선도

```
[GPIO 핀] ──── [저항 R] ──── [LED 애노드(+)] ──── [LED 캐소드(−)] ──── [GND]
```

**Active HIGH (일반 연결):**
- GPIO HIGH → 전류 흐름 → LED 켜짐
- GPIO LOW → 전류 없음 → LED 꺼짐

**Active LOW (ESP32-C3 내장 LED G8 방식):**
```
[3.3V] ──── [LED 애노드(+)] ──── [LED 캐소드(−)] ──── [저항] ──── [GPIO]
```
- GPIO LOW → 전류 흐름 → LED 켜짐
- GPIO HIGH → 전류 없음 → LED 꺼짐

---

## 코드 예제 개념

### 기본 점멸 (Blink)

```cpp
const int LED_PIN = 8;       // ESP32-C3 내장 LED (Active LOW)

void setup() {
    pinMode(LED_PIN, OUTPUT);
}

void loop() {
    digitalWrite(LED_PIN, LOW);   // LOW = 켜짐 (Active LOW)
    delay(500);
    digitalWrite(LED_PIN, HIGH);  // HIGH = 꺼짐
    delay(500);
}
```

### PWM 밝기 조절 (ESP32-C3 전용)

```cpp
// ESP32는 analogWrite() 미지원 → ledcWrite() 사용
const int LED_PIN = 7;
const int PWM_CHANNEL = 0;
const int PWM_FREQ = 5000;    // 5kHz
const int PWM_RESOLUTION = 8; // 8비트 (0~255)

void setup() {
    ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
    ledcAttachPin(LED_PIN, PWM_CHANNEL);
}

void loop() {
    // 서서히 밝아짐
    for (int brightness = 0; brightness <= 255; brightness++) {
        ledcWrite(PWM_CHANNEL, brightness);
        delay(10);
    }
    // 서서히 어두워짐
    for (int brightness = 255; brightness >= 0; brightness--) {
        ledcWrite(PWM_CHANNEL, brightness);
        delay(10);
    }
}
```

### millis() 기반 논블로킹 점멸

```cpp
const int LED_PIN = 7;
const unsigned long BLINK_INTERVAL = 500; // ms

unsigned long previousMillis = 0;
bool ledState = false;

void setup() {
    pinMode(LED_PIN, OUTPUT);
}

void loop() {
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= BLINK_INTERVAL) {
        previousMillis = currentMillis;
        ledState = !ledState;
        digitalWrite(LED_PIN, ledState ? HIGH : LOW);
    }
    // 다른 작업 수행 가능
}
```

---

## 마킹/식별 방법

| 식별 요소 | 애노드 (+) | 캐소드 (−) |
|----------|-----------|-----------|
| 다리 길이 | 긴 다리 | 짧은 다리 |
| 내부 구조 | 작은 삼각형 막대 | 넓은 컵(플래그) |
| 렌즈 외형 | 원형 유지 | 한쪽 평평하게 깎임 |
| 회로 기호 | 삼각형 뾰족한 쪽 | 삼각형 밑변 + 선 |

---

## 주의사항

1. **반드시 직렬 저항 사용**: 저항 없이 연결하면 과전류로 LED와 GPIO 핀이 즉시 손상됩니다.
2. **GPIO 전류 한계**: ESP32-C3 GPIO 핀당 최대 40mA, 총 합계 300mA. LED는 10~15mA로 제한합니다.
3. **역방향 전압 주의**: Vr(max) 5V 이하. 교류 회로에서는 역방향 보호 다이오드 추가 권장.
4. **ESP32-C3 3.3V 시스템**: Vf가 높은 파랑/흰색 LED는 저항값을 최소화하거나(33Ω) 저항 없이도 테스트 가능하지만, 장시간 사용 시 최소 33Ω 직렬 저항 권장.
5. **열 관리**: 고휘도 LED는 장시간 사용 시 발열이 있습니다. 방열판 또는 전류 제한 필요.
6. **정전기**: LED는 정전기에 민감합니다. 조작 전 접지 처리를 권장합니다.

---

## 자주 쓰이는 회로 패턴

### 패턴 1: 기본 GPIO 직접 구동

```
GPIO ──[330Ω]── LED+ ── LED− ── GND
```
- 가장 단순한 구성. GPIO HIGH = 켜짐.

### 패턴 2: NPN 트랜지스터 구동 (다수 LED 또는 5V LED)

```
GPIO ──[1kΩ]── NPN 베이스
               NPN 컬렉터 ──[저항]── LED+ ── 5V
               NPN 이미터 ── GND
```
- GPIO 3.3V 신호로 5V LED를 제어할 때 사용.

### 패턴 3: Active LOW (ESP32-C3 내장 LED)

```
3.3V ── LED+ ── LED− ──[저항]── GPIO
```
- GPIO LOW = 켜짐, HIGH = 꺼짐.

### 패턴 4: 다수 LED 공통 저항

```
GPIO1 ──[저항]── LED1+ ── LED1− ──┐
GPIO2 ──[저항]── LED2+ ── LED2− ──┤── GND
GPIO3 ──[저항]── LED3+ ── LED3− ──┘
```
- 각 LED마다 개별 저항 사용. 저항 공유 금지(밝기 불균일).
