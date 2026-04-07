/*
 * 2-09 배터리 전압 측정하기
 *
 * 문제:
 *   리튬 배터리는 최대 4.2V인데, ESP32-C3는 3.3V까지만 읽을 수 있다.
 *   4.2V를 직접 G0에 연결하면 보드가 망가진다!
 *
 * 해결 — 분압 회로:
 *   저항 2개를 직렬로 연결하면 전압을 반으로 낮출 수 있다.
 *   배터리(4.2V) → 100kΩ 저항 → G0(측정) → 100kΩ 저항 → GND
 *   G0에서 읽히는 전압 = 4.2V ÷ 2 = 2.1V (안전한 범위!)
 *   실제 배터리 전압 = G0에서 읽은 전압 × 2 (다시 2배 곱하기)
 *
 * 연결 방법:
 *   배터리+ → 100kΩ 저항 → G0 → 100kΩ 저항 → GND
 *   배터리- → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("시작! 배터리 전압 모니터링");
}

void loop() {
    int raw = analogRead(BATT_PIN);
    float adcVoltage  = raw * (3.3f / 4095.0f);           // G0에서 읽은 전압
    float battVoltage = adcVoltage * DIVIDER_RATIO;        // 저항으로 낮춘 만큼 다시 곱하기

    // 리튬 배터리 잔량 추정 (4.2V = 100%, 3.0V = 0%)
    int percent = map((int)(battVoltage * 100), 300, 420, 0, 100);
    percent = constrain(percent, 0, 100);

    Serial.print("핀 전압: ");
    Serial.print(adcVoltage, 3);
    Serial.print("V  |  배터리: ");
    Serial.print(battVoltage, 2);
    Serial.print("V  |  잔량: ");
    Serial.print(percent);
    Serial.println("%");

    delay(1000);
}
