/*
 * 2-06 빛 밝기 감지 (CDS 조도 센서)
 *
 * "CDS 센서"란?
 *   빛에 반응하는 저항. 빛이 강할수록 저항값이 낮아진다.
 *   생김새: 동그란 플라스틱 안에 지그재그 선이 그려진 것.
 *
 * 회로 구성:
 *   3.3V → 10kΩ 저항 → G0(읽는 지점) → CDS 센서 → GND
 *   빛이 강함 → CDS 저항 낮아짐 → G0 전압 낮아짐 → 숫자 낮게 나옴
 *   빛이 약함 → CDS 저항 높아짐 → G0 전압 높아짐 → 숫자 높게 나옴
 *   (직관적으로 반대라 헷갈릴 수 있음!)
 *
 * 연결 방법:
 *   3.3V → 10kΩ 저항 → G0 → CDS 센서 → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("시작! 손으로 CDS 센서를 가려봐");
}

void loop() {
    int raw = analogRead(CDS_PIN);

    // 읽은 값으로 밝기 레벨 판단
    String level;
    if (raw < DARK_THRESHOLD) {
        level = "밝음";
    } else if (raw < MID_THRESHOLD) {
        level = "보통";
    } else {
        level = "어두움";
    }

    Serial.print("빛 감지값: ");
    Serial.print(raw);
    Serial.print("  →  ");
    Serial.println(level);

    delay(500);
}
