/*
 * [핵심 개념] DS18B20 다중 센서 (1-Wire 버스)
 * =============================================
 * 1-Wire의 가장 큰 장점은 하나의 핀에 여러 센서를 병렬 연결 가능하다는 것입니다.
 * 각 DS18B20은 고유한 64비트 주소(롬 코드)를 가지고 있어
 * 여러 센서를 같은 선에 연결해도 개별로 식별할 수 있습니다.
 *
 * 64비트 롬 코드 구조:
 *   [8비트 패밀리 코드] [48비트 시리얼 번호] [8비트 CRC]
 *   DS18B20의 패밀리 코드: 0x28
 *
 * 다중 센서 사용 방법:
 *   1. sensors.getDeviceCount()로 연결된 센서 수 확인
 *   2. sensors.getAddress(addr, index)로 각 센서 주소 읽기
 *   3. sensors.requestTemperatures()로 모든 센서에 변환 요청
 *   4. sensors.getTempC(addr)로 특정 주소 센서 온도 읽기
 *
 * 연결 방법:
 *   모든 센서의 DATA 핀을 같은 핀(G2)에 연결
 *   4.7kΩ 풀업 저항은 하나만 있으면 됨
 *
 * [라이브러리]
 *   - OneWire
 *   - DallasTemperature
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - DS18B20 온도 센서 여러 개
 *   - 4.7kΩ 저항 1개
 *
 * [연결 방법]
 *   센서 1: GND→GND, DATA→G2, VCC→3.3V
 *   센서 2: GND→GND, DATA→G2, VCC→3.3V  (DATA 선 공유)
 *   센서 N: GND→GND, DATA→G2, VCC→3.3V  (DATA 선 공유)
 *   4.7kΩ 저항: G2와 3.3V 사이 (단 하나만 연결)
 *
 *   모든 센서의 DATA 핀을 하나의 선으로 묶어 G2에 연결합니다.
 */

#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"

// 1-Wire 버스 객체
OneWire oneWire(ONE_WIRE_PIN);

// DallasTemperature 객체
DallasTemperature sensors(&oneWire);

// 발견된 센서 수
int deviceCount = 0;

// 센서 주소 배열 (최대 MAX_SENSORS개)
DeviceAddress sensorAddresses[MAX_SENSORS];

// 온도 읽기 타이머
unsigned long lastTempTime = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);
  Serial.println("================================");
  Serial.println("DS18B20 다중 온도 센서 예제");
  Serial.println("================================");
  Serial.println("1-Wire 핀: G" + String(ONE_WIRE_PIN));

  // 센서 라이브러리 초기화
  sensors.begin();

  // 연결된 센서 수 확인
  deviceCount = sensors.getDeviceCount();
  Serial.print("발견된 센서 수: ");
  Serial.println(deviceCount);

  if (deviceCount == 0) {
    Serial.println("[경고] 센서를 찾을 수 없습니다!");
    Serial.println("배선을 확인하고 4.7kΩ 풀업 저항을 연결하세요.");
    return;
  }

  // MAX_SENSORS 초과 방지
  if (deviceCount > MAX_SENSORS) {
    Serial.print("[경고] 최대 ");
    Serial.print(MAX_SENSORS);
    Serial.println("개 센서만 처리합니다.");
    deviceCount = MAX_SENSORS;
  }

  // 각 센서 주소 읽어 저장
  Serial.println("\n--- 센서 목록 ---");
  for (int i = 0; i < deviceCount; i++) {
    if (sensors.getAddress(sensorAddresses[i], i)) {
      Serial.print("센서 [");
      Serial.print(i);
      Serial.print("] 주소: ");
      printAddress(sensorAddresses[i]);
      Serial.println();
    } else {
      Serial.print("[오류] 센서 ");
      Serial.print(i);
      Serial.println(" 주소 읽기 실패");
    }
  }

  Serial.println("\n온도 읽기 시작...");
  Serial.println("---");
}

void loop() {
  if (deviceCount == 0) {
    delay(5000);
    return;
  }

  unsigned long now = millis();

  if (now - lastTempTime >= TEMP_INTERVAL) {
    lastTempTime = now;
    readAllTemperatures();
  }
}

// -----------------------------------------------
// 모든 센서 온도 읽기
// -----------------------------------------------
void readAllTemperatures() {
  // 모든 센서에 동시에 온도 변환 요청
  // 이 명령 하나로 버스에 연결된 모든 센서가 동시에 측정 시작
  sensors.requestTemperatures();

  Serial.print("[");
  Serial.print(millis() / 1000);
  Serial.println("s]");

  for (int i = 0; i < deviceCount; i++) {
    Serial.print("  센서 [");
    Serial.print(i);
    Serial.print("] (");
    printAddressShort(sensorAddresses[i]);  // 주소 앞 2바이트만 축약 출력
    Serial.print("): ");

    // 주소로 특정 센서의 온도 읽기
    float tempC = sensors.getTempC(sensorAddresses[i]);

    if (tempC == DEVICE_DISCONNECTED_C) {
      Serial.println("오류 (연결 끊김)");
    } else {
      Serial.print(tempC, 1);
      Serial.println("°C");
    }
  }
  Serial.println();
}

// -----------------------------------------------
// 센서 주소 전체 출력 (8바이트 HEX)
// -----------------------------------------------
void printAddress(DeviceAddress deviceAddress) {
  for (uint8_t i = 0; i < 8; i++) {
    if (deviceAddress[i] < 16) Serial.print("0");
    Serial.print(deviceAddress[i], HEX);
    if (i < 7) Serial.print(":");
  }
}

// -----------------------------------------------
// 센서 주소 축약 출력 (앞 2바이트만)
// -----------------------------------------------
void printAddressShort(DeviceAddress deviceAddress) {
  // 처음 1바이트(패밀리 코드)를 건너뛰고 다음 2바이트 출력
  for (uint8_t i = 1; i <= 2; i++) {
    if (deviceAddress[i] < 16) Serial.print("0");
    Serial.print(deviceAddress[i], HEX);
  }
  Serial.print("..");
}
