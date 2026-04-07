/*
 * Power 05 — 라이트슬립 (Light Sleep)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   라이트슬립 vs 딥슬립 비교
 *   ┌───────────────┬──────────────────────┬───────────────────────┐
 *   │               │ 라이트슬립           │ 딥슬립                │
 *   ├───────────────┼──────────────────────┼───────────────────────┤
 *   │ 소비 전류     │ 약 0.8~1.5mA         │ 약 5~10μA             │
 *   │ RAM 보존      │ O (유지)             │ X (RTC만 유지)        │
 *   │ CPU 상태      │ 중단 (레지스터 유지) │ 완전 정지             │
 *   │ 웨이크업 속도 │ 매우 빠름 (수ms)     │ 느림 (부팅 포함)      │
 *   │ 코드 재시작   │ X (이어서 실행)      │ O (setup()부터 재시작)│
 *   └───────────────┴──────────────────────┴───────────────────────┘
 *
 *   라이트슬립의 핵심 장점
 *     깨어난 후 esp_light_sleep_start() 다음 줄부터 이어서 실행!
 *     전역 변수, 스택 상태가 모두 유지됨.
 *     loop() 안에서 반복 슬립 가능.
 *
 *   언제 라이트슬립을 쓰나?
 *     - 응답 속도가 중요한 경우 (딥슬립은 재부팅 시간 필요)
 *     - 슬립 간격이 짧은 경우 (수초 이내)
 *     - loop() 흐름을 유지해야 하는 경우
 *     - Wi-Fi 연결 유지가 필요한 경우 (모뎀슬립과 조합)
 *
 * [라이브러리]
 *   esp_sleep.h — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB만 연결
 * ================================================================
 */

#include <Arduino.h>
#include "config.h"

int cycleCount = 0;   // 일반 전역 변수 — 라이트슬립 후에도 유지됨

void setup() {
    Serial.begin(BAUD_RATE);
    delay(300);
    Serial.println("\n=== 라이트슬립 예제 ===");
    Serial.println("라이트슬립: RAM 유지, 빠른 웨이크업");
    Serial.println("딥슬립과 달리 loop()가 이어서 실행됩니다.\n");

    // ── 라이트슬립 웨이크업 소스 설정 ──
    // 마이크로초 단위
    uint64_t sleepMicros = (uint64_t)SLEEP_DURATION_MS * 1000ULL;
    esp_sleep_enable_timer_wakeup(sleepMicros);

    Serial.print("슬립 주기: ");
    Serial.print(SLEEP_DURATION_MS);
    Serial.println("ms");
}

void loop() {
    cycleCount++;

    // ── 깨어난 후 즉시 실행 ──
    Serial.print("[사이클 ");
    Serial.print(cycleCount);
    Serial.print("] 깨어남. millis=");
    Serial.println(millis());

    // ── 작업 수행 ──
    Serial.println("  → 작업 수행 중...");

    // ── 시리얼 출력 완료 후 슬립 진입 ──
    // 라이트슬립 중 Serial 출력이 끊길 수 있으므로 flush 필요
    Serial.flush();

    // ── 라이트슬립 시작 ──
    // esp_light_sleep_start() 는 지정한 시간 후 자동으로 반환됨
    // 깨어난 후 다음 줄부터 이어서 실행
    esp_light_sleep_start();

    // ── 슬립에서 깨어난 직후 ──
    // cycleCount 등 변수 값이 유지되어 있음
    Serial.print("[사이클 ");
    Serial.print(cycleCount);
    Serial.print("] 깨어남 완료. 원인: ");

    esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
    if (cause == ESP_SLEEP_WAKEUP_TIMER) {
        Serial.println("타이머");
    } else {
        Serial.println("기타");
    }
}
