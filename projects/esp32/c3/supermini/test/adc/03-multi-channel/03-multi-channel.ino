/*
 * 2-03 다중 채널 ADC
 *
 * ESP32-C3 Super Mini ADC 가능 핀: G0, G1, G2, G3, G4
 * (G5 이상은 ADC2 — Wi-Fi 켜면 사용 불가)
 * 여러 채널을 순서대로 읽는다.
 *
 * 주의: Wi-Fi 사용 시 ADC2 핀(G5~) 사용 불가 → ADC1 핀만 사용
 *
 * 회로:
 *   각 핀에 가변저항 또는 센서 연결
 */

#include "config.h"

const int adcPins[]  = { CH0_PIN, CH1_PIN, CH2_PIN, CH3_PIN };
const int CH_COUNT   = sizeof(adcPins) / sizeof(adcPins[0]);

void setup() {
    Serial.begin(115200);
    Serial.println("multi-channel ADC 시작");
}

void loop() {
    for (int i = 0; i < CH_COUNT; i++) {
        int raw = analogRead(adcPins[i]);
        float voltage = raw * (3.3f / 4095.0f);

        Serial.print("CH");
        Serial.print(i);
        Serial.print(" (G");
        Serial.print(adcPins[i]);
        Serial.print("): raw=");
        Serial.print(raw);
        Serial.print("  ");
        Serial.print(voltage, 2);
        Serial.println("V");
    }
    Serial.println("---");
    delay(1000);
}
