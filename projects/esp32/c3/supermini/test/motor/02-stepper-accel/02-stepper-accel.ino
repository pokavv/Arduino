/*
 * motor/02-stepper-accel — 스텝모터 가감속 제어
 * ================================================================
 *
 * [핵심 개념 설명]
 *   가감속 (Acceleration/Deceleration)
 *     - 갑자기 빠른 속도로 시작하면 관성 때문에 탈조 발생
 *     - 천천히 시작해서 점점 빠르게 → 목표 속도 도달 → 천천히 감속
 *     - AccelStepper가 자동으로 S커브/사다리꼴 속도 프로파일 계산
 *
 *   moveTo() vs move()
 *     - moveTo(절대위치): 전체 여행 기준의 목표 위치
 *     - move(상대이동): 현재 위치 기준으로 몇 스텝 이동
 *
 *   runToPosition()
 *     - 목표 위치에 도달할 때까지 블로킹 (다른 코드 실행 안 됨)
 *     - 단순한 순차 동작에 사용
 *
 *   run() (논블로킹)
 *     - loop()에서 매번 호출, 비동기로 조금씩 이동
 *     - 이동 중에도 다른 작업 가능
 *
 * [라이브러리]
 *   AccelStepper — 라이브러리 매니저에서 설치
 *
 * [준비물]
 *   motor/01-stepper-basic 과 동일
 *
 * [연결 방법]
 *   motor/01-stepper-basic 과 동일
 *   G2→STEP, G3→DIR, G4→EN, 12V→VMOT
 */

#include "config.h"
#include <AccelStepper.h>

AccelStepper stepper(AccelStepper::DRIVER, STEP_PIN, DIR_PIN);

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" 스텝모터 가감속 제어");
  Serial.println("===================================");
  Serial.print("최대 속도: "); Serial.print(MAX_SPEED); Serial.println(" 스텝/초");
  Serial.print("가속도   : "); Serial.print(ACCELERATION); Serial.println(" 스텝/초²");
  Serial.println();

  // ---- EN 핀 설정 ----
  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, LOW);   // Active LOW — 드라이버 활성화

  // ---- AccelStepper 속도/가속도 설정 ----
  stepper.setMaxSpeed(MAX_SPEED);       // 최대 속도 (스텝/초)
  stepper.setAcceleration(ACCELERATION); // 가속도 (스텝/초²)

  // ---- 시연: runToPosition() 으로 순차 이동 ----
  Serial.println("정방향 2바퀴 이동 (가속 시작)...");
  stepper.moveTo(STEPS_PER_REV * 2);   // 절대 위치 400스텝 (2바퀴)
  stepper.runToPosition();              // 도달할 때까지 대기 (블로킹)
  Serial.println("도착!");

  delay(1000);

  Serial.println("역방향 원위치로 이동...");
  stepper.moveTo(0);                    // 절대 위치 0 (원점)
  stepper.runToPosition();
  Serial.println("원위치 복귀 완료!");

  delay(1000);
  Serial.println("이제 loop()에서 논블로킹 왕복 운동 시작");
}

long targetPos = STEPS_PER_REV * 3;  // 다음 목표 위치 (스텝)

void loop() {
  // 목표 위치 도달 시 반대 방향으로 전환
  if (stepper.distanceToGo() == 0) {
    delay(500);
    // 현재 목표 ↔ 0 으로 전환
    targetPos = (targetPos == 0) ? (STEPS_PER_REV * 3) : 0;
    stepper.moveTo(targetPos);

    Serial.print("새 목표 위치: ");
    Serial.print(targetPos);
    Serial.print(" 스텝 (");
    Serial.print(targetPos / STEPS_PER_REV);
    Serial.println("바퀴)");
  }

  stepper.run();  // 논블로킹 이동 — 매 loop마다 호출 필수!
}
