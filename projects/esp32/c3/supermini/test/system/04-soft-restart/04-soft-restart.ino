/*
 * system/04-soft-restart — 소프트 재시작(Soft Restart) 예제
 * ================================================================
 *
 * [핵심 개념 설명]
 *   소프트 리셋 (Soft Reset) vs 하드 리셋 (Hard Reset)
 *
 *   소프트 리셋 (ESP.restart())
 *     - 코드로 MCU를 재시작하는 방법
 *     - 전원은 유지되며 레지스터와 RAM을 초기화하고 setup()부터 다시 실행
 *     - RTC 메모리(딥슬립 변수)는 유지될 수 있음
 *     - 원격에서 재시작 명령 전송, WDT 대신 주기적 재시작 등에 사용
 *
 *   하드 리셋 (RST 버튼 누르기)
 *     - 물리적으로 RST 핀에 LOW 신호를 주는 방법
 *     - 모든 RAM, 레지스터 완전 초기화
 *
 *   전원 차단 후 재연결 (Power-On Reset)
 *     - 전원 자체를 끊었다가 다시 연결
 *     - 가장 완전한 초기화 (외부 부품도 리셋됨)
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"

// 재시작 횟수를 RTC 메모리에 저장 — 소프트 리셋 후에도 값이 유지됨
// RTC_DATA_ATTR: ESP32의 슬로우 RTC 메모리에 저장하는 특별한 속성
RTC_DATA_ATTR int bootCount = 0;  // 부팅 횟수 카운터

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  bootCount++;  // 부팅할 때마다 1 증가

  Serial.println("===================================");
  Serial.println(" ESP32-C3 소프트 재시작 예제");
  Serial.println("===================================");
  Serial.print("부팅 횟수: ");
  Serial.println(bootCount);
  Serial.println("(소프트 리셋 시 이 값이 유지됩니다)");
  Serial.println("(전원을 껐다 켜면 0으로 초기화됩니다)");
  Serial.println();

  // ---- 카운트다운 후 재시작 ----
  Serial.println("5초 후 소프트 재시작합니다...");
  countdown(RESTART_DELAY);

  Serial.println("→ ESP.restart() 호출 — 재시작!");
  Serial.flush();  // 시리얼 버퍼를 모두 전송하고 나서 재시작
  ESP.restart();   // 소프트 리셋 실행 — 이 줄 이후 코드는 실행되지 않음
}

void loop() {
  // setup()에서 restart()가 호출되므로 loop()는 실행되지 않음
  delay(1000);
}

// ---- 카운트다운 함수 ----
// totalMs: 카운트다운 총 시간 (ms)
void countdown(unsigned long totalMs) {
  int seconds = totalMs / 1000;
  for (int i = seconds; i > 0; i--) {
    Serial.print(i);
    Serial.println("초...");
    delay(1000);  // 1초 대기
  }
}
