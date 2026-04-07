/*
 * system/06-hardware-rng — 하드웨어 난수 생성기(TRNG)
 * ================================================================
 *
 * [핵심 개념 설명]
 *   하드웨어 난수 생성기 (True Random Number Generator, TRNG)
 *     - 소프트웨어 난수(random())는 "시드(seed)" 값에서 수학적으로 계산
 *       → 같은 시드면 같은 수열이 나옴 (예측 가능)
 *     - 하드웨어 난수는 실제 물리적 잡음(열잡음, 양자 노이즈 등)을 이용
 *       → 진짜 예측 불가능한 값 생성
 *     - ESP32의 esp_random()은 RF 수신 회로의 잡음을 씨드로 사용
 *
 *   사용 예
 *     - 암호화 키 생성 (가장 중요한 용도)
 *     - OTP(일회용 비밀번호) 생성
 *     - 게임의 공정한 무작위 이벤트
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"
#include <esp_random.h>   // esp_random() 함수 포함

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" ESP32-C3 하드웨어 난수 생성기");
  Serial.println("===================================");
  Serial.println();
}

void loop() {
  // ---- 난수 생성 및 통계 계산 ----
  Serial.print("난수 ");
  Serial.print(SAMPLE_COUNT);
  Serial.println("개 생성:");

  int samples[SAMPLE_COUNT];  // 생성된 난수 저장 배열
  long sum  = 0;
  int  minV = RAND_MAX;
  int  maxV = RAND_MIN;

  for (int i = 0; i < SAMPLE_COUNT; i++) {
    // esp_random()은 0 ~ UINT32_MAX 범위의 32비트 값 반환
    // 원하는 범위로 변환: (esp_random() % 범위크기) + 최솟값
    uint32_t raw    = esp_random();
    int value       = (raw % (RAND_MAX - RAND_MIN + 1)) + RAND_MIN;
    samples[i]      = value;
    sum            += value;
    if (value < minV) minV = value;
    if (value > maxV) maxV = value;

    Serial.print("  [");
    if (i + 1 < 10) Serial.print(" ");  // 한 자리 숫자 앞에 공백 (정렬)
    Serial.print(i + 1);
    Serial.print("] : ");
    Serial.println(value);
  }

  // ---- 통계 출력 ----
  float avg = (float)sum / SAMPLE_COUNT;
  Serial.println("---- 통계 ----");
  Serial.print("  최솟값 : "); Serial.println(minV);
  Serial.print("  최댓값 : "); Serial.println(maxV);
  Serial.print("  평균   : "); Serial.println(avg, 1);
  Serial.print("  이론적 평균 (");
  Serial.print(RAND_MIN); Serial.print("~"); Serial.print(RAND_MAX);
  Serial.print(") : "); Serial.println((RAND_MIN + RAND_MAX) / 2.0f, 1);
  Serial.println();

  // GEN_INTERVAL(3000ms)마다 반복
  delay(GEN_INTERVAL);
}
