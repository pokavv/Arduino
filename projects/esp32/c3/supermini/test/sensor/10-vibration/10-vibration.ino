/*
 * [핵심 개념] SW-420 진동 센서
 * ================================
 * 진동이나 충격을 감지하는 센서입니다.
 * 내부에 작은 볼(ball)이 있어 진동 시 접점이 연결됩니다.
 *
 * 볼 스위치(Ball Switch) 방식:
 *   - 평상시: 내부 볼이 아래에 있어 접점 열림 → HIGH
 *   - 진동 시: 볼이 굴러 접점 닫힘 → LOW (순간적)
 *   - 진동이 멈추면 다시 HIGH로 돌아옴
 *
 * 바운싱(Bouncing) 문제:
 *   실제 진동에서는 볼이 여러 번 튀어 짧은 시간에
 *   LOW 신호가 여러 번 발생할 수 있습니다.
 *   해결: 쿨다운 타이머로 일정 시간 내 중복 감지 무시
 *
 * millis() 기반 쿨다운:
 *   마지막 감지 시각을 저장하고
 *   현재 시각 - 마지막 감지 시각 < COOLDOWN_MS 이면 무시
 *
 * SW-420 특징:
 *   - 방향 무관 (어느 방향이든 감지)
 *   - 디지털 출력 (HIGH/LOW)
 *   - 간단한 충격/진동 감지에 적합
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - SW-420 진동 센서 모듈
 *
 * [연결 방법]
 *   SW-420 모듈 (3핀):
 *     VCC → 3.3V
 *     GND → GND
 *     DO  → G2 (디지털 출력)
 *
 *   내장 LED: G8 (Active LOW, LOW=켜짐)
 *
 *   테스트 방법:
 *   - 모듈을 손으로 가볍게 두드리거나 흔들어 보세요
 *   - 테이블에 놓고 테이블을 두드려도 감지됩니다
 */

#include "config.h"

// 마지막 진동 감지 시각
unsigned long lastVibrationTime = 0;

// 총 감지 횟수
unsigned long vibrationCount = 0;

// LED 상태 (쿨다운 중 켜짐)
bool ledOn = false;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);
  Serial.println("============================");
  Serial.println("SW-420 진동 센서 예제");
  Serial.println("============================");
  Serial.println("센서 핀: G" + String(VIBRATION_PIN));
  Serial.println("LED 핀: G" + String(LED_PIN) + " (Active LOW)");
  Serial.println("쿨다운: " + String(COOLDOWN_MS) + "ms");
  Serial.println("---");
  Serial.println("센서를 두드리거나 흔들어 보세요!");
  Serial.println("---");

  // 진동 센서 핀: 입력 + 풀업
  // 풀업이 없으면 떠있는 핀(floating)으로 노이즈 발생 가능
  pinMode(VIBRATION_PIN, INPUT_PULLUP);

  // LED 핀: 출력
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);  // 초기 상태: LED 꺼짐 (Active LOW)
}

void loop() {
  unsigned long now = millis();
  int sensorState = digitalRead(VIBRATION_PIN);

  // 진동 감지: LOW 신호
  // 쿨다운 확인: 마지막 감지 후 COOLDOWN_MS 이상 지났는지
  if (sensorState == LOW && (now - lastVibrationTime >= COOLDOWN_MS)) {
    lastVibrationTime = now;
    vibrationCount++;

    // LED 켜기 (Active LOW)
    digitalWrite(LED_PIN, LOW);
    ledOn = true;

    // 시리얼 출력
    Serial.print("[");
    Serial.print(now / 1000);
    Serial.print("s] 진동 감지! 횟수: ");
    Serial.println(vibrationCount);
  }

  // 쿨다운이 지나면 LED 끄기
  if (ledOn && (now - lastVibrationTime >= COOLDOWN_MS)) {
    ledOn = false;
    digitalWrite(LED_PIN, HIGH);  // LED 끄기
  }
}
