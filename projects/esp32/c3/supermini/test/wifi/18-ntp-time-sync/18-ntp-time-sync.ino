/**
 * @file  18-ntp-time-sync.ino
 * @brief NTP 시간 동기화 예제 (한국 표준시 KST)
 *
 * ---------------------------------------------------------------
 * [핵심 개념]
 * NTP (Network Time Protocol):
 * - 인터넷의 타임 서버에서 정확한 시간을 가져오는 프로토콜
 * - ESP32는 내장 RTC가 없어 전원을 켤 때마다 시간이 초기화됩니다.
 * - NTP 동기화 후에는 정확한 현재 시간을 알 수 있습니다.
 *
 * configTime() 함수:
 * - configTime(gmtOffset_sec, daylightOffset_sec, ntpServer)
 * - gmtOffset_sec: UTC와의 시차 (초 단위)
 *   한국(KST) = UTC+9 = 9 * 3600 = 32400초
 * - daylightOffset_sec: 서머타임 보정 (한국 = 0)
 *
 * 시간 읽기:
 * - getLocalTime(&timeinfo) → struct tm에 현재 시간 저장
 * - strftime()으로 원하는 형식의 문자열로 변환
 *
 * struct tm 구조:
 * - tm_year: 1900년 기준 연도 (2024년 = 124)
 * - tm_mon : 월 (0~11, 0=1월)
 * - tm_mday: 일 (1~31)
 * - tm_hour: 시 (0~23)
 * - tm_min : 분 (0~59)
 * - tm_sec : 초 (0~59)
 * ---------------------------------------------------------------
 * [라이브러리]
 * - WiFi.h (ESP32 Arduino 내장)
 * - time.h (C 표준 라이브러리, 내장)
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
#include <time.h>
#include "secrets.h"
#include "config.h"

// ---------------------------------------------------------------
// 함수 선언
// ---------------------------------------------------------------
bool connectWiFi();
void syncNTP();
void printCurrentTime();

// 타이머
unsigned long lastPrintMs = 0;
bool          timeSynced  = false;

// ---------------------------------------------------------------
// setup(): Wi-Fi 연결 → NTP 동기화
// ---------------------------------------------------------------
void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n===== NTP 시간 동기화 (KST) =====");

    if (connectWiFi()) {
        syncNTP();
    }
}

// ---------------------------------------------------------------
// loop(): 주기적으로 현재 시각 출력
// ---------------------------------------------------------------
void loop() {
    if (millis() - lastPrintMs >= TIME_PRINT_MS) {
        lastPrintMs = millis();
        printCurrentTime();
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
// syncNTP(): NTP 서버와 시간을 동기화합니다.
// ---------------------------------------------------------------
void syncNTP() {
    Serial.printf("[NTP] 서버: %s  시간대: UTC+%d\n",
                  NTP_SERVER, TZ_OFFSET / 3600);

    // 시간 설정: UTC 오프셋, DST 오프셋, NTP 서버
    configTime(TZ_OFFSET, DST_OFFSET, NTP_SERVER);

    // 동기화 완료 대기
    Serial.print("[NTP] 동기화 중");
    struct tm timeinfo;
    unsigned long startMs = millis();

    while (!getLocalTime(&timeinfo)) {
        if (millis() - startMs >= 10000) {
            Serial.println(" 실패! (10초 타임아웃)");
            return;
        }
        delay(500);
        Serial.print(".");
    }

    Serial.println(" 완료!");
    timeSynced = true;

    // 동기화된 시간 출력
    char timeStr[64];
    strftime(timeStr, sizeof(timeStr), "%Y년 %m월 %d일 %H:%M:%S", &timeinfo);
    Serial.printf("[NTP] 현재 시각: %s (KST)\n", timeStr);
}

// ---------------------------------------------------------------
// printCurrentTime(): 현재 시각을 출력합니다.
// ---------------------------------------------------------------
void printCurrentTime() {
    if (!timeSynced) {
        Serial.println("[시간] 동기화 전");
        return;
    }

    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("[시간] 읽기 실패");
        return;
    }

    // strftime()으로 원하는 형식의 문자열 생성
    char dateStr[32];
    char timeStr[32];
    char dayStr[16];

    strftime(dateStr, sizeof(dateStr), "%Y-%m-%d", &timeinfo);
    strftime(timeStr, sizeof(timeStr), "%H:%M:%S", &timeinfo);
    strftime(dayStr,  sizeof(dayStr),  "%A",        &timeinfo);

    Serial.printf("[시각] %s  %s  (%s)\n", dateStr, timeStr, dayStr);
}
