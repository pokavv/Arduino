/*
 * 1-02 내장 LED 깜빡이기
 *
 * "내장 LED"란?
 *   ESP32-C3 Super Mini 보드에 처음부터 납땜되어 있는 작은 LED.
 *   G8번 핀에 연결되어 있다.
 *
 * ※ 주의: 이 LED는 일반 LED와 켜는 방식이 반대다!
 *   보통 LED: HIGH(전기 내보내기) = 켜짐
 *   내장 LED: LOW(전기 멈추기)  = 켜짐  ← 반대!
 *             HIGH(전기 내보내기) = 꺼짐 ← 반대!
 *   이런 방식을 "Active LOW"라고 부른다.
 *
 * 연결: 따로 연결할 것 없음 (보드에 이미 있음)
 */

#include "config.h"

void setup() {
    Serial.begin(115200);

    // 내장 LED 핀을 출력으로 설정
    pinMode(BUILTIN_LED_PIN, OUTPUT);

    // 처음 시작할 때 꺼진 상태로 — 내장 LED는 반대라서 HIGH가 꺼짐
    digitalWrite(BUILTIN_LED_PIN, HIGH);

    Serial.println("시작! 내장 LED가 깜빡일 거야");
}

void loop() {
    digitalWrite(BUILTIN_LED_PIN, LOW);    // LOW = 켜짐 (반대라는 거 기억!)
    Serial.println("내장 LED 켜짐");
    delay(500);   // 0.5초 기다리기

    digitalWrite(BUILTIN_LED_PIN, HIGH);   // HIGH = 꺼짐 (반대!)
    Serial.println("내장 LED 꺼짐");
    delay(500);
}
