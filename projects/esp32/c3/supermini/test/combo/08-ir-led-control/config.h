#pragma once

// ===== IR 수신기 핀 =====
#define IR_RECV_PIN 2   // G2 → IR 수신 모듈 데이터 핀 (TSOP38238 등)

// ===== LED 핀 =====
#define LED_PIN     8   // G8 = 내장 LED (Active LOW)

// ===== PWM 밝기 제어 (내장 LED는 단순 ON/OFF지만 외부 LED는 PWM 가능) =====
#define PWM_CHANNEL   0     // LEDC 채널 번호
#define PWM_FREQ     5000   // PWM 주파수 (Hz)
#define PWM_RESOLUTION   8  // PWM 해상도 (비트) — 8비트 = 0~255

// ===== IR 키코드 (리모컨 기종마다 다름 — 시리얼 모니터로 먼저 확인) =====
// 아래는 예시 값 — 실제 리모컨 코드를 측정 후 교체
#define IR_KEY_POWER  0xFF10EF   // 전원 버튼 코드 (예시)
#define IR_KEY_VOL_UP 0xFF50AF   // 볼륨+ 버튼 (밝기 증가로 활용)
#define IR_KEY_VOL_DN 0xFF7887   // 볼륨- 버튼 (밝기 감소로 활용)

// ===== 시리얼 통신 속도 =====
#define BAUD_RATE 115200
