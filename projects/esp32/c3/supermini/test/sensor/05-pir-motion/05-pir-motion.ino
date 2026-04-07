/*
 * [핵심 개념] PIR HC-SR501 수동형 적외선 모션 감지
 * ====================================================
 * PIR(Passive InfraRed) 센서는 사람이나 동물이 방출하는
 * 적외선 열을 감지하여 움직임을 검출합니다.
 *
 * '수동형(Passive)'이란:
 *   직접 빛이나 신호를 방출하지 않고
 *   주변에서 오는 적외선을 수동적으로 감지합니다.
 *   (ToF 레이저, 초음파와 반대)
 *
 * HC-SR501 구조:
 *   - Fresnel 렌즈: 넓은 범위의 적외선을 집중
 *   - 두 개의 PIR 소자: 한쪽이 감지하면 다른 쪽과 차이 = 모션
 *   - 감도 조절 트리머(오른쪽): 감지 거리 조절 (3m~7m)
 *   - 지연 조절 트리머(왼쪽): 감지 후 HIGH 유지 시간 (3초~5분)
 *   - 모드 점퍼: H=반복 트리거, L=단발 트리거
 *
 * 출력 신호:
 *   HIGH (3.3V): 모션 감지됨
 *   LOW  (0V):   모션 없음
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - HC-SR501 PIR 모션 센서
 *
 * [연결 방법]
 *   HC-SR501 VCC (5V핀) → 5V 또는 3.3V
 *                          (5V 전원 권장, 3.3V도 일부 동작)
 *   HC-SR501 GND         → GND
 *   HC-SR501 OUT         → G2
 *
 *   내장 LED: G8 (Active LOW, LOW=켜짐)
 *
 *   주의: PIR 센서는 처음 켤 때 약 30~60초 워밍업 시간이 필요합니다.
 *   워밍업 중에는 오작동(오감지)이 발생할 수 있습니다.
 */

#include "config.h"

// 마지막 모션 감지 시각
unsigned long lastMotionTime = 0;

// 현재 LED 상태
bool ledOn = false;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);
  Serial.println("==========================");
  Serial.println("PIR 모션 감지 센서 예제");
  Serial.println("==========================");
  Serial.println("PIR 핀: G" + String(PIR_PIN));
  Serial.println("LED 핀: G" + String(LED_PIN) + " (Active LOW)");
  Serial.println("감지 후 LED 유지: " + String(MOTION_TIMEOUT / 1000) + "초");

  // PIR 출력 핀: 입력으로 설정
  pinMode(PIR_PIN, INPUT);

  // LED 핀: 출력으로 설정
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);  // LED 꺼짐 (Active LOW이므로 HIGH = 꺼짐)

  // PIR 워밍업 대기 안내
  Serial.println("\nPIR 센서 워밍업 중... (30초 기다리세요)");
  Serial.println("워밍업 동안 오감지가 발생할 수 있습니다.");

  // 실습에서는 짧게 줄임 (실제로는 30초 권장)
  for (int i = 5; i > 0; i--) {
    Serial.print(i);
    Serial.print("... ");
    delay(1000);
  }
  Serial.println("\n워밍업 완료! 감지 시작.");
  Serial.println("---");
}

void loop() {
  unsigned long now = millis();

  // PIR 센서 값 읽기
  int pirState = digitalRead(PIR_PIN);

  if (pirState == HIGH) {
    // 모션 감지됨!
    lastMotionTime = now;

    if (!ledOn) {
      // 처음 감지된 순간에만 메시지 출력
      ledOn = true;
      digitalWrite(LED_PIN, LOW);  // LED 켜기 (Active LOW)
      Serial.print("[");
      Serial.print(now / 1000);
      Serial.println("s] 모션 감지! LED 켜짐");
    }
  }

  // LED 끄기: 마지막 감지 후 MOTION_TIMEOUT이 지나면
  if (ledOn && (now - lastMotionTime >= MOTION_TIMEOUT)) {
    ledOn = false;
    digitalWrite(LED_PIN, HIGH);  // LED 끄기 (Active LOW)
    Serial.print("[");
    Serial.print(now / 1000);
    Serial.println("s] 모션 없음. LED 꺼짐");
  }
}
