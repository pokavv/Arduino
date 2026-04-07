/**
 * @file  17-captive-portal.ino
 * @brief 캡티브 포털 예제 (AP 모드 + 자동 리디렉션)
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * 캡티브 포털(Captive Portal):
 * - 카페, 공항 Wi-Fi에 접속하면 자동으로 뜨는 "로그인 페이지"가
 *   캡티브 포털입니다.
 * - 동작 원리:
 *   1. AP 모드 열기
 *   2. DNSServer가 모든 DNS 요청에 자신의 IP를 응답
 *   3. 스마트폰이 "neverssl.com" 등에 접속 시도 → ESP32 IP로 리디렉션
 *   4. 웹 페이지(설정 폼 등)가 자동으로 열림
 *
 * DNSServer:
 * - DNS 서버 역할을 합니다.
 * - 어떤 도메인을 물어봐도 ESP32 자신의 IP를 알려줍니다.
 * - dns.processNextRequest()를 loop()에서 반복 호출해야 합니다.
 *
 * 활용:
 * - Wi-Fi 설정 페이지 (WiFiManager와 유사)
 * - 디바이스 초기 설정 UI
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h, WebServer.h, DNSServer.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - 스마트폰 또는 Wi-Fi 기기 (테스트용)
 * ---------------------------------------------------------------
 * [연결 방법]
 * - 하드웨어 연결 없음 (secrets.h 불필요)
 * - 업로드 후 스마트폰에서 "ESP32-Setup" Wi-Fi 연결
 * - 자동으로 설정 페이지가 열림 (안 열리면 192.168.4.1 직접 입력)
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include "config.h"

// ---------------------------------------------------------------
// 전역 객체
// ---------------------------------------------------------------
WebServer server(WEB_PORT);
DNSServer dnsServer;

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
void startAPandDNS();
void handleRoot();
void handleSave();
void handleNotFound();

// ---------------------------------------------------------------
// setup(): AP + DNS + 웹 서버 시작
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== 캡티브 포털 =====");

    startAPandDNS();

    // 라우트 등록
    server.on("/",      handleRoot);
    server.on("/save",  HTTP_POST, handleSave);
    server.onNotFound(handleNotFound);   // 모든 미등록 경로 → 루트로

    server.begin();
    Serial.println("[안내] 스마트폰에서 'ESP32-Setup' Wi-Fi에 연결하세요");
    Serial.println("[안내] 자동으로 설정 페이지가 열립니다.");
}

// ---------------------------------------------------------------
// loop(): DNS + 웹 서버 요청 처리
// ---------------------------------------------------------------
void loop() {
    dnsServer.processNextRequest();   // DNS 요청 처리 (필수)
    server.handleClient();
}

// ---------------------------------------------------------------
// startAPandDNS(): AP 시작 + DNS 서버 시작
// ---------------------------------------------------------------
void startAPandDNS() {
    // AP 모드 (비밀번호 없는 열린 AP)
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID);   // 비밀번호 없음

    IPAddress apIP = WiFi.softAPIP();
    Serial.printf("[AP] '%s' 생성  IP: %s\n", AP_SSID, apIP.toString().c_str());

    // DNS 서버: 모든 도메인 요청 → AP IP(자신)로 응답
    // processNextRequest()를 loop()에서 호출해야 작동
    dnsServer.start(DNS_PORT, "*", apIP);
    Serial.println("[DNS] 캡티브 포털 DNS 서버 시작");
}

// ---------------------------------------------------------------
// handleRoot(): 메인 페이지 - Wi-Fi 설정 폼
// ---------------------------------------------------------------
void handleRoot() {
    String html = "<!DOCTYPE html><html lang='ko'>";
    html += "<head><meta charset='UTF-8'>";
    html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
    html += "<title>Wi-Fi 설정</title>";
    html += "<style>body{font-family:sans-serif;text-align:center;margin-top:40px;}";
    html += "input{width:80%;padding:10px;margin:8px;font-size:16px;}";
    html += "button{padding:12px 24px;background:#2c7be5;color:white;";
    html += "border:none;border-radius:6px;font-size:16px;cursor:pointer;}";
    html += "</style></head><body>";
    html += "<h2>ESP32-C3 Wi-Fi 설정</h2>";
    html += "<p>연결할 Wi-Fi 정보를 입력하세요.</p>";
    html += "<form method='POST' action='/save'>";
    html += "<input name='ssid'     placeholder='Wi-Fi 이름 (SSID)'><br>";
    html += "<input name='password' placeholder='비밀번호' type='password'><br><br>";
    html += "<button type='submit'>저장 및 연결</button>";
    html += "</form></body></html>";

    server.send(200, "text/html; charset=utf-8", html);
}

// ---------------------------------------------------------------
// handleSave(): 폼 제출 처리 - Wi-Fi 정보 저장
// ---------------------------------------------------------------
void handleSave() {
    String ssid     = server.arg("ssid");
    String password = server.arg("password");

    Serial.printf("[설정] SSID: %s  비밀번호: %s\n",
                  ssid.c_str(), password.c_str());

    // 응답 후 실제로는 WiFi.begin(ssid, password)로 연결 시도
    String html = "<!DOCTYPE html><html lang='ko'>";
    html += "<head><meta charset='UTF-8'></head><body>";
    html += "<h2>설정 저장됨</h2>";
    html += "<p>SSID: <b>" + ssid + "</b> 로 연결을 시도합니다.</p>";
    html += "<p>연결 후 이 페이지는 닫아도 됩니다.</p>";
    html += "</body></html>";
    server.send(200, "text/html; charset=utf-8", html);

    // 실제 연결 시도 (필요 시 주석 해제)
    // WiFi.mode(WIFI_AP_STA);
    // WiFi.begin(ssid.c_str(), password.c_str());
}

// ---------------------------------------------------------------
// handleNotFound(): 모든 미등록 경로 → 루트(캡티브 포털)로 리디렉션
// 스마트폰이 연결 감지 URL을 자동 요청할 때 이곳으로 옵니다.
// ---------------------------------------------------------------
void handleNotFound() {
    server.sendHeader("Location", "/");
    server.send(302, "text/plain", "");
}
