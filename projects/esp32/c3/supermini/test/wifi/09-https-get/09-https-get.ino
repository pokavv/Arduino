/**
 * @file  09-https-get.ino
 * @brief HTTPS GET 요청 예제 (TLS 암호화)
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * HTTPS = HTTP + TLS(Transport Layer Security) 암호화
 * - 데이터가 암호화되어 전송되므로 도청·변조를 방지합니다.
 * - 포트 443번 사용 (HTTP는 80번)
 * - 인증서(Certificate)로 서버 신원을 검증합니다.
 *
 * WiFiClientSecure:
 * - TLS를 지원하는 Wi-Fi 클라이언트 클래스
 *
 * 인증서 검증 방법 3가지:
 * 1. client.setInsecure()     : 인증서 검증 생략 (테스트용!)
 * 2. client.setCACert(cert)   : 서버의 루트 인증서 직접 지정
 * 3. client.setCertificate()  : 클라이언트 인증서 (상호 인증)
 *
 * ※ setInsecure()는 테스트/학습용으로만 사용하세요!
 *   중간자 공격(MITM)에 취약합니다.
 *   실제 제품에는 반드시 인증서를 검증해야 합니다.
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h, HTTPClient.h, WiFiClientSecure.h (ESP32 Arduino 내장)
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
#include <WiFiClientSecure.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
bool connectWiFi();
void sendHttpsGet();

// 타이머
unsigned long lastRequestMs = 0;

// ---------------------------------------------------------------
// setup(): Wi-Fi 연결 및 첫 번째 HTTPS GET
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== HTTPS GET (TLS 암호화) =====");

    if (connectWiFi()) {
        sendHttpsGet();
        lastRequestMs = millis();
    }
}

// ---------------------------------------------------------------
// loop(): 주기적으로 HTTPS GET 반복
// ---------------------------------------------------------------
void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[오류] Wi-Fi 끊김");
        delay(1000);
        return;
    }

    if (millis() - lastRequestMs >= REQUEST_INTERVAL_MS) {
        lastRequestMs = millis();
        sendHttpsGet();
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
// sendHttpsGet(): HTTPS GET 요청을 보냅니다.
// ---------------------------------------------------------------
void sendHttpsGet() {
    Serial.printf("\n[HTTPS GET] %s\n", SERVER_URL);

    // WiFiClientSecure: TLS를 지원하는 클라이언트
    WiFiClientSecure secureClient;

    // ※ 테스트용: 인증서 검증 생략
    // 실제 제품에서는 setCACert()로 인증서를 지정하세요!
    secureClient.setInsecure();

    HTTPClient http;
    http.begin(secureClient, SERVER_URL);

    int httpCode = http.GET();

    if (httpCode > 0) {
        Serial.printf("[응답] 상태 코드: %d\n", httpCode);

        if (httpCode == HTTP_CODE_OK) {
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
        Serial.printf("[오류] %s\n", http.errorToString(httpCode).c_str());
        Serial.println("[참고] HTTPS 연결 실패 원인:");
        Serial.println("  - 서버가 TLS 1.2/1.3 미지원");
        Serial.println("  - 시간 동기화 문제 (NTP 먼저 설정 권장)");
    }

    http.end();
}
