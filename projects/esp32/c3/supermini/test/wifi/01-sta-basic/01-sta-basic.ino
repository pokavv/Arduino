/**
 * @file  01-sta-basic.ino
 * @brief Wi-Fi STA 모드 기본 연결 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * Wi-Fi 동작 모드:
 * - STA (Station) 모드: ESP32가 기존 공유기에 접속하는 클라이언트
 *   일반 스마트폰이나 노트북이 공유기에 연결하는 것과 같습니다.
 * - AP (Access Point) 모드: ESP32가 공유기 역할을 직접 함
 * - STA+AP 동시 모드: 두 가지를 동시에 운영
 *
 * 연결 흐름:
 *   1. WiFi.begin(SSID, PASSWORD) → 연결 시작
 *   2. WiFi.status() == WL_CONNECTED 될 때까지 대기
 *   3. WiFi.localIP() → 할당받은 IP 주소 확인
 *
 * RSSI (Received Signal Strength Indicator):
 * - Wi-Fi 신호 강도를 dBm 단위로 표시
 * - 보통 -30dBm(매우 강함) ~ -90dBm(매우 약함)
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - 2.4GHz Wi-Fi 공유기 (5GHz 불가)
 * ---------------------------------------------------------------
 * [연결 방법]
 * - 하드웨어 연결 없음 (USB로 전원 공급)
 * - secrets.h 파일에 Wi-Fi SSID와 비밀번호 입력
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
bool connectWiFi();
void printWiFiInfo();

// ---------------------------------------------------------------
// setup(): 초기화 및 Wi-Fi 연결
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);   // 시리얼 안정화 대기
    Serial.println("\n===== Wi-Fi STA 기본 연결 =====");

    if (connectWiFi()) {
        printWiFiInfo();
    } else {
        Serial.println("[오류] Wi-Fi 연결 실패! SSID/비밀번호 확인 필요");
    }
}

// ---------------------------------------------------------------
// loop(): 주기적으로 연결 상태와 신호 강도 출력
// ---------------------------------------------------------------
void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("[상태] 연결 중  IP: %s  RSSI: %d dBm\n",
                      WiFi.localIP().toString().c_str(),
                      WiFi.RSSI());
    } else {
        Serial.println("[상태] 연결 끊김");
    }

    delay(5000);   // 5초마다 출력
}

// ---------------------------------------------------------------
// connectWiFi(): Wi-Fi에 연결하고 성공 여부를 반환합니다.
// ---------------------------------------------------------------
bool connectWiFi() {
    Serial.printf("[Wi-Fi] SSID: %s 에 연결 중", WIFI_SSID);

    // STA 모드로 설정하고 연결 시작
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long startMs = millis();

    // WL_CONNECTED 상태가 될 때까지 대기 (타임아웃: WIFI_CONNECT_TIMEOUT_MS)
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - startMs >= WIFI_CONNECT_TIMEOUT_MS) {
            Serial.println();
            return false;   // 타임아웃 → 실패
        }

        delay(WIFI_DOT_INTERVAL_MS);
        Serial.print(".");   // 연결 대기 중 점(.) 출력
    }

    Serial.println(" 완료!");
    return true;
}

// ---------------------------------------------------------------
// printWiFiInfo(): 연결된 Wi-Fi 정보를 시리얼로 출력합니다.
// ---------------------------------------------------------------
void printWiFiInfo() {
    Serial.println("----------------------------");
    Serial.printf("  SSID    : %s\n", WiFi.SSID().c_str());
    Serial.printf("  IP 주소 : %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  서브넷  : %s\n", WiFi.subnetMask().toString().c_str());
    Serial.printf("  게이트웨이: %s\n", WiFi.gatewayIP().toString().c_str());
    Serial.printf("  RSSI    : %d dBm\n", WiFi.RSSI());
    Serial.printf("  MAC 주소: %s\n", WiFi.macAddress().c_str());
    Serial.println("----------------------------");
}
