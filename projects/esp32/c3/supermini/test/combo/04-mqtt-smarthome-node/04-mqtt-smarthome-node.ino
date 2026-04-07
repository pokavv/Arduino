/*
 * combo/04-mqtt-smarthome-node — DHT22 + MQTT 스마트홈 노드
 * ================================================================
 *
 * [핵심 개념 설명]
 *   MQTT (Message Queuing Telemetry Transport)
 *     - IoT에 특화된 경량 메시지 프로토콜
 *     - 발행(Publish)/구독(Subscribe) 구조:
 *         센서 → 브로커(서버) ← 앱
 *     - 브로커: Mosquitto, Home Assistant, AWS IoT 등
 *     - 토픽(Topic): 메시지 분류 경로 (예: home/sensor/temperature)
 *
 *   이 예제
 *     - 30초마다 온도/습도 발행 (MQTT Publish)
 *     - LED 명령 토픽 구독 → "ON"/"OFF" 수신 시 LED 제어
 *
 * [라이브러리]
 *   DHT sensor library (Adafruit) — 라이브러리 매니저에서 설치
 *   PubSubClient (Nick O'Leary) — 라이브러리 매니저에서 설치
 *
 * [준비물]
 *   - DHT22 센서 모듈 1개
 *   - MQTT 브로커 (Mosquitto 설치 또는 HiveMQ Cloud 무료 계정)
 *
 * [연결 방법]
 *   G2 (DHT_PIN) → DHT22 DATA
 *   3.3V         → DHT22 VCC
 *   GND          → DHT22 GND
 *   G8 (LED_PIN) = 내장 LED (Active LOW)
 */

#include "config.h"
#include "secrets.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

DHT dht(DHT_PIN, DHT22);
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

unsigned long lastPublishTime = 0;

// ---- MQTT 메시지 수신 콜백 ----
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // payload를 null-terminated 문자열로 변환
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("[MQTT 수신] 토픽: ");
  Serial.print(topic);
  Serial.print(" / 메시지: ");
  Serial.println(message);

  // LED 명령 처리
  if (String(topic) == TOPIC_LED_CMD) {
    if (message == "ON" || message == "on") {
      digitalWrite(LED_PIN, LOW);   // Active LOW — 켜짐
      mqtt.publish(TOPIC_LED_STA, "ON");  // 상태 발행 (확인용)
      Serial.println("LED 켜짐");
    } else if (message == "OFF" || message == "off") {
      digitalWrite(LED_PIN, HIGH);  // 꺼짐
      mqtt.publish(TOPIC_LED_STA, "OFF");
      Serial.println("LED 꺼짐");
    }
  }
}

// ---- Wi-Fi 연결 함수 ----
void connectWiFi() {
  Serial.print("Wi-Fi 연결 중: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500); Serial.print("."); retries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\n연결 성공! IP: "); Serial.println(WiFi.localIP());
  }
}

// ---- MQTT 연결 함수 ----
bool connectMqtt() {
  Serial.print("MQTT 연결 중: ");
  Serial.println(MQTT_BROKER);

  bool connected = false;
  if (strlen(MQTT_USER) > 0) {
    connected = mqtt.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASSWORD);
  } else {
    connected = mqtt.connect(MQTT_CLIENT_ID);
  }

  if (connected) {
    Serial.println("MQTT 연결 성공!");
    mqtt.subscribe(TOPIC_LED_CMD);  // LED 명령 토픽 구독
    Serial.print("구독: "); Serial.println(TOPIC_LED_CMD);
  } else {
    Serial.print("MQTT 연결 실패, 코드: "); Serial.println(mqtt.state());
  }
  return connected;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" MQTT 스마트홈 노드");
  Serial.println("===================================");

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);  // 초기: 꺼짐

  dht.begin();
  delay(2000);  // DHT22 안정화

  connectWiFi();

  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(mqttCallback);
  connectMqtt();
}

void loop() {
  // Wi-Fi 연결 확인 및 복구
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // MQTT 연결 확인 및 복구
  if (!mqtt.connected()) {
    connectMqtt();
  }
  mqtt.loop();  // MQTT 수신 처리 — 반드시 loop에서 호출

  // ---- 주기적 센서 발행 ----
  if (millis() - lastPublishTime >= PUBLISH_INTERVAL) {
    lastPublishTime = millis();

    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();

    if (!isnan(temp) && !isnan(hum)) {
      char tempStr[10], humStr[10];
      dtostrf(temp, 4, 1, tempStr);  // float → 문자열 변환 (소수점 1자리)
      dtostrf(hum,  4, 1, humStr);

      mqtt.publish(TOPIC_TEMP, tempStr);
      mqtt.publish(TOPIC_HUM,  humStr);

      Serial.print("[발행] 온도: "); Serial.print(tempStr);
      Serial.print("°C / 습도: "); Serial.print(humStr); Serial.println("%");
    } else {
      Serial.println("[경고] DHT22 읽기 실패");
    }
  }
}
