#pragma once

// =====================================================
// [핀 설정] VL53L0X ToF 레이저 거리 센서 (I2C)
// =====================================================

// I2C 핀 (ESP32-C3 Super Mini 기본 I2C)
// 주의: G8은 내장 LED 핀이므로 I2C SDA 겸용 주의
// 가능하면 다른 핀 조합 사용
#define I2C_SDA_PIN     8   // SDA (데이터)
#define I2C_SCL_PIN     9   // SCL (클럭)

// 시리얼 통신 속도
#define BAUD_RATE       115200

// 측정 주기 (밀리초)
#define MEASURE_INTERVAL 100

// VL53L0X I2C 기본 주소 (변경 불가, 0x29 고정)
// #define VL53L0X_ADDR 0x29  // 라이브러리가 내부적으로 처리

// 최대 측정 거리 (mm)
#define MAX_RANGE_MM    8200
