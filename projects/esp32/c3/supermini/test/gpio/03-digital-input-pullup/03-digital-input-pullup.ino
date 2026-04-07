/*
 * 1-03 버튼 입력 읽기 (PULLUP 방식)
 *
 * "디지털 입력"이란?
 *   핀으로 들어오는 전기 신호가 HIGH(3.3V)인지 LOW(0V)인지 읽는 것.
 *
 * "INPUT_PULLUP"이란?
 *   버튼을 연결할 때 외부 저항 없이도 안정적으로 동작하게 해주는 설정.
 *   보드 내부에 저항이 들어있어서 따로 연결 안 해도 된다.
 *   - 버튼 안 누름 → HIGH (3.3V 상태 유지)
 *   - 버튼 누름   → LOW  (GND로 연결되어 0V)
 *   ※ 눌렀을 때 LOW가 나온다는 게 처음엔 헷갈릴 수 있음!
 *
 * 어떤 버튼을 누르나?
 *   보드에 "BOOT"라고 적힌 버튼이 G9에 이미 연결되어 있다. 그걸 누르면 된다.
 *   따로 버튼 연결 안 해도 테스트 가능.
 *
 * 연결 방법:
 *   추가 연결 없음 — 보드의 BOOT 버튼 사용 (G9)
 */

#include "config.h"

void setup() {
    Serial.begin(115200);

    // G9번 핀을 "입력 + 내부 저항 사용" 모드로 설정
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    Serial.println("시작! 보드의 BOOT 버튼을 눌러봐");
}

void loop() {
    int state = digitalRead(BUTTON_PIN);   // 현재 버튼 상태 읽기

    if (state == LOW) {
        // LOW = 버튼이 GND에 연결됨 = 버튼 눌린 상태
        Serial.println("버튼 눌렸어!");
    } else {
        // HIGH = 내부 저항이 3.3V 유지 = 버튼 안 눌린 상태
        Serial.println("버튼 안 눌림");
    }

    delay(200);   // 200ms마다 확인 (너무 빠르면 시리얼 모니터가 도배됨)
}
