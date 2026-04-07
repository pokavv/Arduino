// config.h — MQTT TLS 보안 연결 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── MQTT 설정 ──────────────────────────────────
#define MQTT_TOPIC     "esp32c3/secure"
#define MQTT_CLIENT_ID "ESP32C3-tls-06"
#define PUBLISH_INTERVAL_MS 5000

// ─── Wi-Fi 연결 타임아웃 ─────────────────────────
#define WIFI_CONNECT_TIMEOUT_MS 15000

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)

// ─── TLS 모드 선택 ──────────────────────────────
// 1 = setInsecure() — 인증서 검증 생략 (테스트용, 빠르게 시작 가능)
// 0 = CA 인증서 검증 (프로덕션 권장, 아래 ca_cert 주석 해제 필요)
#define TLS_INSECURE_MODE 1
