#pragma once

// ─────────────────────────────────────────────
// OLED SSD1306 — 핀 및 설정 상수
// ─────────────────────────────────────────────

// I2C 통신 핀
const int I2C_SDA_PIN = 8;
const int I2C_SCL_PIN = 9;

// OLED 모듈 I2C 주소 (대부분의 SSD1306: 0x3C, 일부: 0x3D)
const uint8_t OLED_ADDR = 0x3C;

// OLED 해상도 (픽셀)
const int SCREEN_WIDTH  = 128;  // 가로 픽셀 수
const int SCREEN_HEIGHT = 64;   // 세로 픽셀 수

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

// 화면 업데이트 간격 (밀리초)
const unsigned long UPDATE_INTERVAL = 1000;  // 1초마다 카운터 증가
