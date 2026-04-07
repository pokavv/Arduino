/*
 * json/03-api-server — JSON API 서버 예제
 * ================================================================
 *
 * [핵심 개념 설명]
 *   REST API 서버
 *     - ESP32가 웹 서버가 되어 JSON 형식으로 데이터를 제공
 *     - GET 요청 → JSON 응답 (스마트폰, PC 등에서 접속 가능)
 *
 *   WebServer 라이브러리
 *     - ESP32 Arduino SDK 내장
 *     - server.on("/경로", 함수): 요청 경로에 핸들러 등록
 *     - server.send(코드, 타입, 내용): 응답 전송
 *
 *   Content-Type: application/json
 *     - 응답이 JSON 형식임을 클라이언트에게 알리는 HTTP 헤더
 *
 * [라이브러리]
 *   ArduinoJson (Benoit Blanchon) — 라이브러리 매니저에서 설치
 *   WebServer — ESP32 Arduino SDK 내장
 *
 * [준비물]
 *   없음 — Wi-Fi 공유기와 같은 네트워크 필요
 *
 * [연결 방법]
 *   없음 — Wi-Fi로 연결 후 브라우저에서 http://[IP주소]/api/status 접속
 *   IP 주소는 시리얼 모니터에서 확인
 */

#include "config.h"
#include "secrets.h"      // WIFI_SSID, WIFI_PASSWORD
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

WebServer server(WEB_PORT);  // 포트 80으로 서버 생성

// ---- /api/status 요청 핸들러 ----
void handleApiStatus() {
  JsonDocument doc;

  // 기본 시스템 정보
  doc["device"]     = "ESP32-C3 Super Mini";
  doc["uptime_ms"]  = millis();          // 가동 시간 (ms)
  doc["free_heap"]  = ESP.getFreeHeap(); // 여유 힙 (bytes)
  doc["cpu_mhz"]    = ESP.getCpuFreqMHz();

  // ADC 값 (G0 핀)
  // 주의: G0은 부팅핀 — 부팅 완료 후 ADC로 사용 가능
  int adcRaw       = analogRead(ADC_PIN);          // 0~4095 (12비트)
  float adcVoltage = adcRaw * (3.3f / 4095.0f);   // 0.0~3.3V 변환

  JsonObject adc = doc["adc"].to<JsonObject>();
  adc["pin"]     = ADC_PIN;
  adc["raw"]     = adcRaw;
  adc["voltage"] = serialized(String(adcVoltage, 2));  // 소수점 2자리

  // Wi-Fi 정보
  JsonObject wifi = doc["wifi"].to<JsonObject>();
  wifi["ssid"]    = WiFi.SSID();
  wifi["rssi"]    = WiFi.RSSI();   // 신호 강도 (dBm, 높을수록 좋음)
  wifi["ip"]      = WiFi.localIP().toString();

  // JSON 직렬화 후 응답 전송
  String jsonResponse;
  serializeJson(doc, jsonResponse);

  // Access-Control-Allow-Origin: JavaScript 앱에서도 접근 허용 (CORS)
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", jsonResponse);  // HTTP 200 OK + JSON

  Serial.print("GET /api/status 응답: ");
  Serial.println(jsonResponse);
}

// ---- 404 Not Found 핸들러 ----
void handleNotFound() {
  JsonDocument doc;
  doc["error"]   = "Not Found";
  doc["path"]    = server.uri();
  doc["hint"]    = "GET /api/status 를 사용하세요";

  String jsonResponse;
  serializeJson(doc, jsonResponse);
  server.send(404, "application/json", jsonResponse);
}

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" JSON API 서버 예제");
  Serial.println("===================================");

  // ---- Wi-Fi 연결 ----
  Serial.print("Wi-Fi 연결 중: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n[오류] Wi-Fi 연결 실패!");
    while (true) { delay(1000); }
  }

  Serial.println("\nWi-Fi 연결 성공!");
  Serial.print("IP 주소: ");
  Serial.println(WiFi.localIP());
  Serial.print("브라우저에서 접속: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/api/status");

  // ---- 라우트 등록 ----
  server.on("/api/status", HTTP_GET, handleApiStatus);
  server.onNotFound(handleNotFound);

  // ---- 서버 시작 ----
  server.begin();
  Serial.println("서버 시작!");
}

void loop() {
  server.handleClient();  // 들어오는 HTTP 요청 처리 — 반드시 loop에서 호출
}
