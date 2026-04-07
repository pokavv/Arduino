// config.h — BLE 서버 Write 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── BLE 장치 이름 ──────────────────────────────
#define DEVICE_NAME "ESP32C3-Server"

// ─── BLE UUID ───────────────────────────────────
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// ─── LED 제어 명령어 ────────────────────────────
// 클라이언트가 이 문자열을 Write하면 LED 동작
#define CMD_LED_ON  "LED ON"
#define CMD_LED_OFF "LED OFF"

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW — LOW = 켜짐)
