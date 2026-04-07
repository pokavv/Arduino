/*
 * 3-10 PWM 채널 여러 개 독립 제어
 * ================================================================
 *
 * [ESP32 PWM 채널]
 *   ESP32는 PWM 채널을 최대 8개(0~7)까지 독립적으로 사용할 수 있다.
 *   각 채널은 서로 다른 주파수, 듀티값을 가질 수 있다.
 *   LED 여러 개를 각각 다른 밝기로 동시에 제어하거나,
 *   서보 + LED + 부저를 동시에 쓰는 경우 유용하다.
 *
 * [이 예제에서 하는 것]
 *   3개의 LED를 각각 다른 속도로 페이드 인/아웃.
 *   모두 동시에 부드럽게 움직임.
 *
 * [준비물]
 *   LED 3개, 220Ω 저항 3개
 *
 * [연결 방법]
 *   G2 → 저항 → LED1 → GND
 *   G3 → 저항 → LED2 → GND
 *   G4 → 저항 → LED3 → GND
 */

#include "config.h"
#include <math.h>

void setup() {
    Serial.begin(115200);

    // 채널 0, 1, 2 각각 설정하고 핀에 연결
    ledcSetup(0, PWM_FREQ, PWM_RESOLUTION);
    ledcSetup(1, PWM_FREQ, PWM_RESOLUTION);
    ledcSetup(2, PWM_FREQ, PWM_RESOLUTION);

    ledcAttachPin(LED1_PIN, 0);
    ledcAttachPin(LED2_PIN, 1);
    ledcAttachPin(LED3_PIN, 2);

    Serial.println("시작! LED 3개가 각각 다른 속도로 밝아졌다 꺼질 거야");
}

void loop() {
    float t = millis() / 1000.0f;

    // 각 LED마다 다른 속도(1.0, 1.5, 2.0배)로 페이드
    int duty0 = (int)((sin(t * 1.0f) + 1.0f) / 2.0f * 255);
    int duty1 = (int)((sin(t * 1.5f) + 1.0f) / 2.0f * 255);
    int duty2 = (int)((sin(t * 2.0f) + 1.0f) / 2.0f * 255);

    ledcWrite(0, duty0);
    ledcWrite(1, duty1);
    ledcWrite(2, duty2);
}
