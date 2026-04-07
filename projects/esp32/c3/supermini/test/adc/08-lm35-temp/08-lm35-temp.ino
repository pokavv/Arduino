/*
 * 2-08 LM35 온도 센서로 온도 재기
 *
 * "LM35"란?
 *   다리 3개짜리 온도 센서 부품.
 *   온도가 1도 올라갈 때마다 출력 전압이 10mV 올라간다.
 *   0°C = 0V, 25°C = 0.25V, 100°C = 1.0V
 *
 * 온도 계산 방법:
 *   1. analogRead()로 숫자(0~4095) 읽기
 *   2. 숫자 → mV(밀리볼트)로 변환: 숫자 × (3300 ÷ 4095)
 *   3. mV → 온도: mV ÷ 10 = °C
 *
 * 연결 방법:
 *   LM35 왼쪽 다리(VCC) → 3.3V
 *   LM35 가운데 다리(VOUT) → G0
 *   LM35 오른쪽 다리(GND) → GND
 *   ※ LM35의 앞면(글자 있는 면)을 보고 왼쪽이 VCC다.
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("시작! LM35 온도 센서 테스트");
}

void loop() {
    int raw = analogRead(LM35_PIN);

    // 숫자(0~4095) → mV → 온도(°C) 계산
    float millivolts = raw * (3300.0f / 4095.0f);   // mV 변환
    float tempC = millivolts / 10.0f;                // mV ÷ 10 = °C

    Serial.print("숫자값: ");
    Serial.print(raw);
    Serial.print("  →  온도: ");
    Serial.print(tempC, 1);   // 소수점 1자리
    Serial.println(" °C");

    delay(1000);
}
