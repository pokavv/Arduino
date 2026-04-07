/*
 * 1-02 내장 LED 깜빡이기
 * ================================================================
 *
 * [내장 LED란?]
 *   ESP32-C3 Super Mini 보드에 처음부터 납땜되어 있는 아주 작은 LED.
 *   보드를 보면 'G8' 핀 근처에 작은 빛나는 부품이 있는데 그게 내장 LED다.
 *   따로 LED를 연결하지 않아도 테스트할 수 있다.
 *
 * [중요! 내장 LED는 켜는 방향이 반대다]
 *   일반적인 LED:
 *     HIGH (3.3V 내보내기) → 켜짐
 *     LOW  (전기 없음)    → 꺼짐
 *
 *   내장 LED (G8):
 *     LOW  (전기 없음)    → 켜짐  ← 반대!
 *     HIGH (3.3V 내보내기) → 꺼짐 ← 반대!
 *
 *   왜 반대냐?
 *     내장 LED의 + 쪽이 3.3V에 이미 연결되어 있고,
 *     - 쪽이 G8에 연결된 구조이기 때문이다.
 *     G8을 LOW(0V)로 내리면 전위차 생겨 전기 흐름 → 켜짐.
 *     이런 방식을 "Active LOW"라고 부른다.
 *
 * [준비물]
 *   없음 — 보드에 이미 내장되어 있음
 *
 * [연결 방법]
 *   없음 — 그냥 업로드하면 됨
 */

#include "config.h"

void setup() {
    Serial.begin(115200);

    // G8 핀을 출력 모드로 설정
    pinMode(BUILTIN_LED_PIN, OUTPUT);

    // 처음 시작 시 LED 꺼두기
    // 내장 LED는 반대라서 HIGH = 꺼짐
    digitalWrite(BUILTIN_LED_PIN, HIGH);

    Serial.println("시작! 보드의 내장 LED가 깜빡일 거야");
}

void loop() {
    digitalWrite(BUILTIN_LED_PIN, LOW);    // LOW = 켜짐 (내장 LED는 반대!)
    Serial.println("내장 LED 켜짐");
    delay(500);   // 0.5초

    digitalWrite(BUILTIN_LED_PIN, HIGH);   // HIGH = 꺼짐 (내장 LED는 반대!)
    Serial.println("내장 LED 꺼짐");
    delay(500);
}
