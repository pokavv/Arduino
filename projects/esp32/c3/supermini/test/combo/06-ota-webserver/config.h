#pragma once

// ===== 포트 설정 =====
#define WEB_PORT 80      // HTTP 웹 서버 포트
#define OTA_PORT 3232    // OTA 업데이트 포트

// ===== OTA 보안 =====
#define OTA_HOSTNAME "esp32c3-ota"    // mDNS 호스트명 (esp32c3-ota.local)
#define OTA_PASSWORD "ota-password"   // OTA 업데이트 비밀번호 (변경 권장!)
