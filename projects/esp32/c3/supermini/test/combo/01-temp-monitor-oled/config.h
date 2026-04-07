#pragma once

// ===== DHT22 온습도 센서 핀 =====
#define DHT_PIN 2           // G2 → DHT22 DATA 핀

// ===== OLED I2C 핀 =====
// ESP32-C3 Super Mini 기본 I2C 핀
#define I2C_SDA 8           // G8 → OLED SDA (내장 LED와 같은 핀 주의!)
#define I2C_SCL 9           // G9 → OLED SCL (BOOT 버튼과 같은 핀 주의!)
// 주의: G8은 내장 LED, G9는 BOOT 버튼과 공유
// OLED 사용 시 내장 LED 제어 불가, BOOT 버튼 기능 제한될 수 있음
// 다른 핀(예: SDA=4, SCL=5)으로 변경 권장

// ===== OLED I2C 주소 =====
#define OLED_ADDR 0x3C      // SSD1306 기본 주소 (일부 모듈은 0x3D)

// ===== 업데이트 주기 =====
#define UPDATE_INTERVAL 2000  // 2초마다 센서 읽기 및 화면 갱신 (ms)

// ===== OLED 해상도 =====
#define OLED_WIDTH  128     // 픽셀 가로
#define OLED_HEIGHT  64     // 픽셀 세로
