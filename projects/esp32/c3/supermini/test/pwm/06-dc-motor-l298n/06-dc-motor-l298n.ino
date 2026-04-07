/*
 * 3-06 DC 모터 속도 제어 (L298N 드라이버)
 * ================================================================
 *
 * [DC 모터를 직접 ESP32에 연결하면 안 되는 이유]
 *   DC 모터는 수백 mA ~ 수 A의 전류가 필요하다.
 *   ESP32 GPIO 핀은 최대 40mA — 모터를 직접 연결하면 보드가 망가진다.
 *   반드시 모터 드라이버(L298N) 또는 MOSFET을 사이에 둬야 한다.
 *
 * [L298N 모터 드라이버 핀 설명]
 *   ENA : 모터A 속도 제어 (PWM 신호 입력) → G2에 연결
 *   IN1 : 모터A 방향 제어 핀 1 → G3에 연결
 *   IN2 : 모터A 방향 제어 핀 2 → G4에 연결
 *   OUT1, OUT2 : 모터A 연결 단자
 *   12V : 외부 전원 입력 (6~12V)
 *   GND : ESP32 GND와 반드시 공통 연결
 *   5V  : L298N에서 나오는 5V 출력 (ESP32 전원으로 사용 가능)
 *
 * [속도만 제어하는 이 예제]
 *   IN1=HIGH, IN2=LOW → 정방향으로 고정
 *   ENA PWM 듀티값으로 속도만 조절
 *
 * [준비물]
 *   L298N 모터 드라이버 1개, DC 모터 1개, 외부 전원 (6~12V)
 *
 * [연결 방법]
 *   L298N ENA → ESP32 G2 (PWM 속도)
 *   L298N IN1 → ESP32 G3 (방향)
 *   L298N IN2 → ESP32 G4 (방향)
 *   L298N GND → ESP32 GND (공통 GND 필수!)
 *   L298N 12V → 외부 전원 +
 *   L298N OUT1, OUT2 → DC 모터
 */

#include "config.h"

void setup() {
    Serial.begin(115200);

    // ENA 핀을 PWM으로 설정 (속도 제어)
    ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
    ledcAttachPin(ENA_PIN, PWM_CHANNEL);

    // IN1, IN2를 출력으로 설정
    pinMode(IN1_PIN, OUTPUT);
    pinMode(IN2_PIN, OUTPUT);

    // 정방향 고정
    digitalWrite(IN1_PIN, HIGH);
    digitalWrite(IN2_PIN, LOW);

    Serial.println("시작! 모터 속도가 점점 빨라졌다가 느려질 거야");
}

void loop() {
    // 속도 올리기 (0 → 최대)
    Serial.println("속도 올리는 중...");
    for (int speed = 0; speed <= 255; speed += 10) {
        ledcWrite(PWM_CHANNEL, speed);
        Serial.print("속도: ");
        Serial.println(speed);
        delay(100);
    }

    delay(1000);

    // 속도 내리기 (최대 → 0)
    Serial.println("속도 줄이는 중...");
    for (int speed = 255; speed >= 0; speed -= 10) {
        ledcWrite(PWM_CHANNEL, speed);
        Serial.print("속도: ");
        Serial.println(speed);
        delay(100);
    }

    delay(1000);
}
