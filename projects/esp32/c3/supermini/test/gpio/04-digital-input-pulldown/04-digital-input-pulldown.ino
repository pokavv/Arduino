/*
 * 1-04 버튼 입력 읽기 (PULLDOWN 방식)
 *
 * "INPUT_PULLDOWN"이란?
 *   PULLUP과 반대 방향의 설정.
 *   - 버튼 안 누름 → LOW  (0V 상태 유지)
 *   - 버튼 누름   → HIGH (3.3V로 연결되어 전압 올라감)
 *   ※ 이 기능은 ESP32 전용! 일반 아두이노(우노 등)에서는 안 됨.
 *
 * PULLUP vs PULLDOWN 차이:
 *   PULLUP   : 버튼 → GND 연결, 안 누르면 HIGH, 누르면 LOW
 *   PULLDOWN : 버튼 → 3.3V 연결, 안 누르면 LOW,  누르면 HIGH
 *
 * 연결 방법:
 *   G3번 핀 → 버튼 한쪽 다리
 *   버튼 반대쪽 다리 → 3.3V 핀
 */

#include "config.h"

void setup() {
    Serial.begin(115200);

    // G3번 핀을 "입력 + 내부 저항(아래로 당기는 방향)" 모드로 설정
    pinMode(BUTTON_PIN, INPUT_PULLDOWN);

    Serial.println("시작! 버튼을 눌러봐");
}

void loop() {
    int state = digitalRead(BUTTON_PIN);

    if (state == HIGH) {
        // HIGH = 버튼이 3.3V에 연결됨 = 버튼 눌린 상태
        Serial.println("버튼 눌렸어!");
    } else {
        // LOW = 내부 저항이 0V 유지 = 버튼 안 눌린 상태
        Serial.println("버튼 안 눌림");
    }

    delay(200);
}
