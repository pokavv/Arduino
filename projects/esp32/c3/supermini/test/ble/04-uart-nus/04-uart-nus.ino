/*
 * BLE 04 — BLE UART (NUS, Nordic UART Service) 에뮬레이션
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   BLE UART란?
 *     BLE에는 원래 "시리얼 통신"이 없다.
 *     그래서 Nordic Semiconductor이 "NUS"라는 서비스를 만들어
 *     마치 UART(시리얼)처럼 양방향 통신하는 방법을 표준화했다.
 *     많은 BLE 앱이 이 NUS 방식을 지원한다.
 *
 *   NUS 구조
 *     RX Characteristic (6E400002): 앱 → ESP32 방향 (앱이 Write)
 *     TX Characteristic (6E400003): ESP32 → 앱 방향 (ESP32가 Notify)
 *     이름이 헷갈릴 수 있음! "RX"는 ESP32 기준으로 받는 쪽.
 *
 *   에코 (Echo)
 *     받은 데이터를 그대로 돌려보내는 동작.
 *     이 예제는 앱에서 보낸 문자열을 그대로 에코 + 시리얼 출력.
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *   테스트 앱: "Serial Bluetooth Terminal" 또는 "nRF Connect" (Android/iOS)
 *
 * [연결 방법]
 *   없음 — BLE는 보드 내장 안테나 사용
 *
 * [테스트 방법]
 *   1. 업로드 후 시리얼 모니터(115200) 열기
 *   2. "Serial Bluetooth Terminal" 앱 → BLE 탭 → "ESP32C3-UART" 연결
 *   3. 메시지 입력 후 전송 → 시리얼 모니터에서 수신 확인
 *   4. ESP32가 에코 응답 → 앱에서 수신 확인
 *   nRF Connect에서는 NUS Service의 RX에 Write, TX에 Notify 등록
 *
 * [라이브러리]
 *   NimBLE-Arduino (Arduino IDE 라이브러리 매니저 설치)
 */

#include <NimBLEDevice.h>
#include "config.h"

// ─── 전역 변수 ──────────────────────────────────
NimBLECharacteristic* pTxCharacteristic = nullptr;  // TX: ESP32 → 앱
bool deviceConnected = false;

// ─── 연결 이벤트 콜백 ───────────────────────────
class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* pSvr) override {
    deviceConnected = true;
    Serial.println("클라이언트 연결됨");
    digitalWrite(BUILTIN_LED_PIN, LOW);    // LED 켜기
  }

  void onDisconnect(NimBLEServer* pSvr) override {
    deviceConnected = false;
    Serial.println("클라이언트 연결 끊김 — 광고 재시작");
    digitalWrite(BUILTIN_LED_PIN, HIGH);   // LED 끄기
    NimBLEDevice::startAdvertising();
  }
};

// ─── RX 콜백 (앱 → ESP32) ───────────────────────
// 앱에서 RX Characteristic에 Write하면 호출됨
class RxCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar) override {
    std::string rxValue = pChar->getValue();
    if (rxValue.length() > 0) {
      String received = String(rxValue.c_str());
      received.trim();

      Serial.print("[BLE 수신] ");
      Serial.println(received);

      // 에코: 받은 내용을 "Echo: ..." 형태로 앱에 돌려보냄
      if (pTxCharacteristic != nullptr && deviceConnected) {
        String echo = "Echo: " + received;
        pTxCharacteristic->setValue(echo.c_str());
        pTxCharacteristic->notify();   // 앱으로 Notify 전송
        Serial.print("[BLE 송신] ");
        Serial.println(echo);
      }
    }
  }
};

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("BLE UART (NUS) 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);   // 시작 시 꺼둠

  // ── BLE 초기화 ──
  NimBLEDevice::init(DEVICE_NAME);

  NimBLEServer* pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  // NUS 서비스 생성
  NimBLEService* pService = pServer->createService(NUS_SERVICE_UUID);

  // TX Characteristic: ESP32 → 앱 (Notify)
  pTxCharacteristic = pService->createCharacteristic(
    NUS_TX_CHAR_UUID,
    NIMBLE_PROPERTY::NOTIFY
  );

  // RX Characteristic: 앱 → ESP32 (Write)
  NimBLECharacteristic* pRxCharacteristic = pService->createCharacteristic(
    NUS_RX_CHAR_UUID,
    NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
  );
  pRxCharacteristic->setCallbacks(new RxCallbacks());

  pService->start();

  // 광고 시작
  NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(NUS_SERVICE_UUID);
  pAdvertising->start();

  Serial.println("BLE 광고 시작 — \"Serial Bluetooth Terminal\" 앱으로 연결하세요");
  Serial.print("장치 이름: ");
  Serial.println(DEVICE_NAME);
}

void loop() {
  // 시리얼로 입력된 텍스트를 BLE로 전송 (시리얼 → BLE 방향)
  if (Serial.available() && deviceConnected && pTxCharacteristic != nullptr) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() > 0) {
      pTxCharacteristic->setValue(input.c_str());
      pTxCharacteristic->notify();
      Serial.print("[BLE 송신] ");
      Serial.println(input);
    }
  }

  delay(10);
}
