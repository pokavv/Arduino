/*
 * 2-06 빛 밝기 감지 (CDS 조도 센서)
 * ================================================================
 *
 * [CDS 센서란?]
 *   빛에 반응하는 저항. 빛이 강할수록 저항이 낮아진다.
 *   생김새: 동그란 몸통에 "지그재그 선"이 그려진 작은 부품.
 *   다리 2개짜리.
 *
 * [회로 구성 — 왜 저항 하나가 더 필요한가?]
 *   CDS 센서만 연결하면 전압 변화를 읽을 수 없다.
 *   고정 저항(10kΩ)과 직렬로 연결하는 "분압 회로"가 필요하다.
 *
 *   3.3V → 10kΩ고정저항 → G0(읽는 지점) → CDS → GND
 *
 *   빛이 밝음 → CDS 저항 낮아짐 → G0 전압 낮아짐 → 숫자 낮게 읽힘
 *   빛이 어둠 → CDS 저항 높아짐 → G0 전압 높아짐 → 숫자 높게 읽힘
 *   (직관과 반대라서 처음엔 헷갈릴 수 있다!)
 *
 * [준비물]
 *   CDS 센서 1개, 10kΩ 저항 1개
 *
 * [연결 방법]
 *   3.3V 핀 → 10kΩ 저항 → G0 핀 → CDS 센서 → GND 핀
 *   (CDS 센서는 방향 없음 — 어느 방향이든 상관없다)
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("시작! 손으로 CDS 센서를 가려봐 — 숫자가 올라가면 정상");
}

void loop() {
    int raw = analogRead(CDS_PIN);

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
