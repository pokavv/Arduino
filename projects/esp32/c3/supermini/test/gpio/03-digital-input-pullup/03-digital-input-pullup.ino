/*
 * 1-03 디지털 입력 — 버튼 (INPUT_PULLUP)
 *
 * 내부 풀업 저항을 사용하는 버튼 입력.
 * 풀업 방식: 버튼 안 누르면 HIGH, 누르면 LOW (GND로 연결되므로)
 *
 * 회로:
 *   G9 → 버튼 → GND
 *   (내부 풀업 사용 — 외부 저항 불필요)
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    // INPUT_PULLUP: 내부 풀업 활성화, 평상시 HIGH
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    Serial.println("digital-input-pullup 시작");
    Serial.println("버튼을 눌러보세요");
}

void loop() {
    int state = digitalRead(BUTTON_PIN);

    // 풀업이므로 LOW가 눌린 상태
    if (state == LOW) {
        Serial.println("버튼 눌림 (LOW)");
    } else {
        Serial.println("버튼 안 눌림 (HIGH)");
    }

    delay(200);
}
