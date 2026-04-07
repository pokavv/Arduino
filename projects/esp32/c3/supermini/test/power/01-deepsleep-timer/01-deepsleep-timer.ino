/*
 * Power 01 — 딥슬립 타이머 웨이크업
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   딥슬립 (Deep Sleep)
 *     CPU, 대부분의 RAM, 주변장치를 완전히 끄는 초저전력 모드.
 *     소비 전류: 약 5~10μA (일반 동작: 80~240mA)
 *     전력 절감: 약 10,000~20,000배 차이!
 *
 *   딥슬립에서 살아남는 것
 *     RTC (Real-Time Clock) 메모리 — 8KB (RTC_DATA_ATTR로 선언)
 *     RTC 타이머 회로
 *     딥슬립에서는 일반 전역 변수가 초기화됨 (RAM이 꺼지므로)
 *
 *   웨이크업(깨어남) 후 동작
 *     딥슬립에서 깨어나면 ESP32는 처음부터 다시 부팅한다.
 *     즉, setup() 부터 다시 실행됨. loop()는 딥슬립 전에 도달 안 함.
 *
 *   RTC_DATA_ATTR
 *     이 키워드로 선언한 변수는 딥슬립 동안 RTC 메모리에 보존.
 *     예: RTC_DATA_ATTR int bootCount = 0;
 *
 *   타이머 웨이크업
 *     지정한 시간 후 자동으로 깨어남.
 *     esp_sleep_enable_timer_wakeup(마이크로초 단위)
 *     1초 = 1,000,000 마이크로초 (ULL = unsigned long long 타입)
 *
 * [라이브러리]
 *   esp_sleep.h — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB만 연결
 *
 * [전력 측정 팁]
 *   USB 전원 대신 배터리 + 전류계로 측정하면
 *   슬립 중 실제 소비 전류 확인 가능
 * ================================================================
 */

#include <Arduino.h>
#include "config.h"

// RTC_DATA_ATTR: 딥슬립 중에도 보존되는 변수
// 일반 전역변수는 딥슬립 후 초기화됨 — 이 선언이 핵심!
RTC_DATA_ATTR int bootCount = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    delay(300);   // 시리얼 안정화

    // 부팅 횟수 증가
    bootCount++;

    Serial.println("\n=== 딥슬립 타이머 예제 ===");
    Serial.print("부팅 횟수: ");
    Serial.println(bootCount);

    // ── 작업 수행 ──
    // 실제 장치에서는 여기서 센서 읽기, 데이터 전송 등을 한다.
    Serial.print("작업 실행 중... (millis=");
    Serial.print(millis());
    Serial.println("ms)");
    Serial.println("예: 센서 읽기, 데이터 전송 완료");

    // ── 딥슬립 설정 ──
    // 마이크로초 단위: SLEEP_DURATION_SEC * 1,000,000
    // ULL = Unsigned Long Long (64비트 정수, 큰 수 계산에 필요)
    uint64_t sleepMicros = (uint64_t)SLEEP_DURATION_SEC * 1000000ULL;
    esp_sleep_enable_timer_wakeup(sleepMicros);

    Serial.print(SLEEP_DURATION_SEC);
    Serial.println("초 후 타이머로 깨어납니다.");
    Serial.println("딥슬립 진입...\n");

    // ── 시리얼 완전히 출력될 때까지 대기 ──
    Serial.flush();

    // ── 딥슬립 시작 ──
    // 이 줄 이후로는 실행되지 않음. 깨어나면 setup()부터 재시작.
    esp_deep_sleep_start();
}

void loop() {
    // 딥슬립 예제에서는 loop()가 실행되지 않음
    // esp_deep_sleep_start() 후 setup()이 다시 실행됨
}
