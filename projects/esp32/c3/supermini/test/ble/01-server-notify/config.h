// config.h — BLE 서버 Notify 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── BLE 장치 이름 ──────────────────────────────
#define DEVICE_NAME "ESP32C3-Server"

// ─── BLE UUID (서비스 & 특성) ────────────────────
// UUID는 128비트 고유 식별자. 직접 생성하거나 아래 기본값 사용.
// 새 UUID 생성: https://www.uuidgenerator.net/
#define SERVICE_UUID  "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID     "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// ─── 타이밍 ────────────────────────────────────
#define NOTIFY_INTERVAL_MS 1000   // Notify 전송 주기 (ms)

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW — LOW = 켜짐)
