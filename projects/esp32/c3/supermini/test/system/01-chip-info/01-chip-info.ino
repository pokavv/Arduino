/*
 * system/01-chip-info — ESP32-C3 칩 정보 읽기
 * ================================================================
 *
 * [핵심 개념 설명]
 *   MAC 주소 (Media Access Control Address)
 *     - 모든 네트워크 장치에 부여된 고유 식별자 (48비트 = 6바이트)
 *     - 형식: AA:BB:CC:DD:EE:FF (16진수 6쌍)
 *     - 공장에서 칩에 새겨지며, 전 세계에서 중복되지 않음
 *     - Wi-Fi, BLE 장치 구분에 사용 (MQTT 클라이언트 ID 등)
 *
 *   SDK 버전
 *     - ESP-IDF (Espressif IoT Development Framework) 버전
 *     - ESP32 하드웨어를 제어하는 저수준 라이브러리
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"
#include <esp_wifi.h>   // esp_read_mac() 함수 포함

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);  // 시리얼 안정화 대기

  Serial.println("===================================");
  Serial.println(" ESP32-C3 칩 정보");
  Serial.println("===================================");

  // ---- CPU 주파수 ----
  Serial.print("CPU 주파수   : ");
  Serial.print(ESP.getCpuFreqMHz());  // 단위: MHz (보통 160MHz)
  Serial.println(" MHz");

  // ---- SDK 버전 ----
  Serial.print("SDK 버전     : ");
  Serial.println(ESP.getSdkVersion());  // ESP-IDF 버전 문자열

  // ---- 플래시 메모리 크기 ----
  Serial.print("플래시 크기  : ");
  Serial.print(ESP.getFlashChipSize() / (1024 * 1024));  // 바이트 → MB 변환
  Serial.println(" MB");

  // ---- 칩 ID (하위 32비트) ----
  // ESP.getChipId()는 MAC 주소 하위 4바이트 기반의 고유 ID
  Serial.print("칩 ID (32비트): 0x");
  Serial.println(ESP.getEfuseMac(), HEX);  // 고유 MAC Efuse 값

  // ---- MAC 주소 읽기 ----
  // esp_read_mac()으로 각 인터페이스별 MAC 주소를 6바이트 배열로 가져옴
  uint8_t mac[6];  // MAC 주소를 담을 6바이트 배열

  // Wi-Fi STA (클라이언트) MAC 주소
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  printMac("Wi-Fi STA MAC", mac);

  // Wi-Fi AP (액세스 포인트) MAC 주소
  esp_read_mac(mac, ESP_MAC_WIFI_SOFTAP);
  printMac("Wi-Fi AP  MAC", mac);

  // BLE MAC 주소
  esp_read_mac(mac, ESP_MAC_BT);
  printMac("BLE       MAC", mac);

  Serial.println("===================================");
  Serial.println("setup() 완료 — 이후 loop() 에서 아무것도 하지 않음");
}

void loop() {
  // 칩 정보는 setup()에서 한 번만 출력하면 충분
  // loop()는 비워둠
  delay(1000);
}

// ---- 헬퍼 함수: MAC 주소를 보기 좋게 출력 ----
void printMac(const char* label, uint8_t mac[6]) {
  Serial.print(label);
  Serial.print(" : ");
  for (int i = 0; i < 6; i++) {
    if (mac[i] < 0x10) Serial.print("0");  // 한 자리면 앞에 0 채우기
    Serial.print(mac[i], HEX);
    if (i < 5) Serial.print(":");           // 마지막 바이트 뒤엔 : 없음
  }
  Serial.println();
}
