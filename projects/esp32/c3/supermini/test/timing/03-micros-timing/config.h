/*
 * 4-03 micros() 고정밀 타이밍 설정
 * ================================================================
 */

#ifndef CONFIG_H
#define CONFIG_H

// 테스트 루프 반복 횟수 (이 루프의 실행 시간을 측정합니다)
const int TEST_LOOP_COUNT = 1000;

// 측정 반복 주기 (밀리초) — 이 간격마다 한 번씩 측정합니다
const unsigned long MEASURE_INTERVAL = 2000;

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

#endif
