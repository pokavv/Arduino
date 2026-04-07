/*
 * 4-05 millis() 오버플로우 안전 처리
 * ================================================================
 *
 * [핵심 개념 설명]
 *   millis()는 unsigned long(32비트) 타입으로 값을 반환합니다.
 *   최댓값은 4,294,967,295 (약 4294967초 = 약 49.7일)입니다.
 *   그 이상이 되면 값이 0으로 리셋됩니다 — 이것이 '오버플로우'입니다.
 *
 *   만약 잘못 작성하면:
 *     if (millis() >= lastMs + interval)  ← 오버플로우 시 lastMs + interval 이
 *                                            0 근처로 내려가면 조건이 즉시 참이 됩니다.
 *
 *   올바른 패턴:
 *     if (millis() - lastMs >= interval)
 *
 *   왜 안전한가?
 *   unsigned long 의 뺄셈은 언더플로우가 일어나도 올바른 결과를 냅니다.
 *   예: now=100, last=4294967295(최댓값), interval=200
 *       100 - 4294967295 = 101 (unsigned 래핑 결과) → 200보다 작으므로 아직 안 됨. 정확!
 *
 *   실제로 49.7일은 매우 긴 시간이지만,
 *   항상 안전한 패턴을 습관화하는 것이 중요합니다.
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 1개
 *   - USB 케이블
 *
 * [연결 방법]
 *   연결 불필요 — 시리얼 모니터만 사용합니다.
 */

#include "config.h"

// 실제 millis() 타이머
unsigned long lastRealMs = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);

  Serial.println("=== millis() 오버플로우 안전 처리 시연 ===\n");

  // ---- 오버플로우 시뮬레이션 ----
  // 실제로 49.7일을 기다릴 수 없으므로, 숫자를 직접 설정해서 테스트합니다

  const unsigned long MAX_ULONG = 4294967295UL;  // unsigned long 최댓값
  const unsigned long testInterval = 1000UL;       // 1000ms 인터벌

  Serial.println("[시뮬레이션] 오버플로우 직전 상황 테스트");
  Serial.println("------------------------------------------");

  // 케이스 1: 정상 상황 — now가 last보다 크다
  {
    unsigned long last = 5000UL;
    unsigned long now  = 6100UL;
    unsigned long diff = now - last;  // 1100 — 정상
    Serial.print("케이스1 (정상)  : now=6100, last=5000, diff=");
    Serial.print(diff);
    Serial.print(", 인터벌 도달=");
    Serial.println(diff >= testInterval ? "예" : "아니오");
  }

  // 케이스 2: 오버플로우 직후 — now가 last보다 작다
  {
    unsigned long last = MAX_ULONG - 500UL;  // 오버플로우 직전에 기록됨
    unsigned long now  = 600UL;               // 오버플로우 후 600ms 경과
    // 실제 경과: 500 + 600 = 1100ms
    unsigned long diff = now - last;  // unsigned 뺄셈 래핑: 600 - 4294966795 = 1101 (정확!)
    Serial.print("케이스2 (오버플로): now=600, last=MAX-500, diff=");
    Serial.print(diff);
    Serial.print(", 인터벌 도달=");
    Serial.println(diff >= testInterval ? "예" : "아니오");
  }

  // 케이스 3: 잘못된 패턴 비교 (now >= last + interval)
  {
    unsigned long last = MAX_ULONG - 500UL;
    unsigned long now  = 600UL;
    // last + interval 이 오버플로우하여 499UL이 됨
    // now(600) >= 499 → true 이지만, 실제 경과는 1100ms
    // 이 경우는 맞게 나오지만, last + interval 자체가 이미 오버플로우한 값입니다
    // 더 복잡한 상황에서 버그가 발생할 수 있으므로 사용하지 마세요
    Serial.println("\n[주의] (now >= last + interval) 패턴은 사용하지 마세요.");
    Serial.println("       subtraction 패턴 (now - last >= interval) 이 항상 안전합니다.");
  }

  Serial.println("\n------------------------------------------");
  Serial.println("이제 실제 millis()로 1초마다 출력합니다.");
  Serial.println("subtraction 패턴을 사용하고 있습니다.\n");
}

void loop() {
  unsigned long nowMs = millis();

  // 안전한 패턴: subtraction
  if (nowMs - lastRealMs >= TEST_INTERVAL) {
    lastRealMs = nowMs;
    Serial.print("[실제 타이머] ");
    Serial.print(nowMs / 1000);
    Serial.println("초 경과");
  }
}
