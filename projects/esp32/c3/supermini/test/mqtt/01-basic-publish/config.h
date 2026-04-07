// config.h — MQTT 기본 발행 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── MQTT 발행 설정 ─────────────────────────────
#define PUBLISH_INTERVAL_MS 5000          // 발행 주기 (ms)
#define MQTT_TOPIC          "esp32c3/test"  // 발행 토픽

// ─── MQTT 클라이언트 ID ──────────────────────────
// 브로커에서 클라이언트를 구분하는 고유 ID
// 같은 브로커에 동일 ID 연결 시 기존 연결 끊김 — 고유하게 설정
#define MQTT_CLIENT_ID "ESP32C3-pub-01"

// ─── Wi-Fi 연결 타임아웃 ─────────────────────────
#define WIFI_CONNECT_TIMEOUT_MS 15000   // Wi-Fi 연결 최대 대기 (ms)

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)
