/*
 * ════════════════════════════════════════════════════════════════
 * 04-bme280 — BME280 온도 / 습도 / 기압 센서
 * ════════════════════════════════════════════════════════════════
 *
 * [핵심 개념]
 * ────────────────────────────────────────────────────────────────
 * BME280은 Bosch 사의 환경 센서로, 하나의 칩에서 세 가지를 측정합니다.
 *
 *  온도  (°C)   — 동작 범위: -40 ~ +85°C, 정확도: ±1°C
 *  습도  (%RH)  — 동작 범위: 0 ~ 100%, 정확도: ±3%
 *  기압  (hPa)  — 동작 범위: 300 ~ 1100hPa
 *               해수면 기준 약 1013hPa, 고도 올라갈수록 낮아짐
 *
 * SDO 핀으로 I2C 주소를 선택할 수 있습니다.
 *  SDO → GND : 0x76 (기본)
 *  SDO → VCC : 0x77
 * → 같은 버스에 두 개를 연결할 때 유용
 *
 * [라이브러리]
 * ────────────────────────────────────────────────────────────────
 *  Arduino IDE > 라이브러리 매니저:
 *  - "Adafruit BME280 Library" (by Adafruit)
 *  - "Adafruit Unified Sensor" (by Adafruit) — BME280 의존성
 *
 * [준비물]
 * ────────────────────────────────────────────────────────────────
 *  - ESP32-C3 Super Mini × 1
 *  - BME280 모듈 (I2C 타입) × 1
 *  - 점퍼 와이어
 *
 * [연결 방법]
 * ────────────────────────────────────────────────────────────────
 *  BME280 모듈    ESP32-C3 Super Mini
 *  ──────────────────────────────────
 *  VIN(VCC) ─── 3.3V  ← 반드시 3.3V
 *  GND      ─── GND
 *  SDA      ─── G8
 *  SCL      ─── G9
 *  SDO      ─── GND   (주소 0x76 사용 시)
 *  CSB      ─── VCC   (I2C 모드 선택)
 *
 *  ※ 모듈에 따라 CSB/SDO가 이미 연결되어 있을 수 있습니다.
 * ════════════════════════════════════════════════════════════════
 */

#include <Wire.h>
#include <Adafruit_BME280.h>
#include "config.h"

Adafruit_BME280 bme;  // BME280 객체

unsigned long prevMillis = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    delay(1000);

    Serial.println("=================================");
    Serial.println("   BME280 센서 테스트");
    Serial.println("=================================");

    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

    // BME280 초기화 — 지정된 I2C 주소로 시작
    if (!bme.begin(BME_ADDR, &Wire)) {
        Serial.println("[오류] BME280을 찾을 수 없습니다!");
        Serial.println("체크: 주소(0x76/0x77), 연결, SDO 핀 상태");
        while (true) { delay(1000); }
    }

    Serial.println("BME280 초기화 성공");
    Serial.println("측정 시작...\n");
    Serial.println("온도(°C)  |  습도(%RH)  |  기압(hPa)");
    Serial.println("──────────────────────────────────────");
}

void loop() {
    unsigned long currentMillis = millis();

    if (currentMillis - prevMillis >= READ_INTERVAL) {
        prevMillis = currentMillis;

        // 센서 값 읽기
        float temperature = bme.readTemperature();  // 섭씨 온도
        float humidity    = bme.readHumidity();     // 상대 습도 (%)
        float pressure    = bme.readPressure() / 100.0F;  // Pa → hPa 변환

        // 읽기 실패 확인 (NaN = Not a Number)
        if (isnan(temperature) || isnan(humidity) || isnan(pressure)) {
            Serial.println("[오류] 센서 읽기 실패");
            return;
        }

        // 결과 출력 (소수점 2자리)
        Serial.printf("%.2f °C   |  %.2f %%   |  %.2f hPa\n",
                      temperature, humidity, pressure);

        // 참고: 현재 기압으로 고도 추정
        // 해수면 기준 기압을 알면 고도 계산 가능
        float altitude = bme.readAltitude(1013.25);  // 1013.25hPa = 해수면 기준
        Serial.printf("  (추정 고도: %.1f m)\n", altitude);
    }
}
