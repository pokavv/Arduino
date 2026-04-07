/*
 * 4-02 다중 millis 타이머 설정
 * ================================================================
 * 세 개의 독립적인 타이머 주기를 정의합니다.
 */

#ifndef CONFIG_H
#define CONFIG_H

// 내장 LED 핀 번호 (G8, Active LOW)
const int LED_PIN = 8;

// LED 깜빡임 주기 (밀리초)
const unsigned long BLINK_INTERVAL = 500;    // 0.5초마다 LED 토글

// 가상 센서 읽기 주기 (밀리초)
const unsigned long SENSOR_INTERVAL = 2000;  // 2초마다 센서 값 출력

// 상태 요약 출력 주기 (밀리초)
const unsigned long STATUS_INTERVAL = 5000;  // 5초마다 상태 요약

// 시리얼 통신 속도
const int BAUD_RATE = 115200;

#endif
