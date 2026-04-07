/*
 * system/09-cpu-freq-change — CPU 주파수 동적 변경
 * ================================================================
 *
 * [핵심 개념 설명]
 *   CPU 클록 주파수 (Clock Frequency)
 *     - CPU가 1초에 수행하는 동작 횟수 (단위: MHz = 백만 Hz)
 *     - 160MHz → 1초에 1억 6천만 번 연산
 *     - 높을수록 빠르지만 전력 소비도 높음
 *
 *   동적 주파수 변경 (Dynamic Frequency Scaling)
 *     - 상황에 맞게 CPU 속도를 바꿔 전력을 아끼는 기술
 *     - 빠른 연산 필요할 때: 160MHz
 *     - 단순 대기, 센서 읽기: 80MHz로 낮춰 전력 절감
 *     - 배터리 제품에서 중요한 최적화 기법
 *
 *   전력 소비 비교 (대략적 수치)
 *     - 160MHz 활성: ~240mA
 *     - 80MHz 활성 : ~160mA
 *     - 딥슬립      : ~10uA (가장 낮음, system/05 참고)
 *
 *   주의: Wi-Fi/BLE 동작 중에는 주파수를 너무 낮추면
 *         통신 불안정 발생 가능 (80MHz 이상 유지 권장)
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"

bool isHighFreq = true;  // 현재 주파수 상태 추적

unsigned long lastSwitchTime = 0;  // 마지막 전환 시각

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" ESP32-C3 CPU 주파수 변경 예제");
  Serial.println("===================================");
  Serial.print("전환 주기: ");
  Serial.print(SWITCH_INTERVAL / 1000);
  Serial.println("초마다 전환");
  Serial.println();

  // 시작은 고주파수
  setCpuFrequencyMhz(FREQ_HIGH_MHZ);
  printFreqInfo();

  lastSwitchTime = millis();
}

void loop() {
  unsigned long now = millis();

  // SWITCH_INTERVAL마다 주파수 전환
  if (now - lastSwitchTime >= SWITCH_INTERVAL) {
    lastSwitchTime = now;

    if (isHighFreq) {
      // 고주파수 → 저주파수 (전력 절감 모드)
      setCpuFrequencyMhz(FREQ_LOW_MHZ);
      isHighFreq = false;
    } else {
      // 저주파수 → 고주파수 (고성능 모드)
      setCpuFrequencyMhz(FREQ_HIGH_MHZ);
      isHighFreq = true;
    }

    printFreqInfo();
  }

  // 간단한 연산 부하 (주파수 차이가 실행 속도에 영향 주는지 확인용)
  delay(500);
}

// ---- 현재 CPU 주파수 정보 출력 ----
void printFreqInfo() {
  uint32_t freq = getCpuFrequencyMhz();  // 실제 적용된 주파수 읽기

  Serial.print("CPU 주파수: ");
  Serial.print(freq);
  Serial.print(" MHz");

  if (freq >= FREQ_HIGH_MHZ) {
    Serial.println("  ← 고성능 모드 (연산 빠름, 전력 높음)");
  } else {
    Serial.println("  ← 저전력 모드 (연산 느림, 전력 낮음)");
  }

  Serial.print("APB 클록  : ");
  Serial.print(getApbFrequency() / 1000000);  // Hz → MHz 변환
  Serial.println(" MHz  (주변장치 기준 클록)");
  Serial.println();
}
