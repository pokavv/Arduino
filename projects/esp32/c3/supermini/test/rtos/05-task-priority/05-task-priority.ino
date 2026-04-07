/*
 * rtos/05-task-priority — FreeRTOS 태스크 우선순위 제어
 * ================================================================
 *
 * [핵심 개념 설명]
 *   태스크 우선순위 (Task Priority)
 *     - FreeRTOS에서 각 태스크는 0~(configMAX_PRIORITIES-1) 우선순위를 가짐
 *     - 숫자가 높을수록 우선순위가 높음
 *     - 높은 우선순위 태스크가 실행 가능한 상태면 낮은 태스크는 기다림
 *
 *   선점형 스케줄링 (Preemptive Scheduling)
 *     - 더 높은 우선순위 태스크가 준비되면 현재 실행 중인 태스크를 즉시 중단
 *     - ESP32의 FreeRTOS는 기본적으로 선점형 방식
 *
 *   동적 우선순위 변경
 *     - vTaskPrioritySet(): 런타임에 우선순위 변경 가능
 *     - uxTaskPriorityGet(): 현재 우선순위 읽기
 *
 *   이 예제: 저우선순위 태스크가 5초 후 고우선순위로 승격
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"

// ---- 태스크 핸들 (나중에 우선순위 변경에 사용) ----
TaskHandle_t taskLowHandle  = NULL;
TaskHandle_t taskHighHandle = NULL;

// ---- 고우선순위 태스크 ----
void taskHigh(void* pvParameters) {
  while (true) {
    UBaseType_t currentPrio = uxTaskPriorityGet(NULL);  // NULL = 자신의 우선순위
    Serial.print("[고우선순위 태스크] 실행 중 (우선순위: ");
    Serial.print(currentPrio);
    Serial.println(")");
    vTaskDelay(pdMS_TO_TICKS(500));  // 500ms 대기
  }
}

// ---- 저우선순위 태스크 ----
void taskLow(void* pvParameters) {
  unsigned long startTime = millis();
  bool promoted = false;

  while (true) {
    UBaseType_t currentPrio = uxTaskPriorityGet(NULL);
    Serial.print("  [저우선순위 태스크] 실행 중 (우선순위: ");
    Serial.print(currentPrio);
    Serial.println(")");

    // 5초 후 우선순위를 고우선순위 태스크보다 더 높게 승격
    if (!promoted && (millis() - startTime > 5000)) {
      promoted = true;
      UBaseType_t newPrio = PRIORITY_HIGH + 1;  // 고우선순위보다 1 높게

      Serial.println();
      Serial.println(">>> 5초 경과! 저우선순위 태스크 우선순위 승격!");
      Serial.print(">>> 우선순위 변경: ");
      Serial.print(PRIORITY_LOW);
      Serial.print(" → ");
      Serial.println(newPrio);
      Serial.println();

      // 자신의 우선순위 변경 (NULL = 현재 태스크)
      vTaskPrioritySet(NULL, newPrio);
    }

    vTaskDelay(pdMS_TO_TICKS(700));  // 700ms 대기
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" FreeRTOS 태스크 우선순위 예제");
  Serial.println("===================================");
  Serial.print("고우선순위 태스크: ");
  Serial.print(PRIORITY_HIGH);
  Serial.print(" / 저우선순위 태스크: ");
  Serial.println(PRIORITY_LOW);
  Serial.println("5초 후 저우선순위 태스크가 승격됩니다.");
  Serial.println();

  // 고우선순위 태스크 생성
  xTaskCreate(taskHigh, "TaskHigh", 2048, NULL, PRIORITY_HIGH, &taskHighHandle);

  // 저우선순위 태스크 생성
  xTaskCreate(taskLow, "TaskLow", 2048, NULL, PRIORITY_LOW, &taskLowHandle);
}

void loop() {
  vTaskDelay(pdMS_TO_TICKS(3000));
}
