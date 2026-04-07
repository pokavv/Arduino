// config.h — BLE UART (NUS) 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── BLE 장치 이름 ──────────────────────────────
#define DEVICE_NAME "ESP32C3-UART"

// ─── NUS (Nordic UART Service) UUID ─────────────
// Nordic Semiconductor이 정의한 BLE UART 표준 UUID.
// nRF Connect, Serial Bluetooth Terminal 등의 앱이 이 UUID를 인식한다.
#define NUS_SERVICE_UUID "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define NUS_RX_CHAR_UUID "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"  // 앱 → ESP32 (쓰기)
#define NUS_TX_CHAR_UUID "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"  // ESP32 → 앱 (Notify)

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)
