/*
 * 2-02 읽은 숫자를 실제 전압(V)으로 변환하기
 * ================================================================
 *
 * [왜 변환이 필요하나?]
 *   analogRead()는 전압 자체가 아닌 0~4095 사이의 숫자를 반환한다.
 *   실제로 핀에 몇 V가 걸려있는지 알려면 계산이 필요하다.
 *
 * [계산 공식]
 *   4095 = 3.3V 이므로
 *   전압(V) = 읽은 숫자 ÷ 4095 × 3.3
 *
 *   예시:
 *   숫자 2048 → 2048 ÷ 4095 × 3.3 ≈ 1.65V (딱 중간)
 *   숫자 4095 → 3.3V
 *   숫자    0 → 0V
 *
 * [주의]
 *   ESP32의 아날로그 읽기는 완벽하지 않다.
 *   특히 0V 근처와 3.3V 근처에서 오차가 발생할 수 있다.
 *   정밀한 전압 측정이 필요하면 별도의 ADC 칩을 써야 한다.
 *
 * [준비물 / 연결 방법]
 *   01-basic-read와 동일 (가변저항 → G0)
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("시작! 가변저항을 돌려봐 — 전압 변화를 볼 수 있어");
}

void loop() {
    int raw = analogRead(ADC_PIN);

    // 숫자(0~4095)를 전압(0.0~3.3V)으로 변환
    float voltage = raw * (ADC_VREF / ADC_MAX);

    Serial.print("숫자: ");
    Serial.print(raw);
    Serial.print("  →  전압: ");
    Serial.print(voltage, 2);   // 소수점 2자리
    Serial.println(" V");

    delay(500);
}
