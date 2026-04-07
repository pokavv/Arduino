#pragma once

// ===== 서보 핀 =====
#define SERVO_PIN   2   // G2 → 서보 PWM 신호

// ===== 초음파 센서 핀 =====
#define TRIG_PIN    3   // G3 → HC-SR04 TRIG (출력: 초음파 발사 트리거)
#define ECHO_PIN    4   // G4 → HC-SR04 ECHO (입력: 반사 수신 신호)

// ===== 스캔 범위 설정 =====
#define SCAN_START  0   // 스캔 시작 각도 (도)
#define SCAN_END  180   // 스캔 끝 각도 (도)
#define SCAN_STEP   5   // 스캔 간격 (도) — 작을수록 정밀, 느림

// ===== 초음파 측정 설정 =====
#define SOUND_SPEED_CM_US 0.034f  // 소리 속도 (cm/us) — 20°C 기준
#define MAX_DISTANCE_CM  400      // 최대 측정 거리 (cm)
#define SERVO_SETTLE_MS   50      // 서보 이동 후 안정화 대기 시간 (ms)

// ===== 시리얼 통신 속도 =====
#define BAUD_RATE 115200
