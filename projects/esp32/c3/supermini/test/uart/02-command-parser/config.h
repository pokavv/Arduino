/*
 * 5-02 시리얼 명령어 파서 설정
 * ================================================================
 */

#ifndef CONFIG_H
#define CONFIG_H

// 내장 LED 핀 번호 (G8, Active LOW)
const int LED_PIN = 8;

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

// 명령어 버퍼 최대 길이 (바이트)
// 이 크기를 넘는 명령어는 잘려서 무시됩니다
const int BUFFER_SIZE = 64;

#endif
