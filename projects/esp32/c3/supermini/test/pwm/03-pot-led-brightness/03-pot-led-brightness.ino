/*
 * 3-03 가변저항으로 LED 밝기 실시간 조절
 * ================================================================
 *
 * [이 예제에서 하는 것]
 *   가변저항을 돌리면 → ADC 값이 바뀌고 → LED 밝기가 실시간으로 바뀐다.
 *   아날로그 입력(ADC)과 PWM 출력을 연결하는 가장 기본적인 패턴.
 *
 * [map() 함수로 범위 변환]
 *   ADC 범위: 0~4095
 *   PWM 듀티 범위: 0~255
 *   map(adc값, 0, 4095, 0, 255) → ADC 값을 PWM 범위로 변환
 *
 * [준비물]
 *   가변저항 1개, LED 1개, 220Ω 저항 1개
 *
 * [연결 방법]
 *   가변저항: 왼쪽→GND, 가운데→G0, 오른쪽→3.3V
 *   LED: G2 → 저항(220Ω) → LED 긴 다리(+) → LED 짧은 다리(-) → GND
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
    ledcAttachPin(LED_PIN, PWM_CHANNEL);
    Serial.println("시작! 가변저항을 돌리면 LED 밝기가 바뀌어");
}

void loop() {
    int adcVal = analogRead(POT_PIN);                    // 가변저항 읽기 (0~4095)
    int duty   = map(adcVal, 0, 4095, 0, 255);           // PWM 범위(0~255)로 변환

    ledcWrite(PWM_CHANNEL, duty);

    Serial.print("가변저항: ");
    Serial.print(adcVal);
    Serial.print("  →  밝기 듀티: ");
    Serial.println(duty);

    delay(50);   // 너무 빠른 업데이트 방지
}
