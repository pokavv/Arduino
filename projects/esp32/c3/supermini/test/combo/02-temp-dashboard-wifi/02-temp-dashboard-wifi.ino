/*
 * combo/02-temp-dashboard-wifi — DHT22 + Wi-Fi 웹 대시보드
 * ================================================================
 *
 * [핵심 개념 설명]
 *   웹 대시보드
 *     - ESP32가 웹 서버가 되어 브라우저에 HTML 페이지 제공
 *     - 같은 Wi-Fi에 있는 스마트폰/PC에서 접속 가능
 *     - JavaScript로 5초마다 자동 새로고침 구현
 *
 * [라이브러리]
 *   DHT sensor library (Adafruit) — 라이브러리 매니저에서 설치
 *   WebServer — ESP32 Arduino SDK 내장
 *
 * [준비물]
 *   - DHT22 센서 모듈 1개
 *   - Wi-Fi 공유기 (인터넷 연결 불필요, 같은 네트워크면 충분)
 *
 * [연결 방법]
 *   G2 (DHT_PIN) → DHT22 DATA
 *   3.3V         → DHT22 VCC
 *   GND          → DHT22 GND
 *
 *   브라우저에서 http://[IP주소]/ 접속 (IP는 시리얼 모니터 확인)
 */

#include "config.h"
#include "secrets.h"
#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>

DHT dht(DHT_PIN, DHT22);
WebServer server(WEB_PORT);

float temperature = 0.0f;
float humidity    = 0.0f;
unsigned long lastReadTime = 0;

// ---- 메인 페이지 HTML 생성 및 응답 ----
void handleRoot() {
  // HTML을 String으로 조합
  // REFRESH_INTERVAL_SEC 초마다 자동 새로고침
  String html = "<!DOCTYPE html><html lang='ko'><head>";
  html += "<meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
  html += "<meta http-equiv='refresh' content='";
  html += String(REFRESH_INTERVAL_SEC);
  html += "'>";  // 자동 새로고침 메타 태그
  html += "<title>ESP32 온습도 대시보드</title>";
  html += "<style>";
  html += "body{font-family:Arial,sans-serif;background:#1a1a2e;color:#eee;text-align:center;padding:20px;}";
  html += ".card{background:#16213e;border-radius:12px;padding:30px;margin:15px auto;max-width:300px;}";
  html += ".value{font-size:3em;font-weight:bold;color:#0f3460;}";
  html += ".temp{color:#e94560;} .hum{color:#0f9b8e;}";
  html += ".label{font-size:1.2em;margin-top:8px;}";
  html += ".time{font-size:0.9em;color:#888;margin-top:20px;}";
  html += "</style></head><body>";
  html += "<h2>ESP32-C3 온습도 모니터</h2>";

  html += "<div class='card'>";
  html += "<div class='value temp'>";
  html += String(temperature, 1);
  html += "°C</div>";
  html += "<div class='label'>온도 (Temperature)</div>";
  html += "</div>";

  html += "<div class='card'>";
  html += "<div class='value hum'>";
  html += String(humidity, 1);
  html += "%</div>";
  html += "<div class='label'>습도 (Humidity)</div>";
  html += "</div>";

  html += "<div class='time'>가동 시간: ";
  html += String(millis() / 1000);
  html += "초 | ";
  html += String(REFRESH_INTERVAL_SEC);
  html += "초마다 자동 새로고침</div>";
  html += "</body></html>";

  server.send(200, "text/html; charset=utf-8", html);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" DHT22 웹 대시보드");
  Serial.println("===================================");

  dht.begin();
  delay(2000);  // DHT22 안정화

  // ---- Wi-Fi 연결 ----
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Wi-Fi 연결 중");

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500); Serial.print("."); retries++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n[오류] Wi-Fi 연결 실패!");
    while (true) { delay(1000); }
  }

  Serial.println("\n연결 성공!");
  Serial.print("브라우저에서 접속: http://");
  Serial.println(WiFi.localIP());

  server.on("/", handleRoot);
  server.begin();
  Serial.println("서버 시작");
}

void loop() {
  server.handleClient();  // HTTP 요청 처리

  // DHT22 주기적 읽기
  if (millis() - lastReadTime >= UPDATE_INTERVAL) {
    lastReadTime = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      temperature = t;
      humidity    = h;
    }
  }
}
