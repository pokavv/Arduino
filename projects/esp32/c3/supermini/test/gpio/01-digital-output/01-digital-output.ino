/*
 * 1-01 디지털 출력 — LED 켜고 끄기
 *
 * "디지털 출력"이란?
 *   핀에서 전기를 내보내거나(HIGH = 3.3V) 멈추는(LOW = 0V) 것.
 *   전기가 나오면 LED가 켜지고, 멈추면 꺼진다.
 *
 * ※ 이 예제는 보드 바깥에 직접 연결한 LED용이다.
 *    보드에 붙어있는 작은 LED(내장 LED)는 02-builtin-led 예제를 쓸 것.
 *
 * 준비물: LED 1개 + 220옴 저항 1개
 *
 * 연결 방법:
 *   ESP32 G2번 핀 → 저항(220옴) → LED 긴 다리(+) → LED 짧은 다리(-) → GND(접지)
 */

#include "config.h"

void setup() {
    Serial.begin(115200);

    // G2번 핀을 "출력"으로 설정 — 이 핀에서 전기를 내보낼 것이라고 알려주는 것
    pinMode(LED_PIN, OUTPUT);

    Serial.println("시작!");
}

void loop() {
    digitalWrite(LED_PIN, HIGH);   // HIGH = 전기 내보내기 → LED 켜짐
    Serial.println("LED ON");
    delay(1000);                   // 1000ms = 1초 기다리기

    digitalWrite(LED_PIN, LOW);    // LOW = 전기 멈추기 → LED 꺼짐
    Serial.println("LED OFF");
    delay(1000);
}
