/*
 * Storage 06 — LittleFS 데이터 로거 (CSV)
 * ================================================================
 *
 * [핵심 개념 설명]
 *
 *   데이터 로거 (Data Logger)
 *     시간에 따라 센서 값을 주기적으로 기록하는 장치.
 *     기상 관측소, 환경 모니터링, 공장 센서 등에 사용.
 *
 *   CSV (Comma Separated Values)
 *     쉼표로 구분된 텍스트 파일 형식.
 *     엑셀, 구글 스프레드시트에서 바로 열 수 있다.
 *     예: millis,adc_value
 *         12345,2048
 *         22346,1923
 *
 *   파일 크기 관리 (Log Rotation)
 *     계속 기록하면 파일이 너무 커진다.
 *     MAX_LINES 초과 시 오래된 줄을 지우고 새 줄을 추가.
 *     방법: 파일 전체를 읽어서 앞 줄을 버린 후 다시 씀.
 *
 *   플래시 수명 주의
 *     플래시 메모리는 쓰기 횟수에 한계가 있다 (약 10만 회).
 *     너무 짧은 주기(1초 이하)로 저장하면 수명이 빨리 닮.
 *     LOG_INTERVAL은 10초 이상 권장.
 *
 * [라이브러리]
 *   LittleFS — arduino-esp32 기본 내장
 *
 * [준비물]
 *   ESP32-C3 Super Mini 보드
 *   (선택) G0 핀에 가변저항 연결 → 의미 있는 ADC 값 생성 가능
 *
 * [연결 방법]
 *   없음 — ADC는 플로팅 핀 읽기로 노이즈 값 사용 (테스트용)
 *   의미 있는 측정 원할 때:
 *   [3.3V]──[가변저항]──[G0]──[GND]
 *
 * [테스트 방법]
 *   1. 업로드 후 시리얼 모니터 열기 (115200 baud)
 *   2. 10초마다 로그 저장 확인
 *   3. 'p' 입력 → 전체 로그 출력
 *   4. 'c' 입력 → 로그 파일 삭제
 * ================================================================
 */

#include <LittleFS.h>
#include "config.h"

// ─── 전역 변수 ───────────────────────────────────
uint32_t lastLogTime = 0;    // 마지막 로그 저장 시각 (millis)
int      logLineCount = 0;   // 현재 로그 줄 수

// ─── 현재 파일의 줄 수 세기 ──────────────────────
int countLines(const char* path) {
    File f = LittleFS.open(path, "r");
    if (!f) return 0;

    int count = 0;
    while (f.available()) {
        if (f.read() == '\n') count++;
    }
    f.close();
    return count;
}

// ─── 오래된 줄 삭제 (Log Rotation) ──────────────
// 파일의 첫 번째 데이터 줄(가장 오래된 것)을 삭제
void trimOldestLine(const char* path) {
    File f = LittleFS.open(path, "r");
    if (!f) return;

    // 헤더 줄 읽기 (첫 줄 = CSV 헤더)
    String header = f.readStringUntil('\n');
    // 첫 번째 데이터 줄 건너뛰기 (가장 오래된 줄 삭제)
    f.readStringUntil('\n');

    // 나머지 내용 전부 읽기
    String remaining = "";
    while (f.available()) {
        remaining += (char)f.read();
    }
    f.close();

    // 헤더 + 나머지를 다시 씀 (첫 데이터 줄 제외)
    File out = LittleFS.open(path, "w");
    if (!out) return;
    out.println(header);
    out.print(remaining);
    out.close();

    logLineCount--;
    Serial.println("  [Rotation] 오래된 줄 1개 삭제.");
}

// ─── 로그 항목 추가 ──────────────────────────────
void appendLog(uint32_t timestamp, int adcValue) {
    // MAX_LINES 초과 시 가장 오래된 줄 삭제
    if (logLineCount >= MAX_LINES) {
        trimOldestLine(LOG_FILE);
    }

    // 로그 파일이 없으면 헤더 포함해서 새로 생성
    if (!LittleFS.exists(LOG_FILE)) {
        File f = LittleFS.open(LOG_FILE, "w");
        if (f) {
            f.println("millis,adc_value");   // CSV 헤더
            f.close();
            logLineCount = 1;   // 헤더 줄 포함
        }
    }

    // 데이터 줄 추가 (append 모드)
    File f = LittleFS.open(LOG_FILE, "a");
    if (!f) {
        Serial.println("로그 파일 열기 실패!");
        return;
    }

    // CSV 형식: millis값,adc값
    f.print(timestamp);
    f.print(",");
    f.println(adcValue);
    f.close();

    logLineCount++;
}

// ─── 로그 전체 출력 ──────────────────────────────
void printLog() {
    Serial.println("=== 로그 파일 내용 ===");
    if (!LittleFS.exists(LOG_FILE)) {
        Serial.println("(로그 없음)");
        return;
    }

    File f = LittleFS.open(LOG_FILE, "r");
    if (!f) return;

    int lineNum = 0;
    while (f.available()) {
        String line = f.readStringUntil('\n');
        Serial.print(lineNum++);
        Serial.print(": ");
        Serial.println(line);
    }
    f.close();

    Serial.print("총 ");
    Serial.print(logLineCount);
    Serial.print(" 줄 (MAX_LINES=");
    Serial.print(MAX_LINES);
    Serial.println(")");
    Serial.print("파일 크기: ");
    Serial.print(LittleFS.open(LOG_FILE, "r").size());
    Serial.println(" bytes");
    Serial.println("===================");
}

void setup() {
    Serial.begin(BAUD_RATE);
    delay(500);
    Serial.println("\n=== LittleFS 데이터 로거 ===");

    // ADC 핀 입력 설정
    pinMode(ADC_PIN, INPUT);

    // ── LittleFS 초기화 ──
    if (!LittleFS.begin(true)) {
        Serial.println("LittleFS 초기화 실패!");
        return;
    }
    Serial.println("LittleFS 초기화 성공.");

    // 기존 로그 줄 수 확인
    logLineCount = countLines(LOG_FILE);
    Serial.print("기존 로그: ");
    Serial.print(logLineCount);
    Serial.println(" 줄");

    Serial.print("로그 주기: ");
    Serial.print(LOG_INTERVAL / 1000);
    Serial.print("초, 최대 줄 수: ");
    Serial.println(MAX_LINES);

    Serial.println("\n[명령어]");
    Serial.println("  p — 로그 전체 출력");
    Serial.println("  c — 로그 파일 삭제");
    Serial.println("  f — 파일 시스템 정보\n");
}

void loop() {
    uint32_t now = millis();

    // ── 주기별 로그 저장 ──
    if (now - lastLogTime >= LOG_INTERVAL) {
        lastLogTime = now;

        int adcVal = analogRead(ADC_PIN);   // ADC 읽기 (0~4095)
        appendLog(now, adcVal);

        Serial.print("[로그] millis=");
        Serial.print(now);
        Serial.print(", ADC=");
        Serial.print(adcVal);
        Serial.print("  (");
        Serial.print(logLineCount);
        Serial.print("/");
        Serial.print(MAX_LINES);
        Serial.println(" 줄)");
    }

    // ── 시리얼 명령 처리 ──
    if (Serial.available()) {
        char cmd = Serial.read();
        switch (cmd) {
            case 'p':
                printLog();
                break;
            case 'c':
                LittleFS.remove(LOG_FILE);
                logLineCount = 0;
                Serial.println("로그 파일 삭제 완료.");
                break;
            case 'f':
                Serial.print("사용: ");
                Serial.print(LittleFS.usedBytes());
                Serial.print(" / ");
                Serial.print(LittleFS.totalBytes());
                Serial.println(" bytes");
                break;
        }
    }
}
