/*
 * BLE 02 — BLE 서버 Read (클라이언트가 읽으면 millis 반환)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   Read (읽기) 속성
 *     클라이언트가 원할 때 서버에게 "현재 값이 뭐야?" 하고 요청하는 방식.
 *     서버는 요청이 올 때마다 최신 값을 응답한다.
 *     Notify와 달리 클라이언트가 먼저 요청해야 값을 받을 수 있다.
 *
 *   onRead 콜백
 *     클라이언트가 Read 요청을 보낼 때 자동으로 호출되는 함수.
 *     이 콜백 안에서 특성 값을 갱신하면, 갱신된 값이 전달된다.
 *
 *   millis()
 *     보드가 켜진 이후 경과한 시간 (밀리초).
 *     약 49일 후 0으로 돌아온다 (uint32_t 최대값 초과).
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *   테스트 앱: nRF Connect (iOS/Android) 또는 LightBlue
 *
 * [연결 방법]
 *   없음 — BLE는 보드 내장 안테나 사용
 *
 * [테스트 방법]
 *   1. 업로드 후 nRF Connect로 "ESP32C3-Server" 연결
 *   2. Characteristic 선택 후 Read(↓ 화살표) 버튼 클릭
 *   3. 클릭할 때마다 현재 millis 값이 바뀌어 표시됨
 *
 * [라이브러리]
 *   NimBLE-Arduino (Arduino IDE 라이브러리 매니저 설치)
 */

#include <NimBLEDevice.h>
#include "config.h"

// ─── 연결 이벤트 콜백 ───────────────────────────
class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* pSvr) override {
    Serial.println("클라이언트 연결됨");
    digitalWrite(BUILTIN_LED_PIN, LOW);    // LOW = 켜짐 (Active LOW)
  }

  void onDisconnect(NimBLEServer* pSvr) override {
    Serial.println("클라이언트 연결 끊김 — 광고 재시작");
    digitalWrite(BUILTIN_LED_PIN, HIGH);   // HIGH = 꺼짐
    NimBLEDevice::startAdvertising();
  }
};

// ─── Read 콜백 ──────────────────────────────────
// 클라이언트가 특성 값을 Read 요청할 때 호출
class CharCallbacks : public NimBLECharacteristicCallbacks {
  void onRead(NimBLECharacteristic* pChar) override {
    // millis() 값을 문자열로 변환해 특성 값 갱신
    uint32_t uptime = millis();
    String msg = "uptime=" + String(uptime) + "ms";
    pChar->setValue(msg.c_str());

    Serial.print("Read 요청 수신 — 응답: ");
    Serial.println(msg);
  }
};

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("BLE 서버 Read 시작");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);   // 시작 시 꺼둠

  // ── BLE 초기화 ──
  NimBLEDevice::init(DEVICE_NAME);

  NimBLEServer* pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  NimBLEService* pService = pServer->createService(SERVICE_UUID);

  // READ 속성: 클라이언트가 요청할 때 값을 돌려줌
  NimBLECharacteristic* pCharacteristic = pService->createCharacteristic(
    CHAR_UUID,
    NIMBLE_PROPERTY::READ   // Read 전용
  );
  pCharacteristic->setCallbacks(new CharCallbacks());   // onRead 콜백 등록

  // 초기값 설정 (처음 연결해서 읽기 전에 보여줄 값)
  pCharacteristic->setValue("아직 읽지 않음 — Read 버튼을 누르세요");

  pService->start();

  NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();

  Serial.println("BLE 광고 시작 — 스마트폰에서 연결 후 Read 해보세요");
}

void loop() {
  // Read는 콜백 기반 — loop에서 특별히 처리할 내용 없음
  delay(10);
}
