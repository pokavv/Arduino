/*
 * combo/09-servo-ultrasonic-scanner — 서보 + 초음파 레이더 스캐너
 * ================================================================
 *
 * [핵심 개념 설명]
 *   초음파 거리 센서 (HC-SR04)
 *     - TRIG 핀에 10us 이상 HIGH 신호 → 초음파 발사
 *     - ECHO 핀이 HIGH인 시간 측정 → 거리 계산
 *     - 거리(cm) = ECHO HIGH 시간(us) × 음속(0.034 cm/us) / 2
 *       (왕복 거리이므로 2로 나눔)
 *     - 측정 범위: 2cm ~ 400cm
 *
 *   서보 모터 (SG90 등)
 *     - PWM 신호로 각도 제어 (0~180°)
 *     - 50Hz(20ms 주기), 1ms=0°, 1.5ms=90°, 2ms=180° 펄스 폭
 *     - ESP32에서는 ESP32Servo 라이브러리 사용 (analogWrite 미지원)
 *
 *   이 예제의 출력 형식 (시리얼 플로터 또는 Processing으로 시각화 가능)
 *     각도,거리(cm)
 *
 * [라이브러리]
 *   ESP32Servo (Kevin Harrington) — 라이브러리 매니저에서 설치
 *
 * [준비물]
 *   - SG90 서보 모터 1개
 *   - HC-SR04 초음파 센서 1개
 *
 * [연결 방법]
 *   서보 모터
 *   갈색(GND)  → GND
 *   빨간색(5V) → 5V (서보는 5V 필요 — 3.3V면 동작 불안정)
 *   주황색(PWM) → G2 (SERVO_PIN)
 *
 *   HC-SR04 초음파 센서
 *   VCC  → 5V
 *   GND  → GND
 *   TRIG → G3 (TRIG_PIN)
 *   ECHO → G4 (ECHO_PIN)  ← 주의: HC-SR04 ECHO는 5V 출력!
 *          전압 분압 필요: G4 ← R1(10kΩ) ← ECHO, R2(20kΩ) ← GND
 *          (5V → 3.3V 변환)
 */

#include "config.h"
#include <ESP32Servo.h>

Servo servo;  // 서보 객체

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" 서보 + 초음파 레이더 스캐너");
  Serial.println("===================================");
  Serial.print("스캔 범위: ");
  Serial.print(SCAN_START); Serial.print("° ~ "); Serial.print(SCAN_END); Serial.print("°");
  Serial.print(", 간격: "); Serial.print(SCAN_STEP); Serial.println("°");
  Serial.println("출력 형식: 각도,거리(cm)");
  Serial.println();

  // ---- 핀 설정 ----
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  // ---- 서보 초기화 ----
  // ESP32Servo: ledc 타이머 할당 (analogWrite 대신 사용)
  servo.attach(SERVO_PIN);
  servo.write(SCAN_START);  // 시작 위치로 이동
  delay(500);               // 서보 이동 대기

  Serial.println("초기화 완료. 스캔 시작!");
}

void loop() {
  // ---- 정방향 스캔 (시작 → 끝) ----
  Serial.println("=== 정방향 스캔 ===");
  for (int angle = SCAN_START; angle <= SCAN_END; angle += SCAN_STEP) {
    servo.write(angle);                    // 서보 각도 설정
    delay(SERVO_SETTLE_MS);                // 서보 안정화 대기

    long distance = measureDistance();     // 초음파 거리 측정

    // 출력: "각도,거리" CSV 형식
    Serial.print(angle);
    Serial.print(",");
    Serial.println(distance);
  }

  delay(500);  // 방향 전환 전 대기

  // ---- 역방향 스캔 (끝 → 시작) ----
  Serial.println("=== 역방향 스캔 ===");
  for (int angle = SCAN_END; angle >= SCAN_START; angle -= SCAN_STEP) {
    servo.write(angle);
    delay(SERVO_SETTLE_MS);

    long distance = measureDistance();

    Serial.print(angle);
    Serial.print(",");
    Serial.println(distance);
  }

  delay(500);
}

// ---- 초음파 거리 측정 함수 ----
// 반환값: 거리(cm), 측정 불가 시 -1
long measureDistance() {
  // TRIG 핀에 10us HIGH 펄스 전송 → 초음파 발사
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // ECHO 핀의 HIGH 지속 시간 측정 (초음파 왕복 시간)
  // pulseIn(): 핀이 HIGH가 되는 시간(us)을 측정, 30000us = 약 5m
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    return -1;  // 타임아웃 = 범위 초과 또는 장애물 없음
  }

  // 거리(cm) = 음속(0.034cm/us) × 시간(us) / 2 (왕복이므로)
  long distance = (long)(duration * SOUND_SPEED_CM_US / 2.0f);

  if (distance > MAX_DISTANCE_CM) {
    return -1;  // 최대 측정 거리 초과
  }

  return distance;
}
