/*
 * [핵심 개념] TFT에 센서값 실시간 표시
 * =======================================
 * ADC(Analog-to-Digital Converter)로 아날로그 센서 값을 읽어
 * TFT LCD에 숫자와 막대 그래프로 실시간 표시합니다.
 *
 * ADC 동작 원리:
 *   - 아날로그 전압(0~3.3V)을 디지털 숫자(0~4095)로 변환
 *   - ESP32-C3는 12비트 ADC: 2^12 = 4096 단계
 *   - 0V → 0, 3.3V → 4095
 *   - 주의: Wi-Fi가 켜지면 ADC 정확도 떨어짐
 *
 * 막대 그래프 원리:
 *   ADC값(0~4095)을 화면 너비(0~220px)로 비례 변환
 *   fillRect로 현재 값에 맞는 길이의 막대를 그림
 *   이전 막대는 검정으로 지우고 새 막대를 그려 업데이트
 *
 * [라이브러리]
 *   - Adafruit ST7789
 *   - Adafruit GFX Library
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - ST7789 TFT LCD 모듈 (240x240)
 *   - 가변저항 10kΩ (또는 아날로그 센서)
 *
 * [연결 방법]
 *   TFT: SCL→G4, SDA→G6, RES→G3, DC→G2, CS→G7
 *        VCC→3.3V, GND→GND, BLK→3.3V
 *
 *   가변저항 (3핀):
 *     왼쪽 핀  → GND
 *     가운데 핀 → G0 (ADC 입력)
 *     오른쪽 핀 → 3.3V
 *   가변저항을 돌리면 ADC값이 0~4095 사이로 변합니다.
 */

#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>
#include "config.h"

Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCK, TFT_RST);

// 이전 ADC 값 (화면 깜빡임 최소화를 위해 변화 시에만 업데이트)
int prevAdcValue = -1;
int prevBarWidth = -1;

// 업데이트 타이머 (millis() 기반 논블로킹)
unsigned long lastUpdateTime = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("TFT 센서 디스플레이 시작");

  // ADC 핀을 입력으로 설정
  pinMode(ADC_PIN, INPUT);

  // TFT 초기화
  tft.init(TFT_WIDTH, TFT_HEIGHT);
  tft.setRotation(2);
  tft.fillScreen(ST77XX_BLACK);

  // 고정 UI 그리기 (한 번만)
  drawStaticUI();

  Serial.println("초기화 완료. 센서 값 표시 중...");
}

void loop() {
  unsigned long now = millis();

  // UPDATE_INTERVAL마다 센서 값 업데이트
  if (now - lastUpdateTime >= UPDATE_INTERVAL) {
    lastUpdateTime = now;

    // ADC 값 읽기 (노이즈 줄이기: 4번 읽어 평균)
    int adcValue = readAdcSmoothed();

    // ADC 값을 전압으로 변환 (3.3V 기준)
    // 전압(V) = adcValue / 4095 * 3.3
    float voltage = (float)adcValue / ADC_MAX * 3.3;

    // 시리얼 출력
    Serial.print("ADC: ");
    Serial.print(adcValue);
    Serial.print(" / 전압: ");
    Serial.print(voltage, 2);
    Serial.println("V");

    // TFT 화면 업데이트
    updateDisplay(adcValue, voltage);
  }
}

// -----------------------------------------------
// ADC 스무딩: 4번 읽어 평균값 반환
// -----------------------------------------------
int readAdcSmoothed() {
  long sum = 0;
  const int samples = 4;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(ADC_PIN);
  }
  return (int)(sum / samples);
}

// -----------------------------------------------
// 고정 UI 요소 그리기 (한 번만 실행)
// -----------------------------------------------
void drawStaticUI() {
  // 제목
  tft.setTextColor(ST77XX_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 10);
  tft.println("ADC Monitor");

  // 구분선
  tft.drawLine(0, 35, TFT_WIDTH, 35, ST77XX_WHITE);

  // 레이블: ADC 값
  tft.setTextColor(ST77XX_CYAN);
  tft.setTextSize(1);
  tft.setCursor(BAR_X, 45);
  tft.println("ADC Value (0~4095):");

  // 레이블: 전압
  tft.setCursor(BAR_X, 140);
  tft.println("Voltage (0.00~3.30V):");

  // 막대 그래프 테두리
  tft.drawRect(BAR_X - 1, BAR_Y - 1, BAR_WIDTH + 2, BAR_HEIGHT + 2, ST77XX_WHITE);
  tft.drawRect(BAR_X - 1, BAR_Y + BAR_HEIGHT + 50, BAR_WIDTH + 2, BAR_HEIGHT + 2, ST77XX_WHITE);

  // 눈금 표시 (25%, 50%, 75%)
  for (int i = 1; i <= 3; i++) {
    int x = BAR_X + (BAR_WIDTH * i / 4);
    tft.drawLine(x, BAR_Y + BAR_HEIGHT + 2, x, BAR_Y + BAR_HEIGHT + 8, ST77XX_WHITE);
  }
}

// -----------------------------------------------
// 화면 업데이트 (값이 바뀔 때만)
// -----------------------------------------------
void updateDisplay(int adcValue, float voltage) {
  // ADC 숫자 표시
  // 이전 값을 검정으로 덮어써서 지움
  tft.setTextColor(ST77XX_BLACK);
  tft.setTextSize(3);
  tft.setCursor(BAR_X, 55);
  tft.print("     ");  // 이전 숫자 지우기

  tft.setTextColor(ST77XX_GREEN);
  tft.setCursor(BAR_X, 55);
  tft.print(adcValue);

  // ADC 막대 그래프 업데이트
  // ADC값(0~4095)을 막대 너비(0~BAR_WIDTH)로 변환
  int newBarWidth = map(adcValue, ADC_MIN, ADC_MAX, 0, BAR_WIDTH);

  if (newBarWidth != prevBarWidth) {
    if (newBarWidth > prevBarWidth) {
      // 막대가 길어짐: 추가 부분만 색상으로 채움
      tft.fillRect(BAR_X + prevBarWidth, BAR_Y,
                   newBarWidth - prevBarWidth, BAR_HEIGHT, ST77XX_GREEN);
    } else {
      // 막대가 짧아짐: 줄어든 부분을 검정으로 지움
      tft.fillRect(BAR_X + newBarWidth, BAR_Y,
                   prevBarWidth - newBarWidth, BAR_HEIGHT, ST77XX_BLACK);
    }
    prevBarWidth = newBarWidth;
  }

  // 전압 숫자 표시
  tft.setTextColor(ST77XX_BLACK);
  tft.setTextSize(3);
  tft.setCursor(BAR_X, 150);
  tft.print("      ");  // 이전 숫자 지우기

  tft.setTextColor(ST77XX_YELLOW);
  tft.setCursor(BAR_X, 150);
  tft.print(voltage, 2);
  tft.print("V");

  // 전압 막대 그래프
  int voltBarWidth = map(adcValue, ADC_MIN, ADC_MAX, 0, BAR_WIDTH);
  tft.fillRect(BAR_X, BAR_Y + BAR_HEIGHT + 50, voltBarWidth, BAR_HEIGHT, ST77XX_YELLOW);
  tft.fillRect(BAR_X + voltBarWidth, BAR_Y + BAR_HEIGHT + 50,
               BAR_WIDTH - voltBarWidth, BAR_HEIGHT, ST77XX_BLACK);
}
