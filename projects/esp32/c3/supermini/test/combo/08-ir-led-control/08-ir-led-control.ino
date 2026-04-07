/*
 * combo/08-ir-led-control — IR 리모컨으로 LED 제어
 * ================================================================
 *
 * [핵심 개념 설명]
 *   적외선(IR) 통신
 *     - 리모컨은 38kHz로 변조된 적외선 신호를 방출
 *     - IR 수신 모듈(TSOP38238 등)이 신호를 받아 디지털 신호로 변환
 *     - NEC, Sony, RC5 등 다양한 프로토콜 — IRremote 라이브러리가 자동 인식
 *
 *   IR 키코드 확인 방법
 *     - 먼저 이 코드를 업로드하면 시리얼 모니터에 키코드 출력
 *     - 원하는 버튼의 코드를 config.h에 입력
 *
 *   IR 수신 모듈 (TSOP38238, VS1838B 등)
 *     - 핀: VCC(3.3V), GND, OUT(신호 출력)
 *     - 출력 신호: Active LOW (신호 없으면 HIGH, 신호 오면 LOW 펄스)
 *
 * [라이브러리]
 *   IRremote (shirriff/IRremote) — 라이브러리 매니저에서 설치
 *   "IRremote" 검색 → 버전 4.x 설치 권장
 *
 * [준비물]
 *   - IR 수신 모듈 1개 (TSOP38238 또는 VS1838B)
 *   - IR 리모컨 (TV 리모컨 등 NEC 프로토콜 계열)
 *
 * [연결 방법]
 *   IR 수신 모듈 (왼쪽 다리부터 — 모듈 정면 기준)
 *   OUT  → G2 (IR_RECV_PIN)
 *   GND  → GND
 *   VCC  → 3.3V
 *
 *   G8 (LED_PIN) = 내장 LED (Active LOW)
 */

#include "config.h"
#include <IRremote.hpp>   // IRremote v4.x 헤더

int ledBrightness = 128;  // 외부 LED 밝기 (0~255) — 내장 LED는 ON/OFF만

void setup() {
  Serial.begin(BAUD_RATE);
  delay(1000);

  Serial.println("===================================");
  Serial.println(" IR 리모컨 LED 제어");
  Serial.println("===================================");

  // ---- LED 핀 설정 ----
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);  // 초기: 꺼짐 (Active LOW)

  // ---- IR 수신기 초기화 ----
  // begin(핀, 피드백LED여부, 피드백LED핀)
  IrReceiver.begin(IR_RECV_PIN, DISABLE_LED_FEEDBACK);

  Serial.print("IR 수신 준비 완료 (G");
  Serial.print(IR_RECV_PIN);
  Serial.println(")");
  Serial.println("리모컨 버튼을 눌러보세요 — 코드가 출력됩니다.");
  Serial.println();
  Serial.println("config.h에서 IR_KEY_POWER, IR_KEY_VOL_UP, IR_KEY_VOL_DN 설정");
}

void loop() {
  // ---- IR 신호 수신 확인 ----
  if (IrReceiver.decode()) {
    uint32_t code = IrReceiver.decodedIRData.decodedRawData;  // 수신된 코드
    uint8_t  protocol = IrReceiver.decodedIRData.protocol;

    // 디버그 출력
    Serial.print("[IR] 프로토콜: ");
    Serial.print(getProtocolString(protocol));
    Serial.print(" / 코드: 0x");
    Serial.print(code, HEX);

    // ---- 키코드별 동작 ----
    if (code == IR_KEY_POWER) {
      // 전원 버튼: LED 토글
      bool currentState = (digitalRead(LED_PIN) == LOW);  // LOW = 켜짐
      bool newState = !currentState;
      digitalWrite(LED_PIN, newState ? HIGH : LOW);  // Active LOW 반전
      Serial.print(" → LED ");
      Serial.println(newState ? "꺼짐" : "켜짐");

    } else if (code == IR_KEY_VOL_UP) {
      // 볼륨+ 버튼: 밝기 증가 (외부 LED용)
      ledBrightness = min(255, ledBrightness + 25);
      Serial.print(" → 밝기 증가: ");
      Serial.println(ledBrightness);

    } else if (code == IR_KEY_VOL_DN) {
      // 볼륨- 버튼: 밝기 감소
      ledBrightness = max(0, ledBrightness - 25);
      Serial.print(" → 밝기 감소: ");
      Serial.println(ledBrightness);

    } else {
      Serial.println(" → (등록되지 않은 키)");
    }

    IrReceiver.resume();  // 다음 신호 수신 준비 — 반드시 호출!
  }
}
