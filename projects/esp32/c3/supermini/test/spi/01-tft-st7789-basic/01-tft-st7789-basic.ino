/*
 * [핵심 개념] SPI 통신과 TFT LCD 디스플레이
 * ============================================
 * SPI(Serial Peripheral Interface)는 4개의 선으로 빠르게 데이터를 주고받는 통신 방식입니다.
 *
 * SPI 핀 역할:
 *   MOSI (Master Out Slave In): ESP32가 TFT로 데이터를 보내는 선
 *   SCK  (Serial Clock):        데이터 전송 타이밍을 맞추는 클럭 신호
 *   CS   (Chip Select):         여러 SPI 기기 중 TFT만 선택. LOW일 때만 통신
 *   DC   (Data/Command):        HIGH면 화면 데이터, LOW면 제어 명령어
 *   RST  (Reset):               TFT를 처음 상태로 초기화
 *
 * ST7789는 240x240 픽셀 TFT LCD 컨트롤러 칩입니다.
 * 색상은 RGB565 형식(16비트)을 사용합니다.
 *
 * [라이브러리]
 *   - Adafruit ST7789 (Arduino Library Manager에서 설치)
 *   - Adafruit GFX Library (자동 설치됨)
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - ST7789 TFT LCD 모듈 (240x240)
 *   - 점퍼 와이어
 *
 * [연결 방법]
 *   TFT VCC  → ESP32 3.3V (반드시 3.3V! 5V 연결 시 파손)
 *   TFT GND  → ESP32 GND
 *   TFT SCL  → G4  (SCK)
 *   TFT SDA  → G6  (MOSI)
 *   TFT RES  → G3  (RST)
 *   TFT DC   → G2  (DC)
 *   TFT CS   → G7  (CS)
 *   TFT BLK  → 3.3V (백라이트 항상 켜기) 또는 PWM 핀
 */

#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>
#include "config.h"

// TFT 객체 생성: 사용할 핀 번호를 생성자에 전달
Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCK, TFT_RST);

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("TFT ST7789 기본 예제 시작");

  // TFT 초기화: 화면 크기 설정 (240x240)
  tft.init(TFT_WIDTH, TFT_HEIGHT);

  // 화면 방향 설정 (0=기본, 1=90도 회전, 2=180도, 3=270도)
  tft.setRotation(2);

  Serial.println("TFT 초기화 완료");

  // === 화면 채우기 데모 ===
  demoFillScreen();

  // === 텍스트 출력 데모 ===
  demoText();
}

void loop() {
  // 색상을 순환하며 화면 채우기
  tft.fillScreen(ST77XX_RED);
  delay(500);
  tft.fillScreen(ST77XX_GREEN);
  delay(500);
  tft.fillScreen(ST77XX_BLUE);
  delay(500);
  tft.fillScreen(ST77XX_BLACK);

  // 텍스트 다시 표시
  demoText();
  delay(2000);
}

// -----------------------------------------------
// 화면 채우기 데모
// -----------------------------------------------
void demoFillScreen() {
  Serial.println("화면 채우기 데모 시작");

  tft.fillScreen(ST77XX_BLACK);   // 검정으로 초기화
  delay(300);

  tft.fillScreen(ST77XX_WHITE);   // 흰색
  delay(300);

  tft.fillScreen(ST77XX_RED);     // 빨간색
  delay(300);

  tft.fillScreen(ST77XX_GREEN);   // 초록색
  delay(300);

  tft.fillScreen(ST77XX_BLUE);    // 파란색
  delay(300);

  tft.fillScreen(ST77XX_BLACK);   // 마지막은 검정
}

// -----------------------------------------------
// 텍스트 출력 데모
// -----------------------------------------------
void demoText() {
  tft.fillScreen(ST77XX_BLACK);   // 화면 지우기

  // 텍스트 색상 설정 (글자색, 배경색)
  tft.setTextColor(ST77XX_WHITE, ST77XX_BLACK);

  // 텍스트 크기 설정 (1=기본, 2=2배, 3=3배)
  tft.setTextSize(2);

  // 커서 위치 설정 (x, y 픽셀)
  tft.setCursor(10, 20);
  tft.println("Hello!");

  tft.setTextColor(ST77XX_YELLOW, ST77XX_BLACK);
  tft.setTextSize(2);
  tft.setCursor(10, 60);
  tft.println("ESP32-C3");

  tft.setTextColor(ST77XX_CYAN, ST77XX_BLACK);
  tft.setTextSize(1);
  tft.setCursor(10, 100);
  tft.println("ST7789 TFT LCD");

  tft.setTextColor(ST77XX_GREEN, ST77XX_BLACK);
  tft.setTextSize(1);
  tft.setCursor(10, 120);
  tft.println("SPI 통신 예제");

  // 현재 millis 값 표시
  tft.setTextColor(ST77XX_WHITE, ST77XX_BLACK);
  tft.setTextSize(1);
  tft.setCursor(10, 150);
  tft.print("Uptime: ");
  tft.print(millis() / 1000);  // 초 단위로 변환
  tft.println("s");

  Serial.println("텍스트 출력 완료");
}
