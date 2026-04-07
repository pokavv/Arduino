/*
 * Power 04 — 딥슬립 + NVS 데이터 보존
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   딥슬립과 데이터 보존 방법 비교
 *   ┌──────────────────┬──────────────┬──────────────────────────┐
 *   │ 방법             │ 크기         │ 특징                     │
 *   ├──────────────────┼──────────────┼──────────────────────────┤
 *   │ RTC_DATA_ATTR    │ 약 8KB       │ 빠름, 딥슬립만 유지      │
 *   │                  │              │ 전원 완전 차단 시 사라짐 │
 *   │ NVS Preferences  │ 수 KB~수십KB │ 느림, 전원 꺼도 유지     │
 *   │                  │              │ 쓰기 횟수 제한 있음      │
 *   └──────────────────┴──────────────┴──────────────────────────┘
 *
 *   RTC_DATA_ATTR + NVS 함께 사용하는 패턴
 *     - 임시 카운터, 빠른 접근 데이터 → RTC_DATA_ATTR
 *     - 중요 설정, 배터리 교체 후도 유지해야 하는 데이터 → NVS
 *
 *   이 예제에서 하는 것
 *     딥슬립마다 누적 카운터를 NVS에 저장.
 *     배터리가 완전히 방전되어도 카운터 값이 보존됨.
 *
 * [라이브러리]
 *   Preferences — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB만 연결
 * ================================================================
 */

#include <Arduino.h>
#include <Preferences.h>
#include "config.h"

Preferences prefs;

// RTC 메모리: 딥슬립 간 빠른 임시 데이터
RTC_DATA_ATTR int rtcCycleCount = 0;    // 전원 유지 중 사이클 수

void setup() {
    Serial.begin(BAUD_RATE);
    delay(300);
    Serial.println("\n=== 딥슬립 + NVS 데이터 보존 ===");

    // ── NVS에서 누적 데이터 읽기 ──
    prefs.begin(NVS_NAMESPACE, false);
    int totalCount  = prefs.getInt("totalCount",  0);   // 전체 누적 횟수
    float totalSecs = prefs.getFloat("totalSecs", 0.0f); // 총 슬립 시간 (초)

    // ── RTC 카운터 증가 ──
    rtcCycleCount++;

    Serial.println("─── 카운터 현황 ───");
    Serial.print("RTC 사이클 카운터  : ");
    Serial.print(rtcCycleCount);
    Serial.println(" (전원 유지 중만 보존)");
    Serial.print("NVS 누적 총 횟수   : ");
    Serial.println(totalCount);
    Serial.print("NVS 누적 총 슬립   : ");
    Serial.print(totalSecs, 1);
    Serial.println(" 초");
    Serial.println("──────────────────");

    // ── 센서 읽기 시뮬레이션 ──
    int fakeTemp = 20 + (esp_random() % 11);  // 20~30 랜덤 온도
    Serial.print("가상 온도 측정: ");
    Serial.print(fakeTemp);
    Serial.println("°C");

    // ── NVS에 누적 카운터 업데이트 ──
    totalCount++;
    totalSecs += SLEEP_DURATION_SEC;
    prefs.putInt("totalCount",   totalCount);
    prefs.putFloat("totalSecs",  totalSecs);
    prefs.putInt("lastTemp",     fakeTemp);   // 마지막 측정값도 보존
    prefs.end();

    Serial.print("NVS 저장 완료. 총 측정 횟수: ");
    Serial.println(totalCount);

    // ── 딥슬립 설정 ──
    esp_sleep_enable_timer_wakeup((uint64_t)SLEEP_DURATION_SEC * 1000000ULL);

    Serial.print(SLEEP_DURATION_SEC);
    Serial.println("초 후 깨어납니다.");
    Serial.println("딥슬립 진입...\n");
    Serial.flush();

    esp_deep_sleep_start();
}

void loop() {
    // 딥슬립 예제에서는 실행되지 않음
}
