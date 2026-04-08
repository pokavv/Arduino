# PNP 트랜지스터 (2N2907, BC557, S8550)

## 개요

PNP 트랜지스터는 P형-N형-P형 반도체로 구성된 양극성 접합 트랜지스터(BJT)입니다.  
NPN과 반대로 베이스(Base) 전류를 빼내면(싱크) 이미터(Emitter)에서 컬렉터(Collector)로 전류가 흐릅니다.  
아두이노에서는 하이사이드 스위치(부하가 VCC 쪽에 위치한 회로) 구성에 주로 활용됩니다.  
3.3V 시스템에서 5V 전원 공급 라인을 제어하거나, P채널 MOSFET의 저비용 대안으로 사용합니다.

**PNP 동작**: 베이스를 이미터보다 낮은 전압으로 끌어내리면(VBE < −0.6V) 이미터→컬렉터 방향으로 전류가 흐릅니다.  
**하이사이드 스위치**: 부하가 컬렉터와 GND 사이에 위치하며, 이미터가 VCC에 연결됩니다.

---

## 종류 및 모델 비교

| 모델 | 패키지 | VCEO (최대 컬렉터 전압) | IC (최대 컬렉터 전류) | hFE (전류 이득) | ft (전환 주파수) | NPN 상대 모델 |
|------|--------|----------------------|---------------------|----------------|----------------|-------------|
| 2N2907A | TO-92 | −40V | −600mA | 100~300 | 200MHz | 2N2222A |
| BC557 | TO-92 | −45V | −100mA | 110~800 | 150MHz | BC547 |
| S8550 | TO-92 | −25V | −500mA (−1A 순간) | 85~300 | 150MHz | S8050 |
| BC558 | TO-92 | −30V | −100mA | 110~800 | 150MHz | BC548 |
| BC327 | TO-92 | −45V | −800mA | 100~630 | 100MHz | BC337 |
| 2N3906 | TO-92 | −40V | −200mA | 100~300 | 250MHz | 2N3904 |
| MMBT2907A | SOT-23 | −40V | −600mA | 100~300 | 200MHz | 2N2907A SMD |

---

## 핀 구성

### TO-92 패키지

```
평평한 면을 앞으로, 핀이 아래를 향하게 잡았을 때:

  ┌─────────┐
  │  평평면 │
  └────┬────┘
    1  2  3  (핀 번호)

모델별 핀 배열:
  2N2907A : 1=E(이미터), 2=B(베이스), 3=C(컬렉터)
  BC557   : 1=C(컬렉터), 2=B(베이스), 3=E(이미터)
  S8550   : 1=E(이미터), 2=B(베이스), 3=C(컬렉터)
  2N3906  : 1=E(이미터), 2=B(베이스), 3=C(컬렉터)
```

> **NPN과 핀 배열이 같은 경우가 많지만 동작 방향이 반대입니다.**  
> 모델마다 핀 배열이 다를 수 있으므로 반드시 데이터시트 확인.

| 단자 | 기호 | PNP에서의 역할 |
|------|------|--------------|
| 이미터 | E | VCC에 연결. 전류 공급원. |
| 베이스 | B | 제어 입력. 이미터보다 0.6V 이상 낮아야 ON. |
| 컬렉터 | C | 부하 연결. GND 방향으로 전류 출력. |

---

## 핵심 전기적 스펙

### 2N2907A

| 파라미터 | 기호 | 값 | 단위 |
|---------|------|-----|------|
| 컬렉터-베이스 간 최대 전압 | VCBO | −60 | V |
| 컬렉터-이미터 간 최대 전압 | VCEO | −40 | V |
| 이미터-베이스 간 최대 전압 | VEBO | −5 | V |
| 최대 컬렉터 전류 | IC(max) | −600 | mA |
| 컬렉터 포화 전압 | VCE(sat) | −0.5 (IC=−150mA) | V |
| 베이스-이미터 전압 | VBE | −0.6 ~ −0.7 | V |
| DC 전류 이득 | hFE | 100 ~ 300 (IC=−150mA) | — |
| 최대 소비 전력 | Ptot | 500 (TO-92) | mW |
| 전환 주파수 | ft | 200 | MHz |
| 동작 온도 | Topr | −55 ~ +150 | °C |

### BC557

| 파라미터 | 기호 | 값 | 단위 |
|---------|------|-----|------|
| 컬렉터-이미터 간 최대 전압 | VCEO | −45 | V |
| 최대 컬렉터 전류 | IC(max) | −100 | mA |
| 컬렉터 포화 전압 | VCE(sat) | −0.09 (IC=−2mA) | V |
| 베이스-이미터 전압 | VBE | −0.58 ~ −0.70 | V |
| DC 전류 이득 (B등급) | hFE | 200 ~ 450 (IC=−2mA) | — |
| 최대 소비 전력 | Ptot | 500 | mW |

### S8550

| 파라미터 | 기호 | 값 | 단위 |
|---------|------|-----|------|
| 컬렉터-이미터 간 최대 전압 | VCEO | −25 | V |
| 최대 컬렉터 전류 | IC(max) | −500 | mA |
| 컬렉터 포화 전압 | VCE(sat) | −0.5 (IC=−500mA) | V |
| 베이스-이미터 전압 | VBE | −0.6 ~ −0.7 | V |
| DC 전류 이득 | hFE | 85 ~ 300 (IC=−100mA) | — |
| 최대 소비 전력 | Ptot | 500 | mW |

---

## 동작 원리

### NPN과 PNP 비교

| 특성 | NPN | PNP |
|------|-----|-----|
| 전류 방향 | C → E (컬렉터 입력) | E → C (이미터 입력) |
| ON 조건 | VBE > +0.6V (B가 E보다 높음) | VBE < −0.6V (B가 E보다 낮음) |
| 제어 방법 | 베이스에 전류 공급(소스) | 베이스에서 전류 인출(싱크) |
| 스위치 위치 | 로우사이드 (GND 쪽) | 하이사이드 (VCC 쪽) |
| GPIO와의 관계 | HIGH = ON | LOW = ON |

### PNP 스위칭 조건

```
이미터 = VCC = 5V
ON 조건: VB < VE − 0.6V = 5V − 0.6V = 4.4V 이하
OFF 조건: VB = VE = 5V (이미터와 같은 전위)

→ GPIO LOW(0V)  → VBE = 0V − 5V = −5V → ON (|VBE| > 0.6V)
→ GPIO HIGH(3.3V) → VBE = 3.3V − 5V = −1.7V → ON (여전히 ON!)
→ GPIO HIGH(5V) → VBE = 5V − 5V = 0V → OFF
```

**문제점**: 3.3V GPIO로 5V PNP를 완전히 OFF하려면 베이스를 5V로 끌어올려야 합니다.  
3.3V는 베이스-이미터 전압이 −1.7V이므로 PNP가 OFF되지 않을 수 있습니다.

**해결책**: NPN을 인터페이스로 추가하는 2단 회로 사용.

---

## 아두이노 연결 방법

### 베이스 저항 계산

```
PNP 포화 조건:
  |IB| ≥ |IC| / hFE

베이스 저항 (이미터가 5V, GPIO가 LOW=0V일 때):
  RB = (VE − VBE − VIO) / IB
     = (5V − 0.6V − 0V) / IB
     = 4.4V / IB

예시: IC = 200mA, hFE = 100
  IB(필요) = 200mA / 100 = 2mA
  IB(과포화) = 10mA (5배)
  RB = 4.4V / 0.010 = 440Ω → 470Ω
```

### 기본 PNP 하이사이드 스위치

```
[VCC = 5V]
    │
    ├── 이미터 (E)
    │   PNP 트랜지스터
    ├── 컬렉터 (C) ──[부하]── GND
    │
GPIO ──[RB=470Ω]── 베이스 (B)
```
- GPIO LOW → 베이스가 이미터보다 낮아짐 → PNP ON → 부하에 5V 공급
- GPIO HIGH (5V) → VBE ≈ 0 → PNP OFF

### 3.3V GPIO로 5V PNP 제어 (NPN 인터페이스)

```
[5V]──[이미터 PNP]──[컬렉터 PNP]──[부하]──[GND]
          │
      [베이스 PNP]──[RB1=10kΩ]──[컬렉터 NPN]──[GND]
                                [베이스 NPN]──[RB2=1kΩ]──GPIO(3.3V)
                                [이미터 NPN]──GND

GPIO HIGH (3.3V) → NPN ON → PNP 베이스 LOW → PNP ON → 부하에 5V
GPIO LOW (0V)   → NPN OFF → PNP 베이스 = 5V (풀업) → PNP OFF
```

### 풀업 저항으로 자동 OFF 보장

```
[5V]──[풀업 10kΩ]──[베이스 PNP]──[RB=470Ω]──GPIO
```
- GPIO 플로팅(미설정) 상태에서 5V 풀업이 베이스를 5V로 끌어올려 PNP OFF 보장.

---

## 코드 예제 개념

### 하이사이드 LED 제어

```cpp
const int PNP_BASE_PIN = 7;  // 베이스 제어 핀

void setup() {
    pinMode(PNP_BASE_PIN, OUTPUT);
    digitalWrite(PNP_BASE_PIN, HIGH);  // 초기 OFF (PNP는 LOW에서 ON)
}

void loop() {
    digitalWrite(PNP_BASE_PIN, LOW);   // PNP ON → 부하 ON
    delay(1000);
    digitalWrite(PNP_BASE_PIN, HIGH);  // PNP OFF → 부하 OFF
    delay(1000);
}
```

### PWM 밝기 제어 (하이사이드)

```cpp
const int PNP_PIN = 5;
const int CH = 0;

void setup() {
    ledcSetup(CH, 5000, 8);
    ledcAttachPin(PNP_PIN, CH);
    ledcWrite(CH, 255);  // 255 = 완전 OFF (PNP Active LOW)
}

void setPNPBrightness(int brightness) {
    // brightness 0=최대밝기, 255=꺼짐 (PNP 반전)
    ledcWrite(CH, 255 - brightness);
}

void loop() {
    for (int i = 0; i <= 255; i++) {
        setPNPBrightness(i);
        delay(10);
    }
}
```

### NPN 인터페이스 회로 코드

```cpp
// GPIO → NPN → PNP 2단 구성
// GPIO HIGH = 부하 ON (NPN-PNP 이중 반전으로 결국 Active HIGH)
const int CTRL_PIN = 7;

void setup() {
    pinMode(CTRL_PIN, OUTPUT);
    digitalWrite(CTRL_PIN, LOW);  // 초기 OFF
}

void loop() {
    digitalWrite(CTRL_PIN, HIGH);  // 부하 ON
    delay(1000);
    digitalWrite(CTRL_PIN, LOW);   // 부하 OFF
    delay(1000);
}
```

---

## 마킹/식별 방법

| 확인 방법 | 설명 |
|---------|------|
| 부품 각인 | "2N2907", "BC557", "S8550" 등 텍스트 각인 |
| 멀티미터 다이오드 모드 | B→E, B→C 방향 역전(E→B, C→B)으로 0.6~0.7V 측정 = PNP |
| NPN과 구분 | NPN은 B→E 정방향, PNP는 E→B 정방향으로 도통 |
| 부품 DB | 각인으로 검색 시 "PNP" 표기 확인 |
| 상보 쌍 | BC547(NPN)↔BC557(PNP), 2N2222↔2N2907 쌍으로 기억 |

---

## 주의사항

1. **Active LOW 논리**: PNP는 GPIO LOW에서 ON됩니다. NPN과 혼동하지 않도록 주의.
2. **3.3V vs 5V OFF 문제**: 이미터가 5V일 때 베이스 3.3V는 OFF가 되지 않습니다(VBE = −1.7V > −0.6V). 반드시 5V 또는 NPN 인터페이스 회로 사용.
3. **베이스 저항 필수**: NPN과 동일하게 베이스 저항 없이 GPIO 직결 금지.
4. **이미터가 VCC 측**: PNP에서 이미터는 항상 높은 전위(VCC)에 연결합니다. 반대로 연결하면 동작하지 않음.
5. **전압 극성**: 모든 전압/전류값이 NPN과 반대 부호. 데이터시트에서 음수(−)로 표기된 값에 주의.
6. **열 발생**: 높은 전류에서 발열이 상당합니다. 300mA 이상에서는 방열판 또는 TO-220 패키지 부품 사용 권장.
7. **플라이백 다이오드**: 유도성 부하에는 반드시 역기전력 보호 다이오드 추가 (NPN과 동일).

---

## 자주 쓰이는 회로 패턴

### 패턴 1: 기본 PNP 하이사이드 스위치 (5V 시스템)

```
5V ── E(이미터 PNP) ── C(컬렉터) ──[부하]── GND
GPIO(5V HIGH/LOW) ──[470Ω]── B(베이스)
```

### 패턴 2: 3.3V GPIO + NPN 인터페이스 + PNP (범용)

```
GPIO3.3V ──[1kΩ]── B(NPN) ── E(NPN) ── GND
                   C(NPN) ──[10kΩ]── B(PNP)
5V ── E(PNP)     풀업[10kΩ] ── 5V
      C(PNP) ──[부하]── GND
```

### 패턴 3: 보완 푸시풀 출력 (NPN + PNP)

```
[VCC]
  │
E(PNP)
C(PNP) ──┬── 출력
B(PNP) ──┤
B(NPN) ──┤── 입력 신호
C(NPN) ──┘
E(NPN)
  │
[GND]
```
- 입력 HIGH → NPN ON, PNP OFF → 출력 LOW
- 입력 LOW → PNP ON, NPN OFF → 출력 HIGH
- 오디오 증폭기, 모터 H브리지에 활용

### 패턴 4: 상보 쌍 (Complementary Pair) H 브리지

```
[VCC]
  PNP1(A)    PNP2(B)
  │             │
출력1 ──[모터]── 출력2
  │             │
  NPN3(A)    NPN4(B)
[GND]

정방향: A ON, B OFF → 전류 왼→오
역방향: B ON, A OFF → 전류 오→왼
```
