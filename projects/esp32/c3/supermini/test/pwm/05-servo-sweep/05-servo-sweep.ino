/*
 * 3-05 서보모터 스윕 (0°~180° 천천히 왔다갔다)
 * ================================================================
 *
 * [스윕이란?]
 *   0°에서 180°까지 천천히 이동하고, 다시 0°로 돌아오는 동작 반복.
 *   서보모터가 정상 작동하는지 확인할 때 자주 쓰는 테스트 동작.
 *
 * [04번 예제와 차이]
 *   04번: 특정 각도로 딱딱 이동
 *   이 예제: 부드럽게 천천히 스윕 (1도씩 이동)
 *
 * [준비물 / 연결 방법]
 *   04-servo-basic 과 동일
 */

#include "config.h"

int angleToDuty(int angle) {
    return map(angle, 0, 180, SERVO_MIN_DUTY, SERVO_MAX_DUTY);
}

void setup() {
    Serial.begin(115200);
    ledcSetup(SERVO_CHANNEL, SERVO_FREQ, SERVO_RESOLUTION);
    ledcAttachPin(SERVO_PIN, SERVO_CHANNEL);
    Serial.println("시작! 서보가 0°~180° 사이를 천천히 왔다갔다 해");
}

void loop() {
    // 0° → 180° 천천히 이동
    for (int angle = 0; angle <= 180; angle++) {
        ledcWrite(SERVO_CHANNEL, angleToDuty(angle));
        Serial.print("→ ");
        Serial.print(angle);
        Serial.println("°");
        delay(SWEEP_DELAY_MS);
    }

    // 180° → 0° 천천히 이동
    for (int angle = 180; angle >= 0; angle--) {
        ledcWrite(SERVO_CHANNEL, angleToDuty(angle));
        Serial.print("← ");
        Serial.print(angle);
        Serial.println("°");
        delay(SWEEP_DELAY_MS);
    }
}
