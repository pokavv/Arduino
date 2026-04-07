/*
 * 3-09 수동 부저로 멜로디 연주
 * ================================================================
 *
 * [이 예제에서 배우는 것]
 *   음표 배열(음 + 박자)을 만들어서 순서대로 재생하는 방법.
 *   배열로 관리하면 다른 곡으로 쉽게 교체 가능.
 *
 * [음표 배열 구조]
 *   {음 주파수, 박자(ms)} 형태로 묶음.
 *   주파수 0 = 쉬기 (묵음)
 *
 * [준비물 / 연결 방법]
 *   08-buzzer-tone 과 동일
 *   부저 + → G2, 부저 - → GND
 */

#include "config.h"

// 음표 구조체: 주파수(Hz)와 박자(ms)
struct Note {
    int freq;
    int duration;
};

// 학교종이 멜로디
const Note melody[] = {
    {NOTE_G4, 300}, {NOTE_G4, 300}, {NOTE_A4, 300}, {NOTE_A4, 300},
    {NOTE_G4, 300}, {NOTE_G4, 300}, {NOTE_E4, 600},
    {NOTE_G4, 300}, {NOTE_G4, 300}, {NOTE_E4, 300}, {NOTE_E4, 300},
    {NOTE_D4, 900},
    {NOTE_G4, 300}, {NOTE_G4, 300}, {NOTE_A4, 300}, {NOTE_A4, 300},
    {NOTE_G4, 300}, {NOTE_G4, 300}, {NOTE_E4, 600},
    {NOTE_G4, 300}, {NOTE_E4, 300}, {NOTE_D4, 300}, {NOTE_E4, 300},
    {NOTE_C4, 900},
};

const int MELODY_LEN = sizeof(melody) / sizeof(melody[0]);

void playNote(int freq, int durationMs) {
    if (freq == 0) {
        ledcWrite(BUZZER_CHANNEL, 0);
    } else {
        ledcWriteTone(BUZZER_CHANNEL, freq);
        ledcWrite(BUZZER_CHANNEL, 128);
    }
    delay(durationMs);
    ledcWrite(BUZZER_CHANNEL, 0);
    delay(30);   // 음 사이 간격
}

void setup() {
    Serial.begin(115200);
    ledcSetup(BUZZER_CHANNEL, 2000, 8);
    ledcAttachPin(BUZZER_PIN, BUZZER_CHANNEL);
    Serial.println("시작! 학교종이 멜로디 연주");
}

void loop() {
    Serial.println("♪ 학교종이 댕댕댕 ♪");
    for (int i = 0; i < MELODY_LEN; i++) {
        playNote(melody[i].freq, melody[i].duration);
    }
    delay(2000);   // 곡 끝나고 2초 쉬기
}
