/*
 * 5-05 GPS NMEA 파싱 설정
 * ================================================================
 */

#ifndef CONFIG_H
#define CONFIG_H

// USB 시리얼(UART0) 통신 속도
const int BAUD_RATE = 115200;

// GPS 모듈 통신 속도 (대부분의 GPS 모듈 기본값)
const int GPS_BAUD = 9600;

// GPS 모듈 연결 핀
// GPS 모듈의 TX → ESP32 G20(RX1): GPS가 보내는 위치 데이터를 받습니다
// GPS 모듈의 RX → ESP32 G21(TX1): ESP32가 GPS에 명령 전송 (보통 불필요)
const int GPS_RX_PIN = 20;  // G20: GPS TX 연결
const int GPS_TX_PIN = 21;  // G21: GPS RX 연결 (선택)

// NMEA 문장 버퍼 크기 (GPS 한 줄은 최대 82자)
const int NMEA_BUFFER_SIZE = 100;

#endif
