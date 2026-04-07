/*
 * 1-01 디지털 출력 — LED ON/OFF
 *
 * 외부 LED를 GPIO로 켜고 끄는 가장 기본적인 출력 예제.
 * 내장 LED(G8, Active LOW)가 아닌 외부 LED(Active HIGH) 기준.
 *
 * 회로:
 *   G2 → 220Ω 저항 → LED(+) → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    pinMode(LED_PIN, OUTPUT);
    Serial.println("digital-output 시작");
}

void loop() {
    digitalWrite(LED_PIN, HIGH);    // LED 켜기
    Serial.println("LED ON");
    delay(1000);

    digitalWrite(LED_PIN, LOW);     // LED 끄기
    Serial.println("LED OFF");
    delay(1000);
}
