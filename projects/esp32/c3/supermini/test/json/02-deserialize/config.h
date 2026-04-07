#pragma once

// ===== 시리얼 통신 속도 =====
#define BAUD_RATE 115200    // 시리얼 모니터 속도

// ===== JSON 버퍼 크기 =====
#define JSON_DOC_SIZE 256   // JSON 파싱에 사용할 메모리 크기 (바이트)
                            // 너무 작으면 파싱 실패, 너무 크면 힙 낭비
