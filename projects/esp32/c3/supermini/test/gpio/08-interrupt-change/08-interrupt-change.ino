/*
 * 1-08 외부 인터럽트 — CHANGE
 *
 * 신호가 변하는 순간 (HIGH→LOW, LOW→HIGH 모두) 인터럽트 발생.
 * 버튼 누를 때 + 뗄 때 모두 감지.
 *
 * 회로:
 *   G9 → 버튼 → GND (INPUT_PULLUP)
 */

#include "config.h"

volatile bool changed = false;
volatile bool lastState = HIGH;

void IRAM_ATTR onButtonChange() {
    changed = true;
    lastState = digitalRead(BUTTON_PIN);
}

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // CHANGE: 신호 변화 시 모두 인터럽트 발생
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButtonChange, CHANGE);
    Serial.println("interrupt-change 시작");
}

void loop() {
    if (changed) {
        changed = false;
        Serial.print("CHANGE 인터럽트 → 현재 상태: ");
        Serial.println(lastState == LOW ? "LOW (눌림)" : "HIGH (뗌)");
    }
}
