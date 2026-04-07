/*
 * 1-04 디지털 입력 — 버튼 (INPUT_PULLDOWN)
 *
 * 내부 풀다운 저항을 사용하는 버튼 입력.
 * ESP32-C3는 INPUT_PULLDOWN을 지원 (일반 Arduino는 미지원).
 * 풀다운 방식: 버튼 안 누르면 LOW, 누르면 HIGH (3.3V로 연결되므로)
 *
 * 회로:
 *   G3 → 버튼 → 3.3V
 *   (내부 풀다운 사용 — 외부 저항 불필요)
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    // INPUT_PULLDOWN: ESP32 전용, 평상시 LOW
    pinMode(BUTTON_PIN, INPUT_PULLDOWN);
    Serial.println("digital-input-pulldown 시작");
    Serial.println("버튼을 눌러보세요");
}

void loop() {
    int state = digitalRead(BUTTON_PIN);

    // 풀다운이므로 HIGH가 눌린 상태
    if (state == HIGH) {
        Serial.println("버튼 눌림 (HIGH)");
    } else {
        Serial.println("버튼 안 눌림 (LOW)");
    }

    delay(200);
}
