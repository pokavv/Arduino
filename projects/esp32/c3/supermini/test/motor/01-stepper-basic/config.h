#pragma once

// ===== 핀 설정 (A4988/DRV8825 드라이버) =====
#define STEP_PIN  2    // G2 → A4988 STEP 핀 (HIGH/LOW 펄스로 1스텝씩 이동)
#define DIR_PIN   3    // G3 → A4988 DIR 핀 (HIGH=정방향, LOW=역방향)
#define EN_PIN    4    // G4 → A4988 EN 핀 (LOW=활성화, HIGH=비활성화 — Active LOW)

// ===== 모터 파라미터 =====
#define STEPS_PER_REV  200   // 1바퀴당 스텝 수 (1.8°/스텝 모터 = 200스텝/바퀴)
                             // 0.9°/스텝 모터면 400으로 변경
#define STEP_DELAY_US  1000  // 스텝 간격 (마이크로초) — 작을수록 빠름, 너무 작으면 탈조

// ===== 시리얼 통신 속도 =====
#define BAUD_RATE 115200
