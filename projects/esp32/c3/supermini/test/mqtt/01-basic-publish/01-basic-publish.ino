/*
 * MQTT 01 — MQTT 기본 발행 (5초마다 카운터 값 Publish)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   MQTT (Message Queuing Telemetry Transport)
 *     IoT 기기에 최적화된 경량 메시지 프로토콜.
 *     HTTP처럼 요청-응답이 아니라 "발행(Publish)-구독(Subscribe)" 방식.
 *
 *   브로커 (Broker)
 *     MQTT의 중앙 허브. 모든 메시지가 브로커를 거친다.
 *     발신자 → 브로커 → 수신자 구조.
 *     무료 공개 브로커: broker.hivemq.com, test.mosquitto.org
 *     로컬 브로커: Mosquitto (집 서버에 직접 설치 가능)
 *
 *   토픽 (Topic)
 *     메시지를 분류하는 주소 체계. 파일 경로와 비슷한 구조.
 *     예: "home/living/temperature", "esp32c3/test"
 *
 *   발행자 (Publisher)
 *     특정 토픽에 메시지를 보내는 쪽.
 *     이 예제에서 ESP32가 발행자 역할.
 *
 *   구독자 (Subscriber)
 *     특정 토픽을 구독해 메시지를 받는 쪽.
 *     MQTT Explorer 프로그램이나 스마트폰 앱으로 확인 가능.
 *
 * [준비물]
 *   Wi-Fi 공유기 (2.4GHz)
 *   MQTT 브로커 (로컬 Mosquitto 또는 공개 브로커 사용 가능)
 *
 * [연결 방법]
 *   없음 — Wi-Fi는 보드 내장 안테나 사용
 *
 * [설치 전 준비]
 *   1. secrets.h.example → secrets.h 복사
 *   2. secrets.h에 Wi-Fi SSID, 비밀번호, MQTT 브로커 주소 입력
 *
 * [라이브러리]
 *   PubSubClient by Nick O'Leary (Arduino IDE 라이브러리 매니저 설치)
 *   WiFi (ESP32 보드 패키지 내장)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include "config.h"
#include "secrets.h"

// ─── 전역 객체 ──────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

// ─── 전역 변수 ──────────────────────────────────
uint32_t counter      = 0;       // 발행할 카운터 값
uint32_t lastPubTime  = 0;       // 마지막 발행 시각

// ─── Wi-Fi 연결 함수 ────────────────────────────
void connectWiFi() {
  Serial.print("Wi-Fi 연결 중: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t startTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime > WIFI_CONNECT_TIMEOUT_MS) {
      Serial.println("\nWi-Fi 연결 실패 — 재시도");
      WiFi.disconnect();
      delay(1000);
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      startTime = millis();
    }
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Wi-Fi 연결됨 — IP: ");
  Serial.println(WiFi.localIP());
}

// ─── MQTT 연결 함수 ─────────────────────────────
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("MQTT 브로커 연결 중: ");
    Serial.println(MQTT_SERVER);

    // connect(클라이언트ID) — 인증 없이 연결
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println("MQTT 연결 성공");
      digitalWrite(BUILTIN_LED_PIN, LOW);   // LED 켜기 — 연결됨
    } else {
      Serial.print("MQTT 연결 실패, 상태 코드: ");
      Serial.println(mqttClient.state());
      // state() 코드: -4=연결 끊김, -3=서버 없음, -2=연결 거부, -1=연결 오류
      Serial.println("5초 후 재시도...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("MQTT 기본 발행 예제 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);   // 시작 시 꺼둠

  connectWiFi();

  // MQTT 브로커 주소 & 포트 설정
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);

  connectMQTT();
}

void loop() {
  // Wi-Fi 끊기면 재연결
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi 끊김 — 재연결");
    connectWiFi();
  }

  // MQTT 끊기면 재연결
  if (!mqttClient.connected()) {
    connectMQTT();
  }

  // MQTT 수신 처리 (구독 중인 경우 콜백 호출)
  mqttClient.loop();

  // 주기적으로 메시지 발행
  if (millis() - lastPubTime >= PUBLISH_INTERVAL_MS) {
    lastPubTime = millis();
    counter++;

    // 발행할 메시지 생성
    String payload = String(counter);

    // publish(토픽, 메시지) — 브로커에 전송
    bool ok = mqttClient.publish(MQTT_TOPIC, payload.c_str());

    Serial.print("Publish [");
    Serial.print(MQTT_TOPIC);
    Serial.print("] → ");
    Serial.print(payload);
    Serial.println(ok ? " ✓" : " ✗ (실패)");
  }
}
