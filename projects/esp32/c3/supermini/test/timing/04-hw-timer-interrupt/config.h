/*
 * 4-04 하드웨어 타이머 인터럽트 설정
 * ================================================================
 */

#ifndef CONFIG_H
#define CONFIG_H

// 타이머 주기 (마이크로초)
// 1,000,000 us = 1초
const uint64_t TIMER_INTERVAL_US = 1000000;

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

#endif
