// config.h — MQTT JSON 발행 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── MQTT 설정 ──────────────────────────────────
#define PUBLISH_INTERVAL_MS 5000           // 발행 주기 (ms)
#define MQTT_TOPIC          "esp32c3/sensor"  // 발행 토픽
#define MQTT_CLIENT_ID      "ESP32C3-json-04"

// ─── JSON 버퍼 크기 ─────────────────────────────
// ArduinoJson: JSON 직렬화에 사용할 메모리 크기 (bytes)
// {"temperature":25.5,"humidity":60.2,"uptime":12345} 정도면 128 충분
#define JSON_BUFFER_SIZE 128

// ─── Wi-Fi 연결 타임아웃 ─────────────────────────
#define WIFI_CONNECT_TIMEOUT_MS 15000

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)
