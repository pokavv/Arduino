/*
 * OTA 01 — ArduinoOTA 기본 설정
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   OTA (Over The Air)
 *     USB 케이블 없이 Wi-Fi 네트워크를 통해 펌웨어를 업데이트하는 방법.
 *     장치가 천장, 벽, 먼 곳에 설치되어 있어도 업데이트 가능.
 *
 *   ArduinoOTA 동작 원리
 *     ESP32가 Wi-Fi에 연결되면 특정 포트(기본 3232)를 열고 대기.
 *     Arduino IDE에서 "네트워크 포트"를 선택하면 UDP 브로드캐스트로
 *     ESP32를 찾아 펌웨어를 전송.
 *     mDNS를 사용해 "esp32c3.local" 같은 이름으로 찾을 수 있음.
 *
 *   OTA 업데이트 절차
 *     1. 이 코드를 USB로 처음 업로드 (최초 1회)
 *     2. 이후부터는 Arduino IDE → 도구 → 포트에서
 *        "esp32c3 at 192.168.x.x" 같은 네트워크 포트 선택
 *     3. 업로드 버튼 클릭 → Wi-Fi로 전송
 *
 *   주의사항
 *     OTA 코드가 없는 펌웨어로 업데이트하면 다시 USB로 연결해야 함!
 *     새 펌웨어에도 항상 OTA 코드를 포함시킬 것.
 *
 * [라이브러리]
 *   ArduinoOTA — arduino-esp32 기본 내장 (별도 설치 불필요)
 *   WiFi       — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드
 *   Wi-Fi 2.4GHz 네트워크
 *   Arduino IDE (컴퓨터와 ESP32가 같은 Wi-Fi에 연결 필요)
 *
 * [연결 방법]
 *   없음 — USB만 연결 (최초 1회 업로드 후 Wi-Fi로 이후 업로드)
 *
 * [사용 방법]
 *   secrets.h.example → secrets.h로 복사 후 Wi-Fi 정보 입력
 * ================================================================
 */

#include <WiFi.h>
#include <ArduinoOTA.h>
#include "config.h"
#include "secrets.h"

// ─── Wi-Fi 연결 ───────────────────────────────────
void connectWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    Serial.print("Wi-Fi 연결 중");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("연결 완료! IP: ");
    Serial.println(WiFi.localIP());
}

// ─── OTA 초기화 ──────────────────────────────────
void setupOTA() {
    // ── 포트 설정 ──
    ArduinoOTA.setPort(OTA_PORT);

    // ── 장치 이름 설정 ──
    // Arduino IDE 포트 메뉴에 이 이름으로 표시됨
    ArduinoOTA.setHostname(OTA_HOSTNAME);

    // ── OTA 이벤트 콜백 ──
    // 업데이트 시작
    ArduinoOTA.onStart([]() {
        String type = (ArduinoOTA.getCommand() == U_FLASH) ? "펌웨어" : "파일시스템";
        Serial.print("OTA 시작: ");
        Serial.println(type);
    });

    // 업데이트 완료
    ArduinoOTA.onEnd([]() {
        Serial.println("\nOTA 완료! 재시작합니다...");
    });

    // 진행률 (0~100%)
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        int percent = progress / (total / 100);
        Serial.print("업로드: ");
        Serial.print(percent);
        Serial.println("%");
    });

    // 오류 발생
    ArduinoOTA.onError([](ota_error_t error) {
        Serial.print("OTA 오류: ");
        switch (error) {
            case OTA_AUTH_ERROR:    Serial.println("인증 실패");   break;
            case OTA_BEGIN_ERROR:   Serial.println("시작 실패");   break;
            case OTA_CONNECT_ERROR: Serial.println("연결 실패");   break;
            case OTA_RECEIVE_ERROR: Serial.println("수신 실패");   break;
            case OTA_END_ERROR:     Serial.println("종료 실패");   break;
        }
    });

    // ── OTA 시작 ──
    ArduinoOTA.begin();

    Serial.println("OTA 준비 완료!");
    Serial.print("장치 이름: ");
    Serial.println(OTA_HOSTNAME);
    Serial.print("포트: ");
    Serial.println(OTA_PORT);
    Serial.println("Arduino IDE → 도구 → 포트에서 네트워크 포트를 선택하세요.");
}

void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n=== ArduinoOTA 기본 예제 ===");

    connectWiFi();
    setupOTA();
}

void loop() {
    // ── OTA 요청 처리 (반드시 loop에서 호출) ──
    // ArduinoOTA.handle()이 없으면 OTA 업데이트 불가
    ArduinoOTA.handle();

    // ── 메인 작업 ──
    // 여기에 실제 장치 로직을 추가하면 됨
    // 단, delay()를 길게 쓰면 OTA 응답이 느려짐 → millis() 권장
}
