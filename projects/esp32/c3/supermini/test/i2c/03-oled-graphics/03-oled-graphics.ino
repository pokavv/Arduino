/*
 * ════════════════════════════════════════════════════════════════
 * 03-oled-graphics — OLED 그래픽 도형 데모
 * ════════════════════════════════════════════════════════════════
 *
 * [핵심 개념]
 * ────────────────────────────────────────────────────────────────
 * Adafruit GFX 라이브러리는 픽셀 단위로 도형을 그리는 함수를 제공합니다.
 *
 * 좌표계: (0,0) = 왼쪽 위, X는 오른쪽↑, Y는 아래↓
 * ┌──────────────────► X (0~127)
 * │
 * │  (x, y)
 * ▼
 * Y (0~63)
 *
 * 주요 그래픽 함수:
 *  drawPixel(x, y, color)             — 점 하나
 *  drawLine(x0, y0, x1, y1, color)   — 직선
 *  drawRect(x, y, w, h, color)       — 빈 사각형
 *  fillRect(x, y, w, h, color)       — 채운 사각형
 *  drawCircle(x, y, r, color)        — 빈 원
 *  fillCircle(x, y, r, color)        — 채운 원
 *  drawTriangle(x0,y0, x1,y1, x2,y2, color) — 삼각형
 *  drawBitmap(x, y, bitmap, w, h, color)    — 비트맵 이미지
 *
 * [라이브러리]
 * ────────────────────────────────────────────────────────────────
 *  - "Adafruit SSD1306" (by Adafruit)
 *  - "Adafruit GFX Library" (by Adafruit)
 *
 * [준비물]
 * ────────────────────────────────────────────────────────────────
 *  - ESP32-C3 Super Mini × 1
 *  - SSD1306 OLED 모듈 (128×64, I2C) × 1
 *  - 점퍼 와이어 4개
 *
 * [연결 방법]
 * ────────────────────────────────────────────────────────────────
 *  OLED          ESP32-C3 Super Mini
 *  ─────────────────────────────────
 *  VCC ───────── 3.3V
 *  GND ───────── GND
 *  SDA ───────── G8
 *  SCL ───────── G9
 * ════════════════════════════════════════════════════════════════
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// 데모에 사용할 화살표 비트맵 (16×16 픽셀)
// PROGMEM: 플래시 메모리에 저장하여 RAM 절약
static const unsigned char PROGMEM arrowBitmap[] = {
    0b00000001, 0b10000000,
    0b00000011, 0b11000000,
    0b00000111, 0b11100000,
    0b00001111, 0b11110000,
    0b00011111, 0b11111000,
    0b00111111, 0b11111100,
    0b01111111, 0b11111110,
    0b11111111, 0b11111111,
    0b11111111, 0b11111111,
    0b01111111, 0b11111110,
    0b00111111, 0b11111100,
    0b00011111, 0b11111000,
    0b00001111, 0b11110000,
    0b00000111, 0b11100000,
    0b00000011, 0b11000000,
    0b00000001, 0b10000000,
};

// 데모 단계 번호
int demoStep = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    delay(1000);

    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
        Serial.println("[오류] SSD1306 초기화 실패!");
        while (true) { delay(1000); }
    }

    display.clearDisplay();
    display.display();
    Serial.println("OLED 그래픽 데모 시작");
}

void loop() {
    switch (demoStep % 7) {
        case 0: demoLines();      break;
        case 1: demoRect();       break;
        case 2: demoFillRect();   break;
        case 3: demoCircle();     break;
        case 4: demoFillCircle(); break;
        case 5: demoTriangle();   break;
        case 6: demoBitmap();     break;
    }
    demoStep++;
    delay(SHAPE_DISPLAY_TIME);
}

// ── 직선 데모 ──────────────────────────────────────────────────
void demoLines() {
    display.clearDisplay();

    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("drawLine");

    // 왼쪽 위에서 여러 방향으로 직선 그리기
    for (int i = 0; i < SCREEN_WIDTH; i += 16) {
        display.drawLine(0, 10, i, SCREEN_HEIGHT - 1, SSD1306_WHITE);
    }
    for (int i = 10; i < SCREEN_HEIGHT; i += 10) {
        display.drawLine(0, i, SCREEN_WIDTH - 1, SCREEN_HEIGHT - 1, SSD1306_WHITE);
    }

    display.display();
    Serial.println("데모: 직선");
}

// ── 빈 사각형 데모 ─────────────────────────────────────────────
void demoRect() {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextColor(SSD1306_WHITE);
    display.println("drawRect");

    // 중첩된 사각형 5개 (외곽에서 안쪽으로)
    for (int i = 0; i < 5; i++) {
        int margin = i * 6;
        display.drawRect(
            margin,               // x 시작
            10 + margin,          // y 시작
            SCREEN_WIDTH  - margin * 2,   // 너비
            SCREEN_HEIGHT - 10 - margin * 2, // 높이
            SSD1306_WHITE
        );
    }

    display.display();
    Serial.println("데모: 빈 사각형");
}

// ── 채운 사각형 데모 ────────────────────────────────────────────
void demoFillRect() {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextColor(SSD1306_WHITE);
    display.println("fillRect");

    // 체스판 패턴
    const int TILE = 12;
    for (int row = 0; row < 4; row++) {
        for (int col = 0; col < 10; col++) {
            if ((row + col) % 2 == 0) {
                display.fillRect(col * TILE + 4, 12 + row * TILE, TILE, TILE, SSD1306_WHITE);
            }
        }
    }

    display.display();
    Serial.println("데모: 채운 사각형 (체스판)");
}

// ── 빈 원 데모 ─────────────────────────────────────────────────
void demoCircle() {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextColor(SSD1306_WHITE);
    display.println("drawCircle");

    // 중앙에서 크기를 늘려가며 동심원 그리기
    int cx = SCREEN_WIDTH / 2;
    int cy = (SCREEN_HEIGHT + 10) / 2;
    for (int r = 4; r < 28; r += 5) {
        display.drawCircle(cx, cy, r, SSD1306_WHITE);
    }

    display.display();
    Serial.println("데모: 빈 원 (동심원)");
}

// ── 채운 원 데모 ────────────────────────────────────────────────
void demoFillCircle() {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextColor(SSD1306_WHITE);
    display.println("fillCircle");

    // 채운 원 + XOR 효과로 겹친 영역 반전
    display.fillCircle(40, 38, 20, SSD1306_WHITE);
    display.fillCircle(88, 38, 20, SSD1306_WHITE);
    // 가운데 겹치는 부분을 검정으로 덮어 구멍 효과
    display.fillCircle(64, 38, 18, SSD1306_BLACK);

    display.display();
    Serial.println("데모: 채운 원");
}

// ── 삼각형 데모 ─────────────────────────────────────────────────
void demoTriangle() {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextColor(SSD1306_WHITE);
    display.println("drawTriangle");

    // 중앙 상단 꼭짓점을 공유하는 삼각형 여러 개
    int topX = SCREEN_WIDTH / 2;
    int topY = 12;
    for (int i = 10; i < 60; i += 10) {
        display.drawTriangle(
            topX, topY,
            topX - i, SCREEN_HEIGHT - 2,
            topX + i, SCREEN_HEIGHT - 2,
            SSD1306_WHITE
        );
    }

    display.display();
    Serial.println("데모: 삼각형");
}

// ── 비트맵 데모 ─────────────────────────────────────────────────
void demoBitmap() {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextColor(SSD1306_WHITE);
    display.println("drawBitmap");

    // 16×16 화살표 비트맵을 4곳에 배치
    display.drawBitmap(10, 20, arrowBitmap, 16, 16, SSD1306_WHITE);
    display.drawBitmap(46, 20, arrowBitmap, 16, 16, SSD1306_WHITE);
    display.drawBitmap(82, 20, arrowBitmap, 16, 16, SSD1306_WHITE);
    display.drawBitmap(46, 44, arrowBitmap, 16, 16, SSD1306_WHITE);

    display.display();
    Serial.println("데모: 비트맵");
}
