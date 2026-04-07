/*
 * OTA 04 — 딥슬립 장치에 OTA 적용하기
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   딥슬립과 OTA의 충돌 문제
 *     딥슬립 장치는 대부분의 시간 동안 꺼져 있어 OTA 연결 불가.
 *     해결책: 웨이크업마다 잠시 "OTA 대기창(Window)"을 열어 둔다.
 *
 *   OTA 대기창 (OTA Window) 패턴
 *     웨이크업 → Wi-Fi 연결 → OTA 준비
 *     → 30초 대기 (이 시간에 Arduino IDE에서 업로드 가능)
 *     → 업데이트 없으면 → 딥슬립 진입
 *
 *   동작 흐름
 *     ┌────────┐  깨어남  ┌──────────┐ OTA대기 ┌──────────┐
 *     │딥슬립  │ ───────→ │Wi-Fi연결 │ ──────→ │OTA 30초  │
 *     │(1시간) │          └──────────┘         │대기창    │
 *     └────────┘                                └──────────┘
 *          ↑                                         │업데이트 없음
 *          └──────── 딥슬립 진입 ←───────────────────┘
 *
 *   업데이트 방법
 *     1. 보드가 웨이크업할 때를 기다림 (또는 리셋 버튼으로 강제 웨이크업)
 *     2. 시리얼 모니터에서 "OTA 대기창 열림" 확인
 *     3. 30초 내에 Arduino IDE에서 네트워크 포트로 업로드
 *
 *   OTA_WINDOW_MS 조정 팁
 *     너무 짧으면 → 업로드 시간 부족 (실패)
 *     너무 길면   → 배터리 낭비
 *     권장: 15~60초
 *
 * [라이브러리]
 *   ArduinoOTA — arduino-esp32 기본 내장
 *   WiFi       — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드
 *   Wi-Fi 2.4GHz 네트워크
 *
 * [연결 방법]
 *   없음 — USB만 연결
 *
 * [사용 방법]
 *   secrets.h.example → secrets.h 복사 후 Wi-Fi 정보 입력
 * ================================================================
 */

#include <WiFi.h>
#include <ArduinoOTA.h>
#include "config.h"
#include "secrets.h"

// 딥슬립 중에도 유지되는 변수
RTC_DATA_ATTR int wakeupCount    = 0;    // 웨이크업 횟수
RTC_DATA_ATTR bool otaRequested  = false; // OTA 요청 플래그

// OTA 업데이트가 시작되었는지 추적
bool otaInProgress = false;

// ─── Wi-Fi 연결 ───────────────────────────────────
bool connectWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Wi-Fi 연결 중");
    uint32_t start = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - start > 10000) {  // 10초 타임아웃
            Serial.println(" 타임아웃!");
            return false;
        }
        delay(300);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    return true;
}

// ─── OTA 설정 ────────────────────────────────────
void setupOTA() {
    ArduinoOTA.setPort(OTA_PORT);
    ArduinoOTA.setHostname(OTA_HOSTNAME);

    ArduinoOTA.onStart([]() {
        otaInProgress = true;  // 업데이트 시작 플래그 set
        Serial.println("\nOTA 업데이트 시작!");
        Serial.println("업데이트 중 전원을 끄지 마세요!");
    });

    ArduinoOTA.onEnd([]() {
        Serial.println("\nOTA 완료! 재시작...");
    });

    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        int pct = progress / (total / 100);
        Serial.print("업로드: ");
        Serial.print(pct);
        Serial.println("%");
    });

    ArduinoOTA.onError([](ota_error_t error) {
        otaInProgress = false;
        Serial.print("OTA 오류: ");
        Serial.println(error);
    });

    ArduinoOTA.begin();
    Serial.println("OTA 준비 완료.");
}

// ─── 딥슬립 진입 ─────────────────────────────────
void enterDeepSleep() {
    Serial.print("\n딥슬립 진입. ");
    Serial.print(SLEEP_DURATION_SEC / 60);
    Serial.println("분 후 깨어납니다.");
    Serial.flush();

    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);

    esp_sleep_enable_timer_wakeup((uint64_t)SLEEP_DURATION_SEC * 1000000ULL);
    esp_deep_sleep_start();
}

void setup() {
    Serial.begin(BAUD_RATE);
    delay(300);

    wakeupCount++;

    Serial.println("\n=== 딥슬립 + OTA 예제 ===");
    Serial.print("웨이크업 횟수: ");
    Serial.println(wakeupCount);

    // ── Wi-Fi 연결 ──
    if (!connectWiFi()) {
        Serial.println("Wi-Fi 실패 — 딥슬립으로 전환");
        enterDeepSleep();
        return;
    }

    // ── 실제 작업 수행 (센서 읽기, 데이터 전송 등) ──
    Serial.println("\n--- 메인 작업 ---");
    Serial.println("센서 읽기 및 데이터 처리 중...");
    delay(1000);  // 작업 시뮬레이션
    Serial.println("메인 작업 완료.");

    // ── OTA 대기창 열기 ──
    setupOTA();

    uint32_t otaStart = millis();
    uint32_t remaining = OTA_WINDOW_MS;

    Serial.println("\n--- OTA 대기창 ---");
    Serial.print("OTA 업데이트 대기 중... (");
    Serial.print(OTA_WINDOW_MS / 1000);
    Serial.println("초)");
    Serial.println("지금 Arduino IDE에서 네트워크 포트로 업로드하세요.");
    Serial.println("업데이트 없으면 딥슬립으로 전환됩니다.");

    // ── OTA 대기 루프 ──
    while (millis() - otaStart < OTA_WINDOW_MS) {
        ArduinoOTA.handle();

        // 업데이트가 시작되면 여기서 무한 대기
        // (업데이트 완료 후 ArduinoOTA가 자동 재시작)
        if (otaInProgress) {
            while (true) {
                ArduinoOTA.handle();
                delay(10);
            }
        }

        // 남은 시간 표시 (5초마다)
        remaining = OTA_WINDOW_MS - (millis() - otaStart);
        static uint32_t lastPrint = 0;
        if (millis() - lastPrint >= 5000) {
            lastPrint = millis();
            Serial.print("OTA 대기 남은 시간: ");
            Serial.print(remaining / 1000);
            Serial.println("초");
        }

        delay(10);
    }

    // ── 대기 시간 종료 → 딥슬립 ──
    Serial.println("OTA 업데이트 없음 — 딥슬립 진입");
    enterDeepSleep();
}

void loop() {
    // setup()에서 딥슬립으로 진입하므로 실행되지 않음
}
