#pragma once

// ─────────────────────────────────────────────
// BME280 — 핀 및 설정 상수
// ─────────────────────────────────────────────

// I2C 통신 핀
const int I2C_SDA_PIN = 8;
const int I2C_SCL_PIN = 9;

// BME280 I2C 주소
// SDO → GND 이면 0x76 (기본값)
// SDO → VCC 이면 0x77
const uint8_t BME_ADDR = 0x76;

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

// 센서 읽기 간격 (밀리초)
const unsigned long READ_INTERVAL = 2000;  // 2초마다 읽기
