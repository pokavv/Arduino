#pragma once

// ─────────────────────────────────────────────
// I2C 스캐너 — 핀 및 설정 상수
// ─────────────────────────────────────────────

// I2C 통신 핀 (ESP32-C3 Super Mini 기준)
// SDA: 데이터 선 (Serial Data)
// SCL: 클럭 선 (Serial Clock)
const int I2C_SDA_PIN = 8;   // G8 — 데이터 입출력 핀
const int I2C_SCL_PIN = 9;   // G9 — 클럭 신호 핀

// 시리얼 통신 속도 (PC와 데이터를 주고받는 속도, bps 단위)
const int BAUD_RATE = 115200;

// I2C 주소 탐색 범위
// 7비트 주소 체계: 유효 범위 0x03 ~ 0x77 (0x00~0x02, 0x78~0x7F 는 예약됨)
const uint8_t I2C_ADDR_START = 0x03;
const uint8_t I2C_ADDR_END   = 0x77;
