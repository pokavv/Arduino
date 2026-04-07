/*
 * 1-08 인터럽트 — 버튼 누를 때 + 뗄 때 모두 감지
 * ================================================================
 *
 * [CHANGE란?]
 *   신호가 어느 방향으로든 바뀌면 인터럽트 발생.
 *   HIGH→LOW (누름) 와 LOW→HIGH (뗌) 둘 다 감지.
 *
 * [준비물]
 *   없음 — 보드의 BOOT 버튼(G9) 사용
 */

#include "config.h"

volatile bool changed = false;
volatile bool lastState = HIGH;

void IRAM_ATTR onButtonChange() {
    changed = true;
    lastState = digitalRead(BUTTON_PIN);   // 바뀐 직후 상태 읽기
}

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // 신호가 어떤 방향으로든 바뀌면 onButtonChange 즉시 실행
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButtonChange, CHANGE);

    Serial.println("시작! BOOT 버튼을 누르거나 떼봐 — 둘 다 감지됨");
}

void loop() {
    if (changed) {
        changed = false;
        if (lastState == LOW) {
            Serial.println("버튼 눌림");     // HIGH→LOW = 누름
        } else {
            Serial.println("버튼 뗌");       // LOW→HIGH = 뗌
        }
    }
}
