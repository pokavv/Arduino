#pragma once

// ===== 시리얼 통신 속도 =====
#define BAUD_RATE 115200   // 시리얼 모니터 속도

// ===== 버튼 핀 =====
// G9 = BOOT 버튼 (누르면 LOW, Active LOW)
// 부팅핀이므로 부팅 완료 후에만 입력으로 안전하게 사용 가능
#define BUTTON_PIN 9       // G9 BOOT 버튼 — 부팅 완료 후 일반 입력으로 사용
