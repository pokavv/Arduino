#pragma once

// =====================================================
// [핀 설정] SD 카드 SPI 핀 번호
// ESP32-C3 Super Mini 기준
// =====================================================

// SPI 공유 핀 (TFT와 동일한 SPI 버스 사용 가능)
// SD 카드와 TFT를 동시에 사용할 때는 CS 핀으로 구별
#define SD_MOSI   6   // MOSI: ESP32 → SD카드
#define SD_MISO   5   // MISO: SD카드 → ESP32 (SD는 MISO 필요)
#define SD_SCK    4   // SCK: SPI 클럭

// SD 카드 전용 CS 핀
#define SD_CS     7   // CS: SD카드 칩 선택

// 시리얼 통신 속도
#define BAUD_RATE 115200

// 테스트용 파일 경로
#define TEST_FILE "/test.txt"
