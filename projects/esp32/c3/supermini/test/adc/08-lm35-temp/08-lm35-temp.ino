/*
 * 2-08 LM35 아날로그 온도 센서
 *
 * LM35: 온도 1°C당 10mV 출력.
 * 0°C = 0V, 100°C = 1.0V
 * 변환 공식: 온도(°C) = 전압(mV) / 10
 *          = (raw / 4095.0) * 3300 / 10
 *          = raw * 3300 / 40950
 *
 * 회로:
 *   LM35 VCC → 3.3V
 *   LM35 VOUT → G0
 *   LM35 GND → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("lm35-temp 시작");
}

void loop() {
    int raw = analogRead(LM35_PIN);

    // raw → mV → 온도(°C) 변환
    float millivolts = raw * (3300.0f / 4095.0f);  // mV
    float tempC = millivolts / 10.0f;               // LM35: 10mV/°C

    Serial.print("raw: ");
    Serial.print(raw);
    Serial.print("  →  ");
    Serial.print(tempC, 1);
    Serial.println(" °C");

    delay(1000);
}
