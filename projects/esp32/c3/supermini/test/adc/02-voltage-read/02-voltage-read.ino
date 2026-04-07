/*
 * 2-02 ADC → 전압 변환 (0~3.3V)
 *
 * raw 값(0~4095)을 실제 전압(0.0~3.3V)으로 변환.
 * 공식: voltage = raw * (3.3 / 4095)
 * ESP32 ADC는 비선형성이 있어 끝단(0V, 3.3V 근처)에서 오차 발생 가능.
 *
 * 회로:
 *   G0 → 가변저항 중간 단자
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("voltage-read 시작");
}

void loop() {
    int raw = analogRead(ADC_PIN);
    float voltage = raw * (ADC_VREF / ADC_MAX);

    Serial.print("raw: ");
    Serial.print(raw);
    Serial.print("  →  전압: ");
    Serial.print(voltage, 2);   // 소수점 2자리
    Serial.println(" V");

    delay(500);
}
