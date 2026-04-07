// config.h — BLE 스캔 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── 스캔 설정 ──────────────────────────────────
#define SCAN_TIME_SEC 5      // 스캔 지속 시간 (초)
#define SCAN_INTERVAL_MS 10000   // 스캔 반복 주기 (ms) — 10초마다 재스캔

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)
