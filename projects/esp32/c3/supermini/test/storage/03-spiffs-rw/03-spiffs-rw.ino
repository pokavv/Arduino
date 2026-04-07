/*
 * Storage 03 — SPIFFS 파일 읽기/쓰기
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   SPIFFS (SPI Flash File System)
 *     플래시 메모리를 파일처럼 사용하는 파일 시스템.
 *     컴퓨터의 USB 드라이브처럼 파일을 만들고, 읽고, 삭제 가능.
 *     폴더 구조는 없고 "/" 루트만 존재한다.
 *     파일명에 '/'를 포함해서 경로처럼 쓸 수 있지만 실제 폴더는 아님.
 *     예: "/config.txt", "/data/sensor.csv"
 *
 *   주의: SPIFFS는 전력 차단 시 데이터 손상 위험이 있음.
 *   안정성이 더 필요하면 LittleFS를 사용 (05번 예제 참고).
 *
 *   SPIFFS.begin(true)
 *     true = 파일 시스템이 없으면 자동 포맷.
 *     처음 사용 시 꼭 필요.
 *
 *   파일 모드
 *     "w"  — 쓰기 (기존 내용 덮어씀)
 *     "a"  — 추가 쓰기 (기존 내용 뒤에 이어 씀)
 *     "r"  — 읽기 (FILE_READ와 같음)
 *
 * [라이브러리]
 *   SPIFFS — arduino-esp32 기본 내장 (별도 설치 불필요)
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB만 연결
 *
 * [테스트 방법]
 *   1. 업로드 후 시리얼 모니터 열기 (115200 baud)
 *   2. 자동으로 파일 쓰기 → 읽기 → 목록 출력 순서로 진행
 *   3. 명령어:
 *      w — 파일에 새 내용 쓰기
 *      r — 파일 읽기
 *      l — 파일 목록 보기
 *      d — 파일 삭제
 * ================================================================
 */

#include <SPIFFS.h>
#include "config.h"

// ─── 파일 쓰기 ───────────────────────────────────
void writeFile(const char* path, const char* content) {
    Serial.print("파일 쓰기: ");
    Serial.println(path);

    // SPIFFS.open(경로, 모드) — "w" 모드는 덮어쓰기
    File f = SPIFFS.open(path, "w");
    if (!f) {
        Serial.println("  파일 열기 실패!");
        return;
    }

    size_t written = f.print(content);   // 문자열 쓰기
    f.close();                           // 반드시 닫아야 저장됨

    Serial.print("  ");
    Serial.print(written);
    Serial.println("바이트 쓰기 완료.");
}

// ─── 파일 읽기 ───────────────────────────────────
void readFile(const char* path) {
    Serial.print("파일 읽기: ");
    Serial.println(path);

    // FILE_READ = "r" 과 동일
    File f = SPIFFS.open(path, FILE_READ);
    if (!f) {
        Serial.println("  파일 없음 또는 열기 실패!");
        return;
    }

    Serial.println("  ── 내용 시작 ──");
    while (f.available()) {
        Serial.write(f.read());  // 1바이트씩 읽어서 시리얼로 출력
    }
    Serial.println("\n  ── 내용 끝 ──");
    f.close();
}

// ─── 파일 목록 보기 ──────────────────────────────
void listFiles() {
    Serial.println("파일 목록:");

    // SPIFFS 루트("/") 디렉토리 열기
    File root = SPIFFS.open("/");
    if (!root || !root.isDirectory()) {
        Serial.println("  루트 디렉토리 열기 실패!");
        return;
    }

    File entry = root.openNextFile();
    int count = 0;
    while (entry) {
        Serial.print("  ");
        Serial.print(entry.name());   // 파일 이름
        Serial.print("  (");
        Serial.print(entry.size());   // 파일 크기 (바이트)
        Serial.println(" bytes)");
        entry.close();
        entry = root.openNextFile();
        count++;
    }

    if (count == 0) {
        Serial.println("  (파일 없음)");
    }

    // SPIFFS 전체 용량 정보 출력
    Serial.print("사용 공간: ");
    Serial.print(SPIFFS.usedBytes());
    Serial.print(" / ");
    Serial.print(SPIFFS.totalBytes());
    Serial.println(" bytes");
}

// ─── 파일 삭제 ───────────────────────────────────
void deleteFile(const char* path) {
    if (SPIFFS.exists(path)) {
        SPIFFS.remove(path);
        Serial.print("삭제 완료: ");
        Serial.println(path);
    } else {
        Serial.println("파일 없음 — 삭제할 것이 없습니다.");
    }
}

void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n=== SPIFFS 읽기/쓰기 예제 ===");

    // ── SPIFFS 초기화 ──
    // true = 마운트 실패 시 자동 포맷
    if (!SPIFFS.begin(true)) {
        Serial.println("SPIFFS 초기화 실패! 포맷 오류 가능.");
        return;
    }
    Serial.println("SPIFFS 초기화 성공.");

    // ── 초기 테스트 자동 실행 ──
    writeFile(TEST_FILE, "안녕하세요!\nSPIFFS 테스트 파일입니다.\n숫자: 12345\n");
    readFile(TEST_FILE);
    listFiles();

    Serial.println("\n[명령어]");
    Serial.println("  w — 파일에 새 내용 쓰기");
    Serial.println("  r — 파일 읽기");
    Serial.println("  l — 파일 목록 보기");
    Serial.println("  d — 파일 삭제\n");
}

void loop() {
    if (Serial.available()) {
        char cmd = Serial.read();

        switch (cmd) {
            case 'w':
                writeFile(TEST_FILE, "새로 작성한 내용!\nmillis = ");
                // 파일에 millis 값 추가 (append 모드)
                {
                    File f = SPIFFS.open(TEST_FILE, "a");
                    if (f) {
                        f.println(millis());
                        f.close();
                    }
                }
                Serial.println("쓰기 완료.");
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
