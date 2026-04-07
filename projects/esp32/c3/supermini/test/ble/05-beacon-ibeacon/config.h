// config.h — iBeacon 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── BLE 장치 이름 ──────────────────────────────
#define DEVICE_NAME "ESP32C3-Beacon"

// ─── iBeacon 설정 ───────────────────────────────
// UUID: 이 비콘을 식별하는 고유 ID (같은 앱 계열의 모든 비콘이 공유)
#define BEACON_UUID "8ec76ea3-6668-48da-9866-75be8bc86f4d"

// Major: 같은 UUID 중 그룹 구분 (예: 건물 번호, 층 번호)
#define MAJOR 1

// Minor: 같은 Major 중 개별 비콘 구분 (예: 방 번호, 진열대 번호)
#define MINOR 1

// TX Power: 1m 거리에서 측정된 신호 세기 (dBm), 거리 계산에 사용
// 실제 측정 전까지는 -59를 기본값으로 사용
#define TX_POWER (-59)

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)
