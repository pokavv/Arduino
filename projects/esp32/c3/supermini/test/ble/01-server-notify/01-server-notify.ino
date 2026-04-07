/*
 * BLE 01 — BLE 서버 Notify (카운터 값 전송)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   BLE (Bluetooth Low Energy)
 *     일반 블루투스보다 전력 소비가 훨씬 적은 무선 통신 방식.
 *     스마트워치, 심박계, 온도 센서 등에 많이 사용된다.
 *
 *   GATT (Generic Attribute Profile)
 *     BLE 통신 규약. 데이터를 어떻게 주고받을지 정의한 구조.
 *     계층 구조: Device → Service → Characteristic
 *
 *   Service (서비스)
 *     관련 기능을 묶은 그룹. 예: "심박 서비스", "배터리 서비스"
 *     각 Service는 UUID(고유 번호)로 구분된다.
 *
 *   Characteristic (특성)
 *     실제 데이터를 담는 단위. 하나의 Service 안에 여러 개 가능.
 *     속성(Property): Read, Write, Notify 중 하나 이상 설정 가능.
 *
 *   Notify (알림)
 *     서버가 클라이언트에게 "먼저" 데이터를 보내는 방식.
 *     클라이언트가 요청하지 않아도 서버가 자동으로 전송.
 *     예: 심박 모니터가 주기적으로 수치를 앱에 보내는 방식.
 *
 *   서버 / 클라이언트
 *     서버 = 데이터를 제공하는 쪽 (이 ESP32)
 *     클라이언트 = 데이터를 받는 쪽 (스마트폰 앱 등)
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *   테스트 앱: nRF Connect (iOS/Android) 또는 LightBlue
 *
 * [연결 방법]
 *   없음 — Wi-Fi/BLE는 보드 내장 안테나 사용
 *
 * [테스트 방법]
 *   1. 업로드 후 시리얼 모니터(115200) 열기
 *   2. 스마트폰에서 nRF Connect 앱 실행
 *   3. "ESP32C3-Server" 장치 찾아서 Connect
 *   4. Service UUID 4fafc201... 안의 Characteristic 확인
 *   5. Notify(벨 모양 아이콘) 켜면 1초마다 숫자 증가 수신
 *
 * [라이브러리]
 *   NimBLE-Arduino — Arduino IDE 라이브러리 매니저에서 설치
 *   (검색: "NimBLE-Arduino", 작성자: h2zero)
 *   ESP32 내장 BLE보다 메모리 효율이 좋고 안정적
 */

#include <NimBLEDevice.h>
#include "config.h"

// ─── 전역 변수 ──────────────────────────────────
NimBLEServer*         pServer         = nullptr;
NimBLECharacteristic* pCharacteristic = nullptr;

bool     deviceConnected = false;   // 현재 클라이언트 연결 여부
uint32_t counter         = 0;       // Notify로 보낼 카운터 값
uint32_t lastNotifyTime  = 0;       // 마지막 Notify 시각 (millis)

// ─── 연결 이벤트 콜백 ───────────────────────────
// BLE 연결/끊김 이벤트를 받는 콜백 클래스
class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* pSvr) override {
    deviceConnected = true;
    Serial.println("클라이언트 연결됨");
  }

  void onDisconnect(NimBLEServer* pSvr) override {
    deviceConnected = false;
    Serial.println("클라이언트 연결 끊김 — 광고 재시작");
    // 연결 끊기면 다시 광고를 시작해 새 연결을 받을 수 있게 함
    NimBLEDevice::startAdvertising();
  }
};

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("BLE 서버 Notify 시작");

  // 내장 LED 초기화 (Active LOW — 시작 시 꺼둠)
  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);   // HIGH = 꺼짐

  // ── BLE 초기화 ──
  NimBLEDevice::init(DEVICE_NAME);   // 장치 이름 설정

  // ── 서버 생성 ──
  pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());   // 연결 이벤트 콜백 등록

  // ── 서비스 생성 ──
  NimBLEService* pService = pServer->createService(SERVICE_UUID);

  // ── 특성(Characteristic) 생성 ──
  // NOTIFY 속성: 서버가 클라이언트에게 일방적으로 데이터 전송
  pCharacteristic = pService->createCharacteristic(
    CHAR_UUID,
    NIMBLE_PROPERTY::NOTIFY   // Notify 전용
  );

  // ── 서비스 시작 ──
  pService->start();

  // ── 광고(Advertising) 시작 ──
  // 주변에 "나 여기 있어요!"라고 BLE 신호를 보내는 과정
  NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);   // 이 서비스를 광고에 포함
  pAdvertising->start();

  Serial.println("BLE 광고 시작 — 스마트폰에서 연결하세요");
  Serial.print("장치 이름: ");
  Serial.println(DEVICE_NAME);
}

void loop() {
  uint32_t now = millis();

  // 연결된 클라이언트가 있고, 주기가 됐을 때만 Notify 전송
  if (deviceConnected && (now - lastNotifyTime >= NOTIFY_INTERVAL_MS)) {
    lastNotifyTime = now;

    counter++;   // 카운터 증가

    // 카운터 값을 문자열로 변환해 특성에 설정
    String msg = "Counter: " + String(counter);
    pCharacteristic->setValue(msg.c_str());
    pCharacteristic->notify();   // 연결된 모든 클라이언트에게 전송

    Serial.print("Notify 전송: ");
    Serial.println(msg);

    // 내장 LED 토글 (Notify 전송 시각 시각적 확인)
    digitalWrite(BUILTIN_LED_PIN, counter % 2 == 0 ? HIGH : LOW);
    // LOW = 켜짐, HIGH = 꺼짐 (Active LOW)
  }
}
