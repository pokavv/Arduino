/*
 * Storage 01 — NVS Preferences (비휘발성 키-값 저장소)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   NVS (Non-Volatile Storage, 비휘발성 저장소)
 *     전원을 꺼도 데이터가 사라지지 않는 저장 공간.
 *     ESP32 플래시 메모리의 일부를 사용한다.
 *     키-값 쌍으로 데이터를 저장. 마치 사전처럼 "이름" → "값".
 *     예: "brightness" → 75,  "ssid" → "MyWiFi"
 *
 *   Preferences 라이브러리
 *     NVS를 아두이노에서 쉽게 쓸 수 있게 감싼 라이브러리.
 *     arduino-esp32에 기본 포함 — 별도 설치 불필요.
 *
 *   네임스페이스 (Namespace)
 *     저장 공간을 구획 나눈 이름표.
 *     같은 키 이름이라도 네임스페이스가 다르면 서로 다른 값.
 *     최대 15글자.
 *
 *   저장할 수 있는 타입
 *     putInt(), getInt()       — 정수 (int32_t)
 *     putUInt(), getUInt()     — 부호 없는 정수 (uint32_t)
 *     putFloat(), getFloat()   — 실수
 *     putString(), getString() — 문자열
 *     putBool(), getBool()     — 참/거짓
 *     putBytes(), getBytes()   — 바이트 배열
 *
 * [라이브러리]
 *   Preferences — arduino-esp32 기본 내장 (별도 설치 불필요)
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB만 연결
 *
 * [테스트 방법]
 *   1. 업로드 후 시리얼 모니터 열기 (115200 baud)
 *   2. 부팅 카운터가 올라가는 것 확인
 *   3. 보드 리셋 버튼 눌러서 재시작 → 카운터 유지 확인
 *   4. 'm' 입력 → 카운터를 0으로 초기화(clear)
 * ================================================================
 */

#include <Preferences.h>
#include "config.h"

// Preferences 객체 — NVS 접근에 사용
Preferences prefs;

void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);   // 시리얼 안정화 대기
    Serial.println("\n=== NVS Preferences 예제 ===");

    // ── NVS 네임스페이스 열기 ──
    // 두 번째 인자: false = 읽기/쓰기 모드, true = 읽기 전용
    prefs.begin(NVS_NAMESPACE, false);

    // ── 부팅 카운터 읽기 ──
    // getInt(키, 기본값) — 키가 없으면 기본값 반환
    int bootCount = prefs.getInt("bootCount", 0);
    Serial.print("이전 부팅 횟수: ");
    Serial.println(bootCount);

    // ── 카운터 1 증가 후 저장 ──
    bootCount++;
    prefs.putInt("bootCount", bootCount);   // 즉시 플래시에 기록
    Serial.print("현재 부팅 횟수: ");
    Serial.println(bootCount);

    // ── 저장된 다른 값 읽기 예시 ──
    String greeting = prefs.getString("greeting", "처음 만남");
    Serial.print("저장된 인사말: ");
    Serial.println(greeting);

    // ── 새 값 저장 ──
    prefs.putString("greeting", "안녕하세요!");
    Serial.println("인사말을 '안녕하세요!'로 저장했습니다.");

    // ── 사용 가능한 NVS 공간 확인 ──
    Serial.print("남은 NVS 항목 수: ");
    Serial.println(prefs.freeEntries());

    Serial.println("\n[명령어] 'm' 입력 → NVS 초기화(모두 삭제)");
    Serial.println("리셋 버튼을 눌러 재시작하면 카운터가 유지됩니다.\n");
}

void loop() {
    // 시리얼 명령 처리
    if (Serial.available()) {
        char cmd = Serial.read();

        if (cmd == 'm' || cmd == 'M') {
            // ── NVS 전체 초기화 ──
            // clear() — 이 네임스페이스의 모든 키-값 삭제
            prefs.clear();
            Serial.println("NVS 초기화 완료! 다음 재시작부터 카운터가 0부터 시작합니다.");
        } else if (cmd == 'r' || cmd == 'R') {
            // 현재 저장된 값 다시 읽기
            int cnt = prefs.getInt("bootCount", 0);
            String greet = prefs.getString("greeting", "없음");
            Serial.print("bootCount = ");
            Serial.println(cnt);
            Serial.print("greeting  = ");
            Serial.println(greet);
        }
    }
}
