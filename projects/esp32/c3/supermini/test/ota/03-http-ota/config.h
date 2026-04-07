#pragma once

// 시리얼 통신 속도 (bps)
#define BAUD_RATE        115200

// 펌웨어 서버 URL — .bin 파일이 위치한 HTTP URL
// 예: "http://192.168.1.100:8080/firmware.bin"
// 예: "http://your-domain.com/esp32/firmware.bin"
#define FIRMWARE_URL     "http://your-server/firmware.bin"

// 현재 펌웨어 버전 (서버 버전과 비교하여 업데이트 여부 결정 가능)
#define FIRMWARE_VERSION "1.0.0"

// OTA 업데이트 확인 주기 (ms)
#define UPDATE_CHECK_INTERVAL  300000  // 5분
