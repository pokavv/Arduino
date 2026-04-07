#pragma once

#define SERVO_PIN        2
#define SERVO_CHANNEL    0
#define SERVO_FREQ       50      // 50Hz = 20ms 주기 (서보모터 표준)
#define SERVO_RESOLUTION 16      // 16비트 해상도 (0~65535) — 정밀한 펄스 폭 제어

// SG90 서보모터 펄스 폭 범위 (16비트 기준)
// 0.5ms / 20ms * 65535 ≈ 1638
// 2.5ms / 20ms * 65535 ≈ 8192
#define SERVO_MIN_DUTY   1638    // 0° 위치
#define SERVO_MAX_DUTY   8192    // 180° 위치
