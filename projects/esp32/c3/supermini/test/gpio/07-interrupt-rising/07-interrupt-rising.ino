/*
 * 1-07 외부 인터럽트 — RISING
 *
 * 신호가 LOW→HIGH로 올라가는 순간 인터럽트 발생.
 * INPUT_PULLUP 버튼 기준으로 버튼을 떼는 순간 감지.
 *
 * 회로:
 *   G9 → 버튼 → GND (INPUT_PULLUP)
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

    // RISING: LOW→HIGH 엣지에서 인터럽트 발생
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButtonRising, RISING);
    Serial.println("interrupt-rising 시작");
    Serial.println("버튼을 눌렀다 떼보세요");
}

void loop() {
    if (buttonReleased) {
        buttonReleased = false;
        Serial.print("RISING 인터럽트 발생 (버튼 뗌)! 누적 횟수: ");
        Serial.println(releaseCount);
    }
}
