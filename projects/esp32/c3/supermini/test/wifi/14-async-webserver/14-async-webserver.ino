/**
 * @file  14-async-webserver.ino
 * @brief 비동기 웹 서버 (ESPAsyncWebServer) 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * 동기(Sync) vs 비동기(Async) 웹 서버:
 * - 동기(WebServer): 요청을 처리하는 동안 loop()가 멈춥니다.
 *   handleClient() 호출 중 다른 코드 실행 불가
 * - 비동기(AsyncWebServer): 요청 처리가 백그라운드에서 이루어집니다.
 *   loop()에서 다른 작업을 동시에 할 수 있습니다.
 *
 * ESPAsyncWebServer 특징:
 * - loop()에 handleClient() 불필요
 * - 여러 클라이언트 동시 처리
 * - WebSocket, SSE(Server-Sent Events) 지원
 * - 응답을 람다(Lambda) 함수 또는 핸들러로 처리
 *
 * 사용법:
 * - server.on("/경로", HTTP_GET, [](AsyncWebServerRequest *request){ ... })
 * - request->send(200, "text/html", "내용")
 * ---------------------------------------------------------------
 * [라이브러리]
 * - ESPAsyncWebServer (GitHub: me-no-dev/ESPAsyncWebServer)
 *   Arduino IDE → 라이브러리 관리 → "ESPAsyncWebServer" 검색
 *   또는 ZIP으로 설치: https://github.com/me-no-dev/ESPAsyncWebServer
 * - AsyncTCP (ESP32용, 함께 설치 필요)
 *   https://github.com/me-no-dev/AsyncTCP
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * ---------------------------------------------------------------
 * [연결 방법]
 * - 하드웨어 연결 없음
 * - secrets.h 에 Wi-Fi 정보 입력
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 비동기 웹 서버 객체
// ---------------------------------------------------------------
AsyncWebServer server(WEB_PORT);

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
bool connectWiFi();
void setupRoutes();

// ---------------------------------------------------------------
// setup(): Wi-Fi 연결 및 비동기 서버 시작
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== ESPAsyncWebServer 비동기 웹 서버 =====");

    if (!connectWiFi()) {
        Serial.println("[오류] Wi-Fi 연결 실패");
        return;
    }

    // 라우트 등록
    setupRoutes();

    // 서버 시작 (begin 이후 loop()에서 아무것도 호출 안 해도 됨)
    server.begin();
    Serial.printf("[서버] http://%s 로 접속하세요\n",
                  WiFi.localIP().toString().c_str());
}

// ---------------------------------------------------------------
// loop(): 다른 작업을 여기서 자유롭게 할 수 있습니다.
// 비동기 서버는 별도 스레드에서 처리되므로 loop() 방해 없음.
// ---------------------------------------------------------------
void loop() {
    // 서버와 독립적으로 다른 작업 가능
    // 예: 센서 읽기, LED 제어, 타이머 등
    static unsigned long lastMs = 0;
    if (millis() - lastMs >= 5000) {
        lastMs = millis();
        Serial.printf("[루프] 가동 시간: %lu초  (서버와 독립 동작)\n",
                      millis() / 1000);
    }
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
// setupRoutes(): 경로별 핸들러를 등록합니다.
// 람다(Lambda) 함수로 간결하게 작성합니다.
// ---------------------------------------------------------------
void setupRoutes() {
    // 루트 경로: HTML 페이지
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        String html = "<!DOCTYPE html><html lang='ko'>";
        html += "<head><meta charset='UTF-8'>";
        html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
        html += "<title>AsyncWebServer</title></head>";
        html += "<body style='font-family:sans-serif;text-align:center;margin-top:50px'>";
        html += "<h1>비동기 웹 서버</h1>";
        html += "<p>ESPAsyncWebServer가 동작 중입니다.</p>";
        html += "<p><a href='/info'>/info</a> - 시스템 정보</p>";
        html += "</body></html>";
        request->send(200, "text/html; charset=utf-8", html);
        Serial.printf("[요청] GET /  클라이언트: %s\n",
                      request->client()->remoteIP().toString().c_str());
    });

    // 정보 경로: JSON 응답
    server.on("/info", HTTP_GET, [](AsyncWebServerRequest *request) {
        String json = "{";
        json += "\"ip\":\""    + WiFi.localIP().toString() + "\",";
        json += "\"rssi\":"    + String(WiFi.RSSI())       + ",";
        json += "\"uptime\":"  + String(millis() / 1000)   + ",";
        json += "\"freeHeap\":" + String(ESP.getFreeHeap());
        json += "}";
        request->send(200, "application/json", json);
    });

    // 없는 경로 처리
    server.onNotFound([](AsyncWebServerRequest *request) {
        request->send(404, "text/plain", "Not Found");
    });
}
