/*
 * OTA 02 — ArduinoOTA 비밀번호 인증
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   OTA 비밀번호 보호
 *     비밀번호 없이 OTA를 열어두면, 같은 Wi-Fi의 누구든 펌웨어를 바꿀 수 있다.
 *     공용 네트워크 또는 중요 장치에는 반드시 비밀번호 설정 권장.
 *
 *   ArduinoOTA.setPassword("비밀번호")
 *     비밀번호를 설정하면 Arduino IDE에서 업로드 시
 *     비밀번호 입력 팝업이 뜬다.
 *     틀린 비밀번호 → OTA_AUTH_ERROR 오류 발생, 업데이트 거부.
 *
 *   setPasswordHash()
 *     평문 비밀번호 대신 MD5 해시값을 사용하는 방법도 있음.
 *     예: ArduinoOTA.setPasswordHash("md5해시값");
 *     MD5 생성: echo -n "비밀번호" | md5sum (Linux/Mac)
 *
 *   보안 주의사항
 *     ArduinoOTA는 암호화 없이 전송됨 (평문 전송).
 *     보안이 중요한 경우 HTTPS OTA (03번 예제) 또는 VPN 사용 권장.
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
 *   1. secrets.h.example → secrets.h 복사 후 정보 입력
 *   2. 업로드 후 Arduino IDE 포트에서 네트워크 포트 선택
 *   3. 업로드 시 비밀번호 입력 팝업 확인
 * ================================================================
 */

#include <WiFi.h>
#include <ArduinoOTA.h>
#include "config.h"
#include "secrets.h"

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

void setupOTA() {
    ArduinoOTA.setPort(OTA_PORT);
    ArduinoOTA.setHostname(OTA_HOSTNAME);

    // ── 비밀번호 설정 ──
    // 업로드 시 Arduino IDE에서 이 비밀번호를 요구함
    ArduinoOTA.setPassword(OTA_PASSWORD);

    // ── 이벤트 콜백 ──
    ArduinoOTA.onStart([]() {
        Serial.println("OTA 시작");
    });

    ArduinoOTA.onEnd([]() {
        Serial.println("\nOTA 완료!");
    });

    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        Serial.print("업로드: ");
        Serial.print(progress / (total / 100));
        Serial.println("%");
    });

    ArduinoOTA.onError([](ota_error_t error) {
        Serial.print("OTA 오류: ");
        if (error == OTA_AUTH_ERROR) {
            // 비밀번호가 틀린 경우
            Serial.println("인증 실패! 비밀번호를 확인하세요.");
        } else if (error == OTA_BEGIN_ERROR) {
            Serial.println("시작 실패 — 플래시 공간 부족 가능.");
        } else if (error == OTA_CONNECT_ERROR) {
            Serial.println("연결 실패");
        } else if (error == OTA_RECEIVE_ERROR) {
            Serial.println("수신 오류");
        } else if (error == OTA_END_ERROR) {
            Serial.println("종료 오류");
        }
    });

    ArduinoOTA.begin();

    Serial.println("OTA 준비 완료 (비밀번호 보호)");
    Serial.print("장치 이름: ");
    Serial.println(OTA_HOSTNAME);
    Serial.println("업로드 시 비밀번호 입력이 필요합니다.");
}

void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n=== ArduinoOTA 비밀번호 인증 예제 ===");

    connectWiFi();
    setupOTA();
}

void loop() {
    // OTA 요청 처리 — 반드시 있어야 OTA 동작
    ArduinoOTA.handle();

    // 여기에 메인 로직 추가
}
