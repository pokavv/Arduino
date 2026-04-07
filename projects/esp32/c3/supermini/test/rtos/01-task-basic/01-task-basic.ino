/*
 * rtos/01-task-basic — FreeRTOS 기본 태스크 생성
 * ================================================================
 *
 * [핵심 개념 설명]
 *   FreeRTOS (Free Real-Time Operating System)
 *     - ESP32에 내장된 실시간 운영체제 (RTOS)
 *     - 여러 작업을 "동시에" 실행하는 것처럼 보이게 해줌
 *     - 실제로는 매우 빠르게 태스크를 전환하며 교대로 실행 (멀티태스킹)
 *
 *   태스크 (Task)
 *     - loop() 함수처럼 독립적으로 실행되는 코드 블록
 *     - 각 태스크는 고유한 스택(메모리) 영역을 가짐
 *     - xTaskCreate()로 생성, vTaskDelete()로 삭제
 *
 *   주의: FreeRTOS 태스크에서는 delay() 대신 vTaskDelay() 사용
 *         delay()는 CPU를 점유한 채 대기, vTaskDelay()는 다른 태스크에 CPU를 양보
 *
 *   pdMS_TO_TICKS(ms)
 *     - 밀리초를 FreeRTOS 틱(tick) 단위로 변환하는 매크로
 *     - 틱: FreeRTOS 내부 시간 단위 (보통 1틱 = 1ms)
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"

// ---- 태스크1: 1초마다 메시지 출력 ----
void task1(void* pvParameters) {
  // FreeRTOS 태스크는 절대 return하지 않고, 무한 루프로 동작해야 함
  while (true) {
    Serial.println("[Task1] 실행 중 — 1초마다 출력");
    vTaskDelay(pdMS_TO_TICKS(1000));  // 1초 대기 (다른 태스크에 CPU 양보)
  }
}

// ---- 태스크2: 0.5초마다 메시지 출력 ----
void task2(void* pvParameters) {
  while (true) {
    Serial.println("  [Task2] 실행 중 — 0.5초마다 출력");
    vTaskDelay(pdMS_TO_TICKS(500));   // 0.5초 대기
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" FreeRTOS 기본 태스크 생성");
  Serial.println("===================================");
  Serial.println("Task1: 1초마다 / Task2: 0.5초마다");
  Serial.println();

  // ---- 태스크1 생성 ----
  // xTaskCreate(함수, 이름, 스택크기(워드), 파라미터, 우선순위, 핸들)
  xTaskCreate(
    task1,          // 태스크 함수
    "Task1",        // 디버그용 이름 (16자 이하 권장)
    2048,           // 스택 크기 (바이트 단위 아님! 워드 단위 — ESP32에서 4배 = 8KB)
    NULL,           // 파라미터 (없으면 NULL)
    1,              // 우선순위 (1 = 일반)
    NULL            // 태스크 핸들 (나중에 제어 안 하면 NULL)
  );

  // ---- 태스크2 생성 ----
  xTaskCreate(
    task2,
    "Task2",
    2048,
    NULL,
    1,              // 같은 우선순위 → 번갈아가며 실행
    NULL
  );

  Serial.println("두 태스크 생성 완료. setup() 종료.");
  Serial.println("이후 loop()와 Task1, Task2가 동시에(번갈아가며) 실행됩니다.");
}

void loop() {
  // loop()도 FreeRTOS의 한 태스크로 실행됨 (우선순위 1)
  // 여기서는 아무것도 하지 않고 잠시 대기만 함
  vTaskDelay(pdMS_TO_TICKS(2000));
  Serial.println("[loop] loop() 도 실행 중");
}
