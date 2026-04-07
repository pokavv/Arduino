/*
 * OTA 03 — HTTP OTA (서버에서 펌웨어 다운로드)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   Pull OTA (당겨서 업데이트)
 *     ESP32가 서버에 "새 펌웨어 있어?"라고 물어보는 방식.
 *     서버는 수동적으로 대기, ESP32가 능동적으로 다운로드.
 *     방화벽 뒤에 있는 장치, 고정IP가 없는 장치에도 사용 가능.
 *
 *   ArduinoOTA와 HTTP OTA 비교
 *   ┌──────────────┬──────────────────────┬──────────────────────┐
 *   │              │ ArduinoOTA           │ HTTP OTA             │
 *   ├──────────────┼──────────────────────┼──────────────────────┤
 *   │ 방식         │ Push (PC → ESP32)    │ Pull (ESP32 → 서버)  │
 *   │ 네트워크     │ 같은 Wi-Fi 필수      │ 인터넷도 가능        │
 *   │ 자동 업데이트│ 불가                 │ 가능 (주기적 체크)   │
 *   │ 대규모 배포  │ 어려움               │ 용이                 │
 *   └──────────────┴──────────────────────┴──────────────────────┘
 *
 *   HTTPUpdate.update(WiFiClient, URL)
 *     HTTP_UPDATE_FAILLED    — 다운로드 실패
 *     HTTP_UPDATE_NO_UPDATES — 업데이트 없음 (서버 응답 304)
 *     HTTP_UPDATE_OK         — 업데이트 성공, 자동 재시작
 *
 *   펌웨어 서버 구축 방법 (간단한 예시)
 *     Python:  python3 -m http.server 8080
 *     Node.js: npx http-server -p 8080
 *     위 명령을 펌웨어(.bin) 파일이 있는 폴더에서 실행
 *
 *   .bin 파일 생성 방법
 *     Arduino IDE: 스케치 → 컴파일된 바이너리 내보내기
 *     생성된 .bin 파일을 웹 서버에 복사
 *
 * [라이브러리]
 *   HTTPUpdate — arduino-esp32 기본 내장
 *   WiFi       — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드
 *   HTTP 서버 (PC에서 Python 서버 간단히 가능)
 *   Wi-Fi 2.4GHz 네트워크
 *
 * [연결 방법]
 *   없음 — USB만 연결
 *
 * [사용 방법]
 *   1. secrets.h.example → secrets.h 복사
 *   2. config.h의 FIRMWARE_URL에 서버 주소 입력
 *   3. 업로드 후 시리얼 모니터 확인
 *   4. 'm' 입력 → 수동으로 OTA 업데이트 시도
 * ================================================================
 */

#include <WiFi.h>
#include <HTTPUpdate.h>
#include "config.h"
#include "secrets.h"

WiFiClient wifiClient;

uint32_t lastCheckTime = 0;

void connectWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Wi-Fi 연결 중");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
}

// ─── HTTP OTA 업데이트 시도 ──────────────────────
void checkAndUpdate() {
    Serial.println("\n펌웨어 업데이트 확인 중...");
    Serial.print("URL: ");
    Serial.println(FIRMWARE_URL);
    Serial.print("현재 버전: ");
    Serial.println(FIRMWARE_VERSION);

    // ── 진행 콜백 ──
    httpUpdate.onStart([]() {
        Serial.println("다운로드 시작...");
    });

    httpUpdate.onEnd([]() {
        Serial.println("다운로드 완료! 재시작합니다.");
    });

    httpUpdate.onProgress([](int current, int total) {
        Serial.print("다운로드: ");
        Serial.print(current / 1024);
        Serial.print("KB / ");
        Serial.print(total / 1024);
        Serial.println("KB");
    });

    httpUpdate.onError([](int err) {
        Serial.print("오류 코드: ");
        Serial.println(err);
    });

    // ── 업데이트 실행 ──
    // update(WiFiClient, URL) — HTTP로 .bin 파일 다운로드 후 플래시에 기록
    t_httpUpdate_return result = httpUpdate.update(wifiClient, FIRMWARE_URL);

    switch (result) {
        case HTTP_UPDATE_FAILLED:
            Serial.println("업데이트 실패.");
            Serial.print("오류: ");
            Serial.println(httpUpdate.getLastError());
            Serial.println(httpUpdate.getLastErrorString());
            break;

        case HTTP_UPDATE_NO_UPDATES:
            Serial.println("이미 최신 버전입니다.");
            break;

        case HTTP_UPDATE_OK:
            // 이 코드는 실행되지 않음 (업데이트 성공 시 자동 재시작)
            Serial.println("업데이트 성공! (이 줄은 실행 안 됨)");
            break;
    }
}

void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n=== HTTP OTA 예제 ===");
    Serial.print("현재 펌웨어 버전: ");
    Serial.println(FIRMWARE_VERSION);

    connectWiFi();

    Serial.println("\n[명령어]");
    Serial.println("  m — 지금 바로 펌웨어 업데이트 확인");
    Serial.print("  (자동 확인 주기: ");
    Serial.print(UPDATE_CHECK_INTERVAL / 60000);
    Serial.println("분)");
}

void loop() {
    // ── 주기별 자동 업데이트 확인 ──
    uint32_t now = millis();
    if (now - lastCheckTime >= UPDATE_CHECK_INTERVAL) {
        lastCheckTime = now;
        if (WiFi.status() == WL_CONNECTED) {
            checkAndUpdate();
        } else {
            Serial.println("Wi-Fi 연결 끊김. 재연결 시도...");
            connectWiFi();
        }
    }

    // ── 수동 업데이트 명령 ──
    if (Serial.available()) {
        char cmd = Serial.read();
        if (cmd == 'm' || cmd == 'M') {
            checkAndUpdate();
        }
    }
}
