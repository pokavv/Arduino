#pragma once

// ─────────────────────────────────────────────
// INA219 전류/전압 모니터 — 핀 및 설정 상수
// ─────────────────────────────────────────────

// I2C 통신 핀
const int I2C_SDA_PIN = 8;
const int I2C_SCL_PIN = 9;

// INA219 I2C 주소 (A0/A1 핀 연결에 따라 결정)
// A0=GND, A1=GND → 0x40 (기본)
// A0=VCC, A1=GND → 0x41
// A0=GND, A1=VCC → 0x44
// A0=VCC, A1=VCC → 0x45
const uint8_t INA_ADDR = 0x40;

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

// 측정 간격 (밀리초)
const unsigned long READ_INTERVAL = 1000;

// 경고 임계값
const float CURRENT_WARN_MA  = 500.0F;  // 전류 500mA 초과 시 경고
const float VOLTAGE_WARN_LOW = 3.0F;    // 버스 전압 3V 미만 시 경고
