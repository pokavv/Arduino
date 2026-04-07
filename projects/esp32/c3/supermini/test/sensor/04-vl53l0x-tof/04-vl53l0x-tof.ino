/*
 * [핵심 개념] VL53L0X ToF 레이저 거리 센서
 * ===========================================
 * ToF(Time of Flight, 비행 시간) 방식으로 거리를 측정합니다.
 * 적외선 레이저 빛을 쏘고 반사되어 돌아오는 시간으로 거리를 계산합니다.
 *
 * ToF vs 초음파 비교:
 * ┌─────────────┬──────────────────┬──────────────────┐
 * │ 항목        │ 초음파(HC-SR04)  │ ToF(VL53L0X)     │
 * ├─────────────┼──────────────────┼──────────────────┤
 * │ 측정 원리   │ 음파 왕복 시간   │ 빛 왕복 시간     │
 * │ 측정 범위   │ 2 ~ 400cm        │ 3 ~ 2000mm(2m)   │
 * │ 정확도      │ ±3mm             │ ±3% ~ ±5%        │
 * │ 영향 요소   │ 온도, 물체 재질  │ 빛 반사율        │
 * │ 측정 각도   │ 넓음(30°)        │ 좁음(점 측정)    │
 * │ 통신        │ GPIO 2핀         │ I2C              │
 * └─────────────┴──────────────────┴──────────────────┘
 *
 * rangingTest() 결과:
 *   measure.RangeStatus == 4: 측정 범위 초과 또는 오류
 *   measure.RangeMilliMeter: 측정된 거리(mm)
 *
 * [라이브러리]
 *   - Adafruit VL53L0X (Arduino Library Manager)
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - VL53L0X 모듈
 *
 * [연결 방법]
 *   VL53L0X VCC  → 3.3V (반드시 3.3V!)
 *   VL53L0X GND  → GND
 *   VL53L0X SDA  → G8
 *   VL53L0X SCL  → G9
 *   (XSHUT, GPIO 핀은 연결 안 해도 됨)
 *
 *   주의: G8은 내장 LED 핀입니다.
 *   I2C SDA로 사용 시 내장 LED는 동작하지 않을 수 있습니다.
 *   필요하면 다른 핀(예: G0, G1)을 SDA로 변경하세요.
 */

#include <Wire.h>
#include <Adafruit_VL53L0X.h>
#include "config.h"

// VL53L0X 센서 객체
Adafruit_VL53L0X sensor;

// 측정 타이머
unsigned long lastMeasureTime = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);
  Serial.println("============================");
  Serial.println("VL53L0X ToF 거리 센서 예제");
  Serial.println("============================");
  Serial.println("통신: I2C");
  Serial.println("SDA: G" + String(I2C_SDA_PIN));
  Serial.println("SCL: G" + String(I2C_SCL_PIN));
  Serial.println("최대 측정: " + String(MAX_RANGE_MM) + "mm");

  // I2C 핀 초기화
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  // VL53L0X 초기화
  if (!sensor.begin()) {
    Serial.println("[오류] VL53L0X를 찾을 수 없습니다!");
    Serial.println("확인 사항:");
    Serial.println("  1. VCC → 3.3V 연결 확인 (5V 연결 금지!)");
    Serial.println("  2. SDA/SCL 핀 연결 확인");
    Serial.println("  3. I2C 주소 0x29 충돌 여부 확인");
    while (true) {
      delay(1000);
    }
  }

  Serial.println("[성공] VL53L0X 초기화 완료!");
  Serial.println("---");
}

void loop() {
  unsigned long now = millis();

  if (now - lastMeasureTime >= MEASURE_INTERVAL) {
    lastMeasureTime = now;
    measureDistance();
  }
}

// -----------------------------------------------
// 거리 측정 및 출력
// -----------------------------------------------
void measureDistance() {
  VL53L0X_RangingMeasurementData_t measure;

  // 거리 측정 수행
  // rangingTest(): 한 번 측정 후 결과를 measure 구조체에 저장
  sensor.rangingTest(&measure, false);  // false = 디버그 출력 안 함

  // 측정 상태 확인
  // RangeStatus == 4: 측정 실패 (범위 초과, 물체 없음 등)
  if (measure.RangeStatus == 4) {
    Serial.println("거리: 범위 초과 (2000mm 이상 또는 물체 없음)");
    return;
  }

  // 측정 성공
  uint16_t distanceMM = measure.RangeMilliMeter;
  float    distanceCM = distanceMM / 10.0;

  Serial.print("거리: ");
  Serial.print(distanceMM);
  Serial.print(" mm  (");
  Serial.print(distanceCM, 1);
  Serial.println(" cm)");
}
