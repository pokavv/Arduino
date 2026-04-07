/*
 * rtos/02-task-queue — FreeRTOS 큐(Queue)로 태스크 간 데이터 전달
 * ================================================================
 *
 * [핵심 개념 설명]
 *   큐 (Queue)
 *     - 태스크 간에 데이터를 안전하게 전달하는 FIFO(선입선출) 버퍼
 *     - 생산자(Producer) 태스크가 데이터를 넣고 (xQueueSend)
 *       소비자(Consumer) 태스크가 데이터를 꺼냄 (xQueueReceive)
 *     - 큐가 가득 차면 생산자는 대기 (블로킹) 가능
 *     - 큐가 비어 있으면 소비자는 대기 (블로킹) 가능
 *
 *   전역 변수 공유 vs 큐
 *     - 전역 변수: 두 태스크가 동시에 접근 → 데이터 깨짐 위험
 *     - 큐: FreeRTOS가 내부적으로 동기화 처리 → 안전
 *
 *   이 예제 구조
 *     생산자 태스크 → [큐] → 소비자 태스크
 *     (1초마다 숫자 전송)    (받을 때마다 출력)
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"

// ---- 큐 핸들 (전역 변수) ----
// 큐는 setup()에서 생성 후 두 태스크가 공유
QueueHandle_t dataQueue = NULL;

// ---- 생산자 태스크 ----
// 1초마다 숫자를 큐에 넣음
void producerTask(void* pvParameters) {
  int counter = 0;

  while (true) {
    counter++;

    // xQueueSend(큐핸들, 데이터포인터, 대기시간)
    // 큐가 가득 찼을 때 최대 100ms 대기 후 포기
    BaseType_t result = xQueueSend(dataQueue, &counter, pdMS_TO_TICKS(100));

    if (result == pdTRUE) {
      Serial.print("[생산자] 전송 성공: ");
      Serial.print(counter);
      Serial.print(" / 큐 사용 중: ");
      Serial.print(uxQueueMessagesWaiting(dataQueue));  // 현재 큐에 쌓인 개수
      Serial.print("/");
      Serial.println(QUEUE_SIZE);
    } else {
      Serial.println("[생산자] 전송 실패 — 큐가 가득 참!");
    }

    vTaskDelay(pdMS_TO_TICKS(1000));  // 1초마다 생산
  }
}

// ---- 소비자 태스크 ----
// 큐에 데이터가 오면 즉시 꺼내서 처리
void consumerTask(void* pvParameters) {
  int receivedData = 0;

  while (true) {
    // xQueueReceive(큐핸들, 저장변수포인터, 대기시간)
    // 큐가 빌 때 최대 2초 대기 (portMAX_DELAY = 무한 대기)
    BaseType_t result = xQueueReceive(dataQueue, &receivedData, pdMS_TO_TICKS(2000));

    if (result == pdTRUE) {
      Serial.print("  [소비자] 수신 성공: ");
      Serial.println(receivedData);
    } else {
      Serial.println("  [소비자] 2초 동안 데이터 없음 (타임아웃)");
    }
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" FreeRTOS 큐(Queue) 예제");
  Serial.println("===================================");

  // ---- 큐 생성 ----
  // xQueueCreate(항목 수, 항목 크기(바이트))
  dataQueue = xQueueCreate(QUEUE_SIZE, sizeof(int));

  if (dataQueue == NULL) {
    Serial.println("[오류] 큐 생성 실패! 메모리 부족.");
    while (true) { delay(1000); }  // 오류 시 멈춤
  }
  Serial.print("큐 생성 완료 (크기: ");
  Serial.print(QUEUE_SIZE);
  Serial.println("개)");

  // ---- 태스크 생성 ----
  xTaskCreate(producerTask, "Producer", 2048, NULL, 1, NULL);
  xTaskCreate(consumerTask, "Consumer", 2048, NULL, 1, NULL);

  Serial.println("생산자/소비자 태스크 생성 완료");
}

void loop() {
  vTaskDelay(pdMS_TO_TICKS(5000));
}
