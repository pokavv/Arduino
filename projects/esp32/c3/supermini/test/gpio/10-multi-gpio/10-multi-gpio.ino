/*
 * 1-10 LED 여러 개 동시에 제어하기
 * ================================================================
 *
 * [준비물]
 *   LED 4개, 220Ω 저항 4개, 점퍼 와이어
 *
 * [연결 방법]
 *   G2 → 저항(220Ω) → LED1 긴 다리 → LED1 짧은 다리 → GND
 *   G3 → 저항(220Ω) → LED2 긴 다리 → LED2 짧은 다리 → GND
 *   G4 → 저항(220Ω) → LED3 긴 다리 → LED3 짧은 다리 → GND
 *   G5 → 저항(220Ω) → LED4 긴 다리 → LED4 짧은 다리 → GND
 *
 * [배열이란?]
 *   같은 종류 값을 여러 개 묶어서 하나의 이름으로 관리하는 것.
 *   ledPins[0] = 첫 번째 LED 핀
 *   ledPins[1] = 두 번째 LED 핀
 *   ...
 *   for 반복문으로 한 번에 처리 가능.
 *   LED가 10개로 늘어도 배열에 추가만 하면 되어 코드 변경이 적다.
 *
 * [sizeof()란?]
 *   배열의 크기를 자동으로 계산해주는 함수.
 *   LED를 추가해도 이 줄은 안 바꿔도 된다.
 */

#include "config.h"

const int ledPins[] = { LED1_PIN, LED2_PIN, LED3_PIN, LED4_PIN };
const int LED_COUNT = sizeof(ledPins) / sizeof(ledPins[0]);   // LED 개수 자동 계산

void setup() {
    Serial.begin(115200);
    for (int i = 0; i < LED_COUNT; i++) {
        pinMode(ledPins[i], OUTPUT);
        digitalWrite(ledPins[i], LOW);   // 처음엔 전부 꺼두기
    }
    Serial.println("시작! LED 4개가 순서대로 켜지고 꺼질 거야");
}

void loop() {
    // 1번부터 순서대로 하나씩 켜기
    Serial.println("순서대로 켜기");
    for (int i = 0; i < LED_COUNT; i++) {
        digitalWrite(ledPins[i], HIGH);
        delay(200);
    }

    // 1번부터 순서대로 하나씩 끄기
    Serial.println("순서대로 끄기");
    for (int i = 0; i < LED_COUNT; i++) {
        digitalWrite(ledPins[i], LOW);
        delay(200);
    }

    // 전체 동시에 켜기
    Serial.println("전체 동시 켜기");
    for (int i = 0; i < LED_COUNT; i++) digitalWrite(ledPins[i], HIGH);
    delay(500);

    // 전체 동시에 끄기
    Serial.println("전체 동시 끄기");
    for (int i = 0; i < LED_COUNT; i++) digitalWrite(ledPins[i], LOW);
    delay(500);
}
