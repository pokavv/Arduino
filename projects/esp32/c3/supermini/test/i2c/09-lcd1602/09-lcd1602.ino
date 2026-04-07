/*
 * ════════════════════════════════════════════════════════════════
 * 09-lcd1602 — LCD 1602 I2C 모듈
 * ════════════════════════════════════════════════════════════════
 *
 * [핵심 개념]
 * ────────────────────────────────────────────────────────────────
 * LCD 1602은 16글자 × 2줄 문자 액정 디스플레이입니다.
 *
 * I2C 백팩 모듈:
 *   원래 LCD 1602은 병렬 핀이 16개 필요하지만,
 *   PCF8574 I/O 확장 칩이 탑재된 I2C 백팩을 사용하면
 *   SDA/SCL 2개 선만으로 제어할 수 있습니다.
 *
 * 커서 좌표: lcd.setCursor(col, row)
 *   col = 0~15 (왼쪽부터)
 *   row = 0 (첫 번째 줄) 또는 1 (두 번째 줄)
 *
 * 주요 함수:
 *   lcd.init()          — LCD 초기화
 *   lcd.backlight()     — 백라이트 켜기
 *   lcd.noBacklight()   — 백라이트 끄기
 *   lcd.clear()         — 전체 화면 지우기
 *   lcd.setCursor(c, r) — 커서 위치 이동
 *   lcd.print("text")   — 문자열 출력
 *   lcd.createChar()    — 사용자 정의 문자 (최대 8개)
 *
 * [라이브러리]
 * ────────────────────────────────────────────────────────────────
 *  Arduino IDE > 라이브러리 매니저:
 *  - "LiquidCrystal I2C" (by Frank de Brabander)
 *
 * [준비물]
 * ────────────────────────────────────────────────────────────────
 *  - ESP32-C3 Super Mini × 1
 *  - LCD 1602 I2C 모듈 (PCF8574 백팩 포함) × 1
 *  - 점퍼 와이어 4개
 *
 * [연결 방법]
 * ────────────────────────────────────────────────────────────────
 *  LCD I2C 모듈   ESP32-C3 Super Mini
 *  ──────────────────────────────────
 *  VCC ────────── 5V  ← LCD는 5V 필요 (ESP32 IO는 3.3V 출력이지만
 *                        I2C 통신은 동작함 — 단 일부 모듈은 3.3V도 가능)
 *  GND ────────── GND
 *  SDA ────────── G8
 *  SCL ────────── G9
 *
 *  ※ LCD 백라이트가 켜지지 않으면:
 *    1. PCF8574 뒷면의 콘트라스트 가변저항을 돌려보세요.
 *    2. 주소가 0x27이 아닌 경우 01-scanner로 확인하세요.
 * ════════════════════════════════════════════════════════════════
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "config.h"

// LiquidCrystal_I2C(주소, 열 수, 행 수)
LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);

// 사용자 정의 문자 — 하트 모양 (5×8 픽셀)
// 각 바이트가 한 행, 비트 1 = 픽셀 켜짐
byte heartChar[8] = {
    0b00000,
    0b01010,
    0b11111,
    0b11111,
    0b01110,
    0b00100,
    0b00000,
    0b00000
};

unsigned long prevMillis = 0;
int counter = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    delay(1000);

    Serial.println("=================================");
    Serial.println("   LCD 1602 I2C 테스트");
    Serial.println("=================================");

    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

    // LCD 초기화
    lcd.init();
    lcd.backlight();  // 백라이트 켜기

    // 사용자 정의 문자 등록 (슬롯 0번에 하트)
    lcd.createChar(0, heartChar);

    // 환영 메시지 출력
    lcd.setCursor(0, 0);  // 1번째 줄 첫 번째 칸
    lcd.print("ESP32-C3 Hello!");

    lcd.setCursor(0, 1);  // 2번째 줄 첫 번째 칸
    lcd.print("LCD I2C Test ");
    lcd.write(0);  // 하트 문자 출력

    Serial.println("LCD 초기화 완료");
    delay(2000);

    lcd.clear();
}

void loop() {
    unsigned long currentMillis = millis();

    if (currentMillis - prevMillis >= UPDATE_INTERVAL) {
        prevMillis = currentMillis;
        counter++;

        // 1번째 줄: 고정 레이블
        lcd.setCursor(0, 0);
        lcd.print("Count:");

        // 숫자는 오른쪽 정렬처럼 일정 위치에 출력
        lcd.setCursor(7, 0);
        lcd.print("        ");  // 이전 숫자 지우기 (8칸 공백)
        lcd.setCursor(7, 0);
        lcd.print(counter);

        // 2번째 줄: 경과 시간 (초)
        unsigned long secs = millis() / 1000;
        lcd.setCursor(0, 1);
        lcd.print("Uptime:         ");  // 줄 전체 덮어쓰기
        lcd.setCursor(8, 1);
        lcd.print(secs);
        lcd.print("s");

        Serial.printf("카운터: %d  |  경과: %lu초\n", counter, secs);
    }
}
