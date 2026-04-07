#pragma once

// ===== 핀 설정 =====
#define STEP_PIN  2    // G2 → A4988 STEP 핀
#define DIR_PIN   3    // G3 → A4988 DIR 핀
#define EN_PIN    4    // G4 → A4988 EN 핀 (Active LOW)

// ===== 모터 파라미터 =====
#define STEPS_PER_REV 200    // 1바퀴당 스텝 수

// ===== AccelStepper 속도/가속도 설정 =====
#define MAX_SPEED    500.0f  // 최대 속도 (스텝/초) — 500이면 2.5바퀴/초
#define ACCELERATION 100.0f  // 가속도 (스텝/초²) — 낮을수록 천천히 가속

// ===== 시리얼 통신 속도 =====
#define BAUD_RATE 115200
