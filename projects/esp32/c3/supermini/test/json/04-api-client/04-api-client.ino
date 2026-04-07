/*
 * json/04-api-client — HTTP JSON API 클라이언트 예제
 * ================================================================
 *
 * [핵심 개념 설명]
 *   HTTP 클라이언트
 *     - ESP32가 인터넷의 API 서버에 HTTP 요청을 보내고 응답을 받음
 *     - 날씨 API, 스마트홈 서비스, 공공 데이터 API 등 연동에 활용
 *
 *   HTTPClient 라이브러리 사용 흐름
 *     1) http.begin(URL): 연결 대상 설정
 *     2) http.GET(): HTTP GET 요청 전송
 *     3) http.getString(): 응답 본문(Body) 가져오기
 *     4) http.end(): 연결 해제 (반드시 호출!)
 *
 *   테스트 API (JSONPlaceholder)
 *     - https://jsonplaceholder.typicode.com/
 *     - 무료 가짜 REST API 서버 (테스트용)
 *     - /todos/1: {"userId":1,"id":1,"title":"...","completed":false}
 *
 * [라이브러리]
 *   ArduinoJson (Benoit Blanchon) — 라이브러리 매니저에서 설치
 *   HTTPClient — ESP32 Arduino SDK 내장
 *
 * [준비물]
 *   없음 — Wi-Fi 공유기와 인터넷 연결 필요
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"
#include "secrets.h"      // WIFI_SSID, WIFI_PASSWORD
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

unsigned long lastRequestTime = 0;  // 마지막 API 호출 시각

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" HTTP JSON API 클라이언트 예제");
  Serial.println("===================================");
  Serial.print("API URL: ");
  Serial.println(API_URL);
  Serial.println();

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
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  // 즉시 첫 번째 요청
  fetchAndParseJson();
  lastRequestTime = millis();
}

void loop() {
  // REQUEST_INTERVAL(10초)마다 API 호출
  if (millis() - lastRequestTime >= REQUEST_INTERVAL) {
    lastRequestTime = millis();
    fetchAndParseJson();
  }
}

// ---- HTTP GET 요청 후 JSON 파싱 함수 ----
void fetchAndParseJson() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[경고] Wi-Fi 연결 끊어짐. 재연결 시도...");
    WiFi.reconnect();
    return;
  }

  Serial.println("--- API 호출 중 ---");
  Serial.print("URL: ");
  Serial.println(API_URL);

  HTTPClient http;
  http.begin(API_URL);                    // 대상 URL 설정
  http.setTimeout(HTTP_TIMEOUT_MS);       // 응답 대기 타임아웃 설정

  int httpCode = http.GET();              // HTTP GET 요청 전송

  if (httpCode != HTTP_CODE_200) {        // 200 = OK
    Serial.print("[오류] HTTP 응답 코드: ");
    Serial.println(httpCode);
    http.end();
    return;
  }

  Serial.print("HTTP 응답 코드: ");
  Serial.println(httpCode);

  String responseBody = http.getString(); // 응답 본문 가져오기
  http.end();                             // 연결 해제 (반드시 호출!)

  Serial.print("응답 본문: ");
  Serial.println(responseBody);

  // ---- JSON 파싱 ----
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, responseBody);

  if (error) {
    Serial.print("[오류] JSON 파싱 실패: ");
    Serial.println(error.c_str());
    return;
  }

  // ---- 파싱된 값 추출 ----
  // jsonplaceholder /todos/1 응답: {"userId":1,"id":1,"title":"...","completed":false}
  Serial.println("--- 파싱 결과 ---");
  Serial.print("  userId    : "); Serial.println(doc["userId"].as<int>());
  Serial.print("  id        : "); Serial.println(doc["id"].as<int>());
  Serial.print("  title     : "); Serial.println(doc["title"].as<const char*>());
  Serial.print("  completed : "); Serial.println(doc["completed"].as<bool>() ? "완료" : "미완료");
  Serial.println();
}
