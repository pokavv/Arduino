/*
 * [핵심 개념] 1-Wire 프로토콜과 DS18B20 온도 센서
 * ==================================================
 * 1-Wire는 단 하나의 데이터 선으로 통신하는 프로토콜입니다.
 * Dallas Semiconductor(현재 Maxim)가 개발했습니다.
 *
 * 1-Wire 특징:
 *   - 선 1개 (DATA) + GND로만 통신 가능
 *   - 하나의 선에 여러 센서를 병렬 연결 가능 (각 고유 64비트 주소)
 *   - 통신 속도는 느리지만 배선이 매우 간단
 *   - 풀업 저항 4.7kΩ이 반드시 필요 (DATA와 VCC 사이)
 *
 * DS18B20 특징:
 *   - 측정 범위: -55°C ~ +125°C
 *   - 정확도: ±0.5°C (−10°C~+85°C 범위)
 *   - 해상도: 9~12비트 선택 가능 (기본 12비트)
 *   - 변환 시간: 12비트 기준 최대 750ms
 *   - 파라시틱 파워 모드: GND+VCC 연결 없이 DATA 선만으로 전원 공급 가능
 *
 * 풀업 저항 4.7kΩ 필요 이유:
 *   1-Wire 버스는 평상시 HIGH 상태를 유지해야 합니다.
 *   풀업 저항이 없으면 통신 오류가 발생합니다.
 *
 * [라이브러리]
 *   - OneWire (Arduino Library Manager에서 설치)
 *   - DallasTemperature (Arduino Library Manager에서 설치)
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - DS18B20 방수 또는 일반형 온도 센서
 *   - 4.7kΩ 저항 1개
 *
 * [연결 방법]
 *   DS18B20 핀 배치 (평평한 면이 앞):
 *   ┌─────────────┐
 *   │  DS18B20    │  (평평한 면)
 *   └──┬────┬──┬──┘
 *      │    │  │
 *     GND  DATA VCC
 *      │    │   │
 *     GND  G2  3.3V
 *
 *   DATA(G2)와 VCC(3.3V) 사이에 4.7kΩ 저항 연결!
 *
 *   예시:
 *     DS18B20 왼쪽 핀  → GND
 *     DS18B20 가운데 핀 → G2 (DATA)
 *     DS18B20 오른쪽 핀 → 3.3V
 *     4.7kΩ 저항       → G2와 3.3V 사이
 */

#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"

// 1-Wire 버스 객체 생성
OneWire oneWire(ONE_WIRE_PIN);

// DallasTemperature 객체: 1-Wire 버스를 사용
DallasTemperature sensors(&oneWire);

// 온도 읽기 타이머
unsigned long lastTempTime = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);
  Serial.println("==============================");
  Serial.println("DS18B20 단일 온도 센서 예제");
  Serial.println("==============================");
  Serial.println("1-Wire 핀: G" + String(ONE_WIRE_PIN));
  Serial.println("읽기 주기: " + String(TEMP_INTERVAL) + "ms");

  // 센서 라이브러리 초기화
  sensors.begin();

  // 연결된 센서 수 확인
  int deviceCount = sensors.getDeviceCount();
  Serial.print("발견된 센서 수: ");
  Serial.println(deviceCount);

  if (deviceCount == 0) {
    Serial.println("[경고] 센서를 찾을 수 없습니다!");
    Serial.println("확인 사항:");
    Serial.println("  1. 센서 연결 핀이 맞는지 확인");
    Serial.println("  2. 4.7kΩ 풀업 저항이 연결되어 있는지 확인");
    Serial.println("  3. 전원(3.3V/GND) 연결 확인");
  } else {
    Serial.println("[성공] 센서 감지 완료!");

    // 센서의 고유 주소(64비트) 출력
    DeviceAddress addr;
    if (sensors.getAddress(addr, 0)) {
      Serial.print("센서 주소: ");
      printAddress(addr);
      Serial.println();
    }
  }

  Serial.println("---");
}

void loop() {
  unsigned long now = millis();

  // TEMP_INTERVAL마다 온도 읽기
  if (now - lastTempTime >= TEMP_INTERVAL) {
    lastTempTime = now;
    readAndPrintTemp();
  }
}

// -----------------------------------------------
// 온도 읽고 출력
// -----------------------------------------------
void readAndPrintTemp() {
  // 모든 센서에 온도 변환 요청
  // 이 명령 후 변환 완료까지 최대 750ms 필요
  sensors.requestTemperatures();

  // 첫 번째 센서(인덱스 0)의 온도 읽기 (섭씨)
  float tempC = sensors.getTempCByIndex(0);

  // 화씨 변환 (선택)
  float tempF = sensors.getTempFByIndex(0);

  // 오류 체크: -127°C는 센서 오류를 나타냄
  if (tempC == DEVICE_DISCONNECTED_C) {
    Serial.println("[오류] 센서가 연결되어 있지 않습니다!");
    return;
  }

  // 정상 출력
  Serial.print("온도: ");
  Serial.print(tempC, 1);   // 소수점 1자리
  Serial.print("°C  |  ");
  Serial.print(tempF, 1);
  Serial.println("°F");
}

// -----------------------------------------------
// 센서 주소(8바이트) 출력 함수
// -----------------------------------------------
void printAddress(DeviceAddress deviceAddress) {
  for (uint8_t i = 0; i < 8; i++) {
    if (deviceAddress[i] < 16) Serial.print("0");  // 앞에 0 붙이기
    Serial.print(deviceAddress[i], HEX);            // 16진수로 출력
    if (i < 7) Serial.print(":");
  }
}
