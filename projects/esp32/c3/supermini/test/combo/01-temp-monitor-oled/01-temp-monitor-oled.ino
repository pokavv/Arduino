/*
 * combo/01-temp-monitor-oled — DHT22 + SSD1306 OLED 온습도 표시
 * ================================================================
 *
 * [핵심 개념 설명]
 *   DHT22 온습도 센서
 *     - 온도 -40~80°C, 습도 0~100% RH 측정
 *     - 단선 디지털 통신 (1-Wire 유사 프로토콜)
 *     - 최소 2초 간격으로 읽어야 함 (너무 자주 읽으면 오류)
 *
 *   SSD1306 OLED 디스플레이
 *     - 128x64 픽셀 흑백 디스플레이
 *     - I2C 통신 (SDA, SCL 2핀만 사용)
 *     - Adafruit_SSD1306 라이브러리 사용
 *
 * [라이브러리]
 *   DHT sensor library (Adafruit) — 라이브러리 매니저에서 설치
 *   Adafruit SSD1306 — 라이브러리 매니저에서 설치
 *   Adafruit GFX Library — SSD1306 의존성, 함께 설치됨
 *
 * [준비물]
 *   - DHT22 센서 모듈 1개 (또는 DHT22 + 10kΩ 풀업 저항)
 *   - SSD1306 OLED 모듈 1개 (128x64, I2C)
 *
 * [연결 방법]
 *   DHT22 모듈
 *   G2 (DHT_PIN) → DHT22 DATA
 *   3.3V         → DHT22 VCC
 *   GND          → DHT22 GND
 *
 *   SSD1306 OLED (I2C)
 *   G8 (I2C_SDA) → OLED SDA
 *   G9 (I2C_SCL) → OLED SCL
 *   3.3V         → OLED VCC (일부 모듈은 5V 필요 — 모듈 규격 확인)
 *   GND          → OLED GND
 *
 *   주의: G8/G9을 I2C로 사용하면 내장 LED/BOOT 버튼 사용 불가
 *         권장: SDA=4, SCL=5 핀으로 변경
 */

#include "config.h"
#include <Wire.h>
#include <DHT.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ---- DHT22 객체 ----
DHT dht(DHT_PIN, DHT22);

// ---- SSD1306 OLED 객체 ----
// (-1): 리셋 핀 없음 (OLED 모듈에 RST 핀이 없거나 연결 안 할 때)
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);

float temperature = 0.0f;  // 최근 온도 값
float humidity    = 0.0f;  // 최근 습도 값
unsigned long lastReadTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // ---- I2C 핀 설정 ----
  Wire.begin(I2C_SDA, I2C_SCL);

  // ---- OLED 초기화 ----
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("[오류] OLED 초기화 실패! I2C 주소(0x3C/0x3D) 및 배선 확인");
    while (true) { delay(1000); }
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);  // OLED는 흰색/검은색만 있음

  // 시작 화면
  display.setTextSize(1);
  display.setCursor(10, 20);
  display.println("DHT22 + OLED");
  display.setCursor(20, 35);
  display.println("Starting...");
  display.display();  // 버퍼를 실제 화면에 출력

  // ---- DHT22 초기화 ----
  dht.begin();
  delay(2000);  // DHT22 안정화 대기 (2초 필요)

  Serial.println("초기화 완료");
}

void loop() {
  unsigned long now = millis();

  if (now - lastReadTime >= UPDATE_INTERVAL) {
    lastReadTime = now;

    // ---- DHT22 읽기 ----
    float newTemp = dht.readTemperature();   // 섭씨 온도
    float newHum  = dht.readHumidity();      // 상대 습도(%)

    // isnan(): 값이 NaN(Not a Number)이면 읽기 실패
    if (isnan(newTemp) || isnan(newHum)) {
      Serial.println("[경고] DHT22 읽기 실패 — 배선 확인");
    } else {
      temperature = newTemp;
      humidity    = newHum;

      Serial.print("온도: "); Serial.print(temperature, 1); Serial.print("°C  ");
      Serial.print("습도: "); Serial.print(humidity, 1);    Serial.println("%");

      updateDisplay();
    }
  }
}

// ---- OLED 화면 업데이트 ----
void updateDisplay() {
  display.clearDisplay();  // 화면 지우기

  // ---- 제목 ----
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("ESP32-C3 DHT22");

  // ---- 구분선 (수동 선 그리기) ----
  display.drawLine(0, 10, OLED_WIDTH - 1, 10, SSD1306_WHITE);

  // ---- 온도 표시 (큰 글씨) ----
  display.setTextSize(2);  // 2배 크기
  display.setCursor(0, 16);
  display.print("T:");
  display.print(temperature, 1);
  display.println("C");

  // ---- 습도 표시 (큰 글씨) ----
  display.setCursor(0, 38);
  display.print("H:");
  display.print(humidity, 1);
  display.println("%");

  display.display();  // 버퍼 → 화면 출력 (이 줄 없으면 화면에 안 나타남)
}
