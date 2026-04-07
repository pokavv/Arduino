# CLAUDE.md — AI 개발 보조 설정

이 파일은 Claude Code가 이 프로젝트에서 작업할 때 참고하는 설정 파일입니다.

---

## 프로젝트 개요

- **보드**: ESP32-C3 Super Mini
- **언어**: C/C++ (Arduino Framework)
- **IDE**: Arduino IDE 2.x
- **목적**: ESP32-C3 Super Mini 기능 학습 및 프로젝트 구현

---

## 디렉토리 구조

```
esp32c3-supermini/
├── docs/
│   ├── cpp/          C/C++ 문법 가이드
│   ├── arduino/      아두이노 공통 기초
│   └── esp32c3/      ESP32-C3 전용 가이드
├── projects/         실제 구현 프로젝트
│   └── 프로젝트명/
│       └── 프로젝트명.ino
├── SKILLS.md         기술 스택 및 구현 현황
├── CLAUDE.md         이 파일
├── README.md
├── LICENSE
└── .gitignore
```

---

## 코딩 스타일 규칙

- 변수명, 함수명은 **한글 또는 영어** 모두 허용 (이 프로젝트는 학습 목적)
- 주석은 **한국어**로 작성
- 핀 번호는 반드시 `const int` 또는 `#define`으로 상단에 정의
- `delay()` 대신 `millis()` 패턴 사용 권장 (단순 테스트 제외)
- Wi-Fi 비밀번호 등 민감 정보는 `secrets.h`에 분리 (`.gitignore`에 포함됨)

---

## 보드 특성 주의사항

- 내장 LED: **GPIO 8**, **LOW = 켜짐** (반전 로직)
- 동작 전압: **3.3V** (5V 직접 연결 금지)
- ADC: 12비트 (0~4095), Wi-Fi 활성 시 불안정 가능
- PWM: `analogWrite()` 대신 `ledcWrite()` 사용
- USB CDC On Boot: **Enabled** 필수 (시리얼 모니터 동작)
- 부팅핀: G0, G9 (부팅 중 외부 신호 주의)
- Wi-Fi: **2.4GHz 전용** (5GHz 불가)

---

## 새 프로젝트 생성 규칙

1. `projects/프로젝트명/` 폴더 생성
2. `프로젝트명.ino` 파일 생성
3. `secrets.h` 가 필요하면 동일 폴더에 생성 (Git에 포함되지 않음)
4. 프로젝트 완료 후 `SKILLS.md`의 구현 상태 업데이트

### secrets.h 템플릿

```cpp
// secrets.h — Git에 포함되지 않음 (.gitignore)
#pragma once

const char* WIFI_SSID     = "공유기이름";
const char* WIFI_PASSWORD = "비밀번호";
const char* MQTT_SERVER   = "broker.example.com";
const char* OTA_PASSWORD  = "ota비밀번호";
```

---

## 문서 작성 규칙

- 새로운 기능/라이브러리를 배우면 `docs/esp32c3/` 에 추가
- 새 프로젝트 시작 전 관련 docs 먼저 확인
- 문서는 **한국어**로 작성
- 코드 예제는 반드시 포함

---

## 자주 쓰는 보드 설정 (Arduino IDE)

| 항목 | 값 |
|------|----|
| 보드 | ESP32C3 Dev Module |
| USB CDC On Boot | Enabled |
| CPU Frequency | 160MHz |
| Flash Size | 4MB |
| Upload Speed | 921600 |

---

## 참고 링크

- [ESP32-C3 데이터시트](https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf)
- [arduino-esp32 GitHub](https://github.com/espressif/arduino-esp32)
- [ESP32-C3 Super Mini 시작 가이드](https://randomnerdtutorials.com/getting-started-esp32-c3-super-mini/)
