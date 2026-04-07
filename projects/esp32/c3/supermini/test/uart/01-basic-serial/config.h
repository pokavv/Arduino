/*
 * 5-01 UART 기본 송수신 설정
 * ================================================================
 */

#ifndef CONFIG_H
#define CONFIG_H

// 시리얼 통신 속도 (bps)
// Arduino IDE 시리얼 모니터에서 같은 값으로 맞춰야 합니다
const int BAUD_RATE = 115200;

// 에코 출력 앞에 붙이는 접두어
#define ECHO_PREFIX "[Echo] "

#endif
