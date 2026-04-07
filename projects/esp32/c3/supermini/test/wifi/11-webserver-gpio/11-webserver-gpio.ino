/**
 * @file  11-webserver-gpio.ino
 * @brief 웹 페이지에서 LED ON/OFF 제어 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * 웹 기반 GPIO 제어:
 * - 브라우저에서 버튼을 눌러 ESP32의 GPIO를 제어합니다.
 * - ESP32가 웹 서버로 동작하며 HTTP 요청으로 명령을 받습니다.
 *
 * REST API 스타일 엔드포인트:
 * - GET /led/on  → LED 켜기
 * - GET /led/off → LED 끄기
 * - GET /        → 제어 페이지
 *
 * ESP32-C3 Super Mini 내장 LED:
 * - 핀: GPIO8
 * - Active LOW: LOW 신호 = 켜짐, HIGH 신호 = 꺼짐
 *   일반 LED와 반대이므로 주의!
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h, WebServer.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1 (내장 LED 사용)
 * ---------------------------------------------------------------
 * [연결 방법]
 * - 하드웨어 연결 없음 (내장 LED G8 사용)
 * - secrets.h 에 Wi-Fi 정보 입력
 * - 같은 Wi-Fi의 브라우저에서 ESP32 IP로 접속
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include <WebServer.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 전역 변수
// ---------------------------------------------------------------
WebServer server(WEB_PORT);
bool      ledState = false;   // 현재 LED 상태 (false=꺼짐, true=켜짐)

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
bool connectWiFi();
void handleRoot();
void handleLedOn();
void handleLedOff();
void setLed(bool on);
String buildPage();

// ---------------------------------------------------------------
// setup(): 초기화
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== 웹 서버 LED 제어 =====");

    // LED 핀 초기화
    pinMode(LED_PIN, OUTPUT);
    setLed(false);   // 처음에 꺼짐

    if (!connectWiFi()) {
        Serial.println("[오류] Wi-Fi 연결 실패");
        return;
    }

    // 라우트 등록
    server.on("/",        handleRoot);
    server.on("/led/on",  handleLedOn);
    server.on("/led/off", handleLedOff);

    server.begin();
    Serial.printf("[서버] http://%s 로 접속하세요\n",
                  WiFi.localIP().toString().c_str());
}

// ---------------------------------------------------------------
// loop(): 클라이언트 처리
// ---------------------------------------------------------------
void loop() {
    server.handleClient();
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
// setLed(): LED 상태를 설정합니다.
// Active LOW: on=true이면 LOW(켜짐), on=false이면 HIGH(꺼짐)
// ---------------------------------------------------------------
void setLed(bool on) {
    ledState = on;
    // Active LOW: 켜려면 LOW, 끄려면 HIGH
    digitalWrite(LED_PIN, on ? LOW : HIGH);
    Serial.printf("[LED] %s\n", on ? "켜짐" : "꺼짐");
}

// ---------------------------------------------------------------
// buildPage(): LED 제어 HTML 페이지를 만듭니다.
// ---------------------------------------------------------------
String buildPage() {
    String html = "<!DOCTYPE html><html lang='ko'>";
    html += "<head><meta charset='UTF-8'>";
    html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
    html += "<title>LED 제어</title>";
    html += "<style>";
    html += "body{font-family:sans-serif;text-align:center;margin-top:40px;}";
    html += ".btn{display:inline-block;padding:15px 30px;margin:10px;";
    html += "font-size:18px;border-radius:8px;text-decoration:none;color:white;}";
    html += ".on{background:#28a745;} .off{background:#dc3545;}";
    html += ".status{font-size:22px;margin:20px;}";
    html += "</style></head><body>";
    html += "<h1>LED 제어</h1>";
    html += "<div class='status'>현재 상태: <b>";
    html += ledState ? "켜짐 (ON)" : "꺼짐 (OFF)";
    html += "</b></div>";
    html += "<a href='/led/on'  class='btn on'>켜기 (ON)</a>";
    html += "<a href='/led/off' class='btn off'>끄기 (OFF)</a>";
    html += "</body></html>";
    return html;
}

// ---------------------------------------------------------------
// handleRoot(): 메인 페이지
// ---------------------------------------------------------------
void handleRoot() {
    server.send(200, "text/html; charset=utf-8", buildPage());
}

// ---------------------------------------------------------------
// handleLedOn(): LED 켜기 후 메인 페이지로 리다이렉트
// ---------------------------------------------------------------
void handleLedOn() {
    setLed(true);
    server.sendHeader("Location", "/");
    server.send(302, "text/plain", "");
}

// ---------------------------------------------------------------
// handleLedOff(): LED 끄기 후 메인 페이지로 리다이렉트
// ---------------------------------------------------------------
void handleLedOff() {
    setLed(false);
    server.sendHeader("Location", "/");
    server.send(302, "text/plain", "");
}
