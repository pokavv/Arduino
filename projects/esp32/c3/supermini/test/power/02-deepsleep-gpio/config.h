#pragma once

// 시리얼 통신 속도 (bps)
#define BAUD_RATE    115200

// 웨이크업 GPIO 핀 번호
// G9 = BOOT 버튼 (보드에 이미 내장된 버튼, 별도 연결 불필요)
// 버튼 누르면 LOW 신호 발생 → 딥슬립 해제
#define WAKEUP_PIN   9
