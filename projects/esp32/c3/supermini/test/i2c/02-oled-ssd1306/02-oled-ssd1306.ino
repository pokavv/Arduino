/*
 * ════════════════════════════════════════════════════════════════
 * 02-oled-ssd1306 — OLED 텍스트 출력 기본 예제
 * ════════════════════════════════════════════════════════════════
 *
 * [핵심 개념]
 * ────────────────────────────────────────────────────────────────
 * SSD1306은 128×64 픽셀의 흑백 OLED 디스플레이 컨트롤러입니다.
 *
 * 화면 버퍼(display buffer):
 *   라이브러리는 RAM에 128×64 비트맵을 먼저 그린 뒤,
 *   display.display()를 호출할 때 한 번에 OLED로 전송합니다.
 *   → clearDisplay()로 버퍼를 지우고, 그린 뒤, display()로 반영.
 *
 * 좌표계:
 *   (0, 0)이 왼쪽 위 모서리, X는 오른쪽, Y는 아래 방향.
 *
 * [라이브러리]
 * ────────────────────────────────────────────────────────────────
 *  Arduino IDE > 라이브러리 매니저에서 설치:
 *  - "Adafruit SSD1306" (by Adafruit)
 *  - "Adafruit GFX Library" (by Adafruit) — SSD1306 의존성
 *
 * [준비물]
 * ────────────────────────────────────────────────────────────────
 *  - ESP32-C3 Super Mini × 1
 *  - SSD1306 OLED 모듈 (128×64, I2C 타입) × 1
 *  - 점퍼 와이어 4개
 *
 * [연결 방법]
 * ────────────────────────────────────────────────────────────────
 *  OLED 모듈      ESP32-C3 Super Mini
 *  ──────────────────────────────────
 *  VCC ────────── 3.3V
 *  GND ────────── GND
 *  SDA ────────── G8
 *  SCL ────────── G9
 *
 *  ※ 대부분의 OLED 모듈에는 풀업 저항이 내장되어 있어
 *    별도 저항 없이 바로 연결 가능합니다.
 * ════════════════════════════════════════════════════════════════
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"

// OLED 디스플레이 객체 생성
// 마지막 인자(-1)는 리셋 핀 번호: 없으면 -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

unsigned long prevMillis = 0;  // 마지막 업데이트 시각
int counter = 0;               // 화면에 표시할 카운터 값

void setup() {
    Serial.begin(BAUD_RATE);
    delay(1000);

    // I2C 버스 초기화
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

    // OLED 초기화 — 실패하면 시리얼에 오류 출력 후 정지
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
        Serial.println("[오류] SSD1306 초기화 실패!");
        Serial.println("체크: 주소(0x3C/0x3D), 연결 상태, 전원 확인");
        while (true) { delay(1000); }  // 무한 대기
    }

    Serial.println("OLED 초기화 성공");

    // 스플래시 화면 표시 (Adafruit 로고 약 2초)
    display.display();
    delay(2000);

    // 초기 화면 출력
    showWelcome();
}

void loop() {
    unsigned long currentMillis = millis();

    // UPDATE_INTERVAL마다 카운터 증가 및 화면 갱신 (논블로킹)
    if (currentMillis - prevMillis >= UPDATE_INTERVAL) {
        prevMillis = currentMillis;
        counter++;
        showCounter();
    }
}

// 환영 메시지 화면
void showWelcome() {
    display.clearDisplay();  // 버퍼 전체를 검정으로 초기화

    // 제목 — 텍스트 크기 2 (12×16 픽셀/문자)
    display.setTextSize(2);
    display.setTextColor(SSD1306_WHITE);  // 흰색 (픽셀 켜짐)
    display.setCursor(10, 0);             // (x=10, y=0) 위치에서 시작
    display.println("Hello!");

    // 부제목 — 텍스트 크기 1 (6×8 픽셀/문자)
    display.setTextSize(1);
    display.setCursor(0, 24);
    display.println("ESP32-C3 Super Mini");
    display.setCursor(0, 36);
    display.println("OLED SSD1306 Test");
    display.setCursor(0, 52);
    display.println("I2C Addr: 0x3C");

    // 버퍼 내용을 실제 OLED 화면에 전송 (이 줄 없으면 화면 안 바뀜!)
    display.display();
}

// 카운터 화면
void showCounter() {
    display.clearDisplay();

    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("=== OLED 카운터 ===");

    // 큰 숫자로 카운터 표시
    display.setTextSize(3);
    display.setCursor(20, 20);
    display.println(counter);

    display.setTextSize(1);
    display.setCursor(0, 56);
    display.printf("uptime: %lu s", millis() / 1000);

    display.display();

    Serial.printf("카운터: %d\n", counter);
}
