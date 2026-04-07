/*
 * 4-02 다중 millis 타이머 동시 실행
 * ================================================================
 *
 * [핵심 개념 설명]
 *   실제 프로젝트에서는 여러 작업을 동시에 해야 합니다.
 *   예를 들어, LED를 깜빡이면서 동시에 센서도 읽고 상태도 출력해야 합니다.
 *
 *   각 작업마다 'lastXxxMs' 변수를 따로 두면,
 *   서로 다른 주기로 독립적인 작업을 동시에 실행할 수 있습니다.
 *   이것이 millis() 기반 논블로킹 패턴의 핵심입니다.
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 1개 (내장 LED G8 사용)
 *   - USB 케이블
 *
 * [연결 방법]
 *   내장 LED(G8)가 자동으로 사용됩니다. 별도 연결 불필요.
 */

#include "config.h"

// 각 타이머의 마지막 실행 시각
unsigned long lastBlinkMs  = 0;
unsigned long lastSensorMs = 0;
unsigned long lastStatusMs = 0;

// 현재 LED 상태 추적 (true = 켜짐 논리, false = 꺼짐)
bool ledOn = false;

// 가상 센서 읽기 횟수
unsigned long sensorCount = 0;

// 상태 출력 횟수
unsigned long statusCount = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);

  // LED 핀을 출력 모드로 설정
  pinMode(LED_PIN, OUTPUT);

  // 처음에는 LED를 끕니다 (Active LOW 이므로 HIGH = 꺼짐)
  digitalWrite(LED_PIN, HIGH);

  Serial.println("=== 다중 millis 타이머 시작 ===");
  Serial.println("LED 500ms / 센서 2000ms / 상태 5000ms 동시 실행");
}

void loop() {
  unsigned long nowMs = millis();

  // --- 타이머 1: LED 깜빡임 (500ms) ---
  if (nowMs - lastBlinkMs >= BLINK_INTERVAL) {
    lastBlinkMs = nowMs;
    ledOn = !ledOn;  // 상태를 반전시킵니다

    // Active LOW: 켜고 싶으면 LOW, 끄려면 HIGH
    digitalWrite(LED_PIN, ledOn ? LOW : HIGH);
  }

  // --- 타이머 2: 가상 센서 읽기 (2000ms) ---
  if (nowMs - lastSensorMs >= SENSOR_INTERVAL) {
    lastSensorMs = nowMs;
    sensorCount++;

    // 실제 센서 대신 임의 값을 생성합니다 (analogRead 예시)
    int fakeValue = random(0, 4096);  // 12비트 ADC 범위
    Serial.print("[센서] 읽기 #");
    Serial.print(sensorCount);
    Serial.print(" → 값: ");
    Serial.println(fakeValue);
  }

  // --- 타이머 3: 상태 요약 출력 (5000ms) ---
  if (nowMs - lastStatusMs >= STATUS_INTERVAL) {
    lastStatusMs = nowMs;
    statusCount++;

    Serial.println("---------- 상태 요약 ----------");
    Serial.print("경과 시간: ");
    Serial.print(nowMs / 1000);
    Serial.println("초");
    Serial.print("LED 상태: ");
    Serial.println(ledOn ? "켜짐" : "꺼짐");
    Serial.print("센서 읽기 횟수: ");
    Serial.println(sensorCount);
    Serial.print("상태 출력 횟수: ");
    Serial.println(statusCount);
    Serial.println("--------------------------------");
  }
}
