/*
 * combo/07-sd-data-logger — SD 카드 CSV 데이터 로거
 * ================================================================
 *
 * [핵심 개념 설명]
 *   SD 카드 파일 시스템
 *     - SPI 통신으로 SD 카드에 접근
 *     - FAT32 파일 시스템 (SDXC는 exFAT, 라이브러리 따라 지원 여부 다름)
 *     - 파일 열기: FILE_WRITE (덮어쓰기) / FILE_APPEND (이어쓰기)
 *
 *   CSV (Comma-Separated Values)
 *     - 값을 쉼표로 구분하는 텍스트 형식
 *     - 엑셀, 구글 스프레드시트에서 바로 열기 가능
 *     - 형식: 시간(ms),ADC값,전압\n
 *
 *   SPI 핀 (ESP32-C3 Super Mini 기본)
 *     MOSI: G6, MISO: G5, CLK: G4, CS: G7 (config.h에서 변경 가능)
 *
 * [라이브러리]
 *   SD (Arduino 내장 호환) — ESP32 Arduino SDK에 포함
 *   SPI — ESP32 Arduino SDK에 포함
 *
 * [준비물]
 *   - MicroSD 카드 모듈 1개 (SPI 방식)
 *   - MicroSD 카드 (FAT32 포맷)
 *
 * [연결 방법]
 *   SD 모듈     ESP32-C3
 *   CS       → G7 (SD_CS)
 *   MOSI     → G6
 *   CLK      → G4
 *   MISO     → G5
 *   VCC      → 3.3V
 *   GND      → GND
 *
 *   시리얼 명령어: 'r' 입력 → 최근 20줄 로그 출력
 *                 'd' 입력 → 로그 파일 삭제
 */

#include "config.h"
#include <SPI.h>
#include <SD.h>

unsigned long lastLogTime = 0;
unsigned long logCount    = 0;  // 저장된 로그 행 수

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" SD 카드 데이터 로거");
  Serial.println("===================================");

  // ---- SD 카드 초기화 ----
  if (!SD.begin(SD_CS)) {
    Serial.println("[오류] SD 카드 초기화 실패!");
    Serial.println("배선 확인: CS→G7, MOSI→G6, CLK→G4, MISO→G5");
    while (true) { delay(1000); }
  }

  Serial.println("SD 카드 초기화 완료");
  Serial.print("카드 용량: ");
  Serial.print(SD.cardSize() / (1024 * 1024));
  Serial.println(" MB");

  // ---- 로그 파일에 헤더 작성 (파일이 없을 때만) ----
  if (!SD.exists(LOG_FILE)) {
    File logFile = SD.open(LOG_FILE, FILE_WRITE);
    if (logFile) {
      logFile.println("timestamp_ms,adc_raw,voltage_v,note");  // CSV 헤더
      logFile.close();
      Serial.print("새 로그 파일 생성: ");
      Serial.println(LOG_FILE);
    }
  } else {
    Serial.print("기존 로그 파일 사용: ");
    Serial.println(LOG_FILE);
  }

  Serial.println("시리얼 명령: 'r'=로그 읽기, 'd'=파일 삭제");
  Serial.println("---");
}

void loop() {
  // ---- 시리얼 명령 처리 ----
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 'r') {
      readLastLogs(20);   // 최근 20줄 출력
    } else if (cmd == 'd') {
      SD.remove(LOG_FILE);
      Serial.println("로그 파일 삭제 완료");
    }
  }

  // ---- 주기적 로그 저장 ----
  if (millis() - lastLogTime >= LOG_INTERVAL) {
    lastLogTime = millis();

    int adcRaw        = analogRead(ADC_PIN);               // 0~4095
    float voltage     = adcRaw * (3.3f / 4095.0f);        // 0.0~3.3V

    // CSV 한 줄 작성 (FILE_APPEND: 이어쓰기)
    File logFile = SD.open(LOG_FILE, FILE_APPEND);
    if (logFile) {
      logFile.print(millis()); logFile.print(",");
      logFile.print(adcRaw);   logFile.print(",");
      logFile.print(voltage, 3); logFile.print(",");
      logFile.println("ok");   // note 컬럼
      logFile.close();         // 파일 닫기 — 데이터 손실 방지

      logCount++;
      Serial.print("[로그#");
      Serial.print(logCount);
      Serial.print("] ADC=");
      Serial.print(adcRaw);
      Serial.print(", V=");
      Serial.print(voltage, 2);
      Serial.println("V");
    } else {
      Serial.println("[오류] 로그 파일 열기 실패!");
    }
  }
}

// ---- 로그 마지막 N줄 출력 ----
void readLastLogs(int lineCount) {
  Serial.print("--- 최근 ");
  Serial.print(lineCount);
  Serial.println("줄 ---");

  File logFile = SD.open(LOG_FILE, FILE_READ);
  if (!logFile) {
    Serial.println("[오류] 파일 열기 실패");
    return;
  }

  // 파일 전체를 읽어서 줄 단위로 저장 (간단한 구현)
  // 파일이 클 경우 순환 버퍼 구현 권장
  String lines[50];
  int count = 0;
  while (logFile.available() && count < 50) {
    lines[count % 50] = logFile.readStringUntil('\n');
    count++;
  }
  logFile.close();

  // 마지막 lineCount줄만 출력
  int start = max(0, count - lineCount);
  for (int i = start; i < count; i++) {
    Serial.println(lines[i % 50]);
  }
  Serial.println("---");
}
