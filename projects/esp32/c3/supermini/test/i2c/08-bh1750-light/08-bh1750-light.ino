/*
 * ════════════════════════════════════════════════════════════════
 * 08-bh1750-light — BH1750 조도(밝기) 센서
 * ════════════════════════════════════════════════════════════════
 *
 * [핵심 개념]
 * ────────────────────────────────────────────────────────────────
 * 조도(照度)란 단위 면적에 도달하는 빛의 양으로, 단위는 럭스(lux, lx)입니다.
 *
 * 실생활 조도 기준값:
 *  ─────────────────────────────────────────────
 *   환경                     조도 (lux)
 *  ─────────────────────────────────────────────
 *   어두운 방                   1~10
 *   가정용 조명 (방)           100~300
 *   사무실 형광등              300~500
 *   흐린 날 실외            1,000~10,000
 *   맑은 날 그늘            10,000~20,000
 *   직사광선                50,000~100,000
 *  ─────────────────────────────────────────────
 *
 * BH1750 특징:
 *  - 측정 범위: 1 ~ 65,535 lux
 *  - 디지털 출력 (내장 ADC → I2C 직접 전송)
 *  - 자외선·적외선 영향이 거의 없어 가시광선만 측정
 *
 * 측정 모드:
 *  CONTINUOUS_HIGH_RES_MODE  — 연속 고해상도(1 lux 분해능, 120ms)
 *  CONTINUOUS_LOW_RES_MODE   — 연속 저해상도(4 lux 분해능, 16ms)
 *  ONE_TIME_HIGH_RES_MODE    — 1회 고해상도 측정 후 대기
 *
 * [라이브러리]
 * ────────────────────────────────────────────────────────────────
 *  Arduino IDE > 라이브러리 매니저:
 *  - "BH1750" (by Christopher Laws)
 *
 * [준비물]
 * ────────────────────────────────────────────────────────────────
 *  - ESP32-C3 Super Mini × 1
 *  - BH1750 모듈 × 1
 *  - 점퍼 와이어
 *
 * [연결 방법]
 * ────────────────────────────────────────────────────────────────
 *  BH1750 모듈    ESP32-C3 Super Mini
 *  ──────────────────────────────────
 *  VCC ────────── 3.3V
 *  GND ────────── GND
 *  SDA ────────── G8
 *  SCL ────────── G9
 *  ADDR ───────── GND   (주소 0x23 사용)
 *
 *  ※ 센서 면이 빛을 향하도록 설치하세요.
 * ════════════════════════════════════════════════════════════════
 */

#include <Wire.h>
#include <BH1750.h>
#include "config.h"

BH1750 lightMeter(BH_ADDR);  // BH1750 객체 (주소 지정)

unsigned long prevMillis = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    delay(1000);

    Serial.println("=================================");
    Serial.println("   BH1750 조도 센서 테스트");
    Serial.println("=================================");

    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

    // BH1750 초기화 — CONTINUOUS_HIGH_RES_MODE (1lux 분해능, 연속 측정)
    if (!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, BH_ADDR, &Wire)) {
        Serial.println("[오류] BH1750을 찾을 수 없습니다!");
        Serial.println("체크: 주소(0x23/0x5C), ADDR 핀, 연결 확인");
        while (true) { delay(1000); }
    }

    Serial.println("BH1750 초기화 성공 (고해상도 연속 모드)");
    Serial.println("측정 범위: 1 ~ 65535 lux\n");
    Serial.println("조도 (lux)    환경 추정");
    Serial.println("──────────────────────────────────");
}

void loop() {
    unsigned long currentMillis = millis();

    if (currentMillis - prevMillis >= READ_INTERVAL) {
        prevMillis = currentMillis;

        // 조도 읽기 (lux 단위 부동소수점)
        float lux = lightMeter.readLightLevel();

        if (lux < 0) {
            Serial.println("[오류] 측정 실패");
            return;
        }

        // 조도 값에 따라 환경 설명 문자열 선택
        const char* environment;
        if      (lux < 10)     environment = "어두운 방";
        else if (lux < 100)    environment = "희미한 조명";
        else if (lux < 300)    environment = "가정 조명";
        else if (lux < 1000)   environment = "사무실 조명";
        else if (lux < 10000)  environment = "흐린 날 실외";
        else if (lux < 30000)  environment = "맑은 날 그늘";
        else                   environment = "직사광선";

        Serial.printf("%8.1f lux   → %s\n", lux, environment);
    }
}
