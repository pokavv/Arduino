/*
 * 1-06 인터럽트 — 버튼 누르는 순간 감지 (FALLING)
 *
 * "인터럽트"란?
 *   평소에 loop()가 위에서 아래로 순서대로 실행되는데,
 *   특정 신호가 오면 하던 일을 잠깐 멈추고 즉시 다른 함수를 실행하는 것.
 *   버튼을 누르는 순간을 절대 놓치지 않고 잡을 수 있다.
 *
 * "FALLING"이란?
 *   신호가 HIGH(높음)에서 LOW(낮음)로 떨어지는 순간.
 *   PULLUP 버튼에서 버튼을 누르면 HIGH→LOW가 되므로 = 버튼 누르는 순간.
 *
 * 인터럽트 함수(ISR) 작성 규칙:
 *   1. 함수 앞에 IRAM_ATTR 붙이기 — 빠르게 실행되도록 메모리에 올려두는 것
 *   2. 함수 안에서 최대한 짧게 — 신호만 남기고 나머지는 loop()에서 처리
 *   3. 공유 변수 앞에 volatile 붙이기 — 인터럽트와 loop() 둘 다 쓰는 변수 표시
 *
 * 어떤 버튼을 누르나?
 *   따로 버튼을 연결하지 않아도 된다.
 *   보드에 "BOOT"라고 적힌 버튼이 이미 G9에 연결되어 있다. 그걸 누르면 된다.
 *
 * 연결 방법:
 *   추가 연결 없음 — 보드의 BOOT 버튼 사용
 */

#include "config.h"

// volatile: 인터럽트 함수와 loop() 둘 다 이 변수를 쓴다는 표시
volatile bool buttonPressed = false;
volatile unsigned long pressCount = 0;

// IRAM_ATTR: 이 함수를 빠른 메모리(RAM)에 올려두기 — 인터럽트 함수에 필수
void IRAM_ATTR onButtonFalling() {
    buttonPressed = true;   // "버튼 눌렸다"는 신호만 남기고 즉시 끝
    pressCount++;
}

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // G9번 핀에서 FALLING(HIGH→LOW) 신호가 오면 onButtonFalling 함수를 즉시 실행해줘
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButtonFalling, FALLING);

    Serial.println("시작! 보드의 BOOT 버튼을 눌러봐");
}

void loop() {
    if (buttonPressed) {
        buttonPressed = false;   // 신호 초기화 (다음 누름을 위해)
        Serial.print("버튼 눌림 감지! 지금까지 누른 횟수: ");
        Serial.println(pressCount);
    }
}
