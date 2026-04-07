/*
 * 2-03 아날로그 핀 여러 개 동시에 읽기
 *
 * 가변저항이나 센서를 여러 개 동시에 연결해서 읽을 수 있다.
 *
 * ESP32-C3에서 아날로그 읽기 가능한 핀:
 *   G0, G1, G2, G3, G4 — 총 5개 핀
 *   ※ 나중에 Wi-Fi 기능을 쓰면 G5 이상 핀의 아날로그 읽기가 망가지므로
 *      아날로그 센서는 가급적 G0~G4 범위에 연결하는 게 좋다.
 *
 * 연결 방법:
 *   G0, G1, G2, G3 각 핀마다 → 가변저항 가운데 다리 연결
 *   가변저항 양쪽 다리 → GND와 3.3V
 */

#include "config.h"

const int adcPins[] = { CH0_PIN, CH1_PIN, CH2_PIN, CH3_PIN };
const int CH_COUNT  = sizeof(adcPins) / sizeof(adcPins[0]);

void setup() {
    Serial.begin(115200);
    Serial.println("시작! G0~G3에 연결된 가변저항을 돌려봐");
}

void loop() {
    for (int i = 0; i < CH_COUNT; i++) {
        int raw = analogRead(adcPins[i]);
        float voltage = raw * (3.3f / 4095.0f);

        Serial.print("G");
        Serial.print(adcPins[i]);
        Serial.print(": ");
        Serial.print(raw);
        Serial.print(" (");
        Serial.print(voltage, 2);
        Serial.print("V)   ");
    }
    Serial.println();   // 줄 바꿈
    delay(1000);
}
