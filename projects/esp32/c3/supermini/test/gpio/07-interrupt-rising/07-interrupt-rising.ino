/*
 * 1-07 인터럽트 — 버튼 떼는 순간 감지 (RISING)
 *
 * "RISING"이란?
 *   신호가 LOW(낮음)에서 HIGH(높음)로 올라가는 순간.
 *   PULLUP 버튼에서 버튼을 떼면 LOW→HIGH가 되므로 = 버튼 떼는 순간.
 *
 * FALLING vs RISING 정리:
 *   FALLING : 버튼 누르는 순간 (HIGH → LOW)
 *   RISING  : 버튼 떼는 순간  (LOW  → HIGH)
 *
 * 어떤 버튼을 누르나?
 *   보드에 "BOOT"라고 적힌 버튼이 이미 G9에 연결되어 있다. 그걸 누르면 된다.
 *   누른 다음 손을 떼면 RISING 신호가 발생한다.
 *
 * 연결 방법:
 *   추가 연결 없음 — 보드의 BOOT 버튼 사용
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

    // RISING(LOW→HIGH) 신호 오면 onButtonRising 즉시 실행
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButtonRising, RISING);

    Serial.println("시작! 보드의 BOOT 버튼을 눌렀다 떼봐 — 뗄 때 감지됨");
}

void loop() {
    if (buttonReleased) {
        buttonReleased = false;
        Serial.print("버튼 뗌 감지! 지금까지 뗀 횟수: ");
        Serial.println(releaseCount);
    }
}
