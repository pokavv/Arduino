/*
 * 3-08 수동 부저로 소리 내기 (단음)
 * ================================================================
 *
 * [수동 부저 vs 능동 부저]
 *   능동(active) 부저: 전원만 연결하면 자체적으로 소리 남. 주파수 조절 불가.
 *   수동(passive) 부저: PWM 신호로 주파수를 바꿔줘야 소리 남.
 *                       이 예제는 수동 부저 사용.
 *
 *   구별 방법: 모듈 뒷면에 회로가 보이면 수동, 검은 칠이 되어 있으면 능동.
 *
 * [소리 원리]
 *   부저 안에 얇은 금속판이 있고, 전류가 흐르면 진동한다.
 *   빠르게 껐다 켰다(PWM)하면 진동 속도가 달라져서 음높이가 바뀐다.
 *   440Hz = 라(A4) 음, 523Hz = 도(C5) 음 등
 *
 * [준비물]
 *   수동 부저 1개
 *
 * [연결 방법]
 *   부저 + 다리 → G2
 *   부저 - 다리 → GND
 *   (극성이 없는 경우도 있음 — 소리 안 나면 반대로 꽂아볼 것)
 */

#include "config.h"

void playTone(int freq, int durationMs) {
    if (freq == 0) {
        // 주파수 0 = 묵음 (쉬기)
        ledcWrite(BUZZER_CHANNEL, 0);
    } else {
        ledcWriteTone(BUZZER_CHANNEL, freq);   // 해당 주파수로 소리 내기
        ledcWrite(BUZZER_CHANNEL, 128);         // 듀티 50% = 가장 큰 소리
    }
    delay(durationMs);
    ledcWrite(BUZZER_CHANNEL, 0);   // 소리 끄기
    delay(50);                      // 음 사이 짧은 묵음 (음이 뭉치지 않게)
}

void setup() {
    Serial.begin(115200);
    ledcSetup(BUZZER_CHANNEL, 2000, 8);   // 초기 주파수는 나중에 ledcWriteTone으로 바꿈
    ledcAttachPin(BUZZER_PIN, BUZZER_CHANNEL);
    Serial.println("시작! 도레미파솔라시도 연주");
}

void loop() {
    // 도레미파솔라시도 (C4 옥타브)
    playTone(NOTE_C4,  400);   // 도
    playTone(NOTE_D4,  400);   // 레
    playTone(NOTE_E4,  400);   // 미
    playTone(NOTE_F4,  400);   // 파
    playTone(NOTE_G4,  400);   // 솔
    playTone(NOTE_A4,  400);   // 라
    playTone(NOTE_B4,  400);   // 시
    playTone(NOTE_C5,  600);   // 도 (높은)

    delay(1000);
}
