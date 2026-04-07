/*
 * MQTT 03 — MQTT 발행 + 구독 동시 (센서 발행 & 명령 수신)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   발행과 구독 동시 사용
 *     하나의 MQTT 연결로 발행(Publisher)과 구독(Subscriber)을 동시에 할 수 있다.
 *     이 예제에서 ESP32는:
 *       - esp32c3/sensor 토픽에 센서 데이터를 5초마다 발행
 *       - esp32c3/command 토픽을 구독해 LED 제어 명령 수신
 *
 *   재연결 후 구독 복구
 *     MQTT 브로커와 연결이 끊겼다가 재연결되면
 *     기존 구독이 사라진다 — 반드시 재연결 후 subscribe() 다시 호출 필요!
 *
 *   가상 센서 값
 *     이 예제는 실제 센서 없이 난수로 온도/습도를 시뮬레이션한다.
 *     실제 센서(DHT22 등) 연결 시 해당 값으로 교체하면 된다.
 *
 * [준비물]
 *   Wi-Fi 공유기, MQTT 브로커
 *   (선택) 실제 온습도 센서 DHT22
 *
 * [연결 방법]
 *   없음 — Wi-Fi는 보드 내장 안테나 사용
 *   (DHT22 사용 시: G4 → DATA, 3.3V → VCC, GND → GND)
 *
 * [테스트 방법]
 *   - MQTT Explorer로 esp32c3/sensor 토픽 수신 확인
 *   - mosquitto_pub -h 브로커IP -t esp32c3/command -m "LED_ON"
 *
 * [라이브러리]
 *   PubSubClient by Nick O'Leary
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include "config.h"
#include "secrets.h"

// ─── 전역 객체 ──────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

// ─── 전역 변수 ──────────────────────────────────
uint32_t lastPubTime = 0;
bool     ledState    = false;   // 내장 LED 현재 상태

// ─── 가상 센서 값 생성 (실제 센서로 교체 가능) ──
float getFakeTemperature() {
  return 20.0f + (random(0, 100) / 10.0f);   // 20.0~29.9°C
}

float getFakeHumidity() {
  return 40.0f + (random(0, 200) / 10.0f);   // 40.0~59.9%
}

// ─── MQTT 수신 콜백 ─────────────────────────────
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];

  Serial.print("[구독 수신] ");
  Serial.print(topic);
  Serial.print(" → ");
  Serial.println(msg);

  // 수신된 명령으로 LED 제어
  if (msg == CMD_LED_ON) {
    digitalWrite(BUILTIN_LED_PIN, LOW);   // LOW = 켜짐 (Active LOW)
    ledState = true;
    Serial.println("→ LED 켜짐");
  } else if (msg == CMD_LED_OFF) {
    digitalWrite(BUILTIN_LED_PIN, HIGH);  // HIGH = 꺼짐
    ledState = false;
    Serial.println("→ LED 꺼짐");
  } else {
    Serial.println("→ 알 수 없는 명령");
  }
}

// ─── Wi-Fi 연결 ─────────────────────────────────
void connectWiFi() {
  Serial.print("Wi-Fi 연결 중: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t t = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - t > WIFI_CONNECT_TIMEOUT_MS) {
      WiFi.disconnect(); delay(1000);
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      t = millis();
    }
    delay(500); Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: "); Serial.println(WiFi.localIP());
}

// ─── MQTT 연결 & 구독 등록 ──────────────────────
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("MQTT 연결 중...");
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println(" 성공");
      // 재연결 시에도 반드시 subscribe() 다시 호출!
      mqttClient.subscribe(TOPIC_SUBSCRIBE);
      Serial.print("구독: "); Serial.println(TOPIC_SUBSCRIBE);
    } else {
      Serial.print(" 실패 ("); Serial.print(mqttClient.state()); Serial.println(") — 5초 후 재시도");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  randomSeed(analogRead(0));   // 난수 시드 초기화 (가상 센서용)

  Serial.println("MQTT 발행+구독 예제 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);

  connectWiFi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();   // 수신 메시지 처리 (콜백 호출)

  // 주기적으로 센서 데이터 발행
  if (millis() - lastPubTime >= PUBLISH_INTERVAL_MS) {
    lastPubTime = millis();

    float temp = getFakeTemperature();
    float hum  = getFakeHumidity();

    char payload[64];
    snprintf(payload, sizeof(payload), "temp=%.1f,hum=%.1f", temp, hum);

    bool ok = mqttClient.publish(TOPIC_PUBLISH, payload);
    Serial.print("[발행] "); Serial.print(TOPIC_PUBLISH);
    Serial.print(" → "); Serial.print(payload);
    Serial.println(ok ? " ✓" : " ✗");
  }
}
