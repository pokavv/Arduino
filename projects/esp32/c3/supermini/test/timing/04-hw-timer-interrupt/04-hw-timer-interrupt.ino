/*
 * 4-04 하드웨어 타이머 인터럽트
 * ================================================================
 *
 * [핵심 개념 설명]
 *   하드웨어 타이머는 CPU와 독립적으로 동작하는 전용 시간 측정 회로입니다.
 *   설정한 시간이 되면 자동으로 'ISR(인터럽트 서비스 루틴)' 함수를 호출합니다.
 *
 *   millis()와의 차이:
 *   - millis()는 loop()에서 직접 시간을 확인해야 합니다 (폴링 방식).
 *   - 하드웨어 타이머는 시간이 되면 CPU가 하던 일을 잠깐 멈추고
 *     ISR을 먼저 실행합니다 (인터럽트 방식). 더 정확합니다.
 *
 *   IRAM_ATTR: ISR 함수는 플래시(느린 저장장치)가 아닌
 *   IRAM(빠른 내부 메모리)에 올려야 합니다. 인터럽트가 빠르게 처리되도록.
 *
 *   volatile: ISR에서 수정하는 변수는 volatile로 선언해야 합니다.
 *   컴파일러가 변수 값을 레지스터에 캐시하지 않고 매번 메모리에서 읽도록 강제합니다.
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 1개
 *   - USB 케이블
 *
 * [연결 방법]
 *   연결 불필요 — 시리얼 모니터만 사용합니다.
 */

#include "config.h"
#include "esp_timer.h"

// ISR에서 수정하는 카운터 — volatile 필수
volatile unsigned long isrCounter = 0;

// main loop에서 마지막으로 출력한 카운터 값
unsigned long lastPrintedCount = 0;

// ISR 함수: IRAM_ATTR 어트리뷰트 필수
// 이 함수는 타이머가 만료될 때마다 자동으로 호출됩니다
void IRAM_ATTR onTimer(void* arg) {
  isrCounter++;  // 카운터 증가 — 이것이 ISR이 하는 전부입니다
  // ISR 안에서는 최대한 짧게, Serial.print() 같은 느린 함수는 금지입니다
}

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);

  Serial.println("=== 하드웨어 타이머 인터럽트 시작 ===");
  Serial.print("타이머 주기: ");
  Serial.print(TIMER_INTERVAL_US / 1000);
  Serial.println("ms");

  // 타이머 설정 구조체
  const esp_timer_create_args_t timerArgs = {
    .callback = &onTimer,      // 만료 시 호출할 함수
    .arg      = NULL,          // 콜백에 전달할 인자 (없으면 NULL)
    .name     = "hw_timer"     // 디버그용 이름
  };

  // 타이머 핸들 생성
  esp_timer_handle_t timerHandle;
  esp_timer_create(&timerArgs, &timerHandle);

  // 주기적 타이머 시작 (마이크로초 단위)
  esp_timer_start_periodic(timerHandle, TIMER_INTERVAL_US);

  Serial.println("타이머 시작 완료. 1초마다 카운터가 증가합니다.");
}

void loop() {
  // ISR이 카운터를 바꿨는지 확인합니다
  // noInterrupts/interrupts로 감싸서 읽기 도중 ISR이 끼어들지 않게 합니다
  noInterrupts();
  unsigned long currentCount = isrCounter;
  interrupts();

  // 값이 바뀌었을 때만 출력합니다 (불필요한 출력 방지)
  if (currentCount != lastPrintedCount) {
    lastPrintedCount = currentCount;
    Serial.print("[하드웨어 타이머] ISR 호출 횟수: ");
    Serial.println(currentCount);
  }

  // loop()는 계속 빠르게 돌면서 다른 작업도 할 수 있습니다
  delay(10);
}
