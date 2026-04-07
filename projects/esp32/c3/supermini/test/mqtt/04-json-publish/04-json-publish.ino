/*
 * MQTT 04 — MQTT JSON 발행 (온도/습도/업타임 JSON 포맷 전송)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   JSON이란?
 *     JavaScript Object Notation.
 *     사람이 읽기 쉽고 기계가 파싱하기 쉬운 데이터 형식.
 *     {"key": value} 구조로 여러 데이터를 하나의 메시지에 담을 수 있다.
 *     예: {"temperature": 25.5, "humidity": 60.2, "uptime": 12345}
 *
 *   왜 JSON을 쓰나?
 *     단순 문자열("25.5")은 하나의 값만 담을 수 있다.
 *     JSON은 여러 값을 구조화해 한 번에 전송 가능.
 *     Home Assistant, Node-RED 등 대부분의 IoT 플랫폼이 JSON을 선호.
 *
 *   ArduinoJson 라이브러리
 *     ESP32에서 JSON을 쉽게 만들고 파싱하는 라이브러리.
 *     StaticJsonDocument: 스택 메모리 사용 (크기 고정, 빠름)
 *     DynamicJsonDocument: 힙 메모리 사용 (크기 유연, 느림)
 *
 *   serializeJson()
 *     JSON 객체를 문자열로 직렬화(변환)하는 함수.
 *     {"temperature":25.5,"humidity":60.2} 같은 문자열로 변환.
 *
 * [준비물]
 *   Wi-Fi 공유기, MQTT 브로커
 *   (선택) 실제 온습도 센서
 *
 * [연결 방법]
 *   없음 — 가상 센서 값 사용
 *
 * [라이브러리]
 *   PubSubClient by Nick O'Leary
 *   ArduinoJson by Benoit Blanchon (Arduino IDE 라이브러리 매니저 설치)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "secrets.h"

// ─── 전역 객체 ──────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

// ─── 전역 변수 ──────────────────────────────────
uint32_t lastPubTime = 0;

// ─── 가상 센서 값 ────────────────────────────────
float getFakeTemperature() { return 20.0f + (random(0, 100) / 10.0f); }
float getFakeHumidity()    { return 40.0f + (random(0, 200) / 10.0f); }

// ─── Wi-Fi 연결 ─────────────────────────────────
void connectWiFi() {
  Serial.print("Wi-Fi 연결 중: "); Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t t = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - t > WIFI_CONNECT_TIMEOUT_MS) {
      WiFi.disconnect(); delay(1000);
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD); t = millis();
    }
    delay(500); Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: "); Serial.println(WiFi.localIP());
}

// ─── MQTT 연결 ──────────────────────────────────
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("MQTT 연결 중...");
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println(" 성공");
      digitalWrite(BUILTIN_LED_PIN, LOW);
    } else {
      Serial.print(" 실패 ("); Serial.print(mqttClient.state());
      Serial.println(") — 5초 후 재시도");
      delay(5000);
    }
  }
}

// ─── JSON 빌드 & 발행 함수 ──────────────────────
void publishSensorData() {
  float temp    = getFakeTemperature();
  float hum     = getFakeHumidity();
  uint32_t uptime = millis() / 1000;   // 초 단위 업타임

  // JSON 문서 생성 (스택 버퍼 사용)
  StaticJsonDocument<JSON_BUFFER_SIZE> doc;

  // 키-값 추가
  doc["temperature"] = serialized(String(temp, 1));   // 소수점 1자리
  doc["humidity"]    = serialized(String(hum, 1));
  doc["uptime"]      = uptime;                         // 정수 (초)

  // JSON → 문자열로 직렬화
  char jsonBuf[JSON_BUFFER_SIZE];
  size_t len = serializeJson(doc, jsonBuf, sizeof(jsonBuf));

  // MQTT 발행
  bool ok = mqttClient.publish(MQTT_TOPIC, jsonBuf);

  Serial.print("[발행] "); Serial.print(MQTT_TOPIC);
  Serial.print(" → "); Serial.print(jsonBuf);
  Serial.print(" ("); Serial.print(len); Serial.print("B)");
  Serial.println(ok ? " ✓" : " ✗");
}

void setup() {
  Serial.begin(BAUD_RATE);
  randomSeed(analogRead(0));
  Serial.println("MQTT JSON 발행 예제 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);

  connectWiFi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  connectMQTT();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  if (millis() - lastPubTime >= PUBLISH_INTERVAL_MS) {
    lastPubTime = millis();
    publishSensorData();
  }
}
