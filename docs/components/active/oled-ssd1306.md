# 0.96인치 OLED SSD1306 (I2C/SPI)

## 개요

SSD1306은 Solomon Systech가 개발한 OLED(Organic Light Emitting Diode) 디스플레이 드라이버 IC입니다.  
0.96인치 128×64 픽셀 단색(흰색/파랑/노랑) 디스플레이로, 자체 발광 방식으로 백라이트가 필요 없습니다.  
I2C(2핀) 또는 SPI(4~5핀)로 연결하며, 픽셀 단위 제어가 가능해 텍스트, 그래프, 아이콘, 애니메이션을 표시할 수 있습니다.  
아두이노에서는 센서 데이터 표시, 메뉴 UI, 상태 모니터, 게임 디스플레이 등 다양한 용도로 활용됩니다.

---

## 종류 및 모델 비교

| 항목 | 0.96인치 I2C | 0.96인치 SPI | 1.3인치 I2C (SH1106) | 0.91인치 I2C |
|------|------------|------------|---------------------|------------|
| 해상도 | 128 × 64 | 128 × 64 | 128 × 64 | 128 × 32 |
| 통신 | I2C | SPI | I2C | I2C |
| 필요 GPIO | 2개 | 4~5개 | 2개 | 2개 |
| 속도 | 느림 | 빠름 | 느림 | 느림 |
| 핀 수 | 4핀 | 7핀 | 4핀 | 4핀 |
| 특징 | 가장 범용적 | 빠른 갱신 | SSD1306과 유사 | 좁고 긴 형태 |

### 색상 옵션

| 색상 | 특징 |
|------|------|
| 흰색 | 가장 일반적, 밝고 선명 |
| 파랑 | 시원한 느낌, 계측기 스타일 |
| 노랑-파랑 | 상단 16픽셀 노랑 + 하단 48픽셀 파랑 |

---

## 핀 구성

### I2C 버전 (4핀)

| 핀 번호 | 라벨 | 기능 |
|---------|------|------|
| 1 | GND | 접지 |
| 2 | VCC | 전원 (3.3V 또는 5V) |
| 3 | SCL | I2C 클럭 |
| 4 | SDA | I2C 데이터 |

> 일부 모듈은 핀 순서가 VCC-GND-SCL-SDA 또는 GND-VCC-SCL-SDA이므로 실물 라벨 반드시 확인.

### SPI 버전 (7핀)

| 핀 번호 | 라벨 | 기능 |
|---------|------|------|
| 1 | GND | 접지 |
| 2 | VCC | 전원 (3.3V 또는 5V) |
| 3 | D0 / CLK / SCK | SPI 클럭 |
| 4 | D1 / MOSI | SPI 데이터 |
| 5 | RES / RST | 리셋 (LOW로 리셋) |
| 6 | DC / A0 | 데이터/명령 선택 |
| 7 | CS / CE | 칩 셀렉트 (LOW 활성) |

---

## 핵심 전기적 스펙

### 패널 + SSD1306 IC

| 파라미터 | 기호 | 값 | 단위 |
|---------|------|-----|------|
| 전원 전압 (로직) | VDD | 1.65 ~ 3.3 | V |
| OLED 구동 전압 | VBAT | 3.3 ~ 4.2 (내부 승압기 포함 시 3.3V 공급 가능) | V |
| 모듈 입력 전압 | VCC | 3.3 ~ 5.0 (모듈 레귤레이터 포함) | V |
| 동작 전류 (128×64 전체 ON) | — | 20 ~ 30 | mA |
| 동작 전류 (일반 텍스트) | — | 5 ~ 10 | mA |
| 절전 모드 전류 | — | < 10 | µA |
| I2C 속도 (표준) | — | 100 | kHz |
| I2C 속도 (고속) | — | 400 | kHz |
| SPI 속도 최대 | — | 10 | MHz |
| 해상도 | — | 128 × 64 | 픽셀 |
| 도트 피치 | — | 0.15 × 0.15 | mm |
| 화면 크기 | — | 21.74 × 10.86 | mm |
| 명암비 | — | > 2000:1 | — |
| 시야각 | — | > 160° | — |
| 응답 속도 | — | 10 | µs |
| I2C 기본 주소 | — | 0x3C (또는 0x3D) | — |
| 동작 온도 | Topr | −40 ~ +85 | °C |
| 저장 온도 | Tstg | −40 ~ +95 | °C |

### I2C 주소 선택

| SA0 핀 / 점퍼 | I2C 주소 |
|-------------|---------|
| LOW (기본) | 0x3C |
| HIGH | 0x3D |

> 모듈 뒷면의 저항 점퍼(R1/R2)를 납땜하여 주소 변경 가능.

---

## 동작 원리

### OLED 자체 발광

OLED는 유기 발광 소재가 전류를 받아 직접 빛을 냅니다.  
백라이트가 없어 소비 전력이 낮고, 켜진 픽셀만 전력을 소비합니다.  
배경이 검을수록 전력 소비가 적습니다.

### SSD1306 내부 구조

```
I2C/SPI 입력 → 명령 디코더 → GDDRAM(그래픽 RAM 128×64비트) → 디스플레이 드라이버 → OLED 패널
```

- **GDDRAM**: 128×64 = 8,192비트 = 1,024바이트 내부 그래픽 메모리
- **페이지 구조**: 64픽셀 높이를 8페이지(각 8픽셀)로 나눔. 각 바이트가 세로 8픽셀 제어.

### 좌표계

```
(0,0)              (127,0)
  ┌────────────────────┐
  │                    │ 64픽셀
  │  128 × 64 픽셀     │
  │                    │
  └────────────────────┘
(0,63)            (127,63)
```

---

## 아두이노 연결 방법

### I2C 연결 (ESP32-C3)

```
ESP32-C3 GPIO6 (SDA) ──── SDA
ESP32-C3 GPIO7 (SCL) ──── SCL
3.3V ─────────────────── VCC  (ESP32-C3와 같은 3.3V 시스템)
GND ──────────────────── GND
```

> ESP32-C3의 기본 I2C: SDA=GPIO6, SCL=GPIO7  
> 코드에서 `Wire.begin(6, 7)` 명시 또는 `display.begin()` 전에 Wire.begin() 호출.

### SPI 연결 (ESP32-C3, 소프트웨어 SPI)

```
ESP32-C3 GPIO4 ──── CLK (D0)
ESP32-C3 GPIO5 ──── MOSI (D1)
ESP32-C3 GPIO2 ──── RST
ESP32-C3 GPIO3 ──── DC
ESP32-C3 GPIO1 ──── CS
3.3V ────────────── VCC
GND ─────────────── GND
```

### I2C 풀업 저항

I2C 라인에 SDA, SCL 각각 4.7kΩ 풀업 저항이 필요합니다.  
많은 SSD1306 모듈에 내장 풀업 저항이 있어 추가 불필요한 경우가 많습니다.  
여러 I2C 기기를 연결할 때는 버스당 총 풀업값을 확인합니다.

---

## 코드 예제 개념

### Adafruit SSD1306 라이브러리 (가장 보편적)

```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

const int SCREEN_W = 128;
const int SCREEN_H = 64;
const int OLED_RESET = -1;  // 리셋 핀 없으면 -1
const int I2C_ADDR = 0x3C;

Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, OLED_RESET);

void setup() {
    Wire.begin(6, 7);  // ESP32-C3 SDA=6, SCL=7

    if (!display.begin(SSD1306_SWITCHCAPVCC, I2C_ADDR)) {
        Serial.println("SSD1306 초기화 실패!");
        while (true); // 무한 대기
    }

    display.clearDisplay();         // 화면 지우기
    display.setTextSize(1);         // 글자 크기 (1~4)
    display.setTextColor(SSD1306_WHITE); // 흰색 글자
    display.setCursor(0, 0);        // 시작 위치
    display.println("Hello, OLED!");
    display.println("ESP32-C3");
    display.display();              // 실제로 화면에 출력 (필수!)
}
```

### 도형 그리기

```cpp
display.clearDisplay();

// 선
display.drawLine(0, 0, 127, 63, SSD1306_WHITE);

// 사각형
display.drawRect(10, 10, 50, 30, SSD1306_WHITE);     // 빈 사각형
display.fillRect(70, 10, 50, 30, SSD1306_WHITE);     // 채운 사각형

// 원
display.drawCircle(64, 32, 20, SSD1306_WHITE);        // 빈 원
display.fillCircle(100, 50, 10, SSD1306_WHITE);       // 채운 원

// 삼각형
display.drawTriangle(10, 60, 60, 10, 110, 60, SSD1306_WHITE);

display.display();
```

### 센서 데이터 실시간 표시

```cpp
void displaySensorData(float temp, float humidity) {
    display.clearDisplay();

    // 라벨
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.print("온도: ");
    display.print(temp, 1);
    display.println(" C");

    display.setCursor(0, 16);
    display.print("습도: ");
    display.print(humidity, 1);
    display.println(" %");

    // 큰 글자로 온도 강조
    display.setTextSize(3);
    display.setCursor(20, 35);
    display.print(temp, 1);

    display.display();
}
```

### 진행 바 / 그래프

```cpp
// 진행 바 (0~100%)
void drawProgressBar(int percent) {
    display.clearDisplay();
    display.drawRect(0, 28, 128, 12, SSD1306_WHITE);
    int filled = map(percent, 0, 100, 0, 124);
    display.fillRect(2, 30, filled, 8, SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(50, 50);
    display.print(percent);
    display.print("%");
    display.display();
}
```

### U8g2 라이브러리 (고급, 한국어/다국어 지원 가능)

```cpp
#include <U8g2lib.h>
#include <Wire.h>

// I2C, SSD1306, 128x64, full buffer 모드
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);

void setup() {
    u8g2.begin();
}

void loop() {
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_ncenB08_tr);
    u8g2.drawStr(0, 24, "Hello, U8g2!");
    u8g2.sendBuffer();
    delay(1000);
}
```

---

## 마킹/식별 방법

| 확인 방법 | 설명 |
|---------|------|
| 모듈 기판 각인 | "SSD1306", "0.96 OLED", "128x64" 표기 |
| 핀 라벨 | GND, VCC, SCL, SDA (또는 GND, VCC, D0, D1, RES, DC, CS) |
| I2C 주소 | 뒷면 점퍼(SA0)로 0x3C/0x3D 선택 |
| 칩 하부 표기 | SSD1306 IC 각인 (핀셋으로 확대경 사용 시 확인 가능) |
| 화면 색상 | 동작 시 흰색/파랑/노랑-파랑으로 구분 |

---

## 주의사항

1. **전원 호환성**: 대부분의 모듈은 3.3V와 5V 모두 지원하는 레귤레이터를 내장합니다. 모듈 사양 확인 필수.
2. **I2C 주소 중복**: 같은 버스에 두 개 이상의 SSD1306 사용 시 주소 변경 필요. SA0 점퍼로 0x3C/0x3D 선택.
3. **display() 호출**: clearDisplay(), print(), drawXxx() 후 반드시 display.display()를 호출해야 실제 화면에 반영됩니다.
4. **RAM 사용량**: Adafruit SSD1306 라이브러리는 1KB 프레임 버퍼를 MCU RAM에 유지합니다. RAM이 부족한 MCU(Arduino Uno)에서는 U8g2의 페이지 버퍼 모드 사용 권장.
5. **번인(Burn-in)**: OLED는 장시간 같은 화상을 표시하면 잔상이 남을 수 있습니다. 화면 보호기나 픽셀 시프팅 구현 권장.
6. **SH1106과 혼동**: 1.3인치 OLED는 대부분 SH1106 컨트롤러 사용. SSD1306 라이브러리로는 일부 동작 불안정. U8g2나 전용 SH1106 라이브러리 사용.
7. **SPI vs I2C**: SPI는 I2C보다 10배 이상 빠른 갱신이 가능하지만 GPIO 핀을 더 사용합니다. 애니메이션이 필요한 경우 SPI 권장.

---

## 자주 쓰이는 회로 패턴

### 패턴 1: 기본 I2C 연결 (3.3V)

```
ESP32-C3 GPIO6 (SDA) ──── SDA
ESP32-C3 GPIO7 (SCL) ──── SCL
3.3V ─────────────────── VCC
GND ──────────────────── GND
```

### 패턴 2: 다중 OLED (주소 분리)

```
OLED #1: 주소 0x3C (SA0=LOW)
OLED #2: 주소 0x3D (SA0=HIGH)
→ 같은 I2C 버스에 두 개 연결 가능
```

### 패턴 3: 상태 화면 템플릿

```
┌────────────────────────────┐
│ Wi-Fi: 연결됨  IP: ...     │ ← 1행
│ 온도: 24.5°C  습도: 62%    │ ← 2행
│ ████████░░  MQTT: OK       │ ← 3행 (신호 강도 바)
│ 업타임: 00:05:23           │ ← 4행
└────────────────────────────┘
```

### 패턴 4: 절전 모드 활용

```cpp
display.ssd1306_command(SSD1306_DISPLAYOFF); // 화면 OFF (0.1µA 미만)
// ...절전 대기...
display.ssd1306_command(SSD1306_DISPLAYON);  // 화면 ON
```
