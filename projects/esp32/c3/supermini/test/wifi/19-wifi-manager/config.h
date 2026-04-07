#pragma once

#define BAUD_RATE  115200

// =============================================================
// [WiFiManager 설정]
// =============================================================
// 설정 포털 타임아웃: 이 시간 동안 Wi-Fi 설정 안 하면 재시도
#define CONFIG_PORTAL_TIMEOUT  120   // 초 단위 (2분)

// 설정 포털 AP 이름 (저장된 Wi-Fi 없을 때 열리는 AP)
#define PORTAL_AP_NAME  "ESP32-Config"
