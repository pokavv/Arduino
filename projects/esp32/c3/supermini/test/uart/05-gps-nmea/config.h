/*
 * 5-05 GPS NMEA 파싱 설정
 * ================================================================
 */

#ifndef CONFIG_H
#define CONFIG_H

// GPS 모듈 연결 핀
// Neo-6M GPS: TX → G4(RX핀), RX → G5(TX핀)
const int GPS_RX_PIN = 4;  // ESP32가 GPS로부터 데이터를 받는 핀
const int GPS_TX_PIN = 5;  // ESP32가 GPS에 명령을 보내는 핀 (보통 사용 안 함)

// GPS 모듈 통신 속도 (Neo-6M 기본값)
const int GPS_BAUD = 9600;

// USB 시리얼 모니터 속도
const int SERIAL_BAUD = 115200;

#endif
