/*
 * 2-01 기본 ADC 읽기 (0~4095)
 *
 * ESP32-C3는 12비트 ADC → 값 범위 0~4095.
 * (일반 Arduino는 10비트 → 0~1023)
 * analogRead()로 핀의 아날로그 전압을 디지털 값으로 읽는다.
 *
 * 회로:
 *   G0 → 가변저항 중간 단자
 *   가변저항 한쪽 → 3.3V, 반대쪽 → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("basic-read 시작");
    Serial.println("ADC 핀: " + String(ADC_PIN) + ", 해상도: 12비트 (0~4095)");
}

void loop() {
    int raw = analogRead(ADC_PIN);  // 0~4095
    Serial.print("ADC raw: ");
    Serial.println(raw);
    delay(500);
}
