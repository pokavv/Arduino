#pragma once

// ===== AP (액세스 포인트) 설정 =====
#define AP_SSID "ESP32-Setup"      // Wi-Fi 설정 AP 이름 (스마트폰에서 검색됨)

// ===== Captive Portal 타임아웃 =====
#define CONFIG_PORTAL_TIMEOUT 120  // 설정 화면 최대 대기 시간 (초) — 초과 시 재시작

// ===== 시리얼 통신 속도 =====
#define BAUD_RATE 115200

// ===== 내장 LED =====
#define BUILTIN_LED_PIN 8   // G8 = 내장 LED (Active LOW)
