/**
 * @file  12-webserver-json-api.ino
 * @brief 웹 서버 JSON API 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * REST API:
 * - HTTP로 데이터를 주고받는 표준적인 방법
 * - GET /api/sensor → 센서 데이터를 JSON으로 반환
 *
 * 이 예제의 API:
 * - GET /api/sensor → {"temperature":25.5,"adc":2048,"uptime":1234}
 *
 * JSON 응답 만들기:
 * - Content-Type: application/json 헤더 필수
 * - ArduinoJson 없이 String으로 직접 조합 (간단한 경우)
 *
 * ADC (Analog-to-Digital Converter):
 * - GPIO0 핀의 전압을 0~4095 디지털 값으로 읽습니다.
 * - 가변저항 연결 시 실제 아날로그 값 측정 가능
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h, WebServer.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - 가변저항 (선택, G0에 연결)
 * ---------------------------------------------------------------
 * [연결 방법]
 * - secrets.h 에 Wi-Fi 정보 입력
 * - 브라우저에서 http://[IP]/api/sensor 접속
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include <WebServer.h>
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
void handleRoot();
void handleSensorApi();
float readFakeTemperature();

// ---------------------------------------------------------------
// setup(): Wi-Fi 연결 및 서버 시작
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== 웹 서버 JSON API =====");

    if (!connectWiFi()) {
        Serial.println("[오류] Wi-Fi 연결 실패");
        return;
    }

    server.on("/",            handleRoot);
    server.on("/api/sensor",  handleSensorApi);

    server.begin();
    Serial.printf("[서버] http://%s/api/sensor 로 접속하세요\n",
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
// readFakeTemperature(): 가상 온도 값을 반환합니다.
// 실제 센서(DHT22, DS18B20 등) 사용 시 이 함수를 교체하세요.
// ---------------------------------------------------------------
float readFakeTemperature() {
    // millis()로 서서히 변하는 가상 온도 (20~30도 사이)
    return 25.0f + 5.0f * sin(millis() / 10000.0f);
}

// ---------------------------------------------------------------
// handleRoot(): 루트 경로 - API 안내 페이지
// ---------------------------------------------------------------
void handleRoot() {
    String html = "<!DOCTYPE html><html lang='ko'><head><meta charset='UTF-8'>";
    html += "<title>JSON API</title></head><body>";
    html += "<h2>ESP32-C3 JSON API</h2>";
    html += "<p><a href='/api/sensor'>/api/sensor</a> - 센서 데이터 조회</p>";
    html += "</body></html>";
    server.send(200, "text/html; charset=utf-8", html);
}

// ---------------------------------------------------------------
// handleSensorApi(): GET /api/sensor → JSON 응답
// ---------------------------------------------------------------
void handleSensorApi() {
    float temperature = readFakeTemperature();
    int   adcValue    = analogRead(ADC_PIN);
    unsigned long uptime = millis() / 1000;

    // JSON 문자열 조합
    String json = "{";
    json += "\"temperature\":" + String(temperature, 1) + ",";
    json += "\"adc\":"         + String(adcValue)       + ",";
    json += "\"uptime\":"      + String(uptime);
    json += "}";

    // CORS 헤더 추가 (다른 도메인에서 API 호출 허용)
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", json);

    Serial.printf("[API] /api/sensor → temp=%.1f  adc=%d\n",
                  temperature, adcValue);
}
