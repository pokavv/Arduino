/*
 * 5-01 UART0 기본 송수신
 * ================================================================
 *
 * [핵심 개념 설명]
 *   UART(Universal Asynchronous Receiver Transmitter)는
 *   두 장치가 직렬로 데이터를 주고받는 통신 방식입니다.
 *   아두이노에서는 Serial 객체로 사용합니다.
 *
 *   ESP32-C3에서 Serial(UART0)은 USB CDC를 통해
 *   PC의 시리얼 모니터와 연결됩니다.
 *
 *   주요 함수:
 *   - Serial.begin(baud): 통신 속도 설정 및 시작
 *   - Serial.println(text): 텍스트 + 줄바꿈 출력
 *   - Serial.available(): 받은 데이터 바이트 수 반환
 *   - Serial.read(): 받은 데이터 한 바이트 읽기
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 1개
 *   - USB 케이블
 *
 * [연결 방법]
 *   USB로 PC에 연결 후 Arduino IDE 시리얼 모니터를 115200 baud로 엽니다.
 *   시리얼 모니터에서 문자를 보내면 그대로 돌려줍니다(에코).
 */

#include "config.h"

void setup() {
  // UART0 시작 — PC와 통신할 준비
  Serial.begin(BAUD_RATE);

  // USB CDC가 안정화될 때까지 잠깐 기다립니다
  delay(500);

  // 부팅 인사 메시지
  Serial.println("================================");
  Serial.println("  ESP32-C3 UART 기본 송수신");
  Serial.println("================================");
  Serial.println("시리얼 모니터에서 문자를 입력하면");
  Serial.println("에코(그대로 돌려줌)로 응답합니다.");
  Serial.println();
}

void loop() {
  // 받은 데이터가 있는지 확인합니다
  if (Serial.available() > 0) {
    // 받은 바이트를 하나 읽습니다
    char received = Serial.read();

    // 읽은 내용을 그대로 돌려줍니다 (에코)
    Serial.print(ECHO_PREFIX);
    Serial.print("받은 문자: '");
    Serial.print(received);
    Serial.print("'  ASCII 코드: ");
    Serial.println((int)received);
  }
}
