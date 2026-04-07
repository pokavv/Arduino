/*
 * MQTT 08 — Home Assistant MQTT Discovery (자동 엔티티 등록)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   Home Assistant (HA)
 *     오픈소스 홈 자동화 플랫폼.
 *     온도계, 스위치, 카메라 등 다양한 IoT 기기를 한 곳에서 관리.
 *     Raspberry Pi나 집 서버에 설치해 로컬로 운영 가능.
 *
 *   MQTT Discovery
 *     HA가 제공하는 자동 장치 등록 기능.
 *     특정 형식의 토픽에 JSON 설정 메시지를 발행하면
 *     HA가 자동으로 엔티티(센서, 스위치 등)를 등록한다.
 *     수동으로 configuration.yaml을 편집할 필요 없음.
 *
 *   Discovery 토픽 형식
 *     homeassistant/{component}/{object_id}/config
 *     예: homeassistant/sensor/esp32c3_temperature/config
 *
 *   Discovery JSON 구조 (온도 센서 예)
 *     {
 *       "name": "ESP32 온도",           ← HA에 표시되는 이름
 *       "state_topic": "esp32c3/data",  ← 실제 값이 발행되는 토픽
 *       "value_template": "{{ value_json.temperature }}", ← JSON에서 값 추출
 *       "unit_of_measurement": "°C",   ← 단위
 *       "unique_id": "esp32c3_temp",   ← 중복 방지 고유 ID
 *       "device": { ... }              ← 장치 정보 (여러 엔티티를 하나의 장치로 묶음)
 *     }
 *
 *   Retain 플래그 중요!
 *     Discovery 메시지는 반드시 Retain = true로 발행해야 한다.
 *     HA가 재시작될 때 브로커에서 Retain 메시지를 읽어 엔티티를 복구하기 때문.
 *
 * [준비물]
 *   Wi-Fi 공유기
 *   Home Assistant 서버 (같은 네트워크)
 *   HA에 Mosquitto 브로커 애드온 설치
 *   HA → 설정 → 기기 및 서비스 → MQTT 통합 추가
 *
 * [연결 방법]
 *   없음 — Wi-Fi는 보드 내장 안테나 사용
 *   G1 핀에 ADC로 가상 온도 노이즈 값 읽기 (센서 없이 테스트)
 *
 * [HA에서 확인 방법]
 *   1. 이 코드 업로드 후 실행
 *   2. HA → 설정 → 기기 및 서비스 → MQTT
 *   3. "ESP32-C3 Super Mini" 장치 자동 등록 확인
 *   4. 온도/습도 엔티티 값 확인
 *
 * [라이브러리]
 *   PubSubClient by Nick O'Leary
 *   ArduinoJson by Benoit Blanchon
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
uint32_t lastPubTime    = 0;
bool     discoveryDone  = false;   // Discovery 발행 완료 여부

// ─── 가상 센서 값 ────────────────────────────────
// ADC 노이즈를 활용해 값이 조금씩 변하도록 시뮬레이션
float getTemperature() {
  int raw = analogRead(ADC_PIN);   // 0~4095 (12비트)
  // ADC 값을 18~28°C 범위로 매핑
  return 18.0f + (raw / 4095.0f) * 10.0f;
}

float getHumidity() {
  int raw = analogRead(ADC_PIN);
  return 40.0f + (raw / 4095.0f) * 30.0f;
}

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

// ─── MQTT Discovery 메시지 발행 ─────────────────
// HA에 엔티티를 자동 등록하는 핵심 함수
void publishDiscovery() {
  // ── 온도 센서 Discovery ──
  {
    // Discovery 토픽: homeassistant/sensor/{object_id}/config
    char topic[128];
    snprintf(topic, sizeof(topic), "%s/%s/%s/config",
      HA_DISCOVERY_PREFIX, HA_COMPONENT, HA_TEMP_OBJECT_ID);

    // Discovery JSON 구성
    StaticJsonDocument<512> doc;
    doc["name"]               = "ESP32C3 온도";
    doc["state_topic"]        = SENSOR_TOPIC;
    // value_template: JSON 페이로드에서 temperature 키 값 추출
    doc["value_template"]     = "{{ value_json.temperature | round(1) }}";
    doc["unit_of_measurement"] = "°C";
    doc["device_class"]       = "temperature";   // HA 아이콘/단위 자동 설정
    doc["unique_id"]          = HA_TEMP_OBJECT_ID;
    doc["availability_topic"] = LWT_TOPIC;
    doc["payload_available"]  = "online";
    doc["payload_not_available"] = "offline";

    // 장치 정보 (여러 엔티티를 하나의 장치로 묶음)
    JsonObject device = doc.createNestedObject("device");
    device["identifiers"][0] = DEVICE_ID;
    device["name"]           = DEVICE_NAME;
    device["model"]          = "ESP32-C3 Super Mini";
    device["manufacturer"]   = "Espressif";

    char jsonBuf[512];
    serializeJson(doc, jsonBuf, sizeof(jsonBuf));

    // Retain = true: HA 재시작 후에도 엔티티 유지
    mqttClient.publish(topic, jsonBuf, true);
    Serial.print("[Discovery] 온도 센서 등록: "); Serial.println(topic);
  }

  // ── 습도 센서 Discovery ──
  {
    char topic[128];
    snprintf(topic, sizeof(topic), "%s/%s/%s/config",
      HA_DISCOVERY_PREFIX, HA_COMPONENT, HA_HUM_OBJECT_ID);

    StaticJsonDocument<512> doc;
    doc["name"]               = "ESP32C3 습도";
    doc["state_topic"]        = SENSOR_TOPIC;
    doc["value_template"]     = "{{ value_json.humidity | round(1) }}";
    doc["unit_of_measurement"] = "%";
    doc["device_class"]       = "humidity";
    doc["unique_id"]          = HA_HUM_OBJECT_ID;
    doc["availability_topic"] = LWT_TOPIC;
    doc["payload_available"]  = "online";
    doc["payload_not_available"] = "offline";

    JsonObject device = doc.createNestedObject("device");
    device["identifiers"][0] = DEVICE_ID;
    device["name"]           = DEVICE_NAME;
    device["model"]          = "ESP32-C3 Super Mini";
    device["manufacturer"]   = "Espressif";

    char jsonBuf[512];
    serializeJson(doc, jsonBuf, sizeof(jsonBuf));
    mqttClient.publish(topic, jsonBuf, true);
    Serial.print("[Discovery] 습도 센서 등록: "); Serial.println(topic);
  }

  discoveryDone = true;
  Serial.println("HA Discovery 완료 — HA에서 장치 확인하세요");
}

// ─── MQTT 연결 & Discovery ──────────────────────
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("MQTT 연결 중...");

    bool ok = mqttClient.connect(
      MQTT_CLIENT_ID,
      MQTT_USER, MQTT_PASS,
      LWT_TOPIC, 0, true, LWT_MESSAGE   // LWT 등록
    );

    if (ok) {
      Serial.println(" 성공");
      mqttClient.publish(LWT_TOPIC, "online", true);  // 온라인 상태 발행
      digitalWrite(BUILTIN_LED_PIN, LOW);

      // 연결 직후 Discovery 메시지 발행
      publishDiscovery();
    } else {
      Serial.print(" 실패 ("); Serial.print(mqttClient.state());
      Serial.println(") — 5초 후 재시도");
      delay(5000);
    }
  }
}

// ─── 센서 데이터 발행 ───────────────────────────
void publishSensorData() {
  float temp = getTemperature();
  float hum  = getHumidity();

  StaticJsonDocument<128> doc;
  doc["temperature"] = serialized(String(temp, 1));
  doc["humidity"]    = serialized(String(hum, 1));
  doc["uptime"]      = millis() / 1000;

  char jsonBuf[128];
  serializeJson(doc, jsonBuf, sizeof(jsonBuf));

  bool ok = mqttClient.publish(SENSOR_TOPIC, jsonBuf);
  Serial.print("[센서] "); Serial.print(jsonBuf);
  Serial.println(ok ? " ✓" : " ✗");
}

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("HA MQTT Discovery 예제 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);

  connectWiFi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  connectMQTT();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  if (!mqttClient.connected()) {
    discoveryDone = false;   // 재연결 시 Discovery 재발행
    connectMQTT();
  }

  mqttClient.loop();

  // 주기적으로 센서 데이터 발행
  if (millis() - lastPubTime >= PUBLISH_INTERVAL_MS) {
    lastPubTime = millis();
    publishSensorData();
  }
}
