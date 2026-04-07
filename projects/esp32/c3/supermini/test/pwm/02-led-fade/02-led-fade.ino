/*
 * 3-02 LED 페이드 인/아웃 (부드럽게 밝아졌다 어두워지기)
 * ================================================================
 *
 * [이전 예제(01)와 차이]
 *   01번은 단순히 밝기를 올렸다 내렸다 반복.
 *   이 예제는 millis()를 써서 delay() 없이 부드럽게 페이드.
 *   delay()를 쓰면 페이드 중에 버튼 입력 등을 못 받는다.
 *
 * [sin() 함수 활용]
 *   sin(x)는 -1 ~ +1 사이를 부드럽게 오가는 파형을 만든다.
 *   이걸 0~255 범위로 변환하면 자연스러운 밝기 변화를 만들 수 있다.
 *
 * [준비물]
 *   LED 1개, 220Ω 저항 1개
 *
 * [연결 방법]
 *   G2 → 저항(220Ω) → LED 긴 다리(+) → LED 짧은 다리(-) → GND
 */

#include "config.h"
#include <math.h>   // sin() 함수 사용을 위해

void setup() {
    Serial.begin(115200);
    ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
    ledcAttachPin(LED_PIN, PWM_CHANNEL);
    Serial.println("시작! LED가 숨쉬듯 부드럽게 밝아졌다 꺼질 거야");
}

void loop() {
    // millis()를 이용해 시간에 따라 부드럽게 밝기 변화
    // sin() 함수로 0~255 범위의 부드러운 파형 생성
    float t = millis() / 1000.0f;                          // 경과 시간 (초)
    float sinVal = (sin(t * FADE_SPEED) + 1.0f) / 2.0f;   // 0.0 ~ 1.0 범위
    int duty = (int)(sinVal * 255);                        // 0 ~ 255

    ledcWrite(PWM_CHANNEL, duty);
}
