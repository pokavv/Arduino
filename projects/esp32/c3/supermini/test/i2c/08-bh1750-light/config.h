#pragma once

// ─────────────────────────────────────────────
// BH1750 조도 센서 — 핀 및 설정 상수
// ─────────────────────────────────────────────

// I2C 통신 핀
const int I2C_SDA_PIN = 8;
const int I2C_SCL_PIN = 9;

// BH1750 I2C 주소
// ADDR → GND (또는 개방): 0x23 (기본)
// ADDR → VCC            : 0x5C
const uint8_t BH_ADDR = 0x23;

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

// 센서 읽기 간격 (밀리초)
const unsigned long READ_INTERVAL = 1000;
