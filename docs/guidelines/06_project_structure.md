# 프로젝트 구성 규칙

---

## 디렉토리 구조

```
Arduino/                          ← 리포 루트 (Arduino IDE 스케치북)
├── projects/                     ← 구현 프로젝트
│   └── 프로젝트명/
│       ├── 프로젝트명.ino         ← 메인 스케치 (폴더명과 동일)
│       ├── secrets.h             ← 민감 정보 (.gitignore)
│       ├── config.h              ← 프로젝트 설정 상수
│       └── README.md             ← 프로젝트 설명
├── docs/                         ← 개발 문서
│   ├── cpp/                      ← C/C++ 문법
│   ├── arduino/                  ← 아두이노 공통
│   ├── esp32c3/                  ← ESP32-C3 전용
│   └── guidelines/               ← 개발 가이드라인
├── README.md
├── SKILLS.md
├── CLAUDE.md
├── LICENSE
└── .gitignore
```

---

## 프로젝트 폴더 명명 규칙

### 형식 — 일반 프로젝트

```
[기능]-[부품 또는 방식]
```

### 형식 — 테스트/학습용 (test/ 하위)

기능 목록 순서대로 번호를 붙여 정렬이 되도록 합니다.

```
[번호]-[기능]-[부품]
```

예시:
```
gpio/
├── 01-digital-output/
├── 02-builtin-led/
├── 03-digital-input-pullup/
...
adc/
├── 01-basic-read/
├── 02-voltage-read/
...
```

### 예시 — 일반 프로젝트

| 프로젝트 | 폴더명 |
|---------|--------|
| Wi-Fi로 LED 제어 | `wifi-led-control` |
| BLE로 모터 제어 | `ble-motor-control` |
| OLED에 온도 표시 | `temp-monitor-oled` |
| MQTT 센서 노드 | `mqtt-sensor-node` |
| OTA 업데이트 기본 | `ota-basic` |
| 딥슬립 배터리 센서 | `deepsleep-sensor` |

### 규칙

```
✅ 소문자만 사용
✅ 단어 구분은 하이픈(-)
✅ 기능이 명확히 드러나는 이름
✅ 테스트 폴더는 앞에 번호 붙여 정렬 (01-, 02-, ...)
❌ 대문자 사용 금지
❌ 공백, 언더스코어 금지
❌ test1, project2 같은 의미 없는 이름
```

---

## 파일 명명 규칙

### 스케치 파일 (.ino)

**폴더명과 반드시 동일**해야 합니다 (Arduino IDE 요구사항).

```
wifi-led-control/
└── wifi-led-control.ino   ✅

wifi-led-control/
└── main.ino               ❌ (폴더명과 다름 — 오류 발생)
```

### 헤더 파일 (.h)

| 파일 | 내용 |
|------|------|
| `secrets.h` | Wi-Fi 비번, API 키 등 민감 정보 |
| `config.h` | 핀 번호, 임계값, 주기 등 설정 상수 |
| `types.h` | 구조체, enum 정의 |

---

## 프로젝트 내 파일 구성

### 단순한 프로젝트 (기능 1~2개)

```
wifi-led-control/
├── wifi-led-control.ino   ← 모든 코드
├── secrets.h
└── README.md
```

### 복잡한 프로젝트 (기능 여러 개)

```
mqtt-sensor-node/
├── mqtt-sensor-node.ino   ← setup(), loop(), 메인 흐름
├── config.h               ← 핀, 상수, 설정값
├── secrets.h              ← Wi-Fi, MQTT 인증 정보
└── README.md
```

> Arduino IDE는 같은 폴더의 `.ino` 파일을 자동으로 합쳐서 컴파일합니다.
> 기능별로 `.ino` 파일을 나눠도 됩니다.

```
mqtt-sensor-node/
├── mqtt-sensor-node.ino   ← setup(), loop()
├── wifi.ino               ← Wi-Fi 관련 함수
├── mqtt.ino               ← MQTT 관련 함수
├── sensors.ino            ← 센서 읽기 함수
├── config.h
├── secrets.h
└── README.md
```

---

## config.h 작성 규칙

프로젝트의 모든 설정값을 한 파일에 모읍니다.

```cpp
// config.h
#pragma once

// ─── 핀 정의 ───────────────────────────────────
#define LED_PIN       8    // 내장 LED (Active LOW)
#define BUTTON_PIN    9    // 부트 버튼 (Active LOW, INPUT_PULLUP)
#define SDA_PIN       8
#define SCL_PIN       9

// ─── 타이밍 ────────────────────────────────────
#define SENSOR_INTERVAL_MS   5000   // 센서 읽기 주기 (ms)
#define SEND_INTERVAL_MS    30000   // 데이터 전송 주기 (ms)
#define WIFI_RETRY_MAX         20   // Wi-Fi 재시도 횟수
#define MQTT_RETRY_DELAY     5000   // MQTT 재연결 대기 (ms)

// ─── 센서 임계값 ────────────────────────────────
#define TEMP_HIGH_THRESHOLD  35.0f  // °C — 고온 경보
#define HUM_LOW_THRESHOLD    30.0f  // %  — 저습 경보

// ─── MQTT 토픽 ──────────────────────────────────
#define MQTT_TOPIC_TEMP     "home/living/temperature"
#define MQTT_TOPIC_HUM      "home/living/humidity"
#define MQTT_TOPIC_CMD      "home/living/cmd"
```

---

## secrets.h 작성 규칙

```cpp
// secrets.h — Git 포함 안 됨 (.gitignore에 등록됨)
#pragma once

// Wi-Fi
const char* WIFI_SSID     = "공유기이름";
const char* WIFI_PASSWORD = "비밀번호";

// MQTT
const char* MQTT_SERVER   = "broker.example.com";
const char* MQTT_USER     = "username";
const char* MQTT_PASS     = "password";
const int   MQTT_PORT     = 1883;

// OTA
const char* OTA_PASSWORD  = "ota비밀번호";
```

### secrets.h.example 만들어두기

실제 값 없이 형식만 담은 예시 파일을 Git에 포함합니다.

```cpp
// secrets.h.example — Git에 포함됨 (실제 값 없음)
#pragma once

const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
const char* MQTT_SERVER   = "YOUR_BROKER";
const char* MQTT_USER     = "YOUR_USER";
const char* MQTT_PASS     = "YOUR_PASS";
const int   MQTT_PORT     = 1883;
const char* OTA_PASSWORD  = "YOUR_OTA_PASS";
```

---

## README.md 작성 규칙

각 프로젝트 폴더의 README는 아래 형식으로 작성합니다.

```markdown
# 프로젝트명 — 한 줄 설명

## 동작
어떻게 동작하는지 간단히 설명

## 회로 연결
| ESP32-C3 핀 | 연결 대상 |
|------------|----------|
| G8 (내장 LED) | — |
| G9 | 버튼 → GND |

## 필요 라이브러리
- Adafruit SSD1306
- PubSubClient

## 사용 방법
1. secrets.h.example 을 secrets.h 로 복사
2. secrets.h 에 Wi-Fi 정보 입력
3. 업로드
4. 시리얼 모니터(115200)에서 IP 확인
5. 브라우저에서 IP 접속

## 관련 문서
- [Wi-Fi 가이드](../../docs/esp32c3/06_wifi.md)
```

---

## Git 커밋 규칙

```
형식: <타입>(<범위>): <설명>

타입:
  feat     새 기능 추가
  fix      버그 수정
  docs     문서 수정
  refactor 기능 변경 없는 코드 개선
  chore    설정, 파일 정리

예시:
  feat(wifi-led): 웹서버에 밝기 조절 슬라이더 추가
  fix(mqtt): 재연결 시 토픽 구독 누락 수정
  docs(guidelines): 프로젝트 구성 규칙 추가
  chore: .gitignore에 *.log 추가
```
