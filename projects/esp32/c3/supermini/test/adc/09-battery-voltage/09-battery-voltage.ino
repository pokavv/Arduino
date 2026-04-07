/*
 * 2-09 배터리 전압 측정하기 (분압 회로)
 * ================================================================
 *
 * [문제 — 왜 직접 연결하면 안 되나?]
 *   ESP32-C3의 G0 핀은 최대 3.3V까지만 받을 수 있다.
 *   리튬 배터리는 최대 4.2V → 그대로 꽂으면 보드 손상!
 *
 * [해결 — 분압 회로]
 *   저항 2개를 직렬(연속)으로 연결하면 전압을 낮출 수 있다.
 *   같은 크기의 저항 2개를 쓰면 전압이 정확히 절반이 된다.
 *
 *   배터리(4.2V) → 100kΩ → G0 → 100kΩ → GND
 *
 *   G0에서 읽히는 전압 = 4.2V ÷ 2 = 2.1V (3.3V 이하라 안전!)
 *   실제 배터리 전압 = G0 전압 × 2 (절반으로 낮췄으니 다시 2배)
 *
 * [저항 크기는 왜 100kΩ인가?]
 *   배터리에서 저항을 통해 계속 전류가 흐르면 배터리가 소모된다.
 *   큰 저항(100kΩ)을 쓰면 흐르는 전류가 매우 작아서 배터리 소모가 적다.
 *
 * [준비물]
 *   100kΩ 저항 2개
 *
 * [연결 방법]
 *   배터리 + → 100kΩ 저항1 → G0 핀 → 100kΩ 저항2 → GND 핀
 *   배터리 - → GND 핀
 *
 *   그림:
 *   [배터리+] ─ [100kΩ] ─ [G0] ─ [100kΩ] ─ [GND] ─ [배터리-]
 *                               ↑ 여기서 읽음
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("시작! 배터리 전압 모니터링");
    Serial.print("분압 배수: ");
    Serial.println(DIVIDER_RATIO);
}

void loop() {
    int raw = analogRead(BATT_PIN);

    float adcVoltage  = raw * (3.3f / 4095.0f);        // G0 핀에서 읽은 전압
    float battVoltage = adcVoltage * DIVIDER_RATIO;     // 절반으로 낮췄으니 다시 곱하기

    // 리튬 배터리 잔량 추정 (4.2V = 100%, 3.0V = 0%)
    int percent = map((int)(battVoltage * 100), 300, 420, 0, 100);
    percent = constrain(percent, 0, 100);

    Serial.print("G0 핀 전압: ");
    Serial.print(adcVoltage, 3);
    Serial.print("V  |  실제 배터리: ");
    Serial.print(battVoltage, 2);
    Serial.print("V  |  잔량: ");
    Serial.print(percent);
    Serial.println("%");

    delay(1000);
}
