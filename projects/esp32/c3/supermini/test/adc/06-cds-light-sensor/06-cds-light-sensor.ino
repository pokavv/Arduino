/*
 * 2-06 CDS 조도 센서 읽기
 *
 * CDS(황화카드뮴) 센서: 빛이 강할수록 저항 감소 → ADC 값 증가.
 * 분압 회로: 3.3V → 10kΩ 고정저항 → G0 → CDS → GND
 * 밝으면 CDS 저항 낮아져서 G0 전압 낮아짐 → raw 값 낮음.
 * 어두우면 CDS 저항 높아져서 G0 전압 높아짐 → raw 값 높음.
 *
 * 회로:
 *   3.3V → 10kΩ → G0 → CDS → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("cds-light-sensor 시작");
}

void loop() {
    int raw = analogRead(CDS_PIN);

    // 밝기 레벨 판단
    String level;
    if (raw < DARK_THRESHOLD) {
        level = "밝음";
    } else if (raw < MID_THRESHOLD) {
        level = "보통";
    } else {
        level = "어두움";
    }

    Serial.print("조도 raw: ");
    Serial.print(raw);
    Serial.print("  →  ");
    Serial.println(level);

    delay(500);
}
