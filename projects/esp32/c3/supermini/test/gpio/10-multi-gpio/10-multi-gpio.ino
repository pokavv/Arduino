/*
 * 1-10 LED 여러 개 동시에 제어하기
 *
 * LED가 4개일 때 핀을 하나하나 써도 되지만,
 * 배열(목록)로 묶으면 for 반복문으로 한 번에 처리할 수 있다.
 * LED가 10개, 20개로 늘어나도 코드를 거의 안 바꿔도 된다.
 *
 * "배열"이란?
 *   같은 종류의 값을 여러 개 묶어서 하나의 이름으로 관리하는 것.
 *   ledPins[0] = 첫 번째, ledPins[1] = 두 번째 ...
 *
 * 연결 방법:
 *   G2 → 저항(220옴) → LED1 → GND
 *   G3 → 저항(220옴) → LED2 → GND
 *   G4 → 저항(220옴) → LED3 → GND
 *   G5 → 저항(220옴) → LED4 → GND
 */

#include "config.h"

// LED 핀 번호 목록 (배열)
const int ledPins[] = { LED1_PIN, LED2_PIN, LED3_PIN, LED4_PIN };

// 배열 크기 자동 계산 — 나중에 LED 추가해도 이 줄은 안 바꿔도 됨
const int LED_COUNT = sizeof(ledPins) / sizeof(ledPins[0]);

void setup() {
    Serial.begin(115200);

    // 모든 LED 핀을 출력으로 설정하고 꺼두기
    for (int i = 0; i < LED_COUNT; i++) {
        pinMode(ledPins[i], OUTPUT);
        digitalWrite(ledPins[i], LOW);
    }
    Serial.println("시작! LED 4개가 순서대로 켜지고 꺼질 거야");
}

void loop() {
    // 순서대로 하나씩 켜기
    Serial.println("순서대로 켜기");
    for (int i = 0; i < LED_COUNT; i++) {
        digitalWrite(ledPins[i], HIGH);
        delay(200);
    }

    // 순서대로 하나씩 끄기
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
