#pragma once

#define SOIL_PIN        0    // 아날로그 출력
#define SENSOR_VCC_PIN  2    // 센서 전원 (측정 시에만 켬)

// 실제 센서로 캘리브레이션 필요
#define DRY_VALUE   3500    // 완전 건조 시 raw 값
#define WET_VALUE    500    // 물에 담갔을 때 raw 값
