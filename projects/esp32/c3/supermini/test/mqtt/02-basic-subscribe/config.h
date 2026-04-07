// config.h — MQTT 기본 구독 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── MQTT 구독 토픽 ─────────────────────────────
#define MQTT_TOPIC "esp32c3/command"   // 구독할 토픽

// ─── MQTT 클라이언트 ID ──────────────────────────
#define MQTT_CLIENT_ID "ESP32C3-sub-02"

// ─── Wi-Fi 연결 타임아웃 ─────────────────────────
#define WIFI_CONNECT_TIMEOUT_MS 15000

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)
