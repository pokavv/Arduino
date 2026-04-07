/*
 * 1-11 릴레이 모듈 제어
 * ================================================================
 *
 * [릴레이란?]
 *   전기로 작동하는 스위치.
 *   ESP32는 3.3V 소전력 보드라 직접 큰 전기기기를 켤 수 없다.
 *   릴레이 모듈을 사용하면 ESP32의 작은 신호로
 *   220V 가전제품, 모터, 전구 등 고전력 기기를 안전하게 제어할 수 있다.
 *   ESP32 회로와 고전압 회로를 물리적으로 분리해주므로 안전하다.
 *
 * [릴레이 모듈 핀 설명]
 *   VCC : 전원 (5V 또는 3.3V — 모듈 겉면에 적힌 스펙 확인)
 *   GND : 접지
 *   IN  : 제어 신호 입력 (여기에 G2 핀 연결)
 *
 * [중요! 릴레이 모듈도 내장 LED처럼 신호가 반대다]
 *   IN 핀에 LOW 신호 → 릴레이 ON (스위치 닫힘 = 전기 흐름)
 *   IN 핀에 HIGH 신호 → 릴레이 OFF (스위치 열림 = 전기 차단)
 *   이것도 "Active LOW" 방식. (모듈에 따라 다를 수 있으므로 확인 필요)
 *
 * [연결 방법]
 *   릴레이 모듈 VCC → 5V 핀 (또는 3.3V, 모듈 스펙 확인)
 *   릴레이 모듈 GND → GND 핀
 *   릴레이 모듈 IN  → ESP32 G2 핀
 *
 * [주의]
 *   릴레이 뒤쪽 220V 쪽 배선은 전기 지식이 없으면 절대 건드리지 말 것!
 *   감전 위험이 있다.
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    pinMode(RELAY_PIN, OUTPUT);

    // 시작할 때 릴레이 꺼두기
    // Active LOW 방식이라 HIGH = 꺼짐
    digitalWrite(RELAY_PIN, HIGH);

    Serial.println("시작! 릴레이가 2초마다 켜지고 꺼질 거야");
    Serial.println("딸깍 소리가 들리면 정상 동작 중이야");
}

void loop() {
    digitalWrite(RELAY_PIN, LOW);    // LOW = 릴레이 켜짐 (스위치 닫힘)
    Serial.println("릴레이 ON — 딸깍");
    delay(2000);

    digitalWrite(RELAY_PIN, HIGH);   // HIGH = 릴레이 꺼짐 (스위치 열림)
    Serial.println("릴레이 OFF — 딸깍");
    delay(2000);
}
