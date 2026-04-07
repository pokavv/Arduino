/*
 * Power 06 — 모뎀 슬립 (Modem Sleep)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   모뎀 슬립 (Modem Sleep)
 *     CPU는 계속 동작하면서 Wi-Fi 모뎀(무선 통신 회로)만 끄는 방식.
 *     딥슬립/라이트슬립처럼 CPU가 멈추지 않는다.
 *     Wi-Fi가 필요 없는 작업을 하는 동안 전력 절감 가능.
 *
 *   소비 전류 비교
 *     Wi-Fi 활성: 80~240mA (데이터 전송 시)
 *     모뎀 슬립:   20~30mA (CPU 동작 중)
 *     라이트슬립: 0.8~1.5mA
 *     딥슬립:     0.005~0.01mA
 *
 *   WiFi.setSleep(true) vs esp_wifi_set_ps()
 *     WiFi.setSleep(true)         — 자동 모뎀 슬립 (연결 유지, 비콘 간격에 맞춰 절전)
 *     WIFI_PS_MIN_MODEM           — 최소 절전 (빠른 응답)
 *     WIFI_PS_MAX_MODEM           — 최대 절전 (느린 응답)
 *     WIFI_PS_NONE                — 절전 없음 (최고 성능)
 *
 *   사용 패턴
 *     Wi-Fi 연결 → 데이터 전송 → 모뎀 슬립 → 일정 시간 작업
 *     → 다시 Wi-Fi 사용 → 모뎀 슬립 → ...
 *
 * [라이브러리]
 *   WiFi     — arduino-esp32 기본 내장
 *   esp_wifi — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드
 *   Wi-Fi 2.4GHz 네트워크
 *
 * [연결 방법]
 *   없음 — USB만 연결 (Wi-Fi 내장)
 *
 * [사용 방법]
 *   secrets.h.example을 복사 → secrets.h로 저장 → Wi-Fi 정보 입력
 * ================================================================
 */

#include <WiFi.h>
#include <esp_wifi.h>
#include "config.h"
#include "secrets.h"

uint32_t lastWorkTime = 0;
int workCycle = 0;

// ─── Wi-Fi 연결 ───────────────────────────────────
void connectWiFi() {
    Serial.print("Wi-Fi 연결 중");
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 20) {
        delay(500);
        Serial.print(".");
        retries++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println(" 연결 성공!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
        Serial.print("RSSI: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
    } else {
        Serial.println(" 연결 실패!");
    }
}

// ─── 모뎀 슬립 켜기 ──────────────────────────────
void enableModemSleep() {
    // WIFI_PS_MAX_MODEM: 최대 절전 모드
    // AP의 비콘(Beacon) 신호 주기에 맞춰 모뎀이 깨어나고 다시 잠든다
    esp_wifi_set_ps(WIFI_PS_MAX_MODEM);
    Serial.println("모뎀 슬립 활성화 (WIFI_PS_MAX_MODEM)");
    Serial.println("Wi-Fi 연결은 유지되지만 전력 소비 감소.");
}

// ─── 모뎀 슬립 끄기 ──────────────────────────────
void disableModemSleep() {
    // WIFI_PS_NONE: 절전 없음 → 최대 성능
    esp_wifi_set_ps(WIFI_PS_NONE);
    Serial.println("모뎀 슬립 비활성화 (WIFI_PS_NONE) — 최대 성능");
}

void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n=== 모뎀 슬립 절전 예제 ===");

    // Wi-Fi 연결
    connectWiFi();

    if (WiFi.status() == WL_CONNECTED) {
        // 초기에는 모뎀 슬립 활성화
        enableModemSleep();
    }
}

void loop() {
    uint32_t now = millis();

    // WORK_INTERVAL 마다 작업 수행
    if (now - lastWorkTime >= WORK_INTERVAL) {
        lastWorkTime = now;
        workCycle++;

        Serial.println("\n─── 작업 시작 ───");
        Serial.print("사이클: ");
        Serial.println(workCycle);

        // ── 1단계: 데이터 전송 전 모뎀 슬립 비활성화 ──
        disableModemSleep();
        delay(100);  // 모뎀 안정화 대기

        // ── 2단계: Wi-Fi 작업 수행 ──
        if (WiFi.status() == WL_CONNECTED) {
            Serial.print("Wi-Fi 신호 세기: ");
            Serial.print(WiFi.RSSI());
            Serial.println(" dBm");
            Serial.println("데이터 전송 중... (시뮬레이션)");
            delay(200);  // 전송 시간 시뮬레이션
            Serial.println("전송 완료!");
        } else {
            Serial.println("Wi-Fi 연결 끊김. 재연결 시도...");
            connectWiFi();
        }

        // ── 3단계: 작업 완료 후 다시 모뎀 슬립 ──
        enableModemSleep();

        // ── 4단계: 로컬 작업 (CPU 동작, 모뎀 슬립 중) ──
        int adcVal = analogRead(0);
        Serial.print("로컬 ADC 읽기: ");
        Serial.println(adcVal);
        Serial.println("─── 작업 완료 ───");
    }

    // 짧은 딜레이 (CPU 낭비 방지)
    delay(10);
}
