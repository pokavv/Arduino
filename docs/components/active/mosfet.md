# N채널 MOSFET (IRF540, IRLZ44N, 2N7000)

## 개요

MOSFET(Metal-Oxide-Semiconductor Field-Effect Transistor)은 게이트(Gate) 전압으로 드레인(Drain)~소스(Source) 채널을 제어하는 전압 구동 스위칭 소자입니다.  
BJT 트랜지스터와 달리 게이트 전류가 거의 0이며, 전압만으로 스위칭합니다.  
N채널 MOSFET은 게이트에 양의 전압(VGS)을 인가하면 드레인에서 소스로 전류가 흐릅니다.  
아두이노에서는 모터, 릴레이, 히터, 대용량 LED 스트립 등 고전류 부하를 GPIO로 제어할 때 사용합니다.

**로직 레벨 MOSFET(Logic-Level MOSFET)**: VGS = 3.3~5V에서 완전 ON 상태(완전 포화)에 도달하도록 설계된 MOSFET.  
아두이노/ESP32와 직접 인터페이스할 때는 반드시 로직 레벨 MOSFET 사용.

---

## 종류 및 모델 비교

| 모델 | 패키지 | VDS(max) | ID(max) | RDS(on) | VGS(th) | 로직 레벨 | 특징 |
|------|--------|---------|---------|---------|---------|---------|------|
| IRF540N | TO-220 | 100V | 33A | 44mΩ | 2~4V | 부분적 | 고전류, 일반 용도 |
| IRLZ44N | TO-220 | 55V | 47A | 22mΩ | 1~2V | 완전 지원 | 로직 레벨, 저저항 |
| IRLB8721 | TO-220 | 30V | 62A | 8.7mΩ | 1.4~2.4V | 완전 지원 | 초저저항, LED 스트립 |
| 2N7000 | TO-92 | 60V | 200mA | 5Ω | 0.8~3V | 완전 지원 | 소신호, TO-92 |
| BSS138 | SOT-23 | 50V | 200mA | 3.5Ω | 0.8~1.5V | 완전 지원 | SMD, 레벨 시프터 |
| AO3400 | SOT-23 | 30V | 5.7A | 26mΩ | 0.5~1V | 완전 지원 | SMD, 중전류 |
| FQP30N06L | TO-220 | 60V | 32A | 35mΩ | 1~2.5V | 완전 지원 | 로직 레벨, 범용 |
| STP55NF06L | TO-220 | 60V | 55A | 18mΩ | 1~2.5V | 완전 지원 | 고전류 로직 레벨 |

---

## 핀 구성

### TO-220 패키지 (IRF540N, IRLZ44N 등)

```
방열판이 있는 면을 앞으로, 핀이 아래를 향하게:

  ┌──────────┐
  │  방열판  │
  └────┬─────┘
    1  2  3

  핀1 = G (게이트, Gate)
  핀2 = D (드레인, Drain)
  핀3 = S (소스, Source)
```

### TO-92 패키지 (2N7000)

```
평평한 면을 앞으로, 핀이 아래를 향하게:

  ┌─────────┐
  │  평평면 │
  └────┬────┘
    1  2  3

  2N7000:
  핀1 = S (소스, Source)
  핀2 = G (게이트, Gate)
  핀3 = D (드레인, Drain)
```

| 단자 | 기호 | 기능 |
|------|------|------|
| 게이트 | G | 제어 입력. 전압 인가로 채널 ON/OFF. 전류 거의 불필요. |
| 드레인 | D | 전류 입력. 부하(+전원) 연결. |
| 소스 | S | 전류 출력. GND 연결 (N채널 기준). |

---

## 핵심 전기적 스펙

### IRF540N

| 파라미터 | 기호 | 값 | 단위 |
|---------|------|-----|------|
| 드레인-소스 최대 전압 | VDS | 100 | V |
| 게이트-소스 최대 전압 | VGS | ±20 | V |
| 최대 드레인 전류 (25°C) | ID | 33 | A |
| 최대 드레인 전류 (100°C) | ID | 23 | A |
| 드레인-소스 ON 저항 | RDS(on) | 44mΩ (VGS=10V) | Ω |
| 게이트 임계 전압 | VGS(th) | 2.0 ~ 4.0 | V |
| 최대 소비 전력 | Ptot | 150 (TO-220) | W |
| 입력 커패시턴스 | Ciss | 1726 | pF |
| 게이트 전하 | Qg | 67 | nC |
| 동작 온도 | Topr | −55 ~ +175 | °C |

### IRLZ44N (로직 레벨)

| 파라미터 | 기호 | 값 | 단위 |
|---------|------|-----|------|
| 드레인-소스 최대 전압 | VDS | 55 | V |
| 게이트-소스 최대 전압 | VGS | ±20 | V |
| 최대 드레인 전류 (25°C) | ID | 47 | A |
| 드레인-소스 ON 저항 | RDS(on) | 22mΩ (VGS=5V) | Ω |
| 게이트 임계 전압 | VGS(th) | 1.0 ~ 2.0 | V |
| 최대 소비 전력 | Ptot | 107 (TO-220) | W |
| 입력 커패시턴스 | Ciss | 3000 | pF |

### 2N7000 (소신호)

| 파라미터 | 기호 | 값 | 단위 |
|---------|------|-----|------|
| 드레인-소스 최대 전압 | VDS | 60 | V |
| 게이트-소스 최대 전압 | VGS | ±20 | V |
| 최대 드레인 전류 | ID | 200 | mA |
| 드레인-소스 ON 저항 | RDS(on) | 5 Ω (VGS=5V) | Ω |
| 게이트 임계 전압 | VGS(th) | 0.8 ~ 3.0 | V |
| 최대 소비 전력 | Ptot | 400 (TO-92) | mW |

---

## 동작 원리

### N채널 증강형(Enhancement Mode) MOSFET

```
VGS = 0V         → 채널 없음 → ID = 0 (OFF)
VGS = VGS(th)    → 채널 형성 시작 (임계값)
VGS > VGS(th)    → 채널 형성 → ID 흐름 (ON)
VGS = 10V~15V    → 완전 포화 (RDS(on) 최소)

로직 레벨 MOSFET: VGS = 3.3~5V에서 완전 포화
일반 MOSFET (IRF540): VGS = 10~12V 필요 (3.3V로는 불완전 ON)
```

### 세 가지 동작 영역

| 영역 | 조건 | 상태 | 특성 |
|------|------|------|------|
| 차단 (Cutoff) | VGS < VGS(th) | OFF | ID ≈ 0 |
| 선형 (Ohmic/Triode) | VGS > VGS(th), VDS < VGS−VGS(th) | 가변 저항 | RDS(on) 낮음 (스위치 ON) |
| 포화 (Saturation) | VGS > VGS(th), VDS ≥ VGS−VGS(th) | 정전류 | 증폭기 영역 |

### 스위칭 모드에서의 손실

```
전도 손실: P = ID² × RDS(on)
  예: ID=10A, RDS(on)=22mΩ → P = 100 × 0.022 = 2.2W

스위칭 손실: P = f × (tr + tf) / 2 × VDS × ID
  고주파 PWM에서 중요 (열 발생 원인)

총 손실 = 전도 손실 + 스위칭 손실
```

### 보디 다이오드 (Body Diode)

N채널 MOSFET 내부에는 소스→드레인 방향의 기생 다이오드가 존재합니다.  
역전류 경로 제공 (모터 역기전력, 인덕터 에너지 방출).  
H브리지에서 프리휠링 다이오드로 활용 가능.

---

## 아두이노 연결 방법

### 게이트 저항 계산

```
MOSFET 게이트는 용량성(커패시터와 유사).
직렬 저항 없이 연결해도 동작하지만, 급격한 전류 급변(dI/dt)으로
GPIO 핀 손상 및 EMI 발생 가능.

권장 게이트 저항: 10Ω ~ 100Ω
  → 10Ω: 빠른 스위칭 (고주파 PWM)
  → 100Ω: 느린 스위칭 (낮은 EMI, 저주파 ON/OFF)

일반 GPIO 구동 시: 33~100Ω 직렬 저항 권장
```

### 기본 N채널 스위칭 회로

```
[VCC (배터리 또는 외부 전원)]
    │
   [부하 (모터/LED 스트립/릴레이)]
    │
    D (드레인, MOSFET)
    G ──[10~100Ω]──[GPIO]
    S (소스)
    │
   GND
```

- GPIO HIGH → VGS = 3.3V (로직 레벨 MOSFET이면 완전 ON)
- GPIO LOW → VGS = 0V → MOSFET OFF

### 로직 레벨 호환성 확인

```
ESP32-C3 GPIO: HIGH = 3.3V

VGS(th) 비교:
  IRLZ44N: VGS(th) = 1~2V → 3.3V로 완전 ON ✓
  2N7000:  VGS(th) = 0.8~3V → 3.3V로 대부분 OK ✓
  IRF540N: VGS(th) = 2~4V → 3.3V로 불완전 (반쯤만 ON) ✗
  → IRF540N을 3.3V로 구동하면 RDS(on)이 수십Ω, 발열 심각
```

### 게이트 풀다운 저항 (중요)

```
GPIO ──[100Ω]──┬── G(게이트)
               │
             [10kΩ]
               │
              GND (풀다운)
```

- MOSFET 게이트는 정전기와 GPIO 플로팅으로 임의로 켜질 수 있습니다.
- **10kΩ 풀다운 저항을 게이트-소스 사이에 반드시 연결**합니다.
- 풀다운이 없으면 전원 투입 시 또는 GPIO 미설정 시 MOSFET이 ON될 수 있습니다.

### 유도성 부하 보호

```
[VCC]
  │
[유도성 부하 (모터/릴레이)]──[플라이백 다이오드(1N4007, 역방향)]
  │                                                              │
  D (드레인)                                                [VCC]
  G ──[100Ω]──GPIO
  S ── GND
```

---

## 코드 예제 개념

### 기본 ON/OFF 스위칭

```cpp
const int MOSFET_PIN = 7;

void setup() {
    pinMode(MOSFET_PIN, OUTPUT);
    digitalWrite(MOSFET_PIN, LOW);  // 초기 OFF
}

void loop() {
    digitalWrite(MOSFET_PIN, HIGH);  // 부하 ON
    delay(2000);
    digitalWrite(MOSFET_PIN, LOW);   // 부하 OFF
    delay(2000);
}
```

### PWM으로 모터/팬 속도 제어

```cpp
const int MOTOR_PIN = 5;
const int PWM_CHANNEL = 0;
const int PWM_FREQ = 20000;  // 20kHz (가청 주파수 초과, 소음 없음)
const int PWM_BITS = 8;       // 0~255

void setup() {
    ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_BITS);
    ledcAttachPin(MOTOR_PIN, PWM_CHANNEL);
    ledcWrite(PWM_CHANNEL, 0);  // 초기 정지
}

void setSpeed(uint8_t speed) {
    // speed: 0 = 정지, 255 = 최대
    ledcWrite(PWM_CHANNEL, speed);
}

void loop() {
    // 서서히 가속
    for (int s = 0; s <= 255; s += 5) {
        setSpeed(s);
        delay(50);
    }
    delay(2000);
    // 서서히 감속
    for (int s = 255; s >= 0; s -= 5) {
        setSpeed(s);
        delay(50);
    }
    delay(2000);
}
```

### LED 스트립 밝기 제어 (WS2812B 아닌 단순 단색 스트립)

```cpp
// 단순 아날로그 LED 스트립 (12V, 단색)
const int LED_STRIP_PIN = 4;
const int PWM_CH = 1;

void setup() {
    ledcSetup(PWM_CH, 5000, 8);
    ledcAttachPin(LED_STRIP_PIN, PWM_CH);
}

void loop() {
    // 0~100% 밝기 순환
    for (int brightness = 0; brightness <= 100; brightness++) {
        ledcWrite(PWM_CH, map(brightness, 0, 100, 0, 255));
        delay(20);
    }
}
```

### 소프트 스타트 (전류 돌입 방지)

```cpp
void softStart(int pin, int channel, int duration_ms) {
    // 부하를 서서히 켜서 돌입 전류 억제
    for (int i = 0; i <= 255; i++) {
        ledcWrite(channel, i);
        delay(duration_ms / 255);
    }
}
```

---

## 마킹/식별 방법

| 확인 방법 | 설명 |
|---------|------|
| 부품 각인 | TO-220 패키지에 모델명 (예: IRF540N, IRLZ44N) |
| 핀 방향 | TO-220: 방열판 기준 G(1), D(2), S(3) |
| 멀티미터 다이오드 모드 | S→D 방향 0.5~0.7V = 보디 다이오드 확인 |
| VGS 테스트 | G-S에 3V 인가 후 D-S 저항 측정 (<1Ω이면 ON) |
| 데이터시트 | 각인된 모델명으로 검색, RDS(on) 및 VGS(th) 확인 |

---

## 주의사항

1. **로직 레벨 MOSFET 필수**: 3.3V GPIO로 구동 시 반드시 VGS(th) < 2.5V인 로직 레벨 MOSFET 사용. IRF540N은 직접 사용 불가.
2. **게이트 풀다운 저항 필수**: 10kΩ 풀다운을 G-S 사이에 연결. 없으면 플로팅으로 인한 불규칙 동작 위험.
3. **VGS 최대 ±20V**: 게이트에 20V 이상 인가 금지. 게이트 산화막 파괴 → 영구 손상.
4. **정전기 손상**: MOSFET은 정전기에 매우 민감합니다. 취급 시 접지 필수. 보관 시 도전성 폼 사용.
5. **방열 설계**: RDS(on) × ID²로 전도 손실 계산 후 방열판 여부 결정. 10A 이상에서는 TO-220 + 방열판 필수.
6. **플라이백 다이오드**: 유도성 부하(모터, 릴레이, 솔레노이드)에 역기전력 보호 다이오드 필수. 일부 MOSFET은 내장 보디 다이오드로 대체 가능하지만, 빠른 별도 다이오드(1N4007, UF4007) 추가 권장.
7. **게이트 직렬 저항**: 고주파 PWM(> 10kHz)에서 게이트 직렬 저항(10~100Ω) 없이 사용하면 링잉(Ringing)으로 EMI 발생 및 인접 회로 오작동.
8. **N채널 vs P채널**: N채널은 로우사이드(GND 쪽) 스위치에 적합. 하이사이드 스위치에는 P채널 MOSFET 또는 게이트 드라이버 IC 사용.

---

## 자주 쓰이는 회로 패턴

### 패턴 1: 기본 로우사이드 스위치

```
VCC ──[부하]──[D(드레인)]
              G ──[100Ω]──[GPIO]
              G ──[10kΩ]── GND (풀다운)
              S(소스) ──── GND
```

### 패턴 2: 배터리/전원 스위치 (대용량 부하)

```
배터리+ ──[퓨즈]──[D]
                  G ──[100Ω]── GPIO
                  G ──[10kΩ]── GND
                  S ──────────── 부하+ ──[부하]── 배터리−(GND)
```

### 패턴 3: H브리지 (MOSFET 4개로 모터 정역전)

```
VCC
 ├── Q1(P채널) ──┬── Q3(P채널) ──┐
 │               │               │
 │            모터A          모터B
 │               │               │
 ├── Q2(N채널) ──┘   Q4(N채널) ──┘
GND
→ Q1+Q4 ON: 정방향
→ Q2+Q3 ON: 역방향
→ 전용 H브리지 IC(L298N, DRV8833) 사용 권장
```

### 패턴 4: 수중 펌프/팬 제어

```
12V 외부 전원 ──[펌프/팬]──[D(IRLZ44N)]
                            G ──[100Ω]── GPIO(3.3V)
                            G ──[10kΩ]── GND
                            S ─────────── GND (공통 GND)
```
- IRLZ44N: VGS(th)=1~2V, RDS(on)=22mΩ → 3.3V GPIO로 완전 ON.
- 12V, 수십 와트 부하도 거의 발열 없이 제어 가능.

### 패턴 5: 소신호 레벨 시프터 (BSS138 MOSFET)

```
3.3V ──[10kΩ]── LV
5V  ──[10kΩ]── HV
                 ├── G(BSS138)
                 │   D ── HV 신호
                 │   S ── LV 신호
→ I2C, UART 등 양방향 레벨 변환에 활용
```
