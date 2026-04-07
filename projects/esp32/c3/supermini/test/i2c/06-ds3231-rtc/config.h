#pragma once

// ─────────────────────────────────────────────
// DS3231 RTC — 핀 및 설정 상수
// ─────────────────────────────────────────────

// I2C 통신 핀
const int I2C_SDA_PIN = 8;
const int I2C_SCL_PIN = 9;

// DS3231 I2C 주소 (고정값, 변경 불가)
const uint8_t DS3231_ADDR = 0x57;  // RTClib 내부에서 사용

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

// 시각 출력 간격 (밀리초)
const unsigned long PRINT_INTERVAL = 1000;  // 1초마다 출력
