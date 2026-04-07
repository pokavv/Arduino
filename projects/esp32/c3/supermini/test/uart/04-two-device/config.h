/*
 * 5-04 두 장치 간 UART 통신 설정
 * ================================================================
 *
 * 역할 선택: ROLE_SENDER 또는 ROLE_RECEIVER 중 하나만 활성화하세요.
 * 업로드할 때 각 보드에 맞는 역할을 선택해야 합니다.
 */

#ifndef CONFIG_H
#define CONFIG_H

// ★ 역할 설정: 이 줄을 주석 처리하면 수신기 역할이 됩니다
#define ROLE_SENDER

// UART 통신에 사용할 핀
const int TX_PIN = 5;  // G5: 데이터 송신 핀
const int RX_PIN = 4;  // G4: 데이터 수신 핀

// UART 통신 속도
const int BAUD_RATE = 9600;

// 송신 주기 (밀리초) — 송신기 역할일 때만 사용
const unsigned long SEND_INTERVAL = 1000;

// UART0 (USB) 모니터링 속도
const int MONITOR_BAUD = 115200;

#endif
