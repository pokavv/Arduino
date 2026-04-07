// config.h — MQTT 발행 + 구독 동시 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── MQTT 토픽 ──────────────────────────────────
#define TOPIC_PUBLISH   "esp32c3/sensor"    // 발행 토픽 (센서 데이터)
#define TOPIC_SUBSCRIBE "esp32c3/command"   // 구독 토픽 (제어 명령)

// ─── MQTT 클라이언트 ID ──────────────────────────
#define MQTT_CLIENT_ID "ESP32C3-pubsub-03"

// ─── 발행 주기 ──────────────────────────────────
#define PUBLISH_INTERVAL_MS 5000   // 센서 데이터 발행 주기 (ms)

// ─── Wi-Fi 연결 타임아웃 ─────────────────────────
#define WIFI_CONNECT_TIMEOUT_MS 15000

// ─── LED 제어 명령 ──────────────────────────────
#define CMD_LED_ON  "LED_ON"
#define CMD_LED_OFF "LED_OFF"

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)
