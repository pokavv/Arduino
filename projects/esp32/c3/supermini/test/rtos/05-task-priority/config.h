#pragma once

// ===== 시리얼 통신 속도 =====
#define BAUD_RATE 115200   // 시리얼 모니터 속도

// ===== 태스크 우선순위 =====
// FreeRTOS: 0이 가장 낮음, 숫자가 클수록 높은 우선순위
// configMAX_PRIORITIES - 1 이 최대값 (보통 24)
#define PRIORITY_HIGH  3   // 높은 우선순위 태스크
#define PRIORITY_LOW   1   // 낮은 우선순위 태스크
