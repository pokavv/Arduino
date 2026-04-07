/**
 * @file  04-ws2812b-animation.ino
 * @brief WS2812B 2가지 애니메이션 - 나이트 라이더 & 무지개 흐름
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * 논블로킹(Non-blocking) 애니메이션:
 * - delay()를 사용하면 그 시간 동안 CPU가 멈춥니다.
 * - millis()를 사용하면 시간을 확인하면서 다른 작업도 할 수 있습니다.
 *
 * millis() 패턴:
 *   unsigned long lastMs = 0;
 *   if (millis() - lastMs >= INTERVAL) {
 *       lastMs = millis();
 *       // 할 일
 *   }
 *
 * 애니메이션 1 - 나이트 라이더 (Knight Rider):
 * - 빛나는 점이 좌우로 왕복합니다.
 * - 현재 위치만 켜고 나머지는 꺼서 이동하는 효과를 냅니다.
 *
 * 애니메이션 2 - 무지개 흐름 (Rainbow Flow):
 * - 모든 LED에 무지개 색상을 표시하고 천천히 흘러가게 합니다.
 * ---------------------------------------------------------------
 * [라이브러리]
 * - FastLED (Arduino IDE → 라이브러리 관리 → "FastLED" 검색)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - WS2812B LED 스트립 (8개) x1
 * - 470Ω 저항 x1 (데이터 선)
 * ---------------------------------------------------------------
 * [연결 방법]
 * WS2812B 스트립:
 *   VCC  → 3V3 또는 외부 5V
 *   GND  → GND
 *   DIN  → 470Ω → ESP32 G2
 * ---------------------------------------------------------------
 */

#include <FastLED.h>
#include "config.h"

// ---------------------------------------------------------------
// LED 배열
// ---------------------------------------------------------------
CRGB leds[LED_COUNT];

// ---------------------------------------------------------------
// 애니메이션 상태 변수
// ---------------------------------------------------------------

// 나이트 라이더 상태
int  knightPos       = 0;       // 현재 밝은 LED 위치 (0 ~ LED_COUNT-1)
bool knightGoingRight = true;   // 이동 방향 (true=오른쪽, false=왼쪽)

// 무지개 상태
uint8_t rainbowHue = 0;         // 무지개 시작 hue 값

// 현재 애니메이션 모드 (0=나이트라이더, 1=무지개)
int animMode = 0;

// 타이머
unsigned long lastAnimMs   = 0;   // 애니메이션 업데이트 타이머
unsigned long lastModeSwMs = 0;   // 모드 전환 타이머

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
void runKnightRider();
void runRainbowFlow();
void switchMode();

// ---------------------------------------------------------------
// setup(): 초기화
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    Serial.println("===== WS2812B 애니메이션 =====");

    FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, LED_COUNT);
    FastLED.setBrightness(BRIGHTNESS);
    FastLED.clear();
    FastLED.show();

    Serial.println("[모드 0] 나이트 라이더 시작");
}

// ---------------------------------------------------------------
// loop(): 메인 루프
// ---------------------------------------------------------------
void loop() {
    unsigned long now = millis();

    // 모드 전환 타이머
    if (now - lastModeSwMs >= MODE_SWITCH_MS) {
        lastModeSwMs = now;
        switchMode();
    }

    // 애니메이션 업데이트 타이머
    if (now - lastAnimMs >= ANIMATION_DELAY) {
        lastAnimMs = now;

        if (animMode == 0) {
            runKnightRider();
        } else {
            runRainbowFlow();
        }
    }
}

// ---------------------------------------------------------------
// runKnightRider(): 나이트 라이더 애니메이션
// 밝은 점이 좌우로 왕복합니다.
// ---------------------------------------------------------------
void runKnightRider() {
    // 모든 LED 끄기
    FastLED.clear();

    // 현재 위치에 빨간색 점 켜기
    leds[knightPos] = CRGB::Red;

    // 잔상 효과: 인접한 LED를 어둡게 켜기
    if (knightPos > 0) {
        leds[knightPos - 1] = CRGB(80, 0, 0);   // 왼쪽 잔상
    }
    if (knightPos < LED_COUNT - 1) {
        leds[knightPos + 1] = CRGB(80, 0, 0);   // 오른쪽 잔상
    }

    FastLED.show();

    // 위치 이동
    if (knightGoingRight) {
        knightPos++;
        if (knightPos >= LED_COUNT - 1) {
            knightGoingRight = false;   // 끝에 닿으면 방향 반전
        }
    } else {
        knightPos--;
        if (knightPos <= 0) {
            knightGoingRight = true;    // 시작에 닿으면 방향 반전
        }
    }
}

// ---------------------------------------------------------------
// runRainbowFlow(): 무지개 흐름 애니메이션
// 모든 LED에 무지개 색상을 표시하고 천천히 이동시킵니다.
// ---------------------------------------------------------------
void runRainbowFlow() {
    uint8_t hueStep = 256 / LED_COUNT;

    for (int i = 0; i < LED_COUNT; i++) {
        leds[i] = CHSV(rainbowHue + (i * hueStep), 255, 255);
    }

    rainbowHue++;   // uint8_t 자동 순환 (255 → 0)
    FastLED.show();
}

// ---------------------------------------------------------------
// switchMode(): 애니메이션 모드를 전환합니다.
// ---------------------------------------------------------------
void switchMode() {
    animMode = (animMode + 1) % 2;

    FastLED.clear();
    FastLED.show();

    // 상태 초기화
    knightPos        = 0;
    knightGoingRight = true;
    rainbowHue       = 0;

    if (animMode == 0) {
        Serial.println("[모드 0] 나이트 라이더");
    } else {
        Serial.println("[모드 1] 무지개 흐름");
    }
}
