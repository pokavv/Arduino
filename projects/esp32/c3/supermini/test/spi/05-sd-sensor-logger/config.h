#pragma once

// =====================================================
// [핀 설정] SD 카드 센서 데이터 로거
// =====================================================

// SPI 핀
#define SD_MOSI   6
#define SD_MISO   5
#define SD_SCK    4

// SD 카드 CS 핀
#define SD_CS     7

// ADC 센서 핀
#define ADC_PIN   0

// 시리얼 통신 속도
#define BAUD_RATE 115200

// CSV 로그 파일 경로
// 슬래시(/)로 시작하는 절대 경로
#define LOG_FILE  "/sensor.csv"

// 로그 기록 주기 (밀리초)
// 5000 = 5초마다 기록
#define LOG_INTERVAL 5000
