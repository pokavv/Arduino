/**
 * @file  13-webserver-spiffs.ino
 * @brief SPIFFS 파일시스템에서 HTML 파일 서빙 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * SPIFFS (SPI Flash File System):
 * - ESP32 플래시 메모리 안에 파일을 저장하는 파일 시스템
 * - HTML, CSS, JS, 이미지 등을 ESP32에 저장해 웹으로 서빙 가능
 * - 코드에 HTML을 문자열로 넣지 않아도 됩니다.
 *
 * 파일 업로드 방법:
 * - Arduino IDE: 도구 → ESP32 Sketch Data Upload (플러그인 필요)
 *   플러그인: arduino-esp32fs-plugin 설치 필요
 * - 파일은 스케치 폴더 안의 'data/' 폴더에 넣어야 합니다.
 *
 * server.serveStatic():
 * - 특정 URL 경로를 파일시스템의 폴더와 연결합니다.
 * - "/", SPIFFS, "/" → 루트 경로 요청 시 SPIFFS의 루트 폴더에서 파일 제공
 *
 * 중요: SPIFFS.begin(true)에서 true = 마운트 실패 시 자동 포맷
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h, WebServer.h, SPIFFS.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - data/index.html 파일 (스케치 폴더 안에 data/ 폴더 생성 필요)
 * ---------------------------------------------------------------
 * [연결 방법]
 * - 하드웨어 연결 없음
 * - secrets.h 에 Wi-Fi 정보 입력
 * - data/index.html 파일을 만들고 업로드 도구로 SPIFFS에 업로드
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>
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
bool initSPIFFS();
void listFiles();

// ---------------------------------------------------------------
// setup(): SPIFFS 초기화 → Wi-Fi 연결 → 서버 시작
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== 웹 서버 SPIFFS =====");

    // SPIFFS 초기화
    if (!initSPIFFS()) {
        Serial.println("[오류] SPIFFS 초기화 실패");
        return;
    }

    // 파일 목록 출력 (디버그용)
    listFiles();

    if (!connectWiFi()) {
        Serial.println("[오류] Wi-Fi 연결 실패");
        return;
    }

    // SPIFFS 루트 폴더("/")를 웹 루트("/")로 서빙
    // index.html이 자동으로 기본 파일로 제공됩니다.
    server.serveStatic("/", SPIFFS, "/");

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
// initSPIFFS(): SPIFFS를 초기화합니다.
// ---------------------------------------------------------------
bool initSPIFFS() {
    // SPIFFS.begin(formatOnFail): true = 실패 시 자동 포맷
    if (!SPIFFS.begin(true)) {
        return false;
    }

    Serial.printf("[SPIFFS] 초기화 성공 (총: %d bytes, 사용: %d bytes)\n",
                  SPIFFS.totalBytes(),
                  SPIFFS.usedBytes());
    return true;
}

// ---------------------------------------------------------------
// listFiles(): SPIFFS에 저장된 파일 목록을 출력합니다.
// ---------------------------------------------------------------
void listFiles() {
    File root = SPIFFS.open("/");
    File file = root.openNextFile();

    Serial.println("[SPIFFS 파일 목록]");

    if (!file) {
        Serial.println("  (파일 없음 - data/ 폴더에 파일을 추가하세요)");
    }

    while (file) {
        Serial.printf("  %s  (%d bytes)\n",
                      file.name(),
                      file.size());
        file = root.openNextFile();
    }
}
