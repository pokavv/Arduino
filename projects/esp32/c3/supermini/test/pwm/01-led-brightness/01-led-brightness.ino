/*
 * 3-01 LED 밝기 조절 (PWM)
 * ================================================================
 *
 * [PWM이란?]
 *   Pulse Width Modulation (펄스 폭 변조).
 *   디지털 핀은 ON(3.3V) 또는 OFF(0V)만 할 수 있는데,
 *   아주 빠르게 껐다 켰다를 반복하면 밝기를 조절할 수 있다.
 *
 *   켜있는 시간 비율 = duty (듀티비)
 *   듀티 0%  → 항상 꺼짐 → 어두움
 *   듀티 50% → 절반 켜짐 → 중간 밝기
 *   듀티 100%→ 항상 켜짐 → 최대 밝기
 *
 * [ESP32에서 PWM 사용법]
 *   일반 아두이노: analogWrite(핀, 0~255)
 *   ESP32: analogWrite() 안 됨! → ledcWrite() 사용
 *
 *   사용 순서:
 *   1) ledcSetup(채널, 주파수, 비트수)  — PWM 채널 설정
 *   2) ledcAttachPin(핀, 채널)          — 핀에 채널 연결
 *   3) ledcWrite(채널, 듀티값)          — 밝기 출력
 *
 *   채널: 0~7 (최대 8개 독립 채널)
 *   주파수: 5000Hz (일반적인 LED에 적합)
 *   비트수: 8 → 듀티 범위 0~255
 *
 * [준비물]
 *   LED 1개, 220Ω 저항 1개
 *
 * [연결 방법]
 *   G2 → 저항(220Ω) → LED 긴 다리(+) → LED 짧은 다리(-) → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);

    // PWM 채널 0번 설정: 주파수 5000Hz, 8비트 해상도 (0~255)
    ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);

    // G2 핀을 PWM 채널 0번에 연결
    ledcAttachPin(LED_PIN, PWM_CHANNEL);

    Serial.println("시작! LED 밝기가 점점 밝아졌다가 꺼질 거야");
}

void loop() {
    // 어두움 → 밝음 (0 → 255)
    Serial.println("밝아지는 중...");
    for (int duty = 0; duty <= 255; duty += 5) {
        ledcWrite(PWM_CHANNEL, duty);   // 듀티값 설정 (0=꺼짐, 255=최대)
        delay(20);
    }

    // 밝음 → 어두움 (255 → 0)
    Serial.println("어두워지는 중...");
    for (int duty = 255; duty >= 0; duty -= 5) {
        ledcWrite(PWM_CHANNEL, duty);
        delay(20);
    }
}
