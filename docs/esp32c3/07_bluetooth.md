# Bluetooth (BLE)

## BLE가 뭔가요?

BLE(Bluetooth Low Energy) — 저전력 블루투스입니다.
스마트폰이나 태블릿과 무선으로 데이터를 주고받을 수 있습니다.

ESP32-C3는 **BLE 5.0** 을 지원합니다.
> ⚠️ 클래식 블루투스(오디오, HC-06 모듈 등)는 지원하지 않습니다. BLE 전용입니다.

### Wi-Fi vs BLE 비교

| 항목 | Wi-Fi | BLE |
|------|-------|-----|
| 통신 거리 | 50~100m | 10~30m |
| 소비 전력 | 높음 | 매우 낮음 |
| 인터넷 연결 | 가능 | 불가 |
| 스마트폰 연결 | 브라우저로 접속 | 앱/OS 블루투스로 연결 |
| 주 용도 | 인터넷, 원격 제어 | 근거리 센서, 웨어러블 |

### 활용 예시
- 스마트폰 앱으로 LED/모터 제어
- 심박수, 체온 등 헬스케어 데이터 전송
- 스마트 자전거 속도계
- BLE 비콘 (위치 기반 알림)
- 스마트폰과 가까워지면 자동 잠금 해제
- 웨어러블 기기 데이터 수집

---

## BLE 핵심 개념

| 개념 | 설명 |
|------|------|
| **Service** | 기능 묶음 (ex: 심박수 서비스, 배터리 서비스) |
| **Characteristic** | 실제 데이터 단위 (ex: 심박수 값, 배터리 퍼센트) |
| **UUID** | 서비스/특성을 구분하는 고유 ID (128비트 문자열) |
| **Notify** | 값이 바뀔 때 스마트폰으로 자동 전송 |
| **Read** | 스마트폰이 요청할 때 값 전달 |
| **Write** | 스마트폰에서 ESP32로 데이터 전송 |
| **Advertising** | ESP32가 "나 여기 있어요" 신호를 주기적으로 방송 |

---

## BLE 서버 (ESP32 → 스마트폰 데이터 전송)

```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>

// UUID는 직접 생성해서 사용 (https://www.uuidgenerator.net)
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLECharacteristic* pChar;
bool 연결됨 = false;

class 연결콜백 : public BLEServerCallbacks {
    void onConnect(BLEServer* s)    { 연결됨 = true;  Serial.println("연결됨"); }
    void onDisconnect(BLEServer* s) { 연결됨 = false; Serial.println("연결 끊김"); }
};

void setup() {
    Serial.begin(115200);
    BLEDevice::init("ESP32-C3 Mini");  // 블루투스 장치 이름

    BLEServer* pServer = BLEDevice::createServer();
    pServer->setCallbacks(new 연결콜백());

    BLEService* pService = pServer->createService(SERVICE_UUID);

    pChar = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |    // 스마트폰에서 읽기 가능
        BLECharacteristic::PROPERTY_NOTIFY    // 값 바뀌면 자동 전송
    );
    pChar->addDescriptor(new BLE2902());       // Notify 사용 시 필수
    pService->start();

    BLEDevice::getAdvertising()->start();       // 광고 시작 (스마트폰에서 검색 가능)
    Serial.println("BLE 광고 시작 — 스마트폰에서 검색하세요");
}

void loop() {
    if (연결됨) {
        // 센서값을 문자열로 변환해서 전송
        float 온도 = 25.3;
        String 값 = String(온도);
        pChar->setValue(값.c_str());
        pChar->notify();      // 스마트폰으로 전송
        delay(1000);
    }
}
```

---

## BLE로 스마트폰에서 명령 받기 (Write)

```cpp
class 쓰기콜백 : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* pChar) {
        String 값 = pChar->getValue().c_str();
        Serial.println("받은 명령: " + 값);

        if (값 == "ON")  digitalWrite(8, LOW);   // LED 켜기
        if (값 == "OFF") digitalWrite(8, HIGH);  // LED 끄기
    }
};

// createCharacteristic에 PROPERTY_WRITE 추가
pChar = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_WRITE
);
pChar->setCallbacks(new 쓰기콜백());
```

---

## 테스트 앱

코드 없이 BLE 연결을 테스트할 수 있는 앱입니다.

| 앱 이름 | 플랫폼 | 기능 |
|---------|--------|------|
| **nRF Connect** | iOS / Android | BLE 스캔, 읽기/쓰기/알림 구독 |
| **LightBlue** | iOS / Android | 간단한 BLE 테스트 |
| **Serial Bluetooth Terminal** | Android | BLE UART 통신 |
