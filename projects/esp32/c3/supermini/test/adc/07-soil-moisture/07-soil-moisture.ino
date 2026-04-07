/*
 * 2-07 토양 수분 센서
 *
 * 저항식 토양 수분 센서: 흙이 젖을수록 저항 감소 → ADC 값 감소.
 * 완전히 건조: raw 높음 (약 3000~4095)
 * 물에 담금:   raw 낮음 (약 0~1000)
 *
 * 주의: 저항식 센서는 장시간 사용 시 전극 부식 → 측정 직전에만 전원 공급 권장.
 * VCC 핀을 GPIO로 연결해 측정 시에만 켜는 방법 사용.
 *
 * 회로:
 *   G2 → 센서 VCC (측정할 때만 켬)
 *   G0 → 센서 AOUT
 *   센서 GND → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    // 센서 전원 핀을 출력으로 설정
    pinMode(SENSOR_VCC_PIN, OUTPUT);
    digitalWrite(SENSOR_VCC_PIN, LOW);  // 기본 OFF
    Serial.println("soil-moisture 시작");
}

void loop() {
    // 측정 직전에만 전원 공급 (전극 부식 방지)
    digitalWrite(SENSOR_VCC_PIN, HIGH);
    delay(100);  // 센서 안정화 대기

    int raw = analogRead(SOIL_PIN);

    digitalWrite(SENSOR_VCC_PIN, LOW);  // 전원 OFF

    // 수분 퍼센트 변환 (건조=4095, 습윤=0 기준 반전)
    int moisture = map(raw, WET_VALUE, DRY_VALUE, 100, 0);
    moisture = constrain(moisture, 0, 100);  // 범위 초과 방지

    Serial.print("raw: ");
    Serial.print(raw);
    Serial.print("  수분: ");
    Serial.print(moisture);
    Serial.println("%");

    delay(2000);
}
