/*
 * BLE 05 — iBeacon 광고 패킷 송출
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   비콘 (Beacon)
 *     일방적으로 BLE 신호를 뿌리는 장치.
 *     연결(Connection)은 하지 않고, 광고(Advertisement)만 한다.
 *     주변 스마트폰이 이 신호를 수신해 위치 파악 등에 활용.
 *     예: 마트 입구에 비콘 → 앱이 "매장 도착" 감지
 *
 *   iBeacon
 *     Apple이 정의한 BLE 비콘 표준 형식.
 *     UUID / Major / Minor / TX Power 4가지 정보를 광고 패킷에 담는다.
 *
 *   UUID / Major / Minor
 *     UUID: 서비스(앱) 단위 식별자 — "우리 회사 비콘"
 *     Major: 위치 그룹 — "2층"
 *     Minor: 개별 비콘 — "전자제품 코너 3번"
 *     이 3단계 계층으로 정밀한 위치 식별 가능
 *
 *   TX Power (송신 출력)
 *     1m 거리에서 측정한 신호 세기 (dBm, 음수).
 *     수신 신호 세기(RSSI)와 비교해 거리를 추정하는 데 사용.
 *
 *   연결 없음!
 *     비콘은 광고만 한다 — 연결 요청을 받지 않는다.
 *     배터리 소모가 매우 적어 수년간 동작 가능.
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *   수신 확인 앱: nRF Connect, Beacon Scanner (Android/iOS)
 *
 * [연결 방법]
 *   없음 — BLE는 보드 내장 안테나 사용
 *
 * [테스트 방법]
 *   1. 업로드 후 시리얼 모니터(115200) 열기
 *   2. nRF Connect 앱 → Scanner 탭 → "ESP32C3-Beacon" 검색
 *   3. RAW 데이터에서 iBeacon 패킷 확인
 *   4. Beacon Scanner 앱 사용 시 UUID/Major/Minor 바로 표시됨
 *
 * [라이브러리]
 *   NimBLE-Arduino (Arduino IDE 라이브러리 매니저 설치)
 */

#include <NimBLEDevice.h>
#include <NimBLEBeacon.h>
#include "config.h"

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("iBeacon 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, LOW);    // 동작 중 LED 켜기 (Active LOW)

  // ── BLE 초기화 ──
  NimBLEDevice::init(DEVICE_NAME);

  // ── iBeacon 데이터 구성 ──
  NimBLEBeacon beacon;
  beacon.setManufacturerId(0x004C);           // 0x004C = Apple Inc. (iBeacon 표준)
  beacon.setProximityUUID(NimBLEUUID(BEACON_UUID));
  beacon.setMajor(MAJOR);
  beacon.setMinor(MINOR);
  beacon.setSignalPower(TX_POWER);            // 1m 거리 신호 세기

  // ── 광고 데이터 설정 ──
  NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();

  NimBLEAdvertisementData advertisementData;
  advertisementData.setFlags(0x04);           // BR/EDR Not Supported (BLE 전용)
  advertisementData.setManufacturerData(beacon.getData());

  pAdvertising->setAdvertisementData(advertisementData);

  // 연결 불가능 모드로 광고 (비콘은 연결 안 함)
  pAdvertising->setAdvertisementType(BLE_GAP_CONN_MODE_NON);

  pAdvertising->start();

  Serial.println("iBeacon 광고 시작");
  Serial.print("UUID  : ");
  Serial.println(BEACON_UUID);
  Serial.print("Major : ");
  Serial.println(MAJOR);
  Serial.print("Minor : ");
  Serial.println(MINOR);
  Serial.print("TX Power: ");
  Serial.print(TX_POWER);
  Serial.println(" dBm");
}

void loop() {
  // 비콘은 광고만 하면 됨 — loop에서 별도 처리 없음
  // 저전력을 위해 딥슬립 적용 가능 (별도 예제 참고)
  delay(1000);
}
