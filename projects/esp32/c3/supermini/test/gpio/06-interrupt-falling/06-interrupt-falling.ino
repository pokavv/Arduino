/*
 * 1-06 인터럽트 — 버튼 누르는 순간 즉시 감지
 * ================================================================
 *
 * [인터럽트란?]
 *   일반적으로 코드는 loop() 안에서 위→아래 순서대로 실행된다.
 *   delay(1000)이 있으면 1초 동안 다른 걸 아무것도 못 한다.
 *
 *   인터럽트는 "어떤 신호가 오는 순간 즉시 특정 함수를 실행"하는 기능.
 *   delay 중에도, 다른 코드 실행 중에도 즉시 반응한다.
 *   버튼을 절대 놓치지 않고 잡을 때 유용하다.
 *
 * [FALLING이란?]
 *   신호가 HIGH(3.3V)에서 LOW(0V)로 "떨어지는" 순간.
 *   BOOT 버튼을 누르면 G9이 HIGH→LOW로 바뀐다 → FALLING 발생.
 *   즉, FALLING = 버튼 누르는 순간.
 *
 * [인터럽트 함수(ISR) 작성 규칙 — 중요!]
 *   1) 함수 앞에 반드시 IRAM_ATTR 키워드 붙이기
 *      → 이 함수를 빠른 내부 메모리(RAM)에 올려두는 명령
 *      → 인터럽트는 즉시 실행되어야 하므로 속도가 중요
 *
 *   2) 함수 내용은 최대한 짧게!
 *      → 인터럽트 함수가 실행되는 동안 나머지 코드가 멈추므로
 *         오래 걸리는 작업(Serial.print 등)을 하면 안 됨
 *      → "눌렸다"는 신호(플래그)만 남기고 즉시 끝냄
 *      → 실제 처리는 loop()에서 함
 *
 *   3) 인터럽트와 loop()가 같이 쓰는 변수엔 volatile 붙이기
 *      → 컴파일러가 변수를 최적화해서 사라지게 하는 걸 방지
 *
 * [준비물]
 *   없음 — 보드의 BOOT 버튼(G9) 사용
 */

#include "config.h"

volatile bool buttonPressed = false;      // "버튼 눌렸다"는 신호 (volatile 필수)
volatile unsigned long pressCount = 0;    // 누른 횟수

// IRAM_ATTR: 이 함수를 빠른 메모리에 올려두기 (인터럽트 함수에 필수)
void IRAM_ATTR onButtonFalling() {
    buttonPressed = true;   // 신호만 남기고 즉시 끝
    pressCount++;
}

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // G9 핀에서 FALLING 신호가 오면 onButtonFalling 즉시 실행
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButtonFalling, FALLING);

    Serial.println("시작! 보드의 BOOT 버튼을 눌러봐");
}

void loop() {
    // 인터럽트가 신호를 세워놨으면 여기서 처리
    if (buttonPressed) {
        buttonPressed = false;   // 신호 초기화 (다음 누름을 위해)
        Serial.print("버튼 눌림! 지금까지 ");
        Serial.print(pressCount);
        Serial.println("번 눌렸어");
    }
}
