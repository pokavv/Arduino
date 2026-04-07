/*
 * 3-04 서보모터 각도 제어 (기본)
 * ================================================================
 *
 * [서보모터란?]
 *   각도를 정밀하게 제어할 수 있는 모터.
 *   일반 DC 모터는 그냥 회전하지만,
 *   서보모터는 0°~180° 사이 원하는 각도로 정확히 멈출 수 있다.
 *   RC카 조향, 로봇 관절, 카메라 팬틸트 등에 사용.
 *
 * [서보모터 신호 원리]
 *   PWM 신호 주기 20ms (50Hz) 중에서 펄스 폭으로 각도를 전달한다.
 *   펄스 폭 0.5ms → 0°
 *   펄스 폭 1.5ms → 90° (중앙)
 *   펄스 폭 2.5ms → 180°
 *
 * [서보모터 다리 3개 구분]
 *   갈색/검정 → GND
 *   빨강       → VCC (5V 또는 3.3V — 모터 스펙 확인)
 *   주황/흰색  → 신호 (G2에 연결)
 *
 *   ※ 서보모터는 전류 소모가 크다. ESP32 핀으로 직접 전원 공급하지 말 것.
 *      서보 VCC는 외부 5V 전원에 연결하고, GND만 공유한다.
 *
 * [준비물]
 *   SG90 서보모터 (또는 유사품)
 *
 * [연결 방법]
 *   서보 갈색(GND) → GND
 *   서보 빨강(VCC) → 외부 5V (또는 보드 5V 핀 — 테스트용은 가능하나 부하 주의)
 *   서보 주황(신호)→ G2
 */

#include "config.h"

void setup() {
    Serial.begin(115200);

    // 서보 PWM 설정: 50Hz (20ms 주기), 16비트 해상도
    // 16비트(0~65535) 중 펄스 폭에 해당하는 값을 계산해서 사용
    ledcSetup(SERVO_CHANNEL, SERVO_FREQ, SERVO_RESOLUTION);
    ledcAttachPin(SERVO_PIN, SERVO_CHANNEL);

    Serial.println("시작! 서보가 0° → 90° → 180° → 90° → 0° 순서로 움직여");
}

// 각도(0~180)를 16비트 PWM 듀티값으로 변환
// 50Hz(20ms) 주기에서 0.5ms~2.5ms 펄스 폭 → 65535 기준으로 계산
int angleToDuty(int angle) {
    // 0.5ms = 65535 * 0.5 / 20 ≈ 1638
    // 2.5ms = 65535 * 2.5 / 20 ≈ 8192
    return map(angle, 0, 180, SERVO_MIN_DUTY, SERVO_MAX_DUTY);
}

void setAngle(int angle) {
    angle = constrain(angle, 0, 180);   // 0~180 범위 제한
    int duty = angleToDuty(angle);
    ledcWrite(SERVO_CHANNEL, duty);
    Serial.print("서보 각도: ");
    Serial.print(angle);
    Serial.println("°");
}

void loop() {
    setAngle(0);     delay(1000);
    setAngle(90);    delay(1000);
    setAngle(180);   delay(1000);
    setAngle(90);    delay(1000);
}
