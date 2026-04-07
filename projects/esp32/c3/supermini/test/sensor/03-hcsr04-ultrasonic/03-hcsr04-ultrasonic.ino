/*
 * [핵심 개념] HC-SR04 초음파 거리 센서
 * ========================================
 * 초음파(사람이 들을 수 없는 고주파 소리)를 이용해 거리를 측정합니다.
 * 박쥐가 소리로 거리를 감지하는 것과 같은 원리입니다.
 *
 * 동작 원리:
 *   1. TRIG 핀에 10μs HIGH 신호 → 40kHz 초음파 8개 발사
 *   2. 초음파가 물체에 반사되어 돌아옴
 *   3. ECHO 핀이 HIGH로 유지되는 시간 = 초음파 왕복 시간
 *   4. 거리(cm) = 왕복 시간(μs) ÷ 58
 *      (음속 340m/s, 왕복이므로 2로 나누면 34000/2 = 17000cm/s → 1cm = 58μs)
 *
 * pulseIn() 함수:
 *   pulseIn(핀, HIGH): 핀이 HIGH로 유지되는 시간(μs) 반환
 *   timeout 초과 시 0 반환 (물체 없음 또는 범위 초과)
 *
 * 측정 한계:
 *   - 최소 거리: 2cm (너무 가까우면 ECHO가 TRIG와 겹침)
 *   - 최대 거리: 400cm (신호가 너무 약해짐)
 *   - 부드러운 물체(스펀지, 옷)는 흡수되어 측정 어려움
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - HC-SR04 초음파 센서
 *
 * [연결 방법]
 *   HC-SR04 VCC  → 5V (중요: HC-SR04는 5V 필요!)
 *                    또는 3.3V (일부 모듈만 동작)
 *   HC-SR04 GND  → GND
 *   HC-SR04 TRIG → G3
 *   HC-SR04 ECHO → G2
 *
 *   주의: HC-SR04는 5V 모듈입니다.
 *   ECHO 출력이 5V이므로 그냥 연결하면 ESP32 핀이 손상될 수 있습니다.
 *   안전한 연결을 위해 전압 분배기 사용:
 *   ECHO → 1kΩ → G2 → 2kΩ → GND (전압을 5V→3.3V로 낮춤)
 *   또는 레벨시프터 모듈 사용
 *   (실습에서는 짧은 시간 직접 연결해도 대부분 동작함)
 */

#include "config.h"

// 측정 타이머
unsigned long lastMeasureTime = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);
  Serial.println("===========================");
  Serial.println("HC-SR04 초음파 거리 센서");
  Serial.println("===========================");
  Serial.println("TRIG: G" + String(TRIG_PIN));
  Serial.println("ECHO: G" + String(ECHO_PIN));
  Serial.println("측정 범위: " + String(MIN_DISTANCE_CM) + " ~ " + String(MAX_DISTANCE_CM) + "cm");
  Serial.println("---");

  // TRIG: 출력 (초음파 발사 신호)
  pinMode(TRIG_PIN, OUTPUT);
  digitalWrite(TRIG_PIN, LOW);  // 기본값은 LOW

  // ECHO: 입력 (초음파 수신 신호)
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  unsigned long now = millis();

  if (now - lastMeasureTime >= MEASURE_INTERVAL) {
    lastMeasureTime = now;

    float distance = measureDistance();

    if (distance < 0) {
      Serial.println("측정 실패 (범위 초과 또는 센서 오류)");
    } else {
      Serial.print("거리: ");
      Serial.print(distance, 1);
      Serial.print(" cm");

      // 거리에 따른 간단한 표시
      printDistanceBar(distance);
    }
  }
}

// -----------------------------------------------
// 거리 측정 함수
// -----------------------------------------------
float measureDistance() {
  // 1단계: TRIG를 일시적으로 HIGH로 만들어 초음파 발사
  // 10마이크로초(μs) 동안 HIGH를 유지
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);         // 깨끗한 신호를 위해 먼저 LOW
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);        // 10μs HIGH = 초음파 발사 트리거
  digitalWrite(TRIG_PIN, LOW);  // 다시 LOW로

  // 2단계: ECHO 핀이 HIGH로 유지되는 시간(μs) 측정
  // timeout: 30000μs = 30ms (이 시간 내에 신호 없으면 0 반환)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  // 신호가 돌아오지 않은 경우 (범위 초과)
  if (duration == 0) {
    return -1;
  }

  // 3단계: 거리 계산
  // 왕복 시간(μs) ÷ 58 = 거리(cm)
  // 음속 = 약 340m/s = 34000cm/s
  // 1cm 거리를 왕복하면 2cm / 34000cm/s = 0.0000588s ≈ 58.8μs
  float distance = (float)duration / SOUND_SPEED_DIVIDER;

  // 측정 범위 체크
  if (distance < MIN_DISTANCE_CM || distance > MAX_DISTANCE_CM) {
    return -1;
  }

  return distance;
}

// -----------------------------------------------
// 거리 시각화 막대 출력
// -----------------------------------------------
void printDistanceBar(float distance) {
  Serial.print("  [");

  // 최대 20칸의 막대 그래프 (거리 0~100cm를 20칸에 매핑)
  int bars = (int)(distance / 5.0);  // 5cm마다 1칸
  if (bars > 20) bars = 20;

  for (int i = 0; i < bars; i++) {
    Serial.print("=");
  }
  for (int i = bars; i < 20; i++) {
    Serial.print(" ");
  }

  Serial.println("]");
}
