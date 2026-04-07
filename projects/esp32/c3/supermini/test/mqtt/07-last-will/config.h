// config.h — MQTT Last Will & Testament 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── MQTT 클라이언트 ID ──────────────────────────
#define MQTT_CLIENT_ID "ESP32C3-lwt-07"

// ─── LWT(유언 메시지) 설정 ──────────────────────
// 기기가 예기치 않게 연결이 끊기면 브로커가 자동으로 이 메시지를 발행
#define LWT_TOPIC    "esp32c3/status"
#define LWT_MESSAGE  "offline"
#define LWT_QOS      0       // QoS 0 (최대 1회 전달)
#define LWT_RETAIN   true    // Retain: 새 구독자도 마지막 상태를 바로 수신

// ─── 일반 발행 토픽 ─────────────────────────────
#define DATA_TOPIC "esp32c3/data"
#define PUBLISH_INTERVAL_MS 5000

// ─── Wi-Fi 연결 타임아웃 ─────────────────────────
#define WIFI_CONNECT_TIMEOUT_MS 15000

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8
