#pragma once

// =====================================================
// [핀 설정] PIR HC-SR501 모션 감지 센서
// =====================================================

// PIR 센서 출력 핀 (입력으로 읽음)
// HIGH: 모션 감지됨, LOW: 모션 없음
#define PIR_PIN           2

// 내장 LED 핀 (Active LOW: LOW=켜짐, HIGH=꺼짐)
#define LED_PIN           8

// 시리얼 통신 속도
#define BAUD_RATE         115200

// 모션 감지 후 LED 유지 시간 (밀리초)
// 5000 = 5초 동안 LED 켜진 상태 유지
#define MOTION_TIMEOUT    5000
