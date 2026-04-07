/*
 * system/03-boot-reason — 재시작 원인(Boot Reason) 확인
 * ================================================================
 *
 * [핵심 개념 설명]
 *   재시작 원인 (Reset Reason)
 *     - ESP32는 재시작할 때마다 "왜 재시작했는지" 원인을 저장함
 *     - 전원 켬, 소프트 리셋, 워치독, 딥슬립 복귀 등을 구분 가능
 *     - 이 정보로 예상치 못한 크래시 원인을 디버깅할 수 있음
 *
 *   주요 원인 코드
 *     ESP_RST_POWERON  : 전원 처음 인가 (콘센트에 꽂은 경우)
 *     ESP_RST_SW       : ESP.restart() 소프트 리셋
 *     ESP_RST_PANIC    : 코드 충돌 (Guru Meditation Error)
 *     ESP_RST_INT_WDT  : 인터럽트 워치독 타임아웃
 *     ESP_RST_TASK_WDT : 태스크 워치독 타임아웃
 *     ESP_RST_DEEPSLEEP: 딥슬립 후 복귀
 *     ESP_RST_BROWNOUT : 전압 강하 감지 (배터리 부족 등)
 *     ESP_RST_SDIO     : SDIO 리셋
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 *   테스트: RST 버튼 누르기, ESP.restart() 호출, 전원 재인가 등으로
 *           각각 다른 원인 코드를 확인해보세요.
 */

#include "config.h"
#include <esp_system.h>   // esp_reset_reason() 포함

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" ESP32-C3 재시작 원인 확인");
  Serial.println("===================================");

  // 재시작 원인을 열거형(enum)으로 가져옴
  esp_reset_reason_t reason = esp_reset_reason();

  Serial.print("재시작 원인 코드: ");
  Serial.println((int)reason);

  Serial.print("원인 설명       : ");
  printResetReason(reason);

  Serial.println("===================================");
  Serial.println("setup() 완료");
}

void loop() {
  // 재시작 원인은 setup()에서 한 번만 확인하면 충분
  delay(1000);
}

// ---- 재시작 원인을 한국어로 출력하는 헬퍼 함수 ----
void printResetReason(esp_reset_reason_t reason) {
  switch (reason) {
    case ESP_RST_UNKNOWN:
      Serial.println("알 수 없음 (디버그 정보 불충분)");
      break;
    case ESP_RST_POWERON:
      Serial.println("전원 공급 (처음 켰거나 전원 재인가)");
      break;
    case ESP_RST_EXT:
      Serial.println("외부 핀 리셋 (RST 핀에 신호 인가)");
      break;
    case ESP_RST_SW:
      Serial.println("소프트 리셋 (ESP.restart() 또는 esp_restart() 호출)");
      break;
    case ESP_RST_PANIC:
      Serial.println("패닉 크래시 (코드 오류 — Guru Meditation Error)");
      break;
    case ESP_RST_INT_WDT:
      Serial.println("인터럽트 워치독 타임아웃 (인터럽트가 너무 오래 실행됨)");
      break;
    case ESP_RST_TASK_WDT:
      Serial.println("태스크 워치독 타임아웃 (loop() 또는 태스크가 너무 오래 걸림)");
      break;
    case ESP_RST_WDT:
      Serial.println("기타 워치독 타임아웃");
      break;
    case ESP_RST_DEEPSLEEP:
      Serial.println("딥슬립 복귀 (esp_deep_sleep() 후 타이머/외부 신호로 깨어남)");
      break;
    case ESP_RST_BROWNOUT:
      Serial.println("브라운아웃 (전압 강하 감지 — 배터리 부족 또는 전원 불안정)");
      break;
    case ESP_RST_SDIO:
      Serial.println("SDIO 리셋");
      break;
    default:
      Serial.print("정의되지 않은 코드: ");
      Serial.println((int)reason);
      break;
  }
}
