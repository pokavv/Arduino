/*
 * system/02-memory-info — 메모리 사용량 실시간 모니터링
 * ================================================================
 *
 * [핵심 개념 설명]
 *   Heap (힙) 메모리
 *     - 프로그램 실행 중 동적으로 할당/해제하는 메모리 영역
 *     - String, 배열 등 가변 크기 데이터가 여기에 올라감
 *     - 힙이 부족하면 malloc() 실패 → 크래시 발생
 *
 *   스케치 공간 (Sketch Space)
 *     - 프로그램 코드(.ino 컴파일 결과)가 저장되는 플래시 영역
 *     - 업로드 가능한 최대 크기 = 플래시 크기 - 파티션 오버헤드
 *
 *   메모리 누수 (Memory Leak)
 *     - 할당한 메모리를 해제하지 않아 힙이 조금씩 줄어드는 현상
 *     - 이 예제로 힙이 시간이 지나도 안정적인지 확인 가능
 *
 * [준비물]
 *   없음 — 보드만으로 테스트 가능
 *
 * [연결 방법]
 *   없음 — USB로 PC에 연결 후 시리얼 모니터(115200bps) 열기
 */

#include "config.h"

unsigned long lastPrintTime = 0;  // 마지막 출력 시각 기록 (millis 기반)

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);  // 시리얼 안정화

  Serial.println("===================================");
  Serial.println(" ESP32-C3 메모리 정보 모니터");
  Serial.println("===================================");
}

void loop() {
  unsigned long now = millis();  // 현재 시각 (ms)

  // PRINT_INTERVAL(2000ms)마다 메모리 정보 출력
  if (now - lastPrintTime >= PRINT_INTERVAL) {
    lastPrintTime = now;
    printMemoryInfo();
  }
}

// ---- 메모리 정보 출력 함수 ----
void printMemoryInfo() {
  Serial.println("---- 메모리 현황 ----");

  // [힙 메모리]
  uint32_t heapSize    = ESP.getHeapSize();    // 전체 힙 크기 (바이트)
  uint32_t freeHeap    = ESP.getFreeHeap();    // 현재 사용 가능한 힙 (바이트)
  uint32_t usedHeap    = heapSize - freeHeap;  // 현재 사용 중인 힙
  float    heapUsagePct = (float)usedHeap / heapSize * 100.0f;  // 사용률(%)

  Serial.print("힙 전체    : ");
  Serial.print(heapSize);
  Serial.println(" bytes");

  Serial.print("힙 사용 중 : ");
  Serial.print(usedHeap);
  Serial.print(" bytes (");
  Serial.print(heapUsagePct, 1);  // 소수점 1자리
  Serial.println("%)");

  Serial.print("힙 여유    : ");
  Serial.print(freeHeap);
  Serial.println(" bytes");

  // [최소 여유 힙] — 부팅 이후 힙이 가장 부족했던 순간의 값
  Serial.print("힙 최솟값  : ");
  Serial.print(ESP.getMinFreeHeap());
  Serial.println(" bytes  ← 메모리 누수 확인용");

  // [스케치 공간]
  Serial.print("스케치 여유: ");
  Serial.print(ESP.getFreeSketchSpace() / 1024);  // KB 단위로 표시
  Serial.println(" KB");

  // [플래시 전체 크기]
  Serial.print("플래시 전체: ");
  Serial.print(ESP.getFlashChipSize() / (1024 * 1024));  // MB 단위
  Serial.println(" MB");

  // [PSRAM — 외부 RAM, C3 Super Mini는 없는 경우가 많음]
  Serial.print("PSRAM 여유 : ");
  Serial.print(ESP.getFreePsram());
  Serial.println(" bytes (없으면 0)");

  Serial.println();
}
