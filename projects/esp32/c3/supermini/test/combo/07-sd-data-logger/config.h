#pragma once

// ===== SD 카드 핀 =====
#define SD_CS   7    // G7 → SD 카드 CS(Chip Select) 핀

// ===== ADC 핀 =====
#define ADC_PIN 0    // G0 → 아날로그 입력 (주의: 부팅핀)

// ===== 로그 설정 =====
#define LOG_INTERVAL 5000    // 로그 저장 주기 (ms) — 5초마다
#define LOG_FILE "/log.csv"  // SD 카드 내 파일 경로 (루트 기준)

// ===== 시리얼 통신 속도 =====
#define BAUD_RATE 115200
