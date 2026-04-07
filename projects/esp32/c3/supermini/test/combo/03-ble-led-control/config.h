#pragma once

// ===== LED 핀 =====
#define LED_PIN 8           // G8 = 내장 LED (Active LOW: LOW면 켜짐)

// ===== BLE 장치 이름 =====
#define DEVICE_NAME "ESP32-LED"  // BLE 스캔 시 보이는 이름

// ===== BLE UUID 정의 =====
// UUID는 128비트 고유 식별자
// 직접 생성하거나 온라인 UUID 생성기 사용 (https://www.uuidgenerator.net/)
#define SERVICE_UUID        "12345678-1234-1234-1234-123456789012"
#define CHARACTERISTIC_UUID "87654321-4321-4321-4321-210987654321"
