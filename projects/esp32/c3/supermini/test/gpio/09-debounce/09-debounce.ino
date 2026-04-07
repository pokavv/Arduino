/*
 * 1-09 버튼 노이즈 제거 (디바운싱)
 *
 * "디바운싱"이 왜 필요한가?
 *   버튼 안에는 금속 접점이 있는데, 누르는 순간 스프링처럼 여러 번 튕긴다.
 *   그래서 한 번 눌렀는데 코드는 5~10번 눌린 것처럼 읽을 수 있다.
 *   이걸 막는 것이 디바운싱.
 *
 * 해결 방법:
 *   버튼 상태가 바뀌면, 그 상태가 20ms 동안 계속 유지될 때만 진짜 입력으로 인정.
 *   20ms 안에 다시 바뀌면 타이머 리셋 → 안정될 때까지 기다린다.
 *
 * 어떤 버튼을 누르나?
 *   보드에 "BOOT"라고 적힌 버튼 (G9에 연결됨). 그걸 누르면 된다.
 *
 * 연결 방법:
 *   G2번 핀 → 저항(220옴) → LED → GND  (LED만 연결)
 *   버튼은 보드의 BOOT 버튼 사용 (G9)
 */

#include "config.h"

bool ledState      = false;
bool lastRawButton = HIGH;    // 방금 읽은 버튼 상태
bool stableButton  = HIGH;    // 안정화 확인된 버튼 상태
unsigned long lastChangeTime = 0;   // 마지막으로 버튼 상태가 바뀐 시간

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    Serial.println("시작! BOOT 버튼을 빠르게 눌러도 한 번만 반응해");
}

void loop() {
    bool rawButton = digitalRead(BUTTON_PIN);   // 지금 버튼 상태

    // 버튼 상태가 바뀌면 타이머를 지금 시간으로 리셋
    if (rawButton != lastRawButton) {
        lastChangeTime = millis();   // millis() = 보드가 켜진 이후 경과한 ms
        lastRawButton = rawButton;
    }

    // 마지막으로 바뀐 이후로 DEBOUNCE_MS(20ms) 동안 변화 없으면 → 안정된 상태
    if (millis() - lastChangeTime >= DEBOUNCE_MS) {
        if (rawButton != stableButton) {
            stableButton = rawButton;

            // 안정화된 상태에서 LOW면 → 진짜 버튼 누름
            if (stableButton == LOW) {
                ledState = !ledState;
                digitalWrite(LED_PIN, ledState ? HIGH : LOW);
                Serial.print("LED → ");
                Serial.println(ledState ? "켜짐" : "꺼짐");
            }
        }
    }
}
