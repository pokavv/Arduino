/*
 * 2-07 토양 수분 감지 센서
 *
 * 어떻게 동작하나?
 *   두 개의 금속 봉을 흙에 꽂으면, 흙이 젖어 있을수록 전기가 잘 흐른다.
 *   전기가 잘 흐를수록 → 저항 낮아짐 → 읽는 숫자 낮아짐.
 *   완전히 건조한 흙: 숫자 높음 (3000~4095)
 *   물에 담근 상태:   숫자 낮음 (0~1000)
 *
 * 주의사항:
 *   이 센서를 항상 전원에 연결해두면 금속 봉이 전기분해로 녹아버린다.
 *   그래서 측정할 때만 전원을 켜고, 바로 끄는 방식을 사용한다.
 *   전원을 G2 핀으로 연결해서 코드로 켜고 끈다.
 *
 * 연결 방법:
 *   ESP32 G2번 핀 → 센서 VCC (전원 핀)
 *   ESP32 G0번 핀 → 센서 AOUT (아날로그 출력 핀)
 *   ESP32 GND → 센서 GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    pinMode(SENSOR_VCC_PIN, OUTPUT);
    digitalWrite(SENSOR_VCC_PIN, LOW);   // 시작할 때 센서 전원 꺼두기
    Serial.println("시작! 센서를 흙에 꽂아봐");
}

void loop() {
    // 측정 직전에만 전원 켜기 (금속 봉 보호)
    digitalWrite(SENSOR_VCC_PIN, HIGH);
    delay(100);   // 전원 켜고 0.1초 기다려서 안정화

    int raw = analogRead(SOIL_PIN);

    digitalWrite(SENSOR_VCC_PIN, LOW);   // 측정 끝나면 바로 전원 끄기

    // 건조=4095, 습윤=0 기준으로 수분 퍼센트 계산
    int moisture = map(raw, WET_VALUE, DRY_VALUE, 100, 0);
    moisture = constrain(moisture, 0, 100);   // 0~100 범위 벗어나지 않게 제한

    Serial.print("센서값: ");
    Serial.print(raw);
    Serial.print("  →  수분: ");
    Serial.print(moisture);
    Serial.println("%");

    delay(2000);   // 2초에 한 번 측정
}
