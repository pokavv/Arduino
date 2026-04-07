/*
 * 2-04 아날로그 값 안정화 — 여러 번 읽어서 평균 내기
 * ================================================================
 *
 * [문제 — 왜 값이 흔들리나?]
 *   아날로그 핀은 주변의 전기 노이즈(전자기 간섭)에 민감하다.
 *   같은 전압을 계속 읽어도 값이 조금씩 달라진다.
 *   예: 2001, 1998, 2003, 1997, 2002 ...
 *   온도나 수분 같은 센서 값을 정밀하게 읽을 때 문제가 된다.
 *
 * [해결 — 평균 내기]
 *   여러 번 읽어서 합산한 뒤 횟수로 나누면 노이즈가 줄어든다.
 *   16번 읽어서 평균 → 훨씬 안정적인 값
 *   단점: 읽는 횟수만큼 시간이 조금 더 걸림 (16번 → 약 2ms 추가)
 *
 * [delayMicroseconds()란?]
 *   delay()는 ms(밀리초) 단위, 이건 μs(마이크로초) 단위.
 *   1000μs = 1ms. 매우 짧은 시간 기다릴 때 사용.
 *   읽기 사이에 아주 짧게 기다려서 핀이 안정화되도록 한다.
 *
 * [준비물 / 연결 방법]
 *   01-basic-read와 동일 (가변저항 → G0)
 */

#include "config.h"

// SAMPLE_COUNT번 읽어서 평균값을 돌려주는 함수
int readADCAverage(int pin) {
    long sum = 0;
    for (int i = 0; i < SAMPLE_COUNT; i++) {
        sum += analogRead(pin);
        delayMicroseconds(100);   // 0.1ms씩 기다리며 안정화
    }
    return sum / SAMPLE_COUNT;
}

void setup() {
    Serial.begin(115200);
    Serial.println("시작! 단일 읽기 vs 평균 읽기 비교해봐");
    Serial.println("가변저항을 천천히 돌리면 평균값이 더 안정적으로 따라오는 걸 볼 수 있어");
}

void loop() {
    int single = analogRead(ADC_PIN);         // 한 번만 읽기 (흔들릴 수 있음)
    int avg    = readADCAverage(ADC_PIN);     // 16번 읽어서 평균 (안정적)

    Serial.print("단일 읽기: ");
    Serial.print(single);
    Serial.print("  |  평균 읽기 (");
    Serial.print(SAMPLE_COUNT);
    Serial.print("회): ");
    Serial.println(avg);

    delay(200);
}
