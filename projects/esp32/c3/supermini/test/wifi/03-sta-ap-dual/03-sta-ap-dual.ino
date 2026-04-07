/**
 * @file  03-sta-ap-dual.ino
 * @brief Wi-Fi STA + AP 동시 모드 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * STA+AP 동시 모드 (WIFI_AP_STA):
 * - ESP32가 공유기에 클라이언트로 접속(STA)하면서
 *   동시에 자신도 AP를 열어 다른 기기의 접속을 받습니다.
 *
 * 활용 사례:
 * - 브리지(Bridge): ESP32를 통해 AP에 접속한 기기들이
 *   인터넷을 사용하도록 중계
 * - 현장 설정: 현장에서 스마트폰으로 AP에 접속해 설정하면서
 *   동시에 인터넷 데이터도 가져오는 구조
 *
 * 주의: 두 모드를 동시에 쓰면 메모리와 전력 소모가 증가합니다.
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - 2.4GHz Wi-Fi 공유기
 * ---------------------------------------------------------------
 * [연결 방법]
 * - secrets.h 에 공유기 SSID/비밀번호 입력
 * - 업로드 후 "ESP32-C3-Dual" AP도 별도로 열립니다.
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
bool connectSTA();
void startAP();
void printNetworkInfo();

// ---------------------------------------------------------------
// setup(): STA + AP 동시 시작
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== Wi-Fi STA+AP 동시 모드 =====");

    // STA+AP 동시 모드로 설정
    WiFi.mode(WIFI_AP_STA);

    // AP 먼저 시작 (STA 연결 중에도 AP는 즉시 활성화)
    startAP();

    // STA 연결 시도
    if (connectSTA()) {
        Serial.println("[STA] 공유기 연결 성공!");
    } else {
        Serial.println("[STA] 공유기 연결 실패 (AP는 계속 동작)");
    }

    printNetworkInfo();
}

// ---------------------------------------------------------------
// loop(): 상태 주기적 출력
// ---------------------------------------------------------------
void loop() {
    Serial.println("--- 네트워크 상태 ---");
    Serial.printf("  STA: %s  IP: %s\n",
                  (WiFi.status() == WL_CONNECTED) ? "연결됨" : "끊김",
                  WiFi.localIP().toString().c_str());
    Serial.printf("  AP:  클라이언트 %d대  IP: %s\n",
                  WiFi.softAPgetStationNum(),
                  WiFi.softAPIP().toString().c_str());

    delay(5000);
}

// ---------------------------------------------------------------
// connectSTA(): STA 모드로 공유기에 연결합니다.
// ---------------------------------------------------------------
bool connectSTA() {
    Serial.printf("[STA] %s 연결 중", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long startMs = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - startMs >= WIFI_CONNECT_TIMEOUT_MS) {
            Serial.println();
            return false;
        }
        delay(500);
        Serial.print(".");
    }
    Serial.println(" 완료!");
    return true;
}

// ---------------------------------------------------------------
// startAP(): AP를 시작합니다.
// ---------------------------------------------------------------
void startAP() {
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    Serial.printf("[AP] '%s' 생성 완료  IP: %s\n",
                  AP_SSID,
                  WiFi.softAPIP().toString().c_str());
}

// ---------------------------------------------------------------
// printNetworkInfo(): 네트워크 정보를 출력합니다.
// ---------------------------------------------------------------
void printNetworkInfo() {
    Serial.println("==============================");
    Serial.printf("  STA IP  : %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  AP SSID : %s\n", AP_SSID);
    Serial.printf("  AP IP   : %s\n", WiFi.softAPIP().toString().c_str());
    Serial.println("==============================");
}
