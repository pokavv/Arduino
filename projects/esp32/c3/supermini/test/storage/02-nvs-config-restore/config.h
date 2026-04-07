#pragma once

// 시리얼 통신 속도 (bps)
#define BAUD_RATE         115200

// NVS 네임스페이스
#define NVS_NAMESPACE     "config"

// 기본값 (NVS에 저장된 값이 없을 때 사용)
#define DEFAULT_INTERVAL  1000    // 기본 주기 (ms)
#define DEFAULT_BRIGHTNESS 50     // 기본 밝기 (0~100)

// 값 범위 제한
#define MIN_INTERVAL      100     // 최소 주기 (ms)
#define MAX_INTERVAL      10000   // 최대 주기 (ms)
#define MIN_BRIGHTNESS    0       // 최소 밝기
#define MAX_BRIGHTNESS    100     // 최대 밝기
