/*
 * 1-07 인터럽트 — 버튼 떼는 순간 즉시 감지
 * ================================================================
 *
 * [RISING이란?]
 *   신호가 LOW(0V)에서 HIGH(3.3V)로 "올라가는" 순간.
 *   BOOT 버튼을 떼면 G9이 LOW→HIGH로 바뀐다 → RISING 발생.
 *   즉, RISING = 버튼 떼는 순간.
 *
 * [FALLING / RISING / CHANGE 한눈에 비교]
 *   FALLING : 버튼 누르는 순간  (HIGH → LOW)
 *   RISING  : 버튼 떼는 순간   (LOW  → HIGH)
 *   CHANGE  : 누를 때 + 뗄 때 둘 다 (다음 08번 예제)
 *
 * [준비물]
 *   없음 — 보드의 BOOT 버튼(G9) 사용
 */

#include "config.h"

volatile bool buttonReleased = false;
volatile unsigned long releaseCount = 0;

void IRAM_ATTR onButtonRising() {
    buttonReleased = true;
    releaseCount++;
}

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // G9 핀에서 RISING 신호가 오면 onButtonRising 즉시 실행
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButtonRising, RISING);

    Serial.println("시작! BOOT 버튼을 눌렀다 떼봐 — 뗄 때 감지됨");
}

void loop() {
    if (buttonReleased) {
        buttonReleased = false;
        Serial.print("버튼 뗌 감지! 지금까지 ");
        Serial.print(releaseCount);
        Serial.println("번 뗐어");
    }
}
