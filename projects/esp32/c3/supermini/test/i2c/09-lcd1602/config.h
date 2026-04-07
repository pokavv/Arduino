#pragma once

// ─────────────────────────────────────────────
// LCD 1602 I2C — 핀 및 설정 상수
// ─────────────────────────────────────────────

// I2C 통신 핀
const int I2C_SDA_PIN = 8;
const int I2C_SCL_PIN = 9;

// LCD I2C 백팩 주소 (PCF8574 칩 기본값)
// A0~A2 점퍼 모두 열림 → 0x27
// 일부 제품(PCF8574A): 0x3F
const uint8_t LCD_ADDR = 0x27;

// LCD 크기
const int LCD_COLS = 16;  // 한 줄에 표시할 문자 수
const int LCD_ROWS = 2;   // 줄 수

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

// 카운터 업데이트 간격 (밀리초)
const unsigned long UPDATE_INTERVAL = 1000;
