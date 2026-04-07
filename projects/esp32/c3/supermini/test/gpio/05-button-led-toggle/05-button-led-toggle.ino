/*
 * 1-05 버튼으로 LED 토글
 *
 * 버튼을 누를 때마다 LED 상태를 반전시킨다.
 * 버튼 엣지(눌리는 순간)만 감지해서 토글 — 누르고 있는 동안 계속 켜지는 것 방지.
 *
 * 회로:
 *   G9 → 버튼 → GND (INPUT_PULLUP)
 *   G2 → 220Ω → LED → GND
 */

#include "config.h"

bool ledState    = false;   // 현재 LED 상태
bool lastButton  = HIGH;    // 이전 버튼 상태 (풀업이므로 기본 HIGH)

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    Serial.println("button-led-toggle 시작");
}

void loop() {
    bool currentButton = digitalRead(BUTTON_PIN);

    // 눌리는 순간만 감지 (HIGH → LOW 엣지)
    if (lastButton == HIGH && currentButton == LOW) {
        ledState = !ledState;
        digitalWrite(LED_PIN, ledState ? HIGH : LOW);
        Serial.print("LED 토글 → ");
        Serial.println(ledState ? "ON" : "OFF");
    }

    lastButton = currentButton;
    delay(20);  // 간단한 디바운스
}
