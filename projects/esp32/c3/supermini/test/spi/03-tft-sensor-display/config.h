#pragma once

// =====================================================
// [핀 설정] TFT ST7789 + ADC 센서 디스플레이
// =====================================================

// SPI 통신 핀
#define TFT_MOSI  6
#define TFT_SCK   4

// TFT 전용 제어 핀
#define TFT_CS    7
#define TFT_DC    2
#define TFT_RST   3

// ADC 핀: 가변저항 또는 아날로그 센서 연결
// ESP32-C3의 ADC는 12비트 (0~4095)
#define ADC_PIN   0

// 시리얼 통신 속도
#define BAUD_RATE 115200

// TFT 화면 크기
#define TFT_WIDTH  240
#define TFT_HEIGHT 240

// ADC 범위
#define ADC_MAX   4095  // 12비트 ADC 최대값
#define ADC_MIN   0     // 12비트 ADC 최솟값

// 막대 그래프 설정
#define BAR_X      10   // 막대 그래프 시작 x 위치
#define BAR_Y      80   // 막대 그래프 시작 y 위치
#define BAR_WIDTH  220  // 막대 그래프 최대 너비
#define BAR_HEIGHT 40   // 막대 그래프 높이

// 업데이트 주기 (밀리초)
#define UPDATE_INTERVAL 200
