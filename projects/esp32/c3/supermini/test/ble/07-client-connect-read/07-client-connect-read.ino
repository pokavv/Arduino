/*
 * BLE 07 — BLE 클라이언트 — 서버 연결 후 특성 값 읽기
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   클라이언트 (Central) 역할
 *     BLE 연결을 먼저 시작하는 쪽.
 *     스마트폰 앱처럼 동작해 서버(Peripheral)에 연결한다.
 *     이 예제에서 ESP32가 클라이언트 역할을 한다.
 *
 *   연결 흐름
 *     1. 스캔 — 주변 BLE 장치 탐색
 *     2. 필터 — 원하는 이름/UUID 찾기
 *     3. 연결 — connect() 호출
 *     4. 서비스/특성 탐색 — getService() → getCharacteristic()
 *     5. 읽기 — readValue()
 *
 *   서버 준비
 *     BLE 02-server-read 예제를 다른 ESP32에 업로드하거나
 *     스마트폰 앱(nRF Connect)으로 서버를 에뮬레이션할 수 있다.
 *
 * [준비물]
 *   ESP32-C3 보드 2개 (하나는 서버, 하나는 클라이언트)
 *   또는 nRF Connect 앱으로 서버 역할 에뮬레이션
 *
 * [연결 방법]
 *   없음 — BLE는 보드 내장 안테나 사용
 *   서버 보드에 ble/02-server-read 예제 업로드 후 이 예제 실행
 *
 * [라이브러리]
 *   NimBLE-Arduino (Arduino IDE 라이브러리 매니저 설치)
 */

#include <NimBLEDevice.h>
#include "config.h"

// ─── 전역 변수 ──────────────────────────────────
NimBLEClient*  pClient       = nullptr;
bool           connected     = false;
bool           doConnect     = false;   // 연결 시도 플래그
NimBLEAddress  serverAddress("00:00:00:00:00:00");  // 발견된 서버 주소 저장
uint32_t       lastReadTime  = 0;

// ─── 스캔 콜백 ──────────────────────────────────
// 원하는 서버 발견 시 연결 정보 저장
class ScanCallbacks : public NimBLEScanCallbacks {
  void onResult(NimBLEAdvertisedDevice* device) override {
    Serial.print("장치 발견: ");
    Serial.println(device->getName().c_str());

    // 원하는 이름의 서버인지 확인
    if (device->haveName() && device->getName() == TARGET_NAME) {
      Serial.println("→ 연결 대상 발견! 스캔 중지");
      serverAddress = device->getAddress();
      doConnect     = true;   // loop()에서 연결 시도
      NimBLEDevice::getScan()->stop();
    }
  }
};

// ─── 연결 이벤트 콜백 ───────────────────────────
class ClientCallbacks : public NimBLEClientCallbacks {
  void onConnect(NimBLEClient* pC) override {
    connected = true;
    Serial.println("서버 연결 성공");
    digitalWrite(BUILTIN_LED_PIN, LOW);   // LED 켜기
  }

  void onDisconnect(NimBLEClient* pC) override {
    connected = false;
    doConnect = false;
    Serial.println("서버 연결 끊김 — 재스캔 필요");
    digitalWrite(BUILTIN_LED_PIN, HIGH);  // LED 끄기
  }
};

// ─── 서버 연결 및 특성 탐색 ─────────────────────
bool connectToServer() {
  Serial.print("연결 시도: ");
  Serial.println(serverAddress.toString().c_str());

  pClient = NimBLEDevice::createClient();
  pClient->setCallbacks(new ClientCallbacks());

  if (!pClient->connect(serverAddress)) {
    Serial.println("연결 실패");
    return false;
  }

  // 서비스 탐색
  NimBLERemoteService* pService = pClient->getService(SERVICE_UUID);
  if (pService == nullptr) {
    Serial.println("서비스를 찾을 수 없음");
    pClient->disconnect();
    return false;
  }

  // 특성 탐색
  NimBLERemoteCharacteristic* pChar = pService->getCharacteristic(CHAR_UUID);
  if (pChar == nullptr) {
    Serial.println("특성을 찾을 수 없음");
    pClient->disconnect();
    return false;
  }

  Serial.println("서비스 & 특성 탐색 완료");
  return true;
}

// ─── 서버에서 값 읽기 ───────────────────────────
void readCharacteristic() {
  NimBLERemoteService*        pService = pClient->getService(SERVICE_UUID);
  if (pService == nullptr) return;

  NimBLERemoteCharacteristic* pChar    = pService->getCharacteristic(CHAR_UUID);
  if (pChar == nullptr) return;

  // Read 속성이 있는지 확인 후 읽기
  if (pChar->canRead()) {
    std::string value = pChar->readValue();
    Serial.print("[Read] 수신값: ");
    Serial.println(value.c_str());
  } else {
    Serial.println("이 특성은 Read 속성이 없음");
  }
}

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("BLE 클라이언트 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);

  NimBLEDevice::init("");   // 클라이언트는 이름 불필요

  // 스캔 시작
  Serial.print("\"");
  Serial.print(TARGET_NAME);
  Serial.println("\" 서버 스캔 중...");

  NimBLEScan* pScan = NimBLEDevice::getScan();
  pScan->setScanCallbacks(new ScanCallbacks());
  pScan->setActiveScan(true);
  pScan->start(SCAN_TIME_SEC, false);   // 블로킹 스캔
}

void loop() {
  // 연결 대상 발견 → 연결 시도
  if (doConnect && !connected) {
    doConnect = false;
    if (connectToServer()) {
      Serial.println("준비 완료 — 3초마다 Read");
    } else {
      Serial.println("연결 실패 — 재스캔");
      delay(RECONNECT_DELAY_MS);
      NimBLEDevice::getScan()->start(SCAN_TIME_SEC, false);
    }
  }

  // 연결 중일 때 주기적으로 Read
  if (connected && (millis() - lastReadTime >= READ_INTERVAL_MS)) {
    lastReadTime = millis();
    readCharacteristic();
  }

  // 연결 끊기면 재스캔
  if (!connected && !doConnect) {
    Serial.println("재스캔...");
    delay(RECONNECT_DELAY_MS);
    NimBLEDevice::getScan()->start(SCAN_TIME_SEC, false);
  }

  delay(10);
}
