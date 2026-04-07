/*
 * ════════════════════════════════════════════════════════════════
 * 01-scanner — I2C 장치 주소 스캐너
 * ════════════════════════════════════════════════════════════════
 *
 * [핵심 개념]
 * ────────────────────────────────────────────────────────────────
 * I2C(Inter-Integrated Circuit)는 단 2개의 선으로 여러 부품과
 * 통신하는 직렬 통신 방식입니다.
 *
 *  SDA (Serial Data)  — 데이터를 주고받는 선
 *  SCL (Serial Clock) — 통신 타이밍을 맞추는 클럭 선
 *
 * 각 I2C 장치는 고유한 7비트 주소(0x03 ~ 0x77)를 가집니다.
 * 예) OLED: 0x3C, BME280: 0x76, MPU6050: 0x68
 *
 * 이 스케치는 모든 주소를 하나씩 두드려 보고("Wire.endTransmission == 0")
 * 응답한 장치의 주소를 시리얼 모니터에 출력합니다.
 * 어떤 I2C 모듈을 연결했는지 주소를 모를 때 먼저 실행하세요.
 *
 * [준비물]
 * ────────────────────────────────────────────────────────────────
 *  - ESP32-C3 Super Mini × 1
 *  - 탐색하고 싶은 I2C 장치 (OLED, BME280 등) × 1 이상
 *  - 점퍼 와이어
 *  - (선택) 4.7kΩ 풀업 저항 × 2
 *    → SDA, SCL 선을 각각 3.3V에 연결 (모듈 내장 풀업이 없을 때 필요)
 *
 * [연결 방법]
 * ────────────────────────────────────────────────────────────────
 *  I2C 장치        ESP32-C3 Super Mini
 *  ──────────────────────────────────
 *  VCC  ────────── 3.3V   ← 반드시 3.3V! 5V 연결 시 고장 위험
 *  GND  ────────── GND    ← 공통 기준 전압 (0V)
 *  SDA  ────────── G8
 *  SCL  ────────── G9
 *
 *  ※ GND(그라운드)는 모든 회로의 기준 전압(0V)입니다.
 *    ESP32와 센서의 GND를 반드시 연결해야 통신이 됩니다.
 *
 * [라이브러리]
 * ────────────────────────────────────────────────────────────────
 *  Wire — ESP32 Arduino 내장 (별도 설치 불필요)
 * ════════════════════════════════════════════════════════════════
 */

#include <Wire.h>
#include "config.h"

void setup() {
    // 시리얼 모니터 시작 — PC에서 결과를 보기 위해 필요
    Serial.begin(BAUD_RATE);
    delay(2000);  // 시리얼 포트가 안정화될 때까지 잠시 대기

    Serial.println("=====================================");
    Serial.println("   I2C 장치 스캐너 시작");
    Serial.println("=====================================");
    Serial.printf("SDA 핀: G%d  /  SCL 핀: G%d\n", I2C_SDA_PIN, I2C_SCL_PIN);

    // I2C 버스 초기화 — SDA와 SCL 핀을 명시적으로 지정
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
}

void loop() {
    int foundCount = 0;  // 발견된 장치 수

    Serial.println("\n--- 스캔 중... ---");

    // 0x03 ~ 0x77 범위의 모든 7비트 주소를 순서대로 확인
    for (uint8_t addr = I2C_ADDR_START; addr <= I2C_ADDR_END; addr++) {

        // 해당 주소로 전송 시작 (실제 데이터 없이 주소만 보냄)
        Wire.beginTransmission(addr);

        // endTransmission() 반환값:
        //  0 → 장치가 응답(ACK)  = 장치 발견!
        //  1 → 데이터 너무 길어 버퍼 초과
        //  2 → 주소 전송 후 NACK (장치 없음)
        //  3 → 데이터 전송 후 NACK
        //  4 → 기타 오류
        uint8_t error = Wire.endTransmission();

        if (error == 0) {
            // 장치 발견! 주소를 16진수로 출력
            Serial.printf("  장치 발견! 주소: 0x%02X (%d)\n", addr, addr);
            foundCount++;
        }
    }

    // 스캔 결과 요약
    Serial.println("--- 스캔 완료 ---");
    if (foundCount == 0) {
        Serial.println("  발견된 장치 없음. 연결을 확인하세요.");
        Serial.println("  체크포인트:");
        Serial.println("   1. VCC → 3.3V 연결 확인");
        Serial.println("   2. GND 연결 확인");
        Serial.println("   3. SDA → G8, SCL → G9 확인");
        Serial.println("   4. 풀업 저항(4.7kΩ) 필요 여부 확인");
    } else {
        Serial.printf("  총 %d개 장치 발견\n", foundCount);
    }

    // 5초 후 다시 스캔 (새 장치를 연결하면 자동으로 감지)
    delay(5000);
}
