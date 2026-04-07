/*
 * 2-07 토양 수분 감지 센서
 * ================================================================
 *
 * [센서 동작 원리]
 *   두 금속 봉이 흙에 꽂혀 있을 때, 흙에 물이 많으면 전기가 잘 통한다.
 *   전기가 잘 통할수록 → 저항 낮아짐 → 읽는 숫자 낮아짐.
 *
 *   완전히 건조한 흙: 약 3000~4095 (전기 거의 안 통함)
 *   물에 담근 상태:   약 0~1000   (전기 잘 통함)
 *
 * [주의 — 전극 부식 문제]
 *   저항식 수분 센서의 금속 봉을 항상 전원에 연결해두면
 *   물과 전기의 반응(전기분해)으로 금속 봉이 서서히 녹아버린다.
 *   그래서 측정할 때만 전원을 켜고, 측정이 끝나면 바로 끈다.
 *   ESP32 G2 핀을 센서 전원으로 써서 코드로 껐다 켰다 한다.
 *
 * [센서 모듈 핀 설명]
 *   VCC  : 전원 (이걸 G2 핀에 연결해서 제어)
 *   GND  : 접지
 *   AOUT : 아날로그 출력 (수분에 따라 전압이 변하는 핀 → G0에 연결)
 *   DOUT : 디지털 출력 (임계값 넘으면 HIGH/LOW — 이 예제에서는 안 씀)
 *
 * [준비물]
 *   토양 수분 센서 모듈 1개
 *
 * [연결 방법]
 *   센서 VCC  → ESP32 G2 핀 (전원을 코드로 껐다 켰다)
 *   센서 GND  → ESP32 GND 핀
 *   센서 AOUT → ESP32 G0 핀
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    pinMode(SENSOR_VCC_PIN, OUTPUT);
    digitalWrite(SENSOR_VCC_PIN, LOW);   // 시작할 때 센서 전원 꺼두기
    Serial.println("시작! 센서를 흙에 꽂거나 물에 담가봐");
}

void loop() {
    // 측정 직전에만 전원 켜기 (금속 봉 부식 방지)
    digitalWrite(SENSOR_VCC_PIN, HIGH);
    delay(100);   // 전원 켜고 0.1초 기다려서 값이 안정화되도록

    int raw = analogRead(SOIL_PIN);

    digitalWrite(SENSOR_VCC_PIN, LOW);   // 측정 끝나면 즉시 전원 끄기

    // 건조(높은 값)~습윤(낮은 값) 기준으로 퍼센트 계산
    // WET_VALUE와 DRY_VALUE는 config.h에서 실제 센서로 측정해서 설정
    int moisture = map(raw, WET_VALUE, DRY_VALUE, 100, 0);
    moisture = constrain(moisture, 0, 100);   // 0~100 범위 밖으로 나가지 않게 제한

    Serial.print("센서값: ");
    Serial.print(raw);
    Serial.print("  →  수분: ");
    Serial.print(moisture);
    Serial.println("%");

    delay(2000);   // 2초에 한 번 측정
}
