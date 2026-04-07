/*
 * 1-09 버튼 노이즈 제거 (디바운싱)
 * ================================================================
 *
 * [문제 — 버튼 안에서 무슨 일이 일어나나?]
 *   버튼 내부에는 금속 접점이 있다.
 *   버튼을 누르면 접점이 딱 한 번만 붙는 게 아니라
 *   스프링처럼 수십 번 튕기며 붙었다 떨어졌다를 반복한다.
 *   이 시간이 약 5~20ms 정도.
 *   코드는 이걸 "버튼을 10번 눌렀다"로 인식할 수 있다.
 *
 * [해결 방법 — 소프트웨어 디바운싱]
 *   버튼 상태가 바뀌면, 그 상태가 20ms 동안 변하지 않을 때만 진짜 입력으로 인정.
 *   20ms 안에 또 바뀌면 타이머를 리셋하고 다시 기다린다.
 *
 * [millis()란?]
 *   보드에 전원이 켜진 후 경과한 시간을 ms(밀리초) 단위로 반환하는 함수.
 *   1ms = 0.001초
 *   delay() 없이 시간을 측정할 때 사용한다.
 *
 * [준비물]
 *   LED 1개, 220Ω 저항 1개
 *   버튼은 보드의 BOOT 버튼 사용
 *
 * [연결 방법]
 *   G2 → 저항(220Ω) → LED 긴 다리(+) → LED 짧은 다리(-) → GND
 */

#include "config.h"

bool ledState      = false;
bool lastRawButton = HIGH;    // 방금 읽은 버튼 상태 (노이즈 포함 가능)
bool stableButton  = HIGH;    // 안정화된 것으로 확인된 버튼 상태
unsigned long lastChangeTime = 0;   // 버튼 상태가 마지막으로 바뀐 시각(ms)

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    Serial.println("시작! BOOT 버튼을 빠르게 연속으로 눌러도 한 번만 반응해");
}

void loop() {
    bool rawButton = digitalRead(BUTTON_PIN);   // 지금 버튼 상태 (노이즈 있을 수 있음)

    // 버튼 상태가 바뀌면 타이머를 지금 시각으로 리셋
    if (rawButton != lastRawButton) {
        lastChangeTime = millis();
        lastRawButton = rawButton;
    }

    // 마지막 변화 이후 DEBOUNCE_MS(20ms)가 지났으면 → 안정된 상태로 확정
    if (millis() - lastChangeTime >= DEBOUNCE_MS) {
        if (rawButton != stableButton) {
            stableButton = rawButton;

            if (stableButton == LOW) {   // 안정화 후 LOW = 확실한 버튼 누름
                ledState = !ledState;
                digitalWrite(LED_PIN, ledState ? HIGH : LOW);
                Serial.print("LED → ");
                Serial.println(ledState ? "켜짐" : "꺼짐");
            }
        }
    }
}
