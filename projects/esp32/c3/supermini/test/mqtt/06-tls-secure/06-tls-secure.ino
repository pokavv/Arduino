/*
 * MQTT 06 — MQTT TLS 보안 연결 (암호화 통신)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   TLS (Transport Layer Security)
 *     인터넷 통신을 암호화하는 프로토콜.
 *     HTTPS의 "S"가 바로 TLS(또는 SSL).
 *     일반 MQTT(포트 1883)는 데이터가 평문 — 도청 가능.
 *     TLS MQTT(포트 8883)는 암호화 — 중간에서 읽을 수 없음.
 *
 *   인증서 (Certificate)
 *     "이 서버가 진짜다"를 증명하는 전자 문서.
 *     CA(인증 기관)가 서명한 인증서만 신뢰한다.
 *     브라우저가 HTTPS 사이트를 신뢰하는 원리와 동일.
 *
 *   setInsecure() 모드
 *     인증서 검증을 생략하고 암호화만 사용.
 *     빠르게 테스트할 때 유용하지만, 중간자 공격(MITM)에 취약.
 *     개발/테스트 환경에서는 OK, 실제 제품에서는 CA 인증서 검증 권장.
 *
 *   WiFiClientSecure
 *     일반 WiFiClient를 TLS로 감싼 클라이언트.
 *     PubSubClient에 wifiClient 대신 secureClient를 넘기면
 *     자동으로 TLS로 연결된다.
 *
 * [준비물]
 *   Wi-Fi 공유기, TLS 지원 MQTT 브로커 (포트 8883)
 *   무료 공개 TLS 브로커: broker.hivemq.com:8883
 *
 * [연결 방법]
 *   없음 — Wi-Fi는 보드 내장 안테나 사용
 *
 * [라이브러리]
 *   PubSubClient by Nick O'Leary
 *   WiFiClientSecure (ESP32 보드 패키지 내장)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include "config.h"
#include "secrets.h"

// ─── TLS 클라이언트 ─────────────────────────────
// WiFiClientSecure: TLS 암호화 소켓
WiFiClientSecure secureClient;
PubSubClient     mqttClient(secureClient);   // TLS 클라이언트를 MQTT에 전달

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

// ─── MQTT 연결 (TLS) ────────────────────────────
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("TLS MQTT 연결 중 ("); Serial.print(MQTT_SERVER);
    Serial.print(":"); Serial.print(MQTT_PORT); Serial.print(")...");

    // MQTT 인증 정보 포함 연결 시도
    // connect(클라이언트ID, 사용자ID, 비밀번호)
    bool ok;
    if (strlen(MQTT_USER) > 0) {
      ok = mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS);
    } else {
      ok = mqttClient.connect(MQTT_CLIENT_ID);   // 인증 없음
    }

    if (ok) {
      Serial.println(" 성공 (TLS 암호화 중)");
      digitalWrite(BUILTIN_LED_PIN, LOW);
    } else {
      Serial.print(" 실패 (state="); Serial.print(mqttClient.state());
      Serial.println(") — 5초 후 재시도");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("MQTT TLS 보안 연결 예제 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);

  connectWiFi();

#if TLS_INSECURE_MODE
  // 인증서 검증 생략 모드 (테스트용)
  secureClient.setInsecure();
  Serial.println("[경고] TLS Insecure 모드 — 인증서 검증 안 함 (테스트 전용)");
#else
  // CA 인증서 검증 (프로덕션 권장)
  // secrets.h에서 CA_CERT 정의 후 아래 주석 해제
  // secureClient.setCACert(CA_CERT);
  Serial.println("TLS CA 인증서 검증 모드");
#endif

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  connectMQTT();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  if (millis() - lastPubTime >= PUBLISH_INTERVAL_MS) {
    lastPubTime = millis();
    counter++;

    char payload[64];
    snprintf(payload, sizeof(payload), "{\"count\":%lu,\"secure\":true}", counter);

    bool ok = mqttClient.publish(MQTT_TOPIC, payload);
    Serial.print("[TLS 발행] "); Serial.print(payload);
    Serial.println(ok ? " ✓" : " ✗");
  }
}
