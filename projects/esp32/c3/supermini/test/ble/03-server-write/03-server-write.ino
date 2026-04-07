/*
 * BLE 03 — BLE 서버 Write (LED ON/OFF 명령 수신)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   Write (쓰기) 속성
 *     클라이언트가 서버에게 데이터를 보내는 방식.
 *     "명령을 내리는" 용도로 자주 사용된다.
 *     예: 앱에서 "LED ON"이라고 쓰면 ESP32의 LED가 켜진다.
 *
 *   onWrite 콜백
 *     클라이언트가 Write 요청을 보낼 때 자동으로 호출되는 함수.
 *     수신된 값을 getValue()로 꺼내서 처리한다.
 *
 *   Active LOW
 *     ESP32-C3 내장 LED(G8)는 Active LOW 방식.
 *     LOW 신호를 보내야 켜지고, HIGH 신호를 보내면 꺼진다.
 *     일반 LED와 반대이므로 주의!
 *
 * [준비물]
 *   없음 — 보드 내장 LED(G8) 사용
 *   테스트 앱: nRF Connect (iOS/Android) 또는 LightBlue
 *
 * [연결 방법]
 *   없음 — BLE는 보드 내장 안테나 사용
 *
 * [테스트 방법]
 *   1. 업로드 후 nRF Connect 앱으로 연결
 *   2. Characteristic 선택 → Write(↑ 화살표) 클릭
 *   3. "LED ON" 또는 "LED OFF" 문자열 입력 후 전송
 *   4. 보드 내장 LED 상태 변화 확인
 *
 * [라이브러리]
 *   NimBLE-Arduino (Arduino IDE 라이브러리 매니저 설치)
 */

#include <NimBLEDevice.h>
#include "config.h"

// ─── 전역 변수 ──────────────────────────────────
volatile bool ledState = false;   // 현재 LED 상태 (true = 켜짐)

// ─── 연결 이벤트 콜백 ───────────────────────────
class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* pSvr) override {
    Serial.println("클라이언트 연결됨");
  }

  void onDisconnect(NimBLEServer* pSvr) override {
    Serial.println("클라이언트 연결 끊김 — 광고 재시작");
    NimBLEDevice::startAdvertising();
  }
};

// ─── Write 콜백 ─────────────────────────────────
// 클라이언트가 데이터를 Write 할 때 호출
class CharCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar) override {
    // 수신된 값을 문자열로 변환
    std::string value = pChar->getValue();
    String cmd = String(value.c_str());
    cmd.trim();   // 앞뒤 공백·개행 제거

    Serial.print("Write 수신: \"");
    Serial.print(cmd);
    Serial.println("\"");

    if (cmd == CMD_LED_ON) {
      digitalWrite(BUILTIN_LED_PIN, LOW);   // LOW = 켜짐 (Active LOW)
      ledState = true;
      Serial.println("→ LED 켜짐");
    } else if (cmd == CMD_LED_OFF) {
      digitalWrite(BUILTIN_LED_PIN, HIGH);  // HIGH = 꺼짐
      ledState = false;
      Serial.println("→ LED 꺼짐");
    } else {
      Serial.println("→ 알 수 없는 명령 (\"LED ON\" 또는 \"LED OFF\" 전송)");
    }
  }
};

void setup() {
  Serial.begin(BAUD_RATE);
  Serial.println("BLE 서버 Write 시작");
  Serial.println("명령어: \"LED ON\" / \"LED OFF\"");

  // 내장 LED 초기화
  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, HIGH);   // 시작 시 꺼둠 (Active LOW)

  // ── BLE 초기화 ──
  NimBLEDevice::init(DEVICE_NAME);

  NimBLEServer* pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  NimBLEService* pService = pServer->createService(SERVICE_UUID);

  // WRITE 속성: 클라이언트가 값을 보낼 수 있음
  NimBLECharacteristic* pCharacteristic = pService->createCharacteristic(
    CHAR_UUID,
    NIMBLE_PROPERTY::WRITE          // 응답 있는 Write
    | NIMBLE_PROPERTY::WRITE_NR     // 응답 없는 Write (빠르지만 확인 안 됨)
  );
  pCharacteristic->setCallbacks(new CharCallbacks());

  pService->start();

  NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();

  Serial.println("BLE 광고 시작 — 연결 후 \"LED ON\" / \"LED OFF\" 전송해보세요");
}

void loop() {
  // Write는 콜백 기반 — loop에서 특별히 처리할 내용 없음
  delay(10);
}
