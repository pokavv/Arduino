/*
 * 1-09 버튼 디바운싱 (소프트웨어)
 *
 * 기계식 버튼은 누르는 순간 접점이 여러 번 튕기면서 노이즈 발생.
 * 소프트웨어 디바운싱: 마지막 상태 변화 후 일정 시간(20ms) 동안
 * 상태가 안정되면 실제 입력으로 인정.
 *
 * 회로:
 *   G9 → 버튼 → GND (INPUT_PULLUP)
 *   G2 → 220Ω → LED → GND
 */

#include "config.h"

bool ledState       = false;
bool lastRawButton  = HIGH;  // 이전 raw 버튼 값
bool stableButton   = HIGH;  // 안정화된 버튼 값
unsigned long lastChangeTime = 0;

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    Serial.println("debounce 시작");
}

void loop() {
    bool rawButton = digitalRead(BUTTON_PIN);

    // 버튼 값이 바뀌면 타이머 리셋
    if (rawButton != lastRawButton) {
        lastChangeTime = millis();
        lastRawButton = rawButton;
    }

    // 마지막 변화 후 DEBOUNCE_MS 동안 안정적이면 확정
    if (millis() - lastChangeTime >= DEBOUNCE_MS) {
        if (rawButton != stableButton) {
            stableButton = rawButton;

            // 안정화된 누름 엣지 (HIGH→LOW) 감지
            if (stableButton == LOW) {
                ledState = !ledState;
                digitalWrite(LED_PIN, ledState ? HIGH : LOW);
                Serial.print("디바운스 완료 — LED: ");
                Serial.println(ledState ? "ON" : "OFF");
            }
        }
    }
}
