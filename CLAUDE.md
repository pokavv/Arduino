# CLAUDE.md

Claude Code가 이 프로젝트에서 작업할 때 참고하는 설정입니다.
상세 규칙은 `docs/guidelines/` 참고.

---

## 프로젝트

- **보드**: ESP32-C3 Super Mini
- **언어**: C/C++ (Arduino Framework)
- **IDE**: Arduino IDE 2.x

## 디렉토리 구조

```
Arduino/
├── projects/    구현 프로젝트 (.ino)
├── docs/
│   ├── cpp/                   C/C++ 문법
│   ├── arduino/               아두이노 공통
│   ├── esp32/c3/supermini/    ESP32-C3 Super Mini 전용
│   └── guidelines/            개발 가이드라인  ← 코딩 규칙 전체
├── SKILLS.md    기술 스택 및 구현 현황
└── CLAUDE.md    이 파일
```

## 보드 필수 주의사항

- 내장 LED: **G8**, **LOW = 켜짐** (Active LOW)
- 동작 전압: **3.3V** — 5V 직접 연결 금지
- ADC: 12비트 (0~4095), Wi-Fi 켜면 불안정 가능
- PWM: `analogWrite()` ❌ → `ledcWrite()` ✅
- USB CDC On Boot: **Enabled** 필수
- Wi-Fi: **2.4GHz 전용**
- 부팅핀: G0, G9 조심

## Arduino IDE 보드 설정

| 항목 | 값 |
|------|----|
| 보드 | ESP32C3 Dev Module |
| USB CDC On Boot | Enabled |
| CPU Frequency | 160MHz |
| Flash Size | 4MB |
| Upload Speed | 921600 |

## 개발 규칙 요약

- 주석: **한국어**, why 위주 → [01_comments.md](docs/guidelines/01_comments.md)
- 코드 스타일: camelCase 변수/함수, UPPER_SNAKE 상수 → [02_code_style.md](docs/guidelines/02_code_style.md)
- 품질: 매직 넘버 금지, millis() 우선, secrets.h 분리 → [03_code_quality.md](docs/guidelines/03_code_quality.md)
- 검증: 단계별 테스트, 시리얼 디버그 매크로 → [04_verification.md](docs/guidelines/04_verification.md)
- 원칙: 단순함, 논블로킹, 실패 가정 → [05_principles.md](docs/guidelines/05_principles.md)
- 프로젝트 구성: 폴더명, 파일명, config.h → [06_project_structure.md](docs/guidelines/06_project_structure.md)

## Git 커밋 규칙

**작업할 때마다 단 하나를 작업하더라도 매번 git에 커밋한다.**

```
형식: <타입>(<범위>): <설명>
타입: feat / fix / docs / refactor / chore
예시: feat(gpio-blink): LED 깜빡임 기본 구현
```

## 새 프로젝트 체크리스트

1. `projects/기능-부품/` 폴더 생성 (소문자, 하이픈)
2. `기능-부품.ino` 파일 생성 (폴더명과 동일)
3. `config.h` — 핀, 상수, 타이밍
4. `secrets.h` — Wi-Fi/MQTT 인증 (Git 제외)
5. `secrets.h.example` — 형식만 담은 예시 (Git 포함)
6. `README.md` — 연결, 라이브러리, 사용 방법
7. 완료 후 `SKILLS.md` 구현 상태 업데이트

## 참고 링크

- [arduino-esp32](https://github.com/espressif/arduino-esp32)
- [ESP32-C3 Super Mini 가이드](https://randomnerdtutorials.com/getting-started-esp32-c3-super-mini/)
- [ESP32-C3 데이터시트](https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf)
