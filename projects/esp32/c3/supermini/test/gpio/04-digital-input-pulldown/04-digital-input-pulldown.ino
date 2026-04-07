/*
 * 1-04 버튼 입력 읽기 (PULLDOWN 방식)
 * ================================================================
 *
 * [PULLUP vs PULLDOWN 비교]
 *
 *   PULLUP 방식 (03번 예제):
 *     버튼 → GND에 연결
 *     안 누름 → HIGH,  누름 → LOW
 *     내부 저항이 3.3V 방향으로 핀을 "위로 당김(pull up)"
 *
 *   PULLDOWN 방식 (이 예제):
 *     버튼 → 3.3V에 연결
 *     안 누름 → LOW,  누름 → HIGH
 *     내부 저항이 GND 방향으로 핀을 "아래로 당김(pull down)"
 *
 * [ESP32 전용 기능]
 *   일반 아두이노(우노 등)는 PULLDOWN이 없어서 외부 저항을 써야 한다.
 *   ESP32는 내부에 PULLDOWN 저항이 있어서 INPUT_PULLDOWN 설정 하나로 끝난다.
 *
 * [연결 방법 (외부 버튼 추가 시)]
 *   버튼 한쪽 다리 → G3 핀
 *   버튼 반대쪽 다리 → 3.3V 핀
 *   (GND가 아니라 3.3V에 연결하는 게 PULLUP과 반대!)
 *
 * [준비물]
 *   외부 버튼 1개 (보드 BOOT 버튼은 GND 방향이라 이 예제엔 맞지 않음)
 *   BOOT 버튼으로 테스트하려면 03-digital-input-pullup 사용
 */

#include "config.h"

void setup() {
    Serial.begin(115200);

    // G3 핀을 입력 모드 + 내부 풀다운 저항 사용으로 설정 (ESP32 전용)
    pinMode(BUTTON_PIN, INPUT_PULLDOWN);

    Serial.println("시작! G3 핀에 버튼을 연결하고 3.3V 쪽으로 눌러봐");
}

void loop() {
    int state = digitalRead(BUTTON_PIN);

    if (state == HIGH) {
        // HIGH = 버튼이 3.3V에 연결됨 = 버튼 눌린 상태
        Serial.println("버튼 눌렸어!");
    } else {
        // LOW = 내부 저항이 GND 방향으로 유지 = 버튼 안 눌린 상태
        Serial.println("버튼 안 눌림");
    }

    delay(200);
}
