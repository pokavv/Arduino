/*
 * Storage 05 — LittleFS 파일 읽기/쓰기
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   LittleFS vs SPIFFS 차이
 *   ┌───────────────┬──────────────────┬──────────────────┐
 *   │               │ SPIFFS           │ LittleFS         │
 *   ├───────────────┼──────────────────┼──────────────────┤
 *   │ 전력 차단 안전│ 위험 (손상 가능) │ 안전 (저널링)    │
 *   │ 쓰기 속도     │ 느림             │ 빠름             │
 *   │ 디렉토리 지원 │ 없음 (가상)      │ 실제 지원        │
 *   │ 파일명 길이   │ 32자 제한        │ 제한 없음        │
 *   │ 권장 여부     │ 구버전 호환용    │ 신규 프로젝트 권장│
 *   └───────────────┴──────────────────┴──────────────────┘
 *
 *   LittleFS가 더 신뢰성 높은 이유
 *     "저널링(journaling)" 기법을 사용해 쓰기 도중 전원이 꺼져도
 *     파일 시스템이 손상되지 않는다.
 *     배터리 장치, 잦은 전원 차단 환경에 특히 중요.
 *
 *   LittleFS.begin(true)
 *     true = 파일 시스템 없으면 자동 포맷.
 *
 * [라이브러리]
 *   LittleFS — arduino-esp32 기본 내장 (별도 설치 불필요)
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB만 연결
 *
 * [테스트 방법]
 *   1. 업로드 후 시리얼 모니터 열기 (115200 baud)
 *   2. 자동으로 쓰기 → 읽기 → 목록 순서로 진행
 *   3. 명령어:
 *      w — 파일 쓰기
 *      a — 파일에 내용 추가 (append)
 *      r — 파일 읽기
 *      l — 파일 목록
 *      d — 파일 삭제
 * ================================================================
 */

#include <LittleFS.h>
#include "config.h"

// ─── 파일 쓰기 ───────────────────────────────────
void writeFile(const char* path, const char* content) {
    Serial.print("파일 쓰기: ");
    Serial.println(path);

    File f = LittleFS.open(path, "w");  // "w" = 덮어쓰기
    if (!f) {
        Serial.println("  열기 실패!");
        return;
    }
    size_t written = f.print(content);
    f.close();
    Serial.print("  ");
    Serial.print(written);
    Serial.println(" bytes 쓰기 완료.");
}

// ─── 파일 추가 쓰기 ──────────────────────────────
void appendFile(const char* path, const char* content) {
    Serial.print("파일 추가: ");
    Serial.println(path);

    File f = LittleFS.open(path, "a");  // "a" = 이어 쓰기
    if (!f) {
        Serial.println("  열기 실패!");
        return;
    }
    size_t written = f.println(content);
    f.close();
    Serial.print("  ");
    Serial.print(written);
    Serial.println(" bytes 추가 완료.");
}

// ─── 파일 읽기 ───────────────────────────────────
void readFile(const char* path) {
    Serial.print("파일 읽기: ");
    Serial.println(path);

    File f = LittleFS.open(path, "r");
    if (!f) {
        Serial.println("  파일 없음!");
        return;
    }

    Serial.print("  크기: ");
    Serial.print(f.size());
    Serial.println(" bytes");
    Serial.println("  ── 내용 ──");
    while (f.available()) {
        Serial.write(f.read());
    }
    Serial.println("  ──────────");
    f.close();
}

// ─── 파일 목록 ───────────────────────────────────
void listFiles(const char* dirPath = "/") {
    Serial.print("디렉토리 목록: ");
    Serial.println(dirPath);

    File root = LittleFS.open(dirPath);
    if (!root || !root.isDirectory()) {
        Serial.println("  디렉토리 없음!");
        return;
    }

    File entry = root.openNextFile();
    int count = 0;
    while (entry) {
        if (entry.isDirectory()) {
            Serial.print("  [DIR] ");
            Serial.println(entry.name());
        } else {
            Serial.print("  ");
            Serial.print(entry.name());
            Serial.print("  (");
            Serial.print(entry.size());
            Serial.println(" bytes)");
        }
        entry.close();
        entry = root.openNextFile();
        count++;
    }
    if (count == 0) Serial.println("  (비어있음)");

    Serial.print("  사용: ");
    Serial.print(LittleFS.usedBytes());
    Serial.print(" / ");
    Serial.print(LittleFS.totalBytes());
    Serial.println(" bytes");
}

// ─── 파일 삭제 ───────────────────────────────────
void deleteFile(const char* path) {
    if (LittleFS.exists(path)) {
        LittleFS.remove(path);
        Serial.print("삭제: ");
        Serial.println(path);
    } else {
        Serial.println("파일 없음 — 삭제 불가.");
    }
}

void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n=== LittleFS 읽기/쓰기 예제 ===");

    // ── LittleFS 초기화 ──
    if (!LittleFS.begin(true)) {
        Serial.println("LittleFS 초기화 실패!");
        return;
    }
    Serial.println("LittleFS 초기화 성공.");

    // ── 자동 테스트 ──
    writeFile(TEST_FILE, "LittleFS 테스트\n안전한 파일 저장!\n");
    appendFile(TEST_FILE, "추가 줄 1");
    appendFile(TEST_FILE, "추가 줄 2");
    readFile(TEST_FILE);
    listFiles();

    Serial.println("\n[명령어]");
    Serial.println("  w — 파일 쓰기 (덮어씀)");
    Serial.println("  a — 파일 추가 쓰기");
    Serial.println("  r — 파일 읽기");
    Serial.println("  l — 파일 목록");
    Serial.println("  d — 파일 삭제\n");
}

void loop() {
    if (Serial.available()) {
        char cmd = Serial.read();
        switch (cmd) {
            case 'w':
                writeFile(TEST_FILE, "새로 씀!\nmillis 시각이 저장됩니다.\n");
                break;
            case 'a':
                appendFile(TEST_FILE, String("millis=" + String(millis())).c_str());
                break;
            case 'r':
                readFile(TEST_FILE);
                break;
            case 'l':
                listFiles();
                break;
            case 'd':
                deleteFile(TEST_FILE);
                break;
        }
    }
}
