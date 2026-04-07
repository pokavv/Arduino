/*
 * 5-03 UART1 추가 포트 설정
 * ================================================================
 */

#ifndef CONFIG_H
#define CONFIG_H

// USB 시리얼(UART0) 통신 속도
const int BAUD_RATE = 115200;

// UART1 통신 속도
// 외부 장치(센서, 모듈 등)의 기본 baud rate는 보통 9600입니다
const int UART1_BAUD = 9600;

// UART1에 사용할 핀 번호
// ESP32-C3는 UART 핀을 GPIO 어디에든 자유롭게 지정할 수 있습니다
const int UART1_RX_PIN = 20;  // G20: 외부 장치의 TX와 연결 (데이터 수신)
const int UART1_TX_PIN = 21;  // G21: 외부 장치의 RX와 연결 (데이터 송신)

#endif
