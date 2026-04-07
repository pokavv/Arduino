// config.h — BLE HID 키보드 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── BLE 장치 이름 ──────────────────────────────
#define DEVICE_NAME "ESP32-Keyboard"

// ─── 버튼 핀 ────────────────────────────────────
// G9 = BOOT 버튼 (보드 내장, Active LOW — 누르면 LOW)
// 부팅 후에는 일반 GPIO로 사용 가능
#define BUTTON_PIN 9

// ─── 내장 LED 핀 ────────────────────────────────
#define BUILTIN_LED_PIN 8   // Active LOW

// ─── 타이밍 ────────────────────────────────────
#define DEBOUNCE_MS 50      // 버튼 채터링 방지 시간 (ms)
