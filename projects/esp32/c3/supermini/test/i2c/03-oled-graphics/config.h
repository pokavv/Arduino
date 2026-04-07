#pragma once

// ─────────────────────────────────────────────
// OLED 그래픽 — 핀 및 설정 상수
// ─────────────────────────────────────────────

// I2C 통신 핀
const int I2C_SDA_PIN = 8;
const int I2C_SCL_PIN = 9;

// OLED 모듈 I2C 주소
const uint8_t OLED_ADDR = 0x3C;

// OLED 해상도
const int SCREEN_WIDTH  = 128;
const int SCREEN_HEIGHT = 64;

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

// 각 도형 표시 시간 (밀리초)
const unsigned long SHAPE_DISPLAY_TIME = 2000;  // 2초씩 표시
