#pragma once

// =====================================================
// [핀 설정] TFT ST7789 디스플레이 SPI 핀 번호
// ESP32-C3 Super Mini 기준
// =====================================================

// SPI 통신 핀
#define TFT_MOSI  6   // MOSI (Master Out Slave In): ESP32 → TFT 데이터 전송
#define TFT_SCK   4   // SCK (Serial Clock): SPI 클럭 신호

// TFT 전용 제어 핀
#define TFT_CS    7   // CS (Chip Select): 이 핀을 LOW로 당겨야 TFT가 SPI 신호를 받음
#define TFT_DC    2   // DC (Data/Command): HIGH=데이터, LOW=명령어 구분
#define TFT_RST   3   // RST (Reset): LOW 펄스로 TFT 초기화

// 시리얼 통신 속도
#define BAUD_RATE 115200

// TFT 화면 크기 (ST7789 기준)
#define TFT_WIDTH  240
#define TFT_HEIGHT 240
