# ESP32-C3 Super Mini — 개발 가이드

ESP32-C3 Super Mini 보드 기반의 개발 문서, 예제, 구현 가이드 저장소입니다.

## 보드 소개

| 항목 | 사양 |
|------|------|
| 칩 | ESP32-C3FN4 (32비트 RISC-V) |
| 클럭 | 최대 160 MHz |
| RAM | 400 KB SRAM |
| 플래시 | 4 MB 내장 |
| Wi-Fi | 802.11 b/g/n (2.4GHz) |
| Bluetooth | BLE 5.0 |
| USB | USB-C (내장 USB Serial) |
| 크기 | 약 22.5 × 18mm |

---

## 디렉토리 구조

```
esp32c3-supermini/
├── docs/                    # 개발 문서
│   ├── index.md             # 전체 목차
│   ├── cpp/                 # C/C++ 언어 문법
│   ├── arduino/             # 아두이노 공통 기초
│   └── esp32c3/             # ESP32-C3 전용 가이드
├── projects/                # 실제 구현 프로젝트
│   └── (프로젝트별 폴더)
├── SKILLS.md                # 기술 스택 정리
├── CLAUDE.md                # AI 개발 보조 설정
├── .gitignore
└── LICENSE
```

---

## 문서 목록

### C/C++ 문법 → `docs/cpp/`
C/C++를 처음 접하는 사람을 위한 기초 문법 가이드

### 아두이노 공통 → `docs/arduino/`
보드 무관하게 적용되는 아두이노 개발 기초

### ESP32-C3 전용 → `docs/esp32c3/`
Wi-Fi, BLE, PWM, 딥슬립, OTA, MQTT 등 ESP32-C3 기능 구현 가이드

---

## 개발 환경

- **IDE**: Arduino IDE 2.x
- **보드 패키지**: Espressif ESP32 (arduino-esp32)
- **언어**: C/C++ (Arduino Framework)
- **보드 설정**: `ESP32C3 Dev Module`, USB CDC On Boot: Enabled

---

## 라이선스

MIT License — 자세한 내용은 [LICENSE](LICENSE) 참고
