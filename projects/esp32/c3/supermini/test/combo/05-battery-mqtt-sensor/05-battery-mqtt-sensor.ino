/*
 * combo/05-battery-mqtt-sensor — 딥슬립 + MQTT 배터리 절전 센서
 * ================================================================
 *
 * [핵심 개념 설명]
 *   딥슬립 (Deep Sleep)
 *     - CPU, 대부분의 주변장치 전원을 끄는 최저 전력 모드
 *     - 소비 전류: ~10uA (일반 동작 ~80mA 대비 8000배 절약)
 *     - 배터리 센서의 핵심 기법
 *
 *   이 예제의 동작 사이클
 *     전원 ON / 타이머 웨이크업
 *       → Wi-Fi 연결
 *       → ADC 읽기 + 배터리 전압 측정
 *       → MQTT 발행
 *       → 딥슬립 (5분)
 *       → 반복
 *
 *   배터리 전압 측정
 *     - ADC 최대 입력: 3.3V
 *     - 배터리(4.2V)는 분압 저항으로 낮춰서 ADC 입력
 *     - R1=R2=100kΩ 분압 → ADC 입력 = 배터리 전압 / 2
 *
 * [라이브러리]
 *   PubSubClient — 라이브러리 매니저에서 설치
 *
 * [준비물]
 *   - 3.7V 리튬 배터리 + 배터리 관리 모듈(TP4056 등)
 *   - 분압 저항 100kΩ 2개 (배터리 전압 측정용)
 *
 * [연결 방법]
 *   배터리(+) → R1(100kΩ) → G0(ADC_PIN) → R2(100kΩ) → GND
 *   (G0의 ADC 값 × 2 = 배터리 전압)
 */

#include "config.h"
#include "secrets.h"
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

// ---- Wi-Fi 연결 (타임아웃 포함) ----
bool connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Wi-Fi 연결 중");

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500); Serial.print("."); retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\n연결 성공! IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }
  Serial.println("\n연결 실패!");
  return false;
}

// ---- MQTT 연결 ----
bool connectMqtt() {
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  int retries = 0;
  while (!mqtt.connected() && retries < 5) {
    bool ok = strlen(MQTT_USER) > 0
                ? mqtt.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASSWORD)
                : mqtt.connect(MQTT_CLIENT_ID);
    if (!ok) { delay(1000); retries++; }
  }
  return mqtt.connected();
}

// ---- 딥슬립 진입 ----
void enterDeepSleep() {
  uint64_t sleepMicros = (uint64_t)SLEEP_DURATION_SEC * 1000000ULL;
  Serial.print("딥슬립 진입 (");
  Serial.print(SLEEP_DURATION_SEC);
  Serial.println("초)...");
  Serial.flush();

  esp_sleep_enable_timer_wakeup(sleepMicros);  // 타이머 웨이크업 설정
  esp_deep_sleep_start();                       // 딥슬립 시작 (이후 코드 실행 안 됨)
}

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("===================================");
  Serial.println(" 딥슬립 배터리 MQTT 센서");
  Serial.println("===================================");

  // ---- 부팅 횟수 (RTC 메모리) ----
  RTC_DATA_ATTR static int bootCount = 0;
  bootCount++;
  Serial.print("부팅 횟수: "); Serial.println(bootCount);

  // ---- ADC 읽기 ----
  // ADC 안정화를 위해 여러 번 읽어 평균
  int adcSum = 0;
  for (int i = 0; i < 8; i++) {
    adcSum += analogRead(ADC_PIN);
    delay(5);
  }
  int adcAvg        = adcSum / 8;
  float adcVoltage  = adcAvg * (3.3f / 4095.0f);      // 0.0~3.3V 변환
  float battVoltage = adcVoltage * VOLTAGE_DIVIDER_RATIO;  // 분압 보정

  Serial.print("ADC 원시값  : "); Serial.println(adcAvg);
  Serial.print("ADC 전압    : "); Serial.print(adcVoltage, 2); Serial.println(" V");
  Serial.print("배터리 전압 : "); Serial.print(battVoltage, 2); Serial.println(" V");

  // ---- Wi-Fi + MQTT 연결 ----
  if (!connectWiFi() || !connectMqtt()) {
    Serial.println("[오류] 연결 실패 — 딥슬립으로 재시도");
    enterDeepSleep();
    return;
  }

  // ---- MQTT 발행 ----
  char sensorStr[20], battStr[10];
  dtostrf(adcVoltage, 4, 2, sensorStr);
  dtostrf(battVoltage, 4, 2, battStr);

  mqtt.publish(TOPIC_SENSOR,  sensorStr);
  mqtt.publish(TOPIC_BATTERY, battStr);

  Serial.print("[발행] 센서: "); Serial.print(sensorStr); Serial.println("V");
  Serial.print("[발행] 배터리: "); Serial.print(battStr); Serial.println("V");

  mqtt.loop();       // 발행 완료 대기
  delay(500);        // 브로커로 전송될 시간 확보

  WiFi.disconnect(true);  // Wi-Fi 완전 종료 (딥슬립 전 전력 절감)
  delay(100);

  enterDeepSleep();  // 딥슬립 — 이 이후 코드는 실행되지 않음
}

void loop() {
  // 딥슬립 예제에서는 모든 작업이 setup()에서 완료됨
  // loop()는 실행되지 않음
}
