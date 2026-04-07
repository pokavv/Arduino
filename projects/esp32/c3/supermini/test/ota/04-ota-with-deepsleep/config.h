#pragma once

// 시리얼 통신 속도 (bps)
#define BAUD_RATE            115200

// 딥슬립 지속 시간 (초)
#define SLEEP_DURATION_SEC   3600   // 1시간

// 웨이크업 후 OTA 대기 시간 (ms)
// 이 시간 동안 OTA 업데이트를 기다린 후 없으면 딥슬립 진입
#define OTA_WINDOW_MS        30000  // 30초

// OTA 설정
#define OTA_PORT             3232
#define OTA_HOSTNAME         "esp32c3-sleep"
