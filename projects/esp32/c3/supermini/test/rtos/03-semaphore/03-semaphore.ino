/*
 * rtos/03-semaphore — FreeRTOS 이진 세마포어 (Binary Semaphore)
 * ================================================================
 *
 * [핵심 개념 설명]
 *   세마포어 (Semaphore)
 *     - "이 작업이 끝났어" 또는 "이 이벤트가 발생했어"를 알리는 신호 메커니즘
 *
 *   이진 세마포어 (Binary Semaphore)
 *     - 값이 0 또는 1만 가질 수 있는 세마포어
 *     - Give(줌): 세마포어를 1로 만듦 (신호 발생)
 *     - Take(받음): 세마포어가 1이면 0으로 만들고 진행, 0이면 대기
 *
 *   인터럽트와 세마포어의 조합
 *     - 인터럽트에서 직접 Serial.print 하면 충돌 위험
 *     - 올바른 패턴:
 *         인터럽트 → 세마포어 Give (신호만!)
 *         태스크   → 세마포어 Take → 실제 처리
 *     - 인터럽트에서는 FromISR 버전 함수 사용 필수
 *
 * [준비물]
 *   없음 — 보드 내장 BOOT 버튼(G9) 사용
 *
 * [연결 방법]
 *   없음 — G9 BOOT 버튼을 누르면 인터럽트 발생
 *   (부팅 완료 후에는 일반 입력으로 사용 가능)
 */

#include "config.h"

// ---- 세마포어 핸들 ----
SemaphoreHandle_t buttonSemaphore = NULL;

// ---- 인터럽트 서비스 루틴 (ISR) ----
// IRAM_ATTR: 이 함수를 빠른 내부 RAM에 올려둠 (인터럽트 응답 속도 향상)
// ISR에서는 절대로 Serial.print, delay(), 메모리 할당 등 하면 안 됨
void IRAM_ATTR buttonISR() {
  // 인터럽트 핸들러에서는 FromISR 버전 함수 사용
  BaseType_t higherPriorityTaskWoken = pdFALSE;

  // 세마포어 Give (신호 발생) — 태스크에게 "버튼이 눌렸어!" 알림
  xSemaphoreGiveFromISR(buttonSemaphore, &higherPriorityTaskWoken);

  // 더 높은 우선순위 태스크가 깨어났다면 즉시 컨텍스트 스위치
  portYIELD_FROM_ISR(higherPriorityTaskWoken);
}

// ---- 버튼 처리 태스크 ----
void buttonHandlerTask(void* pvParameters) {
  int pressCount = 0;

  while (true) {
    // 세마포어를 기다림 (무한 대기 — 버튼 눌릴 때까지 CPU를 사용하지 않음)
    if (xSemaphoreTake(buttonSemaphore, portMAX_DELAY) == pdTRUE) {
      pressCount++;
      Serial.print("[버튼 태스크] 버튼 눌림 감지! 총 ");
      Serial.print(pressCount);
      Serial.println("번");
    }
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" FreeRTOS 이진 세마포어 예제");
  Serial.println("===================================");
  Serial.println("BOOT 버튼(G9)을 눌러보세요.");
  Serial.println();

  // ---- 버튼 핀 설정 ----
  // G9(BOOT 버튼)은 내부 풀업 저항 활성화
  // 버튼 누르면 LOW, 안 누르면 HIGH
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // ---- 이진 세마포어 생성 ----
  buttonSemaphore = xSemaphoreCreateBinary();

  if (buttonSemaphore == NULL) {
    Serial.println("[오류] 세마포어 생성 실패!");
    while (true) { delay(1000); }
  }

  // ---- 인터럽트 등록 ----
  // FALLING: HIGH→LOW로 내려갈 때 (버튼 누르는 순간)
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), buttonISR, FALLING);

  // ---- 처리 태스크 생성 ----
  xTaskCreate(buttonHandlerTask, "ButtonHandler", 2048, NULL, 2, NULL);

  Serial.println("세마포어 및 인터럽트 설정 완료");
}

void loop() {
  vTaskDelay(pdMS_TO_TICKS(1000));
}
