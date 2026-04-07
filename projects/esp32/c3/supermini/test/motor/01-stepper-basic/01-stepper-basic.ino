/*
 * motor/01-stepper-basic — 스텝모터 기본 제어 (AccelStepper)
 * ================================================================
 *
 * [핵심 개념 설명]
 *   스텝모터 (Stepper Motor)
 *     - 연속 회전이 아닌, 정해진 각도씩 이동하는 모터
 *     - 표준 NEMA 17: 1스텝 = 1.8° → 1바퀴 = 200스텝
 *     - 정밀한 위치 제어에 사용 (3D 프린터, CNC 등)
 *     - 피드백 없이 위치를 알 수 있음 (엔코더 불필요)
 *
 *   탈조 (Step Loss / Missed Steps)
 *     - 모터가 스텝 명령을 따라가지 못하는 현상
 *     - 너무 빠른 속도, 과부하, 전원 부족 시 발생
 *     - 탈조 발생 시 위치 오차 누적 → 가감속 사용으로 예방
 *
 *   A4988 드라이버
 *     - 마이크로스텝 지원 (최대 1/16 스텝)
 *     - VM: 모터 전원 (8~35V), VDD: 로직 전원 (3.3~5V)
 *     - EN 핀이 HIGH면 드라이버 비활성화 (모터 힘 없음)
 *
 * [라이브러리]
 *   AccelStepper (Mike McCauley)
 *   설치: 라이브러리 매니저 → "AccelStepper" 검색 → 설치
 *
 * [준비물]
 *   - NEMA 17 스텝모터 1개
 *   - A4988 또는 DRV8825 드라이버 모듈 1개
 *   - 모터 전원: 12V DC 어댑터 (충분한 전류)
 *   - 100uF 전해 커패시터 (드라이버 VIN-GND 사이, 전압 스파이크 방지)
 *
 * [연결 방법]
 *   ESP32-C3        A4988 드라이버
 *   G2 (STEP_PIN) → STEP
 *   G3 (DIR_PIN)  → DIR
 *   G4 (EN_PIN)   → EN       (Active LOW — LOW면 활성화)
 *   3.3V          → VDD      (드라이버 로직 전원)
 *   GND           → GND
 *
 *   모터 전원 (별도 공급)
 *   12V DC(+)     → VMOT
 *   12V DC(-)     → GND
 *
 *   스텝모터       → A4988 1A, 1B, 2A, 2B
 *
 *   주의: 모터 연결/분리 시 드라이버 전원 반드시 끄기!
 *         연결된 상태에서 빼면 드라이버 손상 가능.
 */

#include "config.h"
#include <AccelStepper.h>

// AccelStepper 객체 생성
// DRIVER 모드: STEP, DIR 두 핀으로 제어 (A4988/DRV8825 방식)
AccelStepper stepper(AccelStepper::DRIVER, STEP_PIN, DIR_PIN);

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" 스텝모터 기본 제어 (AccelStepper)");
  Serial.println("===================================");

  // ---- EN 핀 설정 ----
  // A4988 EN 핀은 Active LOW — LOW면 드라이버 활성화 (모터에 전류 공급)
  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, LOW);   // 드라이버 활성화

  // ---- AccelStepper 설정 ----
  // 속도: STEP_DELAY_US로 계산 — 1,000,000us / STEP_DELAY_US = 스텝/초
  float stepsPerSecond = 1000000.0f / STEP_DELAY_US;
  stepper.setMaxSpeed(stepsPerSecond);       // 최대 속도 설정
  stepper.setAcceleration(stepsPerSecond);   // 가속도 = 속도와 동일 (즉시 가속)

  Serial.print("1바퀴 스텝 수: "); Serial.println(STEPS_PER_REV);
  Serial.print("스텝 속도: "); Serial.print(stepsPerSecond); Serial.println(" 스텝/초");
  Serial.println();
}

int movePhase = 0;  // 0=정방향, 1=역방향 전환

void loop() {
  // 정방향 1바퀴 이동 완료 확인
  if (stepper.distanceToGo() == 0) {
    delay(500);  // 방향 전환 전 잠시 대기

    if (movePhase == 0) {
      // 정방향 1바퀴
      Serial.println("정방향 1바퀴 이동...");
      stepper.move(STEPS_PER_REV);   // 상대 위치 이동 (현재 위치 기준)
      movePhase = 1;
    } else {
      // 역방향 1바퀴 (원위치)
      Serial.println("역방향 1바퀴 이동 (원위치)...");
      stepper.move(-STEPS_PER_REV);  // 음수 = 역방향
      movePhase = 0;
    }
  }

  // run() 은 반드시 매 loop()에서 호출 — 내부적으로 스텝 타이밍 계산
  stepper.run();
}
