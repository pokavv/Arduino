/*
 * [핵심 개념] NEC 프로토콜 IR 적외선 수신
 * ==========================================
 * 텔레비전 리모컨이 사용하는 적외선(IR) 신호를 수신합니다.
 *
 * IR 통신 원리:
 *   - 적외선 LED에서 38kHz(초당 3만8천번) 깜빡이는 빛을 방출
 *   - IR 수신기 모듈은 38kHz 신호만 통과시켜 노이즈를 걸러냄
 *   - 수신기 출력: 신호 있음 → LOW, 없음 → HIGH (Active LOW)
 *
 * NEC 프로토콜:
 *   리모컨에서 가장 많이 쓰이는 IR 프로토콜
 *   구조: [리더 코드] [주소 16비트] [커맨드 16비트]
 *   - 리더: 9ms LOW + 4.5ms HIGH
 *   - 비트 '0': 562μs LOW + 562μs HIGH
 *   - 비트 '1': 562μs LOW + 1686μs HIGH
 *   - 총 32비트 데이터 전송
 *
 * 수신된 HEX 코드 의미:
 *   리모컨 버튼마다 고유한 HEX 코드가 있음
 *   예) 0xFF30CF = 특정 버튼
 *   시리얼 출력으로 각 버튼의 코드를 확인할 수 있음
 *
 * [라이브러리]
 *   방법 1: IRremoteESP8266 (ESP32용, 권장)
 *     Arduino Library Manager에서 "IRremoteESP8266" 검색 설치
 *   방법 2: IRremote
 *     Arduino Library Manager에서 "IRremote" 검색 설치
 *
 * [준비물]
 *   - ESP32-C3 Super Mini
 *   - IR 수신기 모듈 (VS1838B 또는 유사)
 *   - 리모컨 (TV, 에어컨 등 어떤 것이든)
 *
 * [연결 방법]
 *   IR 수신기 3핀 (앞면이 돔 형태, 뒷면이 평평):
 *     왼쪽 핀  → 시그널 → G2
 *     가운데 핀 → GND
 *     오른쪽 핀 → VCC → 3.3V
 *
 *   (핀 순서는 제조사마다 다를 수 있으니 데이터시트 확인)
 */

// IRremoteESP8266 라이브러리 사용
#include <IRrecv.h>
#include <IRremoteESP8266.h>
#include <IRutils.h>
#include "config.h"

// IR 수신기 객체 생성
// IRrecv(핀, 버퍼크기, 타임아웃, 리더코드저장여부)
IRrecv irrecv(IR_RECV_PIN, 1024, 15, true);

// 수신된 데이터를 담을 구조체
decode_results results;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);
  Serial.println("===========================");
  Serial.println("IR 적외선 수신 예제");
  Serial.println("===========================");
  Serial.println("수신 핀: G" + String(IR_RECV_PIN));
  Serial.println("리모컨을 수신기 방향으로 누르세요.");
  Serial.println("---");

  // IR 수신 시작
  irrecv.enableIRIn();
  Serial.println("[대기 중] IR 신호 수신 대기...");
}

void loop() {
  // 수신된 IR 신호가 있는지 확인
  if (irrecv.decode(&results)) {

    // 수신된 프로토콜 종류 출력
    Serial.print("프로토콜: ");
    Serial.println(typeToString(results.decode_type, results.repeat));

    // 수신된 HEX 코드 출력
    Serial.print("HEX 코드: 0x");
    Serial.println(results.value, HEX);

    // 10진수로도 출력
    Serial.print("DEC 코드: ");
    Serial.println(results.value);

    // 비트 수 출력
    Serial.print("비트 수: ");
    Serial.println(results.bits);

    // 반복 신호 여부 (버튼 누르고 있으면 repeat=true)
    if (results.repeat) {
      Serial.println("(버튼 계속 누르는 중)");
    }

    Serial.println("---");

    // 다음 신호 수신 준비
    irrecv.resume();
  }
}
