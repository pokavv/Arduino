/*
 * 1-05 버튼으로 LED 켜고 끄기 (토글)
 * ================================================================
 *
 * [준비물]
 *   LED 1개, 220Ω 저항 1개
 *   버튼은 보드의 BOOT 버튼(G9) 사용 — 따로 안 사도 됨
 *
 * [연결 방법]
 *   G2 핀 → 저항(220Ω) → LED 긴 다리(+) → LED 짧은 다리(-) → GND
 *   버튼은 보드의 BOOT 버튼 그냥 사용 (G9에 이미 연결됨)
 *
 *   LED 방향 주의:
 *     긴 다리(+) = G2 방향 (전기 들어오는 쪽)
 *     짧은 다리(-) = GND 방향 (전기 나가는 쪽)
 *     반대로 꽂으면 안 켜진다!
 *
 * [이 예제에서 배우는 것]
 *   누를 때마다 ON/OFF 전환하는 "토글" 동작.
 *
 *   단순하게 "버튼이 LOW면 LED 켜" 라고 하면 문제가 있다.
 *   버튼을 1초 동안 꾹 누르면 loop()가 수백 번 실행되어
 *   LED가 수백 번 켜졌다 꺼졌다 반복된다.
 *
 *   해결 방법:
 *   이전 상태와 현재 상태를 비교해서
 *   "방금 막 눌렸다"는 그 순간만 잡아내면 된다.
 *   이전=HIGH이고 현재=LOW면 → 방금 눌린 것 → 한 번만 토글
 */

#include "config.h"

bool ledState   = false;   // LED 현재 상태 (false=꺼짐, true=켜짐)
bool lastButton = HIGH;    // 직전에 읽은 버튼 상태 (PULLUP이라 기본값 HIGH)

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);   // 처음엔 LED 꺼진 상태
    Serial.println("시작! BOOT 버튼을 누를 때마다 LED가 켜지고 꺼져");
}

void loop() {
    bool currentButton = digitalRead(BUTTON_PIN);   // 지금 버튼 상태

    // 이전=HIGH, 현재=LOW → 방금 버튼이 눌린 바로 그 순간
    if (lastButton == HIGH && currentButton == LOW) {
        ledState = !ledState;   // true↔false 반전
        digitalWrite(LED_PIN, ledState ? HIGH : LOW);
        Serial.print("LED → ");
        Serial.println(ledState ? "켜짐" : "꺼짐");
    }

    lastButton = currentButton;   // 다음 비교를 위해 현재 상태 저장
    delay(20);   // 0.02초 기다리기 (버튼 노이즈 줄여줌)
}
