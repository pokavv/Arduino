#pragma once

// ===== 핀 설정 =====
#define STEP_PIN   2   // G2 → A4988 STEP 핀
#define DIR_PIN    3   // G3 → A4988 DIR 핀
#define EN_PIN     4   // G4 → A4988 EN 핀 (Active LOW)
#define LIMIT_PIN  5   // G5 → 리밋 스위치 (눌리면 LOW, 풀업 저항 사용)

// ===== 호밍 속도 =====
#define HOMING_SPEED 200.0f   // 호밍 시 이동 속도 (스텝/초) — 느릴수록 안전

// ===== 시리얼 통신 속도 =====
#define BAUD_RATE 115200
