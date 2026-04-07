/*
 * 2-04 아날로그 값 안정화 — 여러 번 읽어서 평균 내기
 *
 * 문제:
 *   아날로그 핀은 주변 전기 노이즈 때문에 같은 전압을 연속으로 읽어도
 *   값이 조금씩 흔들린다. 예: 2000, 2003, 1998, 2001, 1997 ...
 *
 * 해결:
 *   여러 번 읽어서 평균을 내면 흔들림이 줄어든다.
 *   16번 읽어서 평균 → 훨씬 안정적인 값이 나온다.
 *   단점: 많이 읽을수록 시간이 조금 더 걸린다.
 *
 * 연결 방법:
 *   가변저항 왼쪽 → GND, 가운데 → G0, 오른쪽 → 3.3V
 */

#include "config.h"

// SAMPLE_COUNT번 읽어서 평균값을 돌려주는 함수
int readADCAverage(int pin) {
    long sum = 0;
    for (int i = 0; i < SAMPLE_COUNT; i++) {
        sum += analogRead(pin);
        delayMicroseconds(100);   // 읽기 사이에 아주 짧게 기다리기 (안정화)
    }
    return sum / SAMPLE_COUNT;   // 합계 ÷ 횟수 = 평균
}

void setup() {
    Serial.begin(115200);
    Serial.println("시작! 단일 읽기 vs 평균 읽기 비교해봐");
}

void loop() {
    int raw = analogRead(ADC_PIN);           // 그냥 한 번 읽기 (흔들릴 수 있음)
    int avg = readADCAverage(ADC_PIN);       // 16번 읽어서 평균 (안정적)

    Serial.print("그냥 읽기: ");
    Serial.print(raw);
    Serial.print("  |  평균 읽기(");
    Serial.print(SAMPLE_COUNT);
    Serial.print("회): ");
    Serial.println(avg);

    delay(200);
}
