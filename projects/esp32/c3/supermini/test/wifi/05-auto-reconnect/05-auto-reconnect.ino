/**
 * @file  05-auto-reconnect.ino
 * @brief Wi-Fi 자동 재연결 예제
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * Wi-Fi 연결이 끊겼을 때 자동으로 다시 연결하는 방법입니다.
 *
 * WiFi.status() 반환값:
 * - WL_CONNECTED     (3): 연결됨
 * - WL_DISCONNECTED  (6): 연결 끊김
 * - WL_CONNECT_FAILED(4): 연결 실패 (비밀번호 오류 등)
 * - WL_NO_SSID_AVAIL (1): SSID를 찾을 수 없음
 *
 * 자동 재연결 패턴:
 *   loop()에서 주기적으로 WiFi.status()를 확인합니다.
 *   WL_CONNECTED가 아니면 WiFi.begin()을 다시 호출합니다.
 *   재연결 시도 간격은 RECONNECT_DELAY_MS로 조절합니다.
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h (ESP32 Arduino 내장)
 * ---------------------------------------------------------------
 * [준비물]
 * - ESP32-C3 Super Mini x1
 * - 2.4GHz Wi-Fi 공유기
 * ---------------------------------------------------------------
 * [연결 방법]
 * - secrets.h 에 Wi-Fi 정보 입력
 * - 공유기 전원을 껐다 켜서 재연결 동작을 확인할 수 있습니다.
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 상태 변수
// ---------------------------------------------------------------
unsigned long lastReconnectMs = 0;   // 마지막 재연결 시도 시각
unsigned long lastStatusMs    = 0;   // 마지막 상태 출력 시각
bool          wasConnected    = false;   // 이전 연결 상태 (변화 감지용)

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
void tryConnect();
void checkConnectionChange();
void printStatus();

// ---------------------------------------------------------------
// setup(): 초기화
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== Wi-Fi 자동 재연결 =====");

    WiFi.mode(WIFI_STA);

    // ESP32 내장 자동 재연결 기능 활성화 (선택 사항)
    // WiFi.setAutoReconnect(true) 는 일부 환경에서 불안정할 수 있어
    // 직접 재연결 로직을 구현하는 것이 더 안정적입니다.
    WiFi.setAutoReconnect(false);

    tryConnect();
}

// ---------------------------------------------------------------
// loop(): 연결 상태 감시 및 자동 재연결
// ---------------------------------------------------------------
void loop() {
    // 연결 상태 변화 감지 (연결↔끊김 이벤트 출력)
    checkConnectionChange();

    // 연결 끊김 시 재연결 시도
    if (WiFi.status() != WL_CONNECTED) {
        if (millis() - lastReconnectMs >= RECONNECT_DELAY_MS) {
            lastReconnectMs = millis();
            Serial.println("[재연결] Wi-Fi 재연결 시도...");
            tryConnect();
        }
    }

    // 주기적 상태 출력
    if (millis() - lastStatusMs >= STATUS_PRINT_MS) {
        lastStatusMs = millis();
        printStatus();
    }
}

// ---------------------------------------------------------------
// tryConnect(): Wi-Fi 연결을 시도합니다.
// ---------------------------------------------------------------
void tryConnect() {
    WiFi.disconnect();
    delay(100);

    Serial.printf("[연결] SSID: %s 시도 중...\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

// ---------------------------------------------------------------
// checkConnectionChange(): 연결 상태 변화를 감지해 알림 출력
// ---------------------------------------------------------------
void checkConnectionChange() {
    bool isNowConnected = (WiFi.status() == WL_CONNECTED);

    if (isNowConnected && !wasConnected) {
        // 새로 연결됨
        Serial.printf("[연결됨] IP: %s  RSSI: %d dBm\n",
                      WiFi.localIP().toString().c_str(),
                      WiFi.RSSI());
    } else if (!isNowConnected && wasConnected) {
        // 연결이 끊김
        Serial.println("[끊김] Wi-Fi 연결이 끊어졌습니다.");
    }

    wasConnected = isNowConnected;
}

// ---------------------------------------------------------------
// printStatus(): 현재 연결 상태를 출력합니다.
// ---------------------------------------------------------------
void printStatus() {
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("[상태] 연결됨  IP: %s  RSSI: %d dBm\n",
                      WiFi.localIP().toString().c_str(),
                      WiFi.RSSI());
    } else {
        Serial.printf("[상태] 끊김 (status=%d)\n", WiFi.status());
    }
}
