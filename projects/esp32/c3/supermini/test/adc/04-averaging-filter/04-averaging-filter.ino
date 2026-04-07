/*
 * 2-04 평균값 필터 (노이즈 제거)
 *
 * ADC는 전기적 노이즈로 매 읽기마다 값이 흔들린다.
 * N번 읽어서 평균을 내면 노이즈가 크게 줄어든다.
 * 샘플 수가 많을수록 안정적이지만 응답이 느려진다.
 *
 * 회로:
 *   G0 → 가변저항 또는 센서
 */

#include "config.h"

// SAMPLE_COUNT개 읽어서 평균 반환
int readADCAverage(int pin) {
    long sum = 0;
    for (int i = 0; i < SAMPLE_COUNT; i++) {
        sum += analogRead(pin);
        delayMicroseconds(100);  // 채널 안정화 대기
    }
    return sum / SAMPLE_COUNT;
}

void setup() {
    Serial.begin(115200);
    Serial.println("averaging-filter 시작");
    Serial.print("샘플 수: ");
    Serial.println(SAMPLE_COUNT);
}

void loop() {
    int raw    = analogRead(ADC_PIN);        // 단일 읽기 (노이즈 있음)
    int avg    = readADCAverage(ADC_PIN);    // 평균 읽기 (노이즈 감소)

    Serial.print("단일: ");
    Serial.print(raw);
    Serial.print("  평균(");
    Serial.print(SAMPLE_COUNT);
    Serial.print("회): ");
    Serial.println(avg);

    delay(200);
}
