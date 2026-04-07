/*
 * Storage 04 — SPIFFS 웹서버 파일 서빙
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   웹서버 + 파일 시스템 연동
 *     SPIFFS에 저장된 HTML/CSS/JS 파일을 웹서버로 브라우저에 전송.
 *     ESP32가 웹 호스팅 서버 역할을 한다.
 *     예: /data/index.html → 브라우저에서 ESP32 IP 접속 시 표시
 *
 *   WebServer 라이브러리
 *     HTTP 요청을 처리하는 간단한 웹서버.
 *     on(경로, 핸들러) — 특정 경로 요청 시 함수 호출.
 *     serveStatic() — 파일 시스템에서 직접 파일 서빙.
 *
 *   SPIFFS에 파일 업로드 방법 (arduino-esp32fs-plugin)
 *     1. Arduino IDE 1.x: "ESP32 Sketch Data Upload" 플러그인 사용
 *        → https://github.com/me-no-dev/arduino-esp32fs-plugin
 *        → 스케치 폴더 안에 'data/' 폴더 생성
 *        → 파일을 data/ 폴더에 넣고 플러그인 실행
 *
 *     2. Arduino IDE 2.x: arduino-littlefs-upload 플러그인 사용
 *        → https://github.com/earlephilhower/arduino-littlefs-upload
 *        → LittleFS를 사용하는 경우 권장
 *
 *     3. esptool 직접 사용:
 *        python esptool.py --chip esp32c3 write_flash 0x290000 spiffs.bin
 *
 * [라이브러리]
 *   WebServer — arduino-esp32 기본 내장
 *   SPIFFS    — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드
 *   Wi-Fi 2.4GHz 네트워크
 *
 * [연결 방법]
 *   없음 — USB만 연결 (Wi-Fi로 통신)
 *
 * [사용 방법]
 *   1. secrets.h.example을 복사해 secrets.h로 저장 후 Wi-Fi 정보 입력
 *   2. data/index.html 파일 생성 (아래 예시 참고)
 *   3. SPIFFS에 data 폴더 업로드
 *   4. 업로드 후 시리얼 모니터에서 IP 주소 확인
 *   5. 브라우저에서 해당 IP 접속
 *
 * [data/index.html 예시]
 *   <!DOCTYPE html>
 *   <html><body>
 *   <h1>ESP32-C3 웹서버</h1>
 *   <p>SPIFFS에서 서빙되는 페이지입니다.</p>
 *   </body></html>
 * ================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>
#include "config.h"
#include "secrets.h"

// 웹서버 객체 (포트 80)
WebServer server(WEB_PORT);

// ─── 파일 존재 여부 확인 후 서빙 ─────────────────
void serveFile(const char* path, const char* mimeType) {
    if (SPIFFS.exists(path)) {
        File f = SPIFFS.open(path, "r");
        server.streamFile(f, mimeType);   // 파일 내용을 HTTP 응답으로 전송
        f.close();
    } else {
        // 파일이 없으면 기본 HTML 반환
        server.send(404, "text/plain", "파일을 찾을 수 없습니다: " + String(path));
    }
}

// ─── 루트 경로 "/" 처리 ──────────────────────────
void handleRoot() {
    // /data/index.html 파일 서빙 시도
    if (SPIFFS.exists("/data/index.html")) {
        serveFile("/data/index.html", "text/html");
    } else {
        // index.html이 없으면 기본 페이지 생성해서 반환
        String html = "<!DOCTYPE html><html><head>";
        html += "<meta charset='utf-8'>";
        html += "<title>ESP32-C3 웹서버</title></head><body>";
        html += "<h1>ESP32-C3 SPIFFS 웹서버</h1>";
        html += "<p>/data/index.html 파일이 없습니다.</p>";
        html += "<p>SPIFFS에 파일을 업로드하세요.</p>";
        html += "<hr><p><a href='/files'>파일 목록 보기</a></p>";
        html += "</body></html>";
        server.send(200, "text/html; charset=utf-8", html);
    }
}

// ─── /files 경로: SPIFFS 파일 목록 ──────────────
void handleFileList() {
    String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>";
    html += "<title>파일 목록</title></head><body>";
    html += "<h2>SPIFFS 파일 목록</h2><ul>";

    File root = SPIFFS.open("/");
    File entry = root.openNextFile();
    while (entry) {
        html += "<li>";
        html += entry.name();
        html += " (";
        html += entry.size();
        html += " bytes)</li>";
        entry.close();
        entry = root.openNextFile();
    }

    html += "</ul>";
    html += "<p>사용: " + String(SPIFFS.usedBytes()) + " / ";
    html += String(SPIFFS.totalBytes()) + " bytes</p>";
    html += "<p><a href='/'>홈으로</a></p>";
    html += "</body></html>";

    server.send(200, "text/html; charset=utf-8", html);
}

// ─── 404 처리 ────────────────────────────────────
void handleNotFound() {
    server.send(404, "text/plain", "404 Not Found: " + server.uri());
}

void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n=== SPIFFS 웹서버 예제 ===");

    // ── SPIFFS 초기화 ──
    if (!SPIFFS.begin(true)) {
        Serial.println("SPIFFS 초기화 실패!");
        return;
    }
    Serial.println("SPIFFS 초기화 성공.");

    // ── Wi-Fi 연결 ──
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Wi-Fi 연결 중");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("연결 성공! IP 주소: ");
    Serial.println(WiFi.localIP());
    Serial.print("브라우저에서 http://");
    Serial.print(WiFi.localIP());
    Serial.println("/ 접속하세요.");

    // ── 라우트 등록 ──
    server.on("/",       handleRoot);       // 루트 경로
    server.on("/files",  handleFileList);   // 파일 목록
    server.onNotFound(handleNotFound);      // 404

    // ── 웹서버 시작 ──
    server.begin();
    Serial.print("웹서버 시작. 포트: ");
    Serial.println(WEB_PORT);
}

void loop() {
    // 클라이언트 요청 처리 (반드시 loop에서 호출)
    server.handleClient();
}
