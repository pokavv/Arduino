// config.h — BLE HID 마우스 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── BLE 장치 이름 ──────────────────────────────
#define DEVICE_NAME "ESP32-Mouse"

// ─── 마우스 원 그리기 설정 ──────────────────────
#define CIRCLE_RADIUS    80     // 원의 반지름 (픽셀 단위, 상대 이동값)
#define CIRCLE_STEPS     36     // 원을 몇 단계로 나눌지 (클수록 부드러움)
#define MOVE_INTERVAL_MS 30     // 각 이동 간격 (ms) — 너무 짧으면 OS가 처리 못 함

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)
#define BUTTON_PIN      9   // BOOT 버튼 (Active LOW — 눌리면 LOW)
