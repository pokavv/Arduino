/*
 * [핵심 개념] MQ-2 가스/연기 센서
 * ==================================
 * MQ 시리즈 센서는 특정 가스에 반응하는 금속 산화물 반도체 센서입니다.
 * MQ-2는 LPG, 프로판, 수소, 연기, 메탄 등을 감지합니다.
 *
 * MQ-2 동작 원리:
 *   - 내부 히터(약 5V)가 감지 소자를 가열 (예열 필요!)
 *   - 가스가 있으면 센서 저항이 낮아짐 → 출력 전압 높아짐
 *   - 아날로그 출력(A0): 가스 농도에 비례한 전압
 *   - 디지털 출력(D0): 임계값 초과 시 LOW (보드의 트리머로 조절)
 *
 * 예열(Preheat) 필요:
 *   MQ 센서는 처음 켜면 히터가 달궈질 때까지 20분 정도 예열이 필요합니다.
 *   예열 전에는 값이 매우 높게 나타납니다.
 *   정확한 측정을 위해 예열 후 사용하세요.
 *
 * 아날로그 출력 해석:
 *   - 깨끗한 공기: 낮은 값 (약 200~400)
 *   - 가스 감지 시: 높은 값 (400 이상)
 *   - 환경, 온도, 습도, 개별 센서 편차로 값이 달라짐
 *   - 절대값보다 '기준값 대비 상승'으로 판단하는 것이 정확
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - MQ-2 가스 센서 모듈
 *
 * [연결 방법]
 *   MQ-2 모듈 VCC  → 5V (히터가 5V 필요)
 *   MQ-2 모듈 GND  → GND
 *   MQ-2 모듈 A0   → G0 (아날로그 출력)
 *   MQ-2 모듈 D0   → 연결 안 해도 됨 (디지털 출력, 선택)
 *
 *   주의: MQ-2는 5V 히터가 필요합니다.
 *   VCC를 5V에 연결하고, A0 출력은 ESP32 ADC 핀(3.3V 허용)에 연결합니다.
 *   A0 출력 전압이 3.3V를 초과할 수 있으므로 전압 분배기 사용을 권장합니다.
 */

#include "config.h"

// 센서 읽기 타이머
unsigned long lastReadTime = 0;

// 기준값 (예열 후 설정)
int baselineValue = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);
  Serial.println("======================");
  Serial.println("MQ-2 가스 센서 예제");
  Serial.println("======================");
  Serial.println("센서 핀: G" + String(MQ2_PIN));
  Serial.println("경고 임계값: " + String(WARNING_THRESHOLD));
  Serial.println();
  Serial.println("[중요] 정확한 측정을 위해 20분 예열 권장");
  Serial.println("지금은 예열 중이므로 값이 불안정할 수 있습니다.");
  Serial.println("---");

  pinMode(MQ2_PIN, INPUT);

  // 초기 기준값 측정 (현재 값을 기준으로 사용)
  delay(2000);
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(MQ2_PIN);
    delay(100);
  }
  baselineValue = (int)(sum / 10);
  Serial.print("기준값(현재 환경): ");
  Serial.println(baselineValue);
  Serial.println("---");
}

void loop() {
  unsigned long now = millis();

  if (now - lastReadTime >= READ_INTERVAL) {
    lastReadTime = now;
    readAndAnalyze();
  }
}

// -----------------------------------------------
// 센서 읽기 및 분석
// -----------------------------------------------
void readAndAnalyze() {
  // 아날로그 값 읽기 (0~4095)
  int rawValue = analogRead(MQ2_PIN);

  // 전압으로 변환 (3.3V 기준)
  float voltage = (float)rawValue / 4095.0 * 3.3;

  // 기준값 대비 상승 비율
  float ratio = (float)rawValue / max(baselineValue, 1);

  // 출력
  Serial.print("ADC: ");
  Serial.print(rawValue);
  Serial.print(" | ");
  Serial.print(voltage, 2);
  Serial.print("V | 기준대비: x");
  Serial.print(ratio, 2);

  // 경고 판단
  if (rawValue >= WARNING_THRESHOLD) {
    Serial.println(" *** 경고! 가스/연기 감지 ***");
  } else if (rawValue > baselineValue * 1.5) {
    Serial.println(" [주의] 가스 농도 상승 감지");
  } else {
    Serial.println(" (정상)");
  }
}
