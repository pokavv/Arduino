#pragma once

// ===== ADC 핀 (센서 입력) =====
#define ADC_PIN 0           // G0 = ADC1_CH0 (주의: G0는 부팅핀)

// ===== 배터리 전압 분압 비율 =====
// 배터리 4.2V를 ADC 최대(3.3V)에 맞게 분압
// 분압 공식: V_out = V_in * R2 / (R1 + R2)
// R1=100kΩ, R2=100kΩ → V_out = V_in * 0.5 (최대 8.4V 측정 가능)
#define VOLTAGE_DIVIDER_RATIO 2.0f  // V_adc * 2.0 = V_battery

// ===== 딥슬립 시간 =====
#define SLEEP_DURATION_SEC 300      // 5분(300초) 딥슬립

// ===== MQTT 토픽 =====
#define TOPIC_SENSOR  "battery-node/sensor"   // 센서 데이터 발행
#define TOPIC_BATTERY "battery-node/battery"  // 배터리 전압 발행
