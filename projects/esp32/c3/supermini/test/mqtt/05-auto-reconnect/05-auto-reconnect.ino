/*
 * MQTT 05 — MQTT & Wi-Fi 자동 재연결 (millis 기반 논블로킹)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   왜 자동 재연결이 필요한가?
 *     IoT 기기는 수일~수개월 쉬지 않고 동작한다.
 *     그 사이 공유기 재시작, 브로커 재시작, 일시적 네트워크 오류가 발생할 수 있다.
 *     코드가 재연결을 처리하지 않으면 기기가 멈춰버린다.
 *
 *   논블로킹 재연결이란?
 *     while(연결될 때까지 기다려) 방식은 블로킹 — 다른 작업을 못 한다.
 *     millis() 기반으로 "n초 전에 시도했으면 건너뛰기"를 구현하면
 *     재연결 시도 중에도 다른 코드가 계속 실행된다.
 *
 *   재연결 순서
 *     Wi-Fi가 먼저, MQTT는 그 다음.
 *     Wi-Fi 없이 MQTT 연결을 시도하면 항상 실패하므로 순서 중요.
 *
 *   하트비트 (Heartbeat)
 *     주기적으로 브로커에 "나 살아있어요" 메시지를 보내는 패턴.
 *     서버 측에서 하트비트가 끊기면 기기 오프라인으로 판단한다.
 *
 * [준비물]
 *   Wi-Fi 공유기, MQTT 브로커
 *
 * [연결 방법]
 *   없음 — Wi-Fi는 보드 내장 안테나 사용
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
uint32_t lastPubTime        = 0;
uint32_t lastReconnectTime  = 0;   // 마지막 MQTT 재연결 시도 시각
uint32_t lastWifiCheckTime  = 0;   // 마지막 Wi-Fi 확인 시각
uint32_t reconnectCount     = 0;   // 재연결 횟수 (통계용)

// ─── Wi-Fi 연결 (논블로킹 방식) ─────────────────
// 타임아웃 내에 연결 시도하고, 성공/실패 여부만 반환
bool tryConnectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  Serial.print("Wi-Fi 연결 중: ");
  Serial.println(WIFI_SSID);
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t startTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime > WIFI_CONNECT_TIMEOUT_MS) {
      Serial.println("Wi-Fi 연결 타임아웃");
      return false;
    }
    delay(300);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Wi-Fi 연결됨 — IP: ");
  Serial.println(WiFi.localIP());
  return true;
}

// ─── MQTT 재연결 시도 (논블로킹) ────────────────
// 이미 연결됐으면 즉시 반환, 마지막 시도 이후 일정 시간 지났을 때만 재시도
bool tryReconnectMQTT() {
  if (mqttClient.connected()) return true;

  // 재연결 쿨다운: RECONNECT_INTERVAL_MS 이내에 재시도 안 함
  if (millis() - lastReconnectTime < RECONNECT_INTERVAL_MS) return false;
  lastReconnectTime = millis();

  // Wi-Fi가 없으면 MQTT 연결 불가
  if (WiFi.status() != WL_CONNECTED) return false;

  reconnectCount++;
  Serial.print("MQTT 재연결 시도 #");
  Serial.print(reconnectCount);
  Serial.print("...");

  if (mqttClient.connect(MQTT_CLIENT_ID)) {
    Serial.println(" 성공");
    mqttClient.subscribe("esp32c3/command");   // 구독 복구
    digitalWrite(BUILTIN_LED_PIN, LOW);         // 연결됨 — LED 켜기
    return true;
  } else {
    Serial.print(" 실패 (state=");
    Serial.print(mqttClient.state());
    Serial.println(")");
    digitalWrite(BUILTIN_LED_PIN, HIGH);   // 미연결 — LED 끄기
    return false;
  }
}

// ─── 발행 함수 ──────────────────────────────────
void publishHeartbeat() {
  char payload[64];
  snprintf(payload, sizeof(payload),
    "{\"uptime\":%lu,\"reconnects\":%lu}",
    millis() / 1000, reconnectCount
  );

  bool ok = mqttClient.publish(MQTT_TOPIC, payload);
  Serial.print("[하트비트] "); Serial.print(payload);
  Serial.println(ok ? " ✓" : " ✗");
}

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("MQTT 자동 재연결 예제 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);

  // 최초 Wi-Fi 연결 (setup에서는 블로킹 방식으로 확실히 연결)
  tryConnectWiFi();

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);

  // 최초 MQTT 연결 (즉시 시도)
  lastReconnectTime = 0;   // 쿨다운 없이 즉시 시도
  tryReconnectMQTT();
}

void loop() {
  uint32_t now = millis();

  // ── Wi-Fi 상태 주기적 확인 ──
  if (now - lastWifiCheckTime >= WIFI_CHECK_INTERVAL_MS) {
    lastWifiCheckTime = now;
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Wi-Fi 끊김 — 재연결 시도");
      tryConnectWiFi();
    }
  }

  // ── MQTT 재연결 시도 (논블로킹) ──
  if (!mqttClient.connected()) {
    tryReconnectMQTT();
  }

  // ── MQTT 메시지 처리 ──
  mqttClient.loop();

  // ── 하트비트 발행 ──
  if (mqttClient.connected() && (now - lastPubTime >= PUBLISH_INTERVAL_MS)) {
    lastPubTime = now;
    publishHeartbeat();
  }
}
