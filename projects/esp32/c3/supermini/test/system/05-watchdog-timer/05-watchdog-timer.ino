/*
 * system/05-watchdog-timer — 워치독 타이머(WDT) 예제
 * ================================================================
 *
 * [핵심 개념 설명]
 *   워치독 타이머 (Watchdog Timer, WDT)
 *     - "감시견"처럼 코드가 정상 동작 중인지 감시하는 하드웨어 타이머
 *     - 동작 원리:
 *         1) 타이머 시작 → 카운트다운 시작
 *         2) 코드에서 주기적으로 "나는 살아있어!" 신호(reset) 전송
 *         3) 신호가 타임아웃 전에 도착하면 카운트다운 재시작
 *         4) 신호가 안 오면 → MCU 자동 재시작
 *     - 무한 루프나 코드 멈춤 시 자동 복구에 사용
 *
 *   이 예제의 시뮬레이션
 *     - 처음 10초간: 정상 동작 (매초 WDT reset 호출)
 *     - 10초 이후: 의도적으로 reset 중단 → WDT_TIMEOUT(5초) 후 재시작
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"
#include <esp_task_wdt.h>   // esp_task_wdt_*() 함수 포함

// ---- 시뮬레이션 설정 ----
#define NORMAL_DURATION_MS  10000  // 정상 동작 시간 (10초)
#define RESET_INTERVAL_MS    1000  // WDT 리셋 호출 주기 (1초)

unsigned long startTime    = 0;    // 시작 시각
bool wdtFreezeStarted      = false; // WDT 중단 시뮬레이션 시작 여부

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" ESP32-C3 워치독 타이머(WDT) 예제");
  Serial.println("===================================");
  Serial.print("WDT 타임아웃 : ");
  Serial.print(WDT_TIMEOUT);
  Serial.println("초");
  Serial.println();

  // ---- WDT 초기화 ----
  // 첫 번째 인자: 타임아웃(초), 두 번째 인자: 타임아웃 시 패닉(재시작) 여부
  esp_task_wdt_config_t wdtConfig = {
    .timeout_ms = WDT_TIMEOUT * 1000,  // ms 단위로 설정
    .idle_core_mask = 0,               // idle 태스크 감시 안 함
    .trigger_panic = true              // 타임아웃 시 패닉(재시작) 발생
  };
  esp_task_wdt_reconfigure(&wdtConfig);  // WDT 설정

  // 현재 태스크(loop 태스크)를 WDT 감시 대상에 추가
  esp_task_wdt_add(NULL);  // NULL = 현재 태스크

  startTime = millis();

  Serial.println("WDT 활성화 완료");
  Serial.println("→ 처음 10초: 정상 동작 (WDT 주기적 리셋)");
  Serial.print("→ 10초 이후: WDT 리셋 중단 → ");
  Serial.print(WDT_TIMEOUT);
  Serial.println("초 후 자동 재시작");
  Serial.println();
}

void loop() {
  unsigned long elapsed = millis() - startTime;  // 경과 시간 (ms)

  if (elapsed < NORMAL_DURATION_MS) {
    // ---- 정상 동작 구간: WDT 리셋 호출 ----
    esp_task_wdt_reset();  // "나는 살아있다" 신호 전송 — 카운트다운 재시작

    Serial.print("[정상] 경과 시간: ");
    Serial.print(elapsed / 1000);
    Serial.print("초 / WDT 리셋 완료 (타임아웃까지 ");
    Serial.print(WDT_TIMEOUT);
    Serial.println("초)");

    delay(RESET_INTERVAL_MS);  // 1초 대기

  } else {
    // ---- WDT 중단 시뮬레이션 구간 ----
    if (!wdtFreezeStarted) {
      wdtFreezeStarted = true;
      Serial.println();
      Serial.println("[경고] WDT 리셋 중단 시뮬레이션 시작!");
      Serial.println("[경고] 코드가 멈춘 상황을 흉내냅니다...");
      Serial.println("[경고] WDT 타임아웃 후 자동 재시작됩니다.");
      Serial.flush();
    }

    // WDT 리셋을 호출하지 않고 그냥 대기
    // delay() 내부에서도 loop 태스크 WDT는 리셋되지 않음
    delay(1000);  // 멈춘 척 대기
  }
}
