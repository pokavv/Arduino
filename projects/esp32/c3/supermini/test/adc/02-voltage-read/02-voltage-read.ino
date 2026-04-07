/*
 * 2-02 읽은 숫자를 실제 전압(V)으로 바꾸기
 *
 * 01-basic-read에서 읽은 숫자(0~4095)는 전압이 아니다.
 * 이걸 실제 전압(0.0V ~ 3.3V)으로 바꾸려면 계산이 필요하다.
 *
 * 계산 방법:
 *   4095 → 3.3V 라면
 *   raw  → raw × (3.3 ÷ 4095)
 *
 * 참고:
 *   ESP32의 아날로그 읽기는 완벽하지 않아서 아주 낮거나(0V 근처)
 *   아주 높은(3.3V 근처) 전압에서는 오차가 생길 수 있다.
 *
 * 연결 방법:
 *   가변저항 왼쪽 → GND, 가운데 → G0, 오른쪽 → 3.3V
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

    Serial.print("숫자값: ");
    Serial.print(raw);
    Serial.print("  →  전압: ");
    Serial.print(voltage, 2);   // 소수점 2자리로 출력
    Serial.println(" V");

    delay(500);
}
