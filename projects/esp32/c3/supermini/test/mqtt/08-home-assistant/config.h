// config.h — Home Assistant MQTT Discovery 예제 설정
#pragma once

// ─── 시리얼 ────────────────────────────────────
#define BAUD_RATE 115200

// ─── MQTT 클라이언트 ID & 장치 식별 ────────────
#define MQTT_CLIENT_ID  "ESP32C3-ha-08"
#define DEVICE_ID       "esp32c3_supermini_01"   // HA에서 이 기기를 식별하는 ID
#define DEVICE_NAME     "ESP32-C3 Super Mini"

// ─── Home Assistant Discovery ───────────────────
// HA MQTT Discovery 기본 토픽 접두사 (HA 설정에서 변경 가능)
#define HA_DISCOVERY_PREFIX "homeassistant"

// 엔티티 종류: sensor, switch, binary_sensor, light 등
// 이 예제는 온도/습도 sensor 엔티티 등록
#define HA_COMPONENT    "sensor"

// 각 엔티티의 고유 object_id (HA 내 고유해야 함)
#define HA_TEMP_OBJECT_ID "esp32c3_temperature"
#define HA_HUM_OBJECT_ID  "esp32c3_humidity"

// 실제 센서 데이터를 발행할 토픽
#define SENSOR_TOPIC    "esp32c3/sensor/data"

// ─── LWT 설정 ───────────────────────────────────
#define LWT_TOPIC    "esp32c3/status"
#define LWT_MESSAGE  "offline"

// ─── 발행 주기 ──────────────────────────────────
#define PUBLISH_INTERVAL_MS 10000   // 10초마다 센서 값 발행

// ─── Wi-Fi 타임아웃 ─────────────────────────────
#define WIFI_CONNECT_TIMEOUT_MS 15000

// ─── 핀 ────────────────────────────────────────
#define BUILTIN_LED_PIN 8   // 내장 LED (Active LOW)
#define ADC_PIN         1   // ADC 핀 — 가상 온도에 노이즈 값으로 활용
