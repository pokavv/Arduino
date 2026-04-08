# 16x2 LCD (I2C PCF8574 백팩 포함)

## 개요

HD44780 컨트롤러 기반의 16열 × 2행 문자 LCD(Liquid Crystal Display)입니다.  
각 셀은 5×8 픽셀 도트 매트릭스로 문자를 표시하며, 백라이트로 가시성을 높입니다.  
I2C PCF8574 백팩을 사용하면 단 2개의 GPIO로 LCD를 제어할 수 있어 핀 수가 부족한 ESP32-C3에 매우 유용합니다.

**HD44780**: Hitachi가 개발한 문자 LCD 표준 컨트롤러. 대부분의 16x2, 20x4 LCD가 이를 사용합니다.  
**PCF8574**: NXP(구 Philips)의 I2C 8비트 I/O 익스팬더. LCD 백팩에 내장되어 4비트 병렬 통신을 I2C로 변환합니다.

---

## 종류 및 모델 비교

| 항목 | 16x2 병렬 (직접) | 16x2 + I2C 백팩 | 20x4 + I2C 백팩 |
|------|----------------|----------------|----------------|
| 열 × 행 | 16 × 2 | 16 × 2 | 20 × 4 |
| 필요 GPIO | 6~10개 | 2개 (SDA, SCL) | 2개 (SDA, SCL) |
| 통신 방식 | 4비트/8비트 병렬 | I2C (100~400kHz) | I2C (100~400kHz) |
| I2C 주소 | — | 0x20~0x27 (기본 0x27) | 0x20~0x27 |
| 백라이트 제어 | 별도 핀 | I2C로 제어 | I2C로 제어 |
| 사용 편의성 | 복잡 | 매우 간단 | 매우 간단 |

### PCF8574 I2C 주소 설정

| A2 | A1 | A0 | 주소 |
|----|----|----|------|
| LOW | LOW | LOW | 0x27 (PCF8574, 기본값) |
| LOW | LOW | HIGH | 0x26 |
| LOW | HIGH | LOW | 0x25 |
| LOW | HIGH | HIGH | 0x24 |
| HIGH | LOW | LOW | 0x23 |
| HIGH | LOW | HIGH | 0x22 |
| HIGH | HIGH | LOW | 0x21 |
| HIGH | HIGH | HIGH | 0x20 |

> PCF8574A 칩은 기본 주소가 0x3F (0x38~0x3F 범위).  
> 백팩 뒷면의 A0, A1, A2 점퍼 패드로 주소를 변경합니다.

---

## 핀 구성

### HD44780 LCD 직접 인터페이스 (16핀)

| 핀 번호 | 이름 | 기능 |
|---------|------|------|
| 1 | VSS | GND |
| 2 | VDD | 5V 전원 |
| 3 | V0 | 명암(Contrast) 조절 (가변저항 연결) |
| 4 | RS | 레지스터 선택 (0=명령, 1=데이터) |
| 5 | RW | 읽기/쓰기 선택 (0=쓰기, 보통 GND) |
| 6 | EN | Enable (클럭 신호) |
| 7 | D0 | 데이터 비트 0 (8비트 모드에서만 사용) |
| 8 | D1 | 데이터 비트 1 (8비트 모드에서만 사용) |
| 9 | D2 | 데이터 비트 2 (8비트 모드에서만 사용) |
| 10 | D3 | 데이터 비트 3 (8비트 모드에서만 사용) |
| 11 | D4 | 데이터 비트 4 |
| 12 | D5 | 데이터 비트 5 |
| 13 | D6 | 데이터 비트 6 |
| 14 | D7 | 데이터 비트 7 |
| 15 | A (LED+) | 백라이트 애노드 (5V, 저항 포함) |
| 16 | K (LED−) | 백라이트 캐소드 (GND) |

### PCF8574 I2C 백팩 핀

| 핀 | 기능 |
|----|------|
| VCC | 5V 전원 입력 |
| GND | 접지 |
| SDA | I2C 데이터 |
| SCL | I2C 클럭 |

**백팩 내부 매핑 (PCF8574 → HD44780):**

| PCF8574 핀 | LCD 핀 | 기능 |
|-----------|--------|------|
| P0 | RS | 레지스터 선택 |
| P1 | RW | 읽기/쓰기 (GND로 고정) |
| P2 | EN | Enable |
| P3 | 백라이트 | 트랜지스터를 통해 백라이트 제어 |
| P4 | D4 | 데이터 4 |
| P5 | D5 | 데이터 5 |
| P6 | D6 | 데이터 6 |
| P7 | D7 | 데이터 7 |

---

## 핵심 전기적 스펙

### LCD 패널

| 파라미터 | 기호 | 값 | 단위 |
|---------|------|-----|------|
| 공급 전압 | VDD | 4.5 ~ 5.5 (typ 5.0) | V |
| 동작 전류 (LCD + 백라이트) | Idd | 1~2 (패널) + 100~120 (백라이트) | mA |
| 명암 조절 전압 | V0 | 0 ~ 1.5 (typ 0.5) | V |
| 백라이트 순방향 전압 | Vf(LED) | 4.2 ~ 4.6 | V |
| 백라이트 순방향 전류 | If(LED) | 80 ~ 120 | mA |
| 동작 온도 | Topr | 0 ~ +50 | °C |
| 저장 온도 | Tstg | −20 ~ +70 | °C |
| 응답 속도 | — | 250 | ms |

### PCF8574 I/O 익스팬더

| 파라미터 | 기호 | 값 | 단위 |
|---------|------|-----|------|
| 공급 전압 | VCC | 2.5 ~ 6.0 | V |
| I2C 속도 (표준) | — | 100 | kHz |
| I2C 속도 (고속) | — | 400 | kHz |
| 출력 전류 (HIGH) | IOH | 0.3 | mA |
| 출력 전류 (LOW, 싱크) | IOL | 25 | mA |
| 동작 전류 | ICC | 100 | µA |
| 동작 온도 | Topr | −40 ~ +85 | °C |

---

## 동작 원리

### HD44780 초기화 시퀀스

1. 전원 인가 후 15ms 이상 대기
2. 8비트 모드 명령 3회 전송
3. 4비트 모드 전환
4. 디스플레이 설정: 라인 수, 폰트 크기
5. 디스플레이 ON/OFF 설정
6. 엔트리 모드 설정 (커서 이동 방향)

### I2C 백팩 통신 흐름

```
MCU → I2C SDA/SCL → PCF8574 → 8비트 병렬 → HD44780 (4비트 모드)

1. I2C 주소 + 쓰기 신호 전송
2. PCF8574가 8비트 데이터를 출력
3. LCD는 4비트씩 두 번에 나눠 명령/데이터 수신
4. EN 핀 토글로 데이터 래치
```

### 명암 조절 원리 (직접 연결 시)

```
V0 전압:  0V   → 최대 명암 (너무 어둡게 보일 수 있음)
          0.5V → 최적 명암 (일반적)
          1.5V → 명암 없음 (표시 안 보임)

→ 10kΩ 가변저항: 한쪽 끝 GND, 다른 끝 5V, 가운데 V0에 연결
```

---

## 아두이노 연결 방법

### I2C 백팩 연결 (권장)

```
ESP32-C3    I2C 백팩
  SDA  ──── SDA (ESP32-C3 기본: G6 또는 G8)
  SCL  ──── SCL (ESP32-C3 기본: G7 또는 G9)
  5V   ──── VCC  (반드시 5V, 3.3V로는 불안정)
  GND  ──── GND

주의: ESP32-C3의 I2C 풀업 저항 (4.7kΩ)이 필요하거나
      백팩 내장 풀업 저항이 있으면 생략 가능.
```

> ESP32-C3의 기본 I2C 핀: SDA=G6, SCL=G7 (코드에서 Wire.begin(6, 7) 명시)

### 5V LCD + 3.3V ESP32-C3 주의사항

- LCD 패널 전원은 5V 필요 (3.3V로는 표시 불안정)
- I2C 신호는 3.3V로도 PCF8574가 인식 가능 (VIH = 0.7 × VCC)
- 단, PCF8574의 VCC가 5V이면 SDA/SCL 출력도 5V → ESP32-C3 핀에 5V 입력 위험
- **해결책**: PCF8574 VCC에 3.3V 공급 (LCD 별도 5V 연결, 백팩 VCC는 3.3V)
  또는 I2C 레벨 시프터(양방향) 사용

---

## 코드 예제 개념

### 기본 텍스트 출력 (LiquidCrystal_I2C 라이브러리)

```cpp
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// LiquidCrystal_I2C(주소, 열 수, 행 수)
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
    Wire.begin(6, 7);    // ESP32-C3 SDA=6, SCL=7 (보드에 따라 다름)
    lcd.init();          // LCD 초기화
    lcd.backlight();     // 백라이트 ON

    lcd.setCursor(0, 0); // (열, 행) 0-indexed
    lcd.print("Hello, World!");

    lcd.setCursor(0, 1); // 두 번째 줄
    lcd.print("ESP32-C3");
}

void loop() {
    // 정적 텍스트는 setup()에서 한 번만 출력
}
```

### 동적 데이터 표시 (센서값 갱신)

```cpp
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

unsigned long lastUpdate = 0;
const unsigned long UPDATE_INTERVAL = 1000; // 1초마다 갱신

void setup() {
    Wire.begin(6, 7);
    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Temp:           "); // 초기 레이블
}

void loop() {
    unsigned long now = millis();
    if (now - lastUpdate >= UPDATE_INTERVAL) {
        lastUpdate = now;

        float temp = 25.4; // 실제로는 센서에서 읽음

        lcd.setCursor(6, 0);   // 값 위치로 이동
        lcd.print(temp, 1);    // 소수점 1자리
        lcd.print(" C  ");     // 단위 + 공백(이전 글자 지움)
    }
}
```

### 커스텀 문자 정의

```cpp
// 5×8 픽셀 커스텀 문자 (하트 모양)
byte heart[8] = {
    0b00000,
    0b01010,
    0b11111,
    0b11111,
    0b01110,
    0b00100,
    0b00000,
    0b00000,
};

void setup() {
    Wire.begin(6, 7);
    lcd.init();
    lcd.backlight();

    lcd.createChar(0, heart);   // 인덱스 0에 등록 (0~7 사용 가능)

    lcd.setCursor(0, 0);
    lcd.write(byte(0));         // 커스텀 문자 출력
    lcd.print(" I love ESP32");
}
```

### I2C 주소 스캔

```cpp
#include <Wire.h>

void setup() {
    Serial.begin(115200);
    Wire.begin(6, 7);

    Serial.println("I2C 주소 스캔 시작...");
    for (byte addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        byte error = Wire.endTransmission();
        if (error == 0) {
            Serial.print("발견된 주소: 0x");
            if (addr < 16) Serial.print("0");
            Serial.println(addr, HEX);
        }
    }
}
```

---

## 마킹/식별 방법

| 확인 방법 | 설명 |
|---------|------|
| 백팩 칩 각인 | PCF8574(주소 0x27) 또는 PCF8574A(주소 0x3F) |
| 백팩 핀 라벨 | VCC, GND, SDA, SCL |
| A0/A1/A2 점퍼 | 뒷면 3개 점퍼로 I2C 주소 8가지 선택 |
| LCD 마킹 | 전면 프레임에 모델명 (예: 1602A, WH1602L) |
| 핀 방향 | 핀 1이 LCD 좌측 (또는 기판 각인 "1" 표시) |

---

## 주의사항

1. **반드시 5V 전원**: LCD 패널(VDD)은 5V가 필요합니다. 3.3V로는 명암이 나오지 않거나 동작 불안정.
2. **명암 조절**: 직접 연결 시 V0에 가변저항(10kΩ) 연결 필수. 처음 글자가 안 보이면 이 핀을 확인.
3. **I2C 주소 확인**: 두 개 이상 I2C 기기 연결 시 주소 충돌 방지를 위해 스캔 코드로 먼저 확인.
4. **3.3V vs 5V 레벨**: ESP32-C3(3.3V)와 5V PCF8574 혼용 시 레벨 시프터 필요. 5V 신호가 ESP32 GPIO에 직접 인가되면 손상.
5. **백라이트 전류**: 백라이트는 약 100mA. 아두이노 핀에서 직접 공급하지 말고 별도 전원 사용.
6. **초기화 대기 시간**: 전원 인가 후 최소 40~50ms 이상 대기 후 초기화 명령을 보내야 정상 동작.
7. **특수문자 제한**: HD44780 내장 문자셋은 ASCII + 일부 일본어(카타카나). 한글은 직접 표시 불가. 커스텀 문자(0~7) 또는 커스텀 한글 LCD 사용.

---

## 자주 쓰이는 회로 패턴

### 패턴 1: I2C 백팩 기본 연결

```
ESP32-C3 GPIO6 (SDA) ──── SDA
ESP32-C3 GPIO7 (SCL) ──── SCL
5V ───────────────────── VCC
GND ──────────────────── GND
```

### 패턴 2: 온도/습도 모니터

```
LCD 1행: "온도: 25.4 C    "
LCD 2행: "습도: 60.2 %    "
→ millis() 기반으로 2초마다 갱신
```

### 패턴 3: 스크롤 긴 텍스트

```cpp
lcd.scrollDisplayLeft();  // 왼쪽으로 스크롤 (16자 초과 텍스트)
lcd.scrollDisplayRight(); // 오른쪽으로 스크롤
lcd.autoscroll();         // 자동 스크롤 ON
lcd.noAutoscroll();       // 자동 스크롤 OFF
```

### 패턴 4: 진행 바 표시

```
0%   ████████████████  100%
→ 커스텀 문자로 채워진 블록 정의 후 진행률에 따라 표시
```
