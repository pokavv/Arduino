/*
 * 4-01 millis() 논블로킹 타이머
 * ================================================================
 *
 * [핵심 개념 설명]
 *   delay()는 마이크로컨트롤러를 '멈춰' 버립니다.
 *   delay(1000) 동안에는 버튼 입력도 못 읽고, 다른 작업도 못 합니다.
 *
 *   millis()는 보드가 켜진 이후 경과한 시간(밀리초)을 알려줍니다.
 *   "마지막으로 한 시점"을 기록해 두고, 지금과의 차이가
 *   원하는 간격 이상이면 작업을 실행하는 방식입니다.
 *   그 사이에 다른 코드가 자유롭게 실행될 수 있습니다 — '논블로킹'입니다.
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 1개
 *   - USB 케이블 (시리얼 모니터 연결용)
 *
 * [연결 방법]
 *   연결 필요 없음 — 시리얼 모니터만 사용합니다.
 */

#include "config.h"

// 마지막으로 출력한 시각을 기억하는 변수
// unsigned long 을 쓰는 이유: millis()의 반환 타입과 같아야 오버플로우 계산이 안전합니다
unsigned long lastPrintMs = 0;

// 몇 번째 출력인지 세는 카운터
unsigned long counter = 0;

void setup() {
  // 시리얼 모니터 시작 — PC와 데이터를 주고받을 수 있게 됩니다
  Serial.begin(BAUD_RATE);

  // 보드가 완전히 준비될 때까지 잠깐 기다립니다 (USB CDC 안정화)
  delay(500);

  Serial.println("=== millis() 논블로킹 타이머 시작 ===");
  Serial.println("delay() 없이 주기적으로 메시지를 출력합니다.");
}

void loop() {
  // 현재 시각을 읽어 둡니다
  unsigned long nowMs = millis();

  // 마지막 출력 이후 PRINT_INTERVAL 이상 지났으면 출력합니다
  // 중요: (nowMs - lastPrintMs) 방식은 오버플로우가 일어나도 올바르게 동작합니다
  if (nowMs - lastPrintMs >= PRINT_INTERVAL) {
    lastPrintMs = nowMs;  // 다음 비교를 위해 현재 시각을 저장합니다
    counter++;

    Serial.print("[");
    Serial.print(nowMs / 1000);  // 초 단위 경과 시간
    Serial.print("초] 카운터: ");
    Serial.println(counter);
  }

  // 여기 아래에 다른 작업을 추가해도 타이머가 영향을 받지 않습니다
  // delay()가 없으므로 loop()가 매우 빠르게 반복됩니다
}
