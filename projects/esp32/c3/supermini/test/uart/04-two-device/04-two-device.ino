/*
 * 5-04 두 ESP32 간 UART 통신
 * ================================================================
 *
 * [핵심 개념 설명]
 *   두 마이크로컨트롤러를 UART로 직접 연결하는 예제입니다.
 *   한쪽(ESP32-A)은 2초마다 메시지를 보내고,
 *   반대쪽(ESP32-B)은 그 메시지를 받아 시리얼 모니터에 출력합니다.
 *   두 장치 모두 수신과 송신을 동시에 할 수 있습니다 (전이중, Full-Duplex).
 *
 *   이 스케치에서는:
 *   - 2초마다 "{DEVICE_ID}: Hello {카운터}" 형식 메시지를 UART1(G21)로 전송
 *   - UART1(G20)로 수신된 데이터는 Serial(USB)로 출력
 *
 *   두 보드에 업로드하는 방법:
 *   1. config.h에서 DEVICE_ID를 "ESP32-A"로 설정 → 첫 번째 보드에 업로드
 *   2. config.h에서 DEVICE_ID를 "ESP32-B"로 변경 → 두 번째 보드에 업로드
 *   3. 두 보드를 아래 연결 방법대로 연결
 *   4. 각 보드의 시리얼 모니터를 열면 상대방 메시지가 출력됩니다
 *
 * [준비물]
 *   - ESP32-C3 Super Mini 2개
 *   - USB 케이블 2개 (각 보드를 PC에 연결)
 *   - 점퍼 와이어 3개
 *
 * [연결 방법]
 *   장치A(ESP32-A)       장치B(ESP32-B)
 *   G21 (TX1)  ──────── G20 (RX1)   ← A가 보낸 것을 B가 받음
 *   G20 (RX1)  ──────── G21 (TX1)   ← B가 보낸 것을 A가 받음
 *   GND        ──────── GND          (공통 GND 필수!)
 *
 *   주의:
 *   - TX끼리, RX끼리 연결하면 동작하지 않습니다 (교차 연결!)
 *   - GND를 반드시 공유해야 신호 기준이 맞습니다
 *   - 두 장치의 UART1 통신 속도(UART1_BAUD)는 동일해야 합니다
 */

#include "config.h"

// 마지막 메시지 전송 시각 (millis() 기반 타이머)
unsigned long lastSendMs = 0;

// 전송 카운터 (누적 송신 횟수)
unsigned long sendCounter = 0;

void setup() {
  // UART0: USB CDC를 통해 PC 시리얼 모니터와 연결
  Serial.begin(BAUD_RATE);
  delay(500);  // USB CDC 안정화 대기

  // UART1: 다른 ESP32와 통신 (G20=RX, G21=TX)
  Serial1.begin(UART1_BAUD, SERIAL_8N1, UART1_RX_PIN, UART1_TX_PIN);

  Serial.println("================================");
  Serial.println("  두 ESP32 간 UART 통신");
  Serial.println("================================");
  Serial.print("장치 ID    : ");
  Serial.println(DEVICE_ID);
  Serial.print("UART1 설정 : RX=G");
  Serial.print(UART1_RX_PIN);
  Serial.print(", TX=G");
  Serial.print(UART1_TX_PIN);
  Serial.print(", 속도=");
  Serial.print(UART1_BAUD);
  Serial.println(" baud");
  Serial.print("전송 주기  : ");
  Serial.print(SEND_INTERVAL / 1000);
  Serial.println("초");
  Serial.println();
  Serial.println("상대방 메시지를 기다리는 중...");
  Serial.println();
}

void loop() {
  unsigned long nowMs = millis();

  // ---- 송신: SEND_INTERVAL마다 상대방에게 메시지 전송 ----
  // millis() 뺄셈 패턴으로 오버플로우 안전 처리
  if (nowMs - lastSendMs >= SEND_INTERVAL) {
    lastSendMs = nowMs;
    sendCounter++;

    // "{DEVICE_ID}: Hello {카운터}" 형식으로 UART1 전송
    Serial1.print(DEVICE_ID);
    Serial1.print(": Hello ");
    Serial1.println(sendCounter);

    // 시리얼 모니터에도 송신 내용 표시 (확인용)
    Serial.print("[송신] ");
    Serial.print(DEVICE_ID);
    Serial.print(": Hello ");
    Serial.println(sendCounter);
  }

  // ---- 수신: UART1로 들어온 데이터를 Serial(USB)로 출력 ----
  if (Serial1.available() > 0) {
    // readStringUntil('\n'): 줄바꿈까지 한 줄을 통째로 읽습니다
    String received = Serial1.readStringUntil('\n');
    received.trim();  // 앞뒤 공백, 줄바꿈(\r\n) 제거
    if (received.length() > 0) {
      Serial.print("[수신] ");
      Serial.println(received);
    }
  }
}
