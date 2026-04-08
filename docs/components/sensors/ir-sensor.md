# 적외선 센서 — IR 장애물 감지 + IR 수신 모듈

## 개요

적외선(Infrared, IR) 센서는 크게 두 가지 용도로 사용됩니다:

1. **IR 장애물 감지 모듈**: 적외선 LED와 포토트랜지스터를 사용하여 전방 물체를 반사 감지
2. **IR 수신 모듈 (VS1838B 등)**: 리모컨에서 발사하는 38kHz 변조 적외선 신호를 수신하고 디코딩

**측정 원리**

- **장애물 감지**: IR LED가 적외선을 방사하고, 전방 물체에 반사된 적외선을 포토트랜지스터가 감지합니다.
  LM393 비교기로 수신량을 임계값과 비교하여 디지털 신호를 출력합니다.
- **리모컨 수신**: VS1838B 등의 IR 수신 모듈은 38kHz로 변조된 IR 신호를 대역 통과 필터 및 검출기로 수신하고,
  NEC, RC-5, Sony 등 다양한 프로토콜로 인코딩된 데이터를 복조합니다.

**아두이노에서의 활용**
장애물 감지: 라인 팔로워 로봇, 장애물 회피 로봇, 카운터, 에지 감지.
IR 수신: 리모컨 제어 가전, 프로젝터 제어, 에어컨 제어 모방 등.

---

## 모델 비교

### IR 장애물 감지 모듈

| 항목 | 일반 IR 모듈 | FC-51 | TCRT5000 |
|------|------------|-------|----------|
| 감지 거리 | 2 ~ 30cm (조절) | 2 ~ 30cm | 0.2 ~ 15mm |
| 출력 | DO (디지털) | DO + AO | AO 전용 |
| 전압 | 3.3 ~ 5V | 3.3 ~ 5V | 3.3 ~ 5V |
| 반사체 색상 영향 | 있음 | 있음 | 있음 |
| 주요 용도 | 장애물 감지 | 장애물 감지 | 라인 감지 |

### IR 수신 모듈

| 항목 | VS1838B | TSOP38238 | TSOP31238 |
|------|---------|-----------|-----------|
| 반송 주파수 | 38 kHz | 38 kHz | 38 kHz |
| 동작 전압 | 2.7 ~ 5.5V | 2.5 ~ 5.5V | 2.5 ~ 5.5V |
| 수신 거리 | 최대 18m | 최대 45m | 최대 40m |
| 응답 속도 | — | 4µs | 4µs |
| 패키지 | DIP-3 | DIP-3 | DIP-3 |

---

## 핀 구성

### IR 장애물 감지 모듈 (3핀 또는 4핀)

```
  ┌──────────────────────────┐
  │  (IR LED)  (포토트랜지스터)│
  │      O         O         │
  │                          │
  │  VCC GND  OUT  (AO)       │
  └──────────────────────────┘
```

| 핀 이름 | 역할 |
|---------|------|
| VCC | 전원 (+3.3V ~ 5V) |
| GND | 접지 |
| OUT (DO) | 디지털 출력 (물체 감지 시 LOW) |
| AO (선택) | 아날로그 출력 (일부 모듈) |

### VS1838B IR 수신 모듈 (DIP-3, 정면 기준)

```
    VS1838B 정면 (볼록면 앞)
    
  ┌──────────┐
  │  1  2  3 │
  └──────────┘
     │  │  │
    OUT GND VCC
```

| 핀 번호 | 이름 | 역할 |
|---------|------|------|
| 1 | OUT | 복조된 IR 데이터 출력 (신호 수신 시 LOW 펄스) |
| 2 | GND | 접지 |
| 3 | VCC | 전원 (+2.7 ~ 5.5V) |

---

## 전기적 스펙

### IR 장애물 감지 모듈

| 파라미터 | 값 | 단위 |
|----------|-----|------|
| 동작 전압 | 3.3 ~ 5 | V |
| 동작 전류 | 약 20 (IR LED 포함) | mA |
| 감지 거리 | 2 ~ 30 (가변저항 조절) | cm |
| DO 출력 HIGH | VCC 근접 | V |
| DO 출력 LOW | 0 | V |
| IR LED 파장 | 940 | nm |

### VS1838B IR 수신 모듈

| 파라미터 | 값 | 단위 |
|----------|-----|------|
| 동작 전압 | 2.7 ~ 5.5 | V |
| 동작 전류 | 0.4 | mA |
| 반송 주파수 | 38 | kHz |
| 수신 파장 | 940 | nm |
| 수신 거리 (무방해) | 최대 18 | m |
| 출력 LOW (신호 수신) | 0.4 이하 | V |
| 출력 HIGH (무신호) | VCC - 0.4 이상 | V |
| 응답 시간 | 1 이하 | ms |

---

## 통신 프로토콜

### IR 장애물 감지 — 디지털 출력

```
물체 없음: OUT = HIGH (3.3V)
물체 감지: OUT = LOW  (0V)  ← 반사광이 임계값 이상
```

### NEC 프로토콜 (가장 일반적인 리모컨 프로토콜)

```
캐리어 주파수: 38 kHz

리더 코드:
  9ms  버스트 (LOW)
  4.5ms 공간 (HIGH)

비트 인코딩:
  '0': 562.5µs 버스트 + 562.5µs 공간  (총 1.125ms)
  '1': 562.5µs 버스트 + 1687.5µs 공간 (총 2.25ms)

데이터 구조 (32비트):
  [8비트 주소] [8비트 주소 반전] [8비트 명령] [8비트 명령 반전]

반복 코드:
  9ms 버스트 + 2.25ms 공간 + 562.5µs 버스트
  (버튼 누르고 있을 때 110ms마다 전송)
```

### RC-5 프로토콜 (Philips)

```
캐리어 주파수: 36 kHz
비트 인코딩: 바이페이즈(Bi-phase, Manchester)
  '0': LOW→HIGH 전환 (889µs + 889µs)
  '1': HIGH→LOW 전환 (889µs + 889µs)
프레임: 14비트 (1 스타트 + 1 필드 + 1 토글 + 5 주소 + 6 명령)
```

---

## 아두이노 연결 방법

### IR 장애물 감지 모듈 연결

```
ESP32-C3          IR 장애물 모듈
  3.3V ──────────── VCC
  GND  ──────────── GND
  G4   ──────────── OUT (도착 시 LOW)
```

### VS1838B IR 수신 모듈 연결

```
ESP32-C3          VS1838B
  3.3V ──┬─────── VCC (3번)
         │
        100nF     (전원 바이패스 커패시터)
         │
  GND  ──┴─────── GND (2번)
  G4   ──────────── OUT (1번)
```

> **전원 바이패스 커패시터 100nF 필수**: VS1838B는 전원 노이즈에 민감하며,
> 커패시터 없이 연결하면 노이즈로 인한 오수신이 빈번합니다.

### IR 수신 라이브러리 설치

Arduino IDE > 라이브러리 매니저에서:
- `IRremote` by Armin Joachimsmeyer (v3.x) 설치 (권장)
  또는
- `IRrecvDemo` by Ken Shirriff

### IR 수신 기본 코드 (IRremote v3)

```cpp
#include <IRremote.hpp>

#define IR_RECEIVE_PIN  4  // VS1838B OUT 연결 핀

void setup() {
  Serial.begin(115200);
  IrReceiver.begin(IR_RECEIVE_PIN, ENABLE_LED_FEEDBACK);
  Serial.println("IR 수신 대기 중...");
}

void loop() {
  if (IrReceiver.decode()) {
    Serial.println(IrReceiver.decodedIRData.decodedRawData, HEX);

    // 프로토콜 이름 출력
    Serial.print("프로토콜: ");
    Serial.println(getProtocolString(IrReceiver.decodedIRData.protocol));

    // 주소와 명령 출력
    Serial.printf("주소: 0x%02X  명령: 0x%02X\n",
      IrReceiver.decodedIRData.address,
      IrReceiver.decodedIRData.command);

    IrReceiver.resume(); // 다음 신호 수신 준비
  }
}
```

### IR 장애물 감지 기본 코드

```cpp
#define IR_OBSTACLE_PIN  4

void setup() {
  Serial.begin(115200);
  pinMode(IR_OBSTACLE_PIN, INPUT);
}

void loop() {
  bool obstacle = (digitalRead(IR_OBSTACLE_PIN) == LOW);

  if (obstacle) {
    Serial.println("장애물 감지!");
  } else {
    Serial.println("장애물 없음");
  }

  delay(100);
}
```

### 리모컨 특정 버튼 처리 예시

```cpp
#include <IRremote.hpp>

#define IR_PIN  4

// 리모컨 버튼 코드 (모델마다 다름 — 먼저 HEX값 출력하여 확인)
#define BTN_POWER   0x45
#define BTN_VOL_UP  0x46
#define BTN_VOL_DN  0x15

void handleButton(uint8_t cmd) {
  switch (cmd) {
    case BTN_POWER:   Serial.println("전원"); break;
    case BTN_VOL_UP:  Serial.println("볼륨 UP"); break;
    case BTN_VOL_DN:  Serial.println("볼륨 DOWN"); break;
    default:          Serial.printf("알 수 없는 코드: 0x%02X\n", cmd); break;
  }
}

void setup() {
  Serial.begin(115200);
  IrReceiver.begin(IR_PIN, DISABLE_LED_FEEDBACK);
}

void loop() {
  if (IrReceiver.decode()) {
    if (IrReceiver.decodedIRData.protocol == NEC) {
      handleButton(IrReceiver.decodedIRData.command);
    }
    IrReceiver.resume();
  }
}
```

---

## 측정값 계산 공식

### IR 장애물 감지 — 감지 거리 설정

가변저항을 돌려 감지 거리를 조절합니다:
```
가변저항 → LM393 비교기 입력 기준 전압 설정
  기준 전압 높음 (CW): 강한 반사만 감지 → 감지 거리 짧아짐
  기준 전압 낮음 (CCW): 약한 반사도 감지 → 감지 거리 길어짐
```

### NEC 프로토콜 디코딩 로직

```
1. 리더 코드 감지 (9ms LOW + 4.5ms HIGH)
2. 32비트 데이터 읽기 (LSB First)
3. 주소 검증: byte[0] XOR byte[1] == 0xFF
4. 명령 검증: byte[2] XOR byte[3] == 0xFF

검증 실패 시 → 데이터 오류
```

---

## 주의사항

### IR 장애물 감지 모듈

1. **반사율 영향**
   - 검은색 물체는 적외선을 흡수하여 감지 어려움 — 흰색/밝은색 물체는 잘 감지됨
   - 라인 팔로워에서 흰 바닥/검은 라인 또는 그 반대로 활용

2. **주변 광 간섭**
   - 직사광선이나 형광등의 적외선 성분이 간섭을 일으킬 수 있음
   - 야외 사용 시 IR 차단 필터 또는 감지 방향 주의

3. **유리·거울 표면**
   - 유리는 IR을 부분적으로 반사/투과하므로 오감지 가능

4. **감지 거리 한계**
   - 30cm 이상의 거리는 일반 IR 모듈로 신뢰성 있는 감지 어려움
   - 장거리는 HC-SR04(초음파) 사용 권장

### VS1838B IR 수신 모듈

5. **38kHz 전용**
   - VS1838B는 38kHz 전용이며, 다른 주파수(36kHz, 40kHz) 리모컨과 호환성이 낮을 수 있음
   - TSOP34836(36kHz), TSOP34840(40kHz) 등 대역 선택

6. **형광등 간섭**
   - 형광등과 일부 에너지 절약 전구가 IR 간섭을 일으킬 수 있음
   - 전자식 형광등(CCFL)은 수십kHz 주파수로 점등하여 간섭 가능

7. **바이패스 커패시터 필수**
   - VS1838B VCC와 GND 사이에 100nF 커패시터 없으면 오수신 빈발

8. **반복 코드 처리**
   - IRremote 라이브러리에서 `IRDATA_FLAGS_IS_REPEAT` 플래그로 반복 코드 구분 가능

---

## 캘리브레이션 방법

### IR 장애물 감지 거리 보정

```
1. 원하는 감지 거리에 흰 종이를 놓음
2. DO LED가 켜지도록 가변저항을 조절 (CW/CCW)
3. 종이를 제거 → DO LED 꺼짐 확인
4. 검은 물체에서도 테스트하여 감도 조정
```

### 리모컨 버튼 코드 학습

```cpp
// 모든 수신 코드를 출력하여 버튼 매핑 수집
void setup() {
  Serial.begin(115200);
  IrReceiver.begin(IR_PIN, ENABLE_LED_FEEDBACK);
  Serial.println("리모컨의 각 버튼을 순서대로 눌러 코드를 확인하세요:");
}

void loop() {
  if (IrReceiver.decode()) {
    if (!(IrReceiver.decodedIRData.flags & IRDATA_FLAGS_IS_REPEAT)) {
      Serial.printf("프로토콜: %-10s  주소: 0x%04X  명령: 0x%02X\n",
        getProtocolString(IrReceiver.decodedIRData.protocol),
        IrReceiver.decodedIRData.address,
        IrReceiver.decodedIRData.command);
    }
    IrReceiver.resume();
  }
}
```

---

## 실사용 팁

- **라인 팔로워 로봇**: TCRT5000 또는 IR 모듈 2~4개를 나란히 배치하여 선을 따라 이동하는 로봇 구현
- **IR 리모컨 코드 캡처 후 에어컨 제어**: 에어컨 리모컨 신호를 IRremote로 캡처 후 ESP32로 재전송하면 Wi-Fi 스마트홈 연동 가능
- **IR 송신**: IRremote는 수신 외에 `IrSender.sendNEC()` 등으로 IR 신호 발송도 지원
- **물체 색상 무관 감지**: 감지 거리를 가능한 짧게 (5~10cm) 설정하면 어두운 색 물체도 감지 가능성 높아짐
- **수신 감도 최대화**: 주변 광이 많은 환경에서는 VS1838B에 검은 수축 튜브를 씌워 지향성을 높임
- **ESP32-C3 전용 인터럽트 핀**: VS1838B OUT을 인터럽트 지원 핀에 연결하면 더 정밀한 타이밍 처리 가능
