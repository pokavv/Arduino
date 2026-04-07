/*
 * 4-03 micros() 고정밀 타이밍
 * ================================================================
 *
 * [핵심 개념 설명]
 *   millis()는 밀리초(1/1000초) 단위입니다.
 *   micros()는 마이크로초(1/1,000,000초) 단위로, millis()보다 1000배 정밀합니다.
 *
 *   예를 들어 초음파 센서의 에코 펄스 길이나,
 *   적외선 신호 타이밍처럼 수십~수백 마이크로초 수준의
 *   정밀한 시간 측정이 필요할 때 micros()를 사용합니다.
 *
 *   micros()도 millis()처럼 오버플로우가 생기지만,
 *   약 71.6분 후 0으로 리셋됩니다.
 *   subtraction 패턴 (now - last >= interval) 은 동일하게 안전합니다.
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 1개
 *   - USB 케이블
 *
 * [연결 방법]
 *   연결 불필요 — 시리얼 모니터만 사용합니다.
 */

#include "config.h"

// 마지막 측정 시각 (millis 기반으로 측정 주기를 관리)
unsigned long lastMeasureMs = 0;

// 측정 횟수
unsigned long measureCount = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);

  Serial.println("=== micros() 고정밀 타이밍 시작 ===");
  Serial.print("millis()  정밀도: 1ms = 0.001초\n");
  Serial.print("micros()  정밀도: 1us = 0.000001초 (1000배 정밀)\n\n");
}

void loop() {
  unsigned long nowMs = millis();

  // MEASURE_INTERVAL마다 한 번씩 측정합니다
  if (nowMs - lastMeasureMs >= MEASURE_INTERVAL) {
    lastMeasureMs = nowMs;
    measureCount++;

    // 측정 시작 시각 기록 (마이크로초)
    unsigned long startUs = micros();

    // 측정할 더미 작업: 빈 루프 1000번 실행
    // 실제로는 이 자리에 시간을 측정하고 싶은 코드를 넣습니다
    volatile int dummy = 0;  // volatile: 컴파일러가 루프를 최적화해서 없애지 못하게 합니다
    for (int i = 0; i < TEST_LOOP_COUNT; i++) {
      dummy++;
    }

    // 측정 종료 시각 기록
    unsigned long endUs = micros();

    // 경과 마이크로초 계산
    unsigned long elapsedUs = endUs - startUs;

    Serial.print("[측정 #");
    Serial.print(measureCount);
    Serial.print("] 루프 ");
    Serial.print(TEST_LOOP_COUNT);
    Serial.print("회 실행 시간: ");
    Serial.print(elapsedUs);
    Serial.print(" us (");
    Serial.print(elapsedUs / 1000.0, 3);  // 소수점 3자리까지 밀리초로 변환
    Serial.println(" ms)");
  }
}
