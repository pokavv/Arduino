/*
 * MQTT 02 — MQTT 기본 구독 (토픽 수신 → 시리얼 출력)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   구독자 (Subscriber)
 *     특정 토픽을 "구독(Subscribe)" 등록하면
 *     그 토픽에 메시지가 올 때마다 자동으로 수신된다.
 *     채널을 구독하는 것과 같은 개념.
 *
 *   콜백 함수 (Callback)
 *     메시지가 수신됐을 때 자동으로 호출되는 함수.
 *     setCallback()으로 등록해두면 loop()에서
 *     mqttClient.loop()가 내부적으로 콜백을 호출해준다.
 *
 *   와일드카드 토픽
 *     '+' = 단일 레벨 와일드카드: "home/+/temperature" →
 *           home/living/temperature, home/bedroom/temperature 모두 수신
 *     '#' = 다중 레벨 와일드카드: "home/#" →
 *           home/ 이하 모든 토픽 수신
 *
 *   QoS (Quality of Service)
 *     0 = 최대 1회 전달 (유실 가능, 가장 빠름)
 *     1 = 최소 1회 전달 (중복 가능, 보통 사용)
 *     2 = 정확히 1회 전달 (가장 신뢰, 느림)
 *     PubSubClient는 기본 QoS 0 사용
 *
 * [준비물]
 *   Wi-Fi 공유기 (2.4GHz), MQTT 브로커
 *   테스트: MQTT Explorer 또는 mosquitto_pub 명령어로 메시지 전송
 *
 * [연결 방법]
 *   없음 — Wi-Fi는 보드 내장 안테나 사용
 *
 * [테스트 방법]
 *   업로드 후 MQTT Explorer에서 esp32c3/command 토픽에 메시지 발행
 *   또는: mosquitto_pub -h 브로커IP -t esp32c3/command -m "hello"
 *
 * [라이브러리]
 *   PubSubClient by Nick O'Leary (Arduino IDE 라이브러리 매니저 설치)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include "config.h"
#include "secrets.h"

// ─── 전역 객체 ──────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

// ─── MQTT 메시지 수신 콜백 ──────────────────────
// 구독한 토픽에 메시지가 도착하면 자동 호출
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // payload는 null 종단 문자 없는 바이트 배열 — 문자열로 변환
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println("─────────────────────────────");
  Serial.print("토픽: ");
  Serial.println(topic);
  Serial.print("메시지: ");
  Serial.println(message);
  Serial.print("길이: ");
  Serial.print(length);
  Serial.println(" bytes");

  // 수신 표시 — LED 짧게 깜빡임
  digitalWrite(BUILTIN_LED_PIN, LOW);    // 켜기
  delay(100);
  digitalWrite(BUILTIN_LED_PIN, HIGH);   // 끄기
}

// ─── Wi-Fi 연결 함수 ────────────────────────────
void connectWiFi() {
  Serial.print("Wi-Fi 연결 중: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t startTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime > WIFI_CONNECT_TIMEOUT_MS) {
      Serial.println("\n타임아웃 — 재시도");
      WiFi.disconnect();
      delay(1000);
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      startTime = millis();
    }
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("연결됨 — IP: ");
  Serial.println(WiFi.localIP());
}

// ─── MQTT 연결 및 구독 등록 함수 ───────────────
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("MQTT 연결 중...");

    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println(" 성공");

      // 연결 성공 후 구독 등록
      // subscribe(토픽) — 이 토픽에 메시지가 오면 콜백 호출
      mqttClient.subscribe(MQTT_TOPIC);

      Serial.print("구독 등록: ");
      Serial.println(MQTT_TOPIC);

      digitalWrite(BUILTIN_LED_PIN, LOW);   // 연결됨 — LED 켜기
    } else {
      Serial.print(" 실패 (");
      Serial.print(mqttClient.state());
      Serial.println(") — 5초 후 재시도");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("MQTT 기본 구독 예제 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);

  connectWiFi();

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);   // 콜백 함수 등록

  connectMQTT();

  Serial.println("메시지 대기 중...");
  Serial.print("테스트: mosquitto_pub -h ");
  Serial.print(MQTT_SERVER);
  Serial.print(" -t ");
  Serial.print(MQTT_TOPIC);
  Serial.println(" -m \"hello\"");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();

  // 이 함수가 수신된 메시지를 처리하고 콜백을 호출한다
  // 반드시 loop()에서 주기적으로 호출해야 함
  mqttClient.loop();
}
