#pragma once

// =====================================================
// [핀 설정] HC-SR04 초음파 거리 센서
// =====================================================

// TRIG: 초음파 발사 신호 (출력)
// 이 핀을 10마이크로초 HIGH로 만들면 초음파 발사
#define TRIG_PIN          3

// ECHO: 초음파 수신 신호 (입력)
// 초음파가 돌아오면 이 핀이 HIGH, 걸린 시간으로 거리 계산
#define ECHO_PIN          2

// 시리얼 통신 속도
#define BAUD_RATE         115200

// 측정 주기 (밀리초)
#define MEASURE_INTERVAL  200

// HC-SR04 측정 가능 범위
#define MIN_DISTANCE_CM   2     // 최소 측정 거리 (cm)
#define MAX_DISTANCE_CM   400   // 최대 측정 거리 (cm)

// 초음파 속도 계산 상수
// 음속 340m/s → 거리(cm) = 펄스시간(μs) / 58
// (왕복 거리이므로 2로 나누면: cm = μs / 58)
#define SOUND_SPEED_DIVIDER 58
