/*
 * [핵심 개념] SPI SD 카드 파일 읽기/쓰기
 * ==========================================
 * SD 카드도 SPI 방식으로 통신합니다.
 * MOSI/MISO/SCK는 공유하고, CS 핀으로 어떤 기기와 통신할지 선택합니다.
 *
 * SD 카드 주의사항:
 *   - FAT16/FAT32 포맷 필요 (NTFS 안 됨)
 *   - 파일명은 8.3 형식 권장 (8글자.3글자)
 *   - SD 카드 모듈은 3.3V ~ 5V 허용하지만 카드 자체는 3.3V
 *   - SD 모듈의 레벨시프터가 전압을 변환해줌
 *
 * MISO 핀 필요:
 *   SD 카드는 TFT와 달리 데이터를 ESP32로도 보낼 수 있어
 *   MISO (Master In Slave Out) 핀이 필요합니다.
 *
 * 파일 열기 모드:
 *   FILE_WRITE  : 새 파일 생성 또는 파일 처음부터 쓰기
 *   FILE_APPEND : 파일 끝에 이어쓰기
 *   FILE_READ   : 파일 읽기
 *
 * [라이브러리]
 *   - SD (Arduino 기본 라이브러리)
 *   - SPI (Arduino 기본 라이브러리)
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - SD 카드 모듈 (SPI 방식)
 *   - microSD 카드 (FAT32 포맷)
 *
 * [연결 방법]
 *   SD 모듈 VCC  → 3.3V 또는 5V (모듈 사양 확인)
 *   SD 모듈 GND  → GND
 *   SD 모듈 MOSI → G6
 *   SD 모듈 MISO → G5
 *   SD 모듈 SCK  → G4
 *   SD 모듈 CS   → G7
 */

#include <SPI.h>
#include <SD.h>
#include "config.h"

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);  // 시리얼 모니터 연결 대기
  Serial.println("=============================");
  Serial.println("SD 카드 파일 읽기/쓰기 예제");
  Serial.println("=============================");

  // SPI 핀 설정 (ESP32-C3는 기본 SPI 핀이 다를 수 있어 명시적으로 설정)
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);

  // SD 카드 초기화
  // SD.begin(CS핀): CS 핀을 지정하여 SD 카드 초기화
  if (!SD.begin(SD_CS)) {
    Serial.println("[오류] SD 카드 초기화 실패!");
    Serial.println("확인 사항:");
    Serial.println("  1. SD 카드가 제대로 꽂혀 있는지 확인");
    Serial.println("  2. 연결 핀이 맞는지 확인 (MOSI/MISO/SCK/CS)");
    Serial.println("  3. SD 카드가 FAT32로 포맷되어 있는지 확인");
    while (true) {
      delay(1000);  // 오류 시 정지
    }
  }

  Serial.println("[성공] SD 카드 초기화 완료!");

  // SD 카드 용량 정보 출력
  printCardInfo();

  // 파일 쓰기 테스트
  testFileWrite();

  // 파일 읽기 테스트
  testFileRead();

  // 파일 삭제 테스트
  testFileDelete();

  Serial.println("\n모든 테스트 완료!");
}

void loop() {
  // 이 예제는 setup에서 모두 실행
  delay(10000);
}

// -----------------------------------------------
// SD 카드 정보 출력
// -----------------------------------------------
void printCardInfo() {
  Serial.println("\n--- SD 카드 정보 ---");

  // 카드 타입
  uint8_t cardType = SD.cardType();
  Serial.print("카드 타입: ");
  switch (cardType) {
    case CARD_MMC:  Serial.println("MMC");   break;
    case CARD_SD:   Serial.println("SDSC");  break;
    case CARD_SDHC: Serial.println("SDHC");  break;
    default:        Serial.println("알 수 없음"); break;
  }

  // 카드 용량
  uint64_t cardSize = SD.cardSize() / (1024 * 1024);  // MB로 변환
  Serial.print("카드 용량: ");
  Serial.print((unsigned long)cardSize);
  Serial.println(" MB");
}

// -----------------------------------------------
// 파일 쓰기 테스트
// -----------------------------------------------
void testFileWrite() {
  Serial.println("\n--- 파일 쓰기 테스트 ---");
  Serial.print("파일 생성 중: ");
  Serial.println(TEST_FILE);

  // FILE_WRITE: 새 파일을 만들거나 기존 파일을 처음부터 덮어씀
  File file = SD.open(TEST_FILE, FILE_WRITE);

  if (!file) {
    Serial.println("[오류] 파일을 열 수 없습니다!");
    return;
  }

  // 파일에 데이터 쓰기
  file.println("ESP32-C3 SD 카드 테스트");
  file.println("-----------------------------");
  file.print("millis: ");
  file.println(millis());
  file.println("Hello from ESP32-C3!");

  // 숫자 데이터 쓰기
  for (int i = 1; i <= 5; i++) {
    file.print("Line ");
    file.print(i);
    file.print(": value=");
    file.println(i * 10);
  }

  file.close();  // 반드시 파일을 닫아야 데이터가 저장됨
  Serial.println("[성공] 파일 쓰기 완료!");
}

// -----------------------------------------------
// 파일 읽기 테스트
// -----------------------------------------------
void testFileRead() {
  Serial.println("\n--- 파일 읽기 테스트 ---");
  Serial.print("파일 읽는 중: ");
  Serial.println(TEST_FILE);

  // FILE_READ: 읽기 전용으로 파일 열기
  File file = SD.open(TEST_FILE, FILE_READ);

  if (!file) {
    Serial.println("[오류] 파일을 열 수 없습니다!");
    return;
  }

  Serial.println("--- 파일 내용 ---");

  // 파일을 한 줄씩 읽기
  while (file.available()) {
    // readStringUntil('\n'): 줄바꿈 문자까지 읽기
    String line = file.readStringUntil('\n');
    Serial.println(line);
  }

  Serial.println("--- 파일 끝 ---");
  file.close();
  Serial.println("[성공] 파일 읽기 완료!");
}

// -----------------------------------------------
// 파일 삭제 테스트
// -----------------------------------------------
void testFileDelete() {
  Serial.println("\n--- 파일 삭제 테스트 ---");

  // 파일 존재 여부 확인
  if (SD.exists(TEST_FILE)) {
    SD.remove(TEST_FILE);
    Serial.println("[성공] 파일 삭제 완료!");
  } else {
    Serial.println("[알림] 삭제할 파일이 없습니다.");
  }

  // 삭제 확인
  if (!SD.exists(TEST_FILE)) {
    Serial.println("[확인] 파일이 성공적으로 삭제되었습니다.");
  }
}
