/**
 * @file  10-webserver-basic.ino
 * @brief ESP32 웹 서버 기본 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * 웹 서버(Web Server):
 * - ESP32가 서버가 되어 웹 브라우저의 요청을 처리합니다.
 * - 브라우저에서 ESP32 IP:포트로 접속하면 HTML 페이지를 줍니다.
 *
 * WebServer 클래스 (ESP32 내장):
 * - server.on("/경로", 핸들러함수): 특정 경로 요청 처리 등록
 * - server.onNotFound(핸들러)    : 없는 경로 요청 시 처리
 * - server.handleClient()       : 루프에서 계속 호출해야 함
 * - server.send(코드, 타입, 내용): 응답 전송
 *
 * 사용 방법:
 * 1. 업로드 후 시리얼 모니터에서 ESP32 IP 확인
 * 2. 같은 Wi-Fi의 스마트폰/PC 브라우저에서 http://[IP] 입력
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h, WebServer.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - 같은 Wi-Fi 네트워크의 스마트폰 또는 PC
 * ---------------------------------------------------------------
 * [연결 방법]
 * - 하드웨어 연결 없음
 * - secrets.h 에 Wi-Fi 정보 입력
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include <WebServer.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 웹 서버 객체 생성 (포트 80)
// ---------------------------------------------------------------
WebServer server(WEB_PORT);

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
bool connectWiFi();
void handleRoot();
void handleNotFound();

// ---------------------------------------------------------------
// setup(): Wi-Fi 연결 및 웹 서버 시작
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== 웹 서버 기본 =====");

    if (!connectWiFi()) {
        Serial.println("[오류] Wi-Fi 연결 실패");
        return;
    }

    // 라우트(경로) 등록
    server.on("/", handleRoot);           // 루트 경로
    server.onNotFound(handleNotFound);    // 없는 경로

    // 서버 시작
    server.begin();
    Serial.printf("[서버] 시작! http://%s 로 접속하세요\n",
                  WiFi.localIP().toString().c_str());
}

// ---------------------------------------------------------------
// loop(): 클라이언트 요청 처리 (반드시 호출)
// ---------------------------------------------------------------
void loop() {
    server.handleClient();   // 클라이언트 요청 처리
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
// handleRoot(): "/" 경로 요청 처리 핸들러
// ---------------------------------------------------------------
void handleRoot() {
    // HTML 페이지 문자열
    String html = "<!DOCTYPE html><html lang='ko'>";
    html += "<head><meta charset='UTF-8'>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
    html += "<title>ESP32-C3</title>";
    html += "<style>body{font-family:sans-serif;text-align:center;margin-top:50px;}";
    html += "h1{color:#2c7be5;}</style></head>";
    html += "<body>";
    html += "<h1>Hello from ESP32-C3!</h1>";
    html += "<p>ESP32-C3 Super Mini 웹 서버가 동작 중입니다.</p>";
    html += "<p>IP 주소: ";
    html += WiFi.localIP().toString();
    html += "</p>";
    html += "<p>가동 시간: ";
    html += String(millis() / 1000);
    html += "초</p>";
    html += "</body></html>";

    // 응답 전송: HTTP 200 OK, text/html 타입
    server.send(200, "text/html; charset=utf-8", html);
    Serial.printf("[요청] GET /  클라이언트: %s\n",
                  server.client().remoteIP().toString().c_str());
}

// ---------------------------------------------------------------
// handleNotFound(): 없는 경로 요청 처리
// ---------------------------------------------------------------
void handleNotFound() {
    String message = "경로를 찾을 수 없습니다.\n";
    message += "URL: " + server.uri() + "\n";
    server.send(404, "text/plain; charset=utf-8", message);
}
