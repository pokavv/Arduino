/**
 * @file  05-ws2812b-brightness.ino
 * @brief WS2812B 밝기 제어 - 페이드 + 가변저항 조절
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * FastLED.setBrightness():
 * - 모든 LED의 전체 밝기를 한 번에 조절합니다. (0~255)
 * - 개별 LED 색상값은 그대로 유지되고, 출력 밝기만 스케일됩니다.
 * - 예: 색상이 CRGB(255,0,0)이고 setBrightness(128)이면
 *   실제 출력은 절반 밝기의 빨간색
 *
 * 페이드 효과 (자동):
 * - 밝기를 MIN_BRIGHTNESS에서 MAX_BRIGHTNESS로 서서히 증가,
 *   다시 감소하는 숨쉬기(breathing) 효과입니다.
 *
 * 가변저항 밝기 조절 (수동):
 * - 가변저항을 돌리면 ADC로 0~4095 값을 읽습니다.
 * - map() 함수로 0~4095 범위를 MIN~MAX_BRIGHTNESS로 변환합니다.
 * - Serial 모니터의 입력으로 모드를 전환합니다.
 *
 * ADC(Analog-to-Digital Converter):
 * - 아날로그 전압(0~3.3V)을 디지털 값(0~4095)으로 변환
 * - ESP32-C3는 12비트 ADC → 0~4095
 * ---------------------------------------------------------------
 * [라이브러리]
 * - FastLED (Arduino IDE → 라이브러리 관리 → "FastLED" 검색)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - WS2812B LED 스트립 (8개) x1
 * - 가변저항 (포텐셔미터) 10kΩ x1
 * - 470Ω 저항 x1 (LED 데이터 선)
 * ---------------------------------------------------------------
 * [연결 방법]
 * WS2812B 스트립:
 *   VCC  → 3V3
 *   GND  → GND
 *   DIN  → 470Ω → ESP32 G2
 *
 * 가변저항:
 *   왼쪽 핀  → GND
 *   중간 핀  → ESP32 G0 (ADC)
 *   오른쪽 핀 → 3V3
 * ---------------------------------------------------------------
 */

#include <FastLED.h>
#include "config.h"

// ---------------------------------------------------------------
// LED 배열
// ---------------------------------------------------------------
CRGB leds[LED_COUNT];

// ---------------------------------------------------------------
// 밝기 상태 변수
// ---------------------------------------------------------------
int  currentBrightness = MIN_BRIGHTNESS;   // 현재 밝기
bool fadeIncreasing    = true;             // 페이드 방향 (true=증가)

// 모드: 0=자동 페이드, 1=가변저항 수동 조절
int brightnessMode = 0;

// 타이머
unsigned long lastFadeMs    = 0;
unsigned long lastAdcReadMs = 0;

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
void setupLeds();
void setAllColor(CRGB color);
void runAutoFade();
void runPotControl();
void checkSerialInput();

// ---------------------------------------------------------------
// setup(): 초기화
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    Serial.println("===== WS2812B 밝기 제어 =====");
    Serial.println("시리얼에 '1' 입력: 가변저항 모드");
    Serial.println("시리얼에 '0' 입력: 자동 페이드 모드");

    FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, LED_COUNT);
    FastLED.setBrightness(MIN_BRIGHTNESS);

    // 모든 LED를 흰색으로 설정 (밝기로만 제어)
    setAllColor(CRGB::White);
    FastLED.show();

    Serial.println("[모드 0] 자동 페이드 시작");
}

// ---------------------------------------------------------------
// loop(): 메인 루프
// ---------------------------------------------------------------
void loop() {
    checkSerialInput();

    if (brightnessMode == 0) {
        runAutoFade();
    } else {
        runPotControl();
    }
}

// ---------------------------------------------------------------
// setAllColor(): 모든 LED를 동일한 색상으로 설정합니다.
// ---------------------------------------------------------------
void setAllColor(CRGB color) {
    for (int i = 0; i < LED_COUNT; i++) {
        leds[i] = color;
    }
}

// ---------------------------------------------------------------
// runAutoFade(): 밝기를 자동으로 페이드 인/아웃합니다.
// ---------------------------------------------------------------
void runAutoFade() {
    unsigned long now = millis();

    if (now - lastFadeMs < FADE_DELAY_MS) {
        return;
    }
    lastFadeMs = now;

    // 밝기 증가 또는 감소
    if (fadeIncreasing) {
        currentBrightness += FADE_STEP;
        if (currentBrightness >= MAX_BRIGHTNESS) {
            currentBrightness = MAX_BRIGHTNESS;
            fadeIncreasing    = false;   // 방향 전환
        }
    } else {
        currentBrightness -= FADE_STEP;
        if (currentBrightness <= MIN_BRIGHTNESS) {
            currentBrightness = MIN_BRIGHTNESS;
            fadeIncreasing    = true;   // 방향 전환
        }
    }

    FastLED.setBrightness(currentBrightness);
    FastLED.show();
}

// ---------------------------------------------------------------
// runPotControl(): 가변저항 값으로 밝기를 조절합니다.
// ---------------------------------------------------------------
void runPotControl() {
    unsigned long now = millis();

    if (now - lastAdcReadMs < ADC_READ_MS) {
        return;
    }
    lastAdcReadMs = now;

    // ADC 읽기: 0~4095 (12비트)
    int adcValue = analogRead(ADC_PIN);

    // ADC 값을 MIN~MAX_BRIGHTNESS 범위로 변환
    int brightness = map(adcValue, 0, 4095, MIN_BRIGHTNESS, MAX_BRIGHTNESS);
    currentBrightness = brightness;

    FastLED.setBrightness(currentBrightness);
    FastLED.show();

    Serial.printf("[가변저항] ADC=%4d  밝기=%3d\n", adcValue, brightness);
}

// ---------------------------------------------------------------
// checkSerialInput(): 시리얼 입력으로 모드를 전환합니다.
// ---------------------------------------------------------------
void checkSerialInput() {
    if (!Serial.available()) {
        return;
    }

    char input = Serial.read();

    if (input == '0') {
        brightnessMode = 0;
        Serial.println("[모드 0] 자동 페이드");
    } else if (input == '1') {
        brightnessMode = 1;
        Serial.println("[모드 1] 가변저항 수동 조절");
    }
}
