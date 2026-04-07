/*
 * 1-02 내장 LED 제어 (Active LOW 반전 로직)
 *
 * ESP32-C3 Super Mini 내장 LED는 G8에 연결되어 있고
 * Active LOW 방식 — LOW를 써야 켜지고, HIGH를 써야 꺼진다.
 * 일반 LED와 반대라서 ! 연산자로 반전해서 사용.
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    pinMode(BUILTIN_LED_PIN, OUTPUT);

    // 시작 시 꺼진 상태로 초기화 (Active LOW이므로 HIGH = OFF)
    digitalWrite(BUILTIN_LED_PIN, HIGH);
    Serial.println("builtin-led 시작");
}

void loop() {
    // Active LOW: LOW = ON, HIGH = OFF
    digitalWrite(BUILTIN_LED_PIN, LOW);
    Serial.println("내장 LED ON");
    delay(500);

    digitalWrite(BUILTIN_LED_PIN, HIGH);
    Serial.println("내장 LED OFF");
    delay(500);
}
