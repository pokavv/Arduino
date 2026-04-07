/**
 * @file  04-scan-networks.ino
 * @brief 주변 Wi-Fi 네트워크 목록 스캔 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * Wi-Fi 스캔:
 * - 주변에 있는 AP(공유기) 목록을 검색합니다.
 * - 스마트폰에서 "Wi-Fi 설정 → 네트워크 검색" 과 동일한 동작
 *
 * WiFi.scanNetworks():
 * - 스캔 실행 후 발견된 네트워크 수를 반환합니다.
 * - 각 네트워크의 SSID, RSSI, 암호화 방식을 알 수 있습니다.
 *
 * 암호화 방식 (encryptionType):
 * - WIFI_AUTH_OPEN       : 비밀번호 없음 (열린 네트워크)
 * - WIFI_AUTH_WEP        : WEP (구식, 보안 취약)
 * - WIFI_AUTH_WPA_PSK    : WPA
 * - WIFI_AUTH_WPA2_PSK   : WPA2 (가장 일반적)
 * - WIFI_AUTH_WPA_WPA2_PSK: WPA/WPA2 혼용
 *
 * secrets.h 불필요:
 * - 스캔만 하고 접속하지 않으므로 인증 정보 불필요
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * ---------------------------------------------------------------
 * [연결 방법]
 * - 하드웨어 연결 없음 (USB로 전원 공급)
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include "config.h"

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
void scanNetworks();
const char* getEncryptionName(wifi_auth_mode_t encType);

// millis() 타이머
unsigned long lastScanMs = 0;

// ---------------------------------------------------------------
// setup(): 초기화 및 첫 스캔
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== Wi-Fi 네트워크 스캔 =====");

    // STA 모드 설정 (스캔은 STA 모드에서 동작)
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();   // 기존 연결 해제

    scanNetworks();
    lastScanMs = millis();
}

// ---------------------------------------------------------------
// loop(): SCAN_INTERVAL 마다 재스캔
// ---------------------------------------------------------------
void loop() {
    if (millis() - lastScanMs >= SCAN_INTERVAL) {
        lastScanMs = millis();
        scanNetworks();
    }
}

// ---------------------------------------------------------------
// scanNetworks(): 주변 Wi-Fi 네트워크를 스캔하고 출력합니다.
// ---------------------------------------------------------------
void scanNetworks() {
    Serial.println("\n[스캔 시작] 잠시 기다려 주세요...");

    // 스캔 실행 (동기 방식: 완료될 때까지 기다림)
    int count = WiFi.scanNetworks();

    if (count == 0) {
        Serial.println("[결과] 주변에 Wi-Fi 없음");
        return;
    }

    if (count < 0) {
        Serial.println("[오류] 스캔 실패");
        return;
    }

    Serial.printf("[결과] %d개 발견\n", count);
    Serial.println("----------------------------------------------");
    Serial.printf("%-3s  %-28s  %6s  %s\n",
                  "No.", "SSID", "RSSI", "보안");
    Serial.println("----------------------------------------------");

    for (int i = 0; i < count; i++) {
        Serial.printf("%-3d  %-28s  %4d dBm  %s\n",
                      i + 1,
                      WiFi.SSID(i).c_str(),
                      WiFi.RSSI(i),
                      getEncryptionName(WiFi.encryptionType(i)));
    }

    Serial.println("----------------------------------------------");

    // 스캔 결과 메모리 해제 (중요! 안 하면 메모리 누수)
    WiFi.scanDelete();
}

// ---------------------------------------------------------------
// getEncryptionName(): 암호화 방식 코드를 문자열로 변환합니다.
// ---------------------------------------------------------------
const char* getEncryptionName(wifi_auth_mode_t encType) {
    switch (encType) {
        case WIFI_AUTH_OPEN:         return "열린 네트워크";
        case WIFI_AUTH_WEP:          return "WEP";
        case WIFI_AUTH_WPA_PSK:      return "WPA";
        case WIFI_AUTH_WPA2_PSK:     return "WPA2";
        case WIFI_AUTH_WPA_WPA2_PSK: return "WPA/WPA2";
        case WIFI_AUTH_WPA3_PSK:     return "WPA3";
        default:                     return "알 수 없음";
    }
}
