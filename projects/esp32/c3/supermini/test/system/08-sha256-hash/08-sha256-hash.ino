/*
 * system/08-sha256-hash — SHA-256 해시 계산 예제
 * ================================================================
 *
 * [핵심 개념 설명]
 *   해시 함수 (Hash Function)
 *     - 임의 길이의 데이터를 고정 길이의 값(해시)으로 변환하는 함수
 *     - SHA-256 결과는 항상 256비트 = 32바이트 = HEX 64자리
 *
 *   해시의 특성
 *     1) 단방향성: 해시에서 원본을 복구하는 것은 불가능 (AES와 다름!)
 *     2) 결정론적: 같은 입력 → 항상 같은 해시 출력
 *     3) 눈사태 효과: 입력 1비트만 달라도 해시 전체가 완전히 바뀜
 *     4) 충돌 저항성: 다른 두 입력이 같은 해시를 가질 확률이 극히 낮음
 *
 *   사용 예
 *     - 비밀번호 저장 (원문 아닌 해시만 DB에 저장)
 *     - 파일 무결성 검사 (파일이 변조됐는지 확인)
 *     - 디지털 서명의 기초
 *     - MQTT/HTTP 메시지 인증 (HMAC-SHA256)
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"
#include <mbedtls/sha256.h>   // ESP32 내장 SHA-256 라이브러리

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" ESP32-C3 SHA-256 해시 예제");
  Serial.println("===================================");

  // ---- 테스트 문자열 목록 ----
  const char* testStrings[] = {
    "Hello, World!",
    "hello, world!",    // 대소문자 하나 차이 → 해시 완전히 다름 (눈사태 효과)
    "ESP32-C3 Super Mini",
    "password123",
    ""                  // 빈 문자열도 해시 가능
  };
  int testCount = sizeof(testStrings) / sizeof(testStrings[0]);

  for (int i = 0; i < testCount; i++) {
    const char* input = testStrings[i];
    uint8_t hashResult[SHA256_OUTPUT_SIZE];  // 32바이트 결과 저장

    // ---- SHA-256 계산 ----
    // mbedtls_sha256(): 입력 → 해시 한 번에 계산
    // 마지막 인자 0 = SHA-256 (1이면 SHA-224)
    mbedtls_sha256((const unsigned char*)input, strlen(input), hashResult, 0);

    Serial.print("\n입력 문자열: \"");
    Serial.print(input);
    Serial.println("\"");
    Serial.print("SHA-256     : ");
    printHex(hashResult, SHA256_OUTPUT_SIZE);
  }

  // ---- 눈사태 효과 강조 ----
  Serial.println();
  Serial.println("--- 눈사태 효과 시연 ---");
  Serial.println("대문자 'H'를 소문자 'h'로만 바꿔도 해시 전체가 달라집니다.");

  Serial.println("===================================");
}

void loop() {
  delay(1000);
}

// ---- HEX 출력 헬퍼 함수 ----
void printHex(const uint8_t* data, size_t length) {
  for (size_t i = 0; i < length; i++) {
    if (data[i] < 0x10) Serial.print("0");  // 한 자리 앞에 0 채우기
    Serial.print(data[i], HEX);
  }
  Serial.println();
}
