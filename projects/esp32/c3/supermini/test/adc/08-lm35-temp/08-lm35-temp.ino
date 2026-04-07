/*
 * 2-08 LM35 온도 센서
 * ================================================================
 *
 * [LM35란?]
 *   다리 3개짜리 온도 측정 부품.
 *   특징: 온도가 1°C 오를 때마다 출력 전압이 10mV 오른다.
 *   0°C  → 0mV   (0V)
 *   25°C → 250mV (0.25V)
 *   100°C → 1000mV (1V)
 *
 * [온도 계산 순서]
 *   1단계: analogRead()로 숫자(0~4095) 읽기
 *   2단계: 숫자 → mV 변환: 숫자 × (3300 ÷ 4095)
 *          (3300을 쓰는 이유: 3.3V = 3300mV)
 *   3단계: mV → 온도: mV ÷ 10
 *          (LM35가 10mV/°C 이므로 10으로 나눔)
 *
 * [LM35 핀 방향 확인 방법]
 *   글자(LM35)가 적힌 평평한 면을 자기 쪽으로 향하게 잡으면:
 *   왼쪽 다리  = VCC (전원, 3.3V에 연결)
 *   가운데 다리 = VOUT (전압 출력, G0에 연결)
 *   오른쪽 다리 = GND (접지)
 *
 *   핀 방향을 반대로 꽂으면 부품이 뜨거워지며 망가질 수 있으니 주의!
 *
 * [준비물]
 *   LM35 온도 센서 1개
 *
 * [연결 방법]
 *   LM35 왼쪽 다리(VCC)     → 3.3V 핀
 *   LM35 가운데 다리(VOUT)  → G0 핀
 *   LM35 오른쪽 다리(GND)   → GND 핀
 */

#include "config.h"

void setup() {
    Serial.begin(115200);
    Serial.println("시작! LM35 온도 센서 읽기");
    Serial.println("손가락으로 센서를 만지면 온도가 올라가는 걸 볼 수 있어");
}

void loop() {
    int raw = analogRead(LM35_PIN);

    float millivolts = raw * (3300.0f / 4095.0f);   // 숫자 → mV 변환
    float tempC = millivolts / 10.0f;                // mV ÷ 10 = °C (LM35 특성)

    Serial.print("숫자: ");
    Serial.print(raw);
    Serial.print("  mV: ");
    Serial.print(millivolts, 1);
    Serial.print("  온도: ");
    Serial.print(tempC, 1);
    Serial.println(" °C");

    delay(1000);
}
