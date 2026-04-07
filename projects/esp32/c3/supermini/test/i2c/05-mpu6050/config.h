#pragma once

// ─────────────────────────────────────────────
// MPU6050 — 핀 및 설정 상수
// ─────────────────────────────────────────────

// I2C 통신 핀
const int I2C_SDA_PIN = 8;
const int I2C_SCL_PIN = 9;

// MPU6050 I2C 주소
// AD0 → GND 이면 0x68 (기본값)
// AD0 → VCC 이면 0x69
const uint8_t MPU_ADDR = 0x68;

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

// 센서 읽기 간격 (밀리초)
const unsigned long READ_INTERVAL = 500;  // 0.5초마다 읽기
