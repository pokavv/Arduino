/*
 * [핵심 개념] DHT11 온습도 센서
 * ================================
 * DHT11은 디지털 방식으로 온도와 습도를 동시에 측정하는 센서입니다.
 *
 * 단선 디지털 통신:
 *   - 데이터 선 하나로 온도+습도 정보를 전송
 *   - 40비트 데이터: 습도 정수(8) + 습도 소수(8) + 온도 정수(8) + 온도 소수(8) + 체크섬(8)
 *   - 통신 시작 시 MCU가 풀다운 신호를 보내 센서를 깨움
 *
 * DHT11 정확도:
 *   - 온도: ±2°C, 측정 범위 0~50°C
 *   - 습도: ±5%, 측정 범위 20~90%RH
 *   - 샘플링 주기: 최소 1초 (너무 자주 읽으면 NaN 반환)
 *
 * isnan() 함수:
 *   읽기 실패 시 라이브러리는 NaN(Not a Number)을 반환
 *   isnan(값)으로 오류 여부를 확인
 *
 * [라이브러리]
 *   - DHT sensor library by Adafruit (Arduino Library Manager)
 *   - Adafruit Unified Sensor (자동 설치)
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - DHT11 센서 (3핀 또는 4핀 모듈)
 *   - 10kΩ 저항 (핀 모듈이 아닌 경우)
 *
 * [연결 방법]
 *   DHT11 모듈형 (3핀):
 *     VCC  → 3.3V
 *     DATA → G2
 *     GND  → GND
 *   (모듈형은 보드에 풀업 저항 내장)
 *
 *   DHT11 단품 (4핀, 왼쪽부터):
 *     1번 핀 (VCC)  → 3.3V
 *     2번 핀 (DATA) → G2
 *     3번 핀        → 연결 안 함 (NC)
 *     4번 핀 (GND)  → GND
 *     DATA(G2)와 VCC(3.3V) 사이에 10kΩ 저항 연결 권장
 */

#include <DHT.h>
#include "config.h"

// DHT 객체 생성: 핀 번호와 센서 타입 지정
DHT dht(DHT_PIN, DHT_TYPE);

// 읽기 타이머
unsigned long lastReadTime = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);
  Serial.println("==========================");
  Serial.println("DHT11 온습도 센서 예제");
  Serial.println("==========================");
  Serial.println("센서 타입: DHT11");
  Serial.println("데이터 핀: G" + String(DHT_PIN));
  Serial.println("읽기 주기: " + String(READ_INTERVAL / 1000) + "초");
  Serial.println("--------------------------");
  Serial.println("온도(°C) | 습도(%) | 체감온도(°C)");
  Serial.println("--------------------------");

  // DHT 라이브러리 초기화
  dht.begin();

  // 첫 읽기 전 안정화 대기 (DHT11 특성)
  delay(2000);
}

void loop() {
  unsigned long now = millis();

  // READ_INTERVAL마다 센서 읽기
  if (now - lastReadTime >= READ_INTERVAL) {
    lastReadTime = now;
    readAndPrintDHT();
  }
}

// -----------------------------------------------
// DHT11 읽기 및 출력
// -----------------------------------------------
void readAndPrintDHT() {
  // 습도 읽기 (%)
  float humidity = dht.readHumidity();

  // 온도 읽기 (섭씨)
  float temperature = dht.readTemperature();

  // 읽기 실패 확인
  // isnan(): NaN(Not a Number)이면 true 반환 → 오류 상황
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("[오류] DHT11 읽기 실패!");
    Serial.println("  확인: 연결 핀, 풀업 저항, 읽기 주기(최소 2초)");
    return;
  }

  // 체감온도 계산 (Heat Index)
  // 온도와 습도를 고려한 인체가 느끼는 온도
  float heatIndex = dht.computeHeatIndex(temperature, humidity, false);

  // 결과 출력
  Serial.print(temperature, 1);
  Serial.print("°C    | ");
  Serial.print(humidity, 1);
  Serial.print("%     | ");
  Serial.print(heatIndex, 1);
  Serial.println("°C");

  // 상태 판단 (보너스)
  printStatus(temperature, humidity);
}

// -----------------------------------------------
// 상태 메시지 출력 (선택)
// -----------------------------------------------
void printStatus(float temp, float hum) {
  // 온도 상태
  if (temp < 10) {
    Serial.println("  → 매우 추움");
  } else if (temp < 20) {
    Serial.println("  → 서늘함");
  } else if (temp < 28) {
    Serial.println("  → 쾌적함");
  } else if (temp < 35) {
    Serial.println("  → 더움");
  } else {
    Serial.println("  → 매우 더움!");
  }
}
