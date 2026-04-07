/*
 * 3-07 DC 모터 정방향/역방향 + 속도 제어
 * ================================================================
 *
 * [L298N으로 방향 바꾸는 원리]
 *   IN1, IN2 핀 조합으로 모터 방향을 결정한다.
 *
 *   IN1=HIGH, IN2=LOW  → 정방향 (앞으로)
 *   IN1=LOW,  IN2=HIGH → 역방향 (뒤로)
 *   IN1=LOW,  IN2=LOW  → 정지 (free spin)
 *   IN1=HIGH, IN2=HIGH → 급정지 (브레이크)
 *
 *   ENA PWM 듀티 → 속도 조절 (0~255)
 *
 * [준비물 / 연결 방법]
 *   06-dc-motor-l298n 과 동일
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
    ledcAttachPin(ENA_PIN, PWM_CHANNEL);
    pinMode(IN1_PIN, OUTPUT);
    pinMode(IN2_PIN, OUTPUT);
    Serial.println("시작! 정방향 → 정지 → 역방향 → 정지 반복");
}

void motorForward(int speed) {
    digitalWrite(IN1_PIN, HIGH);
    digitalWrite(IN2_PIN, LOW);
    ledcWrite(PWM_CHANNEL, speed);
}

void motorBackward(int speed) {
    digitalWrite(IN1_PIN, LOW);
    digitalWrite(IN2_PIN, HIGH);
    ledcWrite(PWM_CHANNEL, speed);
}

void motorStop() {
    digitalWrite(IN1_PIN, LOW);
    digitalWrite(IN2_PIN, LOW);
    ledcWrite(PWM_CHANNEL, 0);
}

void loop() {
    Serial.println("정방향 — 속도 150");
    motorForward(150);
    delay(2000);

    Serial.println("정지");
    motorStop();
    delay(1000);

    Serial.println("역방향 — 속도 150");
    motorBackward(150);
    delay(2000);

    Serial.println("정지");
    motorStop();
    delay(1000);
}
