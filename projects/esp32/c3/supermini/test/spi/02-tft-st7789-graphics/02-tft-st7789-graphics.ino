/*
 * [핵심 개념] TFT 그래픽 그리기
 * ================================
 * Adafruit GFX 라이브러리는 다양한 도형을 그리는 함수를 제공합니다.
 *
 * 좌표 시스템:
 *   화면 왼쪽 위가 (0, 0)
 *   오른쪽으로 갈수록 x 증가
 *   아래로 갈수록 y 증가
 *   240x240 화면이므로 x: 0~239, y: 0~239
 *
 * 색상 (RGB565):
 *   16비트로 색상 표현: 빨강 5비트 + 초록 6비트 + 파랑 5비트
 *   예) 0xF800 = 빨간색, 0x07E0 = 초록색, 0x001F = 파란색
 *
 * 주요 그리기 함수:
 *   drawLine(x0,y0, x1,y1, color)       선 그리기
 *   drawRect(x,y, w,h, color)           빈 사각형
 *   fillRect(x,y, w,h, color)           채운 사각형
 *   drawCircle(x,y, r, color)           빈 원
 *   fillCircle(x,y, r, color)           채운 원
 *   drawTriangle(x0,y0, x1,y1, x2,y2, color)  빈 삼각형
 *   fillTriangle(x0,y0, x1,y1, x2,y2, color)  채운 삼각형
 *
 * [라이브러리]
 *   - Adafruit ST7789
 *   - Adafruit GFX Library
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - ST7789 TFT LCD 모듈 (240x240)
 *
 * [연결 방법]
 *   01-tft-st7789-basic 예제와 동일
 *   TFT VCC → 3.3V, GND → GND
 *   SCL→G4, SDA→G6, RES→G3, DC→G2, CS→G7, BLK→3.3V
 */

#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>
#include "config.h"

Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCK, TFT_RST);

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("TFT ST7789 그래픽 예제 시작");

  tft.init(TFT_WIDTH, TFT_HEIGHT);
  tft.setRotation(2);
  tft.fillScreen(COLOR_BLACK);

  Serial.println("TFT 초기화 완료");
}

void loop() {
  // 각 그래픽 데모를 순서대로 실행
  demoLines();
  delay(1500);

  demoCircles();
  delay(1500);

  demoRectangles();
  delay(1500);

  demoTriangles();
  delay(1500);

  demoColorBlocks();
  delay(1500);
}

// -----------------------------------------------
// 선 그리기 데모
// -----------------------------------------------
void demoLines() {
  tft.fillScreen(COLOR_BLACK);

  // 타이틀
  tft.setTextColor(COLOR_WHITE);
  tft.setTextSize(1);
  tft.setCursor(10, 5);
  tft.println("Lines Demo");

  Serial.println("선 그리기 데모");

  // 방사형 선 그리기: 화면 중앙(120,120)에서 가장자리로
  int cx = TFT_WIDTH / 2;   // 중심 x = 120
  int cy = TFT_HEIGHT / 2;  // 중심 y = 120

  // 여러 색상으로 선 그리기
  for (int i = 0; i < 12; i++) {
    // 각도를 라디안으로 변환 (30도 간격 = 12개)
    float angle = i * 30 * 3.14159 / 180.0;
    int x = cx + (int)(100 * cos(angle));
    int y = cy + (int)(100 * sin(angle));

    // 색상을 인덱스에 따라 변경
    uint16_t colors[] = {
      COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW,
      COLOR_CYAN, COLOR_MAGENTA, COLOR_ORANGE, COLOR_WHITE,
      COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW
    };

    tft.drawLine(cx, cy, x, y, colors[i]);
  }

  // 대각선
  tft.drawLine(0, 0, TFT_WIDTH - 1, TFT_HEIGHT - 1, COLOR_WHITE);
  tft.drawLine(TFT_WIDTH - 1, 0, 0, TFT_HEIGHT - 1, COLOR_CYAN);
}

// -----------------------------------------------
// 원 그리기 데모
// -----------------------------------------------
void demoCircles() {
  tft.fillScreen(COLOR_BLACK);

  tft.setTextColor(COLOR_WHITE);
  tft.setTextSize(1);
  tft.setCursor(10, 5);
  tft.println("Circles Demo");

  Serial.println("원 그리기 데모");

  // 채운 원 (왼쪽)
  tft.fillCircle(60, 100, 40, COLOR_RED);      // 빨간 원
  tft.fillCircle(60, 100, 25, COLOR_YELLOW);   // 노란 원 (겹쳐서 도넛 효과)

  // 빈 원 (오른쪽)
  tft.drawCircle(170, 100, 40, COLOR_GREEN);   // 초록 빈 원
  tft.drawCircle(170, 100, 30, COLOR_BLUE);    // 파란 빈 원
  tft.drawCircle(170, 100, 20, COLOR_CYAN);    // 청록 빈 원

  // 채운 원 (아래)
  tft.fillCircle(60,  185, 20, COLOR_BLUE);
  tft.fillCircle(110, 185, 20, COLOR_GREEN);
  tft.fillCircle(160, 185, 20, COLOR_RED);

  // 레이블
  tft.setTextColor(COLOR_WHITE);
  tft.setTextSize(1);
  tft.setCursor(10, 220);
  tft.print("fill  draw  fill");
}

// -----------------------------------------------
// 사각형 그리기 데모
// -----------------------------------------------
void demoRectangles() {
  tft.fillScreen(COLOR_BLACK);

  tft.setTextColor(COLOR_WHITE);
  tft.setTextSize(1);
  tft.setCursor(10, 5);
  tft.println("Rectangles Demo");

  Serial.println("사각형 그리기 데모");

  // 채운 사각형 (fillRect)
  // fillRect(x, y, 너비, 높이, 색상)
  tft.fillRect(10,  25, 60, 40, COLOR_RED);     // 빨간 사각형
  tft.fillRect(80,  25, 60, 40, COLOR_GREEN);   // 초록 사각형
  tft.fillRect(150, 25, 60, 40, COLOR_BLUE);    // 파란 사각형

  // 빈 사각형 (drawRect)
  // drawRect(x, y, 너비, 높이, 색상)
  tft.drawRect(10,  80, 60, 40, COLOR_YELLOW);  // 노란 빈 사각형
  tft.drawRect(80,  80, 60, 40, COLOR_CYAN);    // 청록 빈 사각형
  tft.drawRect(150, 80, 60, 40, COLOR_MAGENTA); // 자홍 빈 사각형

  // 중첩 사각형 (테두리 효과)
  tft.fillRect(30,  140, 170, 70, COLOR_BLUE);
  tft.fillRect(40,  150, 150, 50, COLOR_GREEN);
  tft.fillRect(50,  160, 130, 30, COLOR_YELLOW);
  tft.fillRect(60,  170, 110, 10, COLOR_RED);

  tft.setTextColor(COLOR_WHITE);
  tft.setTextSize(1);
  tft.setCursor(10, 220);
  tft.print("fill / draw / nested");
}

// -----------------------------------------------
// 삼각형 그리기 데모
// -----------------------------------------------
void demoTriangles() {
  tft.fillScreen(COLOR_BLACK);

  tft.setTextColor(COLOR_WHITE);
  tft.setTextSize(1);
  tft.setCursor(10, 5);
  tft.println("Triangles Demo");

  Serial.println("삼각형 그리기 데모");

  // 채운 삼각형 (fillTriangle)
  // fillTriangle(x0,y0, x1,y1, x2,y2, 색상): 3꼭짓점 좌표
  tft.fillTriangle(60, 30, 20, 100, 100, 100, COLOR_RED);      // 위를 향한 삼각형
  tft.fillTriangle(180, 100, 140, 30, 220, 30, COLOR_GREEN);    // 아래를 향한 삼각형

  // 빈 삼각형 (drawTriangle)
  tft.drawTriangle(120, 120, 40, 210, 200, 210, COLOR_YELLOW);  // 큰 빈 삼각형
  tft.drawTriangle(120, 140, 70, 200, 170, 200, COLOR_CYAN);    // 안쪽 빈 삼각형
}

// -----------------------------------------------
// 색상 블록 데모
// -----------------------------------------------
void demoColorBlocks() {
  tft.fillScreen(COLOR_BLACK);

  tft.setTextColor(COLOR_WHITE);
  tft.setTextSize(1);
  tft.setCursor(10, 5);
  tft.println("Color Blocks Demo");

  Serial.println("색상 블록 데모");

  // 6x4 색상 팔레트 (화면을 균등 분할)
  // 각 셀 크기: 40x55 픽셀
  uint16_t palette[] = {
    COLOR_RED,     COLOR_GREEN,   COLOR_BLUE,    COLOR_YELLOW,
    COLOR_CYAN,    COLOR_MAGENTA, COLOR_ORANGE,  COLOR_WHITE,
    0xF800,        0x07E0,        0x001F,        0xFFE0,
    0x8000,        0x0400,        0x0010,        0x8410,
    0xFBE0,        0x07FF,        0xF81F,        0x7BEF,
    0xFD20,        0xAFE5,        0x6C1F,        0xB5B4
  };

  int cellW = 60;   // 셀 너비
  int cellH = 45;   // 셀 높이
  int cols  = 4;    // 열 수
  int rows  = 4;    // 행 수
  int startY = 20;  // 시작 y 위치

  for (int row = 0; row < rows; row++) {
    for (int col = 0; col < cols; col++) {
      int x = col * cellW;
      int y = startY + row * cellH;
      tft.fillRect(x, y, cellW - 2, cellH - 2, palette[row * cols + col]);
    }
  }
}
