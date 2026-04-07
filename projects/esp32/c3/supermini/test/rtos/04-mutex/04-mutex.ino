/*
 * rtos/04-mutex — FreeRTOS 뮤텍스(Mutex)로 공유 자원 보호
 * ================================================================
 *
 * [핵심 개념 설명]
 *   뮤텍스 (Mutex = Mutual Exclusion, 상호 배제)
 *     - "한 번에 하나의 태스크만 사용할 수 있는 자물쇠"
 *     - Lock(잠금, Take) → 공유 자원 사용 → Unlock(해제, Give)
 *     - 다른 태스크가 Lock된 뮤텍스를 Take하면 → Unlock될 때까지 대기
 *
 *   세마포어 vs 뮤텍스
 *     - 세마포어: "이벤트 발생" 알림용
 *     - 뮤텍스  : "공유 자원 보호"용 + 우선순위 역전 방지 기능
 *
 *   Serial 출력과 뮤텍스
 *     - Serial은 두 태스크가 동시에 쓰면 글자가 섞임
 *     - 뮤텍스로 보호하면 한 번에 한 태스크만 출력 가능
 *
 *   주의: 뮤텍스 Take 후 반드시 Give 해야 함 (안 하면 데드락 발생)
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"

// ---- 뮤텍스 핸들 ----
SemaphoreHandle_t serialMutex = NULL;

// ---- 공유 카운터 (뮤텍스로 보호해야 하는 공유 자원) ----
int sharedCounter = 0;

// ---- 태스크A: 200ms마다 카운터 증가 + 출력 ----
void taskA(void* pvParameters) {
  while (true) {
    // 뮤텍스 잠금 (최대 100ms 대기)
    if (xSemaphoreTake(serialMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
      // --- 임계 구역 시작 (Critical Section) ---
      sharedCounter++;
      Serial.print("[TaskA] 카운터 증가: ");
      Serial.print(sharedCounter);
      Serial.println(" (뮤텍스 보호 중)");
      // --- 임계 구역 끝 ---
      xSemaphoreGive(serialMutex);  // 뮤텍스 해제 — 반드시 호출!
    } else {
      // 뮤텍스를 얻지 못한 경우 (다른 태스크가 사용 중)
      // Serial을 못 쓰는 상황이므로 그냥 재시도
    }

    vTaskDelay(pdMS_TO_TICKS(200));  // 200ms 대기
  }
}

// ---- 태스크B: 300ms마다 카운터 읽기 + 출력 ----
void taskB(void* pvParameters) {
  while (true) {
    if (xSemaphoreTake(serialMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
      // --- 임계 구역 시작 ---
      Serial.print("  [TaskB] 카운터 읽기: ");
      Serial.print(sharedCounter);
      Serial.println(" (뮤텍스 보호 중)");
      // --- 임계 구역 끝 ---
      xSemaphoreGive(serialMutex);  // 뮤텍스 해제 — 반드시 호출!
    }

    vTaskDelay(pdMS_TO_TICKS(300));  // 300ms 대기
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" FreeRTOS 뮤텍스(Mutex) 예제");
  Serial.println("===================================");
  Serial.println("TaskA(200ms)와 TaskB(300ms)가 Serial을 안전하게 공유");
  Serial.println();

  // ---- 뮤텍스 생성 ----
  serialMutex = xSemaphoreCreateMutex();

  if (serialMutex == NULL) {
    Serial.println("[오류] 뮤텍스 생성 실패!");
    while (true) { delay(1000); }
  }

  // ---- 태스크 생성 ----
  xTaskCreate(taskA, "TaskA", 2048, NULL, 1, NULL);
  xTaskCreate(taskB, "TaskB", 2048, NULL, 1, NULL);

  Serial.println("뮤텍스 및 태스크 생성 완료");
}

void loop() {
  vTaskDelay(pdMS_TO_TICKS(2000));
}
