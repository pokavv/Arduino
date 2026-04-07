/*
 * 1-08 인터럽트 — 버튼 누를 때 + 뗄 때 모두 감지 (CHANGE)
 *
 * "CHANGE"란?
 *   신호가 어떤 방향이든 바뀌는 순간 모두 반응.
 *   버튼 누를 때(HIGH→LOW)도, 뗄 때(LOW→HIGH)도 감지한다.
 *
 * FALLING / RISING / CHANGE 비교:
 *   FALLING : 누를 때만
 *   RISING  : 뗄 때만
 *   CHANGE  : 누를 때 + 뗄 때 둘 다
 *
 * 어떤 버튼을 누르나?
 *   보드에 "BOOT"라고 적힌 버튼 (G9에 연결되어 있음). 그걸 누르면 된다.
 *
 * 연결 방법:
 *   추가 연결 없음 — 보드의 BOOT 버튼 사용
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

    // 신호가 어떤 방향으로든 바뀌면 onButtonChange 즉시 실행
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButtonChange, CHANGE);

    Serial.println("시작! 보드의 BOOT 버튼을 누르거나 떼봐");
}

void loop() {
    if (changed) {
        changed = false;
        if (lastState == LOW) {
            Serial.println("버튼 눌림");
        } else {
            Serial.println("버튼 뗌");
        }
    }
}
