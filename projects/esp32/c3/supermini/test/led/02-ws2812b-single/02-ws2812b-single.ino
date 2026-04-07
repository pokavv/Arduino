/**
 * @file  02-ws2812b-single.ino
 * @brief WS2812B 단일 LED 색상 순환 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * WS2812B는 RGB LED + 제어 IC가 하나의 패키지에 들어있는
 * '스마트 LED'입니다.
 *
 * 일반 RGB LED vs WS2812B:
 * - 일반 RGB LED : 핀 3개 필요 (R, G, B 각각 제어)
 * - WS2812B      : 데이터 핀 1개로 색상 + 밝기 모두 제어
 *
 * 데이터 전송 방식:
 * - 데이터 1선(DIN)으로 24비트 색상 정보를 보냅니다.
 * - 색상 순서가 GRB입니다 (RGB가 아님!). FastLED에서 자동 처리.
 * - 여러 LED를 직렬로 연결하면 체인으로 이어집니다.
 *
 * FastLED 라이브러리:
 * - WS2812B 등 스마트 LED를 쉽게 제어하는 라이브러리
 * - CRGB 타입으로 색상을 관리합니다.
 * ---------------------------------------------------------------
 * [라이브러리]
 * - FastLED (Arduino 라이브러리 매니저에서 설치)
 *   Arduino IDE → 도구 → 라이브러리 관리 → "FastLED" 검색
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - WS2812B LED (Neopixel) x1
 * - 470Ω 저항 x1 (데이터 선 보호용, 없어도 동작하지만 권장)
 * - 100μF 전해 콘덴서 x1 (전원 안정화용, 권장)
 * - 점프 와이어, 브레드보드
 * ---------------------------------------------------------------
 * [연결 방법]
 * WS2812B:
 *   VCC(5V or 3.3V) → ESP32 3V3 또는 외부 5V
 *   GND             → GND
 *   DIN             → 470Ω 저항 → ESP32 G2
 *
 * ※ ESP32-C3는 3.3V 출력이라 WS2812B 동작이 불안정할 수 있음.
 *   여러 개 사용할 때는 외부 5V 전원 + GND 공통 연결 권장.
 * ---------------------------------------------------------------
 */

#include <FastLED.h>
#include "config.h"

// ---------------------------------------------------------------
// LED 배열
// CRGB 타입으로 각 LED의 색상을 저장합니다.
// ---------------------------------------------------------------
CRGB leds[LED_COUNT];

// millis() 타이머 변수
unsigned long lastColorChangeMs = 0;

// 현재 색상 인덱스
int colorIndex = 0;

// ---------------------------------------------------------------
// 색상 목록 (R, G, B 순서로 FastLED에 전달)
// ---------------------------------------------------------------
const CRGB COLOR_LIST[] = {
    CRGB::Red,
    CRGB::Green,
    CRGB::Blue,
    CRGB::White,
    CRGB::Purple,
    CRGB::Cyan,
    CRGB::Yellow,
    CRGB::Orange,
    CRGB::Pink,
};

const int COLOR_COUNT = sizeof(COLOR_LIST) / sizeof(COLOR_LIST[0]);

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
void showNextColor();

// ---------------------------------------------------------------
// setup(): 초기화
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    Serial.println("===== WS2812B 단일 LED 색상 순환 =====");

    // FastLED 초기화
    // addLeds<칩종류, 데이터핀, 색상순서>(배열, LED개수)
    // WS2812B는 GRB 순서 → FastLED가 자동 변환
    FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, LED_COUNT);

    // 전체 밝기 설정 (0~255)
    FastLED.setBrightness(BRIGHTNESS);

    // 처음 색상 표시
    showNextColor();
}

// ---------------------------------------------------------------
// loop(): 메인 루프
// ---------------------------------------------------------------
void loop() {
    unsigned long now = millis();

    if (now - lastColorChangeMs >= COLOR_DELAY_MS) {
        lastColorChangeMs = now;
        showNextColor();
    }
}

// ---------------------------------------------------------------
// showNextColor(): 다음 색상으로 전환합니다.
// ---------------------------------------------------------------
void showNextColor() {
    // 현재 색상 인덱스를 순환
    colorIndex = (colorIndex + 1) % COLOR_COUNT;

    // LED 색상 설정
    leds[0] = COLOR_LIST[colorIndex];

    // FastLED.show() 호출해야 실제 LED에 반영됩니다.
    FastLED.show();

    Serial.printf("[색상 변경] 인덱스=%d  R=%3d  G=%3d  B=%3d\n",
                  colorIndex,
                  COLOR_LIST[colorIndex].r,
                  COLOR_LIST[colorIndex].g,
                  COLOR_LIST[colorIndex].b);
}
