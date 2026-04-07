/**
 * @file  07-http-get.ino
 * @brief HTTP GET 요청 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * HTTP(HyperText Transfer Protocol):
 * - 웹 브라우저와 서버가 데이터를 주고받는 규칙(프로토콜)
 * - 포트 80번 사용
 *
 * HTTP 요청 구조:
 *   [메서드] [경로] HTTP/1.1
 *   Host: 서버주소
 *   (헤더들)
 *   (빈 줄)
 *   (바디 - GET은 없음)
 *
 * HTTP GET:
 * - 서버에서 데이터를 가져올 때 사용
 * - URL에 파라미터를 포함 (?key=value)
 * - 바디(body) 없음
 *
 * HTTPClient 클래스:
 * - http.begin(url)   : 연결 준비
 * - http.GET()        : GET 요청 실행 → 상태코드 반환
 * - http.getString()  : 응답 본문 문자열로 가져오기
 * - http.end()        : 연결 종료 (반드시 호출!)
 *
 * HTTP 상태 코드:
 * - 200 OK            : 성공
 * - 404 Not Found     : 경로 없음
 * - 500 Server Error  : 서버 오류
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
// 함수 선언
// ---------------------------------------------------------------
bool connectWiFi();
void sendHttpGet();

// 타이머
unsigned long lastRequestMs = 0;

// ---------------------------------------------------------------
// setup(): Wi-Fi 연결 후 첫 번째 GET 요청
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== HTTP GET 요청 =====");

    if (connectWiFi()) {
        sendHttpGet();
        lastRequestMs = millis();
    }
}

// ---------------------------------------------------------------
// loop(): 주기적으로 GET 요청 반복
// ---------------------------------------------------------------
void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[오류] Wi-Fi 끊김");
        delay(1000);
        return;
    }

    if (millis() - lastRequestMs >= REQUEST_INTERVAL_MS) {
        lastRequestMs = millis();
        sendHttpGet();
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
// sendHttpGet(): HTTP GET 요청을 보내고 응답을 출력합니다.
// ---------------------------------------------------------------
void sendHttpGet() {
    // URL 조합: http://호스트/경로
    String url = "http://";
    url += SERVER_HOST;
    url += SERVER_PATH;

    Serial.printf("\n[GET] %s\n", url.c_str());

    HTTPClient http;

    // 연결 준비
    http.begin(url);

    // GET 요청 실행 → HTTP 상태 코드 반환
    int httpCode = http.GET();

    if (httpCode > 0) {
        Serial.printf("[응답] 상태 코드: %d\n", httpCode);

        if (httpCode == HTTP_CODE_OK) {
            // 응답 본문 출력 (길면 잘라서 출력)
            String payload = http.getString();
            Serial.println("[응답 본문]");

            if (payload.length() > 300) {
                Serial.println(payload.substring(0, 300));
                Serial.println("... (이하 생략)");
            } else {
                Serial.println(payload);
            }
        }
    } else {
        // httpCode < 0 이면 연결 자체 실패
        Serial.printf("[오류] 연결 실패: %s\n", http.errorToString(httpCode).c_str());
    }

    // 연결 종료 (반드시 호출해야 메모리 누수 방지)
    http.end();
}
