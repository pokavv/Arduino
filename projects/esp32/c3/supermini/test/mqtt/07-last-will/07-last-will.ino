/*
 * MQTT 07 — Last Will & Testament (LWT, 유언 메시지)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   LWT (Last Will and Testament) — 유언 메시지
 *     기기가 정상적으로 연결을 끊는 게 아니라,
 *     전원이 갑자기 꺼지거나 네트워크가 끊기는 등
 *     "예기치 않은 연결 종료" 시 브로커가 자동으로 보내주는 메시지.
 *
 *   동작 원리
 *     1. 연결(connect)할 때 브로커에 유언 메시지를 미리 등록
 *     2. 브로커는 이 메시지를 보관
 *     3. 기기가 정상 연결 중에는 아무것도 안 함
 *     4. 기기가 예기치 않게 끊기면 브로커가 자동으로 LWT 메시지 발행
 *
 *   활용 예시
 *     - esp32c3/status → "online" : 연결 성공 직후 직접 발행 (정상 상태)
 *     - esp32c3/status → "offline": LWT로 등록 (비정상 종료 시 자동 발행)
 *     이렇게 하면 항상 기기 상태를 알 수 있다.
 *
 *   Retain 플래그
 *     true로 설정하면 브로커가 마지막 메시지를 저장해둔다.
 *     나중에 새로 구독한 클라이언트도 바로 "offline" 상태를 받을 수 있다.
 *
 *   정상 종료 vs 비정상 종료
 *     정상 종료: disconnect() 호출 → LWT 발행 안 됨 (DISCONNECT 패킷 전송)
 *     비정상 종료: 전원 끊김, 크래시 → LWT 발행 (Keep-Alive 타임아웃 후)
 *
 * [준비물]
 *   Wi-Fi 공유기, MQTT 브로커
 *
 * [테스트 방법]
 *   1. 업로드 후 MQTT Explorer에서 esp32c3/status 구독
 *   2. 연결되면 "online" 메시지 수신 확인
 *   3. ESP32 전원 갑자기 끄기 → 잠시 후 "offline" 메시지 수신 확인
 *   4. 정상 종료(reset) 시엔 LWT 발행 안 됨
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
uint32_t counter     = 0;

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

// ─── MQTT 연결 (LWT 포함) ───────────────────────
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("MQTT 연결 중 (LWT 포함)...");

    // connect() 확장 버전: LWT 등록 포함
    // connect(클라이언트ID, 사용자, 비밀번호, LWT토픽, LWT QoS, LWT Retain, LWT 메시지)
    bool ok = mqttClient.connect(
      MQTT_CLIENT_ID,  // 클라이언트 ID
      nullptr,         // 사용자 ID (없음)
      nullptr,         // 비밀번호 (없음)
      LWT_TOPIC,       // 유언 메시지 토픽
      LWT_QOS,         // 유언 메시지 QoS
      LWT_RETAIN,      // 유언 메시지 Retain 여부
      LWT_MESSAGE      // 유언 메시지 내용 ("offline")
    );

    if (ok) {
      Serial.println(" 성공");
      Serial.print("LWT 등록됨: ["); Serial.print(LWT_TOPIC);
      Serial.print("] → \""); Serial.print(LWT_MESSAGE); Serial.println("\"");

      // 연결 직후 "online" 상태 직접 발행 (Retain = true)
      mqttClient.publish(LWT_TOPIC, "online", LWT_RETAIN);
      Serial.println("상태 발행: \"online\"");

      digitalWrite(BUILTIN_LED_PIN, LOW);
    } else {
      Serial.print(" 실패 ("); Serial.print(mqttClient.state());
      Serial.println(") — 5초 후 재시도");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("MQTT LWT (Last Will) 예제 시작");

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

  // 주기적으로 데이터 발행 (기기가 살아있는 증거)
  if (millis() - lastPubTime >= PUBLISH_INTERVAL_MS) {
    lastPubTime = millis();
    counter++;

    char payload[32];
    snprintf(payload, sizeof(payload), "%lu", counter);
    bool ok = mqttClient.publish(DATA_TOPIC, payload);

    Serial.print("[발행] "); Serial.print(DATA_TOPIC);
    Serial.print(" → "); Serial.print(payload);
    Serial.println(ok ? " ✓" : " ✗");
  }
}
