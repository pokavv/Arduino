/*
 * 1-10 다중 GPIO 동시 제어
 *
 * 여러 LED를 독립적으로 제어하는 예제.
 * 배열로 핀을 묶어 관리하면 핀 수가 늘어도 코드 변경 최소화.
 *
 * 회로:
 *   G2, G3, G4, G5 각각 → 220Ω → LED → GND
 */

#include "config.h"

// 제어할 핀 목록
const int ledPins[] = { LED1_PIN, LED2_PIN, LED3_PIN, LED4_PIN };
const int LED_COUNT = sizeof(ledPins) / sizeof(ledPins[0]);

void setup() {
    Serial.begin(115200);
    for (int i = 0; i < LED_COUNT; i++) {
        pinMode(ledPins[i], OUTPUT);
        digitalWrite(ledPins[i], LOW);
    }
    Serial.println("multi-gpio 시작");
}

void loop() {
    // 순차 켜기
    Serial.println("순차 켜기");
    for (int i = 0; i < LED_COUNT; i++) {
        digitalWrite(ledPins[i], HIGH);
        delay(200);
    }

    // 순차 끄기
    Serial.println("순차 끄기");
    for (int i = 0; i < LED_COUNT; i++) {
        digitalWrite(ledPins[i], LOW);
        delay(200);
    }

    // 전체 동시 켜기/끄기
    Serial.println("전체 ON");
    for (int i = 0; i < LED_COUNT; i++) digitalWrite(ledPins[i], HIGH);
    delay(500);

    Serial.println("전체 OFF");
    for (int i = 0; i < LED_COUNT; i++) digitalWrite(ledPins[i], LOW);
    delay(500);
}
