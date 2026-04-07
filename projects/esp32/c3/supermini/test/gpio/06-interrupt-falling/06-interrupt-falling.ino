/*
 * 1-06 외부 인터럽트 — FALLING
 *
 * 신호가 HIGH→LOW로 떨어지는 순간 인터럽트 발생.
 * 버튼을 누르는 순간 감지 (INPUT_PULLUP이므로 누르면 LOW).
 * ISR(인터럽트 서비스 루틴)은 짧게 유지하고 플래그만 세운다.
 *
 * 회로:
 *   G9 → 버튼 → GND (INPUT_PULLUP)
 */

#include "config.h"

// volatile: 인터럽트와 main loop 간 공유 변수는 반드시 volatile
volatile bool buttonPressed = false;
volatile unsigned long pressCount = 0;

// IRAM_ATTR: ISR은 반드시 RAM에 올려야 빠르게 실행됨
void IRAM_ATTR onButtonFalling() {
    buttonPressed = true;   // 플래그만 세우고 즉시 리턴
    pressCount++;
}

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // FALLING: HIGH→LOW 엣지에서 인터럽트 발생
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButtonFalling, FALLING);
    Serial.println("interrupt-falling 시작");
    Serial.println("버튼을 눌러보세요");
}

void loop() {
    if (buttonPressed) {
        buttonPressed = false;  // 플래그 초기화
        Serial.print("FALLING 인터럽트 발생! 누적 횟수: ");
        Serial.println(pressCount);
    }
}
