/*
 * [핵심 개념] 홀 효과(Hall Effect) 센서
 * =========================================
 * 홀 효과를 이용해 자기장(자석)을 감지하는 센서입니다.
 *
 * 홀 효과(Hall Effect)란?
 *   자기장 안에서 전류가 흐르는 도체에 수직 방향으로
 *   전압이 발생하는 현상. (에드윈 홀이 1879년 발견)
 *
 *   간단히: 자석이 가까이 오면 홀 센서 내부에 전압이 바뀜
 *           이를 감지하여 디지털 신호(LOW/HIGH)로 출력
 *
 * 홀 센서 종류:
 *   - 디지털 출력형 (이 예제): 자석 감지 시 LOW 출력
 *   - 아날로그 출력형: 자기장 세기에 비례한 전압 출력
 *
 * 출력 신호:
 *   자석 없음: HIGH (내장 풀업)
 *   자석 근접: LOW
 *
 * 활용 예:
 *   - 문 열림/닫힘 감지 (도어 센서)
 *   - 자전거/모터 회전속도 측정 (RPM)
 *   - 리드 스위치 대체
 *   - 근접 스위치
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - 홀 효과 센서 (A3144, OH090U, SS49E 등)
 *   - 네오디뮴 자석 또는 일반 자석
 *
 * [연결 방법]
 *   홀 센서 (3핀, 평평한 면이 앞):
 *     왼쪽 핀  → VCC → 3.3V
 *     가운데 핀 → GND
 *     오른쪽 핀 → 출력 → G2
 *
 *   대부분의 홀 센서 모듈은 내부 풀업 저항이 있어
 *   G2에 별도 저항 없이 바로 연결해도 됩니다.
 *
 *   주의: 홀 센서 극성에 따라 N극에만 반응하는 경우도 있습니다.
 *   반응이 없으면 자석을 뒤집어 보세요.
 */

#include "config.h"

// 이전 상태 저장 (변화 감지용)
int prevState = -1;  // -1: 초기값 (아직 읽지 않음)

// 감지 타이머
unsigned long lastDetectTime = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);
  Serial.println("============================");
  Serial.println("홀 효과 센서 예제");
  Serial.println("============================");
  Serial.println("감지 핀: G" + String(HALL_PIN));
  Serial.println("자석을 센서에 가까이 가져다 대세요.");
  Serial.println("---");

  // 홀 센서 출력 핀: 입력 + 풀업 (내부 풀업)
  // INPUT_PULLUP: 핀에 내부 풀업 저항 연결 → 아무것도 없으면 HIGH
  pinMode(HALL_PIN, INPUT_PULLUP);
}

void loop() {
  unsigned long now = millis();

  if (now - lastDetectTime >= DETECT_INTERVAL) {
    lastDetectTime = now;

    int currentState = digitalRead(HALL_PIN);

    // 상태가 변했을 때만 출력 (불필요한 출력 방지)
    if (currentState != prevState) {
      prevState = currentState;

      if (currentState == LOW) {
        // LOW: 자석 감지됨 (Active LOW)
        Serial.print("[");
        Serial.print(now / 1000);
        Serial.println("s] 자석 감지! (신호: LOW)");
      } else {
        // HIGH: 자석 없음
        Serial.print("[");
        Serial.print(now / 1000);
        Serial.println("s] 자석 없음 (신호: HIGH)");
      }
    }
  }
}
