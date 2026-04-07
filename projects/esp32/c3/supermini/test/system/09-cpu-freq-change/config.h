#pragma once

// ===== 시리얼 통신 속도 =====
#define BAUD_RATE 115200     // 시리얼 모니터 속도

// ===== CPU 주파수 설정 =====
#define FREQ_LOW_MHZ  80     // 저전력 모드 CPU 주파수 (MHz)
#define FREQ_HIGH_MHZ 160    // 고성능 모드 CPU 주파수 (MHz) — 기본값

// ===== 주파수 전환 주기 =====
#define SWITCH_INTERVAL 5000 // 5초마다 주파수 전환 (ms)
