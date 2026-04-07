#pragma once

// ===== 센서/액추에이터 핀 =====
#define DHT_PIN  2    // G2 → DHT22 DATA 핀
#define LED_PIN  8    // G8 = 내장 LED (Active LOW)

// ===== MQTT 발행 주기 =====
#define PUBLISH_INTERVAL 30000   // 30초마다 센서 데이터 발행 (ms)

// ===== MQTT 토픽 =====
#define TOPIC_TEMP    "home/sensor/temperature"  // 온도 발행
#define TOPIC_HUM     "home/sensor/humidity"     // 습도 발행
#define TOPIC_LED_CMD "home/led/command"         // LED 명령 구독 (ON/OFF)
#define TOPIC_LED_STA "home/led/status"          // LED 상태 발행
