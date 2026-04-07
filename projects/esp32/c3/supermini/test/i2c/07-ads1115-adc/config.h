#pragma once

// ─────────────────────────────────────────────
// ADS1115 16비트 ADC — 핀 및 설정 상수
// ─────────────────────────────────────────────

// I2C 통신 핀
const int I2C_SDA_PIN = 8;
const int I2C_SCL_PIN = 9;

// ADS1115 I2C 주소 (ADDR 핀 연결에 따라 선택)
// ADDR → GND : 0x48 (기본)
// ADDR → VCC : 0x49
// ADDR → SDA : 0x4A
// ADDR → SCL : 0x4B
const uint8_t ADS_ADDR = 0x48;

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

// ADC 읽기 간격 (밀리초)
const unsigned long READ_INTERVAL = 1000;

// ADS1115 기준 전압 (Gain=1 기준: ±4.096V)
// mV 변환: 원시값 × (4096.0 / 32767.0) = 원시값 × 0.125 mV/bit
const float MV_PER_BIT = 0.125F;  // Gain=1 일 때 mV/LSB
