/*
 * ════════════════════════════════════════════════════════════════
 * 10-ina219-power — INA219 전류 / 전압 / 전력 모니터
 * ════════════════════════════════════════════════════════════════
 *
 * [핵심 개념]
 * ────────────────────────────────────────────────────────────────
 * INA219는 션트(shunt) 저항에 걸리는 전압 차를 측정하여
 * 흐르는 전류를 계산하는 전력 모니터 IC입니다.
 *
 * 측정 항목:
 *  버스 전압 (V)  — 부하(회로)에 걸리는 전압
 *  션트 전압 (mV) — 션트 저항 양단 전압 차 (매우 작음)
 *  전류    (mA)   — 옴의 법칙: I = V_shunt / R_shunt
 *  전력    (mW)   — P = V × I
 *
 * 기본 설정 (Adafruit 모듈):
 *  션트 저항: 0.1Ω
 *  최대 전류: 3.2A
 *  최대 전압: 26V
 *
 * 전류 방향:
 *  VIN+ → VIN- 방향으로 흐를 때 전류가 양수
 *
 * [라이브러리]
 * ────────────────────────────────────────────────────────────────
 *  Arduino IDE > 라이브러리 매니저:
 *  - "Adafruit INA219" (by Adafruit)
 *
 * [준비물]
 * ────────────────────────────────────────────────────────────────
 *  - ESP32-C3 Super Mini × 1
 *  - INA219 모듈 × 1
 *  - 측정할 회로 (부하: LED, 모터, 센서 등)
 *  - 전원 공급 장치 또는 배터리
 *  - 점퍼 와이어
 *
 * [연결 방법]
 * ────────────────────────────────────────────────────────────────
 *  INA219        ESP32-C3 Super Mini
 *  ──────────────────────────────────
 *  VCC ────────── 3.3V
 *  GND ────────── GND
 *  SDA ────────── G8
 *  SCL ────────── G9
 *
 *  전력 측정 회로 연결 (INA219를 전원과 부하 사이에 삽입):
 *
 *  [전원 +] ─── VIN+ ─── INA219 ─── VIN- ─── [부하] ─── [전원 -]
 *
 *  ① 전원 양극(+)을 VIN+에 연결
 *  ② VIN-에서 나온 선을 측정할 부하(LED, 모터 등) 입력에 연결
 *  ③ 부하 출력을 전원 음극(-)에 연결
 *  ④ GND는 INA219 GND와 ESP32 GND 모두 연결
 *
 *  주의: VIN+/VIN- 최대 전압은 26V입니다.
 *        극성 반대 연결 시 모듈 손상 가능!
 * ════════════════════════════════════════════════════════════════
 */

#include <Wire.h>
#include <Adafruit_INA219.h>
#include "config.h"

Adafruit_INA219 ina219(INA_ADDR);  // INA219 객체 (주소 지정)

unsigned long prevMillis = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    delay(1000);

    Serial.println("=================================");
    Serial.println("   INA219 전력 모니터 테스트");
    Serial.println("=================================");

    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

    // INA219 초기화
    if (!ina219.begin(&Wire)) {
        Serial.println("[오류] INA219를 찾을 수 없습니다!");
        Serial.println("체크: 주소(0x40), 연결, A0/A1 핀 상태");
        while (true) { delay(1000); }
    }

    Serial.println("INA219 초기화 성공");
    Serial.println("전원과 부하 사이에 INA219가 올바르게 연결되었는지 확인하세요.");
    Serial.println();
    Serial.println("버스전압(V)  전류(mA)   전력(mW)  션트전압(mV)");
    Serial.println("────────────────────────────────────────────────");
}

void loop() {
    unsigned long currentMillis = millis();

    if (currentMillis - prevMillis >= READ_INTERVAL) {
        prevMillis = currentMillis;

        // 각 측정값 읽기
        float busVoltage   = ina219.getBusVoltage_V();     // 버스 전압 (V)
        float shuntVoltage = ina219.getShuntVoltage_mV();  // 션트 전압 (mV)
        float current      = ina219.getCurrent_mA();       // 전류 (mA)
        float power        = ina219.getPower_mW();         // 전력 (mW)

        // 결과 출력
        Serial.printf("  %6.3f V   %8.2f mA   %8.2f mW   %6.2f mV",
                      busVoltage, current, power, shuntVoltage);

        // 경고 체크
        if (current > CURRENT_WARN_MA) {
            Serial.print("  [경고: 과전류!]");
        }
        if (busVoltage < VOLTAGE_WARN_LOW && busVoltage > 0.1F) {
            Serial.print("  [경고: 저전압!]");
        }
        Serial.println();

        // 음수 전류는 연결이 반대일 가능성 알림
        if (current < -10.0F) {
            Serial.println("  → 전류가 음수입니다. VIN+/VIN- 연결을 확인하세요.");
        }
    }
}
