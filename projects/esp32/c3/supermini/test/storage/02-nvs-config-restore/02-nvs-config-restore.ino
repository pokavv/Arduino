/*
 * Storage 02 — NVS 설정값 저장·복원
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   설정 저장·복원 패턴
 *     기기의 설정(밝기, 주기, 모드 등)을 NVS에 저장해두면,
 *     전원을 껐다 켜도 이전 설정이 그대로 유지된다.
 *     예: 스마트 전구의 밝기, 에어컨의 설정 온도
 *
 *   동작 흐름
 *     1. 부팅 시 NVS에서 설정 로드
 *     2. 시리얼로 새 설정 입력
 *     3. 변경 즉시 NVS에 저장 (putInt 등)
 *     4. 재시작해도 마지막 설정 유지
 *
 * [라이브러리]
 *   Preferences — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB만 연결
 *
 * [테스트 방법]
 *   1. 업로드 후 시리얼 모니터 열기 (115200 baud)
 *   2. 명령어 입력으로 설정 변경
 *      i:500  → 주기를 500ms로 변경
 *      b:80   → 밝기를 80으로 변경
 *      r      → 현재 설정 출력
 *      d      → 기본값으로 초기화
 *   3. 보드 리셋 후 이전 설정 유지 확인
 * ================================================================
 */

#include <Preferences.h>
#include "config.h"

Preferences prefs;

// 현재 적용 중인 설정값 (전역)
int g_interval   = DEFAULT_INTERVAL;    // 작동 주기 (ms)
int g_brightness = DEFAULT_BRIGHTNESS;  // 밝기 (0~100)

// ─── 함수 선언 ───────────────────────────────────
void loadConfig();
void saveConfig();
void printConfig();
void resetConfig();
void handleCommand(String cmd);

// ─── 설정 로드 ───────────────────────────────────
void loadConfig() {
    // NVS에서 값 읽기. 저장된 값 없으면 DEFAULT 값 사용
    g_interval   = prefs.getInt("interval",   DEFAULT_INTERVAL);
    g_brightness = prefs.getInt("brightness", DEFAULT_BRIGHTNESS);
    Serial.println("NVS에서 설정 불러옴.");
}

// ─── 설정 저장 ───────────────────────────────────
void saveConfig() {
    prefs.putInt("interval",   g_interval);
    prefs.putInt("brightness", g_brightness);
    Serial.println("설정을 NVS에 저장했습니다.");
}

// ─── 설정 출력 ───────────────────────────────────
void printConfig() {
    Serial.println("─── 현재 설정 ───");
    Serial.print("  주기(interval)  : ");
    Serial.print(g_interval);
    Serial.println(" ms");
    Serial.print("  밝기(brightness): ");
    Serial.println(g_brightness);
    Serial.println("─────────────────");
}

// ─── 기본값 복원 ─────────────────────────────────
void resetConfig() {
    g_interval   = DEFAULT_INTERVAL;
    g_brightness = DEFAULT_BRIGHTNESS;
    saveConfig();
    Serial.println("기본값으로 초기화 완료.");
    printConfig();
}

// ─── 시리얼 명령 처리 ────────────────────────────
// 형식: "i:1000" (주기), "b:75" (밝기), "r" (출력), "d" (초기화)
void handleCommand(String cmd) {
    cmd.trim();  // 앞뒤 공백·개행 제거

    if (cmd.startsWith("i:")) {
        // 주기 변경
        int val = cmd.substring(2).toInt();
        if (val < MIN_INTERVAL || val > MAX_INTERVAL) {
            Serial.print("범위 초과! ");
            Serial.print(MIN_INTERVAL);
            Serial.print("~");
            Serial.print(MAX_INTERVAL);
            Serial.println(" ms 사이로 입력하세요.");
            return;
        }
        g_interval = val;
        saveConfig();
        Serial.print("주기 변경 → ");
        Serial.print(g_interval);
        Serial.println(" ms");

    } else if (cmd.startsWith("b:")) {
        // 밝기 변경
        int val = cmd.substring(2).toInt();
        if (val < MIN_BRIGHTNESS || val > MAX_BRIGHTNESS) {
            Serial.print("범위 초과! ");
            Serial.print(MIN_BRIGHTNESS);
            Serial.print("~");
            Serial.print(MAX_BRIGHTNESS);
            Serial.println(" 사이로 입력하세요.");
            return;
        }
        g_brightness = val;
        saveConfig();
        Serial.print("밝기 변경 → ");
        Serial.println(g_brightness);

    } else if (cmd == "r") {
        printConfig();

    } else if (cmd == "d") {
        resetConfig();

    } else {
        Serial.println("알 수 없는 명령. i:값 / b:값 / r / d 사용");
    }
}

void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n=== NVS 설정 저장·복원 예제 ===");

    // NVS 네임스페이스 열기 (읽기/쓰기)
    prefs.begin(NVS_NAMESPACE, false);

    // 저장된 설정 불러오기
    loadConfig();
    printConfig();

    Serial.println("\n[명령어]");
    Serial.println("  i:숫자  → 주기 변경 (ms, 100~10000)");
    Serial.println("  b:숫자  → 밝기 변경 (0~100)");
    Serial.println("  r       → 현재 설정 출력");
    Serial.println("  d       → 기본값으로 초기화\n");
}

// 마지막 작업 시각 (millis 기반 논블로킹 타이머)
uint32_t lastWorkTime = 0;

void loop() {
    // ── 주기별 작업 시뮬레이션 ──
    uint32_t now = millis();
    if (now - lastWorkTime >= (uint32_t)g_interval) {
        lastWorkTime = now;
        Serial.print("[작동] 주기=");
        Serial.print(g_interval);
        Serial.print("ms, 밝기=");
        Serial.println(g_brightness);
    }

    // ── 시리얼 명령 처리 ──
    if (Serial.available()) {
        String cmd = Serial.readStringUntil('\n');
        handleCommand(cmd);
    }
}
