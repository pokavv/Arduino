/*
 * rtos/06-software-timer — FreeRTOS 소프트웨어 타이머
 * ================================================================
 *
 * [핵심 개념 설명]
 *   소프트웨어 타이머 (Software Timer)
 *     - FreeRTOS가 관리하는 타이머 — 하드웨어 타이머와 별개
 *     - 정해진 주기마다 콜백 함수를 자동으로 호출
 *     - 별도 태스크를 만들지 않고도 주기적 작업 수행 가능
 *
 *   xTimerCreate() 파라미터
 *     - 이름, 주기(틱), 반복여부(pdTRUE=반복/pdFALSE=1회), ID, 콜백함수
 *
 *   하드웨어 타이머 vs 소프트웨어 타이머
 *     - 하드웨어 타이머: 마이크로초 단위의 정확한 인터럽트 생성
 *     - 소프트웨어 타이머: 밀리초 수준, FreeRTOS 태스크 스케줄러에 의존
 *       → 다른 태스크가 CPU를 점유하면 정확한 시각에 호출 안 될 수 있음
 *
 *   타이머 데몬 태스크
 *     - FreeRTOS 내부에서 타이머 콜백을 실행하는 별도 태스크
 *     - 콜백 함수에서 오래 걸리는 작업은 하면 안 됨 (다른 타이머에 영향)
 *
 * [준비물]
 *   없음 — 보드 내장 LED(G8) 사용
 *
 * [연결 방법]
 *   없음 — 내장 LED(G8)가 1초마다 깜빡임. USB로 PC에 연결.
 */

#include "config.h"

// ---- 타이머 핸들 ----
TimerHandle_t ledTimer  = NULL;
TimerHandle_t infoTimer = NULL;

// ---- LED 상태 추적 ----
bool ledState = false;

// ---- LED 토글 타이머 콜백 ----
// 타이머 콜백은 FreeRTOS 타이머 데몬 태스크에서 호출됨
// 짧고 빠르게 끝내야 함
void ledTimerCallback(TimerHandle_t xTimer) {
  ledState = !ledState;
  // Active LOW: ledState=true면 LOW(켜짐), false면 HIGH(꺼짐)
  digitalWrite(BUILTIN_LED_PIN, ledState ? LOW : HIGH);
}

// ---- 정보 출력 타이머 콜백 (5초마다) ----
void infoTimerCallback(TimerHandle_t xTimer) {
  Serial.print("[소프트웨어 타이머] LED 상태: ");
  Serial.print(ledState ? "켜짐" : "꺼짐");
  Serial.print(" / 가동 시간: ");
  Serial.print(millis() / 1000);
  Serial.println("초");
}

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" FreeRTOS 소프트웨어 타이머");
  Serial.println("===================================");
  Serial.print("LED 토글 주기: ");
  Serial.print(TIMER_PERIOD_MS);
  Serial.println("ms");
  Serial.println("정보 출력 주기: 5초");
  Serial.println();

  // ---- LED 핀 설정 ----
  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);  // HIGH = 꺼짐 (Active LOW)

  // ---- LED 토글 타이머 생성 ----
  // xTimerCreate(이름, 주기, 반복여부, ID, 콜백)
  ledTimer = xTimerCreate(
    "LedTimer",                    // 타이머 이름
    pdMS_TO_TICKS(TIMER_PERIOD_MS),// 주기 (밀리초 → 틱 변환)
    pdTRUE,                        // pdTRUE = 자동 반복 (Auto-reload)
    (void*)0,                      // 타이머 ID (여러 타이머가 같은 콜백 쓸 때 구분)
    ledTimerCallback               // 콜백 함수
  );

  // ---- 정보 출력 타이머 생성 (5초마다) ----
  infoTimer = xTimerCreate(
    "InfoTimer",
    pdMS_TO_TICKS(5000),  // 5초마다
    pdTRUE,
    (void*)1,
    infoTimerCallback
  );

  // ---- 타이머 시작 ----
  if (ledTimer != NULL) {
    xTimerStart(ledTimer, 0);    // 0 = 즉시 시작
    Serial.println("LED 타이머 시작");
  }

  if (infoTimer != NULL) {
    xTimerStart(infoTimer, 0);
    Serial.println("정보 타이머 시작");
  }

  Serial.println("setup() 완료 — 타이머가 자동으로 동작합니다.");
}

void loop() {
  // 타이머가 알아서 처리하므로 loop()는 비워도 됨
  vTaskDelay(pdMS_TO_TICKS(1000));
}
