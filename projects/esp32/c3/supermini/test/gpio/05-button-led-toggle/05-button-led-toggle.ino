/*
 * 1-05 버튼으로 LED 켜고 끄기 (토글)
 *
 * "토글"이란?
 *   누를 때마다 상태를 바꾸는 것. ON → OFF → ON → OFF ...
 *
 * 핵심 포인트:
 *   버튼을 꾹 누르고 있으면 어떻게 될까?
 *   loop()가 계속 실행되니까 LED가 미친 듯이 깜빡일 것이다.
 *   그래서 버튼이 "막 눌리는 그 순간"만 감지해야 한다.
 *   이전 상태(lastButton)와 현재 상태(currentButton)를 비교해서
 *   "방금 눌렸다"는 순간만 잡아낸다.
 *
 * 어떤 버튼을 누르나?
 *   보드에 "BOOT"라고 적힌 버튼 (G9에 연결됨). 그걸 누르면 된다.
 *
 * 연결 방법:
 *   G2번 핀 → 저항(220옴) → LED → GND  (LED만 연결하면 됨)
 *   버튼은 보드의 BOOT 버튼 사용 (G9, 따로 안 연결해도 됨)
 */

#include "config.h"

bool ledState   = false;   // LED 현재 상태 (false = 꺼짐, true = 켜짐)
bool lastButton = HIGH;    // 직전에 읽은 버튼 상태 (PULLUP이라 기본값은 HIGH)

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);   // 처음엔 LED 꺼진 상태로 시작
    Serial.println("시작! BOOT 버튼을 누를 때마다 LED가 켜지고 꺼져");
}

void loop() {
    bool currentButton = digitalRead(BUTTON_PIN);   // 지금 버튼 상태 읽기

    // 이전에 HIGH였는데 지금 LOW면 → 방금 버튼이 눌린 것
    if (lastButton == HIGH && currentButton == LOW) {
        ledState = !ledState;                              // 상태 반전 (true↔false)
        digitalWrite(LED_PIN, ledState ? HIGH : LOW);      // LED에 반영
        Serial.print("LED → ");
        Serial.println(ledState ? "켜짐" : "꺼짐");
    }

    lastButton = currentButton;   // 다음 비교를 위해 현재 상태 저장
    delay(20);   // 20ms 쉬기 (버튼 노이즈 방지)
}
