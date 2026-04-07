/*
 * 2-09 배터리 전압 모니터링 (분압)
 *
 * ESP32-C3 ADC 최대 입력: 3.3V
 * 배터리 전압(예: LiPo 4.2V)은 그대로 연결 불가 → 분압 회로 필요.
 *
 * 분압 회로 (R1=100kΩ, R2=100kΩ → 절반으로 분압):
 *   배터리+ → R1 → G0(측정점) → R2 → GND
 *   실제 전압 = ADC 전압 * (R1+R2)/R2
 *
 * 예) 4.2V 배터리, R1=R2=100kΩ:
 *   G0 = 2.1V → raw ≈ 2606
 *   실제 = 2.1 * 2 = 4.2V
 *
 * 회로:
 *   배터리+ → 100kΩ → G0 → 100kΩ → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("battery-voltage 시작");
    Serial.print("분압 비율(배수): ");
    Serial.println(DIVIDER_RATIO, 2);
}

void loop() {
    int raw = analogRead(BATT_PIN);
    float adcVoltage  = raw * (3.3f / 4095.0f);
    float battVoltage = adcVoltage * DIVIDER_RATIO;

    // 배터리 잔량 추정 (LiPo: 4.2V = 100%, 3.0V = 0%)
    int percent = map((int)(battVoltage * 100), 300, 420, 0, 100);
    percent = constrain(percent, 0, 100);

    Serial.print("ADC: ");
    Serial.print(adcVoltage, 3);
    Serial.print("V  배터리: ");
    Serial.print(battVoltage, 2);
    Serial.print("V  잔량: ");
    Serial.print(percent);
    Serial.println("%");

    delay(1000);
}
