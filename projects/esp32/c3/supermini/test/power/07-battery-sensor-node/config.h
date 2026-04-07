#pragma once

// 시리얼 통신 속도 (bps)
#define BAUD_RATE            115200

// 딥슬립 지속 시간 (초) — 배터리 절약을 위해 길게 설정
#define SLEEP_DURATION_SEC   60    // 1분마다 측정

// ADC 핀 (센서 연결)
#define SENSOR_PIN           0     // G0: 아날로그 센서 입력

// Wi-Fi 연결 타임아웃 (ms)
#define WIFI_TIMEOUT_MS      15000  // 15초

// MQTT 설정
#define MQTT_PORT            1883
#define MQTT_TOPIC           "sensor/esp32c3/data"
#define MQTT_CLIENT_ID       "esp32c3-battery-node"
