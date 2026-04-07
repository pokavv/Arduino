/*
 * 4-05 millis 오버플로우 안전 처리 설정
 * ================================================================
 */

#ifndef CONFIG_H
#define CONFIG_H

// 오버플로우 테스트에서 사용할 인터벌 (밀리초)
const unsigned long TEST_INTERVAL = 1000;

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

#endif
