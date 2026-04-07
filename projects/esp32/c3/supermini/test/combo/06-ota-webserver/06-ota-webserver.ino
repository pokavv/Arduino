/*
 * combo/06-ota-webserver — OTA 업데이트 + 웹 서버 동시 운영
 * ================================================================
 *
 * [핵심 개념 설명]
 *   OTA (Over-The-Air) 업데이트
 *     - 케이블 연결 없이 Wi-Fi로 펌웨어 업로드하는 기능
 *     - 장점: 설치된 장치에 USB 접근 없이 원격 업데이트 가능
 *     - Arduino IDE에서: 포트 선택 시 네트워크 포트로 ESP32 선택 가능
 *
 *   ArduinoOTA 동작 원리
 *     - ESP32가 mDNS로 "esp32c3-ota.local" 이름 광고
 *     - Arduino IDE가 네트워크에서 장치 발견 → 업로드
 *     - 비밀번호로 무단 업로드 방지 (중요!)
 *
 *   WebServer + OTA 동시 운영
 *     - 두 라이브러리가 같은 loop()에서 각각 handleClient() / handle() 호출
 *     - loop()가 블로킹되면 안 됨 (delay() 최소화)
 *
 * [라이브러리]
 *   ArduinoOTA — ESP32 Arduino SDK 내장
 *   WebServer   — ESP32 Arduino SDK 내장
 *
 * [준비물]
 *   없음 — Wi-Fi 공유기 필요
 *
 * [연결 방법]
 *   없음 — USB로 초기 업로드 후 이후 OTA로 업데이트 가능
 *   웹 서버: http://[IP주소]/
 */

#include "config.h"
#include "secrets.h"
#include <WiFi.h>
#include <ArduinoOTA.h>
#include <WebServer.h>

WebServer server(WEB_PORT);

// ---- 웹 서버 메인 페이지 ----
void handleRoot() {
  String html = "<!DOCTYPE html><html lang='ko'><head>";
  html += "<meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
  html += "<title>ESP32 OTA 서버</title>";
  html += "<style>body{font-family:Arial;padding:20px;background:#f5f5f5;}";
  html += ".info{background:#fff;border-radius:8px;padding:20px;max-width:400px;}";
  html += "h2{color:#333;}</style></head><body>";
  html += "<div class='info'>";
  html += "<h2>ESP32-C3 OTA 서버</h2>";
  html += "<p><b>가동 시간:</b> " + String(millis() / 1000) + "초</p>";
  html += "<p><b>여유 힙:</b> " + String(ESP.getFreeHeap()) + " bytes</p>";
  html += "<p><b>CPU:</b> " + String(ESP.getCpuFreqMHz()) + " MHz</p>";
  html += "<p><b>IP:</b> " + WiFi.localIP().toString() + "</p>";
  html += "<p><b>OTA:</b> Arduino IDE 네트워크 포트에서 '";
  html += OTA_HOSTNAME;
  html += "' 선택 후 업로드</p>";
  html += "</div></body></html>";

  server.send(200, "text/html; charset=utf-8", html);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" OTA + 웹 서버");
  Serial.println("===================================");

  // ---- Wi-Fi 연결 ----
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Wi-Fi 연결 중");
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500); Serial.print("."); retries++;
  }
  Serial.print("\n연결 성공! IP: ");
  Serial.println(WiFi.localIP());

  // ---- ArduinoOTA 설정 ----
  ArduinoOTA.setHostname(OTA_HOSTNAME);   // mDNS 이름 설정
  ArduinoOTA.setPassword(OTA_PASSWORD);   // OTA 비밀번호 (중요!)
  ArduinoOTA.setPort(OTA_PORT);

  // OTA 이벤트 콜백 등록
  ArduinoOTA.onStart([]() {
    String type = (ArduinoOTA.getCommand() == U_FLASH) ? "스케치" : "파일시스템";
    Serial.print("[OTA] 업데이트 시작: "); Serial.println(type);
  });

  ArduinoOTA.onEnd([]() {
    Serial.println("\n[OTA] 업데이트 완료! 재시작...");
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("[OTA] 진행: %u%%\r", progress * 100 / total);
  });

  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("[OTA] 오류 [%u]: ", error);
    if (error == OTA_AUTH_ERROR)         Serial.println("인증 실패");
    else if (error == OTA_BEGIN_ERROR)   Serial.println("시작 실패");
    else if (error == OTA_CONNECT_ERROR) Serial.println("연결 실패");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("수신 실패");
    else if (error == OTA_END_ERROR)     Serial.println("종료 실패");
  });

  ArduinoOTA.begin();
  Serial.print("OTA 준비 완료 (호스트: ");
  Serial.print(OTA_HOSTNAME);
  Serial.println(")");

  // ---- 웹 서버 설정 ----
  server.on("/", handleRoot);
  server.begin();
  Serial.print("웹 서버 시작: http://");
  Serial.println(WiFi.localIP());
}

void loop() {
  ArduinoOTA.handle();     // OTA 요청 처리 — 반드시 loop에서 호출
  server.handleClient();   // HTTP 요청 처리
}
