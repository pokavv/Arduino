/*
 * ════════════════════════════════════════════════════════════════
 * 06-ds3231-rtc — DS3231 실시간 시계 (RTC)
 * ════════════════════════════════════════════════════════════════
 *
 * [핵심 개념]
 * ────────────────────────────────────────────────────────────────
 * RTC(Real-Time Clock, 실시간 시계)는 ESP32가 꺼져 있어도
 * 코인 배터리(CR2032)로 시각을 유지하는 시계 모듈입니다.
 *
 * DS3231의 특징:
 *  - 온도 보상 발진기(TCXO) 내장 → 오차 ±2ppm (년 약 1분 오차)
 *  - 32kHz 클럭 출력, 알람 2개, 온도 센서 내장
 *  - 코인 배터리(CR2032) 슬롯 포함 — 전원 꺼도 시각 유지
 *
 * 처음 사용 시 컴파일 시각으로 시간을 자동 설정합니다.
 * (이미 설정된 RTC는 재설정 안 함)
 *
 * [라이브러리]
 * ────────────────────────────────────────────────────────────────
 *  Arduino IDE > 라이브러리 매니저:
 *  - "RTClib" (by Adafruit)
 *
 * [준비물]
 * ────────────────────────────────────────────────────────────────
 *  - ESP32-C3 Super Mini × 1
 *  - DS3231 RTC 모듈 × 1 (CR2032 배터리 포함)
 *  - 점퍼 와이어
 *
 * [연결 방법]
 * ────────────────────────────────────────────────────────────────
 *  DS3231 모듈    ESP32-C3 Super Mini
 *  ──────────────────────────────────
 *  VCC ────────── 3.3V
 *  GND ────────── GND
 *  SDA ────────── G8
 *  SCL ────────── G9
 *  SQW ────────── 연결 안 해도 됨 (알람 인터럽트 핀)
 *  32K ────────── 연결 안 해도 됨 (32kHz 출력)
 *
 *  ※ 배터리를 장착하면 전원을 꺼도 시각이 유지됩니다.
 * ════════════════════════════════════════════════════════════════
 */

#include <Wire.h>
#include <RTClib.h>
#include "config.h"

RTC_DS3231 rtc;  // DS3231 객체

// 요일 이름 배열 (0=일요일)
const char* DAY_NAMES[] = {
    "일요일", "월요일", "화요일", "수요일",
    "목요일", "금요일", "토요일"
};

unsigned long prevMillis = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    delay(1000);

    Serial.println("=================================");
    Serial.println("   DS3231 RTC 테스트");
    Serial.println("=================================");

    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

    if (!rtc.begin(&Wire)) {
        Serial.println("[오류] DS3231을 찾을 수 없습니다!");
        Serial.println("체크: 연결 확인 (SDA=G8, SCL=G9)");
        while (true) { delay(1000); }
    }

    // 전원 손실(배터리 방전 등) 또는 처음 사용 시
    // 스케치를 컴파일한 시각으로 RTC를 설정합니다.
    if (rtc.lostPower()) {
        Serial.println("[알림] 전원 손실 감지 → 컴파일 시각으로 설정");
        // __DATE__, __TIME__: 컴파일 시각 매크로 (예: "Apr  7 2026", "12:34:56")
        rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }

    // 현재 RTC 시각 표시
    DateTime now = rtc.now();
    Serial.printf("현재 시각: %04d/%02d/%02d %02d:%02d:%02d (%s)\n",
                  now.year(), now.month(), now.day(),
                  now.hour(), now.minute(), now.second(),
                  DAY_NAMES[now.dayOfTheWeek()]);

    // DS3231 내장 온도 표시 (±3°C 정확도)
    Serial.printf("DS3231 온도: %.2f°C\n", rtc.getTemperature());
    Serial.println("\n1초마다 시각 출력 시작...\n");
}

void loop() {
    unsigned long currentMillis = millis();

    if (currentMillis - prevMillis >= PRINT_INTERVAL) {
        prevMillis = currentMillis;

        DateTime now = rtc.now();  // 현재 시각 읽기

        // YYYY/MM/DD HH:MM:SS 형식 출력
        Serial.printf("%04d/%02d/%02d  %02d:%02d:%02d  %s",
                      now.year(), now.month(), now.day(),
                      now.hour(), now.minute(), now.second(),
                      DAY_NAMES[now.dayOfTheWeek()]);

        // Unix 타임스탬프도 함께 출력 (1970-01-01 00:00:00 UTC 기준 초)
        Serial.printf("  [Unix: %lu]\n", now.unixtime());
    }
}
