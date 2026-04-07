/**
 * @file  08-http-post-json.ino
 * @brief HTTP POST + JSON 데이터 전송 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * HTTP POST:
 * - 서버에 데이터를 보낼 때 사용 (로그인, 데이터 업로드 등)
 * - 데이터를 바디(body)에 담아 전송
 * - GET과 달리 URL에 데이터가 노출되지 않음
 *
 * JSON (JavaScript Object Notation):
 * - 데이터를 키:값 쌍으로 표현하는 경량 데이터 형식
 * - 예: {"temperature": 25.5, "humidity": 60}
 * - 사람이 읽기 쉽고 거의 모든 언어에서 지원
 *
 * Content-Type 헤더:
 * - 보내는 데이터의 형식을 서버에 알려주는 헤더
 * - JSON: "application/json"
 * - 폼 데이터: "application/x-www-form-urlencoded"
 *
 * 이 예제에서는 ArduinoJson 없이 String으로 JSON을 직접 만듭니다.
 * 복잡한 JSON은 ArduinoJson 라이브러리 사용을 권장합니다.
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h, HTTPClient.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - 인터넷 연결된 Wi-Fi 공유기
 * ---------------------------------------------------------------
 * [연결 방법]
 * - 하드웨어 연결 없음
 * - secrets.h 에 Wi-Fi 정보 입력
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 더미 센서 데이터 (실제 센서 대신 가상 데이터 사용)
// ---------------------------------------------------------------
float fakeTemperature = 22.5f;
int   fakeCount       = 0;

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
bool connectWiFi();
void sendHttpPostJson();
String buildJsonPayload(float temp, int count);

// 타이머
unsigned long lastRequestMs = 0;

// ---------------------------------------------------------------
// setup(): Wi-Fi 연결 및 첫 번째 POST
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== HTTP POST JSON =====");

    if (connectWiFi()) {
        sendHttpPostJson();
        lastRequestMs = millis();
    }
}

// ---------------------------------------------------------------
// loop(): 주기적으로 POST 반복
// ---------------------------------------------------------------
void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[오류] Wi-Fi 끊김");
        delay(1000);
        return;
    }

    if (millis() - lastRequestMs >= REQUEST_INTERVAL_MS) {
        lastRequestMs = millis();

        // 더미 데이터 업데이트
        fakeTemperature += 0.1f;
        fakeCount++;

        sendHttpPostJson();
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
// buildJsonPayload(): JSON 문자열을 만듭니다.
// ---------------------------------------------------------------
String buildJsonPayload(float temp, int count) {
    // String으로 직접 JSON 조합
    String json = "{";
    json += "\"device\":\"ESP32-C3\",";
    json += "\"temperature\":";
    json += String(temp, 1);   // 소수점 1자리
    json += ",\"count\":";
    json += String(count);
    json += "}";
    return json;
}

// ---------------------------------------------------------------
// sendHttpPostJson(): JSON 데이터를 POST로 전송합니다.
// ---------------------------------------------------------------
void sendHttpPostJson() {
    String payload = buildJsonPayload(fakeTemperature, fakeCount);

    Serial.printf("\n[POST] URL: %s\n", SERVER_URL);
    Serial.printf("[POST] 데이터: %s\n", payload.c_str());

    HTTPClient http;
    http.begin(SERVER_URL);

    // Content-Type 헤더 설정 (JSON 형식임을 서버에 알림)
    http.addHeader("Content-Type", "application/json");

    // POST 요청: 상태 코드 반환
    int httpCode = http.POST(payload);

    if (httpCode > 0) {
        Serial.printf("[응답] 상태 코드: %d\n", httpCode);

        if (httpCode == HTTP_CODE_OK) {
            String response = http.getString();
            Serial.println("[응답 본문]");
            if (response.length() > 300) {
                Serial.println(response.substring(0, 300));
                Serial.println("... (이하 생략)");
            } else {
                Serial.println(response);
            }
        }
    } else {
        Serial.printf("[오류] %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
}
