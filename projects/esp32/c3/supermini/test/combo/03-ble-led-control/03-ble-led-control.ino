/*
 * combo/03-ble-led-control — BLE Write로 LED 제어
 * ================================================================
 *
 * [핵심 개념 설명]
 *   BLE (Bluetooth Low Energy)
 *     - 저전력 블루투스 — 스마트폰 앱과 ESP32 통신에 사용
 *     - Classic Bluetooth(음악, 파일)와 다름 — 작은 데이터 패킷 전송에 최적화
 *
 *   GATT 프로파일 구조
 *     Service (서비스) → 관련 기능의 묶음
 *       Characteristic (특성) → 실제 데이터 읽기/쓰기 단위
 *         - READ: 앱이 값을 읽어감
 *         - WRITE: 앱이 값을 씀
 *         - NOTIFY: 값 변경 시 앱에 자동 알림
 *
 *   이 예제
 *     - BLE WRITE 특성에 "ON" 쓰면 LED 켜기
 *     - BLE WRITE 특성에 "OFF" 쓰면 LED 끄기
 *
 *   테스트 앱 (스마트폰)
 *     - Android: nRF Connect, BLE Scanner
 *     - iOS: LightBlue, nRF Connect
 *
 * [라이브러리]
 *   NimBLE-Arduino (h2zero) — 라이브러리 매니저에서 설치
 *   (또는 ESP32 내장 BLE 라이브러리 사용 가능)
 *
 * [준비물]
 *   없음 — 보드 내장 LED(G8) 사용. BLE 테스트용 스마트폰 필요.
 *
 * [연결 방법]
 *   없음 — 스마트폰 BLE 앱에서 "ESP32-LED" 장치에 연결
 *   서비스 UUID와 특성 UUID로 Write
 */

#include "config.h"
#include <NimBLEDevice.h>

bool ledState = false;  // 현재 LED 상태

// ---- BLE 특성 콜백 클래스 ----
// 스마트폰 앱에서 데이터를 쓸 때 호출됨
class LedControlCallback : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pCharacteristic) override {
    // 수신된 값을 std::string으로 가져옴
    std::string value = pCharacteristic->getValue();

    Serial.print("[BLE] 수신: ");
    Serial.println(value.c_str());

    if (value == "ON" || value == "on") {
      ledState = true;
      digitalWrite(LED_PIN, LOW);   // Active LOW — LOW면 켜짐
      Serial.println("LED 켜짐");
    } else if (value == "OFF" || value == "off") {
      ledState = false;
      digitalWrite(LED_PIN, HIGH);  // HIGH면 꺼짐
      Serial.println("LED 꺼짐");
    } else {
      Serial.println("[무시] 알 수 없는 명령 (ON 또는 OFF만 지원)");
    }
  }
};

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" BLE LED 제어 예제");
  Serial.println("===================================");

  // ---- LED 핀 설정 ----
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);  // 초기 상태: 꺼짐 (Active LOW)

  // ---- BLE 초기화 ----
  NimBLEDevice::init(DEVICE_NAME);  // 장치 이름 설정

  // ---- BLE 서버 생성 ----
  NimBLEServer* pServer = NimBLEDevice::createServer();

  // ---- 서비스 생성 ----
  NimBLEService* pService = pServer->createService(SERVICE_UUID);

  // ---- Write 특성 생성 ----
  NimBLECharacteristic* pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    NIMBLE_PROPERTY::WRITE |      // 앱에서 쓰기 가능
    NIMBLE_PROPERTY::WRITE_NR     // 응답 없는 쓰기도 허용
  );
  pCharacteristic->setCallbacks(new LedControlCallback());  // 콜백 등록

  // ---- 서비스 시작 ----
  pService->start();

  // ---- 광고(Advertising) 시작 ----
  // 광고: 주변 장치에 "나 여기 있어요!" 브로드캐스트
  NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();

  Serial.print("BLE 장치 이름: ");
  Serial.println(DEVICE_NAME);
  Serial.println("스마트폰 BLE 앱에서 연결 후");
  Serial.println("특성에 'ON' 또는 'OFF' 쓰면 LED 제어");
  Serial.print("서비스 UUID: ");  Serial.println(SERVICE_UUID);
  Serial.print("특성 UUID  : ");  Serial.println(CHARACTERISTIC_UUID);
}

void loop() {
  delay(1000);  // BLE 처리는 내부 태스크가 담당, loop()는 비어도 됨
}
