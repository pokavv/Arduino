# Arduino IDE 환경 설정

## ESP32 보드 패키지 설치

1. **파일 → 환경설정** 열기
2. "추가 보드 관리자 URL"에 입력:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. **도구 → 보드 → 보드 관리자** 에서 `esp32` 검색
4. **Espressif Systems의 esp32** 설치

---

## 보드 설정값

| 항목 | 설정값 |
|------|--------|
| 보드 | `ESP32C3 Dev Module` |
| USB CDC On Boot | `Enabled` ← 반드시 설정 |
| CPU Frequency | `160MHz` |
| Flash Size | `4MB` |
| Upload Speed | `921600` |
| 포트 | 해당 COM 포트 선택 |

> `USB CDC On Boot: Enabled` 안 하면 시리얼 모니터가 동작하지 않습니다.

---

## 드라이버

대부분 자동 인식되지만 안 될 경우 **CH340 드라이버** 설치.

---

## 업로드 안 될 때 수동 부팅 방법

1. **G9 버튼(BOOT)** 을 누른 채로
2. **리셋 버튼** 누르고 놓기
3. G9 버튼 놓기
4. Arduino IDE에서 업로드
