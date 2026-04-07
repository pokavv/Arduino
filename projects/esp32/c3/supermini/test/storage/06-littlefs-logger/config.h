#pragma once

// 시리얼 통신 속도 (bps)
#define BAUD_RATE       115200

// 로그 파일 경로
#define LOG_FILE        "/log.csv"

// 로그 저장 주기 (ms)
#define LOG_INTERVAL    10000   // 10초

// 최대 로그 줄 수 (이 수 초과 시 오래된 줄 삭제)
#define MAX_LINES       100

// ADC 핀 번호 (아날로그 읽기)
#define ADC_PIN         0   // G0 핀
