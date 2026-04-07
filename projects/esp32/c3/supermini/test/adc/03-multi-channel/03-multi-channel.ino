/*
 * 2-03 아날로그 핀 여러 개 동시에 읽기
 * ================================================================
 *
 * [여러 센서를 동시에 연결하고 싶을 때]
 *   ESP32-C3는 G0~G4, 총 5개 핀에서 아날로그 값을 읽을 수 있다.
 *   하나의 loop() 안에서 순서대로 읽으면 된다.
 *
 * [주의사항]
 *   나중에 Wi-Fi 기능을 함께 쓰면 G5 이상 핀의 아날로그가 동작을 멈춘다.
 *   여러 센서를 쓸 때는 G0, G1, G2, G3, G4 범위 안에서 연결하는 게 안전하다.
 *
 * [준비물]
 *   가변저항 4개 (또는 각기 다른 센서)
 *
 * [연결 방법]
 *   가변저항1: 왼쪽→GND, 가운데→G0, 오른쪽→3.3V
 *   가변저항2: 왼쪽→GND, 가운데→G1, 오른쪽→3.3V
 *   가변저항3: 왼쪽→GND, 가운데→G2, 오른쪽→3.3V
 *   가변저항4: 왼쪽→GND, 가운데→G3, 오른쪽→3.3V
 */

#include "config.h"

const int adcPins[] = { CH0_PIN, CH1_PIN, CH2_PIN, CH3_PIN };
const int CH_COUNT  = sizeof(adcPins) / sizeof(adcPins[0]);

void setup() {
    Serial.begin(115200);
    Serial.println("시작! G0~G3에 연결된 가변저항을 각각 돌려봐");
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
