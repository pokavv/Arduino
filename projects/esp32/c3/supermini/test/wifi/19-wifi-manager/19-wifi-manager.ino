/**
 * @file  19-wifi-manager.ino
 * @brief WiFiManager 자동 Wi-Fi 설정 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * WiFiManager 동작 흐름:
 *
 * [처음 사용 / Wi-Fi 정보 없을 때]
 *   1. 저장된 Wi-Fi 정보가 없음
 *   2. ESP32가 AP 모드로 "ESP32-Config" 열기
 *   3. 스마트폰에서 "ESP32-Config" 접속 → 192.168.4.1 자동 열림
 *   4. 웹 페이지에서 주변 Wi-Fi 목록 선택 + 비밀번호 입력
 *   5. 정보 저장 후 자동 재시작 → STA 모드로 연결
 *
 * [이미 설정된 경우]
 *   1. 저장된 Wi-Fi 정보로 자동 연결 시도
 *   2. 연결 성공 → 정상 동작
 *   3. 연결 실패 → 다시 AP 포털 열기
 *
 * WiFiManager 주요 메서드:
 * - wm.autoConnect("AP이름")  : 자동 연결 (핵심 메서드)
 * - wm.resetSettings()        : 저장된 Wi-Fi 정보 삭제 (초기화)
 * - wm.setConfigPortalTimeout(초): 포털 타임아웃 설정
 *
 * secrets.h 불필요:
 * - WiFiManager가 Wi-Fi 정보를 직접 관리합니다.
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFiManager (Arduino IDE → 라이브러리 관리 → "WiFiManager" 검색)
 *   제작자: tzapu 또는 tablatronix (ESP32 지원 버전 설치)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - 스마트폰 (초기 설정용)
 * ---------------------------------------------------------------
 * [연결 방법]
 * - 하드웨어 연결 없음
 * - 처음 실행 시 스마트폰에서 "ESP32-Config" Wi-Fi에 접속
 * - 자동으로 설정 페이지 열림 → Wi-Fi 선택 → 비밀번호 입력
 * - Wi-Fi 정보를 초기화하려면 시리얼에 'r' 입력
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include <WiFiManager.h>
#include "config.h"

// ---------------------------------------------------------------
// 전역 변수
// ---------------------------------------------------------------
WiFiManager wifiManager;
bool        wifiConnected = false;

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
void setupWiFiManager();
void checkSerialInput();

// ---------------------------------------------------------------
// setup(): WiFiManager로 자동 Wi-Fi 연결
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== WiFiManager 자동 Wi-Fi 설정 =====");
    Serial.println("시리얼에 'r' 입력: Wi-Fi 정보 초기화");

    setupWiFiManager();
}

// ---------------------------------------------------------------
// loop(): 연결 상태 확인 및 시리얼 입력 처리
// ---------------------------------------------------------------
void loop() {
    checkSerialInput();

    static unsigned long lastMs = 0;
    if (millis() - lastMs >= 5000) {
        lastMs = millis();

        if (WiFi.status() == WL_CONNECTED) {
            Serial.printf("[상태] 연결됨  IP: %s  RSSI: %d dBm\n",
                          WiFi.localIP().toString().c_str(),
                          WiFi.RSSI());
        } else {
            Serial.println("[상태] 연결 끊김");
        }
    }
}

// ---------------------------------------------------------------
// setupWiFiManager(): WiFiManager 설정 및 연결
// ---------------------------------------------------------------
void setupWiFiManager() {
    // 설정 포털 타임아웃 (이 시간 안에 설정 없으면 재시도)
    wifiManager.setConfigPortalTimeout(CONFIG_PORTAL_TIMEOUT);

    // 디버그 출력 비활성화 (필요 시 true로)
    wifiManager.setDebugOutput(false);

    // autoConnect():
    // - 저장된 Wi-Fi 있으면 자동 연결 시도
    // - 없거나 실패하면 "PORTAL_AP_NAME" AP를 열고 설정 대기
    // - 반환값: true=연결 성공, false=실패
    Serial.printf("[WiFiManager] '%s' AP 또는 자동 연결 시도 중...\n",
                  PORTAL_AP_NAME);

    if (wifiManager.autoConnect(PORTAL_AP_NAME)) {
        wifiConnected = true;
        Serial.println("[WiFiManager] Wi-Fi 연결 성공!");
        Serial.printf("[연결] IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
        wifiConnected = false;
        Serial.println("[WiFiManager] 연결 실패 또는 타임아웃");
        Serial.println("[안내] ESP32를 재시작하면 다시 시도합니다.");
        // 필요 시 ESP.restart()로 재시작
    }
}

// ---------------------------------------------------------------
// checkSerialInput(): 시리얼 입력으로 Wi-Fi 초기화
// ---------------------------------------------------------------
void checkSerialInput() {
    if (!Serial.available()) {
        return;
    }

    char input = Serial.read();

    if (input == 'r' || input == 'R') {
        Serial.println("[초기화] Wi-Fi 정보를 삭제합니다...");
        wifiManager.resetSettings();   // 저장된 Wi-Fi 정보 삭제
        Serial.println("[초기화] 완료! 재시작합니다...");
        delay(1000);
        ESP.restart();   // ESP32 재시작
    }
}
