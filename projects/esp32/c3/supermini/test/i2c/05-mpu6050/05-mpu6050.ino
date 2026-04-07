/*
 * ════════════════════════════════════════════════════════════════
 * 05-mpu6050 — MPU6050 6축 가속도/자이로 센서
 * ════════════════════════════════════════════════════════════════
 *
 * [핵심 개념]
 * ────────────────────────────────────────────────────────────────
 * MPU6050은 6-DOF(자유도) IMU(관성 측정 장치)입니다.
 * 3축 가속도계 + 3축 자이로스코프 = 6축 측정
 *
 * 가속도계 (Accelerometer):
 *   물체에 작용하는 가속도를 측정합니다. 단위: m/s²
 *   정지 상태에서도 중력(9.8 m/s²)이 아래 방향으로 감지됩니다.
 *   → 기울기 감지, 진동 감지에 사용
 *
 * 자이로스코프 (Gyroscope):
 *   회전 각속도를 측정합니다. 단위: rad/s
 *   얼마나 빨리 돌고 있는지를 나타냅니다.
 *   → 회전 방향 감지, 드론 자세 제어에 사용
 *
 * 3축 방향:
 *   X 축 — 앞/뒤 방향 (롤, Roll)
 *   Y 축 — 좌/우 방향 (피치, Pitch)
 *   Z 축 — 위/아래 방향 (요, Yaw)
 *
 * AD0 핀으로 I2C 주소 선택:
 *   AD0 → GND : 0x68 (기본)
 *   AD0 → VCC : 0x69
 *
 * [라이브러리]
 * ────────────────────────────────────────────────────────────────
 *  Arduino IDE > 라이브러리 매니저:
 *  - "Adafruit MPU6050" (by Adafruit)
 *  - "Adafruit Unified Sensor" (by Adafruit)
 *  - "Adafruit BusIO" (by Adafruit)
 *
 * [준비물]
 * ────────────────────────────────────────────────────────────────
 *  - ESP32-C3 Super Mini × 1
 *  - MPU6050 모듈 × 1
 *  - 점퍼 와이어
 *
 * [연결 방법]
 * ────────────────────────────────────────────────────────────────
 *  MPU6050 모듈   ESP32-C3 Super Mini
 *  ──────────────────────────────────
 *  VCC ────────── 3.3V
 *  GND ────────── GND
 *  SDA ────────── G8
 *  SCL ────────── G9
 *  AD0 ────────── GND   (주소 0x68 선택)
 *  INT ────────── 연결 안 해도 됨 (인터럽트 사용 안 할 때)
 * ════════════════════════════════════════════════════════════════
 */

#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include "config.h"

Adafruit_MPU6050 mpu;

unsigned long prevMillis = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    delay(1000);

    Serial.println("=================================");
    Serial.println("   MPU6050 6축 센서 테스트");
    Serial.println("=================================");

    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

    // MPU6050 초기화
    if (!mpu.begin(MPU_ADDR, &Wire)) {
        Serial.println("[오류] MPU6050을 찾을 수 없습니다!");
        Serial.println("체크: 주소(0x68/0x69), 연결, AD0 핀 상태");
        while (true) { delay(1000); }
    }

    Serial.println("MPU6050 초기화 성공");

    // 가속도계 측정 범위 설정
    // ±2g: 섬세한 움직임 감지 / ±16g: 강한 충격 감지
    mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
    Serial.print("가속도 범위: ");
    switch (mpu.getAccelerometerRange()) {
        case MPU6050_RANGE_2_G:  Serial.println("±2g");  break;
        case MPU6050_RANGE_4_G:  Serial.println("±4g");  break;
        case MPU6050_RANGE_8_G:  Serial.println("±8g");  break;
        case MPU6050_RANGE_16_G: Serial.println("±16g"); break;
    }

    // 자이로스코프 측정 범위 설정
    // ±250 deg/s: 느린 회전 / ±2000 deg/s: 빠른 회전
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    Serial.print("자이로 범위: ");
    switch (mpu.getGyroRange()) {
        case MPU6050_RANGE_250_DEG:  Serial.println("±250 deg/s");  break;
        case MPU6050_RANGE_500_DEG:  Serial.println("±500 deg/s");  break;
        case MPU6050_RANGE_1000_DEG: Serial.println("±1000 deg/s"); break;
        case MPU6050_RANGE_2000_DEG: Serial.println("±2000 deg/s"); break;
    }

    // 디지털 저역 통과 필터 (진동/노이즈 제거)
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

    Serial.println("\n측정 시작...");
    Serial.println("가속도(m/s²)              자이로(rad/s)             온도");
    Serial.println("   X       Y       Z          X       Y       Z");
    Serial.println("──────────────────────────────────────────────────────────────");
}

void loop() {
    unsigned long currentMillis = millis();

    if (currentMillis - prevMillis >= READ_INTERVAL) {
        prevMillis = currentMillis;

        // 센서 이벤트 구조체로 데이터 읽기
        sensors_event_t accel, gyro, temp;
        mpu.getEvent(&accel, &gyro, &temp);

        // 가속도 (m/s²) — 정지 시 Z축에 약 9.8 m/s² (중력) 감지
        Serial.printf("가속: %6.2f  %6.2f  %6.2f  ",
                      accel.acceleration.x,
                      accel.acceleration.y,
                      accel.acceleration.z);

        // 자이로 (rad/s) — 회전 없으면 약 0
        Serial.printf("자이로: %6.2f  %6.2f  %6.2f  ",
                      gyro.gyro.x,
                      gyro.gyro.y,
                      gyro.gyro.z);

        // 칩 내부 온도 (°C) — 환경 온도와 약간 다를 수 있음
        Serial.printf("온도: %.1f°C\n", temp.temperature);
    }
}
