/*
 * motor/03-stepper-homing — 스텝모터 호밍(원점 찾기)
 * ================================================================
 *
 * [핵심 개념 설명]
 *   호밍 (Homing)
 *     - 전원 켤 때마다 현재 위치를 모름 → 리밋 스위치로 기준점(원점) 찾기
 *     - 3D 프린터, CNC 머신의 "홈으로 이동" 기능과 동일한 원리
 *
 *   리밋 스위치 (Limit Switch)
 *     - 기계적 스위치 — 모터가 끝까지 이동했을 때 눌리는 안전 장치
 *     - 눌리면 LOW (내부 풀업 저항 사용)
 *     - 호밍: 스위치에 닿을 때까지 이동 → 원점(0) 설정
 *
 *   setCurrentPosition(0)
 *     - AccelStepper에 "지금 이 위치가 0번 위치야"라고 알려줌
 *     - 실제 물리적 이동 없이 소프트웨어 위치 초기화
 *
 * [라이브러리]
 *   AccelStepper — 라이브러리 매니저에서 설치
 *
 * [준비물]
 *   - NEMA 17 스텝모터 + A4988 드라이버
 *   - 리밋 스위치 1개 (또는 마이크로 스위치)
 *
 * [연결 방법]
 *   ESP32-C3       A4988
 *   G2 (STEP)   → STEP
 *   G3 (DIR)    → DIR
 *   G4 (EN)     → EN
 *
 *   리밋 스위치 연결 (Normal Open 타입)
 *   G5          → 스위치 한쪽 다리
 *   GND         → 스위치 다른 다리
 *   (INPUT_PULLUP 사용 — 안 눌리면 HIGH, 눌리면 LOW)
 */

#include "config.h"
#include <AccelStepper.h>

AccelStepper stepper(AccelStepper::DRIVER, STEP_PIN, DIR_PIN);

bool homingDone = false;  // 호밍 완료 여부

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" 스텝모터 호밍 예제");
  Serial.println("===================================");

  // ---- EN 핀 설정 ----
  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, LOW);   // 드라이버 활성화

  // ---- 리밋 스위치 핀 설정 ----
  // INPUT_PULLUP: 내부 풀업 저항 활성화 — 기본 HIGH, 눌리면 LOW
  pinMode(LIMIT_PIN, INPUT_PULLUP);

  // ---- AccelStepper 설정 ----
  stepper.setMaxSpeed(HOMING_SPEED);
  stepper.setAcceleration(HOMING_SPEED * 2);  // 가속도 = 속도의 2배 (빠른 가속)

  Serial.println("호밍 시작: 리밋 스위치 방향으로 이동...");
  Serial.println("(리밋 스위치에 닿으면 정지 후 원점 설정)");

  // ---- 호밍 이동 시작 ----
  // 큰 음수값으로 이동 명령 → 리밋 스위치에 닿으면 중단
  stepper.move(-100000);  // 충분히 큰 음수값 — 스위치에 닿을 때까지 역방향 이동
}

void loop() {
  if (!homingDone) {
    // ---- 호밍 진행 중 ----
    if (digitalRead(LIMIT_PIN) == LOW) {
      // 리밋 스위치 눌림 → 즉시 정지
      stepper.stop();         // 감속 정지 요청
      stepper.setCurrentPosition(0);  // 현재 위치를 0으로 설정 (원점!)
      homingDone = true;

      Serial.println("리밋 스위치 감지! 원점 설정 완료 (position = 0)");
      delay(500);  // 완전히 멈출 때까지 잠시 대기

      // ---- 원점에서 약간 뒤로 이동 (리밋 스위치 해제) ----
      Serial.println("스위치 해제 위치(+50스텝)로 이동...");
      stepper.moveTo(50);
      while (stepper.distanceToGo() != 0) {
        stepper.run();
      }
      stepper.setCurrentPosition(0);  // 다시 원점으로 재설정
      Serial.println("호밍 완료! 현재 위치 = 0");
      Serial.println();
      Serial.println("이제 절대 위치로 이동합니다:");
      Serial.println("  0스텝(원점) ↔ 200스텝(1바퀴) 왕복");

    } else {
      stepper.run();  // 호밍 이동 중
    }

  } else {
    // ---- 호밍 완료 후 왕복 운동 ----
    if (stepper.distanceToGo() == 0) {
      delay(500);
      long currentTarget = stepper.targetPosition();
      long nextTarget = (currentTarget == 0) ? STEPS_PER_REV : 0;

      stepper.moveTo(nextTarget);
      Serial.print("이동 목표: ");
      Serial.print(nextTarget);
      Serial.print(" 스텝 (현재: ");
      Serial.print(stepper.currentPosition());
      Serial.println(" 스텝)");
    }
    stepper.run();
  }
}
