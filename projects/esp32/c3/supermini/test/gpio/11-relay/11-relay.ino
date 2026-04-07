/*
 * 1-11 릴레이 모듈 제어
 *
 * 릴레이는 대부분 Active LOW (LOW = 코일 활성화 = 접점 닫힘).
 * 고전압/고전류 부하(AC 조명 등)를 ESP32로 제어할 때 사용.
 * 릴레이 코일 구동은 GPIO 직접이 아닌 트랜지스터/모스펫 내장 모듈 사용 권장.
 *
 * 회로:
 *   G2 → 릴레이 모듈 IN 핀
 *   릴레이 모듈 VCC → 5V 또는 3.3V (모듈 스펙 확인)
 *   릴레이 모듈 GND → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    pinMode(RELAY_PIN, OUTPUT);

    // 시작 시 릴레이 OFF (Active LOW이므로 HIGH = OFF)
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("relay 시작 — 초기 상태: OFF");
}

void loop() {
    // 릴레이 ON (Active LOW)
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("릴레이 ON (접점 닫힘)");
    delay(2000);

    // 릴레이 OFF
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("릴레이 OFF (접점 열림)");
    delay(2000);
}
