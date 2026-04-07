/*
 * 1-11 릴레이 모듈 제어
 *
 * "릴레이"란?
 *   전기로 작동하는 스위치. ESP32(3.3V 소전력)로 220V 가전제품 같은
 *   고전압/대전류 기기를 켜고 끌 수 있게 해주는 부품.
 *   ESP32와 고전압 회로를 물리적으로 분리시켜줘서 안전하다.
 *
 * 주의: 릴레이 모듈은 보통 신호가 반대다!
 *   LOW  → 릴레이 ON  (스위치 닫힘 = 전기 흐름)
 *   HIGH → 릴레이 OFF (스위치 열림 = 전기 안 흐름)
 *   이런 방식을 "Active LOW"라고 한다. (내장 LED와 같은 방식)
 *
 * 연결 방법:
 *   ESP32 G2번 핀 → 릴레이 모듈 IN 핀
 *   릴레이 모듈 VCC → 5V 또는 3.3V (모듈 스펙 확인)
 *   릴레이 모듈 GND → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    pinMode(RELAY_PIN, OUTPUT);

    // 시작할 때 릴레이 꺼진 상태로 — 반대 방식이라 HIGH가 꺼짐
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("시작! 릴레이가 2초마다 켜지고 꺼질 거야");
}

void loop() {
    digitalWrite(RELAY_PIN, LOW);    // LOW = 릴레이 켜짐 (반대라는 거 기억!)
    Serial.println("릴레이 ON → 연결된 기기에 전기 흐름");
    delay(2000);

    digitalWrite(RELAY_PIN, HIGH);   // HIGH = 릴레이 꺼짐
    Serial.println("릴레이 OFF → 전기 차단");
    delay(2000);
}
