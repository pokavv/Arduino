#pragma once

// =====================================================
// [핀 설정] TFT ST7789 디스플레이 SPI 핀 번호
// ESP32-C3 Super Mini 기준
// =====================================================

// SPI 통신 핀
#define TFT_MOSI  6   // MOSI: ESP32 → TFT 데이터 전송
#define TFT_SCK   4   // SCK: SPI 클럭 신호

// TFT 전용 제어 핀
#define TFT_CS    7   // CS: TFT 칩 선택
#define TFT_DC    2   // DC: 데이터/명령 구분
#define TFT_RST   3   // RST: TFT 리셋

// 시리얼 통신 속도
#define BAUD_RATE 115200

// TFT 화면 크기
#define TFT_WIDTH  240
#define TFT_HEIGHT 240

// 색상 정의 (RGB565 형식)
// Adafruit GFX 라이브러리의 16비트 색상 값
#define COLOR_RED     0xF800   // 빨간색
#define COLOR_GREEN   0x07E0   // 초록색
#define COLOR_BLUE    0x001F   // 파란색
#define COLOR_YELLOW  0xFFE0   // 노란색
#define COLOR_WHITE   0xFFFF   // 흰색
#define COLOR_BLACK   0x0000   // 검정색
#define COLOR_CYAN    0x07FF   // 청록색
#define COLOR_MAGENTA 0xF81F   // 자홍색
#define COLOR_ORANGE  0xFD20   // 주황색
