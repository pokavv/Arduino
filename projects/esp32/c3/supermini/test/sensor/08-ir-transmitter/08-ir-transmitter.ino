/*
 * [핵심 개념] NEC 프로토콜 IR 적외선 송신
 * ==========================================
 * ESP32-C3에서 IR LED로 리모컨 신호를 직접 송신합니다.
 * TV, 에어컨 등을 ESP32로 제어할 수 있습니다.
 *
 * IR 송신 원리:
 *   - IR LED를 38kHz로 깜빡여 적외선 신호 생성
 *   - NEC 프로토콜 형식에 맞게 ON/OFF 패턴 생성
 *   - 38kHz는 사람 눈에 보이지 않지만 카메라로 보면 보임
 *
 * NEC 프로토콜 송신 데이터:
 *   sendNEC(주소, 명령어, 반복횟수)
 *   - 주소: 장치 식별 코드 (TV=0x0000 등)
 *   - 명령어: 버튼 코드 (전원=0x45 등)
 *   - 반복: 0=한 번만, 1 이상=반복 횟수
 *
 * 실제 사용 방법:
 *   1. 07-ir-receiver 예제로 리모컨 코드를 먼저 수신
 *   2. 수신된 HEX 코드를 config.h에 입력
 *   3. 이 예제로 같은 코드를 송신
 *
 * 시리얼 제어:
 *   시리얼 모니터에서 'S' 입력 → IR 신호 1회 송신
 *
 * [라이브러리]
 *   - IRremoteESP8266 (Arduino Library Manager)
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - IR LED (940nm 적외선 LED)
 *   - 100Ω ~ 220Ω 저항 (LED 전류 제한)
 *
 * [연결 방법]
 *   IR LED 긴 다리(+, 애노드)  → G2 → 100Ω 저항 → G2
 *   IR LED 짧은 다리(-, 캐소드) → GND
 *
 *   정확한 연결:
 *   G2 → [100Ω 저항] → IR LED 긴 다리 (+)
 *                       IR LED 짧은 다리 (−) → GND
 *
 *   주의: 저항 없이 직접 연결하면 LED 또는 ESP32 핀이 손상됩니다.
 *   송신 거리를 늘리려면: 저항을 낮추거나 NPN 트랜지스터로 전류 증폭
 */

#include <IRremoteESP8266.h>
#include <IRsend.h>
#include "config.h"

// IR 송신 객체 생성
IRsend irsend(IR_SEND_PIN);

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);
  Serial.println("===========================");
  Serial.println("IR 적외선 송신 예제");
  Serial.println("===========================");
  Serial.println("송신 핀: G" + String(IR_SEND_PIN));
  Serial.println("프로토콜: NEC");

  // HEX 값 출력 (0x 형식)
  Serial.print("주소: 0x");
  Serial.println(NEC_ADDRESS, HEX);
  Serial.print("명령어: 0x");
  Serial.println(NEC_COMMAND, HEX);

  Serial.println("---");
  Serial.println("시리얼 모니터에서 'S'를 입력하면 IR 신호를 송신합니다.");

  // IR 라이브러리 초기화
  irsend.begin();
}

void loop() {
  // 시리얼 입력 확인
  if (Serial.available() > 0) {
    char input = Serial.read();

    if (input == 'S' || input == 's') {
      sendIRSignal();
    } else {
      Serial.println("알 수 없는 명령. 'S'를 입력하세요.");
    }
  }
}

// -----------------------------------------------
// NEC IR 신호 송신
// -----------------------------------------------
void sendIRSignal() {
  Serial.print("IR 신호 송신 중... (NEC, 주소: 0x");
  Serial.print(NEC_ADDRESS, HEX);
  Serial.print(", 명령: 0x");
  Serial.print(NEC_COMMAND, HEX);
  Serial.print(")");

  // NEC 프로토콜로 신호 송신
  // sendNEC(주소, 명령어, 반복횟수)
  // 반복횟수 0 = 한 번만 송신
  irsend.sendNEC(NEC_ADDRESS, NEC_COMMAND, 0);

  Serial.println(" → 완료!");
  Serial.println("리모컨 대상 기기의 반응을 확인하세요.");
}
