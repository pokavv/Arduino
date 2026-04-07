// config.h — MQTT 자동 재연결 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── MQTT 설정 ──────────────────────────────────
#define MQTT_TOPIC        "esp32c3/heartbeat"
#define MQTT_CLIENT_ID    "ESP32C3-reconnect-05"
#define PUBLISH_INTERVAL_MS 5000    // 하트비트 발행 주기 (ms)

// ─── 재연결 설정 ────────────────────────────────
#define RECONNECT_INTERVAL_MS  5000    // MQTT 재연결 시도 간격 (ms)
#define WIFI_CHECK_INTERVAL_MS 10000   // Wi-Fi 상태 확인 주기 (ms)
#define WIFI_CONNECT_TIMEOUT_MS 20000  // Wi-Fi 연결 최대 대기 (ms)

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)
