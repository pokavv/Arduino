/*
 * BLE 06 — BLE 클라이언트 스캔 (주변 BLE 장치 탐색)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   BLE 스캔이란?
 *     주변에서 광고(Advertisement)를 보내는 BLE 장치를 탐지하는 동작.
 *     Wi-Fi의 "AP 목록 검색"과 비슷한 개념.
 *
 *   클라이언트 역할
 *     이 예제에서 ESP32는 "클라이언트(Central)" 역할을 한다.
 *     클라이언트 = 연결을 먼저 시도하거나 스캔을 시작하는 쪽.
 *     서버 = 광고를 내보내며 연결을 기다리는 쪽.
 *
 *   RSSI (Received Signal Strength Indicator)
 *     수신 신호 세기. 단위: dBm (음수, 클수록 신호 약함).
 *     -50 dBm → 매우 가까움 (1m 이내)
 *     -70 dBm → 보통 (3~5m)
 *     -90 dBm → 멀거나 장애물 많음
 *     거리 추정에 활용 가능 (오차 있음)
 *
 *   MAC 주소
 *     BLE 장치마다 고유한 48비트 주소.
 *     XX:XX:XX:XX:XX:XX 형식으로 표시.
 *     일부 장치는 프라이버시 보호를 위해 주소를 랜덤하게 바꾼다.
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *   (주변에 BLE 장치가 있으면 더 재밌음 — 스마트폰 BLE 켜두기)
 *
 * [연결 방법]
 *   없음 — BLE는 보드 내장 안테나 사용
 *
 * [라이브러리]
 *   NimBLE-Arduino (Arduino IDE 라이브러리 매니저 설치)
 */

#include <NimBLEDevice.h>
#include "config.h"

// ─── 전역 변수 ──────────────────────────────────
uint32_t lastScanTime = 0;   // 마지막 스캔 시작 시각

// ─── 스캔 콜백 ──────────────────────────────────
// 장치를 발견할 때마다 onResult() 호출
class ScanCallbacks : public NimBLEScanCallbacks {
  void onResult(NimBLEAdvertisedDevice* device) override {
    Serial.print("  장치 발견 | MAC: ");
    Serial.print(device->getAddress().toString().c_str());

    Serial.print(" | RSSI: ");
    Serial.print(device->getRSSI());
    Serial.print(" dBm");

    // 장치 이름이 있으면 출력
    if (device->haveName()) {
      Serial.print(" | 이름: ");
      Serial.print(device->getName().c_str());
    } else {
      Serial.print(" | 이름: (없음)");
    }

    // 서비스 UUID가 있으면 출력
    if (device->haveServiceUUID()) {
      Serial.print(" | Service: ");
      Serial.print(device->getServiceUUID().toString().c_str());
    }

    Serial.println();
  }
};

// ─── 스캔 수행 함수 ─────────────────────────────
void startScan() {
  Serial.println("─────────────────────────────────────────");
  Serial.print("BLE 스캔 시작 (");
  Serial.print(SCAN_TIME_SEC);
  Serial.println("초)...");

  digitalWrite(BUILTIN_LED_PIN, LOW);   // 스캔 중 LED 켜기

  NimBLEScan* pScan = NimBLEDevice::getScan();
  pScan->setActiveScan(true);           // Active Scan: 장치에 추가 정보 요청
  pScan->setInterval(100);              // 스캔 간격 (ms 단위의 0.625ms 배수)
  pScan->setWindow(99);                 // 스캔 윈도우 (≤ interval)

  // 스캔 실행 (블로킹 방식 — SCAN_TIME_SEC 동안 대기)
  NimBLEScanResults results = pScan->start(SCAN_TIME_SEC, false);

  Serial.print("스캔 완료 — 발견된 장치 수: ");
  Serial.println(results.getCount());

  pScan->clearResults();   // 결과 메모리 해제

  digitalWrite(BUILTIN_LED_PIN, HIGH);  // 스캔 끝 — LED 끄기
}

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("BLE 클라이언트 스캔 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);   // 시작 시 꺼둠

  // ── BLE 초기화 ──
  NimBLEDevice::init("");   // 스캔만 하므로 장치 이름 불필요

  // 스캔 콜백 등록
  NimBLEScan* pScan = NimBLEDevice::getScan();
  pScan->setScanCallbacks(new ScanCallbacks());

  // 첫 스캔 즉시 실행
  startScan();
  lastScanTime = millis();
}

void loop() {
  // millis() 기반으로 주기적으로 재스캔 (delay 사용 안 함)
  if (millis() - lastScanTime >= SCAN_INTERVAL_MS) {
    lastScanTime = millis();
    startScan();
  }
}
