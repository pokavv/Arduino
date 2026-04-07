/*
 * 2-05 가변저항으로 값 조절하기
 *
 * "가변저항(포텐셔미터)"이란?
 *   돌릴 수 있는 손잡이가 있는 저항. 돌리면 저항값이 변해서
 *   ESP32에 들어오는 전압이 0V ~ 3.3V 사이에서 바뀐다.
 *
 * map() 함수:
 *   숫자 범위를 다른 범위로 바꿔주는 편리한 함수.
 *   예: 0~4095 범위를 0~100 범위로 바꾸고 싶을 때 사용.
 *   map(값, 원래최소, 원래최대, 바꿀최소, 바꿀최대)
 *
 * 연결 방법:
 *   가변저항 왼쪽 다리 → GND
 *   가변저항 가운데 다리 → G0
 *   가변저항 오른쪽 다리 → 3.3V
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("시작! 가변저항을 돌려봐");
}

void loop() {
    int raw = analogRead(POT_PIN);

    // 0~4095 숫자를 0~100 퍼센트로 변환
    int percent = map(raw, 0, 4095, 0, 100);

    float voltage = raw * (3.3f / 4095.0f);

    Serial.print("숫자값: ");
    Serial.print(raw);
    Serial.print("  |  전압: ");
    Serial.print(voltage, 2);
    Serial.print("V  |  퍼센트: ");
    Serial.print(percent);
    Serial.println("%");

    delay(200);
}
