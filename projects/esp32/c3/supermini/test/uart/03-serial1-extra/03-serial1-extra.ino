/*
 * 5-03 UART1 추가 포트
 * ================================================================
 *
 * [핵심 개념 설명]
 *   ESP32-C3는 UART 포트를 여러 개 지원합니다.
 *   - UART0 (Serial)  : USB CDC를 통해 PC 시리얼 모니터와 연결
 *   - UART1 (Serial1) : 사용자가 원하는 GPIO 핀에 자유롭게 할당
 *
 *   핀 재할당(Pin Remapping)이란?
 *   일반 아두이노(Uno 등)는 UART 핀이 고정되어 있지만,
 *   ESP32-C3는 핀 매트릭스(Pin Matrix) 기능 덕분에
 *   거의 모든 GPIO를 UART RX/TX로 사용할 수 있습니다.
 *   Serial1.begin(baud, SERIAL_8N1, RX핀, TX핀) 형식으로 지정합니다.
 *
 *   SERIAL_8N1이란?
 *   UART 통신 형식 설정입니다:
 *   - 8  : 데이터 비트 8개 (1바이트)
 *   - N  : 패리티 없음 (No parity)
 *   - 1  : 스톱 비트 1개
 *   가장 일반적인 설정이며 대부분의 장치가 이 형식을 사용합니다.
 *
 *   TX(Transmit)와 RX(Receive) 교차 연결 원칙:
 *   장치A의 TX → 장치B의 RX  (A가 보낸 것을 B가 받음)
 *   장치A의 RX ← 장치B의 TX  (B가 보낸 것을 A가 받음)
 *   TX끼리, RX끼리 연결하면 절대 동작하지 않습니다!
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 1개
 *   - USB 케이블 (PC 연결용)
 *   - 외부 UART 장치 (다른 Arduino, GPS 모듈, 블루투스 모듈 등)
 *   - 점퍼 와이어
 *
 * [연결 방법]
 *   ESP32-C3         외부 UART 장치
 *   G20 (RX1)  ←── TX   (외부 장치의 송신 핀)
 *   G21 (TX1)  ──→ RX   (외부 장치의 수신 핀)
 *   GND        ───  GND  (반드시 공통 GND 연결!)
 *
 *   GND(Ground)란?
 *   전기 회로의 기준 전압(0V)입니다.
 *   두 장치가 통신하려면 반드시 GND를 공유해야 합니다.
 *   GND를 연결하지 않으면 신호 기준이 달라 통신이 불가능합니다.
 *
 *   루프백 테스트: G20과 G21을 점퍼 와이어로 직접 연결하면
 *   자기 자신에게 에코되어 장치 없이 동작을 확인할 수 있습니다.
 *
 *   시리얼 모니터: 115200 baud 로 엽니다.
 */

#include "config.h"

void setup() {
  // UART0: USB를 통해 PC 시리얼 모니터와 연결
  Serial.begin(BAUD_RATE);
  delay(500);  // USB CDC 안정화 대기

  // UART1: G20(RX), G21(TX) 핀에 지정된 baud rate로 시작
  // SERIAL_8N1 = 8비트 데이터, 패리티 없음, 스톱비트 1개
  Serial1.begin(UART1_BAUD, SERIAL_8N1, UART1_RX_PIN, UART1_TX_PIN);

  Serial.println("================================");
  Serial.println("  UART1 추가 포트 예제");
  Serial.println("================================");
  Serial.print("UART1 설정: RX=G");
  Serial.print(UART1_RX_PIN);
  Serial.print(", TX=G");
  Serial.print(UART1_TX_PIN);
  Serial.print(", 속도=");
  Serial.print(UART1_BAUD);
  Serial.println(" baud");
  Serial.println();
  Serial.println("G20(RX1)에 데이터가 들어오면 여기에 출력됩니다.");
  Serial.println("시리얼 모니터에서 입력하면 G21(TX1)로 내보냅니다.");
  Serial.println("(루프백 테스트: G20-G21 점퍼 연결 시 에코 동작)");
  Serial.println();
}

void loop() {
  // UART1로 수신된 데이터가 있으면 USB 시리얼(시리얼 모니터)로 중계합니다
  if (Serial1.available() > 0) {
    char c = Serial1.read();
    Serial.print("[UART1 수신] '");
    Serial.print(c);
    Serial.println("'");
  }

  // USB 시리얼(시리얼 모니터)에서 입력된 데이터가 있으면 UART1로 내보냅니다
  if (Serial.available() > 0) {
    char c = Serial.read();
    Serial1.print(c);
    Serial.print("[UART1 송신] '");
    Serial.print(c);
    Serial.println("'");
  }
}
