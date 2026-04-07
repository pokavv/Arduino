/*
 * 2-05 가변저항 읽기
 *
 * 가변저항(포텐셔미터)으로 아날로그 값을 조절하는 가장 일반적인 입력 예제.
 * map() 함수로 ADC 범위를 원하는 범위로 변환하는 방법도 함께 보여준다.
 *
 * 회로:
 *   가변저항 왼쪽 → GND
 *   가변저항 가운데 → G0
 *   가변저항 오른쪽 → 3.3V
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("potentiometer 시작");
    Serial.println("가변저항을 돌려보세요");
}

void loop() {
    int raw = analogRead(POT_PIN);

    // map(): 0~4095 범위를 0~100 퍼센트로 변환
    int percent = map(raw, 0, 4095, 0, 100);

    float voltage = raw * (3.3f / 4095.0f);

    Serial.print("raw: ");
    Serial.print(raw);
    Serial.print("  |  ");
    Serial.print(voltage, 2);
    Serial.print("V  |  ");
    Serial.print(percent);
    Serial.println("%");

    delay(200);
}
