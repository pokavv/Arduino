/*
 * 5-04 두 ESP32 간 UART 통신 설정
 * ================================================================
 */

#ifndef CONFIG_H
#define CONFIG_H

// USB 시리얼(UART0) 통신 속도
const int BAUD_RATE = 115200;

// 이 장치의 ID (두 장치를 구별하기 위해 사용)
// 두 번째 장치에 업로드할 때는 "ESP32-B"로 변경하세요
#define DEVICE_ID "ESP32-A"

// 메시지 전송 주기 (밀리초)
// 2000 = 2초마다 한 번씩 상대방에게 메시지를 보냄
const unsigned long SEND_INTERVAL = 2000;

// UART1 통신 속도 (두 장치 모두 동일하게 설정해야 합니다)
const int UART1_BAUD = 9600;

// UART1 핀 번호
const int UART1_RX_PIN = 20;  // G20: 상대 장치의 TX1과 연결 (데이터 수신)
const int UART1_TX_PIN = 21;  // G21: 상대 장치의 RX1과 연결 (데이터 송신)

#endif
