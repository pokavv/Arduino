/**
 * @file  16-mdns-hostname.ino
 * @brief mDNS 호스트명 설정 예제 (esp32c3.local)
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * mDNS (multicast DNS):
 * - 같은 네트워크(LAN)에서 IP 없이 이름으로 기기를 찾는 기술
 * - "esp32c3.local" 이라는 주소로 ESP32에 접속 가능
 * - iPhone/Mac은 기본 지원, Windows는 iTunes/Bonjour 설치 필요
 *   또는 최신 Windows 10/11은 기본 지원
 *
 * 사용법:
 * - MDNS.begin("esp32c3") → esp32c3.local 로 접속 가능
 * - WiFi 연결 후 반드시 호출해야 합니다.
 *
 * 장점:
 * - IP 주소가 바뀌어도 .local 주소는 항상 같습니다.
 * - 공유기 IP 대역을 몰라도 됩니다.
 *
 * 웹 서버와 함께 사용:
 * - MDNS.addService("http", "tcp", 80) 등록 시
 *   네트워크 탐색 앱에서 서비스도 자동 발견 가능
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h, WebServer.h, ESPmDNS.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * ---------------------------------------------------------------
 * [연결 방법]
 * - secrets.h 에 Wi-Fi 정보 입력
 * - 같은 Wi-Fi에서 브라우저로 http://esp32c3.local 접속
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 전역 객체
// ---------------------------------------------------------------
WebServer server(WEB_PORT);

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
bool connectWiFi();
bool startMdns();
void handleRoot();

// ---------------------------------------------------------------
// setup(): Wi-Fi → mDNS → 웹 서버 순서로 초기화
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== mDNS 호스트명 설정 =====");

    if (!connectWiFi()) {
        Serial.println("[오류] Wi-Fi 연결 실패");
        return;
    }

    if (!startMdns()) {
        Serial.println("[경고] mDNS 설정 실패 (IP로만 접속 가능)");
    }

    server.on("/", handleRoot);
    server.begin();

    Serial.println("----------------------------");
    Serial.printf("  IP 주소 : http://%s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  mDNS    : http://%s.local\n", MDNS_NAME);
    Serial.println("----------------------------");
}

// ---------------------------------------------------------------
// loop(): 클라이언트 처리 + mDNS 업데이트
// ---------------------------------------------------------------
void loop() {
    server.handleClient();
    // ESP32 Arduino 최신 버전은 MDNS.update() 불필요
    // 구버전 사용 시 주석 해제: MDNS.update();
}

// ---------------------------------------------------------------
// connectWiFi(): Wi-Fi 연결
// ---------------------------------------------------------------
bool connectWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.printf("[Wi-Fi] %s 연결 중", WIFI_SSID);

    unsigned long startMs = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - startMs >= WIFI_CONNECT_TIMEOUT_MS) {
            Serial.println(" 실패!");
            return false;
        }
        delay(500);
        Serial.print(".");
    }
    Serial.printf(" 완료! IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
}

// ---------------------------------------------------------------
// startMdns(): mDNS 서비스를 시작합니다.
// ---------------------------------------------------------------
bool startMdns() {
    // MDNS.begin(호스트명) → 호스트명.local 로 접속 가능
    if (!MDNS.begin(MDNS_NAME)) {
        return false;
    }

    // HTTP 서비스 등록 (네트워크 탐색 앱에서 발견 가능)
    MDNS.addService("http", "tcp", WEB_PORT);

    Serial.printf("[mDNS] http://%s.local 등록 완료\n", MDNS_NAME);
    return true;
}

// ---------------------------------------------------------------
// handleRoot(): 루트 경로 처리
// ---------------------------------------------------------------
void handleRoot() {
    String html = "<!DOCTYPE html><html lang='ko'>";
    html += "<head><meta charset='UTF-8'><title>mDNS</title></head>";
    html += "<body style='font-family:sans-serif;text-align:center;margin-top:50px'>";
    html += "<h1>mDNS 접속 성공!</h1>";
    html += "<p><b>http://";
    html += MDNS_NAME;
    html += ".local</b> 으로 접속했습니다.</p>";
    html += "<p>IP: " + WiFi.localIP().toString() + "</p>";
    html += "</body></html>";
    server.send(200, "text/html; charset=utf-8", html);
}
