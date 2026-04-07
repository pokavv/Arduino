/*
 * system/07-aes-encrypt — AES-128 ECB 암호화/복호화 예제
 * ================================================================
 *
 * [핵심 개념 설명]
 *   AES (Advanced Encryption Standard)
 *     - 현재 가장 널리 쓰이는 대칭 키 암호화 표준
 *     - 대칭 키: 암호화와 복호화에 같은 키를 사용
 *     - 키 길이: 128비트(16바이트), 192비트, 256비트 중 선택
 *
 *   ECB (Electronic CodeBook) 모드
 *     - 가장 단순한 AES 동작 모드
 *     - 같은 16바이트 블록은 항상 같은 암호문으로 변환됨 (보안 취약점 있음)
 *     - 실제 보안이 중요한 곳에는 CBC/GCM 모드 권장
 *     - 학습 목적으로 ECB 사용
 *
 *   패딩 (Padding)
 *     - AES는 정확히 16바이트 배수 단위로만 처리
 *     - 데이터가 16바이트보다 짧으면 0으로 채움 (Zero Padding)
 *
 *   ESP32의 mbedTLS
 *     - ESP32 SDK에 내장된 암호화 라이브러리
 *     - 별도 설치 없이 바로 사용 가능
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"
#include <mbedtls/aes.h>    // ESP32 내장 AES 라이브러리

// ---- 암호화 키 (16바이트 = 128비트) ----
// 실제 프로젝트에서는 secrets.h에 분리하고 Git에서 제외해야 함
const uint8_t AES_KEY[AES_KEY_BITS / 8] = {
  0x2B, 0x7E, 0x15, 0x16,  // 키 바이트 1~4
  0x28, 0xAE, 0xD2, 0xA6,  // 키 바이트 5~8
  0xAB, 0xF7, 0x15, 0x88,  // 키 바이트 9~12
  0x09, 0xCF, 0x4F, 0x3C   // 키 바이트 13~16
};

// ---- 암호화할 원본 데이터 (정확히 16바이트) ----
const char PLAINTEXT[AES_BLOCK_SIZE + 1] = "Hello ESP32-C3!!";  // 마지막 +1은 null 종단

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" ESP32-C3 AES-128 ECB 암복호화");
  Serial.println("===================================");

  uint8_t encrypted[AES_BLOCK_SIZE];  // 암호문 저장 버퍼
  uint8_t decrypted[AES_BLOCK_SIZE];  // 복호문 저장 버퍼

  // ---- 원본 데이터 출력 ----
  Serial.print("원본 텍스트  : ");
  Serial.println(PLAINTEXT);
  Serial.print("원본 HEX     : ");
  printHex((const uint8_t*)PLAINTEXT, AES_BLOCK_SIZE);

  // ---- AES 암호화 ----
  mbedtls_aes_context aesCtx;         // AES 컨텍스트 구조체
  mbedtls_aes_init(&aesCtx);          // 초기화

  // 암호화 키 설정 (AES_ENCRYPT: 암호화 방향)
  mbedtls_aes_setkey_enc(&aesCtx, AES_KEY, AES_KEY_BITS);

  // ECB 단일 블록 암호화
  mbedtls_aes_crypt_ecb(&aesCtx, MBEDTLS_AES_ENCRYPT,
                         (const uint8_t*)PLAINTEXT, encrypted);

  Serial.print("암호문 HEX   : ");
  printHex(encrypted, AES_BLOCK_SIZE);

  // ---- AES 복호화 ----
  // 복호화 키 설정 (AES_DECRYPT: 복호화 방향)
  mbedtls_aes_setkey_dec(&aesCtx, AES_KEY, AES_KEY_BITS);

  // ECB 단일 블록 복호화
  mbedtls_aes_crypt_ecb(&aesCtx, MBEDTLS_AES_DECRYPT, encrypted, decrypted);

  mbedtls_aes_free(&aesCtx);  // 메모리 해제

  // 복호화 결과를 문자열로 출력 (null 종단 추가)
  char decryptedStr[AES_BLOCK_SIZE + 1];
  memcpy(decryptedStr, decrypted, AES_BLOCK_SIZE);
  decryptedStr[AES_BLOCK_SIZE] = '\0';

  Serial.print("복호화 텍스트: ");
  Serial.println(decryptedStr);

  // ---- 원본과 복호화 결과 비교 ----
  bool match = (memcmp(PLAINTEXT, decryptedStr, AES_BLOCK_SIZE) == 0);
  Serial.print("검증 결과    : ");
  Serial.println(match ? "일치 — 암복호화 성공!" : "불일치 — 오류!");

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
    Serial.print(" ");
  }
  Serial.println();
}
