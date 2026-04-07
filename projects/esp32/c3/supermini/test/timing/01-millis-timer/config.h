/*
 * 4-01 millis 타이머 설정
 * ================================================================
 * 주기 간격 상수를 정의합니다.
 */

#ifndef CONFIG_H
#define CONFIG_H

// 시리얼 출력 주기 (밀리초)
// 이 값을 바꾸면 출력 빈도가 달라집니다
const unsigned long PRINT_INTERVAL = 1000;  // 1초마다 출력

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

#endif
