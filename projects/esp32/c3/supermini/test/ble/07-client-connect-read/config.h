// config.h — BLE 클라이언트 연결 & Read 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── 연결 대상 서버 이름 ─────────────────────────
// BLE 02-server-read 예제의 장치 이름과 일치해야 연결됨
#define TARGET_NAME "ESP32C3-Server"

// ─── 대상 서비스 & 특성 UUID ─────────────────────
// BLE 02-server-read config.h의 UUID와 동일하게 설정
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// ─── 타이밍 ────────────────────────────────────
#define READ_INTERVAL_MS  3000   // Read 요청 주기 (ms)
#define SCAN_TIME_SEC     5      // 장치 탐색 시간 (초)
#define RECONNECT_DELAY_MS 5000  // 재연결 대기 시간 (ms)

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)
