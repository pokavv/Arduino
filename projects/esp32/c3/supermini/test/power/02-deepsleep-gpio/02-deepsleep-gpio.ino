/*
 * Power 02 — 딥슬립 GPIO 웨이크업 (버튼으로 깨우기)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   GPIO 웨이크업 (EXT0)
 *     특정 핀의 전압 변화를 감지해 딥슬립에서 깨어나는 방식.
 *     타이머 웨이크업과 달리 "원할 때" 깨울 수 있다.
 *     버튼, PIR 센서, 리드 스위치 등과 함께 사용.
 *
 *   EXT0 vs EXT1
 *     EXT0: 핀 1개만 감지. 고레벨(1) 또는 저레벨(0)에서 깨어남.
 *     EXT1: 핀 여러 개 감지. 어느 핀이든 조건 만족 시 깨어남.
 *     이 예제는 EXT0 사용 (핀 1개).
 *
 *   esp_sleep_enable_ext0_wakeup(핀번호, 레벨)
 *     레벨 0 = LOW일 때 깨어남 (버튼 눌림 = GND 연결)
 *     레벨 1 = HIGH일 때 깨어남
 *
 *   BOOT 버튼 (G9)
 *     ESP32-C3 Super Mini에 내장된 버튼.
 *     기본으로 풀업 저항이 연결 → 평소 HIGH, 누르면 LOW.
 *     플래시 업로드 모드 진입 버튼이지만 GPIO로도 사용 가능.
 *
 * [라이브러리]
 *   esp_sleep.h — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드만으로 테스트 가능
 *   (G9 BOOT 버튼이 내장되어 있음)
 *
 * [연결 방법]
 *   없음 — BOOT 버튼(G9) 사용, 별도 연결 불필요
 *   외부 버튼 사용 시:
 *   [G9]──[버튼]──[GND]
 *   (G9 내부 풀업 사용, 평소 HIGH → 누르면 LOW)
 *
 * [테스트 방법]
 *   1. 업로드 후 시리얼 모니터 열기 (115200 baud)
 *   2. "딥슬립 진입..." 메시지 확인
 *   3. BOOT 버튼 (G9) 눌러서 깨우기
 *   4. 부팅 횟수 증가 확인
 * ================================================================
 */

#include <Arduino.h>
#include "config.h"

// 딥슬립 중에도 값이 보존됨
RTC_DATA_ATTR int bootCount = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    delay(300);

    bootCount++;

    Serial.println("\n=== 딥슬립 GPIO 웨이크업 예제 ===");
    Serial.print("부팅 횟수: ");
    Serial.println(bootCount);

    // ── 웨이크업 원인 출력 ──
    esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
    if (cause == ESP_SLEEP_WAKEUP_EXT0) {
        Serial.println("웨이크업 원인: GPIO(버튼) 신호!");
    } else {
        Serial.println("웨이크업 원인: 첫 전원 켜기 또는 리셋");
    }

    // ── 실제 작업 수행 ──
    Serial.println("작업 수행 중...");
    delay(2000);   // 2초 대기 (작업 시뮬레이션)
    Serial.println("작업 완료.");

    // ── GPIO 웨이크업 설정 ──
    // GPIO_NUM_9 = G9 핀 (BOOT 버튼)
    // 두 번째 인자 0 = LOW 신호에서 깨어남 (버튼 누름 = LOW)
    esp_sleep_enable_ext0_wakeup(GPIO_NUM_9, 0);

    Serial.println("BOOT 버튼(G9)을 누르면 깨어납니다.");
    Serial.println("딥슬립 진입...\n");
    Serial.flush();

    esp_deep_sleep_start();
}

void loop() {
    // 딥슬립 예제에서는 실행되지 않음
}
