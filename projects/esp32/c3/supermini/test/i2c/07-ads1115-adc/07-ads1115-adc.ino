/*
 * ════════════════════════════════════════════════════════════════
 * 07-ads1115-adc — ADS1115 외부 16비트 ADC
 * ════════════════════════════════════════════════════════════════
 *
 * [핵심 개념]
 * ────────────────────────────────────────────────────────────────
 * ADC(Analog-to-Digital Converter, 아날로그-디지털 변환기)는
 * 연속적인 아날로그 전압을 숫자로 변환합니다.
 *
 * 12비트 vs 16비트 비교:
 *  ─────────────────────────────────────────────────
 *   구분         비트  분해능              단계 수
 *  ─────────────────────────────────────────────────
 *  ESP32 내장    12   3.3V / 4096  ≈ 0.8mV  4,096
 *  ADS1115      16   4.096V / 32768 ≈ 0.125mV 65,536
 *  ─────────────────────────────────────────────────
 * → 16비트 ADS1115는 내장 ADC 대비 약 6배 더 세밀하게 전압을 구분합니다.
 * → Wi-Fi 켰을 때 ESP32 내장 ADC가 불안정한 경우 ADS1115 사용 권장
 *
 * 4채널 (A0~A3): 싱글 엔드 모드로 각 채널 GND 기준 전압 측정
 * 게인(Gain) 설정으로 측정 범위 변경 가능:
 *  GAIN_TWOTHIRDS → ±6.144V (최대)
 *  GAIN_ONE       → ±4.096V (기본)
 *  GAIN_TWO       → ±2.048V
 *  GAIN_FOUR      → ±1.024V (정밀 측정)
 *
 * [라이브러리]
 * ────────────────────────────────────────────────────────────────
 *  Arduino IDE > 라이브러리 매니저:
 *  - "Adafruit ADS1X15" (by Adafruit)
 *
 * [준비물]
 * ────────────────────────────────────────────────────────────────
 *  - ESP32-C3 Super Mini × 1
 *  - ADS1115 모듈 × 1
 *  - 측정할 아날로그 신호 또는 가변 저항(포텐셔미터)
 *  - 점퍼 와이어
 *
 * [연결 방법]
 * ────────────────────────────────────────────────────────────────
 *  ADS1115       ESP32-C3 Super Mini
 *  ──────────────────────────────────
 *  VDD ────────── 3.3V
 *  GND ────────── GND
 *  SDA ────────── G8
 *  SCL ────────── G9
 *  ADDR ───────── GND   (주소 0x48)
 *  A0  ────────── 측정할 아날로그 전압 (0~3.3V)
 *  A1~A3 ──────── 추가 아날로그 채널 (선택)
 *
 *  포텐셔미터(가변 저항) 연결 예:
 *   한쪽 끝 → 3.3V
 *   가운데(와이퍼) → A0
 *   다른 쪽 끝 → GND
 * ════════════════════════════════════════════════════════════════
 */

#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include "config.h"

Adafruit_ADS1115 ads;  // ADS1115 객체

unsigned long prevMillis = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    delay(1000);

    Serial.println("=================================");
    Serial.println("   ADS1115 16비트 ADC 테스트");
    Serial.println("=================================");

    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

    // ADS1115 초기화
    if (!ads.begin(ADS_ADDR, &Wire)) {
        Serial.println("[오류] ADS1115를 찾을 수 없습니다!");
        Serial.println("체크: 주소(0x48), 연결, ADDR 핀 상태");
        while (true) { delay(1000); }
    }

    // 게인 설정 — ±4.096V 범위 (3.3V 시스템에 적합)
    // 주의: 입력 전압이 ±VDD + 0.3V를 넘으면 ADS1115 손상!
    ads.setGain(GAIN_ONE);

    Serial.println("ADS1115 초기화 성공 (Gain=1, ±4.096V)");
    Serial.printf("분해능: %.3f mV/bit (16비트)\n", MV_PER_BIT);
    Serial.println("\n채널   원시값    전압(mV)   전압(V)");
    Serial.println("─────────────────────────────────────");
}

void loop() {
    unsigned long currentMillis = millis();

    if (currentMillis - prevMillis >= READ_INTERVAL) {
        prevMillis = currentMillis;

        Serial.println("--- 4채널 읽기 ---");

        // A0 ~ A3 채널 순서대로 읽기
        for (int ch = 0; ch < 4; ch++) {
            // readADC_SingleEnded(): 해당 채널 vs GND 전압 측정
            int16_t rawValue = ads.readADC_SingleEnded(ch);

            // 원시값 → 밀리볼트 변환
            // Gain=1일 때: 1 LSB = 0.125mV
            float millivolts = rawValue * MV_PER_BIT;
            float volts = millivolts / 1000.0F;

            Serial.printf("  A%d  %6d    %8.2f mV   %.4f V\n",
                          ch, rawValue, millivolts, volts);
        }
        Serial.println();
    }
}
