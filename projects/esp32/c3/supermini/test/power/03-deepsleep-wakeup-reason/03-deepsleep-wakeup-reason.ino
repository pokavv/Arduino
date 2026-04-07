/*
 * Power 03 — 딥슬립 웨이크업 원인 분석
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   웨이크업 원인 (Wakeup Cause)
 *     딥슬립에서 깨어난 이유를 코드로 확인할 수 있다.
 *     원인에 따라 다른 동작을 수행하는 분기 처리에 활용.
 *
 *   esp_sleep_get_wakeup_cause() 반환값
 *   ┌────────────────────────────────┬─────────────────────────────┐
 *   │ 상수                           │ 의미                        │
 *   ├────────────────────────────────┼─────────────────────────────┤
 *   │ ESP_SLEEP_WAKEUP_UNDEFINED     │ 소프트웨어 리셋 또는 첫 전원│
 *   │ ESP_SLEEP_WAKEUP_TIMER         │ RTC 타이머                  │
 *   │ ESP_SLEEP_WAKEUP_EXT0          │ GPIO 핀 레벨 변화 (1개 핀)  │
 *   │ ESP_SLEEP_WAKEUP_EXT1          │ GPIO 핀 레벨 변화 (여러 핀) │
 *   │ ESP_SLEEP_WAKEUP_TOUCHPAD      │ 터치 패드                   │
 *   │ ESP_SLEEP_WAKEUP_ULP           │ ULP 코프로세서              │
 *   └────────────────────────────────┴─────────────────────────────┘
 *
 *   이 예제에서는 타이머 + GPIO 두 가지 웨이크업을 동시에 설정.
 *   먼저 조건이 만족되는 쪽에서 깨어난다.
 *
 * [라이브러리]
 *   esp_sleep.h — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — BOOT 버튼(G9) 내장
 *
 * [테스트 방법]
 *   1. 업로드 후 시리얼 모니터 열기
 *   2. 딥슬립 진입 확인
 *   3. 버튼 눌러서 깨우기 → "GPIO" 원인 출력
 *   4. 아무것도 안 하면 30초 후 자동 깨어남 → "타이머" 원인 출력
 * ================================================================
 */

#include <Arduino.h>
#include "config.h"

RTC_DATA_ATTR int bootCount = 0;

// ─── 웨이크업 원인을 문자열로 변환 ───────────────
String getWakeupReasonStr(esp_sleep_wakeup_cause_t cause) {
    switch (cause) {
        case ESP_SLEEP_WAKEUP_UNDEFINED:
            return "정의되지 않음 (첫 전원 또는 리셋)";
        case ESP_SLEEP_WAKEUP_TIMER:
            return "RTC 타이머";
        case ESP_SLEEP_WAKEUP_EXT0:
            return "GPIO EXT0 (단일 핀)";
        case ESP_SLEEP_WAKEUP_EXT1:
            return "GPIO EXT1 (다중 핀)";
        case ESP_SLEEP_WAKEUP_TOUCHPAD:
            return "터치 패드";
        case ESP_SLEEP_WAKEUP_ULP:
            return "ULP 코프로세서";
        default:
            return "알 수 없음 (코드: " + String((int)cause) + ")";
    }
}

// ─── 원인별 처리 ─────────────────────────────────
void handleWakeupReason(esp_sleep_wakeup_cause_t cause) {
    switch (cause) {
        case ESP_SLEEP_WAKEUP_TIMER:
            Serial.println("→ [타이머] 정기 작업 실행");
            Serial.println("   예: 센서 데이터 수집 및 전송");
            break;

        case ESP_SLEEP_WAKEUP_EXT0:
            Serial.println("→ [버튼] 사용자 인터랙션 처리");
            Serial.println("   예: 디스플레이 켜기, 즉각 응답");
            break;

        case ESP_SLEEP_WAKEUP_UNDEFINED:
            Serial.println("→ [부팅] 초기화 작업 실행");
            Serial.println("   예: 설정 로드, 연결 테스트");
            break;

        default:
            Serial.println("→ [기타] 일반 처리");
            break;
    }
}

void setup() {
    Serial.begin(BAUD_RATE);
    delay(300);

    bootCount++;

    Serial.println("\n=== 딥슬립 웨이크업 원인 분석 ===");
    Serial.print("부팅 횟수: ");
    Serial.println(bootCount);

    // ── 웨이크업 원인 확인 ──
    esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
    Serial.print("웨이크업 원인: ");
    Serial.println(getWakeupReasonStr(cause));

    // ── 원인별 처리 ──
    handleWakeupReason(cause);

    // ── 작업 수행 ──
    Serial.println("\n공통 작업 실행...");
    delay(1000);
    Serial.println("작업 완료.");

    // ── 딥슬립 설정 (타이머 + GPIO 동시) ──
    // 두 조건 중 먼저 만족되는 쪽에서 깨어남
    esp_sleep_enable_timer_wakeup((uint64_t)SLEEP_DURATION_SEC * 1000000ULL);
    esp_sleep_enable_ext0_wakeup(GPIO_NUM_9, 0);  // BOOT 버튼 LOW에서 깨어남

    Serial.print(SLEEP_DURATION_SEC);
    Serial.println("초 타이머 또는 BOOT 버튼(G9)으로 깨어납니다.");
    Serial.println("딥슬립 진입...\n");
    Serial.flush();

    esp_deep_sleep_start();
}

void loop() {
    // 딥슬립 예제에서는 실행되지 않음
}
